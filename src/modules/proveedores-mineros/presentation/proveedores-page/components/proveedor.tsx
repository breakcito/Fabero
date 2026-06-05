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
  IconUser,
  IconPencil,
  
  IconPower,
  IconMapPin,
} from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { ProveedorResponse } from "../../../service/proveedores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  proveedores: ProveedorResponse[];
  loading: boolean;
  onOpenCuentas: (proveedor: ProveedorResponse) => void;
  onOpenConcesiones: (proveedor: ProveedorResponse) => void;
  onEdit: (proveedor: ProveedorResponse) => void;
  onDelete: (id: number) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Proveedor = ({
  proveedores,
  loading,
  onOpenCuentas,
  onOpenConcesiones,
  onEdit,

  onToggleEstado,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id_proveedor"
      records={proveedores}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
          render: (_: ProveedorResponse, index: number) => index + 1,
        },
        {
          accessor: "razon_social",
          title: "Proveedor",
          width: 280,
          render: (r: ProveedorResponse) => (
            <Group gap="sm">
              <ThemeIcon
                variant="light"
                color={r.tipo_entidad === "Persona Natural" ? "cyan" : "indigo"}
                radius="xl"
                size="lg"
              >
                {r.tipo_entidad === "Persona Natural" ? (
                  <IconUser className="w-5 h-5" />
                ) : (
                  <IconBuilding className="w-5 h-5" />
                )}
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500} className="text-zinc-200">
                  {r.razon_social}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  {r.tipo_entidad}
                  {r.ruc && ` · RUC: ${r.ruc}`}
                  {r.dni && ` · DNI: ${r.dni}`}
                </Text>
              </div>
            </Group>
          ),
        },
        {
          accessor: "cantidad_cuentas_bancarias",
          title: "Cuentas",
          width: 150,
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Badge
                color={r.cantidad_cuentas_bancarias > 0 ? "blue" : "gray"}
                variant="light"
                size="sm"
                radius="xl"
              >
                {r.cantidad_cuentas_bancarias === 1
                  ? "1 cuenta"
                  : `${r.cantidad_cuentas_bancarias} cuentas`}
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
          accessor: "direccion",
          title: "Dirección",
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Text
              size="sm"
              className="text-zinc-400 mx-3.5 text-center"
              lineClamp={1}
            >
              {r.direccion || "—"}
            </Text>
          ),
        },
        {
          accessor: "telefono",
          title: "Teléfono",
          render: (r: ProveedorResponse) => (
            <Text size="sm" className="text-zinc-300">
              {r.telefono || "—"}
            </Text>
          ),
        },
        {
          accessor: "correo",
          title: "Correo",
          render: (r: ProveedorResponse) => (
            <Text size="sm" className="text-zinc-400">
              {r.correo || "—"}
            </Text>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 100,
          textAlign: "center",
          render: (r: ProveedorResponse) => (
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
          width: 200,
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Tooltip label="Gestionar Concesiones" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="teal"
                  radius="xl"
                  size="sm"
                  onClick={() => onOpenConcesiones(r)}
                >
                  <IconMapPin size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Editar Proveedor" withArrow>
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

              <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Proveedor" : "Activar Proveedor"} withArrow>
                <ActionIcon
                  variant="subtle"
                  color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                  radius="xl"
                  size="sm"
                  onClick={() => onToggleEstado(r.id_proveedor, r.estado as EstadoBase)}
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
