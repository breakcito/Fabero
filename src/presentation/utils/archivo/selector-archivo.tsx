/**
 * Selector de un solo archivo sobre el `<input type="file">` nativo.
 *
 * Se usa donde el operador tiene que adjuntar el documento de un campo
 * concreto (por ejemplo, el archivo de una guía). El input nativo abre el
 * selector de archivos del propio dispositivo, que en Android es mucho más
 * usable que un `<div>` con drag & drop.
 *
 * Si el campo ya tiene un archivo guardado, se lo muestra y se puede quitar
 * (quitarlo equivale a enviarlo vacío al backend).
 */

import { useRef, type ChangeEvent } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import type { IArchivo } from "../../../shared/interfaces/archivo";

interface SelectorArchivoProps {
  /** Texto del botón. */
  label: string;
  /** Archivo elegido actualmente (para mostrar su nombre). */
  archivo: File | null;
  onChange: (archivo: File | null) => void;
  /** Archivo ya guardado en el backend (se puede quitar). */
  archivoExistente?: IArchivo | null;
  /** Callback al quitar el archivo ya guardado. */
  onQuitarExistente?: () => void;
  /** `accept` del input (ej. `image/*`, `.pdf`). */
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export const SelectorArchivo = ({
  label,
  archivo,
  onChange,
  archivoExistente,
  onQuitarExistente,
  accept = "*/*",
  disabled = false,
  className = "",
}: SelectorArchivoProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0] ?? null;
    onChange(elegido);
    // Permite volver a elegir el MISMO archivo después de quitarlo.
    e.target.value = "";
  };

  return (
    <div className={`min-w-0 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="block w-full min-w-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900/60 text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-200 hover:file:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {archivo ? (
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="min-w-0 flex-1 truncate text-xs text-zinc-400"
            title={archivo.name}
          >
            {archivo.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label={`Quitar ${label.toLowerCase()}`}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
          >
            Quitar
          </button>
        </div>
      ) : archivoExistente ? (
        <div className="mt-1.5 flex items-center gap-2">
          <a
            href={archivoExistente.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
            title={archivoExistente.nombre_original ?? "Archivo"}
          >
            <IconPaperclip size={13} className="shrink-0 text-zinc-500" />
            <span className="truncate">
              {archivoExistente.nombre_original || "Archivo adjunto"}
            </span>
          </a>
          {onQuitarExistente ? (
            <button
              type="button"
              onClick={onQuitarExistente}
              disabled={disabled}
              aria-label={`Quitar ${label.toLowerCase()}`}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
            >
              Quitar
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">{label}</p>
      )}
    </div>
  );
};
