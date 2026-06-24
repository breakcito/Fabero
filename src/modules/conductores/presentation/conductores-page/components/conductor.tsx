import {
  Badge,
  ActionIcon,
  Tooltip,
  Group,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconPencil, IconPower, IconUser } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../../presentation/utils/datatable-estandar";
import type { RES_Conductor } from "../../../service/conductores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  conductores: RES_Conductor[];
  loading: boolean;
  togglingIds: Record<number, boolean>;
  onEdit: (conductor: RES_Conductor) => void;
  onToggleEstado: (id: number, currentEstado: EstadoBase) => void;
}

export const Conductor = ({
  conductores,
  loading,
  togglingIds,
  onEdit,
  onToggleEstado,
}: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id_conductor"
      records={conductores}
      loading={loading}
      columns={[
        {
          accessor: "index",
          title: "#",
          textAlign: "center",
          width: 50,
        },
        {
          accessor: "nombre",
          title: "Conductor",
          width: 250,
          render: (r: RES_Conductor) => (
            <Group gap="sm">
              <ThemeIcon variant="light" color="indigo" radius="xl" size="lg">
                <IconUser className="w-5 h-5" />
              </ThemeIcon>
              <Text size="sm" fw={500} className="text-zinc-200">
                {r.nombre} {r.apellido}
              </Text>
            </Group>
          ),
        },
        {
          accessor: "dni",
          title: "DNI",
          width: 120,
          render: (r: RES_Conductor) => (
            <Text size="sm" className="text-zinc-300 font-mono">
              {r.dni}
            </Text>
          ),
        },
        {
          accessor: "numero_licencia",
          title: "Nro. Licencia",
          width: 180,
          render: (r: RES_Conductor) => (
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
          render: (r: RES_Conductor) => (
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
          render: (r: RES_Conductor) => {
            const isToggling = !!togglingIds[r.id_conductor];
            return (
              <Group gap="xs" justify="center" wrap="nowrap">
                <Tooltip label="Editar Conductor" withArrow>
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

                <Tooltip
                  label={
                    r.estado === EstadoBase.Activo
                      ? "Inactivar Conductor"
                      : "Activar Conductor"
                  }
                  withArrow
                >
                  <ActionIcon
                    variant="subtle"
                    color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                    radius="xl"
                    size="sm"
                    loading={isToggling}
                    onClick={() => onToggleEstado(r.id_conductor, r.estado)}
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
