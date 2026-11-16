import { Text, TextInput } from "@mantine/core";
import { IconClock, IconHeadset, IconPlayerPlay, IconSearch, IconVideo } from "@tabler/icons-react";

interface HeroAyudaProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  totalVideos: number;
  totalModulos: number;
}

export const HeroAyuda = ({
  busqueda,
  onBusquedaChange,
  totalVideos,
  totalModulos,
}: HeroAyudaProps) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0a1f3a_0%,#11315c_48%,#1a4a86_100%)] shadow-2xl shadow-indigo-950/40">
      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-8 h-40 w-40 rounded-full border border-white/5" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3.5 py-1">
            <IconHeadset size={14} className="text-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400">
              Centro de Ayuda
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            Aprende a usar{" "}
            <span className="bg-linear-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Fabero ERP
            </span>{" "}
            paso a paso
          </h1>

          <Text c="zinc.3" fz="xs" mt="sm" maw={620} ta="center" lh={1.6}>
            Encuentra videos tutoriales de cada módulo del sistema. Filtra por módulo o
            busca el proceso que necesitas.
          </Text>

          <div className="mt-5 w-full max-w-xl">
            <TextInput
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.currentTarget.value)}
              placeholder="Buscar por módulo o proceso..."
              size="md"
              radius="xl"
              aria-label="Buscar tutoriales"
              leftSection={<IconSearch size={16} className="text-zinc-400" />}
              classNames={{
                input:
                  "bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all h-11",
              }}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2">
            <IconPlayerPlay size={14} className="text-yellow-400" />
            <Text fz="xs" c="zinc.3">
              <span className="font-extrabold text-yellow-400">{totalVideos}</span> videos
              tutoriales
            </Text>
          </div>
          <div className="flex items-center justify-center gap-2">
            <IconVideo size={14} className="text-yellow-400" />
            <Text fz="xs" c="zinc.3">
              <span className="font-extrabold text-yellow-400">{totalModulos}</span> módulos
              del sistema
            </Text>
          </div>
          <div className="flex items-center justify-center gap-2">
            <IconClock size={14} className="text-yellow-400" />
            <Text fz="xs" c="zinc.3">
              Disponibles 24/7
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
};
