import { Paper, Text, Group, Button, ActionIcon, Tooltip, Badge } from "@mantine/core";
import { IconBarcode, IconTrash } from "@tabler/icons-react";
import type { RES_ParticionBalanza, RES_LoteMineral } from "../../service/recepcion-mineral.responses";

// NOTA: el campo `vehiculo_placa` se mantiene en `RES_ParticionBalanza` (lo devuelve
// el backend y se usa para el header del ticket de balanza de la partición y para el
// contexto del modal de pesaje), pero NO se renderiza como footer en este card: la
// unidad ya está implícita en la pantalla donde aparece el card.

interface ParticionCardInlineProps {
  particion: RES_ParticionBalanza;
  /**
   * Lote padre "virtual" construido en el page.tsx con los campos heredados del padre
   * (id_proveedor_minero, id_zona_origen, etc.) — necesario para abrir el modal de pesaje.
   */
  lotePadreVirtual: RES_LoteMineral;
  onPesarInicial: (p: RES_ParticionBalanza, lotePadre: RES_LoteMineral) => void;
  onPesarFinal: (p: RES_ParticionBalanza, lotePadre: RES_LoteMineral) => void;
  onImprimirTicket: (p: RES_ParticionBalanza) => void;
  onEliminar: (p: RES_ParticionBalanza) => void;
  deletingParticionId: number | null;
}

const formatNumber = (n: number) => n.toLocaleString();

/**
 * Card visual de partición renderizado DENTRO del grid principal de "Lotes" de la
 * unidad, junto a los lotes regulares. Misma estructura visual que el card de lote
 * regular (PESO INICIAL / PESO FINAL / iconos) para no romper el flujo del operador,
 * con dos diferenciadores sutiles:
 *   - Borde izquierdo indigo (`border-l-2 border-indigo-500`) = "es partición".
 *   - Pill con la letra de la partición (A, B, C...) al costado del correlativo.
 *
 * El correlativo se muestra COMPLETO (no se trunca) para que el sufijo "-A" siempre
 * sea legible.
 */
export const ParticionCardInline = ({
  particion,
  lotePadreVirtual,
  onPesarInicial,
  onPesarFinal,
  onImprimirTicket,
  onEliminar,
  deletingParticionId,
}: ParticionCardInlineProps) => {
  const tieneTicket = particion.id_ticket_balanza !== null;

  return (
    <Paper
      radius="md"
      p="xs"
      className="bg-zinc-950/40 border border-zinc-800/80 border-l-2 border-l-indigo-500 shadow-md flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-1.5">
        <Group gap={4} wrap="nowrap" className="min-w-0">
          <Badge
            variant="filled"
            color="indigo"
            size="xs"
            radius="sm"
            className="font-bold font-mono shrink-0"
            title={`Partición ${particion.particion} del lote padre`}
          >
            {particion.particion}
          </Badge>
          <Badge
            variant="outline"
            color="indigo"
            size="sm"
            radius="sm"
            className="font-mono font-bold text-[10px] truncate"
            title={particion.correlativo}
          >
            {particion.correlativo}
          </Badge>
        </Group>
        <Group gap={2} wrap="nowrap">
          {tieneTicket && (
            <Tooltip label="Imprimir ticket de la partición" withArrow>
              <ActionIcon
                variant="subtle"
                color="indigo"
                radius="sm"
                size="sm"
                onClick={() => onImprimirTicket(particion)}
                className="text-indigo-300 hover:bg-indigo-500/10"
              >
                <IconBarcode size={12} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Eliminar partición (borrado físico)" withArrow>
            <ActionIcon
              color="red"
              variant="subtle"
              radius="sm"
              size="sm"
              loading={deletingParticionId === particion.id}
              disabled={deletingParticionId === particion.id}
              onClick={() => onEliminar(particion)}
            >
              <IconTrash size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <Text size="9px" c="dimmed" className="uppercase font-semibold shrink-0">
            Peso Inicial
          </Text>
          {particion.peso_inicial !== null ? (
            <Badge
              variant="outline"
              color="teal"
              size="sm"
              radius="sm"
              className="font-mono font-bold text-[10px] text-teal-300"
            >
              {formatNumber(particion.peso_inicial)} Kg
            </Badge>
          ) : (
            <Button
              size="compact-xs"
              radius="sm"
             
              onClick={() => onPesarInicial(particion, lotePadreVirtual)}
              className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 h-4 text-[9px] px-1.5"
            >
              Pesar
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <Text size="9px" c="dimmed" className="uppercase font-semibold shrink-0">
            Peso Final
          </Text>
          {particion.peso_final !== null ? (
            <Badge
              variant="outline"
              color="teal"
              size="sm"
              radius="sm"
              className="font-mono font-bold text-[10px] text-teal-300"
            >
              {formatNumber(particion.peso_final)} Kg
            </Badge>
          ) : particion.peso_inicial !== null ? (
            <Button
              size="compact-xs"
              radius="sm"
              
              onClick={() => onPesarFinal(particion, lotePadreVirtual)}
              className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 h-4 text-[9px] px-1.5"
            >
              Pesar
            </Button>
          ) : (
            <Text size="10px" c="dimmed">
              ---
            </Text>
          )}
        </div>
      </div>
    </Paper>
  );
};
