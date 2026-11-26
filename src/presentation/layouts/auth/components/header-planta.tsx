import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useUIStore } from "../../../../stores/ui.store";
import { useAuthUser } from "../../../../hooks/useAuthUser";
import { useMenuNav } from "../../../../hooks/useMenuNav";
import { CampoSeleccion } from "../../../utils/ui-tsx";

/**
 * Módulos de recepción: siempre están en la barra, con nombres cortos.
 *
 * El resto de módulos sale del menú del usuario (por rol).
 */
const MODULOS_RECEPCION = [
  { path: "recepcion-unidades", nombre: "Unidades" },
  { path: "recepcion-visitas", nombre: "Visitas" },
];

/**
 * Barra compacta del modo "planta".
 *
 * Sustituye al header general en las vistas que se usan en el
 * teléfono/tablet dentro de planta: en vez del menú lateral, el operador
 * ve una fila de pestañas con los módulos a los que tiene acceso (además de
 * cambiar de sucursal y cerrar sesión).
 */
export const HeaderPlanta = () => {
  const { logout } = useAuthUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { menu } = useMenuNav();

  const ver_sucursal = useUIStore((state) => state.ver_sucursal);
  const sucursales = useUIStore((state) => state.sucursales);
  const sucursal_elegida = useUIStore((state) => state.sucursal_elegida);
  const set_sucursal_elegida = useUIStore((state) => state.set_sucursal_elegida);

  // Auto-selecciona la primera sucursal cuando ver_sucursal se activa y no
  // hay ninguna elegida (mismo criterio que el header general).
  useEffect(() => {
    if (ver_sucursal && sucursales.length > 0 && sucursal_elegida === null) {
      set_sucursal_elegida(sucursales[0]);
    }
  }, [ver_sucursal, sucursales, sucursal_elegida, set_sucursal_elegida]);

  /**
   * Pestañas: los módulos de recepción primero y, después, el resto de los
   * módulos a los que el usuario tiene acceso (según su menú por rol).
   */
  const pestanas = useMemo(() => {
    const lista: { path: string; nombre: string }[] = [...MODULOS_RECEPCION];
    const yaIncluidos = new Set(lista.map((m) => m.path));

    const agregar = (path: string | null, nombre: string) => {
      if (!path || yaIncluidos.has(path)) return;
      yaIncluidos.add(path);
      lista.push({ path, nombre });
    };

    (menu ?? []).forEach((menuItem) => {
      if (!menuItem.es_desplegable) {
        agregar(menuItem.path, menuItem.nombre);
      }

      (menuItem.submenus ?? []).forEach((submenu) => {
        if (!submenu.es_desplegable) {
          agregar(submenu.path, submenu.nombre);
        }
        (submenu.modulos ?? []).forEach((modulo) => {
          agregar(modulo.path, modulo.nombre);
        });
      });
    });

    return lista;
  }, [menu]);

  const rutaActual = pathname.replace(/^\//, "").split("/")[0];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3">
        {/* Pestañas de módulos (scroll horizontal) */}
        <nav
          aria-label="Módulos"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pestanas.map((pestana) => {
            const activa = pestana.path === rutaActual;
            return (
              <button
                key={pestana.path}
                type="button"
                onClick={() => navigate(`/${pestana.path}`)}
                aria-current={activa ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  activa
                    ? "bg-indigo-500/20 text-indigo-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {pestana.nombre}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {ver_sucursal ? (
            <div className="w-36 sm:w-48">
              <CampoSeleccion
                placeholder="Sucursal"
                opciones={sucursales.map((s) => ({
                  value: String(s.id_sucursal),
                  label: s.nombre,
                }))}
                valor={
                  sucursal_elegida ? String(sucursal_elegida.id_sucursal) : null
                }
                onChange={(val) => {
                  const selected =
                    sucursales.find((s) => String(s.id_sucursal) === val) ?? null;
                  set_sucursal_elegida(selected);
                }}
                buscable
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => logout()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-rose-300 transition-colors hover:bg-rose-500/10"
          >
            <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
