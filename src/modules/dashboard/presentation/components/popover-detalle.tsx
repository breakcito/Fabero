import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Popover } from "@mantine/core";

export interface PopoverDetalleProps {
  /** Título del popover. */
  titulo: string;
  /** Contenido de la tarjeta: es la zona que dispara la apertura. */
  children: ReactNode;
  /** Filas del detalle a listar (`null` cuando no hay nada que mostrar). */
  contenido: ReactNode;
  /** Mensaje cuando no hay detalle que mostrar. */
  vacio: string;
  /** Clases del contenedor que actúa como zona sensible. */
  className?: string;
  /** Ancho del popover en píxeles. */
  ancho?: number;
}

/**
 * Retardo antes de abrir el popover. Evita que aparezca al barrer el mouse
 * sobre la grilla (un barrido rápido no llega a cumplirlo).
 */
const RETARDO_APERTURA = 150;
/**
 * Retardo antes de cerrar. Da tiempo a mover el cursor de la tarjeta al
 * popover (que vive en un portal) sin que se cierre en el camino.
 */
const RETARDO_CIERRE = 180;

/**
 * Popover de detalle que se abre al pasar el cursor por encima.
 *
 * Se controla con `opened` (modo controlado) para que el hover sea la única
 * vía de apertura: el `Popover` de Mantine no trae hover nativo en la v8.
 *
 * El dropdown se renderiza en un portal (`withinPortal`) porque las tarjetas
 * del dashboard usan `backdrop-blur`, que recorta cualquier capa que no esté
 * fuera de la tarjeta.
 */
export const PopoverDetalle = ({
  titulo,
  children,
  contenido,
  vacio,
  className = "",
  ancho = 360,
}: PopoverDetalleProps) => {
  const [opened, setOpened] = useState(false);
  const timerApertura = useRef<number | null>(null);
  const timerCierre = useRef<number | null>(null);

  const limpiar = useCallback(() => {
    if (timerApertura.current !== null) {
      window.clearTimeout(timerApertura.current);
      timerApertura.current = null;
    }
    if (timerCierre.current !== null) {
      window.clearTimeout(timerCierre.current);
      timerCierre.current = null;
    }
  }, []);

  useEffect(() => () => limpiar(), [limpiar]);

  const abrir = useCallback(() => {
    if (timerCierre.current !== null) {
      window.clearTimeout(timerCierre.current);
      timerCierre.current = null;
    }
    if (timerApertura.current !== null) return;
    timerApertura.current = window.setTimeout(() => {
      timerApertura.current = null;
      setOpened(true);
    }, RETARDO_APERTURA);
  }, []);

  /** El cursor ya está dentro del popover: se cancela cualquier cierre. */
  const mantener = useCallback(() => {
    if (timerCierre.current !== null) {
      window.clearTimeout(timerCierre.current);
      timerCierre.current = null;
    }
  }, []);

  const cerrar = useCallback(() => {
    if (timerApertura.current !== null) {
      window.clearTimeout(timerApertura.current);
      timerApertura.current = null;
    }
    if (timerCierre.current !== null) {
      window.clearTimeout(timerCierre.current);
    }
    timerCierre.current = window.setTimeout(() => {
      timerCierre.current = null;
      setOpened(false);
    }, RETARDO_CIERRE);
  }, []);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="right-start"
      offset={12}
      withinPortal
      zIndex={400}
      shadow="xl"
      radius="lg"
      width={ancho}
      transitionProps={{ duration: 130, transition: "fade" }}
    >
      <Popover.Target>
        <div
          className={`min-w-0 ${className}`}
          onMouseEnter={abrir}
          onMouseLeave={cerrar}
        >
          {children}
        </div>
      </Popover.Target>

      <Popover.Dropdown
        onMouseEnter={mantener}
        onMouseLeave={cerrar}
        className="max-h-[26rem] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/95 p-0 text-zinc-200 shadow-2xl backdrop-blur-xl"
      >
        <div className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur-xl">
          {titulo}
        </div>

        <div className="px-3.5 py-1">
          {contenido ?? (
            <p className="py-3 text-[13px] text-zinc-500">{vacio}</p>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};
