/** Shared upstream HTTP helper — timeout, JSON, problem+json surfacing. */

export class UpstreamError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export type UpstreamRequest = {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs: number;
  /** Required for mutating alarm lifecycle calls. */
  idempotencyKey?: string;
};

export async function upstreamFetch<T>(req: UpstreamRequest): Promise<T> {
  const url = new URL(req.path, req.baseUrl.endsWith("/") ? req.baseUrl : `${req.baseUrl}/`);
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    ...req.headers,
  };
  if (req.body !== undefined) headers["content-type"] = "application/json";
  if (req.idempotencyKey) headers["idempotency-key"] = req.idempotencyKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs);
  try {
    const res = await fetch(url, {
      method: req.method ?? "GET",
      headers,
      body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    const payload = text ? safeJson(text) : null;
    if (!res.ok) {
      throw new UpstreamError(
        problemCode(payload) ?? `UPSTREAM_${res.status}`,
        problemDetail(payload) ?? `Upstream ${res.status} for ${req.path}`,
        res.status,
        payload,
      );
    }
    return payload as T;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new UpstreamError("UPSTREAM_TIMEOUT", `Timed out calling ${req.path}`, 504);
    }
    throw new UpstreamError(
      "UPSTREAM_NETWORK",
      err instanceof Error ? err.message : "Upstream network failure",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function problemCode(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = (payload as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function problemDetail(payload: unknown): string | undefined {
  if (payload && typeof payload === "object") {
    const p = payload as { detail?: unknown; title?: unknown; message?: unknown };
    if (typeof p.detail === "string") return p.detail;
    if (typeof p.title === "string") return p.title;
    if (typeof p.message === "string") return p.message;
  }
  return undefined;
}
