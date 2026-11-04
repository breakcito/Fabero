import type { ReactNode } from "react";

export interface NumeroProps {
  children: ReactNode;
  /** Color del texto (por defecto el blanco de la app). */
  color?: string;
  className?: string;
}

/**
 * Cifra grande del dashboard (`.num` de `dash.html`): tamaño fluido, peso
 * alto y cifras tabulares para que las columnas no bailen.
 */
export const Numero = ({ children, color, className = "" }: NumeroProps) => (
  <div
    className={`font-bold leading-tight tracking-tight tabular-nums ${className}`}
    style={{
      fontSize: "clamp(1.6rem, 1.2rem + 1.2vw, 2.15rem)",
      color: color ?? "var(--mantine-color-zinc-100)",
    }}
  >
    {children}
  </div>
);

/** Sufijo de unidad dentro de una cifra grande (`<small>` de `dash.html`). */
export const NumeroUnidad = ({ children }: { children: ReactNode }) => (
  <small className="ml-1 text-[0.5em] font-semibold tracking-normal text-zinc-500">
    {children}
  </small>
);
