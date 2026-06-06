import { Stack, Group, TextInput, Button } from "@mantine/core";
import { useEncargadosMuestra } from "../../hooks/useEncargadosMuestra";
import type { RES_EncargadoMuestra } from "../../service/encargados-muestra.responses";

interface RegistroEncargadoMuestraProps {
  encargado?: RES_EncargadoMuestra | null;
  onSuccess: (nueva: RES_EncargadoMuestra) => void;
  onCancel: () => void;
}

export const RegistroEncargadoMuestra = ({
  encargado,
  onSuccess,
  onCancel,
}: RegistroEncargadoMuestraProps) => {
  const { form, setField, handleSubmit, loading } = useEncargadosMuestra(
    onSuccess,
    encargado
  );

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  return (
    <Stack gap="md">
      <Group grow gap="md">
        <TextInput
          label="Nombres"
          placeholder="Ej. Juan Carlos"
          value={form.nombre}
          onChange={(e) => setField("nombre", e.currentTarget.value)}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
        <TextInput
          label="Apellidos"
          placeholder="Ej. Pérez Quispe"
          value={form.apellido}
          onChange={(e) => setField("apellido", e.currentTarget.value)}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
      </Group>

      <TextInput
        label="DNI"
        placeholder="Ej. 12345678"
        value={form.dni || ""}
        maxLength={8}
        onChange={(e) => {
          const val = e.currentTarget.value.replace(/\D/g, "");
          setField("dni", val || null);
        }}
        classNames={fieldClasses}
        radius="lg"
        disabled={loading}
      />

      <TextInput
        label="RUC"
        placeholder="Ej. 10123456789"
        value={form.ruc || ""}
        maxLength={11}
        onChange={(e) => {
          const val = e.currentTarget.value.replace(/\D/g, "");
          setField("ruc", val || null);
        }}
        classNames={fieldClasses}
        radius="lg"
        disabled={loading}
      />

      <Group justify="flex-end" gap="md" mt="xl">
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={loading}
          radius="lg"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          Cancelar
        </Button>
        <Button
          loading={loading}
          onClick={handleSubmit}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
        >
          Guardar
        </Button>
      </Group>
    </Stack>
  );
};
