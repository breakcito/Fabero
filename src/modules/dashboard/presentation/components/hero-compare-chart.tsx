import { useId } from "react";
import { COLOR_COMPRA, COLOR_VENTA } from "../utils/colores";

export interface HeroCompareChartProps {
  /** Serie principal (compras). */
  a: number[];
  /** Serie secundaria (ventas). */
  b: number[];
  /** Índice del mes marcado. */
  selected: number;
  /** Etiquetas del eje X (una por punto). */
  labels: string[];
  /** Formateador de los valores del eje Y. */
  format: (v: number) => string;
  colorA?: string;
  colorB?: string;
}

const W = 640;
const H = 180;
const L = 40;
const R = 34;
const T = 34;
const B = 24;

/** Trazo suave (Bézier) que pasa por todos los puntos. */
const smooth = (pts: [number, number][]): string =>
  pts.reduce((d, p, i) => {
    if (!i) return `M${p[0]},${p[1]}`;
    const q = pts[i - 1];
    const mx = (q[0] + p[0]) / 2;
    return `${d} C${mx},${q[1]} ${mx},${p[1]} ${p[0]},${p[1]}`;
  }, "");

/**
 * Gráfico principal del dashboard: dos series comparadas mes a mes con
 * área degradada, marca vertical sobre el mes seleccionado y globos de valor.
 */
export const HeroCompareChart = ({
  a,
  b,
  selected,
  labels,
  format,
  colorA = COLOR_COMPRA,
  colorB = COLOR_VENTA,
}: HeroCompareChartProps) => {
  const gradId = useId().replace(/:/g, "");

  const n = a.length;
  if (!n || !b.length) return null;

  const max = Math.max(...a, ...b) * 1.1;
  const min = Math.min(...a, ...b) * 0.8;
  const rng = max - min || 1;

  const x = (i: number) => L + (W - L - R) * (n === 1 ? 0 : i / (n - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - min) / rng);

  const pa = a.map((v, i) => [x(i), y(v)] as [number, number]);
  const pb = b.map((v, i) => [x(i), y(v)] as [number, number]);

  const rejilla = Array.from({ length: 4 }, (_, k) => {
    const yy = T + (H - T - B) * (k / 3);
    const v = max - (max - min) * (k / 3);
    return { yy, v };
  });

  const sel = Math.min(Math.max(selected, 0), n - 1);
  const aboveA = a[sel] >= b[sel];

  const globo = (
    px: number,
    py: number,
    v: number,
    color: string,
    below: boolean,
  ) => {
    const t = format(v);
    const w = t.length * 6.6 + 14;
    return (
      <g>
        <circle cx={px} cy={py} r={5} fill="#18181b" stroke={color} strokeWidth={2.5} />
        <rect
          x={px - w / 2}
          y={below ? py + 10 : py - 30}
          width={w}
          height={20}
          rx={10}
          fill={color}
        />
        <text
          x={px}
          y={below ? py + 23.5 : py - 16.5}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={600}
          fill="#fafafa"
        >
          {t}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Compras vs ventas por mes"
      className="block h-auto w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colorA} stopOpacity={0.22} />
          <stop offset="1" stopColor={colorA} stopOpacity={0} />
        </linearGradient>
      </defs>

      {rejilla.map((g, i) => (
        <g key={i}>
          <line
            x1={L}
            x2={W - R}
            y1={g.yy}
            y2={g.yy}
            stroke="#27272a"
            strokeWidth={1}
          />
          <text
            x={L - 8}
            y={g.yy + 3}
            textAnchor="end"
            fontSize={10}
            fill="#71717a"
          >
            {format(g.v)}
          </text>
        </g>
      ))}

      <path
        d={`${smooth(pa)} L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`}
        fill={`url(#${gradId})`}
      />
      <path
        d={smooth(pa)}
        fill="none"
        stroke={colorA}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d={smooth(pb)}
        fill="none"
        stroke={colorB}
        strokeWidth={2.4}
        strokeLinecap="round"
      />

      <line
        x1={x(sel)}
        x2={x(sel)}
        y1={T}
        y2={H - B}
        stroke="#3f3f46"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {globo(x(sel), pa[sel][1], a[sel], colorA, !aboveA)}
      {globo(x(sel), pb[sel][1], b[sel], colorB, aboveA)}

      {labels.map((label, i) => (
        <text
          key={`${label}-${i}`}
          x={x(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize={10}
          fill={i === sel ? "#e4e4e7" : "#71717a"}
          fontWeight={i === sel ? 700 : 400}
        >
          {label}
        </text>
      ))}
    </svg>
  );
};
