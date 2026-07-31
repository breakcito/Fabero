import { useState, useEffect, useRef } from "react";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Banco } from "../../../../service/responses/banco";
import type { CuentaBancariaItem } from "../../../../shared/interfaces/cuenta-bancaria";
import type { CuentasBancariasAdapter } from "../../../../shared/interfaces/cuenta-bancaria";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import { AuxService } from "../../../../service/auxiliar.service";

/**
 * Hook genérico de listado + toggle de cuentas bancarias.
 * Funciona para cualquier módulo que provea un `CuentasBancariasAdapter`.
 */
export const useCuentasBancariasGenerico = <
  T extends CuentaBancariaItem,
  TEntity,
>(
  adapter: CuentasBancariasAdapter<T, TEntity>,
  entity: TEntity | null,
  onCuentasCountChange?: (count: number) => void,
) => {
  const [cuentas, setCuentas] = useState<T[]>([]);
  const [bancos, setBancos] = useState<RES_Banco[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const { notifyError, notifySuccess } = useNotify();

  const callbackRef = useRef(onCuentasCountChange);

  useEffect(() => {
    callbackRef.current = onCuentasCountChange;
  }, [onCuentasCountChange]);

  const fetchCuentas = async (parentId: number) => {
    if (!parentId) return;
    setLoadingCuentas(true);
    try {
      const data = await adapter.fetchCuentas(parentId);
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
    if (entity) {
      const parentId = adapter.getParentId(entity);
      fetchCuentas(parentId);
      fetchBancos();
    } else {
      setCuentas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  useEffect(() => {
    const activeCount = cuentas.filter(
      (c) => c.estado === EstadoBase.Activo,
    ).length;
    callbackRef.current?.(activeCount);
  }, [cuentas]);

  const insertCuenta = (c: T) => {
    setCuentas((prev) => {
      const exists = prev.some(
        (x) => x.id_cuenta_bancaria === c.id_cuenta_bancaria,
      );
      return exists
        ? prev.map((x) =>
            x.id_cuenta_bancaria === c.id_cuenta_bancaria ? c : x,
          )
        : [c, ...prev];
    });
  };

  const toggleEstadoCuenta = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo
        ? EstadoBase.Inactivo
        : EstadoBase.Activo;
    try {
      const updated = await adapter.cambiarEstado(id, nuevoEstado);
      setCuentas((prev) =>
        prev.map((x) => (x.id_cuenta_bancaria === id ? updated : x)),
      );
      notifySuccess(`Cuenta bancaria ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("Error al cambiar el estado de la cuenta bancaria");
      throw e;
    }
  };

  const reloadCuentas = () => {
    if (entity) fetchCuentas(adapter.getParentId(entity));
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
