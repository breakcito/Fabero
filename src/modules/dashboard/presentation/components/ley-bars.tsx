import { DeltaPill } from "./delta-pill";
import { COLOR_COMPRA, COLOR_VENTA } from "../utils/colores";
import { fmt } from "../utils/format";

export interface LeyBarItem {
  /** Etiqueta del elemento (ej. "Oro (Au)"). */
  nombre: string;
  /** Ley promedio de compra (g/t). */
  compra: number;
  /** Ley promedio de venta (g/t). */
  venta: number;
}

export interface LeyBarsProps {
  items: LeyBarItem[];
}

/**
 * Barras fantasma de la ley promedio (`.leyBars` de `dash.html`): por cada
 * elemento, la ley de compra y la de venta con su variación.
 */
export const LeyBars = ({ items }: LeyBarsProps) => (
  <div className="grid grid-cols-2 gap-3">
    {items.map((item) => {
      const max = Math.max(item.compra, item.venta) * 1.2 || 1;
      const hCompra = Math.min(100, (item.compra / max) * 100);
      const hVenta = Math.min(100, (item.venta / max) * 100);
      const variacion = item.compra
        ? ((item.venta - item.compra) / item.compra) * 100
        : 0;

      const barra = (altura: number, color: string, valor: number, etiqueta: string) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <b className="text-[13px] font-semibold text-zinc-100">
            {fmt(valor, 1)}
          </b>
          <div className="flex h-[86px] w-full items-end overflow-hidden rounded-xl bg-zinc-800/50">
            <div
              className="w-full rounded-xl"
              style={{ height: `${altura}%`, background: color }}
            />
          </div>
          <span className="text-[13px] text-zinc-400">{etiqueta}</span>
        </div>
      );

      return (
        <div key={item.nombre}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <b className="truncate text-[13px] font-semibold text-zinc-100">
              {item.nombre}
            </b>
            <DeltaPill
              variante={variacion > 0 ? "up" : variacion < 0 ? "down" : "neutral"}
            >
              {variacion > 0 ? "↑" : variacion < 0 ? "↓" : "→"}{" "}
              {fmt(Math.abs(variacion), 1)}%
            </DeltaPill>
          </div>
          <div className="flex gap-2">
            {barra(hCompra, COLOR_COMPRA, item.compra, "Compra")}
            {barra(hVenta, COLOR_VENTA, item.venta, "Venta")}
          </div>
        </div>
      );
    })}
  </div>
);
