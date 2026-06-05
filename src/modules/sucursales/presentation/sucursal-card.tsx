import { Stack, Text, Badge } from "@mantine/core";
import {
  MapPinIcon,
  PhoneIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import type { RES_Sucursal } from "../service/sucursales.responses";

interface SucursalCardProps {
  sucursal: RES_Sucursal;
}

export const SucursalCard = ({ sucursal }: SucursalCardProps) => {
  // Construir la cadena de ubicación
  const ubicacion = [sucursal.departamento, sucursal.provincia, sucursal.distrito]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded-[32px] p-6 gap-4 hover:border-indigo-500/40 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-indigo-500/10">
      {/* Decorative Gradient Background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-colors duration-700" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-colors duration-700" />

      {/* Header: Estado & Icono */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-800/60 rounded-2xl group-hover:bg-indigo-600/10 group-hover:text-indigo-400 text-zinc-400 border border-zinc-700/30 group-hover:border-indigo-500/20 transition-all duration-500">
            <HomeModernIcon className="w-5 h-5" />
          </div>
          <Text
            size="md"
            fw={800}
            className="text-white group-hover:text-indigo-200 transition-colors line-clamp-1 leading-tight"
          >
            {sucursal.nombre}
          </Text>
        </div>
        <Badge
          variant="light"
          color={sucursal.estado === "activo" || sucursal.estado === "Activo" ? "green" : "red"}
          size="xs"
          radius="md"
          className="font-bold tracking-tight px-3 uppercase"
        >
          {sucursal.estado}
        </Badge>
      </div>

      {/* Content: Location, Address & Phone */}
      <Stack gap="xs" className="relative z-10 mt-2">
        {ubicacion ? (
          <div className="flex items-start gap-2.5">
            <MapPinIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <Text size="xs" fw={600} className="text-zinc-300 leading-snug">
              {ubicacion}
            </Text>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <MapPinIcon className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
            <Text size="xs" fw={500} className="text-zinc-500 italic">
              Ubicación no especificada
            </Text>
          </div>
        )}

        {sucursal.direccion ? (
          <div className="flex items-start gap-2.5 pl-6.5">
            <Text size="xs" fw={500} className="text-zinc-400 line-clamp-2 leading-relaxed">
              {sucursal.direccion}
            </Text>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 pl-6.5">
            <Text size="xs" fw={400} className="text-zinc-600 italic">
              Sin dirección registrada
            </Text>
          </div>
        )}

        {sucursal.telefono && (
          <div className="flex items-center gap-2.5 border-t border-zinc-800/40 pt-3 mt-1">
            <PhoneIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <Text size="xs" fw={700} className="text-zinc-400 font-mono">
              {sucursal.telefono}
            </Text>
          </div>
        )}
      </Stack>
    </div>
  );
};
