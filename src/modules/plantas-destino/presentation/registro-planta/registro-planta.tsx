import { IconDeviceFloppy, IconExclamationCircle } from "@tabler/icons-react";
import { Button, Grid, TextInput, Alert } from "@mantine/core";
import { useRegistroPlanta } from "../../hooks/useRegistroPlanta";
import type { PlantaDestinoResponse } from "../../service/plantas-destino.responses";

interface Props {
  planta?: PlantaDestinoResponse | null;
  onCancel: () => void;
  onSuccess: (p: PlantaDestinoResponse) => void;
}

export const RegistroPlanta = ({ planta, onCancel, onSuccess }: Props) => {
  const { payload, handleChange, submit, loading, error } =
    useRegistroPlanta((p) => {
      onSuccess(p);
    }, planta);

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
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            withAsterisk
            label="RUC"
            placeholder="20345678901"
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
              label: "text-zinc-400 font-medium text-xs",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TextInput
            label="Razón Social"
            placeholder="Ej. Planta de Beneficio Metalúrgica SAC"
            radius="xl"
            withAsterisk
            value={payload.razon_social || ""}
            onChange={(e) => handleChange("razon_social", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInput
            label="Dirección Principal"
            placeholder="Av. Las Plantas 456, Distrito Industrial"
            radius="xl"
            value={payload.direccion || ""}
            onChange={(e) => handleChange("direccion", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Teléfono"
            placeholder="Opcional"
            radius="xl"
            value={payload.telefono || ""}
            onChange={(e) => handleChange("telefono", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Correo Electrónico"
            placeholder="Opcional"
            radius="xl"
            value={payload.correo || ""}
            onChange={(e) => handleChange("correo", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs",
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
          {planta ? "Actualizar Planta" : "Guardar Planta"}
        </Button>
      </div>
    </form>
  );
};
