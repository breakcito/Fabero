import { Tooltip } from "@mantine/core";
import { IconFileDescription, IconPaperclip } from "@tabler/icons-react";

interface BotonEvidenciaAnalisisProps {
  cantidad: number;
  onClick: () => void;
}

export const BotonEvidenciaAnalisis = ({
  cantidad,
  onClick,
}: BotonEvidenciaAnalisisProps) => {
  const tieneArchivos = cantidad > 0;

  return (
    <Tooltip
      label={
        tieneArchivos
          ? `Ver o adjuntar evidencias (${cantidad} archivo${cantidad === 1 ? "" : "s"})`
          : "Sin evidencias adjuntas (clic para adjuntar)"
      }
      withArrow
    >
      <button
        type="button"
        onClick={onClick}
        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer whitespace-nowrap ${
          tieneArchivos
            ? "bg-emerald-950/50 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/50"
            : "bg-amber-950/40 border-amber-500/70 text-amber-200 hover:bg-amber-900/40 hover:text-amber-100 animate-pulse"
        }`}
      >
        {tieneArchivos ? (
          <>
            <IconFileDescription
              size={13}
              className="text-emerald-400 shrink-0"
            />
            <span>{cantidad}</span>
          </>
        ) : (
          <>
            <IconPaperclip size={13} className="text-amber-300 shrink-0" />
            <span>Adjuntar</span>
          </>
        )}
      </button>
    </Tooltip>
  );
};
