import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMenuNav } from "../../../../hooks/useMenuNav";
import type {
  RES_Submenu,
  RES_Modulo,
} from "../../../../service/responses/menu-navegacion";

export const useNavbar = (onClose: () => void) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [syncedPath, setSyncedPath] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { menu, loading } = useMenuNav();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  // Sincronizar expansión con la ruta actual durante el renderizado (evita cascading renders en useEffect)
  if (
    location.pathname !== syncedPath &&
    !loading &&
    Array.isArray(menu) &&
    menu.length > 0
  ) {
    let foundModName: string | null = null;
    let foundSubName: string | null = null;

    for (const mod of menu) {
      if (!Array.isArray(mod.submenus)) continue;

      const activeSub = mod.submenus.find(
        (sub: RES_Submenu) =>
          Array.isArray(sub.modulos) &&
          sub.modulos.some((sec: RES_Modulo) => sec.url === location.pathname),
      );

      if (activeSub) {
        foundModName = mod.nombre;
        foundSubName = activeSub.nombre;
        break;
      }
    }

    setSyncedPath(location.pathname);
    if (foundModName) {
      setExpanded(foundModName);
      setExpandedSub(foundSubName);
    }
  }

  return {
    location,
    expanded,
    setExpanded,
    expandedSub,
    setExpandedSub,
    isClosing,
    menu,
    loading,
    handleClose,
  };
};
