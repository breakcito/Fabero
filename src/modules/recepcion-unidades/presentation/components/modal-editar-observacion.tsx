import { useState, useEffect } from "react";
import { Stack, Group, Button, Textarea, TextInput, Loader } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/**
 * Edición de la observación de una recepción (y su motivo, que queda
 * registrado en el historial de cambios).
 *
 * Las evidencias se gestionan aparte, desde el 📎 de la columna Acciones.
 */
export const ModalEditarObservacion = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [observacion, setObservacion] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [initializedId, setInitializedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recepcion === null) return;
    if (initializedId !== recepcion.id) {
      setObservacion(recepcion.observacion ?? "");
      setMotivo("");
      setInitializedId(recepcion.id);
    }
  }, [recepcion, initializedId]);

  useEffect(() => {
    if (!opened) {
      setInitializedId(null);
    }
  }, [opened]);

  const hayCambios =
    (observacion ?? "") !== (recepcion?.observacion ?? "") ||
    motivo.trim().length > 0;

  const handleGuardar = async () => {
    if (!recepcion) return;
    setLoading(true);
    try {
      const actualizada = await RecepcionUnidadesService.actualizarObservacionEvidencias(
        recepcion.id,
        {
          observacion: observacion.trim().length > 0 ? observacion.trim() : null,
          observacion_salida: recepcion.observacion_salida ?? null,
          motivo: motivo.trim().length > 0 ? motivo.trim() : null,
        },
      );
      notifySuccess("Observación actualizada");
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError("No se pudo actualizar la observación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened && recepcion !== null}
      close={onClose}
      title="Editar Observación"
      size="lg"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage="Tienes cambios sin guardar en la observación."
    >
      {!recepcion ? (
        <div className="py-8 text-center">
          <Loader size="sm" color="indigo" />
        </div>
      ) : (
        <Stack gap="md">
          <Textarea
            label="Observación"
            placeholder="Escribe una observación (opcional)"
            value={observacion}
            onChange={(e) => setObservacion(e.currentTarget.value)}
            minRows={4}
            maxRows={10}
            autosize
            size="md"
            radius="lg"
            disabled={loading}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
              label: "text-zinc-200 mb-1.5 font-semibold text-sm",
            }}
          />

          <TextInput
            label="Motivo del cambio"
            description="Se registra en el historial de cambios."
            placeholder="Describe brevemente el motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            size="md"
            radius="lg"
            disabled={loading}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
              label: "text-zinc-200 mb-1.5 font-semibold text-sm",
            }}
          />

          <Group justify="flex-end" gap="md" mt="sm">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={loading}
              radius="lg"
              size="md"
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              loading={loading}
              onClick={handleGuardar}
              radius="lg"
              size="md"
              leftSection={<IconDeviceFloppy size={18} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6"
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      )}
    </ModalEstandar>
  );
};
