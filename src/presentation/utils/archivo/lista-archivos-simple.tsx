/**
 * Listado compacto de archivos (evidencias, fotos de vehículo, etc.).
 *
 * Sustituye al `MultiFilePicker` en los formularios que se usan en planta:
 * ahí el detalle (nombre, peso, badge "Nuevo"/"Existente") estorba más que
 * ayuda. Acá sólo se ve el archivo: una miniatura si es imagen, un ícono si
 * no, y un botón para quitarlo.
 *
 * La carga se hace con el `<input type="file">` nativo, que en Android abre
 * el selector del propio dispositivo.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { IconFile } from "@tabler/icons-react";
import type { IArchivo } from "../../../shared/interfaces/archivo";

interface ListaArchivosSimpleProps {
  /** Archivos nuevos (aún no subidos). */
  archivos: File[];
  onFilesChange: (archivos: File[]) => void;
  /** Archivos ya guardados en el backend. */
  existentes?: IArchivo[];
  onRemoveExisting?: (pathRelativo: string) => void;
  /** Texto del input de carga. */
  label?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const esImagen = (extension: string): boolean =>
  ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
    extension.toLowerCase().replace(".", ""),
  );

/** Miniatura de un archivo local (File) todavía sin subir. */
const MiniaturaLocal = ({
  archivo,
  onRemove,
  disabled,
}: {
  archivo: File;
  onRemove: () => void;
  disabled: boolean;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const extension = archivo.name.split(".").pop() ?? "";

  useEffect(() => {
    if (!esImagen(extension)) return;

    let isMounted = true;
    const objectUrl = URL.createObjectURL(archivo);

    // Actualización asíncrona para evitar el warning de cascading render.
    Promise.resolve().then(() => {
      if (isMounted) setUrl(objectUrl);
    });

    return () => {
      isMounted = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [archivo, extension]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
      {url ? (
        <img
          src={url}
          alt={archivo.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-500">
          <IconFile size={26} stroke={1.5} />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Quitar archivo"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-rose-600 disabled:opacity-40"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
};

/** Miniatura de un archivo ya guardado en el backend. */
const MiniaturaExistente = ({
  archivo,
  onRemove,
  disabled,
}: {
  archivo: IArchivo;
  onRemove: () => void;
  disabled: boolean;
}) => {
  const extension = (archivo.extension ?? "").replace(".", "");

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
      {esImagen(extension) ? (
        <img
          src={archivo.url}
          alt={archivo.nombre_original ?? "archivo"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-500">
          <IconFile size={26} stroke={1.5} />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Quitar archivo"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-rose-600 disabled:opacity-40"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ListaArchivosSimple = ({
  archivos,
  onFilesChange,
  existentes = [],
  onRemoveExisting,
  label = "Adjuntar archivos",
  accept = "*/*",
  multiple = true,
  disabled = false,
  className = "",
}: ListaArchivosSimpleProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const elegidos = Array.from(e.target.files ?? []);
    if (elegidos.length === 0) return;

    onFilesChange(multiple ? [...archivos, ...elegidos] : [elegidos[0]]);
    e.target.value = "";
  };

  const quitarLocal = (index: number) => {
    onFilesChange(archivos.filter((_, i) => i !== index));
  };

  const total = archivos.length + existentes.length;

  return (
    <div className={`space-y-2 ${className}`}>
      {total > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {existentes.map((archivo) => (
            <MiniaturaExistente
              key={`existente-${archivo.path_relativo}`}
              archivo={archivo}
              disabled={disabled}
              onRemove={() => onRemoveExisting?.(archivo.path_relativo)}
            />
          ))}
          {archivos.map((archivo, index) => (
            <MiniaturaLocal
              key={`nuevo-${archivo.name}-${index}`}
              archivo={archivo}
              disabled={disabled}
              onRemove={() => quitarLocal(index)}
            />
          ))}
        </div>
      ) : null}

      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={label}
        onChange={handleChange}
        className="block w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900/60 text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-200 hover:file:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {total > 0 ? (
        <p className="text-xs text-zinc-500">
          {total} archivo{total === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
};
