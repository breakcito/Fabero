import { useCallback } from "react";
import { useUIStore, type IMessage } from "../stores/ui.store";

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
      notify({ type: "error", content: sanitized });
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (content: string) => notify({ type: "info", content }),
    [notify],
  );

  const notifyWarning = useCallback(
    (content: string) => notify({ type: "warning", content }),
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
