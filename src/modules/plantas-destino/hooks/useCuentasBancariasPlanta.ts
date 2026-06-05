import { useState, useEffect, useRef } from "react";
import { PlantasDestinoService } from "../service/plantas-destino.service";
import type { CuentaBancariaPlantaResponse } from "../service/plantas-destino.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_Banco } from "../../../service/responses/banco";
import { AuxService } from "../../../service/auxiliar.service";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useCuentasBancariasPlanta = (
  idPlanta: number | null,
  onCuentasCountChange?: (count: number) => void,
) => {
  const [cuentas, setCuentas] = useState<CuentaBancariaPlantaResponse[]>([]);
  const [bancos, setBancos] = useState<RES_Banco[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const { notifyError, notifySuccess } = useNotify();

  const callbackRef = useRef(onCuentasCountChange);
  
  // Mantener el ref actualizado con la versión más reciente del callback
  useEffect(() => {
    callbackRef.current = onCuentasCountChange;
  }, [onCuentasCountChange]);

  const fetchCuentas = async (id: number) => {
    if (!id) return;
    setLoadingCuentas(true);
    try {
      const data = await PlantasDestinoService.getCuentasBancarias(id);
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
    if (idPlanta) {
      fetchCuentas(idPlanta);
      fetchBancos();
    } else {
      setCuentas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPlanta]);

  // Sincronizar conteo de cuentas de forma reactiva y segura
  useEffect(() => {
    const activeCount = cuentas.filter((c) => c.estado === EstadoBase.Activo).length;
    callbackRef.current?.(activeCount);
  }, [cuentas]);

  const insertCuenta = (c: CuentaBancariaPlantaResponse) => {
    setCuentas((prev) => {
      const exists = prev.some((x) => x.id_cuenta_bancaria === c.id_cuenta_bancaria);
      return exists
        ? prev.map((x) => (x.id_cuenta_bancaria === c.id_cuenta_bancaria ? c : x))
        : [c, ...prev];
    });
  };

  const toggleEstadoCuenta = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await PlantasDestinoService.cambiarEstadoCuentaBancaria(id, nuevoEstado);
      setCuentas((prev) => prev.map((x) => (x.id_cuenta_bancaria === id ? updated : x)));
      notifySuccess(`Cuenta bancaria ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("Error al cambiar el estado de la cuenta bancaria");
      throw e;
    }
  };

  const reloadCuentas = () => {
    if (idPlanta) fetchCuentas(idPlanta);
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
