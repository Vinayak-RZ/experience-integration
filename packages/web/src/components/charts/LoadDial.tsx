/**
 * Industrial-style sweep dial (≈250° arc) with tick marks, colored
 * load zones, and a needle — adapted from stamped-energy-dashboard.
 */
const START = 145;
const SWEEP = 250;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function LoadDial({
  loadPct,
  value,
  max = 120,
  size = 118,
  label,
  unit = "%",
}: {
  /** Legacy prop — same as `value`. */
  loadPct?: number;
  value?: number;
  max?: number;
  size?: number;
  label: string;
  unit?: string;
}) {
  const raw = value ?? loadPct ?? 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const pct = Math.max(0, Math.min(1, raw / max));
  const angle = START + SWEEP * pct;

  const zNormal = 85 / max;
  const zWarn = 100 / max;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = START + (SWEEP * i) / 10;
    const [ox, oy] = polar(cx, cy, r, a);
    const [ix, iy] = polar(cx, cy, r - (i % 5 === 0 ? 10 : 6), a);
    return { ox, oy, ix, iy, major: i % 5 === 0 };
  });

  const [nx, ny] = polar(cx, cy, r - 14, angle);

  const valueColor =
    raw > 100 ? "var(--forge-error)" : raw > 85 ? "var(--forge-warning)" : "var(--forge-tertiary)";

  return (
    <div
      role="img"
      aria-label={`${label} load ${Math.round(raw)} percent`}
      style={{ width: size, textAlign: "center" }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <path
          d={arcPath(cx, cy, r, START, START + SWEEP * zNormal)}
          fill="none"
          stroke="var(--forge-tertiary)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.55}
        />
        <path
          d={arcPath(cx, cy, r, START + SWEEP * zNormal, START + SWEEP * zWarn)}
          fill="none"
          stroke="var(--forge-warning)"
          strokeWidth={5}
          opacity={0.55}
        />
        <path
          d={arcPath(cx, cy, r, START + SWEEP * zWarn, START + SWEEP)}
          fill="none"
          stroke="var(--forge-error)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.7}
        />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.ox}
            y1={t.oy}
            x2={t.ix}
            y2={t.iy}
            stroke="var(--forge-outline)"
            strokeWidth={t.major ? 1.4 : 0.8}
            opacity={0.7}
          />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={valueColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--forge-secondary)" />
        <circle cx={cx} cy={cy} r={2} fill={valueColor} />
        <text
          x={cx}
          y={cy + r * 0.55}
          textAnchor="middle"
          fontFamily="var(--forge-font-display)"
          fontWeight={800}
          fontSize={size * 0.18}
          fill={valueColor}
        >
          {Math.round(raw)}
          <tspan fontSize={size * 0.1} dx={1}>
            {unit}
          </tspan>
        </text>
        {label ? (
          <text
            x={cx}
            y={cy + r * 0.78}
            textAnchor="middle"
            fontFamily="var(--forge-font-body)"
            fontWeight={600}
            fontSize={size * 0.085}
            fill="var(--forge-on-surface-variant)"
            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
