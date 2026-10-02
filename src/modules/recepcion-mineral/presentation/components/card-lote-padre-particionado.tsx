import { Paper, Group, Badge, ActionIcon, Popover, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconX, IconTrash } from "@tabler/icons-react";
import type { RES_LotePadreParticionado } from "../../service/recepcion-mineral.responses";

interface CardLotePadreParticionadoProps {
  padre: RES_LotePadreParticionado;
  isFinalizando: boolean;
  isEliminando: boolean;
  validacionFinalizar: {
    ok: boolean;
    motivo?: string | null;
    requisitos: { nombre: string; cumplido: boolean }[];
  };
  onFinalizar: (idLote: number, totalParticiones: number) => void;
  onEliminar: (idLote: number, correlativo: string) => void;
  onDragEnd: () => void;
}

export const CardLotePadreParticionado = ({
  padre,
  isFinalizando,
  isEliminando,
  validacionFinalizar,
  onFinalizar,
  onEliminar,
  onDragEnd,
}: CardLotePadreParticionadoProps) => {
  const [popoverOpened, { open: openPopover, close: closePopover }] = useDisclosure(false);

  const { ok: puedeFinalizar, motivo: motivoBloqueo, requisitos } = validacionFinalizar;
  const total = padre.total_particiones;

  return (
    <Paper
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/lote-particionar", String(padre.id));
      }}
      onDragEnd={onDragEnd}
      className="bg-linear-to-br from-indigo-950/40 to-zinc-900/40 border border-indigo-800/60 cursor-grab active:cursor-grabbing select-none transition-all hover:border-indigo-400 shadow-sm"
    >
      <Group gap={4} wrap="nowrap" className="px-1.5 py-0.5">
        <Badge
          variant="light"
          color="indigo"
          size="xs"
          radius="sm"
          className="font-mono font-bold text-[10px]"
        >
          {padre.correlativo}
        </Badge>

        {/* Popover con requisitos para finalizar */}
        <Popover
          opened={popoverOpened}
          position="bottom"
          withArrow
          shadow="xl"
          radius="md"
          withinPortal
        >
          <Popover.Target>
            <div
              onMouseEnter={openPopover}
              onMouseLeave={closePopover}
              className="inline-flex items-center"
            >
              <ActionIcon
                color={puedeFinalizar ? "green" : "zinc"}
                variant={puedeFinalizar ? "filled" : "subtle"}
                radius="md"
                size="xs"
                loading={isFinalizando}
                disabled={!puedeFinalizar || isFinalizando}
                onClick={() => onFinalizar(padre.id, total)}
                className={
                  puedeFinalizar
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "text-zinc-600"
                }
                aria-label="Finalizar lote particionado"
              >
                <IconCheck size={12} />
              </ActionIcon>
            </div>
          </Popover.Target>
          <Popover.Dropdown
            onMouseEnter={openPopover}
            onMouseLeave={closePopover}
            className="bg-zinc-950/95 border border-zinc-800 p-3 max-w-xs shadow-2xl backdrop-blur-md"
          >
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
                <Text size="xs" fw={700} className="text-zinc-200">
                  Requisitos para finalizar
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  color={puedeFinalizar ? "green" : "yellow"}
                  className="font-semibold"
                >
                  {puedeFinalizar ? "Listo" : "Pendiente"}
                </Badge>
              </div>

              <div className="space-y-1.5">
                {requisitos.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {req.cumplido ? (
                      <IconCheck size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <IconX size={13} className="text-zinc-500 shrink-0" />
                    )}
                    <span
                      className={`text-[11px] ${
                        req.cumplido ? "text-zinc-200" : "text-zinc-400"
                      }`}
                    >
                      {req.nombre}
                    </span>
                  </div>
                ))}
              </div>

              {puedeFinalizar ? (
                <Text size="10px" className="text-emerald-400 font-medium pt-1">
                  Listo para finalizar. Haz clic en el botón de check para sumar pesos y cerrar el lote.
                </Text>
              ) : motivoBloqueo ? (
                <Text size="10px" className="text-amber-400 font-medium pt-1">
                  Bloqueado: {motivoBloqueo}
                </Text>
              ) : null}
            </div>
          </Popover.Dropdown>
        </Popover>

        {/* Botón Eliminar lote padre y particiones */}
        <ActionIcon
          color="red"
          variant="subtle"
          radius="md"
          size="xs"
          loading={isEliminando}
          disabled={isEliminando || isFinalizando}
          onClick={(e) => {
            e.stopPropagation();
            onEliminar(padre.id, padre.correlativo);
          }}
          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Eliminar lote padre y particiones"
          title="Eliminar lote padre y todas sus particiones"
        >
          <IconTrash size={12} />
        </ActionIcon>
      </Group>
    </Paper>
  );
};
