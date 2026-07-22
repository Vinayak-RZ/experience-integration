import { RoleSchema, type Role } from "@stamped/l6-contracts";

/** Resources and actions L6 services may authorize. */
export const PermissionSchema = [
  "route:today",
  "route:alarms",
  "route:prescriptions",
  "route:evidence",
  "route:analyst",
  "route:reports",
  "route:ledger",
  "route:energy",
  "route:equipment",
  "route:intensity",
  "route:integrations",
  "route:admin",
  "alarm:read",
  "alarm:ack",
  "alarm:escalate",
  "alarm:silence",
  "prescription:read",
  "prescription:act",
  "ledger:read",
  "report:export",
  "admin:users",
  "admin:integrations",
  "plant:switch",
] as const;

export type Permission = (typeof PermissionSchema)[number];

const ALL_ROUTES: Permission[] = [
  "route:today",
  "route:alarms",
  "route:prescriptions",
  "route:evidence",
  "route:analyst",
  "route:reports",
  "route:ledger",
  "route:energy",
  "route:equipment",
  "route:intensity",
];

/** Charter-derived matrix — fail closed for unknown roles/permissions. */
const MATRIX: Record<Role, readonly Permission[]> = {
  operator: [
    "route:today",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "alarm:read",
    "alarm:ack",
    "alarm:escalate",
    "alarm:silence",
    "prescription:read",
    "prescription:act",
    "plant:switch",
  ],
  supervisor: [
    "route:today",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
    "alarm:read",
    "alarm:ack",
    "alarm:escalate",
    "alarm:silence",
    "prescription:read",
    "prescription:act",
    "report:export",
    "plant:switch",
  ],
  plant_head: [
    ...ALL_ROUTES,
    "alarm:read",
    "alarm:ack",
    "alarm:escalate",
    "alarm:silence",
    "prescription:read",
    "prescription:act",
    "ledger:read",
    "report:export",
    "plant:switch",
  ],
  energy_manager: [
    ...ALL_ROUTES,
    "alarm:read",
    "prescription:read",
    "ledger:read",
    "report:export",
    "plant:switch",
  ],
  sustainability: [
    "route:today",
    "route:reports",
    "route:ledger",
    "route:intensity",
    "route:evidence",
    "route:analyst",
    "ledger:read",
    "report:export",
    "plant:switch",
  ],
  cfo: [
    "route:today",
    "route:reports",
    "route:ledger",
    "route:analyst",
    "ledger:read",
    "report:export",
    "plant:switch",
  ],
  admin: [
    ...ALL_ROUTES,
    "route:integrations",
    "route:admin",
    "alarm:read",
    "alarm:ack",
    "alarm:escalate",
    "alarm:silence",
    "prescription:read",
    "prescription:act",
    "ledger:read",
    "report:export",
    "admin:users",
    "admin:integrations",
    "plant:switch",
  ],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return MATRIX[role];
}

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) === true;
}

export class AuthzError extends Error {
  readonly statusCode = 403;
  readonly code = "AUTHZ_FORBIDDEN";

  constructor(
    readonly role: string,
    readonly permission: Permission,
  ) {
    super(`Role ${role} lacks permission ${permission}`);
    this.name = "AuthzError";
  }
}

/** Fail-closed guard — unknown role or missing permission throws. */
export function requirePermission(
  role: string,
  permission: Permission,
): Role {
  const parsed = RoleSchema.safeParse(role);
  if (!parsed.success) {
    throw new AuthzError(role, permission);
  }
  if (!can(parsed.data, permission)) {
    throw new AuthzError(parsed.data, permission);
  }
  return parsed.data;
}

/** Every role × every permission — used by matrix tests. */
export function matrixEntries(): Array<{
  role: Role;
  permission: Permission;
  allowed: boolean;
}> {
  const roles = RoleSchema.options;
  const out: Array<{ role: Role; permission: Permission; allowed: boolean }> =
    [];
  for (const role of roles) {
    for (const permission of PermissionSchema) {
      out.push({ role, permission, allowed: can(role, permission) });
    }
  }
  return out;
}
