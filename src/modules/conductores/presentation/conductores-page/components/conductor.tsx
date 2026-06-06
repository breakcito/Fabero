import { Badge, ActionIcon, Tooltip, Group, Text, ThemeIcon } from "@mantine/core";
import { IconPencil, IconPower, IconUser } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { ConductorResponse } from "../../../service/conductores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  conductores: ConductorResponse[];
  loading: boolean;
  onEdit: (conductor: ConductorResponse) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Conductor = ({
  conductores,
  loading,
  onEdit,
  onToggleEstado,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={conductores}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
          render: (_: ConductorResponse, index: number) => index + 1,
        },
        {
          accessor: "nombre",
          title: "Conductor",
          width: 250,
          render: (r: ConductorResponse) => (
            <Group gap="sm">
              <ThemeIcon variant="light" color="indigo" radius="xl" size="lg">
                <IconUser className="w-5 h-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500} className="text-zinc-200">
                  {r.nombre} {r.apellido}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  DNI: {r.dni}
                </Text>
              </div>
            </Group>
          ),
        },
        {
          accessor: "ruc",
          title: "RUC",
          width: 150,
          render: (r: ConductorResponse) => (
            <Text size="sm" className="text-zinc-300">
              {r.ruc || "—"}
            </Text>
          ),
        },
        {
          accessor: "numero_licencia",
          title: "Nro. Licencia",
          width: 180,
          render: (r: ConductorResponse) => (
            <Text size="sm" className="text-zinc-300" fw={500}>
              {r.numero_licencia}
            </Text>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 120,
          textAlign: "center",
          render: (r: ConductorResponse) => (
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
          render: (r: ConductorResponse) => (
            <Group gap="xs" justify="center" wrap="nowrap">
              <Tooltip label="Editar Conductor" withArrow>
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

              <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Conductor" : "Activar Conductor"} withArrow>
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
