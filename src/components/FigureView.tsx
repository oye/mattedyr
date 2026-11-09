/** Draws the simple figures that come with some questions (not to scale). */
import { useId } from "react";
import { fmt, gcd } from "../engine/format";
import type { Figure, MarbleColor, SideLabels } from "../engine/types";

export function FigureView({ figure }: { figure: Figure }) {
  switch (figure.type) {
    case "rect":
      return <RectFigure f={figure} />;
    case "right-triangle":
      return <TriangleFigure f={figure} />;
    case "graph":
      return <GraphFigure f={figure} />;
    case "marbles":
      return <MarblesFigure f={figure} />;
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Fits a shape with the given proportions into a box. Extreme proportions are softened so thin shapes stay visible. */
function fit(w: number, h: number, boxW: number, boxH: number) {
  const real = w / h;
  const ratio = clamp(real, 0.6, 2.6);
  const [dw, dh] = ratio > boxW / boxH ? [boxW, boxW / ratio] : [boxH * ratio, boxH];
  return { dw, dh, exact: ratio === real };
}

function Label({ x, y, text, anchor = "middle" }: { x: number; y: number; text?: string; anchor?: "start" | "middle" | "end" }) {
  if (!text) return null;
  const unknown = text === "?";
  return (
    <text x={x} y={y} textAnchor={anchor} className={unknown ? "fig-label fig-unknown" : "fig-label"}>
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Rectangle / square
// ---------------------------------------------------------------------------
function RectFigure({ f }: { f: Extract<Figure, { type: "rect" }> }) {
  const { dw, dh, exact } = fit(f.w, f.h, 180, 105);
  const x0 = 172 - dw / 2;
  const y0 = 14 + (105 - dh) / 2;
  const labels: SideLabels = f.labels ?? {};
  const grid = f.shade && exact && Number.isInteger(f.w) && Number.isInteger(f.h) && f.w * f.h <= 100;
  const tick = 7;
  const desc = [labels.bottom && `grunnlinje ${labels.bottom}`, labels.left && `høyde ${labels.left}`, f.center]
    .filter(Boolean)
    .join(", ");

  return (
    <svg className="figure" viewBox="0 0 300 160" role="img" aria-label={`Figur: ${f.equalSides ? "kvadrat" : "rektangel"}${desc ? `, ${desc}` : ""}`}>
      <rect x={x0} y={y0} width={dw} height={dh} className={f.shade ? "fig-shade" : "fig-empty"} />
      {grid && (
        <g className="fig-grid">
          {Array.from({ length: f.w - 1 }, (_, i) => {
            const x = x0 + ((i + 1) * dw) / f.w;
            return <line key={`v${i}`} x1={x} y1={y0} x2={x} y2={y0 + dh} />;
          })}
          {Array.from({ length: f.h - 1 }, (_, i) => {
            const y = y0 + ((i + 1) * dh) / f.h;
            return <line key={`h${i}`} x1={x0} y1={y} x2={x0 + dw} y2={y} />;
          })}
        </g>
      )}
      <rect x={x0} y={y0} width={dw} height={dh} className="fig-line" />
      {f.equalSides && (
        <g className="fig-line">
          <line x1={x0 + dw / 2} y1={y0 - tick} x2={x0 + dw / 2} y2={y0 + tick} />
          <line x1={x0 + dw / 2} y1={y0 + dh - tick} x2={x0 + dw / 2} y2={y0 + dh + tick} />
          <line x1={x0 - tick} y1={y0 + dh / 2} x2={x0 + tick} y2={y0 + dh / 2} />
          <line x1={x0 + dw - tick} y1={y0 + dh / 2} x2={x0 + dw + tick} y2={y0 + dh / 2} />
        </g>
      )}
      <Label x={x0 + dw / 2} y={y0 + dh + 25} text={labels.bottom} />
      <Label x={x0 + dw / 2} y={y0 - 10} text={labels.top} />
      <Label x={x0 - 12} y={y0 + dh / 2 + 6} text={labels.left} anchor="end" />
      <Label x={x0 + dw + 12} y={y0 + dh / 2 + 6} text={labels.right} anchor="start" />
      {f.center && <CenterLabel x={x0 + dw / 2} y={y0 + dh / 2} text={f.center} narrow={dw < 110} />}
    </svg>
  );
}

/** Text in the middle of a shape. On narrow shapes "A = 48 cm²" is split into "A =" / "48 cm²". */
function CenterLabel({ x, y, text, narrow }: { x: number; y: number; text: string; narrow: boolean }) {
  const parts = text.split(" = ");
  if (!narrow || parts.length !== 2) {
    return (
      <text x={x} y={y + 6} textAnchor="middle" className="fig-label fig-center">
        {text}
      </text>
    );
  }
  return (
    <text x={x} y={y - 3} textAnchor="middle" className="fig-label fig-center">
      <tspan x={x}>{parts[0]} =</tspan>
      <tspan x={x} dy={19}>
        {parts[1]}
      </tspan>
    </text>
  );
}

// ---------------------------------------------------------------------------
// Right-angled triangle (right angle bottom left)
// ---------------------------------------------------------------------------
function TriangleFigure({ f }: { f: Extract<Figure, { type: "right-triangle" }> }) {
  const { dw, dh } = fit(f.a, f.b, 170, 112);
  const x0 = 160 - dw / 2;
  const y0 = 12 + (112 - dh) / 2;
  const bottom = y0 + dh;
  const m = 14; // right-angle marker
  // Label for the hypotenuse: outside the triangle, perpendicular to the middle of the side.
  const len = Math.hypot(dw, dh);
  const cx = x0 + dw / 2 + (16 * dh) / len;
  const cy = y0 + dh / 2 - (16 * dw) / len;
  const { a, b, c } = f.labels;
  return (
    <svg
      className="figure"
      viewBox="0 0 300 160"
      role="img"
      aria-label={`Figur: rettvinklet trekant. Kateter ${a ?? ""} og ${b ?? ""}, hypotenus ${c ?? ""}`}
    >
      <path d={`M${x0} ${y0} L${x0} ${bottom} L${x0 + dw} ${bottom} Z`} className="fig-shade fig-line" />
      <path d={`M${x0} ${bottom - m} h${m} v${m}`} className="fig-line fig-thin" />
      <Label x={x0 + dw / 2} y={bottom + 25} text={a} />
      <Label x={x0 - 12} y={y0 + dh / 2 + 6} text={b} anchor="end" />
      <Label x={cx} y={cy + 6} text={c} anchor="start" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Coordinate system with straight lines
// ---------------------------------------------------------------------------
function GraphFigure({ f }: { f: Extract<Figure, { type: "graph" }> }) {
  const clipId = useId();
  const R = f.range;
  const S = 200;
  const pad = 12;
  const u = S / (2 * R);
  const X = (x: number) => pad + S / 2 + x * u;
  const Y = (y: number) => pad + S / 2 - y * u;
  const units = Array.from({ length: 2 * R + 1 }, (_, i) => i - R);
  const size = S + 2 * pad;

  return (
    <svg className="figure figure-graph" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Figur: koordinatsystem med en rett linje">
      <defs>
        <clipPath id={clipId}>
          <rect x={pad} y={pad} width={S} height={S} />
        </clipPath>
      </defs>
      <g className="fig-grid">
        {units.map((i) => (
          <g key={i}>
            <line x1={X(i)} y1={Y(-R)} x2={X(i)} y2={Y(R)} />
            <line x1={X(-R)} y1={Y(i)} x2={X(R)} y2={Y(i)} />
          </g>
        ))}
      </g>
      <g className="fig-axis">
        <line x1={X(-R)} y1={Y(0)} x2={X(R) + 6} y2={Y(0)} />
        <line x1={X(0)} y1={Y(-R)} x2={X(0)} y2={Y(R) - 6} />
        <path d={`M${X(R) + 8} ${Y(0)} l-8 -4 v8 Z`} />
        <path d={`M${X(0)} ${Y(R) - 8} l-4 8 h8 Z`} />
      </g>
      <g className="fig-ticks">
        {units
          .filter((i) => i !== 0 && i % 2 === 0)
          .map((i) => (
            <g key={i}>
              <text x={X(i)} y={Y(0) + 13} textAnchor="middle">
                {fmt(i)}
              </text>
              <text x={X(0) - 5} y={Y(i) + 4} textAnchor="end">
                {fmt(i)}
              </text>
            </g>
          ))}
        <text x={X(R) - 2} y={Y(0) - 6} textAnchor="end" className="fig-axis-name">
          x
        </text>
        <text x={X(0) + 7} y={Y(R) + 8} className="fig-axis-name">
          y
        </text>
      </g>
      <g clipPath={`url(#${clipId})`}>
        {f.lines.map((l, i) => (
          <line key={i} x1={X(-R - 1)} y1={Y(l.a * (-R - 1) + l.b)} x2={X(R + 1)} y2={Y(l.a * (R + 1) + l.b)} className="fig-plot" />
        ))}
      </g>
      {f.points?.map(([x, y], i) => (
        <circle key={i} cx={X(x)} cy={Y(y)} r={4.5} className="fig-point" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Marbles in a bag/jar
// ---------------------------------------------------------------------------
const MARBLE_COLORS: Record<MarbleColor, string> = {
  rod: "#ff5c7a",
  bla: "#4aa8ff",
  gronn: "#4cc38a",
  gul: "#ffd93b",
};
const MARBLE_NAMES: Record<MarbleColor, string> = { rod: "røde", bla: "blå", gronn: "grønne", gul: "gule" };

function MarblesFigure({ f }: { f: Extract<Figure, { type: "marbles" }> }) {
  const marbles = f.groups.flatMap((g) => Array.from({ length: g.count }, () => g.color));
  // Mix the colours in a fixed, deterministic way so the drawing does not change between renders.
  const n = marbles.length;
  const step = [7, 5, 3, 11, 13].find((s) => gcd(s, n) === 1) ?? 1;
  const mixed = marbles.map((_, i) => marbles[(i * step) % n]);
  const perRow = 7;
  const r = 11;
  const gap = 24;
  const rows = Math.ceil(n / perRow);
  const jarW = perRow * gap + 18;
  const jarH = Math.max(rows, 2) * gap + 30;
  const jx = (260 - jarW) / 2;
  const jy = 150 - jarH - 6;

  return (
    <svg
      className="figure"
      viewBox="0 0 260 150"
      role="img"
      aria-label={`Figur: pose med ${f.groups.map((g) => `${g.count} ${MARBLE_NAMES[g.color]}`).join(", ")} kuler`}
    >
      <path
        d={`M${jx} ${jy} v${jarH - 18} q0 18 18 18 h${jarW - 36} q18 0 18 -18 v-${jarH - 18}`}
        className="fig-jar"
      />
      {mixed.map((color, i) => {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, n - row * perRow);
        const col = i % perRow;
        const cx = 130 - ((inRow - 1) * gap) / 2 + col * gap;
        const cy = jy + jarH - 4 - r - row * (gap - 2);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={MARBLE_COLORS[color]} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
            <circle cx={cx - 3.5} cy={cy - 3.5} r={3} fill="#fff" opacity="0.7" />
          </g>
        );
      })}
    </svg>
  );
}
