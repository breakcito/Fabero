import { useEffect, useState } from "react";
import { ActionIcon, Button, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { ContabilidadCompraService } from "../../service/contabilidad-compra.service";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";

interface ModalGestionarEvidenciasProps {
  opened: boolean;
  comprobante: RES_ComprobanteCompra | null;
  onClose: () => void;
  onGuardado: (comprobante: RES_ComprobanteCompra) => void;
}

/**
 * Gestión de las evidencias de un comprobante de compra: listar los archivos
 * adjuntos, agregar más y quitar los que ya no corresponden.
 *
 * Las eliminaciones se aplican contra el comprobante ya creado: el backend
 * borra del disco únicamente los archivos que estaban en su lista de evidencias.
 */
export const ModalGestionarEvidencias = ({
  opened,
  comprobante,
  onClose,
  onGuardado,
}: ModalGestionarEvidenciasProps) => {
  const { notifySuccess, notifyError } = useNotify();

  const [existentes, setExistentes] = useState<IArchivo[]>([]);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [initializedId, setInitializedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!comprobante) return;
    if (initializedId !== comprobante.id) {
      setExistentes(Array.isArray(comprobante.evidencias) ? comprobante.evidencias : []);
      setNuevas([]);
      setEliminados([]);
      setInitializedId(comprobante.id);
    }
  }, [comprobante, initializedId]);

  useEffect(() => {
    if (!opened) {
      setInitializedId(null);
    }
  }, [opened]);

  const handleRemoveExisting = (pathRelativo: string) => {
    setExistentes((prev) => prev.filter((a) => a.path_relativo !== pathRelativo));
    setEliminados((prev) => (prev.includes(pathRelativo) ? prev : [...prev, pathRelativo]));
  };

  const hayCambios = eliminados.length > 0 || nuevas.length > 0;

  const handleGuardar = async () => {
    if (!comprobante) return;
    setLoading(true);
    try {
      const res = await ContabilidadCompraService.gestionarEvidencias(comprobante.id, {
        evidencias: nuevas,
        eliminar: eliminados,
      });
      if (res.success && res.data) {
        notifySuccess("Evidencias actualizadas correctamente");
        onGuardado(res.data);
        onClose();
      } else {
        notifyError(res.message || "No se pudieron actualizar las evidencias.");
      }
    } catch (err) {
      console.error("Error al actualizar evidencias:", err);
      notifyError("Ocurrió un error al actualizar las evidencias.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened && comprobante !== null}
      close={onClose}
      title="Evidencias del Comprobante"
      size="lg"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage="Tienes cambios sin guardar en las evidencias. ¿Quieres cerrar de todos modos?"
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          {comprobante ? `${comprobante.codigo_completo} — ${comprobante.proveedor_nombre}` : ""}
        </Text>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <Stack gap="xs">
            <Text size="xs" fw={800} c="zinc.100" tt="uppercase">
              Archivos adjuntos
            </Text>

            {existentes.length === 0 ? (
              <Text size="xs" c="dimmed" fs="italic">
                No hay evidencias adjuntas.
              </Text>
            ) : (
              <Stack gap="xs">
                {existentes.map((archivo) => (
                  <Group key={archivo.path_relativo} gap="xs" wrap="nowrap" align="stretch">
                    <div className="flex-1 min-w-0">
                      <ArchivoCard archivo={archivo} />
                    </div>
                    <Tooltip label="Quitar evidencia" position="left" withArrow>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="lg"
                        radius="md"
                        onClick={() => handleRemoveExisting(archivo.path_relativo)}
                        aria-label={`Quitar ${archivo.nombre_original ?? "evidencia"}`}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <MultiFilePicker
            files={nuevas}
            onFilesChange={setNuevas}
            label="Agregar evidencias"
            description="Adjunta archivos nuevos al comprobante (PDF, JPG, PNG, etc)."
          />
        </div>

        {eliminados.length > 0 && (
          <Text size="xs" c="red.4" fw={600}>
            {eliminados.length} evidencia(s) se eliminarán al guardar.
          </Text>
        )}

        <Group justify="flex-end" gap="md" mt="sm">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
            radius="lg"
            size="xs"
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            color="indigo"
            loading={loading}
            onClick={handleGuardar}
            disabled={!hayCambios}
            radius="lg"
            size="xs"
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Guardar
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
