import { DeltaPill } from "./delta-pill";
import { Numero } from "./numero";
import { COLOR_COMPRA, COLOR_VENTA } from "../utils/colores";
import { usd } from "../utils/format";
import type { RES_DashboardSinComprobanteDetalle } from "../../service/dashboard.responses";

export interface SinComprobanteProps {
  compras: { conteo: number; monto_usd: number };
  ventas: { conteo: number; monto_usd: number };
  detalle: RES_DashboardSinComprobanteDetalle[];
}

/**
 * Valorizaciones aprobadas que todavía no tienen comprobante registrado
 * (`.sc-top` + `.sc-list` de `dash.html`).
 */
export const SinComprobante = ({
  compras,
  ventas,
  detalle,
}: SinComprobanteProps) => {
  const bloque = (
    etiqueta: string,
    datos: { conteo: number; monto_usd: number },
    color: string,
  ) => (
    <div>
      <Numero color={color}>{datos.conteo}</Numero>
      <div className="text-[13px] text-zinc-300">
        {etiqueta} · {usd(datos.monto_usd)}
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {bloque("Compras", compras, COLOR_COMPRA)}
        {bloque("Ventas", ventas, COLOR_VENTA)}
      </div>

      <div className="flex flex-col">
        {detalle.map((item) => (
          <div
            key={`${item.tipo}-${item.documento}`}
            className="flex items-center justify-between gap-2 border-t border-zinc-800/60 py-2 text-[12.5px]"
          >
            <span className="flex min-w-0 flex-col">
              <b className="truncate font-semibold text-zinc-100">
                {item.documento}
              </b>
              <small className="truncate text-[12.5px] text-zinc-300">
                {item.contraparte}
              </small>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <DeltaPill variante={item.dias > 3 ? "down" : "warn"}>
                {item.dias} días
              </DeltaPill>
              <b className="font-semibold tabular-nums text-zinc-100">
                {usd(item.monto_usd)}
              </b>
            </span>
          </div>
        ))}
        {!detalle.length && (
          <p className="border-t border-zinc-800/60 py-3 text-[13px] text-zinc-500">
            No hay valorizaciones aprobadas sin comprobante.
          </p>
        )}
      </div>
    </>
  );
};
