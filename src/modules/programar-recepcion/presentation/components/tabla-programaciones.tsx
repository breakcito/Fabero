import { Text, Badge, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconEdit, IconEye } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import { EstadoUnidad } from "../../../../shared/enums/_generic/estado-unidad";
import type { ProgramacionListItem } from "../../service/programar-recepcion.responses";

interface Props {
  programaciones: ProgramacionListItem[];
  loading: boolean;
  onEditar: (programacion: ProgramacionListItem) => void;
  onVerTicket: (programacion: ProgramacionListItem) => void;
  /** Id de la programación que se está cargando para editar (botón en carga). */
  editandoId?: number | null;
  /** Id de la programación cuyo ticket se está generando (botón en carga). */
  viendoTicketId?: number | null;
}

const formatFecha = (fechaStr: string | null | undefined) => {
  if (!fechaStr) return "—";
  try {
    const date = new Date(fechaStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return fechaStr;

    const pad = (num: number) => num.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return fechaStr;
  }
};

export const TablaProgramaciones = ({
  programaciones,
  loading,
  onEditar,
  onVerTicket,
  editandoId,
  viendoTicketId,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={programaciones}
      loading={loading}
      columns={[
        {
          accessor: "acciones",
          title: "Acciones",
          width: 110,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <Tooltip
              label={
                r.id_empleado_recepcion
                  ? "La programación ya fue confirmada y no admite cambios"
                  : "Editar programación"
              }
              withArrow
            >
              <ActionIcon
                variant="light"
                color="indigo"
                radius="lg"
                size="md"
                disabled={Boolean(r.id_empleado_recepcion)}
                loading={editandoId === r.id}
                onClick={() => onEditar(r)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          ),
        },
        {
          accessor: "ticket_correlativo",
          title: "Ticket",
          width: 170,
          textAlign: "center",
          render: (r: ProgramacionListItem) => {
            const tieneTicket = Boolean(
              r.id_ticket_recepcion_unidades && r.ticket_correlativo,
            );
            return (
              <Group gap={6} justify="center" wrap="nowrap">
                <Text
                  size="sm"
                  className="font-mono font-bold text-white"
                  title={r.ticket_correlativo ?? undefined}
                >
                  {r.ticket_correlativo ?? "—"}
                </Text>
                <Tooltip
                  label={
                    tieneTicket
                      ? "Ver ticket de ingreso"
                      : "El ticket de ingreso se genera al confirmar la llegada"
                  }
                  withArrow
                >
                  <ActionIcon
                    variant="light"
                    color="indigo"
                    radius="lg"
                    size="md"
                    disabled={!tieneTicket}
                    loading={viendoTicketId === r.id}
                    onClick={() => onVerTicket(r)}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            );
          },
        },
        {
          accessor: "fecha_estimada_llegada",
          title: "Fecha Estimada",
          width: 190,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <div className="flex flex-col items-center gap-0.5">
              <Text size="sm" className="text-white" fw={600}>
                {formatFecha(r.fecha_estimada_llegada)}
              </Text>
              <Text size="xs" className="text-zinc-400">
                Autorizó: {r.empleado_autoriza_nombre ?? "—"}
              </Text>
            </div>
          ),
        },
        {
          accessor: "vehiculo_placa",
          title: "Vehículo",
          width: 160,
          textAlign: "center",
          render: (r: ProgramacionListItem) => {
            if (!r.vehiculo_placa) {
              return (
                <Text size="sm" className="text-zinc-400 italic">
                  (sin asignar)
                </Text>
              );
            }
            return (
              <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                {r.vehiculo_placa}
              </div>
            );
          },
        },
        {
          accessor: "estado_unidad",
          title: "Estado Unidad",
          width: 140,
          textAlign: "center",
          render: (r: ProgramacionListItem) => {
            if (!r.estado) {
              return (
                <Text size="sm" className="text-zinc-400 italic">
                  —
                </Text>
              );
            }
            const enPlanta = r.estado === EstadoUnidad.EnPlanta;
            return (
              <Badge
                color={enPlanta ? "teal" : "orange"}
                variant="light"
                radius="md"
                size="sm"
              >
                {r.estado}
              </Badge>
            );
          },
        },
        {
          accessor: "empresa_transporte_razon_social",
          title: "Transportista",
          width: 220,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <Text
              size="sm"
              className="text-white"
              fw={600}
              truncate
              title={r.empresa_transporte_razon_social ?? ""}
            >
              {r.empresa_transporte_razon_social ?? "—"}
            </Text>
          ),
        },
        {
          accessor: "conductor_nombre_completo",
          title: "Conductor",
          width: 200,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <div className="flex flex-col items-center gap-0.5">
              <Text
                size="sm"
                className="text-white"
                fw={600}
                truncate
                title={r.conductor_nombre_completo ?? ""}
              >
                {r.conductor_nombre_completo ?? "—"}
              </Text>
              <Text size="xs" className="text-zinc-300">
                Licencia: {r.conductor_numero_licencia ?? "—"}
              </Text>
            </div>
          ),
        },
        {
          accessor: "proveedor_razon_social",
          title: "Proveedor",
          width: 200,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <Text
              size="sm"
              className="text-white"
              fw={500}
              truncate
              title={r.proveedor_razon_social ?? ""}
            >
              {r.proveedor_razon_social ?? "—"}
            </Text>
          ),
        },
        {
          accessor: "guia_remitente",
          title: "Guías",
          width: 200,
          textAlign: "center",
          render: (r: ProgramacionListItem) => (
            <div className="flex flex-col items-center gap-0.5">
              <Text size="sm" className="text-white">
                Remitente:{" "}
                <span className="font-mono font-semibold text-indigo-300">
                  {r.guia_remitente ?? "—"}
                </span>
              </Text>
              <Text size="sm" className="text-white">
                Transportista:{" "}
                <span className="font-mono font-semibold text-indigo-300">
                  {r.guia_transportista ?? "—"}
                </span>
              </Text>
            </div>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 130,
          textAlign: "center",
          render: (r: ProgramacionListItem) =>
            r.id_empleado_recepcion ? (
              <Badge color="indigo" variant="light" radius="md" size="sm">
                Confirmada
              </Badge>
            ) : (
              <Badge color="yellow" variant="light" radius="md" size="sm">
                Pendiente
              </Badge>
            ),
        },
      ]}
    />
  );
};
