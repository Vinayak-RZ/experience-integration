/** Paths that must never appear in logs or audit metadata. */
const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "token",
  "authorization",
  "cookie",
  "secret",
  "backupCodes",
  "totpURI",
]);

export function redactSensitive(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 6) return "[Truncated]";
  if (Array.isArray(value)) {
    return value.map((v) => redactSensitive(v, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactSensitive(nested, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function isTrustedOrigin(
  origin: string | undefined,
  trusted: readonly string[],
): boolean {
  if (!origin) return false;
  return trusted.includes(origin);
}
