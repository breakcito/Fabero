import type { RES_DashboardDetalleCuenta } from "../../service/dashboard.responses";
import { usdExacto } from "../utils/format";

export interface DetalleCuentaProps {
  /** Comprobantes pendientes, ordenados por saldo pendiente descendente. */
  filas: RES_DashboardDetalleCuenta[];
}

/**
 * Lista de comprobantes pendientes que se muestra en el popover de las
 * tarjetas "Por pagar" y "Por cobrar".
 *
 * Cada fila resume el documento (factura/comprobante), la contraparte, la
 * valorización de origen y el saldo pendiente desglosado en neto y
 * detracción.
 */
export const DetalleCuenta = ({ filas }: DetalleCuentaProps) => (
  <div className="flex flex-col">
    {filas.map((fila, i) => (
      <div
        key={`${fila.documento}-${i}`}
        className="flex items-start justify-between gap-3 border-t border-zinc-800/70 py-2 first:border-t-0"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <b className="truncate text-[13px] font-semibold text-zinc-100">
            {fila.documento || "—"}
          </b>
          <small className="truncate text-[12px] text-zinc-400">
            {fila.contraparte}
          </small>
          {fila.valorizacion && (
            <small className="truncate text-[11.5px] text-zinc-500">
              Valorización {fila.valorizacion}
            </small>
          )}
        </span>

        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <b className="text-[13px] font-semibold tabular-nums text-zinc-100">
            {usdExacto(fila.total_usd)}
          </b>
          <small className="text-[11.5px] tabular-nums text-zinc-400">
            Neto {usdExacto(fila.neto_usd)}
          </small>
          {fila.detraccion_usd > 0 && (
            <small className="text-[11.5px] tabular-nums text-amber-300/90">
              Detracción {usdExacto(fila.detraccion_usd)}
            </small>
          )}
          <small className="text-[11px] text-zinc-500">
            {fila.fecha ?? "—"} · {fila.estado}
          </small>
        </span>
      </div>
    ))}
  </div>
);
