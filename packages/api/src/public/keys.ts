import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const API_KEY_SCOPES = [
  "alarms:read",
  "prescriptions:read",
  "ledger:read",
  "events:read",
  "reports:read",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export function hashApiKeySecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function generateApiKeyMaterial(): {
  prefix: string;
  secret: string;
  fullKey: string;
  secretHash: string;
} {
  const prefix = `stk_${randomBytes(6).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  const fullKey = `${prefix}.${secret}`;
  return {
    prefix,
    secret,
    fullKey,
    secretHash: hashApiKeySecret(fullKey),
  };
}

export function parseBearerApiKey(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function keyHasScope(
  scopes: readonly string[],
  required: ApiKeyScope,
): boolean {
  return scopes.includes(required) || scopes.includes("*");
}
