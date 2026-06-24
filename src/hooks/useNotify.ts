import { useUIStore, type IMessage } from "../stores/ui.store";

export const useNotify = () => {
  const notify = useUIStore((state) => state.notify);
  const message = useUIStore((state) => state.message);
  const clearMessage = useUIStore((state) => state.clearMessage);

  return {
    message,
    clearMessage,
    notify: (message: IMessage) => notify(message),
    notifySuccess: (content: string) => notify({ type: "success", content }),
    notifyError: (content: string) => {
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
    notifyInfo: (content: string) => notify({ type: "info", content }),
    clearNotify: () => notify({ type: "", content: "" }),
  };
};
