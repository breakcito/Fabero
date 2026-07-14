import { useState } from "react";
import { TextInput, Switch, Button, Group, Stack } from "@mantine/core";
import { GestionLeyesService } from "../../service/gestion-leyes.service";
import type { AnalitoResponse } from "../../service/gestion-leyes.responses";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalCrearAnalitoProps {
  opened: boolean;
  onClose: () => void;
  onAnalitoCreado?: (nuevo: AnalitoResponse) => void;
  onAsociar: (nuevo: AnalitoResponse) => void;
}

export const ModalCrearAnalito = ({
  opened,
  onClose,
  onAnalitoCreado,
  onAsociar,
}: ModalCrearAnalitoProps) => {
  const { notifySuccess, notifyError } = useNotify();

  const [nombreNuevoAnalito, setNombreNuevoAnalito] = useState("");
  const [desplegableNuevoAnalito, setDesplegableNuevoAnalito] = useState(false);
  const [asociarNuevoAnalito, setAsociarNuevoAnalito] = useState(true);
  const [creandoAnalito, setCreandoAnalito] = useState(false);

  const resetFields = () => {
    setNombreNuevoAnalito("");
    setDesplegableNuevoAnalito(false);
    setAsociarNuevoAnalito(true);
  };

  const handleCrearAnalitoRapido = async () => {
    const trimmed = nombreNuevoAnalito.trim();
    if (!trimmed) return;

    setCreandoAnalito(true);
    try {
      const nuevo = await GestionLeyesService.crearAnalito(trimmed, desplegableNuevoAnalito);

      if (asociarNuevoAnalito) {
        onAsociar(nuevo);
      }

      if (onAnalitoCreado) {
        onAnalitoCreado(nuevo);
      }

      notifySuccess(
        asociarNuevoAnalito
          ? "Analito creado y asociado correctamente"
          : "Analito creado correctamente"
      );

      resetFields();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error al crear el analito";
      notifyError(msg);
    } finally {
      setCreandoAnalito(false);
    }
  };

  const handleCancel = () => {
    resetFields();
    onClose();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleCancel}
      title="Crear Nuevo Analito"
      size="sm"
    >
      <Stack gap="md" className="p-1">
        <TextInput
          label="Nombre del Analito"
          placeholder="Ej. Cu, Zn..."
          value={nombreNuevoAnalito}
          onChange={(e) => setNombreNuevoAnalito(e.currentTarget.value)}
          required
          radius="lg"
          classNames={{
            label: "text-zinc-400 mb-1.5 font-medium text-sm",
            input:
              "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[42px] rounded-xl",
          }}
        />
        <Switch
          label="¿Es Desplegable?"
          checked={desplegableNuevoAnalito}
          onChange={(e) => setDesplegableNuevoAnalito(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            body: "items-center",
          }}
        />
        <Switch
          label="Asociar automáticamente a este grupo"
          checked={asociarNuevoAnalito}
          onChange={(e) => setAsociarNuevoAnalito(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            body: "items-center",
          }}
        />
        <Group justify="flex-end" gap="sm" className="mt-4">
          <Button
            variant="subtle"
            onClick={handleCancel}
            radius="lg"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrearAnalitoRapido}
            loading={creandoAnalito}
            radius="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Crear Analito
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
