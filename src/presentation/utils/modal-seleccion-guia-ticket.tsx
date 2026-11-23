import { Badge, Button, Group, Text } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { ModalEstandar } from "./modal-estandar";
import type { GuiaRecepcionItem } from "../../service/responses/ticket-ingreso-vehiculo";

interface Props {
  opened: boolean;
  guias: GuiaRecepcionItem[];
  /** Id de la guía cuyo ticket se está generando (spinner en esa fila). */
  idGuiaImprimiendo?: number | null;
  onClose: () => void;
  onSelect: (idGuia: number) => void;
}

/**
 * Selección de guía para el Ticket de Ingreso Vehicular.
 *
 * Una unidad vehicular puede tener varias guías de primer tramo registradas;
 * el ticket se genera con los datos de una de ellas, así que hay que elegir
 * cuál antes de imprimirlo.
 */
export const ModalSeleccionGuiaTicket = ({
  opened,
  guias,
  idGuiaImprimiendo,
  onClose,
  onSelect,
}: Props) => {
  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Seleccionar Guía para Ticket de Ingreso"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <Text size="sm" c="zinc.3">
          Esta recepción vehicular tiene {guias.length} guías registradas.
          Seleccione la guía para generar e imprimir su ticket de ingreso:
        </Text>
        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
          {guias.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Text size="xs" fw={700} c="white" className="font-mono">
                    Guía Remitente: {g.guia_remitente || "—"}
                  </Text>
                  {g.con_no_conformidad && (
                    <Badge color="orange" size="xs" variant="light">
                      No Conformidad
                    </Badge>
                  )}
                </div>
                {g.guia_transportista && (
                  <Text size="xs" c="zinc.4" className="font-mono">
                    Guía Transp: {g.guia_transportista}
                  </Text>
                )}
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>
                    P. Guía:{" "}
                    <strong className="text-zinc-200">
                      {g.peso_guia_remision !== null &&
                      g.peso_guia_remision !== undefined
                        ? `${Number(g.peso_guia_remision).toLocaleString("es-PE")} kg`
                        : "—"}
                    </strong>
                  </span>
                  <span>
                    P. Balanza:{" "}
                    <strong className="text-zinc-200">
                      {g.peso_vehicular_total !== null &&
                      g.peso_vehicular_total !== undefined
                        ? `${Number(g.peso_vehicular_total).toLocaleString("es-PE")} kg`
                        : "—"}
                    </strong>
                  </span>
                </div>
              </div>
              <Button
                size="xs"
                color="indigo"
                radius="md"
                leftSection={<IconPrinter size={14} />}
                loading={idGuiaImprimiendo === g.id}
                onClick={() => onSelect(g.id)}
              >
                Imprimir Ticket
              </Button>
            </div>
          ))}
        </div>
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            size="xs"
            onClick={onClose}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
        </Group>
      </div>
    </ModalEstandar>
  );
};
