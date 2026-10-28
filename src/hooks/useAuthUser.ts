import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { useMenuNavegacionStore } from "../stores/menu.store";
import { usePerfilStore } from "../modules/perfil/hooks/usePerfilStore";
import { useUIStore } from "../stores/ui.store";
import { useCallback, useMemo } from "react";
import { RUTAS_LEGACY } from "../shared/variables/rutas-legacy";

export const useAuthUser = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const menu = useMenuNavegacionStore((state) => state.menu);
  const clearMenu = useMenuNavegacionStore((state) => state.clearMenu);
  const resetPerfil = usePerfilStore((state) => state.reset);
  const clear_sucursales = useUIStore((state) => state.clear_sucursales);
  const location = useLocation();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearAuth();
    clearMenu();
    resetPerfil();
    clear_sucursales();
    sessionStorage.removeItem("blackcito_saludo_inicial");
    navigate("/login", { viewTransition: true });
  }, [clearAuth, clearMenu, resetPerfil, clear_sucursales, navigate]);

  const isAuthorized = useMemo(() => {
    // Rutas universalmente permitidas.
    // /system es una ruta OCULTA: solo se accede por URL directa y no
    // requiere ningun permiso del menu (igual que en BlackSilver).
    const universallyAllowed = ["/", "/home", "/perfil", "/system"];
    if (universallyAllowed.includes(location.pathname)) return true;

    // Si el menú aún no carga pero está autenticado, permitimos el paso inicial.
    if (!menu || menu.length === 0) return true;

    // Aplanamos el menú para obtener todas las URLs autorizadas.
    // Un nodo es navegable si es una HOJA (es_desplegable = false) y tiene path.
    const authorizedUrls: string[] = [];
    menu.forEach((menuItem) => {
      if (!menuItem.es_desplegable && menuItem.path) {
        authorizedUrls.push(`/${menuItem.path}`);
      }
      menuItem.submenus?.forEach((submenu) => {
        if (!submenu.es_desplegable && submenu.path) {
          authorizedUrls.push(`/${submenu.path}`);
        }
        submenu.modulos?.forEach((modulo) => {
          if (modulo.path) authorizedUrls.push(`/${modulo.path}`);
        });
      });
    });

    // Verificamos si la ruta actual está autorizada.
    // Las rutas legacy (arbol anidado) se validan contra su equivalente plano.
    const rutaEfectiva = RUTAS_LEGACY[location.pathname] ?? location.pathname;
    return authorizedUrls.some(
      (url) => rutaEfectiva === url || rutaEfectiva.startsWith(`${url}/`),
    );
  }, [location.pathname, menu]);

  return {
    usuario,
    isAuthenticated,
    isAuthorized,
    logout,
  };
};
