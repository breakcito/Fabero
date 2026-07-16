import { Stack, Group, TextInput, Select, Button, Loader } from "@mantine/core";
import { useRegistroConcesion } from "../hooks/useRegistroConcesion";
import type { RES_Concesion } from "../service/concesiones.responses";

interface RegistroConcesionProps {
  concesion?: RES_Concesion | null;
  onSuccess: (nueva: RES_Concesion) => void;
  onCancel: () => void;
}

export const RegistroConcesion = ({
  concesion,
  onSuccess,
  onCancel,
}: RegistroConcesionProps) => {
  const {
    form,
    setField,
    handleSubmit,
    loading,
    departamentos,
    provincias,
    distritos,
    loadingProvincias,
    loadingDistritos,
    handleDepartamentoChange,
    handleProvinciaChange,
  } = useRegistroConcesion(onSuccess, concesion);

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  const selectDepartamentos = departamentos.map((d) => ({
    value: String(d.id),
    label: d.nombre,
  }));

  const selectProvincias = provincias.map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }));

  const selectDistritos = distritos.map((d) => ({
    value: String(d.id),
    label: d.nombre,
  }));

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

      <TextInput
        label="Cod. REINFO"
        placeholder="Ej. REINFO-999"
        value={form.codigo_reinfo || ""}
        onChange={(e) => setField("codigo_reinfo", e.currentTarget.value)}
        classNames={fieldClasses}
        radius="lg"
        disabled={loading}
      />

      <Select
        label="Departamento"
        placeholder="Seleccione departamento"
        searchable
        disabled={loading}
        radius="lg"
        classNames={fieldClasses}
        data={selectDepartamentos}
        value={form.id_departamento ? String(form.id_departamento) : null}
        onChange={(val) => handleDepartamentoChange(val ? Number(val) : 0)}
        required
        withAsterisk
      />

      <Select
        label="Provincia"
        placeholder={form.id_departamento ? "Seleccione provincia" : "Seleccione primero un departamento"}
        searchable
        disabled={loading || !form.id_departamento || loadingProvincias}
        radius="lg"
        classNames={fieldClasses}
        data={selectProvincias}
        value={form.id_provincia ? String(form.id_provincia) : null}
        onChange={(val) => handleProvinciaChange(val ? Number(val) : 0)}
        rightSection={loadingProvincias ? <Loader size={16} /> : undefined}
        required
        withAsterisk
      />

      <Select
        label="Distrito"
        placeholder={form.id_provincia ? "Seleccione distrito" : "Seleccione primero una provincia"}
        searchable
        disabled={loading || !form.id_provincia || loadingDistritos}
        radius="lg"
        classNames={fieldClasses}
        data={selectDistritos}
        value={form.id_distrito ? String(form.id_distrito) : null}
        onChange={(val) => setField("id_distrito", val ? Number(val) : 0)}
        rightSection={loadingDistritos ? <Loader size={16} /> : undefined}
        required
        withAsterisk
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
