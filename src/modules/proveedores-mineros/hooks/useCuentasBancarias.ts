import { useState, useEffect } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import type { CuentaBancariaResponse } from "../service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_Banco } from "../../../service/responses/banco";
import { AuxService } from "../../../service/auxiliar.service";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useCuentasBancarias = (
  idProveedor: number | null,
  onCuentasCountChange?: (count: number) => void,
) => {
  const [cuentas, setCuentas] = useState<CuentaBancariaResponse[]>([]);
  const [bancos, setBancos] = useState<RES_Banco[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const { notifyError, notifySuccess } = useNotify();

  const fetchCuentas = async (id: number) => {
    if (!id) return;
    setLoadingCuentas(true);
    try {
      const data = await ProveedoresService.getCuentasBancarias(id);
      setCuentas(data);
      onCuentasCountChange?.(data.filter((c) => c.estado === EstadoBase.Activo).length);
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

  const insertCuenta = (c: CuentaBancariaResponse) => {
    setCuentas((prev) => {
      const exists = prev.some((x) => x.id_cuenta_bancaria === c.id_cuenta_bancaria);
      const next = exists
        ? prev.map((x) => (x.id_cuenta_bancaria === c.id_cuenta_bancaria ? c : x))
        : [c, ...prev];
      onCuentasCountChange?.(next.filter((x) => x.estado === EstadoBase.Activo).length);
      return next;
    });
  };

  const toggleEstadoCuenta = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await ProveedoresService.cambiarEstadoCuentaBancaria(id, nuevoEstado);
      setCuentas((prev) => {
        const next = prev.map((x) => (x.id_cuenta_bancaria === id ? updated : x));
        onCuentasCountChange?.(next.filter((x) => x.estado === EstadoBase.Activo).length);
        return next;
      });
      notifySuccess(`Cuenta bancaria ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("Error al cambiar el estado de la cuenta bancaria");
      throw e;
    }
  };

  const reloadCuentas = () => {
    if (idProveedor) fetchCuentas(idProveedor);
  };

  return {
    cuentas,
    bancos,
    setBancos,
    loadingCuentas,
    loadingBancos,
    fetchBancos,
    insertCuenta,
    toggleEstadoCuenta,
    reloadCuentas,
  };
};
