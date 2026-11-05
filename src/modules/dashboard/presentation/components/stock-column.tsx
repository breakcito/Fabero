import { fmt } from "../utils/format";

export interface StockColumnPart {
  nombre: string;
  valor: number;
  color: string;
}

export interface StockColumnProps {
  parts: StockColumnPart[];
  format: (v: number) => string;
}

/**
 * Columna apilada vertical con la composición del stock en cancha
 * (lotes / blendings / por salir) y su leyenda al lado con el porcentaje.
 *
 * La columna se dibuja de abajo hacia arriba en el orden de la leyenda: el
 * primer elemento de `parts` queda en la base. El carril de fondo representa
 * el 100% para que la proportions se lea aunque el stock esté en cero.
 */
export const StockColumn = ({ parts, format }: StockColumnProps) => {
  const total = parts.reduce((a, p) => a + Math.max(p.valor, 0), 0);
  const pct = (v: number) => (total > 0 ? (Math.max(v, 0) / total) * 100 : 0);

  // De abajo hacia arriba: el último de la leyenda queda arriba de la columna.
  const deAbajoArriba = [...parts].reverse();

  return (
    <div className="flex items-stretch gap-4">
      <div className="relative flex h-[250px] w-[86px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-zinc-800/50">
        {total === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold text-zinc-600">
            —
          </span>
        )}
        {deAbajoArriba.map((p) => (
          <div
            key={p.nombre}
            className="w-full"
            style={{
              height: `${pct(p.valor)}%`,
              background: p.color,
              minHeight: p.valor > 0 ? 5 : 0,
            }}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {parts.map((p) => (
          <div key={p.nombre} className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center">
              <i
                className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              <span className="truncate text-[13px] text-zinc-400">{p.nombre}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <b className="text-[14px] font-semibold tabular-nums text-zinc-100">
                {format(p.valor)}
              </b>
              <span className="text-[12px] tabular-nums text-zinc-500">
                {fmt(pct(p.valor), 0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
