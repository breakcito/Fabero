import { IconDeviceFloppy, IconExclamationCircle } from "@tabler/icons-react";
import { Button, Grid, TextInput, Alert } from "@mantine/core";
import { useRegistroConductor } from "../../hooks/useRegistroConductor";
import type { RES_Conductor } from "../../service/conductores.responses";

interface Props {
  conductor?: RES_Conductor | null;
  onCancel: () => void;
  onSuccess: (c: RES_Conductor) => void;
}

export const RegistroConductor = ({
  conductor,
  onCancel,
  onSuccess,
}: Props) => {
  const { payload, handleChange, submit, loading, error } =
    useRegistroConductor((c) => {
      onSuccess(c);
    }, conductor);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {error && (
        <Alert
          icon={<IconExclamationCircle size={16} />}
          color="red"
          variant="filled"
          className="mb-2"
        >
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            withAsterisk
            label="DNI"
            placeholder="12345678"
            radius="xl"
            maxLength={8}
            value={payload.dni || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              handleChange("dni", val);
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="RUC (Opcional)"
            placeholder="10123456789"
            radius="xl"
            maxLength={11}
            value={payload.ruc || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              handleChange("ruc", val);
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Nombres"
            placeholder="Ej. Juan Carlos"
            radius="xl"
            withAsterisk
            value={payload.nombre || ""}
            onChange={(e) => handleChange("nombre", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Apellidos"
            placeholder="Ej. Pérez Quispe"
            radius="xl"
            withAsterisk
            value={payload.apellido || ""}
            onChange={(e) => handleChange("apellido", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInput
            label="Número de Licencia de Conducir"
            placeholder="Ej. Q12345678"
            radius="xl"
            withAsterisk
            value={payload.numero_licencia || ""}
            onChange={(e) => handleChange("numero_licencia", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
      </Grid>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
        <Button
          variant="subtle"
          color="gray"
          radius="xl"
          onClick={onCancel}
          classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          radius="xl"
          leftSection={<IconDeviceFloppy size={18} />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
        >
          {conductor ? "Actualizar Conductor" : "Guardar Conductor"}
        </Button>
      </div>
    </form>
  );
};
