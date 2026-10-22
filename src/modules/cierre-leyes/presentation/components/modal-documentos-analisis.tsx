import { useState, useEffect } from "react";
import { Stack, Button, Text } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { IArchivoDoc } from "../../service/cierre-leyes.responses";
import { useNotify } from "../../../../hooks/useNotify";

interface ModalDocumentosAnalisisProps {
  opened: boolean;
  onClose: () => void;
  idAnalisis: number;
  documentos: IArchivoDoc[];
  onSubirDocumentos: (idAnalisis: number, archivos: File[]) => Promise<IArchivoDoc[] | boolean | null>;
  loading?: boolean;
}

export const ModalDocumentosAnalisis = ({
  opened,
  onClose,
  idAnalisis,
  documentos,
  onSubirDocumentos,
  loading = false,
}: ModalDocumentosAnalisisProps) => {
  const { notifyError } = useNotify();
  const [nuevosArchivos, setNuevosArchivos] = useState<File[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [listaDocs, setListaDocs] = useState<IArchivoDoc[]>(documentos);

  useEffect(() => {
    setListaDocs(documentos);
  }, [documentos]);

  const isLoading = subiendo || loading;

  const handleSubir = async () => {
    if (nuevosArchivos.length === 0 || isLoading) {
      if (nuevosArchivos.length === 0) {
        notifyError("Selecciona al menos un archivo para subir");
      }
      return;
    }
    setSubiendo(true);
    try {
      const res = await onSubirDocumentos(idAnalisis, nuevosArchivos);
      if (res) {
        setNuevosArchivos([]);
        if (Array.isArray(res)) {
          setListaDocs(res);
        }
        onClose();
      }
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <div className="flex items-center gap-2">
          <IconFileDescription size={18} className="text-indigo-400" />
          <span className="font-semibold text-sm">Documentos del Análisis #{idAnalisis}</span>
        </div>
      }
      size="md"
    >
      <Stack gap="md">
        <div>
          <Text fz="xs" fw={600} c="zinc.3" mb={6}>
            Documentos Registrados ({listaDocs.length})
          </Text>
          {listaDocs.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
              <Text fz="xs" c="dimmed">
                No hay documentos adjuntos aún. Sube un documento para habilitar la edición de leyes.
              </Text>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {listaDocs.map((doc, idx) => (
                <ArchivoCard
                  key={doc.path_relativo || idx}
                  archivo={doc}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <MultiFilePicker
            label="Subir Nuevo Sustento"
            description="PDF, JPG, PNG u otros certificados de laboratorio"
            files={nuevosArchivos}
            onFilesChange={setNuevosArchivos}
          />
          {nuevosArchivos.length > 0 && (
            <Button
              size="xs"
              radius="lg"
              color="indigo"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              onClick={handleSubir}
            >
              {isLoading
                ? "Subiendo archivo..."
                : `Subir ${nuevosArchivos.length} archivo${nuevosArchivos.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>
      </Stack>
    </ModalEstandar>
  );
};
