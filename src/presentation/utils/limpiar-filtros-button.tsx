import { ActionIcon, Tooltip } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

interface LimpiarFiltrosButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Botón de "Limpiar filtros" de la barra superior de los listados.
 *
 * Es el gemelo del `RefreshButton`: misma forma (círculo `h-9 w-9`) y misma
 * posición en la barra, pero con la X en rojo para marcar que descarta lo
 * filtrado (a diferencia del refresh, que sólo vuelve a consultar).
 *
 * No confundir con las X sueltas que viven dentro de los componentes de
 * filtros (limpian un campo puntual, no todo el filtro).
 */
export const LimpiarFiltrosButton = ({
  onClick,
  disabled = false,
  label = "Limpiar filtros",
  className = "",
}: LimpiarFiltrosButtonProps) => (
  <Tooltip label={label} withArrow>
    <ActionIcon
      type="button"
      variant="light"
      color="red"
      radius="xl"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 h-9 w-9 min-h-9 min-w-9 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <IconX size={18} stroke={1.8} />
    </ActionIcon>
  </Tooltip>
);
