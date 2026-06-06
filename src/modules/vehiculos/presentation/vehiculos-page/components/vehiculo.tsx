import { Badge, ActionIcon, Tooltip, Group, Text, ThemeIcon } from "@mantine/core";
import { IconTruck, IconPencil, IconPower } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { VehiculoResponse } from "../../../service/vehiculos.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  vehiculos: VehiculoResponse[];
  loading: boolean;
  onEdit: (vehiculo: VehiculoResponse) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Vehiculo = ({
  vehiculos,
  loading,
  onEdit,
  onToggleEstado,
}: Props) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-PE").format(num);
  };

  return (
    <DataTableEstandar
      idAccessor="id"
      records={vehiculos}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
          render: (_: VehiculoResponse, index: number) => index + 1,
        },
        {
          accessor: "numero_placa",
          title: "Vehículo / Placa",
          width: 180,
          render: (r: VehiculoResponse) => (
            <Group gap="sm">
              <ThemeIcon variant="light" color="indigo" radius="xl" size="lg">
                <IconTruck className="w-5 h-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600} className="text-white">
                  {r.numero_placa}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  {r.serie_placa ? `Serie: ${r.serie_placa}` : "Sin Serie"}
                </Text>
              </div>
            </Group>
          ),
        },
        {
          accessor: "tipo_vehiculo_nombre",
          title: "Tipo / Marca",
          width: 200,
          render: (r: VehiculoResponse) => (
            <div>
              <Text size="sm" className="text-zinc-200" fw={500}>
                {r.tipo_vehiculo_nombre}
              </Text>
              <Text size="xs" className="text-zinc-500">
                Marca: {r.marca_nombre}
              </Text>
            </div>
          ),
        },
        {
          accessor: "empresa_transporte_razon_social",
          title: "Empresa de Transporte",
          width: 280,
          render: (r: VehiculoResponse) => (
            <div>
              <Text size="sm" className="text-zinc-200 max-w-[240px]" truncate title={r.empresa_transporte_razon_social}>
                {r.empresa_transporte_razon_social}
              </Text>
              <Text size="xs" className="text-zinc-500">
                RUC: {r.empresa_transporte_ruc}
              </Text>
            </div>
          ),
        },
        {
          accessor: "pesos",
          title: "Capacidad / Tara",
          width: 180,
          render: (r: VehiculoResponse) => (
            <div>
              <Text size="xs" className="text-zinc-300">
                Cap.: <strong className="text-indigo-400">{formatNumber(r.capacidad)} kg</strong>
              </Text>
              <Text size="xs" className="text-zinc-500">
                Tara: {formatNumber(r.tara)} kg
              </Text>
            </div>
          ),
        },
        {
          accessor: "dimensiones",
          title: "Dimensiones (L x An x Al)",
          width: 200,
          render: (r: VehiculoResponse) => {
            const hasDim = r.largo !== null || r.ancho !== null || r.alto !== null;
            return (
              <Text size="xs" className="text-zinc-400">
                {hasDim
                  ? `${r.largo || "—"} x ${r.ancho || "—"} x ${r.alto || "—"} m`
                  : "—"}
              </Text>
            );
          },
        },
        {
          accessor: "numero_constancia_mtc",
          title: "Constancia MTC",
          width: 150,
          render: (r: VehiculoResponse) => (
            <Text size="xs" className="text-zinc-400">
              {r.numero_constancia_mtc || "—"}
            </Text>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 100,
          textAlign: "center",
          render: (r: VehiculoResponse) => (
            <Badge
              color={r.estado === EstadoBase.Activo ? "green" : "gray"}
              variant="light"
              size="sm"
              radius="lg"
            >
              {r.estado}
            </Badge>
          ),
        },
        {
          accessor: "acciones",
          title: "Acciones",
          width: 120,
          textAlign: "center",
          render: (r: VehiculoResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Tooltip label="Editar Vehículo" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  radius="xl"
                  size="sm"
                  onClick={() => onEdit(r)}
                >
                  <IconPencil size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Vehículo" : "Activar Vehículo"} withArrow>
                <ActionIcon
                  variant="subtle"
                  color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                  radius="xl"
                  size="sm"
                  onClick={() => onToggleEstado(r.id, r.estado)}
                >
                  <IconPower size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ),
        },
      ]}
    />
  );
};
