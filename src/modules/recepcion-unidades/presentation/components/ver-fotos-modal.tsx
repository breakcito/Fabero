import { useState, useEffect } from "react";
import { IconEye, IconPhoto } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { Boton, Insignia } from "../../../../presentation/utils/ui-tsx";

interface Props {
  opened: boolean;
  title?: string;
  fotosNuevas?: File[];
  fotosExistentes?: string[];
  onClose: () => void;
}

const IMAGEN_FALLBACK = "https://placehold.co/200x200?text=Error+Imagen";

const LocalFotoCard = ({
  file,
  idx,
  onAmpliar,
}: {
  file: File;
  idx: number;
  onAmpliar: (url: string) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const url = URL.createObjectURL(file);

    Promise.resolve().then(() => {
      if (isMounted) setPreview(url);
    });

    return () => {
      isMounted = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!preview) return null;

  return (
    <div className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
      <img
        src={preview}
        alt={`Foto nueva ${idx + 1}`}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = IMAGEN_FALLBACK;
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <Boton
          variante="primario"
          tamano="sm"
          onClick={() => onAmpliar(preview)}
          className="px-3"
        >
          <IconEye size={12} />
          Ampliar
        </Boton>
      </div>

      <div className="absolute left-2 top-2">
        <Insignia color="indigo">Nueva</Insignia>
      </div>
    </div>
  );
};

export const VerFotosModal = ({
  opened,
  title = "Visualizador de Fotos",
  fotosNuevas = [],
  fotosExistentes = [],
  onClose,
}: Props) => {
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const totalFotos = fotosNuevas.length + fotosExistentes.length;

  return (
    <>
      <ModalTsx
        opened={opened}
        onClose={onClose}
        title={title}
        ancho="lg"
        footer={
          <div className="flex items-center justify-end">
            <Boton
              variante="fantasma"
              onClick={onClose}
              className="px-3 text-zinc-400 hover:text-white"
            >
              Cerrar
            </Boton>
          </div>
        }
      >
        {totalFotos === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center">
            <IconPhoto className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
            <p className="text-xs text-zinc-500">
              No hay fotos adjuntas para mostrar.
            </p>
          </div>
        ) : (
          <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {/* Fotos Existentes */}
            {fotosExistentes.map((url, idx) => (
              <div
                key={`existente-${idx}`}
                className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-sm"
              >
                <img
                  src={url}
                  alt={`Foto existente ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = IMAGEN_FALLBACK;
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Boton
                    variante="primario"
                    tamano="sm"
                    onClick={() => setFotoAmpliada(url)}
                    className="px-3"
                  >
                    <IconEye size={12} />
                    Ampliar
                  </Boton>
                </div>

                <div className="absolute left-2 top-2">
                  <Insignia color="verde">Existente</Insignia>
                </div>
              </div>
            ))}

            {/* Fotos Nuevas (Locales) */}
            {fotosNuevas.map((file, idx) => (
              <LocalFotoCard
                key={`local-${file.name}-${idx}`}
                file={file}
                idx={idx}
                onAmpliar={(url) => setFotoAmpliada(url)}
              />
            ))}
          </div>
        )}
      </ModalTsx>

      {/* Modal para ver imagen a tamaño completo */}
      <ModalTsx
        opened={Boolean(fotoAmpliada)}
        onClose={() => setFotoAmpliada(null)}
        title="Vista previa de imagen"
        ancho="xl"
      >
        {fotoAmpliada ? (
          <div className="flex max-h-[75dvh] items-center justify-center overflow-auto p-2">
            <img
              src={fotoAmpliada}
              alt="Foto ampliada"
              className="max-h-[70dvh] rounded-md object-contain"
            />
          </div>
        ) : null}
      </ModalTsx>
    </>
  );
};
