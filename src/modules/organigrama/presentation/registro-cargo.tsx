import { Button, Group, TextInput, Stack, Select, Box, Text, Loader } from "@mantine/core";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import type { RES_Area } from "../service/organigrama.responses";

interface Props {
  nombre: string;
  setNombre: (v: string) => void;
  idArea: string | null;
  setIdArea: (v: string | null) => void;
  areas: RES_Area[];
  loading: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
  label: "text-zinc-300 font-medium mb-1",
  dropdown: "bg-zinc-900 border-zinc-800",
  option: "hover:bg-zinc-800 text-zinc-300 data-[selected]:bg-zinc-100 data-[selected]:text-zinc-900 rounded-md my-0.5",
};

export const RegistroCargo = ({
  nombre,
  setNombre,
  idArea,
  setIdArea,
  areas,
  loading,
  error,
  onSave,
  onCancel,
}: Props) => {
  const areasData = areas.map((a) => ({
    value: a.id_area.toString(),
    label: a.nombre,
  }));

  return (
    <Stack gap="md" className="animate-fade-in">
      {/* Header — Estilo unificado */}
      <Group gap="sm" align="center" mb="xs">
        <Box className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-4 h-4 text-emerald-400" />
        </Box>
        <Stack gap={0}>
          <Text size="xs" fw={700} className="text-zinc-300 uppercase tracking-wider">
            Nuevo Cargo / Puesto
          </Text>
          <Text size="xs" className="text-zinc-500">
            Asigna un nuevo rol dentro de un área específica
          </Text>
        </Stack>
      </Group>

      <Select
        label="Área Perteneciente"
        placeholder="Seleccione el área..."
        required
        withAsterisk
        disabled={loading}
        rightSection={loading ? <Loader size={16} /> : undefined}
        radius="lg"
        classNames={fieldClasses}
        data={areasData}
        value={idArea}
        onChange={setIdArea}
        searchable
        nothingFoundMessage="No hay áreas disponibles"
      />

      <TextInput
        label="Nombre del Cargo"
        placeholder="Ej. Jefe de Almacén, Operario A..."
        required
        withAsterisk
        disabled={loading}
        radius="lg"
        classNames={fieldClasses}
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
      />

      {error && (
        <Text size="xs" className="text-red-400 font-medium px-1">
          {error}
        </Text>
      )}

      <Group justify="flex-end" gap="md" mt="xl">
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={loading}
          radius="lg"
          size="sm"
          className="text-zinc-400 hover:text-white"
        >
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          loading={loading}
          disabled={!nombre.trim() || !idArea}
          radius="lg"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 px-8"
        >
          Guardar Cargo
        </Button>
      </Group>
    </Stack>
  );
};
