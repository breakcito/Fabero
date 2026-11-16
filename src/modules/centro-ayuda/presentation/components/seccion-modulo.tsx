import { Text } from "@mantine/core";
import { IconFolderOpen, IconVideo } from "@tabler/icons-react";
import type { IVideoEnReproduccion } from "../../hooks/useCentroAyuda";
import { VideoCard } from "./video-card";

interface SeccionModuloProps {
  titulo: string;
  descripcion?: string;
  videos: IVideoEnReproduccion[];
  onPlay: (item: IVideoEnReproduccion) => void;
}

export const SeccionModulo = ({
  titulo,
  descripcion,
  videos,
  onPlay,
}: SeccionModuloProps) => {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconFolderOpen size={22} className="shrink-0 text-yellow-400" stroke={1.7} />
          <div className="min-w-0">
            <Text fz="lg" fw={800} c="white" truncate>
              {titulo}
            </Text>
            {descripcion && (
              <Text fz="xs" c="dimmed" truncate>
                {descripcion}
              </Text>
            )}
          </div>
        </div>

        <Text fz="sm" c="dimmed" className="shrink-0">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </Text>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 py-12 text-center">
          <IconVideo size={28} className="text-zinc-700" />
          <Text fz="sm" c="dimmed">
            Todavía no hay videos cargados para este módulo.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {videos.map((item, indice) => (
            <VideoCard
              key={`${item.modulo.slug}-${item.video.archivo}`}
              video={item.video}
              modulo={item.modulo}
              indice={indice}
              onPlay={() => onPlay(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
