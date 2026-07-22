import type { NavKey, Role } from "@/lib/types";

export type NavItem = {
  key: NavKey;
  href: string;
  label: string;
  /** Mirrors API route:* permission — fail closed when missing. */
  permission: `route:${string}`;
  tier: "primary" | "reveal";
};

export const NAV_ITEMS: NavItem[] = [
  { key: "today", href: "/", label: "Today", permission: "route:today", tier: "primary" },
  { key: "alarms", href: "/alarms", label: "Alarms", permission: "route:alarms", tier: "primary" },
  {
    key: "prescriptions",
    href: "/prescriptions",
    label: "Prescriptions",
    permission: "route:prescriptions",
    tier: "primary",
  },
  {
    key: "evidence",
    href: "/evidence",
    label: "Evidence",
    permission: "route:evidence",
    tier: "primary",
  },
  {
    key: "analyst",
    href: "/analyst",
    label: "Analyst",
    permission: "route:analyst",
    tier: "primary",
  },
  {
    key: "reports",
    href: "/reports",
    label: "Reports",
    permission: "route:reports",
    tier: "primary",
  },
  {
    key: "energy",
    href: "/energy",
    label: "Energy",
    permission: "route:energy",
    tier: "reveal",
  },
  {
    key: "equipment",
    href: "/equipment",
    label: "Equipment",
    permission: "route:equipment",
    tier: "reveal",
  },
  {
    key: "intensity",
    href: "/intensity",
    label: "Intensity / CO₂",
    permission: "route:intensity",
    tier: "reveal",
  },
  {
    key: "integrations",
    href: "/settings/integrations",
    label: "Integrations",
    permission: "route:integrations",
    tier: "reveal",
  },
  {
    key: "admin",
    href: "/settings/admin",
    label: "Admin",
    permission: "route:admin",
    tier: "reveal",
  },
];

/** Client mirror of API authz route grants — keep in sync with packages/api authz matrix. */
const ROLE_ROUTES: Record<Role, readonly string[]> = {
  operator: [
    "route:today",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
  ],
  supervisor: [
    "route:today",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
  ],
  plant_head: [
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
  ],
  energy_manager: [
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
  ],
  sustainability: [
    "route:today",
    "route:reports",
    "route:ledger",
    "route:intensity",
    "route:evidence",
    "route:analyst",
  ],
  cfo: ["route:today", "route:reports", "route:ledger", "route:analyst"],
  admin: [
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
  ],
};

export function canAccessRoute(role: Role, permission: string): boolean {
  return ROLE_ROUTES[role]?.includes(permission) === true;
}

/** Ops invariants — always primary when the role can access them; never unpin. */
export const OPS_INVARIANTS: readonly NavKey[] = ["alarms", "prescriptions"];

export const NAV_PIN_STORAGE_KEY = "stamped.l6.nav.pins";

export function navForRole(role: Role): {
  primary: NavItem[];
  reveal: NavItem[];
} {
  const allowed = NAV_ITEMS.filter((item) => canAccessRoute(role, item.permission));
  return {
    primary: allowed.filter((i) => i.tier === "primary"),
    reveal: allowed.filter((i) => i.tier === "reveal"),
  };
}

export function isOpsInvariant(key: NavKey): boolean {
  return OPS_INVARIANTS.includes(key);
}

/** Sanitize pins: role-gated, reveal-tier only, never ops invariants. */
export function sanitizePins(role: Role, pins: readonly NavKey[]): NavKey[] {
  const { reveal } = navForRole(role);
  const revealKeys = new Set(reveal.map((i) => i.key));
  const seen = new Set<NavKey>();
  const out: NavKey[] = [];
  for (const key of pins) {
    if (isOpsInvariant(key)) continue;
    if (!revealKeys.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function readPins(storage: Pick<Storage, "getItem"> | null | undefined): NavKey[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(NAV_PIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is NavKey => typeof k === "string") as NavKey[];
  } catch {
    return [];
  }
}

export function writePins(
  storage: Pick<Storage, "setItem"> | null | undefined,
  pins: readonly NavKey[],
): void {
  if (!storage) return;
  storage.setItem(NAV_PIN_STORAGE_KEY, JSON.stringify(pins));
}

/**
 * Progressive reveal with optional pinned tools promoted into primary.
 * Alarms/Prescriptions stay primary whenever the role allows them.
 */
export function composeNav(
  role: Role,
  pins: readonly NavKey[] = [],
): { primary: NavItem[]; reveal: NavItem[] } {
  const base = navForRole(role);
  const clean = sanitizePins(role, pins);
  const pinSet = new Set(clean);
  const pinned = base.reveal.filter((i) => pinSet.has(i.key));
  const remainingReveal = base.reveal.filter((i) => !pinSet.has(i.key));

  // Primary always starts from role primary (includes ops invariants when granted)
  return {
    primary: [...base.primary, ...pinned],
    reveal: remainingReveal,
  };
}

export function togglePin(role: Role, pins: readonly NavKey[], key: NavKey): NavKey[] {
  if (isOpsInvariant(key)) return sanitizePins(role, pins);
  const set = new Set(sanitizePins(role, pins));
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return sanitizePins(role, [...set]);
}

/** Mobile bottom bar — first three primary + More. */
export function mobileDock(role: Role, pins: readonly NavKey[] = []): NavItem[] {
  return composeNav(role, pins).primary.slice(0, 3);
}
