import { Stack, Group, TextInput, Select, Button } from "@mantine/core";
import { useRegistroConcesion } from "../hooks/useRegistroConcesion";
import type { RES_Concesion } from "../service/concesiones.responses";
import { TipoMineral } from "../../../shared/enums/_generic/tipo-mineral";

interface RegistroConcesionProps {
  onSuccess: (nueva: RES_Concesion) => void;
  onCancel: () => void;
}

export const RegistroConcesion = ({
  onSuccess,
  onCancel,
}: RegistroConcesionProps) => {
  const { form, setField, handleSubmit, loading } =
    useRegistroConcesion(onSuccess);

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Nombre"
        placeholder="Ej. Santa Rosa"
        value={form.nombre}
        onChange={(e) => setField("nombre", e.currentTarget.value)}
        classNames={fieldClasses}
        radius="lg"
        required
        withAsterisk
        disabled={loading}
      />

      <Group grow align="flex-start" gap="md">
        <TextInput
          label="Código"
          placeholder="Ej. COD-12345"
          value={form.codigo_concesion}
          onChange={(e) => setField("codigo_concesion", e.currentTarget.value)}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
        <TextInput
          label="Cod. REINFO"
          placeholder="Ej. REINFO-999"
          value={form.codigo_reinfo || ""}
          onChange={(e) => setField("codigo_reinfo", e.currentTarget.value)}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
      </Group>

      <Select
        label="Tipo de Mineral"
        placeholder="Seleccionar tipo de mineral"
        data={Object.values(TipoMineral)}
        value={form.tipo_mineral}
        onChange={(val) => setField("tipo_mineral", val)}
        classNames={fieldClasses}
        radius="lg"
        required
        withAsterisk
        disabled={loading}
        searchable
      />

      <TextInput
        label="Ubicación (Ubigeo/Coordenadas)"
        placeholder="Ej. -12.043, -77.028"
        value={form.ubigeo || ""}
        onChange={(e) => setField("ubigeo", e.currentTarget.value)}
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
