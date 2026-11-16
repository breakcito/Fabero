import { Text } from "@mantine/core";
import { IconVideo } from "@tabler/icons-react";

interface EstadoVacioProps {
  mensaje?: string;
}

export const EstadoVacio = ({
  mensaje = "Todavía no hay videos cargados. Agrega los archivos en src/presentation/assets/videos/ayuda.",
}: EstadoVacioProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-zinc-900 border border-zinc-800">
        <IconVideo size={28} className="text-zinc-600" />
      </div>
      <Text fz="sm" c="dimmed" maw={420} ta="center" lh={1.6}>
        {mensaje}
      </Text>
    </div>
  );
};
