import { useState, useEffect } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { AreaTexto, Boton } from "../../../../presentation/utils/ui-tsx";
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
    <ModalTsx
      opened={opened && recepcion !== null}
      onClose={onClose}
      title={esSalida ? "Observación de salida" : "Observación"}
      ancho="md"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage="Tienes cambios sin guardar en la observación."
      compacto
      footer={
        <div className="flex items-center justify-end gap-2">
          <Boton
            variante="fantasma"
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            onClick={() => void handleGuardar()}
            cargando={loading}
          >
            <IconDeviceFloppy size={18} />
            Guardar
          </Boton>
        </div>
      }
    >
      <AreaTexto
        label={esSalida ? "Observación de salida" : "Observación"}
        placeholder="Opcional"
        value={observacion}
        onChange={(e) => setObservacion(e.currentTarget.value)}
        disabled={loading}
        className="max-h-60"
      />
    </ModalTsx>
  );
};
