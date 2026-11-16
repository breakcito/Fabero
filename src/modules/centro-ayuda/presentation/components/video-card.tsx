import { Badge, Text } from "@mantine/core";
import { IconPlayerPlay, IconVideo } from "@tabler/icons-react";
import type { IModuloAyuda, IVideoAyuda } from "../../service/ayuda.responses";

interface VideoCardProps {
  video: IVideoAyuda;
  modulo: IModuloAyuda;
  indice: number;
  onPlay: () => void;
}

export const VideoCard = ({ video, modulo, indice, onPlay }: VideoCardProps) => {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 text-left
        transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/50
        hover:shadow-lg hover:shadow-indigo-900/20 focus:outline-none
        focus-visible:ring-2 focus-visible:ring-indigo-400/60"
      aria-label={`Reproducir ${video.titulo}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        {video.poster ? (
          <img
            src={video.poster}
            alt={video.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <video
            src={video.url}
            preload="metadata"
            muted
            playsInline
            aria-hidden
            className="h-full w-full object-cover"
          />
        )}

        {/* Número de tutorial */}
        <span className="absolute left-2 top-2 rounded-md bg-yellow-500/90 px-2 py-0.5 text-[11px] font-extrabold text-zinc-950 shadow-md">
          #{indice + 1}
        </span>

        {/* Overlay de reproducción */}
        <span
          className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0
            transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-zinc-900 shadow-xl">
            <IconPlayerPlay size={22} fill="currentColor" />
          </span>
        </span>
      </div>

      {/* Metadatos */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Badge
          variant="light"
          color="yellow"
          size="xs"
          radius="sm"
          tt="uppercase"
          className="self-start"
          leftSection={<IconVideo size={11} />}
        >
          {modulo.nombre}
        </Badge>

        <Text fz="sm" fw={700} c="white" lh={1.35}>
          {video.titulo}
        </Text>
      </div>
    </button>
  );
};
