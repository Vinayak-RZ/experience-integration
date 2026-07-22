"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/** Touch / primary CTA floor — design system §7.1 */
export const TOUCH_MIN_PX = 48;

export type StatusTone = "critical" | "warning" | "good" | "neutral" | "info";

/** Charter: never color alone — every tone has a visible English label. */
export const STATUS_LABELS: Record<StatusTone, string> = {
  critical: "Critical",
  warning: "Warning",
  good: "Good",
  neutral: "Neutral",
  info: "Info",
};

const toneBg: Record<StatusTone, string> = {
  critical: "rgba(186, 26, 26, 0.12)",
  warning: "rgba(201, 122, 0, 0.14)",
  good: "rgba(27, 107, 58, 0.12)",
  neutral: "rgba(143, 112, 107, 0.16)",
  info: "rgba(0, 102, 107, 0.12)",
};

const toneFg: Record<StatusTone, string> = {
  critical: "var(--forge-error)",
  warning: "var(--forge-warning)",
  good: "var(--forge-good)",
  neutral: "var(--forge-on-surface-variant)",
  info: "var(--forge-info)",
};

export function StatusChip({
  tone,
  children,
}: {
  tone: StatusTone;
  children?: ReactNode;
}) {
  const label = STATUS_LABELS[tone];
  return (
    <span
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--forge-radius-sm)",
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        background: toneBg[tone],
        color: toneFg[tone],
      }}
    >
      <span>{label}</span>
      {children ? <span>{children}</span> : null}
    </span>
  );
}

export function Panel({
  children,
  style,
  as: Tag = "section",
  role,
  "aria-busy": ariaBusy,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  style?: CSSProperties;
  as?: "section" | "div" | "article";
  role?: string;
  "aria-busy"?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Tag
      role={role}
      aria-busy={ariaBusy}
      aria-label={ariaLabel}
      style={{
        background: "var(--forge-surface-container-lowest)",
        border: "1px solid var(--forge-outline-variant)",
        borderRadius: "var(--forge-radius-lg)",
        padding: 24,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function PageHead({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <div>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--forge-on-surface-variant)",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--forge-font-display)",
            fontSize: "var(--forge-size-headline)",
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
      </div>
      {actions}
    </header>
  );
}

const btnBase: CSSProperties = {
  minHeight: TOUCH_MIN_PX,
  minWidth: TOUCH_MIN_PX,
  padding: "0 18px",
  borderRadius: "var(--forge-radius-md)",
  fontWeight: 700,
  fontSize: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        width: fullWidth ? "100%" : undefined,
        background: disabled ? "var(--forge-outline)" : "var(--forge-primary)",
        color: "var(--forge-on-primary)",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: disabled ? "var(--forge-outline)" : "var(--forge-secondary)",
        color: "var(--forge-on-secondary)",
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid var(--forge-outline-variant)",
        color: "var(--forge-secondary)",
      }}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? hintId : null, error ? errorId : null]
          .filter(Boolean)
          .join(" ") || undefined}
        {...props}
        style={{
          minHeight: TOUCH_MIN_PX,
          padding: "0 12px",
          borderRadius: "var(--forge-radius-md)",
          border: `1px solid ${error ? "var(--forge-error)" : "var(--forge-outline)"}`,
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontWeight: 400,
          fontFamily: "var(--forge-font-body)",
          ...props.style,
        }}
      />
      {hint && !error ? (
        <span id={hintId} style={{ fontWeight: 400, color: "var(--forge-on-surface-variant)" }}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" style={{ fontWeight: 500, color: "var(--forge-error)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  id,
  children,
  ...props
}: {
  label: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <select
        id={fieldId}
        {...props}
        style={{
          minHeight: TOUCH_MIN_PX,
          padding: "0 12px",
          borderRadius: "var(--forge-radius-md)",
          border: "1px solid var(--forge-outline)",
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontFamily: "var(--forge-font-body)",
          ...props.style,
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  id,
  ...props
}: {
  label: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{label}</span>
      <textarea
        id={fieldId}
        {...props}
        style={{
          minHeight: 96,
          padding: 12,
          borderRadius: "var(--forge-radius-md)",
          border: "1px solid var(--forge-outline)",
          background: "var(--forge-surface-container-lowest)",
          color: "var(--forge-on-surface)",
          fontSize: 16,
          fontFamily: "var(--forge-font-body)",
          resize: "vertical",
          ...props.style,
        }}
      />
    </label>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: Array<{ key: string; header: string; align?: "left" | "right" }>;
  rows: Array<Record<string, ReactNode> & { id: string }>;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--forge-font-body)",
          fontSize: 14,
        }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  textAlign: col.align ?? "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--forge-outline-variant)",
                  color: "var(--forge-on-surface-variant)",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 1 ? "rgba(5, 31, 19, 0.02)" : "transparent",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align ?? "left",
                    padding: "12px",
                    borderBottom: "1px solid var(--forge-outline-variant)",
                    fontVariantNumeric: col.align === "right" ? "tabular-nums" : undefined,
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 16,
  label = "Loading",
}: {
  width?: number | string;
  height?: number | string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: "var(--forge-radius-sm)",
        background:
          "linear-gradient(90deg, var(--forge-surface-container) 0%, var(--forge-surface-container-high) 50%, var(--forge-surface-container) 100%)",
        backgroundSize: "200% 100%",
        animation: "forge-skeleton 1.2s ease-in-out infinite",
      }}
    />
  );
}

export function ToastRegion({
  message,
  tone = "neutral",
}: {
  message: string | null;
  tone?: StatusTone;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        minWidth: 240,
        maxWidth: "min(480px, calc(100vw - 32px))",
        padding: "12px 16px",
        borderRadius: "var(--forge-radius-md)",
        background: "var(--forge-inverse-surface)",
        color: "var(--forge-inverse-on-surface)",
        boxShadow: "var(--forge-shadow-panel)",
        fontWeight: 600,
        fontSize: 14,
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <StatusChip tone={tone} />
      <span>{message}</span>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(25, 28, 26, 0.4)",
      }}
    >
      <button
        type="button"
        aria-label="Close sheet backdrop"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, border: "none", background: "transparent" }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          height: "100%",
          background: "var(--forge-surface-container-lowest)",
          boxShadow: "var(--forge-shadow-sheet)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "forge-sheet-in var(--forge-motion-base) var(--forge-ease)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: "var(--forge-font-display)",
              fontSize: "var(--forge-size-title)",
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              ...btnBase,
              background: "transparent",
              border: "1px solid var(--forge-outline-variant)",
              color: "var(--forge-secondary)",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
      </aside>
    </div>
  );
}
