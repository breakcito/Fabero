import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { ItemDisponibleDespacho } from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

export const useItemsDisponibles = (idEmpresa: number | null = null) => {
  const [items, setItems] = useState<ItemDisponibleDespacho[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProgramacionDespachosService.getItemsDisponibles({
        id_empresa: idEmpresa,
      });
      setItems(data);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los items disponibles para despacho");
    } finally {
      setLoading(false);
    }
  }, [idEmpresa, notifyError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refrescar: fetchItems };
};