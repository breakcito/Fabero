import { DeltaPill } from "./delta-pill";
import { usdExacto } from "../utils/format";
import type { RES_DashboardSinComprobanteDetalle } from "../../service/dashboard.responses";

export interface DetalleSinComprobanteProps {
  /** Valorizaciones sin comprobante (compras y ventas mezcladas). */
  detalle: RES_DashboardSinComprobanteDetalle[];
}

/**
 * Listado de valorizaciones aprobadas que no tienen comprobante registrado.
 *
 * Se muestra en el popover de la tarjeta "Valorizaciones sin comprobante":
 * documento, contraparte, días transcurridos y monto.
 */
export const DetalleSinComprobante = ({
  detalle,
}: DetalleSinComprobanteProps) => (
  <div className="flex flex-col">
    {detalle.map((item) => (
      <div
        key={`${item.tipo}-${item.documento}`}
        className="flex items-center justify-between gap-2 border-t border-zinc-800/70 py-2 first:border-t-0"
      >
        <span className="flex min-w-0 flex-col">
          <b className="truncate text-[13px] font-semibold text-zinc-100">
            {item.documento}
          </b>
          <small className="truncate text-[12px] text-zinc-400">
            {item.contraparte}
          </small>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <DeltaPill variante={item.dias > 3 ? "down" : "warn"}>
            {item.dias} días
          </DeltaPill>
          <b className="text-[13px] font-semibold tabular-nums text-zinc-100">
            {usdExacto(item.monto_usd)}
          </b>
        </span>
      </div>
    ))}
  </div>
);
