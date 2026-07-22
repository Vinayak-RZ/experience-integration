/**
 * Microsoft Entra (OIDC) organization sign-in — configuration contract.
 * Better Auth generic OAuth wires when ENTRA_ENABLED=true; membership mapping
 * remains L6-owned (existing membership required).
 */

export type EntraConfig = {
  enabled: boolean;
  tenantId: string | null;
  clientId: string | null;
  clientSecretSet: boolean;
  issuer: string | null;
  authorizationUrl: string | null;
  tokenUrl: string | null;
  jwksUrl: string | null;
};

export function loadEntraConfig(env: NodeJS.ProcessEnv = process.env): EntraConfig {
  const enabled = env.ENTRA_ENABLED === "true";
  const tenantId = env.ENTRA_TENANT_ID ?? null;
  const clientId = env.ENTRA_CLIENT_ID ?? null;
  const base = tenantId
    ? `https://login.microsoftonline.com/${tenantId}/v2.0`
    : null;
  return {
    enabled,
    tenantId,
    clientId,
    clientSecretSet: Boolean(env.ENTRA_CLIENT_SECRET),
    issuer: base,
    authorizationUrl: base ? `${base}/oauth2/v2.0/authorize` : null,
    tokenUrl: base ? `${base}/oauth2/v2.0/token` : null,
    jwksUrl: base ? `${base}/discovery/v2.0/keys` : null,
  };
}

/** Fake IdP claims mapper for tests — never invents membership. */
export function mapEntraSubjectToUser(input: {
  oid: string;
  email?: string;
  existingUserId?: string;
}): { userId: string } | { error: "no_membership" } {
  if (!input.existingUserId) return { error: "no_membership" };
  return { userId: input.existingUserId };
}
