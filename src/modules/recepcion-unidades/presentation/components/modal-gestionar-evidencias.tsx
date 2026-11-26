import { useState, useEffect } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { Boton } from "../../../../presentation/utils/ui-tsx";
import { ListaArchivosSimple } from "../../../../presentation/utils/archivo/lista-archivos-simple";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/**
 * Gestión de las evidencias de una recepción: ver, subir y eliminar archivos.
 *
 * No toca la observación (esa tiene su propio editor en la columna
 * "Observación").
 */
export const ModalGestionarEvidencias = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [existentes, setExistentes] = useState<IArchivo[]>([]);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [initializedId, setInitializedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recepcion === null) return;
    if (initializedId !== recepcion.id) {
      setExistentes(Array.isArray(recepcion.evidencias) ? recepcion.evidencias : []);
      setNuevas([]);
      setInitializedId(recepcion.id);
    }
  }, [recepcion, initializedId]);

  useEffect(() => {
    if (!opened) {
      setInitializedId(null);
    }
  }, [opened]);

  const handleRemoveExisting = (pathRelativo: string) => {
    setExistentes((prev) =>
      prev.filter((a) => a.path_relativo !== pathRelativo),
    );
  };

  const hayCambios =
    existentes.length !== (recepcion?.evidencias?.length ?? 0) ||
    nuevas.length > 0;

  const handleGuardar = async () => {
    if (!recepcion) return;
    setLoading(true);
    try {
      const actualizada = await RecepcionUnidadesService.actualizarObservacionEvidencias(
        recepcion.id,
        {
          // Se reenvían tal cual para que el backend no las toque: este
          // modal solo gestiona evidencias.
          observacion: recepcion.observacion ?? null,
          observacion_salida: recepcion.observacion_salida ?? null,
          evidencias_existentes: existentes,
          evidencias: nuevas,
        },
      );
      notifySuccess("Evidencias actualizadas");
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError("No se pudieron actualizar las evidencias");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalTsx
      opened={opened && recepcion !== null}
      onClose={onClose}
      title="Evidencias de la Recepción"
      ancho="lg"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage="Tienes archivos sin guardar. ¿Quieres cerrar de todos modos?"
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
            Guardar Evidencias
          </Boton>
        </div>
      }
    >
      <ListaArchivosSimple
        archivos={nuevas}
        onFilesChange={setNuevas}
        existentes={existentes}
        onRemoveExisting={handleRemoveExisting}
        label="Adjuntar evidencias"
      />
    </ModalTsx>
  );
};
