import { memo } from "react";
import { Skeleton, Text, ThemeIcon } from "@mantine/core";
import type { MantineColor } from "@mantine/core";
import { formatNumber } from "../../../../shared/functions/formatNumber";

export interface KpiCardProps {
  label: string;
  value: number;
  /** Sufijo de la unidad (t, g/t, u). */
  unidad?: string;
  /** Símbolo de moneda ya resuelto ($ / S/). */
  simbolo?: string;
  /** Texto secundario bajo el valor (ej. "convertido @ TC 2026-10-26"). */
  pie?: string;
  color: MantineColor;
  icono: React.ComponentType<{ size?: number; stroke?: number }>;
  loading?: boolean;
  decimales?: number;
}

/**
 * Tarjeta de indicador. Componente puro y memoizado: no se re-renderiza
 * cuando el resto del dashboard cambia.
 */
export const KpiCard = memo(
  ({
    label,
    value,
    unidad,
    simbolo,
    pie,
    color,
    icono: Icono,
    loading = false,
    decimales = 0,
  }: KpiCardProps) => {
    const valor = formatNumber(value, decimales);
    const magnitud = valor.length > 9 ? "text-xl" : "text-2xl";

    return (
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-indigo-900/20">
        <div className="flex items-start justify-between gap-2">
          <Text
            size="xs"
            fw={600}
            className="text-[11px] uppercase tracking-wider text-zinc-500"
          >
            {label}
          </Text>
          <ThemeIcon size="sm" radius="md" variant="light" color={color}>
            <Icono size={14} stroke={1.8} />
          </ThemeIcon>
        </div>

        {loading ? (
          <Skeleton height={28} mt={10} radius="md" className="bg-zinc-800/60" />
        ) : (
          <div className="mt-2 flex items-baseline gap-1.5">
            {simbolo && (
              <span className="text-base font-semibold text-zinc-400">
                {simbolo}
              </span>
            )}
            <span
              className={`${magnitud} font-bold tracking-tight text-white`}
            >
              {valor}
            </span>
            {unidad && (
              <span className="text-xs font-medium text-zinc-500">{unidad}</span>
            )}
          </div>
        )}

        {pie && (
          <Text size="xs" className="mt-1 text-zinc-600" lineClamp={1}>
            {pie}
          </Text>
        )}
      </div>
    );
  },
);

KpiCard.displayName = "KpiCard";
