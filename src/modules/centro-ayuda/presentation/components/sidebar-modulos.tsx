import { Badge, Text } from "@mantine/core";
import { IconAdjustmentsHorizontal, IconLayoutGrid } from "@tabler/icons-react";
import { SLUG_TODOS } from "../../hooks/useCentroAyuda";
import type { IModuloAyuda } from "../../service/ayuda.responses";

interface SidebarModulosProps {
  modulos: IModuloAyuda[];
  slugActivo: string;
  onSelect: (slug: string) => void;
  conteoPorModulo: Map<string, number>;
  totalVideos: number;
}

export const SidebarModulos = ({
  modulos,
  slugActivo,
  onSelect,
  conteoPorModulo,
  totalVideos,
}: SidebarModulosProps) => {
  const items = [
    { slug: SLUG_TODOS, nombre: "Todos los módulos", icono: IconLayoutGrid, conteo: totalVideos },
    ...modulos.map((modulo) => ({
      slug: modulo.slug,
      nombre: modulo.nombre,
      icono: modulo.icono,
      conteo: conteoPorModulo.get(modulo.slug) ?? 0,
    })),
  ];

  return (
    <aside className="xl:sticky xl:top-24 self-start">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-2 bg-[linear-gradient(135deg,#0a1f3a,#153c6b)] px-4 py-3">
          <IconAdjustmentsHorizontal size={16} className="text-yellow-400" />
          <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-white">
            Módulos
          </span>
        </div>

        <nav className="max-h-[62vh] overflow-y-auto p-2">
          {items.map((item) => {
            const activo = slugActivo === item.slug;
            const Icono = item.icono;

            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => onSelect(item.slug)}
                aria-current={activo ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                  activo
                    ? "bg-zinc-800/70 border-l-2 border-yellow-500 pl-[10px]"
                    : "border-l-2 border-transparent hover:bg-zinc-800/40"
                }`}
              >
                <Icono
                  size={18}
                  className={activo ? "text-yellow-400" : "text-zinc-500"}
                  stroke={1.6}
                />
                <Text
                  fz="sm"
                  fw={activo ? 700 : 500}
                  c={activo ? "white" : "zinc.400"}
                  className="flex-1 leading-snug"
                >
                  {item.nombre}
                </Text>
                <Badge
                  size="sm"
                  radius="xl"
                  variant={activo ? "filled" : "light"}
                  color={activo ? "yellow" : "gray"}
                  className="shrink-0"
                >
                  {item.conteo}
                </Badge>
              </button>
            );
          })}

          {modulos.length === 0 && (
            <Text fz="xs" c="dimmed" ta="center" py="lg" px="xs">
              Sin resultados para la búsqueda.
            </Text>
          )}
        </nav>
      </div>
    </aside>
  );
};
