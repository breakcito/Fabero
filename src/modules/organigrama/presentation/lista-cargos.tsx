import { useState } from "react";
import {
  Button,
  TextInput,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Box,
  Group,
  Tooltip,
} from "@mantine/core";
import {
  PlusIcon,
  BriefcaseIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import type { RES_Cargo } from "../service/organigrama.responses";

interface Props {
  areaNombre: string;
  cargos: RES_Cargo[];
  loading: boolean;
  nombre: string;
  setNombre: (v: string) => void;
  loadingGuardar: boolean;
  onSave: () => void;
  error: string;
  onToggleStatus: (id: number) => Promise<void>;
}

const inputClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
};

export const ListaCargos = ({
  areaNombre,
  cargos,
  loading,
  nombre,
  setNombre,
  loadingGuardar,
  onSave,
  error,
  onToggleStatus,
}: Props) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleToggle = async (id: number) => {
    setUpdatingId(id);
    await onToggleStatus(id);
    setUpdatingId(null);
  };

  const columns = [
    {
      accessor: "index",
      title: "#",
      width: 60,
      textAlign: "center" as const,
    },
    {
      accessor: "nombre",
      title: "Cargo",
      render: (cargo: RES_Cargo) => (
        <Text size="sm" fw={600} className="text-zinc-200">
          {cargo.nombre}
        </Text>
      ),
    },
    {
      accessor: "estado",
      title: "Estado",
      width: 120,
      render: (cargo: RES_Cargo) => {
        const isActive = cargo.estado === "Activo";
        return (
          <Badge
            size="xs"
            variant="light"
            color={isActive ? "green" : "gray"}
            radius="sm"
          >
            {cargo.estado}
          </Badge>
        );
      },
    },
    {
      accessor: "id_cargo",
      title: "Acciones",
      textAlign: "right" as const,
      width: 100,
      render: (cargo: RES_Cargo) => {
        const isUpdating = updatingId === cargo.id_cargo;
        return (
          <Group justify="flex-end">
            <Tooltip label="Cambiar Estado" position="left" withArrow>
              <ActionIcon
                variant="subtle"
                color="indigo"
                size="sm"
                loading={isUpdating}
                disabled={isUpdating}
                onClick={() => handleToggle(cargo.id_cargo)}
              >
                <ArrowsRightLeftIcon className="w-4 h-4" />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  return (
    <Stack gap="lg" className="animate-fade-in">
      {/* SECCIÓN REGISTRO */}
      <Stack
        gap="md"
        className="p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl"
      >
        <Group gap="sm" align="center">
          <Box className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BriefcaseIcon className="w-4 h-4 text-indigo-400" />
          </Box>
          <Stack gap={0}>
            <Text
              size="xs"
              fw={700}
              className="text-zinc-300 uppercase tracking-wider"
            >
              Nuevo Cargo
            </Text>
            <Text size="xs" className="text-zinc-500">
              Área: {areaNombre}
            </Text>
          </Stack>
        </Group>

        <Group align="flex-end" gap="xs">
          <div className="flex flex-col flex-1 gap-1">
            <TextInput
              label="Nombre del Cargo"
              placeholder="Ingresar nombre del cargo..."
              className="flex-1"
              radius="lg"
              classNames={{
               ...inputClasses,
               label: "text-zinc-300 mb-1 font-medium text-xs ml-1"
              }}
              value={nombre}
              onChange={(e) => setNombre(e.currentTarget.value)}
              disabled={loadingGuardar}
            />
          </div>
          <Button
            size="sm"
            variant="filled"
            leftSection={<PlusIcon className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-6 h-9 shrink-0 flex items-center"
            radius="lg"
            onClick={onSave}
            loading={loadingGuardar}
            disabled={!nombre.trim()}
          >
            Añadir
          </Button>
        </Group>

        {error && (
          <Text size="xs" className="text-red-400 font-medium px-1">
            {error}
          </Text>
        )}
      </Stack>

      {/* SECCIÓN TABLA DE CARGOS */}
      <Stack gap="xs">
        <Text size="xs" fw={700} className="text-zinc-500 uppercase tracking-widest px-1">
          Lista de Cargos Registrados
        </Text>
        <DataTableEstandar
          idAccessor="id_cargo"
          columns={columns}
          records={cargos}
          loading={loading}
          initialPageSize={10}
        />
      </Stack>
    </Stack>
  );
};
