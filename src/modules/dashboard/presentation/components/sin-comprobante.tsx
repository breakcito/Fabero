import { IconEye } from "@tabler/icons-react";
import { Numero } from "./numero";
import { COLOR_COMPRA, COLOR_VENTA } from "../utils/colores";
import { usd } from "../utils/format";

export interface SinComprobanteProps {
  compras: { conteo: number; monto_usd: number };
  ventas: { conteo: number; monto_usd: number };
}

/**
 * Valorizaciones aprobadas que todavía no tienen comprobante registrado.
 *
 * La tarjeta sólo muestra los dos contadores (Compras / Ventas): el listado
 * de valorizaciones vive en el popover de detalle, que se abre al pasar el
 * cursor por encima de la tarjeta.
 */
export const SinComprobante = ({ compras, ventas }: SinComprobanteProps) => {
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

      <p className="flex items-center gap-1.5 text-[12.5px] text-zinc-500">
        <IconEye size={14} stroke={1.8} />
        Pasa el cursor por la tarjeta para ver el detalle
      </p>
    </>
  );
};
