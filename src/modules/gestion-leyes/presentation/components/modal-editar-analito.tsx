import { useState, useEffect } from "react";
import { TextInput, Switch, Button, Group, Stack } from "@mantine/core";
import type { AnalitoResponse } from "../../service/gestion-leyes.responses";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalEditarAnalitoProps {
  analito: AnalitoResponse | null;
  onClose: () => void;
  onSuccess: (id: number, nombre: string, esDesplegable: boolean) => Promise<boolean>;
}

export const ModalEditarAnalito = ({
  analito,
  onClose,
  onSuccess,
}: ModalEditarAnalitoProps) => {
  const [nombreEditarAnalito, setNombreEditarAnalito] = useState("");
  const [desplegableEditarAnalito, setDesplegableEditarAnalito] = useState(false);
  const [editandoAnalito, setEditandoAnalito] = useState(false);

  useEffect(() => {
    if (analito) {
      setNombreEditarAnalito(analito.nombre);
      setDesplegableEditarAnalito(analito.es_desplegable);
    }
  }, [analito]);

  const handleEditarAnalitoGuardar = async () => {
    if (!analito) return;
    const trimmed = nombreEditarAnalito.trim();
    if (!trimmed) return;

    setEditandoAnalito(true);
    try {
      const success = await onSuccess(analito.id, trimmed, desplegableEditarAnalito);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditandoAnalito(false);
    }
  };

  return (
    <ModalEstandar
      opened={!!analito}
      close={onClose}
      title="Editar Analito"
      size="sm"
    >
      <Stack gap="md" className="p-1">
        <TextInput
          label="Nombre del Analito"
          placeholder="Ej. Cu, Zn..."
          value={nombreEditarAnalito}
          onChange={(e) => setNombreEditarAnalito(e.currentTarget.value)}
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
          checked={desplegableEditarAnalito}
          onChange={(e) => setDesplegableEditarAnalito(e.currentTarget.checked)}
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
            onClick={onClose}
            radius="lg"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditarAnalitoGuardar}
            loading={editandoAnalito}
            radius="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
