import {
  Badge,
  ActionIcon,
  Tooltip,
  Group,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconBuilding,
  IconPencil,
  IconPower,
  IconUserCheck,
} from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { PlantaDestinoResponse } from "../../../service/plantas-destino.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  plantas: PlantaDestinoResponse[];
  loading: boolean;
  togglingIds: Record<number, boolean>;
  onOpenCuentas: (planta: PlantaDestinoResponse) => void;
  onOpenProveedores: (planta: PlantaDestinoResponse) => void;
  onEdit: (planta: PlantaDestinoResponse) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Planta = ({
  plantas,
  loading,
  togglingIds,
  onOpenCuentas,
  onOpenProveedores,
  onEdit,
  onToggleEstado,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={plantas}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
          render: (_: PlantaDestinoResponse, index: number) => index + 1,
        },
        {
          accessor: "razon_social",
          title: "Planta Destino",
          width: 280,
          render: (r: PlantaDestinoResponse) => (
            <Group gap="sm">
              <ThemeIcon
                variant="light"
                color="indigo"
                radius="xl"
                size="lg"
              >
                <IconBuilding className="w-5 h-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500} className="text-zinc-200">
                  {r.razon_social}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  RUC: {r.ruc}
                </Text>
              </div>
            </Group>
          ),
        },
        {
          accessor: "cantidad_cuentas",
          title: "Cuentas",
          width: 150,
          textAlign: "center",
          render: (r: PlantaDestinoResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Badge
                color={r.cantidad_cuentas > 0 ? "blue" : "gray"}
                variant="light"
                size="sm"
                radius="xl"
              >
                {r.cantidad_cuentas === 1
                  ? "1 cuenta"
                  : `${r.cantidad_cuentas} cuentas`}
              </Badge>
              <Tooltip label="Gestionar Cuentas" withArrow position="left">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  radius="xl"
                  size="sm"
                  onClick={() => onOpenCuentas(r)}
                >
                  <IconBuildingBank size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ),
        },
        {
          accessor: "cantidad_proveedores",
          title: "Proveedores",
          width: 160,
          textAlign: "center",
          render: (r: PlantaDestinoResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Badge
                color={r.cantidad_proveedores > 0 ? "teal" : "gray"}
                variant="light"
                size="sm"
                radius="xl"
              >
                {r.cantidad_proveedores === 1
                  ? "1 proveedor"
                  : `${r.cantidad_proveedores} proveedores`}
              </Badge>
              <Tooltip label="Asociar Proveedores" withArrow position="left">
                <ActionIcon
                  variant="subtle"
                  color="teal"
                  radius="xl"
                  size="sm"
                  onClick={() => onOpenProveedores(r)}
                >
                  <IconUserCheck size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ),
        },
        {
          accessor: "direccion",
          title: "Dirección",
          render: (r: PlantaDestinoResponse) => (
            <Text
              size="sm"
              className="text-zinc-400 max-w-[200px]"
              truncate
              title={r.direccion || ""}
            >
              {r.direccion || "—"}
            </Text>
          ),
        },
        {
          accessor: "telefono",
          title: "Teléfono",
          render: (r: PlantaDestinoResponse) => (
            <Text size="sm" className="text-zinc-300">
              {r.telefono || "—"}
            </Text>
          ),
        },
        {
          accessor: "correo",
          title: "Correo",
          render: (r: PlantaDestinoResponse) => (
            <Text
              size="sm"
              className="text-zinc-400 max-w-[150px]"
              truncate
              title={r.correo || ""}
            >
              {r.correo || "—"}
            </Text>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 100,
          textAlign: "center",
          render: (r: PlantaDestinoResponse) => (
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
          render: (r: PlantaDestinoResponse) => {
            const isToggling = !!togglingIds[r.id];
            return (
              <Group gap="xs" justify="center" wrap="nowrap">
                <Tooltip label="Editar Planta" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    radius="xl"
                    size="sm"
                    disabled={isToggling}
                    onClick={() => onEdit(r)}
                  >
                    <IconPencil size={16} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Planta" : "Activar Planta"} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                    radius="xl"
                    size="sm"
                    loading={isToggling}
                    onClick={() => onToggleEstado(r.id, r.estado as EstadoBase)}
                  >
                    <IconPower size={16} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            );
          },
        },
      ]}
    />
  );
};
