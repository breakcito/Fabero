import { Button, Group, TextInput, Stack, Box, Text } from "@mantine/core";
import { RectangleGroupIcon } from "@heroicons/react/24/outline";

interface Props {
  nombre: string;
  setNombre: (v: string) => void;
  loading: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
  label: "text-zinc-300 font-medium mb-1",
};

export const RegistroArea = ({
  nombre,
  setNombre,
  loading,
  error,
  onSave,
  onCancel,
}: Props) => {
  return (
    <Stack gap="md" className="animate-fade-in">
      {/* Header — Estilo unificado */}
      <Group gap="sm" align="center">
        <Box className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <RectangleGroupIcon className="w-4 h-4 text-indigo-400" />
        </Box>
        <Text size="sm" className="text-zinc-500">
          Define un nuevo departamento en la empresa
        </Text>
      </Group>

      <TextInput
        label="Nombre"
        placeholder="Ej. Operaciones, Recursos Humanos..."
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
          disabled={!nombre.trim()}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
        >
          Guardar Área
        </Button>
      </Group>
    </Stack>
  );
};
