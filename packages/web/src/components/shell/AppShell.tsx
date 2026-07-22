"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConnectionStatus, NavKey, Role } from "@/lib/types";
import {
  composeNav,
  mobileDock,
  readPins,
  togglePin,
  writePins,
} from "@/lib/navigation";
import { GhostButton, PrimaryButton, Sheet } from "@/components/ui/primitives";
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
  const [revealed, setRevealed] = useState(false);
  const [analystOpen, setAnalystOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pins, setPins] = useState<NavKey[]>([]);
  const askAnalystRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setPins(readPins(typeof window !== "undefined" ? window.localStorage : null));
  }, []);

  const { primary, reveal } = useMemo(() => composeNav(role, pins), [role, pins]);
  const dock = useMemo(() => mobileDock(role, pins), [role, pins]);
  const sse = useMemo(() => sseMeta(connection), [connection]);

  function onTogglePin(key: NavKey) {
    const next = togglePin(role, pins, key);
    setPins(next);
    writePins(typeof window !== "undefined" ? window.localStorage : null, next);
  }

  const navLinks = (items: typeof primary, revealStyle = false) =>
    items.map((item) => (
      <div
        key={item.key}
        style={{ display: "flex", alignItems: "center", gap: 4 }}
      >
        <Link
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={
            revealStyle
              ? "forge-shell__nav-link forge-shell__nav-link--reveal"
              : "forge-shell__nav-link"
          }
          style={{ flex: 1 }}
          onClick={() => setMobileNavOpen(false)}
        >
          <span>{item.label}</span>
          {item.key === "alarms" && criticalAlarmCount > 0 ? (
            <span className="tabular" aria-label={`${criticalAlarmCount} critical`}>
              {criticalAlarmCount}
            </span>
          ) : null}
        </Link>
        {revealStyle ? (
          <button
            type="button"
            aria-label={`Pin ${item.label} to primary nav`}
            onClick={() => onTogglePin(item.key)}
            style={{
              minHeight: 44,
              minWidth: 44,
              borderRadius: 8,
              border: "1px solid var(--forge-outline-variant)",
              background: "transparent",
              color: "var(--forge-secondary)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Pin
          </button>
        ) : pins.includes(item.key) ? (
          <button
            type="button"
            aria-label={`Unpin ${item.label}`}
            onClick={() => onTogglePin(item.key)}
            style={{
              minHeight: 44,
              minWidth: 44,
              borderRadius: 8,
              border: "1px solid var(--forge-outline-variant)",
              background: "transparent",
              color: "var(--forge-on-surface-variant)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Unpin
          </button>
        ) : null}
      </div>
    ));

  return (
    <div className="forge-shell" data-breakpoint-desktop="900px">
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
            style={{
              minHeight: 48,
              minWidth: 48,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.35)",
              color: "#fff",
              background: "transparent",
              fontWeight: 700,
            }}
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
          {navLinks(primary)}
          {reveal.length > 0 ? (
            <>
              <GhostButton onClick={() => setRevealed((v) => !v)}>
                {revealed ? "Hide tools" : "More tools"}
              </GhostButton>
              {revealed ? navLinks(reveal, true) : null}
            </>
          ) : null}
          <p
            style={{
              marginTop: "auto",
              fontSize: 11,
              color: "var(--forge-on-surface-variant)",
            }}
          >
            Role: {role.replaceAll("_", " ")}
          </p>
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
        {dock.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={() => setMobileNavOpen(true)}>
          More
        </button>
      </nav>

      <Sheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigate"
      >
        <nav aria-label="Mobile full" style={{ display: "grid", gap: 4 }}>
          {navLinks(primary)}
          {reveal.length > 0 ? (
            <>
              <p
                style={{
                  margin: "12px 0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--forge-on-surface-variant)",
                }}
              >
                More tools
              </p>
              {navLinks(reveal, true)}
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
