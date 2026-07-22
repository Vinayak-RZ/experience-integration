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

/** Mobile bottom bar — first three primary + More. */
export function mobileDock(role: Role): NavItem[] {
  return navForRole(role).primary.slice(0, 3);
}
