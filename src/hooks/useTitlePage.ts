import { useEffect } from "react";
import { useUIStore } from "../stores/ui.store";

// Hook para manejar el titulo de la pagina y el titulo de la pestaña
export const useTitlePage = (title?: string, showSucursalSelect = false) => {
  const currentTitle = useUIStore((state) => state.title);
  const setTitle = useUIStore((state) => state.setTitle);
  const setVerSucursal = useUIStore((state) => state.set_ver_sucursal);

  useEffect(() => {
    if (title !== undefined) {
      setTitle(title);
    }
  }, [title, setTitle]);

  useEffect(() => {
    setVerSucursal(showSucursalSelect);
    return () => {
      setVerSucursal(false);
    };
  }, [showSucursalSelect, setVerSucursal]);

  return {
    title: currentTitle,
    setTitlePage: setTitle,
  };
};
