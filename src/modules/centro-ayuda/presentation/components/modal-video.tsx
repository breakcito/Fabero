import { ActionIcon, Badge, Group, Text } from "@mantine/core";
import { IconPlayerSkipBack, IconPlayerSkipForward, IconVideo } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { IVideoEnReproduccion } from "../../hooks/useCentroAyuda";

interface ModalVideoProps {
  abierto: boolean;
  enReproduccion: IVideoEnReproduccion | null;
  lista: IVideoEnReproduccion[];
  onClose: () => void;
  onSeleccionar: (item: IVideoEnReproduccion) => void;
}

export const ModalVideo = ({
  abierto,
  enReproduccion,
  lista,
  onClose,
  onSeleccionar,
}: ModalVideoProps) => {
  const indiceActual = enReproduccion
    ? lista.findIndex(
        (item) =>
          item.video.archivo === enReproduccion.video.archivo &&
          item.modulo.slug === enReproduccion.modulo.slug,
      )
    : -1;

  const anterior = indiceActual > 0 ? lista[indiceActual - 1] : null;
  const siguiente =
    indiceActual >= 0 && indiceActual < lista.length - 1 ? lista[indiceActual + 1] : null;

  return (
    <ModalEstandar
      opened={abierto}
      close={onClose}
      size="xl"
      title={
        <Group gap="xs" wrap="nowrap">
          <IconVideo size={20} className="text-yellow-400" />
          <div className="min-w-0">
            <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
              {enReproduccion?.modulo.nombre ?? ""}
            </Text>
            <Text fz="sm" c="white" fw={700} truncate>
              {enReproduccion?.video.titulo ?? ""}
            </Text>
          </div>
        </Group>
      }
      rightSection={
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size="md"
            disabled={!anterior}
            onClick={() => anterior && onSeleccionar(anterior)}
            aria-label="Tutorial anterior"
          >
            <IconPlayerSkipBack size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size="md"
            disabled={!siguiente}
            onClick={() => siguiente && onSeleccionar(siguiente)}
            aria-label="Tutorial siguiente"
          >
            <IconPlayerSkipForward size={18} />
          </ActionIcon>
        </Group>
      }
    >
      {enReproduccion?.video.url && (
        <video
          key={enReproduccion.video.archivo}
          src={enReproduccion.video.url}
          poster={enReproduccion.video.poster ?? undefined}
          controls
          autoPlay
          playsInline
          // "auto" para que el navegador descargue el video con antelacion y no
          // se frene a mitad de reproduccion esperando buffer.
          preload="auto"
          className="w-full rounded-xl border border-zinc-800 bg-black"
        />
      )}

      {enReproduccion && (
        <Group justify="space-between" mt="md" wrap="wrap" gap="xs">
          <Badge variant="light" color="yellow" size="sm" radius="sm" tt="uppercase">
            {enReproduccion.modulo.nombre}
          </Badge>
          {indiceActual >= 0 && (
            <Text fz="xs" c="dimmed">
              Tutorial {indiceActual + 1} de {lista.length}
            </Text>
          )}
        </Group>
      )}
    </ModalEstandar>
  );
};
