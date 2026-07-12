import { modals } from "@mantine/modals";
import { Button } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ConfirmacionProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  tipo?: "info" | "peligro";
}

export const mostrarConfirmacion = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  tipo = "info",
}: ConfirmacionProps) => {
  modals.open({
    title: (
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${
          tipo === "peligro"
            ? "bg-linear-to-b from-red-400 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
            : "bg-linear-to-b from-indigo-400 to-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
        }`} />
        <span className="text-lg font-bold bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent tracking-tight">
          {title}
        </span>
      </div>
    ),
    centered: true,
    overlayProps: {
      backgroundOpacity: 0.6,
      blur: 5,
    },
    radius: 24, // Suave redondeado premium
    classNames: {
      content: "bg-zinc-950/95 border border-zinc-800/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-[24px] overflow-hidden",
      header: "bg-zinc-950 text-white pt-5 pb-3 px-6 border-b border-zinc-900/50 flex items-center justify-between",
      body: "bg-zinc-950 px-6 pt-5 pb-6",
      close: "text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center border border-transparent hover:border-zinc-800/50",
    },
    children: (
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 items-start pt-1">
          <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
            tipo === "peligro"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
          }`}>
            <IconAlertTriangle size={24} />
          </div>
          <div className="flex-1 text-sm text-zinc-300 leading-relaxed pt-0.5">
            {message}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900/80">
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={() => {
              if (onCancel) onCancel();
              modals.closeAll();
            }}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 h-[38px] px-5 font-medium transition-all duration-200"
          >
            {cancelLabel}
          </Button>
          <Button
            radius="xl"
            onClick={() => {
              onConfirm();
              modals.closeAll();
            }}
            className={`font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] h-[38px] px-6 ${
              tipo === "peligro"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    ),
  });
};
