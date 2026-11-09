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
  const util = W - L - R;
  const centro = L + util / 2;

  /**
   * Sin rango (compra == venta) no hay nada que repartir: el punto va al
   * centro de la barra. Pegado al extremo las etiquetas se amontonarían y
   * además quedarían cortadas contra el borde del gráfico.
   */
  const sinRango = Math.abs(compra - venta) < 1e-9;
  const x = (n: number) =>
    sinRango ? centro : L + util * ((n - lo) / span);

  const xc = x(compra);
  const xv = x(venta);

  /** Ancho aproximado de un texto SVG (estimación por caracteres). */
  const ancho = (t: string, fs: number) => t.length * fs * 0.56;

  /** Mantiene el texto centrado dentro del viewBox: nunca queda cortado. */
  const limitar = (cx: number, w: number) =>
    Math.min(Math.max(cx, w / 2 + 2), W - w / 2 - 2);

  /**
   * Cuando compra y venta casi coinciden los dos puntos se apilan y sus
   * textos se leen encima. La separación necesaria se calcula a partir del
   * ancho real de los textos (valores y rótulos) para que nada se solape.
   * Se usa la misma separación para ambos renglones, así cada rótulo queda
   * debajo de su punto.
   */
  const separar = (minSep: number): [number, number] => {
    const sep = Math.abs(xv - xc);
    if (sep >= minSep) return [xc, xv];
    const dx = (minSep - sep) / 2;
    return [xc - dx, xv + dx];
  };

  const tCompra = format(compra);
  const tVenta = format(venta);

  const sepNecesaria = Math.max(
    (ancho(tCompra, 15) + ancho(tVenta, 15)) / 2 + 12,
    (ancho("Compra", 13) + ancho("Venta", 13)) / 2 + 14,
  );

  const [xBaseC, xBaseV] = separar(sepNecesaria);

  const xValorC = limitar(xBaseC, ancho(tCompra, 15));
  const xValorV = limitar(xBaseV, ancho(tVenta, 15));
  const xTextoC = limitar(xBaseC, ancho("Compra", 13));
  const xTextoV = limitar(xBaseV, ancho("Venta", 13));

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
        x={xValorC}
        y={Y - 18}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#e4e4e7"
      >
        {tCompra}
      </text>
      <text
        x={xValorV}
        y={Y - 18}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#e4e4e7"
      >
        {tVenta}
      </text>
      <text x={xTextoC} y={Y + 32} textAnchor="middle" fontSize={13} fontWeight={600} fill="#d4d4d8">
        Compra
      </text>
      <text x={xTextoV} y={Y + 32} textAnchor="middle" fontSize={13} fontWeight={600} fill="#d4d4d8">
        Venta
      </text>
    </svg>
  );
};
