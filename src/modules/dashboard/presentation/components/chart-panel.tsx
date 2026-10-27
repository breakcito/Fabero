import { memo, type ReactNode } from "react";
import { Skeleton, Text } from "@mantine/core";

export interface ChartPanelProps {
  titulo: string;
  descripcion?: string;
  /** Contenido del gráfico. */
  children: ReactNode;
  /** Altura del área del gráfico en píxeles. */
  alto?: number;
  loading?: boolean;
  /** Acciones a la derecha del encabezado (filtros, toggles). */
  rightSection?: ReactNode;
  /** Clases extra del contenedor (para spans dentro de un grid). */
  className?: string;
}

/**
 * Contenedor visual de un gráfico: encabezado + área con altura estable
 * para que el layout no salte mientras carga.
 */
export const ChartPanel = memo(
  ({
    titulo,
    descripcion,
    children,
    alto = 240,
    loading = false,
    rightSection,
    className = "",
  }: ChartPanelProps) => (
    <section
      className={`flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 backdrop-blur-md ${className}`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text fw={600} size="sm" className="truncate text-zinc-200">
            {titulo}
          </Text>
          {descripcion && (
            <Text size="xs" className="mt-0.5 truncate text-zinc-500">
              {descripcion}
            </Text>
          )}
        </div>
        {rightSection}
      </header>

      <div style={{ minHeight: alto }}>
        {loading ? (
          <Skeleton height={alto} radius="md" className="bg-zinc-800/60" />
        ) : (
          children
        )}
      </div>
    </section>
  ),
);

ChartPanel.displayName = "ChartPanel";
