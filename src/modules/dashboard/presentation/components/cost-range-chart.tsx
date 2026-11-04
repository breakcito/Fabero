import { COLOR_COMPRA, COLOR_VENTA } from "../utils/colores";

export interface CostRangeChartProps {
  /** Costo promedio por tonelada en compra (USD/t). */
  compra: number;
  /** Costo promedio por tonelada en venta (USD/t). */
  venta: number;
  format: (v: number) => string;
}

const W = 300;
const H = 96;
const L = 30;
const R = 30;
const Y = 52;

/**
 * Rango compra → venta (`.dumbbell` de `dash.html`): una barra con los dos
 * extremos marcados para leer de un vistazo cuánto mayor es el precio de
 * venta frente al de compra.
 */
export const CostRangeChart = ({
  compra,
  venta,
  format,
}: CostRangeChartProps) => {
  const lo = Math.min(compra, venta) * 0.7;
  const hi = Math.max(compra, venta) * 1.05;
  const span = hi - lo || 1;
  const x = (n: number) => L + (W - L - R) * ((n - lo) / span);

  const xc = x(compra);
  const xv = x(venta);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Costo por tonelada compra y venta"
      className="block h-auto w-full"
    >
      <rect
        x={L}
        y={Y - 6}
        width={W - L - R}
        height={12}
        rx={6}
        fill="#27272a"
      />
      <rect
        x={Math.min(xc, xv)}
        y={Y - 6}
        width={Math.abs(xv - xc)}
        height={12}
        rx={6}
        fill="#99f6e4"
      />
      <circle cx={xc} cy={Y} r={9} fill={COLOR_COMPRA} stroke="#18181b" strokeWidth={3} />
      <circle cx={xv} cy={Y} r={9} fill={COLOR_VENTA} stroke="#18181b" strokeWidth={3} />
      <text
        x={xc}
        y={Y - 18}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#e4e4e7"
      >
        {format(compra)}
      </text>
      <text
        x={xv}
        y={Y - 18}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#e4e4e7"
      >
        {format(venta)}
      </text>
      <text x={xc} y={Y + 30} textAnchor="middle" fontSize={11} fill="#71717a">
        Compra
      </text>
      <text x={xv} y={Y + 30} textAnchor="middle" fontSize={11} fill="#71717a">
        Venta
      </text>
    </svg>
  );
};
