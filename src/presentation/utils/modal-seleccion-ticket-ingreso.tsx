import { Badge, Button, Group, Text } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { ModalEstandar } from "./modal-estandar";
import type { RES_TicketIngresoDisponible } from "../../service/responses/ticket-ingreso-vehiculo";

interface Props {
  opened: boolean;
  tickets: RES_TicketIngresoDisponible[];
  /** Id del proveedor cuyo ticket se está imprimiendo (spinner en esa fila). */
  idImprimiendo?: number | null;
  onClose: () => void;
  onSelect: (ticket: RES_TicketIngresoDisponible) => void;
}

const fmtKg = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "—";
  }
  return `${Number(valor).toLocaleString("es-PE")} kg`;
};

/**
 * Selección del Ticket de Ingreso Vehicular por proveedor.
 *
 * Una unidad vehicular puede traer la carga de varios proveedores: cada uno
 * tiene su propio par de guías y su propio ticket de ingreso, así que el
 * operador tiene que elegir a cuál corresponde el documento que va a
 * imprimir.
 */
export const ModalSeleccionTicketIngreso = ({
  opened,
  tickets,
  idImprimiendo,
  onClose,
  onSelect,
}: Props) => {
  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Seleccionar Ticket de Ingreso"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <Text size="sm" c="zinc.3">
          Esta unidad trae la carga de {tickets.length} proveedores. Seleccione
          el proveedor para generar e imprimir su ticket de ingreso:
        </Text>
        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
          {tickets.map((t) => (
            <div
              key={t.id_proveedor}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Text size="xs" fw={700} c="white">
                    {t.razon_social}
                  </Text>
                  {t.ruc && (
                    <Text size="xs" c="zinc.4" className="font-mono">
                      RUC: {t.ruc}
                    </Text>
                  )}
                  {t.con_no_conformidad && (
                    <Badge color="orange" size="xs" variant="light">
                      No Conformidad
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>
                    Guía Remitente:{" "}
                    <strong className="text-zinc-200 font-mono">
                      {t.guia_remitente || "—"}
                    </strong>
                  </span>
                  <span>
                    Guía Transp:{" "}
                    <strong className="text-zinc-200 font-mono">
                      {t.guia_transportista || "—"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>
                    P. Guía:{" "}
                    <strong className="text-zinc-200">
                      {fmtKg(t.peso_guia_remision)}
                    </strong>
                  </span>
                  <span>
                    P. Balanza:{" "}
                    <strong className="text-zinc-200">
                      {fmtKg(t.peso_vehicular_total)}
                    </strong>
                  </span>
                </div>
              </div>
              <Button
                size="xs"
                color="indigo"
                radius="lg"
                leftSection={<IconPrinter size={14} />}
                loading={idImprimiendo === t.id_proveedor}
                onClick={() => onSelect(t)}
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
