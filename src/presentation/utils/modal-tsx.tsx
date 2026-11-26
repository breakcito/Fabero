/**
 * Modal en TSX puro (sin Mantine).
 *
 * Sustituye a `ModalEstandar` en los modales que se usan en tablets y
 * celulares dentro de planta. El `Modal` de Mantine fija su alto con `vh`
 * (alto de viewport clásico), que en iOS Safari deja el contenido cortado
 * detrás de la barra del navegador; además el `Portal` hace que el scroll
 * del body quede mal en esos tamaños.
 *
 * Aquí el alto usa `dvh` (altura dinámica), el panel es una hoja que ocupa
 * casi toda la pantalla en móvil y una tarjeta centrada en escritorio, y el
 * scroll vive dentro del panel (`overscroll-contain`), no en el body.
 */

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Boton } from "./ui-tsx";

interface ModalTsxProps {
  opened: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Contenido fijo al pie (botones). */
  footer?: ReactNode;
  /** Ancho máximo en escritorio. */
  ancho?: "sm" | "md" | "lg" | "xl";
  /** Zona derecha de la cabecera. */
  rightSection?: ReactNode;
  /** Pide confirmación antes de cerrar. */
  validateClose?: boolean;
  closeConfirmationTitle?: string;
  closeConfirmationMessage?: ReactNode;
  /**
   * Cabecera reducida (menos padding y título más chico).
   *
   * Se usa en los modales de planta, donde cada píxel de alto cuenta: el
   * operador ve el formulario completo sin desplazamiento.
   */
  compacto?: boolean;
}

const ANCHOS: Record<string, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
  xl: "sm:max-w-6xl",
};

export const ModalTsx = ({
  opened,
  onClose,
  title,
  children,
  footer,
  ancho = "md",
  rightSection,
  validateClose = false,
  closeConfirmationTitle,
  closeConfirmationMessage,
  compacto = false,
}: ModalTsxProps) => {
  const [confirmando, setConfirmando] = useState(false);

  // Bloquea el scroll del body mientras el modal está abierto: en móvil, el
  // body detrás no debe rebotar.
  useEffect(() => {
    if (!opened) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [opened]);

  // Escape cierra (respetando la confirmación).
  useEffect(() => {
    if (!opened) return;

    const alPulsarEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmando) return;
      if (validateClose) {
        setConfirmando(true);
        return;
      }
      onClose();
    };

    document.addEventListener("keydown", alPulsarEscape);
    return () => document.removeEventListener("keydown", alPulsarEscape);
  }, [opened, confirmando, onClose, validateClose]);

  if (typeof document === "undefined" || !opened) return null;

  const manejarCierre = () => {
    if (validateClose) {
      setConfirmando(true);
      return;
    }
    onClose();
  };

  const confirmarCierre = () => {
    setConfirmando(false);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      style={{ height: "100dvh" }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) manejarCierre();
      }}
    >
      <div
        className={`relative w-full ${ANCHOS[ancho]} max-h-[94dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl shadow-black rounded-t-2xl sm:rounded-xl`}
      >
        {/* Cabecera */}
        <div
          className={`flex items-start justify-between gap-4 border-b border-white/10 shrink-0 ${
            compacto
              ? "px-4 py-2.5"
              : "px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-1 rounded-full bg-linear-to-b from-[#ffc933] to-[#b8920a] shadow-[0_0_10px_#d4a50a] shrink-0 ${
                compacto ? "h-5" : "h-6"
              }`}
            />
            <span
              className={`font-bold bg-linear-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight leading-normal truncate ${
                compacto ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {rightSection}
            <button
              type="button"
              onClick={manejarCierre}
              aria-label="Cerrar"
              className="text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cuerpo con scroll propio */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>

        {/* Pie */}
        {footer ? (
          <div
            className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-zinc-950 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {footer}
          </div>
        ) : null}
      </div>

      {/* Confirmación de cierre */}
      {confirmando ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          style={{ height: "100dvh" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-yellow-500/30 bg-zinc-900 shadow-2xl shadow-black p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">
                {closeConfirmationTitle ?? "¿Cerrar sin guardar?"}
              </h3>
              <p className="text-sm text-zinc-400">
                {closeConfirmationMessage ?? (
                  <>
                    ¿Estás seguro de cerrar? Los cambios no guardados se perderán
                    y el proceso en curso quedará descartado.
                  </>
                )}
              </p>
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  onClick={() => setConfirmando(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Boton>
                <Boton
                  variante="peligro"
                  tamano="sm"
                  onClick={confirmarCierre}
                  className="w-full sm:w-auto"
                >
                  Sí, cerrar
                </Boton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
};
