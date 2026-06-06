import { Badge, ActionIcon, Tooltip, Group, Text, ThemeIcon } from "@mantine/core";
import { IconBuilding, IconPencil, IconPower } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { EmpresaTransporteResponse } from "../../../service/empresas-transporte.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  empresas: EmpresaTransporteResponse[];
  loading: boolean;
  onEdit: (empresa: EmpresaTransporteResponse) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const EmpresaTransporte = ({
  empresas,
  loading,
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
          width: 280,
          render: (r: EmpresaTransporteResponse) => (
            <Group gap="sm">
              <ThemeIcon variant="light" color="indigo" radius="xl" size="lg">
                <IconBuilding className="w-5 h-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500} className="text-zinc-200">
                  {r.razon_social}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  RUC: {r.ruc} {r.dni ? `| DNI: ${r.dni}` : ""}
                </Text>
              </div>
            </Group>
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
          render: (r: EmpresaTransporteResponse) => (
            <Text size="sm" className="text-zinc-400 max-w-[200px]" truncate title={r.direccion || ""}>
              {r.direccion || "—"}
            </Text>
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
          render: (r: EmpresaTransporteResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Tooltip label="Editar Empresa" withArrow>
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

              <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Empresa" : "Activar Empresa"} withArrow>
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
