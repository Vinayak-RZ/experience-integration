import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import { loadEnv } from "../src/config.js";
import { UpstreamError } from "../src/upstream/http.js";
import {
  L2QueryClient,
  assertGranularityWindow,
  assertNoL2DatabaseUrl,
} from "../src/upstream/l2/client.js";

function createMockL2() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.headers["x-org-id"] !== "org_demo" || req.headers["x-service-key"] !== "svc-test") {
      return send(403, { code: "FORBIDDEN", detail: "bad tenancy headers" });
    }

    const meas = url.pathname.match(/^\/v1\/plants\/([^/]+)\/measurements$/);
    if (req.method === "GET" && meas) {
      if (url.searchParams.get("plant_id") === "foreign") {
        return send(404, { code: "NOT_FOUND", detail: "plant" });
      }
      return send(200, {
        org_id: "org_demo",
        plant_id: meas[1],
        asset_id: url.searchParams.get("asset_id"),
        metric: url.searchParams.get("metric"),
        granularity: url.searchParams.get("granularity") ?? "15min",
        points: [{ ts: "2026-07-01T00:00:00Z", value: 100, quality: 0 }],
      });
    }

    const assets = url.pathname.match(/^\/v1\/plants\/([^/]+)\/assets$/);
    if (req.method === "GET" && assets) {
      return send(200, {
        items: [
          {
            asset_id: "kiln_1",
            name: "Kiln 1",
            level: "feeder",
            asset_class: "process",
          },
        ],
      });
    }

    if (req.method === "GET" && url.pathname === "/v1/ledger/entries") {
      return send(200, { items: [], next_cursor: null });
    }

    send(404, { code: "NOT_FOUND", detail: url.pathname });
  });

  return {
    async listen(): Promise<string> {
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      return `http://127.0.0.1:${addr.port}`;
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

describe("L2QueryClient", () => {
  const mock = createMockL2();
  let baseUrl = "";

  before(async () => {
    baseUrl = await mock.listen();
  });

  after(async () => {
    await mock.close();
  });

  function client(features = { ledgerEntries: false, baselines: false }) {
    return new L2QueryClient({
      baseUrl,
      timeoutMs: 2_000,
      orgId: "org_demo",
      serviceKey: "svc-test",
      features,
    });
  }

  it("reads measurements with tenancy headers", async () => {
    const data = await client().listMeasurements({
      plantId: "plant_jaipur_01",
      assetId: "kiln_1",
      metric: "active_power_kw",
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-02T00:00:00Z",
      granularity: "15min",
    });
    assert.equal(data.points.length, 1);
    assert.equal(data.plant_id, "plant_jaipur_01");
  });

  it("enforces granularity window caps", () => {
    assert.throws(
      () =>
        assertGranularityWindow(
          "raw",
          "2026-01-01T00:00:00Z",
          "2026-02-01T00:00:00Z",
        ),
      (err: unknown) =>
        err instanceof UpstreamError && err.code === "GRANULARITY_WINDOW_EXCEEDED",
    );
  });

  it("feature-gates ledger and baseline gaps", async () => {
    await assert.rejects(
      () => client().listLedgerEntries({ plantId: "plant_jaipur_01" }),
      (err: unknown) =>
        err instanceof UpstreamError && err.code === "UPSTREAM_FEATURE_UNAVAILABLE",
    );
    await assert.rejects(
      () => client().getBaseline("bl_1"),
      (err: unknown) =>
        err instanceof UpstreamError && err.status === 501,
    );
  });

  it("returns honest partial evidence when baseline is gated", async () => {
    const bundle = await client().loadEvidenceBundle({
      plantId: "plant_jaipur_01",
      assetId: "kiln_1",
      metric: "active_power_kw",
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-02T00:00:00Z",
      baselineId: "bl_1",
    });
    assert.equal(bundle.measurements.ok, true);
    assert.equal(bundle.assets.ok, true);
    assert.equal(bundle.baseline.ok, false);
    assert.ok(bundle.missing.includes("baseline"));
  });

  it("rejects foreign org service key at the boundary", async () => {
    const bad = new L2QueryClient({
      baseUrl,
      timeoutMs: 2_000,
      orgId: "org_other",
      serviceKey: "wrong",
      features: { ledgerEntries: false, baselines: false },
    });
    await assert.rejects(
      () =>
        bad.listAssets("plant_jaipur_01"),
      (err: unknown) => err instanceof UpstreamError && err.status === 403,
    );
  });

  it("refuses L2_DATABASE_URL in env loaders", () => {
    assert.throws(
      () => assertNoL2DatabaseUrl({ L2_DATABASE_URL: "postgres://nope" }),
      /forbidden/,
    );
    assert.throws(
      () =>
        loadEnv({
          BETTER_AUTH_SECRET: "dev-only-stamped-l6-auth-secret-change-me",
          L2_DATABASE_URL: "postgres://nope",
        } as NodeJS.ProcessEnv),
      /L2_DATABASE_URL/,
    );
  });
});
