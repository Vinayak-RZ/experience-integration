import { createHmac, timingSafeEqual } from "node:crypto";

/** Standard Webhooks signing — https://www.standardwebhooks.com/ */

function normalizeSecret(secret: string): Buffer {
  if (secret.startsWith("whsec_")) {
    return Buffer.from(secret.slice("whsec_".length), "base64");
  }
  return Buffer.from(secret, "utf8");
}

function signaturesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function signStandardWebhook(input: {
  secret: string;
  msgId: string;
  timestamp: string;
  body: string;
}): string {
  const key = normalizeSecret(input.secret);
  const toSign = `${input.msgId}.${input.timestamp}.${input.body}`;
  const digest = createHmac("sha256", key).update(toSign, "utf8").digest("base64");
  return `v1,${digest}`;
}

export function verifyStandardWebhook(input: {
  secret: string;
  msgId: string;
  timestamp: string;
  body: string;
  signatureHeader: string;
}): boolean {
  const expected = signStandardWebhook(input);
  const candidates = input.signatureHeader.split(" ").map((s) => s.trim());
  return candidates.some((c) => signaturesEqual(c, expected));
}

export function webhookHeaders(input: {
  secret: string;
  msgId: string;
  body: string;
  now?: Date;
}): Record<string, string> {
  const timestamp = String(Math.floor((input.now ?? new Date()).getTime() / 1000));
  const signature = signStandardWebhook({
    secret: input.secret,
    msgId: input.msgId,
    timestamp,
    body: input.body,
  });
  return {
    "webhook-id": input.msgId,
    "webhook-timestamp": timestamp,
    "webhook-signature": signature,
    "content-type": "application/json",
  };
}
