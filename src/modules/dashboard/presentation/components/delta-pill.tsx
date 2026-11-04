import type { ReactNode } from "react";

export type DeltaVariante = "up" | "down" | "neutral" | "warn";

export interface DeltaPillProps {
  children: ReactNode;
  variante?: DeltaVariante;
  title?: string;
}

const VARIANTES: Record<DeltaVariante, string> = {
  up: "bg-emerald-500/15 text-emerald-400",
  down: "bg-red-500/15 text-red-400",
  neutral: "bg-zinc-800/70 text-zinc-400",
  warn: "bg-amber-500/15 text-amber-400",
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
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${VARIANTES[variante]}`}
  >
    {children}
  </span>
);
