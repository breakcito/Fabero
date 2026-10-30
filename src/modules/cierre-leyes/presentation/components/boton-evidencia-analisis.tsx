import { Tooltip } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";

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
        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
          tieneArchivos
            ? "bg-emerald-950/50 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/50"
            : "bg-zinc-900/60 border-zinc-700/70 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-300"
        }`}
      >
        <IconFileDescription
          size={13}
          className={tieneArchivos ? "text-emerald-400 shrink-0" : "text-zinc-500 shrink-0"}
        />
        <span>{cantidad}</span>
      </button>
    </Tooltip>
  );
};

