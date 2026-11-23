import { useState, useEffect } from "react";
import { Stack, Group, Button, Textarea, Loader } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  /** Campo a editar: observación de ingreso o de salida. */
  campo?: CampoObservacion;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/** Campos de observación editables de una recepción de unidad. */
export type CampoObservacion = "observacion" | "observacion_salida";

/**
 * Edición de la observación de una recepción (y su motivo, que queda
 * registrado en el historial de cambios).
 *
 * Según `campo` edita la observación de ingreso o la de salida.
 *
 * Las evidencias se gestionan aparte, desde el 📎 de la columna Acciones.
 */
export const ModalEditarObservacion = ({
  opened,
  recepcion,
  campo = "observacion",
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [observacion, setObservacion] = useState<string>("");
  const [initializedId, setInitializedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const esSalida = campo === "observacion_salida";

  useEffect(() => {
    if (recepcion === null) return;
    if (initializedId !== recepcion.id) {
      setObservacion(
        (esSalida ? recepcion.observacion_salida : recepcion.observacion) ?? "",
      );
      setInitializedId(recepcion.id);
    }
  }, [recepcion, initializedId, esSalida]);

  useEffect(() => {
    if (!opened) {
      setInitializedId(null);
    }
  }, [opened]);

  const valorActual = esSalida
    ? (recepcion?.observacion_salida ?? "")
    : (recepcion?.observacion ?? "");

  const hayCambios = (observacion ?? "") !== valorActual;

  const handleGuardar = async () => {
    if (!recepcion) return;
    setLoading(true);
    try {
      const valor = observacion.trim().length > 0 ? observacion.trim() : null;
      const payload = esSalida
        ? {
            observacion: recepcion.observacion ?? null,
            observacion_salida: valor,
          }
        : {
            observacion: valor,
            observacion_salida: recepcion.observacion_salida ?? null,
          };

      const actualizada = await RecepcionUnidadesService.actualizarObservacionEvidencias(
        recepcion.id,
        payload,
      );
      notifySuccess(
        esSalida
          ? "Observación de salida actualizada"
          : "Observación actualizada",
      );
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        esSalida
          ? "No se pudo actualizar la observación de salida"
          : "No se pudo actualizar la observación",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened && recepcion !== null}
      close={onClose}
      title={esSalida ? "Editar Observación de Salida" : "Editar Observación"}
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
            label={esSalida ? "Observación de salida" : "Observación"}
            placeholder={
              esSalida
                ? "Escribe la observación de salida (opcional)"
                : "Escribe una observación (opcional)"
            }
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
