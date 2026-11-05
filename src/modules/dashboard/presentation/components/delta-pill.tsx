import type { ReactNode } from "react";

export type DeltaVariante = "up" | "down" | "neutral" | "warn";

export interface DeltaPillProps {
  children: ReactNode;
  variante?: DeltaVariante;
  title?: string;
}

const VARIANTES: Record<DeltaVariante, string> = {
  up: "bg-emerald-500/20 text-emerald-300",
  down: "bg-red-500/20 text-red-300",
  neutral: "bg-zinc-700/60 text-zinc-200",
  warn: "bg-amber-500/20 text-amber-300",
};

/**
 * Píldora de variación (`.pill` de `dash.html`) en tema oscuro.
 */
export const DeltaPill = ({
  children,
  variante = "neutral",
  title,
}: DeltaPillProps) => (
  <span
    title={title}
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[14px] font-semibold tabular-nums ${VARIANTES[variante]}`}
  >
    {children}
  </span>
);
