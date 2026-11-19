import { useState, useEffect } from "react";
import { Stack, Group, Button, Text, Loader } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
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

  const hayCambios = existentes.length !== (recepcion?.evidencias?.length ?? 0) || nuevas.length > 0;

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
    <ModalEstandar
      opened={opened && recepcion !== null}
      close={onClose}
      title="Evidencias de la Recepción"
      size="lg"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage="Tienes archivos sin guardar. ¿Quieres cerrar de todos modos?"
    >
      {!recepcion ? (
        <div className="py-8 text-center">
          <Loader size="sm" color="indigo" />
        </div>
      ) : (
        <Stack gap="md">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <MultiFilePicker
              files={nuevas}
              onFilesChange={setNuevas}
              existingFiles={existentes}
              onRemoveExisting={handleRemoveExisting}
              label="Evidencias de la Recepción"
              description="Puedes subir nuevas evidencias o quitar las existentes. Los cambios quedan registrados en el historial."
            />
            {existentes.length === 0 && nuevas.length === 0 && (
              <Text size="sm" c="dimmed" fs="italic" mt="xs">
                No hay evidencias adjuntas.
              </Text>
            )}
          </div>

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
              Guardar Evidencias
            </Button>
          </Group>
        </Stack>
      )}
    </ModalEstandar>
  );
};
