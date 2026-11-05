import type { ReactNode } from "react";

export interface DashCardProps {
  titulo: ReactNode;
  /** Color del punto que acompaña al título. */
  dot?: string;
  /** Controles a la derecha del encabezado (filtros, toggles). */
  rightSection?: ReactNode;
  children: ReactNode;
  /** Clases extra del contenedor (para spans dentro de un grid). */
  className?: string;
}

/**
 * Tarjeta base del dashboard. Es el equivalente oscuro de `.card` de
 * `dash.html`: fondo translúcido, borde tenue y tipografía apagada.
 */
export const DashCard = ({
  titulo,
  dot,
  rightSection,
  children,
  className = "",
}: DashCardProps) => (
  <section
    className={`flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-md ${className}`}
  >
    <header className="flex items-center justify-between gap-2">
      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-zinc-200">
        {dot && (
          <i
            className="block size-2 shrink-0 rounded-full"
            style={{ background: dot }}
          />
        )}
        {titulo}
      </h2>
      {rightSection && <div className="shrink-0">{rightSection}</div>}
    </header>
    {children}
  </section>
);
