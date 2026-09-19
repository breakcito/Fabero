import { useState } from "react";
import {
  Paper,
  Text,
  Group,
  ActionIcon,
  Tooltip,
  Badge,
} from "@mantine/core";
import { IconCheck, IconArrowsMove } from "@tabler/icons-react";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import type { RES_LotePadreParticionado } from "../../service/recepcion-mineral.responses";

interface HeaderLotesPadreProps {
  lotesPadre: RES_LotePadreParticionado[];
  loading?: boolean;
  finalizandoLoteId: number | null;
  onFinalizar: (idLote: number, totalParticiones: number) => void;
  onDragStart: (idLote: number) => void;
  onDragEnd: () => void;
}

/**
 * Header global flotante con todos los lotes padre particionados desde Balanza
 * que aún tienen particiones activas. Cada card es draggable y permite finalizar
 * el lote (suma los pesos netos de las particiones).
 *
 * Se renderiza una sola vez arriba del listado de unidades en
 * recepcion-mineral.page.tsx (no por unidad).
 */
export const HeaderLotesPadre = ({
  lotesPadre,
  loading,
  finalizandoLoteId,
  onFinalizar,
  onDragStart,
  onDragEnd,
}: HeaderLotesPadreProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (loading && lotesPadre.length === 0) {
    return null;
  }

  if (lotesPadre.length === 0) {
    return null;
  }

  return (
    <Paper
      radius="lg"
      p="sm"
      className="bg-zinc-950/40 border border-indigo-900/60 shadow-md"
    >
      <Group justify="space-between" mb="xs" className="px-1">
        <Group gap={6}>
          <IconArrowsMove size={14} className="text-indigo-400" />
          <Text size="10px" fw={700} className="text-indigo-400 uppercase tracking-wider">
            Lotes Padre Particionados ({lotesPadre.length})
          </Text>
          <Text size="10px" c="dimmed">
            Arrastra el card de un padre a otra unidad para crear una partición adicional
          </Text>
        </Group>
      </Group>

      <div className="flex flex-wrap gap-2">
        {lotesPadre.map((lote) => {
          const sinPesar = lote.particiones_sin_peso_final;
          const total = lote.total_particiones;
          const puedeFinalizar = sinPesar === 0 && total > 0;
          const tooltipFinalizar = puedeFinalizar
            ? "Todas las particiones están pesadas. Click para sumar pesos y finalizar."
            : `No se puede finalizar: ${sinPesar} partición(es) sin pesar.`;
          const isFinalizando = finalizandoLoteId === lote.id;

          return (
            <Paper
              key={lote.id}
              radius="md"
              p="xs"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("application/lote-particionar", String(lote.id));
                onDragStart(lote.id);
              }}
              onDragEnd={onDragEnd}
              onMouseEnter={() => setHovered(lote.id)}
              onMouseLeave={() => setHovered(null)}
              className={`bg-linear-to-br from-indigo-950/40 to-zinc-900/40 border ${
                hovered === lote.id
                  ? "border-indigo-400 shadow-lg shadow-indigo-500/20"
                  : "border-indigo-800/60"
              } cursor-grab active:cursor-grabbing select-none transition-all duration-150`}
            >
              <Group gap={6} wrap="nowrap">
                <Badge
                  variant="filled"
                  color="indigo"
                  size="sm"
                  radius="sm"
                  className="font-mono font-bold text-[10px]"
                >
                  {lote.correlativo}
                </Badge>
                <Badge
                  size="xs"
                  variant="light"
                  color={sinPesar === 0 ? "green" : "yellow"}
                  radius="sm"
                >
                  {total - sinPesar}/{total} pesadas
                </Badge>
                <Tooltip label={tooltipFinalizar} withArrow>
                  <ActionIcon
                    color={puedeFinalizar ? "green" : "zinc"}
                    variant={puedeFinalizar ? "filled" : "subtle"}
                    radius="md"
                    size="sm"
                    loading={isFinalizando}
                    disabled={!puedeFinalizar || isFinalizando}
                    onClick={() =>
                      mostrarConfirmacion({
                        title: "Finalizar Lote Particionado",
                        message: (
                          <>
                            ¿Finalizar el lote <strong className="text-indigo-400">{lote.correlativo}</strong>?
                            Se sumarán los pesos netos de las{" "}
                            <strong className="text-indigo-400">{total} partición(es)</strong>{" "}
                            y se asignarán como peso oficial del lote padre.
                            Esta acción <strong>no se puede deshacer</strong>.
                          </>
                        ),
                        confirmLabel: "Finalizar",
                        cancelLabel: "Cancelar",
                        onConfirm: () => onFinalizar(lote.id, total),
                      })
                    }
                    className={
                      puedeFinalizar
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-zinc-600"
                    }
                    aria-label="Finalizar lote particionado"
                  >
                    <IconCheck size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Paper>
          );
        })}
      </div>
    </Paper>
  );
};
