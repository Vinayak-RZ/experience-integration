import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Block webhook URLs that resolve to private/link-local/metadata addresses. */

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

export function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid webhook URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Webhook URL must be http(s)");
  }
  // Production should prefer https; allow http only for local fixture sinks.
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    throw new Error("Webhook hostname is not allowed");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Webhook IP is private");
    return;
  }
  const records = await lookup(host, { all: true });
  for (const r of records) {
    if (isPrivateIp(r.address)) {
      throw new Error(`Webhook hostname resolves to private address ${r.address}`);
    }
  }
}
