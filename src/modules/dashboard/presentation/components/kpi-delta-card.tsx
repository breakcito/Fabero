import type { ReactNode } from "react";
import { DashCard } from "./dash-card";
import { DeltaPill } from "./delta-pill";
import { Numero, NumeroUnidad } from "./numero";
import { fmt } from "../utils/format";

export interface KpiDeltaCardProps {
  titulo: string;
  /** Color del punto del encabezado. */
  dot: string;
  valor: number;
  /** Sufijo de unidad (t, g/t). */
  unidad?: string;
  decimales?: number;
  /** Formateador de la cifra. Por defecto, separador de miles. */
  formato?: (valor: number) => string;
  /** Variaciones a mostrar: porcentaje y su leyenda. */
  deltas: { pct: number; etiqueta: string }[];
  /** Contenido extra al final de la fila de píldoras. */
  extra?: ReactNode;
  /** Clases extra del contenedor (para spans dentro de un grid). */
  className?: string;
  loading?: boolean;
}

/**
 * Tarjeta de KPI con variaciones (fila 1 de `dash.html`): cifra grande y una
 * fila de píldoras con el delta contra el mes anterior y contra el mismo mes
 * del año anterior.
 */
export const KpiDeltaCard = ({
  titulo,
  dot,
  valor,
  unidad,
  decimales = 0,
  formato,
  deltas,
  extra,
  className = "",
  loading = false,
}: KpiDeltaCardProps) => (
  <DashCard titulo={titulo} dot={dot} className={className}>
    <div>
      {loading ? (
        <Numero color="var(--mantine-color-zinc-700)">—</Numero>
      ) : (
        <Numero>
          {(formato ?? ((v: number) => fmt(v, decimales)))(valor)}
          {unidad && <NumeroUnidad>{unidad}</NumeroUnidad>}
        </Numero>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {deltas.map((d) => (
        <span key={d.etiqueta} className="inline-flex items-center gap-1.5">
          <DeltaPill
            variante={d.pct > 0 ? "up" : d.pct < 0 ? "down" : "neutral"}
          >
            {d.pct > 0 ? "↑" : d.pct < 0 ? "↓" : "→"} {fmt(Math.abs(d.pct), 1)}%
          </DeltaPill>
          <span className="text-[13.5px] text-zinc-300">{d.etiqueta}</span>
        </span>
      ))}
      {extra}
    </div>
  </DashCard>
);
