import { Stack, Text, Badge, Group, Button, Tooltip } from "@mantine/core";
import {
  PencilSquareIcon,
  BeakerIcon,
  GlobeAltIcon,
  HashtagIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";
import type { GrupoAnalisisResponse } from "../../service/gestion-leyes.service";

interface GrupoCardProps {
  grupo: GrupoAnalisisResponse;
  onEdit: () => void;
  onToggleEstado: () => void;
}

export const GrupoCard = ({ grupo, onEdit, onToggleEstado }: GrupoCardProps) => {
  const isActivo = grupo.estado === "Activo" || grupo.estado === "activo";

  return (
    <div className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded-[32px] p-6 gap-5 hover:border-indigo-500/40 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-indigo-500/10">
      {/* Glow Effect */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-colors duration-700 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-colors duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 bg-zinc-800/60 rounded-2xl group-hover:bg-indigo-600/10 group-hover:text-indigo-400 text-zinc-400 border border-zinc-700/30 group-hover:border-indigo-500/20 transition-all duration-500 shrink-0">
            <BeakerIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <Text
              size="md"
              fw={800}
              className="text-white group-hover:text-indigo-200 transition-colors line-clamp-2 leading-snug"
            >
              {grupo.nombre}
            </Text>
            <Group gap="xs" mt={4} className="flex-wrap">
              <Badge
                variant="light"
                color={isActivo ? "green" : "red"}
                size="xs"
                radius="md"
                className="font-bold tracking-tight px-2.5 uppercase shrink-0"
              >
                {grupo.estado}
              </Badge>
              {grupo.orden !== undefined && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                  <HashtagIcon className="w-3 h-3 text-zinc-600" />
                  <span>Orden: {grupo.orden}</span>
                </div>
              )}
            </Group>
          </div>
        </div>
      </div>

      {/* Content / Info */}
      <Stack gap="xs" className="relative z-10 flex-1">
        {/* Origin Property */}
        <div className="flex items-center gap-2 pl-0.5">
          <GlobeAltIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          <Text size="xs" fw={600} className="text-zinc-400">
            Indica Origen:{" "}
            <span className={grupo.indicar_origen ? "text-indigo-300 font-bold" : "text-zinc-500"}>
              {grupo.indicar_origen ? "Sí" : "No"}
            </span>
          </Text>
        </div>

        {/* Associated Analytes list (unified) */}
        <div className="mt-2.5 flex-1">
          <Text size="xs" fw={800} className="text-zinc-500 mb-1.5 uppercase tracking-wider text-[10px]">
            Analitos:
          </Text>
          {grupo.analitos.length === 0 ? (
            <Text size="xs" fw={500} className="text-zinc-500 italic pl-1">
              Ninguno
            </Text>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
              {grupo.analitos.map((a) => {
                const esValorizado =
                  a.para_valorizacion_oro ||
                  a.para_valorizacion_plata ||
                  a.para_valorizacion_humedad ||
                  a.para_valorizacion_recuperacion;

                return (
                  <div
                    key={a.id_analito}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border ${
                      esValorizado
                        ? "bg-zinc-950/60 border-zinc-800/80"
                        : "bg-zinc-950/20 border-zinc-800/40"
                    }`}
                  >
                    <Text
                      size="xs"
                      fw={700}
                      className={esValorizado ? "text-white" : "text-zinc-400"}
                    >
                      {a.nombre}
                    </Text>
                    {esValorizado && (
                      <Badge
                        size="xs"
                        variant="filled"
                        color="indigo"
                        radius="sm"
                        className="px-1 text-[8px] font-black uppercase h-[13px]"
                      >
                        VALORIZADO
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Stack>

      {/* Actions */}
      <Group gap="xs" className="relative z-10 border-t border-zinc-800/60 pt-4 mt-auto">
        <Button
          variant="subtle"
          onClick={onEdit}
          leftSection={<PencilSquareIcon className="w-4 h-4" />}
          radius="xl"
          size="xs"
          className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          Editar
        </Button>
        <Tooltip label={isActivo ? "Desactivar Grupo" : "Activar Grupo"} withArrow>
          <Button
            variant="light"
            color={isActivo ? "red" : "green"}
            onClick={onToggleEstado}
            radius="xl"
            size="xs"
            className="px-3"
          >
            <PowerIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </Group>
    </div>
  );
};
