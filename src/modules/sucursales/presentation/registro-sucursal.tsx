import { Button, Group, TextInput, Stack, Select } from "@mantine/core";
import type { RES_Departamento, RES_Provincia, RES_Distrito } from "../service/sucursales.responses";

interface RegistroSucursalProps {
  nombre: string;
  setNombre: (val: string) => void;
  idDepartamento: number | null;
  setIdDepartamento: (val: number | null) => void;
  idProvincia: number | null;
  setIdProvincia: (val: number | null) => void;
  idDistrito: number | null;
  setIdDistrito: (val: number | null) => void;
  direccion: string;
  setDireccion: (val: string) => void;
  telefono: string;
  setTelefono: (val: string) => void;

  departamentos: RES_Departamento[];
  provincias: RES_Provincia[];
  distritos: RES_Distrito[];

  loading: boolean;
  loadingProvincias: boolean;
  loadingDistritos: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}

export const RegistroSucursal = ({
  nombre,
  setNombre,
  idDepartamento,
  setIdDepartamento,
  idProvincia,
  setIdProvincia,
  idDistrito,
  setIdDistrito,
  direccion,
  setDireccion,
  telefono,
  setTelefono,
  departamentos,
  provincias,
  distritos,
  loading,
  loadingProvincias,
  loadingDistritos,
  error,
  onSave,
  onCancel,
}: RegistroSucursalProps) => {
  const inputClasses = {
    input: `bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 
    focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all`,
    label: "text-zinc-300 mb-1 font-medium",
  };

  // Mapear colecciones a formato Mantine Select ({ value, label })
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
        label="Nombre de la Sucursal"
        placeholder="Ej. Oficina Principal - Arequipa"
        required
        withAsterisk
        disabled={loading}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
      />

      <Select
        label="Departamento"
        placeholder="Seleccione departamento"
        searchable
        disabled={loading}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        data={selectDepartamentos}
        value={idDepartamento ? String(idDepartamento) : null}
        onChange={(val) => setIdDepartamento(val ? Number(val) : null)}
      />

      <Select
        label="Provincia"
        placeholder={idDepartamento ? "Seleccione provincia" : "Seleccione primero un departamento"}
        searchable
        disabled={loading || !idDepartamento || loadingProvincias}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        data={selectProvincias}
        value={idProvincia ? String(idProvincia) : null}
        onChange={(val) => setIdProvincia(val ? Number(val) : null)}
      />

      <Select
        label="Distrito"
        placeholder={idProvincia ? "Seleccione distrito" : "Seleccione primero una provincia"}
        searchable
        disabled={loading || !idProvincia || loadingDistritos}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        data={selectDistritos}
        value={idDistrito ? String(idDistrito) : null}
        onChange={(val) => setIdDistrito(val ? Number(val) : null)}
      />

      <TextInput
        label="Dirección"
        placeholder="Ej. Av. Ejército 1234"
        disabled={loading}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        value={direccion}
        onChange={(e) => setDireccion(e.currentTarget.value)}
      />

      <TextInput
        label="Teléfono"
        placeholder="Ej. (054) 123456 o 987654321"
        disabled={loading}
        radius="lg"
        size="xs"
        classNames={inputClasses}
        value={telefono}
        onChange={(e) => setTelefono(e.currentTarget.value)}
      />

      {error && (
        <div className="text-red-500 text-sm font-medium px-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <Group justify="flex-end" gap="md" mt="xl">
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={loading}
          radius="lg"
          size="xs"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          Cancelar
        </Button>
        <Button
          loading={loading}
          onClick={onSave}
          radius="lg"
          size="xs"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 border-0 px-8"
        >
          Registrar Sucursal
        </Button>
      </Group>
    </Stack>
  );
};
