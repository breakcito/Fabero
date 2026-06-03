import { useState, useEffect } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import type { CuentaBancariaResponse } from "../service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_Banco } from "../../../service/responses/banco";
import { AuxService } from "../../../service/auxiliar.service";

export const useCuentasBancarias = (idProveedor: number | null) => {
  const [cuentas, setCuentas] = useState<CuentaBancariaResponse[]>([]);
  const [bancos, setBancos] = useState<RES_Banco[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const { notifyError } = useNotify();

  const fetchCuentas = async (id: number) => {
    if (!id) return;
    setLoadingCuentas(true);
    try {
      const data = await ProveedoresService.getCuentasBancarias(id);
      setCuentas(data);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar cuentas bancarias");
    } finally {
      setLoadingCuentas(false);
    }
  };

  const fetchBancos = async () => {
    if (loadingBancos || bancos.length > 0) return;
    setLoadingBancos(true);
    try {
      const data = await AuxService.getBancos();
      setBancos(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBancos(false);
    }
  };

  useEffect(() => {
    if (idProveedor) {
      fetchCuentas(idProveedor);
      fetchBancos(); // Carga automática al abrir/cambiar proveedor
    } else {
      setCuentas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProveedor]);

  return {
    cuentas,
    bancos,
    setBancos,
    loadingCuentas,
    loadingBancos,
    fetchBancos,
    insertCuenta: (c: CuentaBancariaResponse) => {
      setCuentas((prev) => [c, ...prev]);
    },
    reloadCuentas: () => {
      if (idProveedor) fetchCuentas(idProveedor);
    },
  };
};
