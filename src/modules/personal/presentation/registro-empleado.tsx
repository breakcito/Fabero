import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Avatar,
  FileButton,
  Text,
} from "@mantine/core";
import {
  UserIcon,
  IdentificationIcon,
  BriefcaseIcon,
  PencilIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useRegistroEmpleado } from "../hooks/useRegistroEmpleado";
import type { RES_EmpleadoResumen } from "../service/empleados.responses";
import { CustomDatePicker } from "../../../presentation/utils/date-picker-input";

interface RegistroEmpleadoProps {
  onSuccess: (nuevo: RES_EmpleadoResumen) => void;
  onCancel: () => void;
}

export const RegistroEmpleado = ({
  onSuccess,
  onCancel,
}: RegistroEmpleadoProps) => {
  const {
    form,
    setField,
    idArea,
    setIdArea,
    empresas,
    areas,
    cargos,
    loading,
    loadingEmpresas,
    loadingAreas,
    loadingCargos,
    handleSubmit,
  } = useRegistroEmpleado(onSuccess);

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  const photoPreview =
    form.path_foto instanceof File ? URL.createObjectURL(form.path_foto) : null;

  return (
    <Stack gap="md">
      {/* Selector de Foto Circular */}
      <div className="flex flex-col items-center justify-center py-4">
        <FileButton
          onChange={(file) => setField("path_foto", file)}
          accept="image/png,image/jpeg,image/jpg"
        >
          {(props) => (
            <div
              {...props}
              className="relative cursor-pointer group rounded-full overflow-hidden border-2 border-indigo-500/30 bg-indigo-600/10 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-600/20"
              style={{ width: 110, height: 110 }}
            >
              <Avatar
                src={photoPreview}
                size={110}
                radius={100}
                className="bg-transparent"
              >
                <UserIcon className="w-10 h-10 text-indigo-400/40" />
              </Avatar>
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                <PencilIcon className="w-5 h-5 text-white mb-1 drop-shadow-md" />
                <Text size="10px" fw={700} className="text-white leading-tight">
                  {form.path_foto ? "Cambiar imagen" : "Subir imagen"}
                </Text>
              </div>
            </div>
          )}
        </FileButton>
      </div>

      {/* Nombres y Apellidos */}
      <Group grow align="flex-start" gap="md">
        <TextInput
          label="Nombres"
          placeholder="Ej. Juan"
          value={form.nombre}
          onChange={(e) => setField("nombre", e.currentTarget.value)}
          leftSection={<UserIcon className="w-4 h-4 text-zinc-500" />}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
        <TextInput
          label="Apellidos"
          placeholder="Ej. Pérez"
          value={form.apellido}
          onChange={(e) => setField("apellido", e.currentTarget.value)}
          leftSection={<UserIcon className="w-4 h-4 text-zinc-500" />}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={loading}
        />
      </Group>

      {/* DNI y Fecha de Nacimiento */}
      <Group grow align="flex-start" gap="md">
        <TextInput
          label="DNI"
          placeholder="Ej. 12345678"
          value={form.dni || ""}
          onChange={(e) =>
            setField("dni", e.currentTarget.value.replace(/\D/g, ""))
          }
          leftSection={<IdentificationIcon className="w-4 h-4 text-zinc-500" />}
          classNames={fieldClasses}
          radius="lg"
          maxLength={8}
          disabled={loading}
        />
        <CustomDatePicker
          label="Fecha de Nacimiento"
          placeholder="Seleccione fecha"
          value={form.fecha_nacimiento || null}
          onChange={(val: unknown) => setField("fecha_nacimiento", val)}
          disabled={loading}
        />
      </Group>

      {/* Empresa */}
      <Select
        label="Empresa"
        placeholder={
          loadingEmpresas ? "Cargando empresas..." : "Seleccione empresa"
        }
        data={empresas.map((e) => ({
          value: e.id_empresa.toString(),
          label: e.razon_social,
        }))}
        value={form.id_empresa === 0 ? null : form.id_empresa.toString()}
        onChange={(val) => setField("id_empresa", Number(val))}
        leftSection={<BuildingOfficeIcon className="w-4 h-4 text-zinc-500" />}
        classNames={fieldClasses}
        radius="lg"
        required
        withAsterisk
        searchable
        disabled={loadingEmpresas || loading}
      />

      {/* Área y Cargo en cascada */}
      <Group grow align="flex-start" gap="md">
        <Select
          label="Área"
          placeholder={loadingAreas ? "Cargando áreas..." : "Seleccione área"}
          data={areas.map((a) => ({
            value: a.id_area.toString(),
            label: a.nombre,
          }))}
          value={idArea?.toString() || null}
          onChange={(val) => setIdArea(Number(val))}
          leftSection={<BriefcaseIcon className="w-4 h-4 text-zinc-500" />}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          searchable
          disabled={loadingAreas || loading}
        />
        <Select
          label="Cargo"
          placeholder={
            loadingCargos
              ? "Cargando cargos..."
              : idArea
                ? "Seleccione cargo"
                : "Primero seleccione área"
          }
          data={cargos.map((c) => ({
            value: c.id_cargo.toString(),
            label: c.nombre,
          }))}
          value={form.id_cargo === 0 ? null : form.id_cargo.toString()}
          onChange={(val) => setField("id_cargo", Number(val))}
          leftSection={<BriefcaseIcon className="w-4 h-4 text-zinc-500" />}
          classNames={fieldClasses}
          radius="lg"
          required
          withAsterisk
          disabled={!idArea || loadingCargos || loading}
          searchable
        />
      </Group>

      {/* Acciones */}
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
