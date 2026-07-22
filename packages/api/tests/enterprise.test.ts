import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateApiKeyMaterial,
  hashApiKeySecret,
  keyHasScope,
  parseBearerApiKey,
} from "../src/public/keys.js";
import { publicOpenApi } from "../src/public/openapi.js";
import { signStandardWebhook, verifyStandardWebhook, webhookHeaders } from "../src/webhooks/sign.js";
import { isPrivateIp } from "../src/webhooks/ssrf.js";
import { sanitizeTelemetry } from "../src/telemetry/sanitize.js";
import {
  POWERBI_MAX_ROWS_PER_REQUEST,
  chunkRows,
  nextCheckpoint,
} from "../src/integrations/powerbi.js";
import { loadEntraConfig, mapEntraSubjectToUser } from "../src/auth/entra.js";

describe("public API keys", () => {
  it("hashes secrets and parses bearer tokens", () => {
    const m = generateApiKeyMaterial();
    assert.match(m.fullKey, /^stk_/);
    assert.equal(hashApiKeySecret(m.fullKey), m.secretHash);
    assert.equal(parseBearerApiKey(`Bearer ${m.fullKey}`), m.fullKey);
    assert.equal(keyHasScope(["alarms:read"], "alarms:read"), true);
    assert.equal(keyHasScope(["alarms:read"], "ledger:read"), false);
    assert.equal(keyHasScope(["*"], "ledger:read"), true);
  });

  it("exposes OpenAPI paths for alarms events ledger", () => {
    assert.equal(publicOpenApi.info.version, "1.0.0");
    assert.ok(publicOpenApi.paths["/alarms"]);
    assert.ok(publicOpenApi.paths["/events"]);
    assert.ok(publicOpenApi.paths["/ledger"]);
  });
});

describe("standard webhooks", () => {
  it("signs and verifies v1 signatures", () => {
    const secret = "whsec_" + Buffer.from("test-secret-bytes-here!!").toString("base64");
    const body = JSON.stringify({ hello: "world" });
    const headers = webhookHeaders({ secret, msgId: "msg_1", body });
    assert.ok(headers["webhook-signature"]?.startsWith("v1,"));
    assert.equal(
      verifyStandardWebhook({
        secret,
        msgId: "msg_1",
        timestamp: headers["webhook-timestamp"]!,
        body,
        signatureHeader: headers["webhook-signature"]!,
      }),
      true,
    );
    assert.equal(
      verifyStandardWebhook({
        secret,
        msgId: "msg_1",
        timestamp: headers["webhook-timestamp"]!,
        body,
        signatureHeader: "v1,deadbeef",
      }),
      false,
    );
    const sig = signStandardWebhook({
      secret,
      msgId: "msg_1",
      timestamp: "1",
      body,
    });
    assert.match(sig, /^v1,/);
  });

  it("detects private IPs for SSRF defense", () => {
    assert.equal(isPrivateIp("127.0.0.1"), true);
    assert.equal(isPrivateIp("10.0.0.2"), true);
    assert.equal(isPrivateIp("172.16.1.1"), true);
    assert.equal(isPrivateIp("8.8.8.8"), false);
  });
});

describe("telemetry allowlist", () => {
  it("accepts allowlisted events and strips PII-like values", () => {
    const ok = sanitizeTelemetry("alarm_ack", {
      route: "alarms",
      email: "a@b.com",
      phone: "9876543210",
      duration_ms: 12,
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.properties.route, "alarms");
      assert.equal(ok.properties.duration_ms, 12);
      assert.equal(ok.properties.email, undefined);
    }
    assert.equal(sanitizeTelemetry("hack_event", {}).ok, false);
  });
});

describe("power bi batching", () => {
  it("chunks at Microsoft row limit and advances checkpoints", () => {
    assert.equal(POWERBI_MAX_ROWS_PER_REQUEST, 10_000);
    const chunks = chunkRows(Array.from({ length: 10_001 }, (_, i) => i));
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0]!.length, 10_000);
    assert.equal(nextCheckpoint("c0", 0, 2), "batch:1:c0");
    assert.equal(nextCheckpoint("c0", 1, 2), "done:c0");
  });
});

describe("entra mapping", () => {
  it("refuses subjects without existing membership", () => {
    assert.deepEqual(mapEntraSubjectToUser({ oid: "x" }), { error: "no_membership" });
    assert.deepEqual(
      mapEntraSubjectToUser({ oid: "x", existingUserId: "u1" }),
      { userId: "u1" },
    );
    const cfg = loadEntraConfig({ ENTRA_ENABLED: "false" });
    assert.equal(cfg.enabled, false);
  });
});
