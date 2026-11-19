import { Badge, ActionIcon, Tooltip, Group, Text } from "@mantine/core";
import { IconPencil, IconPower } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { EmpresaTransporteResponse } from "../../../service/empresas-transporte.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  empresas: EmpresaTransporteResponse[];
  loading: boolean;
  togglingIds: Record<number, boolean>;
  onEdit: (empresa: EmpresaTransporteResponse) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const EmpresaTransporte = ({
  empresas,
  loading,
  togglingIds,
  onEdit,
  onToggleEstado,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={empresas}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
          render: (_: EmpresaTransporteResponse, index: number) => index + 1,
        },
        {
          accessor: "razon_social",
          title: "Empresa de Transporte",
          width: 300,
          textAlign: "center",
          render: (r: EmpresaTransporteResponse) => (
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
          accessor: "tipo_entidad",
          title: "Tipo Entidad",
          width: 130,
          render: (r: EmpresaTransporteResponse) => (
            <Badge variant="dot" color="blue" size="sm">
              {r.tipo_entidad}
            </Badge>
          ),
        },
        {
          accessor: "direccion",
          title: "Dirección",
          textAlign: "center",
          render: (r: EmpresaTransporteResponse) => (
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
          width: 140,
          render: (r: EmpresaTransporteResponse) => (
            <Text size="sm" className="text-zinc-300">
              {r.telefono || "—"}
            </Text>
          ),
        },
        {
          accessor: "correo",
          title: "Correo",
          render: (r: EmpresaTransporteResponse) => (
            <Text size="sm" className="text-zinc-400 max-w-[150px]" truncate title={r.correo || ""}>
              {r.correo || "—"}
            </Text>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 100,
          textAlign: "center",
          render: (r: EmpresaTransporteResponse) => (
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
          render: (r: EmpresaTransporteResponse) => {
            const isToggling = !!togglingIds[r.id];
            return (
              <Group gap="xs" justify="center" wrap="nowrap">
                <Tooltip label="Editar Empresa" withArrow>
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

                <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Empresa" : "Activar Empresa"} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                    radius="xl"
                    size="sm"
                    loading={isToggling}
                    onClick={() => onToggleEstado(r.id, r.estado)}
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
