import { useCallback } from "react";
import { useUIStore, type IMessage } from "../stores/ui.store";

/**
 * Ventana de deduplicación (ms).
 *
 * Dos avisos idénticos emitidos dentro de este intervalo se consideran el
 * MISMO aviso: el que ya está en pantalla se mantiene y el disparo
 * repetido se descarta. Evita que un operador insistente (o un re-render en
 * loop) apile diez veces el mismo toast de error.
 */
const VENTANA_DEDUP_MS = 2500;

/**
 * Marca de tiempo del último aviso emitido, por clave (`tipo:contenido`).
 *
 * Vive en el módulo (no en el store) a propósito: es un registro de
 * "último disparo", no estado de UI. Si viviera en Zustand, cada `notify`
 * provocaría un render adicional de todos los Suscriptores del store.
 */
const ultimoAvisoPorClave = new Map<string, number>();

/** Poda las claves vencidas para que el mapa no crezca sin límite. */
const podarAvisosVencidos = (ahora: number): void => {
  if (ultimoAvisoPorClave.size <= 50) return;
  for (const [clave, momento] of ultimoAvisoPorClave) {
    if (ahora - momento >= VENTANA_DEDUP_MS) {
      ultimoAvisoPorClave.delete(clave);
    }
  }
};

/**
 * Emite el aviso salvo que sea un duplicado reciente del mismo mensaje.
 *
 * `emitir` recibe el mensaje ya normalizado (p. ej. con el texto sanitizado
 * del backend), de modo que dos errores distintos que se sanitizan al mismo
 * texto también se consideran el mismo aviso.
 */
const emitirSinDuplicar = (
  emitir: (mensaje: IMessage) => void,
  mensaje: IMessage,
): void => {
  const clave = `${mensaje.type}:${mensaje.content}`;
  const ahora = Date.now();
  const ultimo = ultimoAvisoPorClave.get(clave);

  if (ultimo !== undefined && ahora - ultimo < VENTANA_DEDUP_MS) {
    return;
  }

  ultimoAvisoPorClave.set(clave, ahora);
  podarAvisosVencidos(ahora);
  emitir(mensaje);
};

/**
 * Las acciones del store (`notify`, `clearMessage`) ya son estables, pero los
 * wrappers que se exponen aquí se creaban en cada render. Eso rompía la
 * identidad de `notify` / `notifyError` / `notifySuccess`, y con ella
 * cualquier `useCallback` que las listara en sus dependencias: si ese callback
 * alimentaba un `useEffect`, el effect se re-disparaba en cada render y el
 * módulo refetcheaba en loop.
 *
 * No simplificar de vuelta a funciones inline sin `useCallback`.
 */
export const useNotify = () => {
  const notify = useUIStore((state) => state.notify);
  const message = useUIStore((state) => state.message);
  const clearMessage = useUIStore((state) => state.clearMessage);

  const notifyMessage = useCallback((msg: IMessage) => notify(msg), [notify]);

  const notifySuccess = useCallback(
    (content: string) => notify({ type: "success", content }),
    [notify],
  );

  const notifyError = useCallback(
    (content: string) => {
      let sanitized = content;
      const lower = content ? content.toLowerCase() : "";
      if (
        lower.includes("sqlstate") ||
        lower.includes("database") ||
        lower.includes("column") ||
        lower.includes("table not found") ||
        lower.includes("unknown column") ||
        lower.includes("500")
      ) {
        sanitized = "Ocurrió un error interno en el servidor.";
      }
      emitirSinDuplicar(notify, { type: "error", content: sanitized });
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (content: string) => notify({ type: "info", content }),
    [notify],
  );

  const notifyWarning = useCallback(
    (content: string) => {
      emitirSinDuplicar(notify, { type: "warning", content });
    },
    [notify],
  );

  const clearNotify = useCallback(
    () => notify({ type: "", content: "" }),
    [notify],
  );

  return {
    message,
    clearMessage,
    notify: notifyMessage,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    clearNotify,
  };
};
