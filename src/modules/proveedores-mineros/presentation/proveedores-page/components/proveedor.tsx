import {
  Badge,
  ActionIcon,
  Tooltip,
  Group,
  Text,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconPencil,
  IconPower,
  IconMapPin,
  IconAddressBook,
} from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { ProveedorResponse } from "../../../service/proveedores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  proveedores: ProveedorResponse[];
  loading: boolean;
  togglingIds: Record<number, boolean>;
  onOpenCuentas: (proveedor: ProveedorResponse) => void;
  onOpenConcesiones: (proveedor: ProveedorResponse) => void;
  onOpenContactos: (proveedor: ProveedorResponse) => void;
  onEdit: (proveedor: ProveedorResponse) => void;
  onDelete: (id: number) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Proveedor = ({
  proveedores,
  loading,
  togglingIds,
  onOpenCuentas,
  onOpenConcesiones,
  onOpenContactos,
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
          width: 300,
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <div className="min-w-0 space-y-1.5">
              <Tooltip label={r.razon_social} withArrow>
                <Text
                  size="sm"
                  fw={500}
                  lineClamp={1}
                  className="text-zinc-100 cursor-default"
                >
                  {r.razon_social}
                </Text>
              </Tooltip>
              <Group gap={6} wrap="nowrap" justify="center">
                <Badge
                  variant="light"
                  color="indigo"
                  size="md"
                  radius="md"
                  className="w-fit"
                >
                  {r.tipo_entidad}
                </Badge>
                {r.ruc && (
                  <Badge
                    variant="light"
                    color="teal"
                    size="md"
                    radius="md"
                    className="font-mono w-fit"
                  >
                    RUC: {r.ruc}
                  </Badge>
                )}
                {r.dni && (
                  <Badge
                    variant="light"
                    color="teal"
                    size="md"
                    radius="md"
                    className="font-mono w-fit"
                  >
                    DNI: {r.dni}
                  </Badge>
                )}
              </Group>
            </div>
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
          accessor: "cantidad_contactos",
          title: "Contactos",
          width: 150,
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Badge
                color={r.cantidad_contactos > 0 ? "indigo" : "gray"}
                variant="light"
                size="sm"
                radius="xl"
              >
                {r.cantidad_contactos === 1
                  ? "1 contacto"
                  : `${r.cantidad_contactos} contactos`}
              </Badge>
              <Tooltip label="Gestionar Contactos" withArrow position="left">
                <ActionIcon
                  variant="subtle"
                  color="indigo"
                  radius="xl"
                  size="sm"
                  onClick={() => onOpenContactos(r)}
                >
                  <IconAddressBook size={16} stroke={1.5} />
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
            <Tooltip
              label={r.direccion || ""}
              withArrow
              disabled={!r.direccion}
            >
              <Text
                size="sm"
                className="text-zinc-400 mx-3.5 text-center"
                lineClamp={1}
              >
                {r.direccion || "—"}
              </Text>
            </Tooltip>
          ),
        },
        {
          accessor: "telefono",
          title: "Teléfono",
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Text size="sm" className="text-zinc-300 text-center">
              {r.telefono || "—"}
            </Text>
          ),
        },
        {
          accessor: "correo",
          title: "Correo",
          textAlign: "center",
          render: (r: ProveedorResponse) => (
            <Tooltip
              label={r.correo || ""}
              withArrow
              disabled={!r.correo}
            >
              <Text
                size="sm"
                className="text-zinc-400 text-center"
                lineClamp={1}
              >
                {r.correo || "—"}
              </Text>
            </Tooltip>
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
          render: (r: ProveedorResponse) => {
            const isToggling = !!togglingIds[r.id_proveedor];
            return (
              <Group gap="xs" justify="center" wrap="nowrap">
                <Tooltip label="Gestionar Concesiones" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="teal"
                    radius="xl"
                    size="sm"
                    disabled={isToggling}
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
                    disabled={isToggling}
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
                    loading={isToggling}
                    onClick={() => onToggleEstado(r.id_proveedor, r.estado as EstadoBase)}
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
