"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  composeNav,
  mobileDock,
  readCollapsed,
  readPins,
  writeCollapsed,
} from "@/lib/navigation";
import { NAV_ICONS } from "@/lib/nav-icons";
import {
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
} from "@/components/ui/icons";
import type { ConnectionStatus, NavKey, Role } from "@/lib/types";
import { PrimaryButton, Sheet } from "@/components/ui/primitives";
import { ContextualAnalyst } from "@/components/analyst/ContextualAnalyst";
import { WebVitalsReporter } from "@/components/telemetry/WebVitalsReporter";

function sseMeta(connection: ConnectionStatus): {
  label: string;
  live: boolean;
  banner: string | null;
} {
  if (connection.sse === "live") {
    return { label: "Live", live: true, banner: null };
  }
  if (connection.sse === "reconnecting") {
    return {
      label: "Reconnecting",
      live: false,
      banner:
        "Live updates paused — reconnecting. Actions still work; lists may be stale.",
    };
  }
  return {
    label: "Offline",
    live: false,
    banner:
      "Live updates offline. Actions still work; lists may be stale until the stream returns.",
  };
}

export function AppShell({
  active,
  plantName,
  role,
  connection,
  screenTitle,
  contextSummary,
  focusEntity,
  criticalAlarmCount,
  children,
}: {
  active: NavKey;
  plantName: string;
  role: Role;
  connection: ConnectionStatus;
  screenTitle: string;
  contextSummary: string[];
  focusEntity?: {
    type: "alarm" | "prescription" | "asset" | "ledger_entry";
    id: string;
  };
  criticalAlarmCount: number;
  children: React.ReactNode;
}) {
  const [analystOpen, setAnalystOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pins, setPins] = useState<NavKey[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const askAnalystRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    setPins(readPins(storage));
    setCollapsed(readCollapsed(storage));
  }, []);

  const { primary, reveal } = useMemo(() => composeNav(role, pins), [role, pins]);
  const dock = useMemo(() => mobileDock(role, pins), [role, pins]);
  const sse = useMemo(() => sseMeta(connection), [connection]);

  function onToggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    writeCollapsed(typeof window !== "undefined" ? window.localStorage : null, next);
  }

  const navLinks = (items: typeof primary) =>
    items.map((item) => {
      const Icon = NAV_ICONS[item.key];
      const isActive = active === item.key;
      return (
        <Link
          key={item.key}
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          title={item.label}
          className="forge-shell__nav-link"
          onClick={() => setMobileNavOpen(false)}
        >
          <Icon size={18} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
          {!collapsed ? (
            <span className="forge-shell__nav-label">{item.label}</span>
          ) : null}
          {!collapsed && item.key === "alarms" && criticalAlarmCount > 0 ? (
            <span className="tabular forge-shell__nav-badge" aria-label={`${criticalAlarmCount} critical`}>
              {criticalAlarmCount}
            </span>
          ) : null}
        </Link>
      );
    });

  return (
    <div
      className={`forge-shell${collapsed ? " forge-shell--collapsed" : ""}`}
      data-breakpoint-desktop="900px"
    >
      <WebVitalsReporter plantId="plant_jaipur_01" role={role} />
      <a className="forge-shell__skip" href="#forge-main">
        Skip to main content
      </a>

      <header className="forge-shell__topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="forge-shell__menu-btn"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            Menu
          </button>
          <strong className="forge-shell__brand">Stamped Energy</strong>
          <span className="forge-shell__plant">{plantName}</span>
          <span
            aria-live="polite"
            className={`forge-shell__sse ${sse.live ? "forge-shell__sse--live" : "forge-shell__sse--warn"}`}
          >
            SSE {sse.label}
          </span>
        </div>
        <span ref={askAnalystRef} tabIndex={-1} style={{ display: "inline-flex" }}>
          <PrimaryButton onClick={() => setAnalystOpen(true)}>Ask Analyst</PrimaryButton>
        </span>
      </header>

      <div className="forge-shell__body">
        <nav
          aria-label="Primary"
          className="forge-shell__sidebar"
          data-shell="desktop-nav"
        >
          {!collapsed ? (
            <div className="forge-shell__facility">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Factory size={18} color="var(--forge-primary)" aria-hidden />
                <span className="forge-shell__facility-name">
                  {plantName.split(",")[0] ?? plantName}
                </span>
              </div>
              <p className="forge-shell__facility-meta">{plantName}</p>
              <span className="forge-chip forge-chip--primary" style={{ marginTop: 8 }}>
                115 MW Peak Load
              </span>
            </div>
          ) : null}

          <div className="forge-shell__nav-scroll forge-scroll-thin">
            {navLinks(primary)}
            {reveal.length > 0 && !collapsed ? (
              <div className="forge-shell__reveal">
                <p className="forge-eyebrow" style={{ margin: "12px 4px 6px" }}>
                  More
                </p>
                {navLinks(reveal)}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="forge-shell__collapse"
            aria-label={collapsed ? "Expand navigation" : "Minimize navigation"}
            aria-pressed={collapsed}
            onClick={onToggleCollapse}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>Minimize</span> : null}
          </button>

          {!collapsed ? (
            <p className="forge-shell__role">Role: {role.replaceAll("_", " ")}</p>
          ) : null}
        </nav>

        <main id="forge-main" className="forge-shell__main" tabIndex={-1}>
          {sse.banner ? (
            <div role="status" className="forge-shell__banner">
              {sse.banner}
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <nav aria-label="Mobile primary" className="forge-shell__dock" data-shell="mobile-dock">
        {dock.map((item) => {
          const Icon = NAV_ICONS[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
            >
              <Icon size={16} aria-hidden />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <Link href="/tools">
          <span>Tools</span>
        </Link>
      </nav>

      <Sheet open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigate">
        <nav aria-label="Mobile full" style={{ display: "grid", gap: 4 }}>
          {navLinks(primary)}
          {reveal.length > 0 ? (
            <>
              <p className="forge-eyebrow" style={{ margin: "12px 0 4px" }}>
                More
              </p>
              {navLinks(reveal)}
            </>
          ) : null}
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Role: {role.replaceAll("_", " ")} · {plantName}
          </p>
        </nav>
      </Sheet>

      <ContextualAnalyst
        open={analystOpen}
        onClose={() => setAnalystOpen(false)}
        returnFocusRef={askAnalystRef}
        envelope={{
          orgId: "org_demo",
          plantId: "plant_jaipur_01",
          userId: "user_demo",
          role,
          routeId: active,
          screenTitle,
          focusEntity,
          visibleSummary: contextSummary,
        }}
      />
    </div>
  );
}
