import { useState, useEffect } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import type { ProveedorResponse } from "../service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const data = await ProveedoresService.getProveedores();
      setProveedores(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertProveedor = (p: ProveedorResponse) => {
    setProveedores((prev) => [p, ...prev]);
  };

  return { proveedores, loading, fetchProveedores, insertProveedor };
};
