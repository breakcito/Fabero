import { useState, useEffect } from "react";
import { PlantasDestinoService } from "../service/plantas-destino.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearCuentaPlanta,
  Schema_EditarCuentaPlanta,
  type CrearCuentaPlantaRequest,
} from "../service/plantas-destino.requests";
import type { CuentaBancariaPlantaResponse } from "../service/plantas-destino.responses";
import type { RES_Banco } from "../../../service/responses/banco";
import { Moneda } from "../../../shared/enums/_generic/moneda";

export const useRegistroCuentaBancaria = (
  idPlanta: number | null,
  bancos: RES_Banco[],
  onAccountSaved: (account: CuentaBancariaPlantaResponse) => void,
  cuenta?: CuentaBancariaPlantaResponse | null,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearCuentaPlantaRequest>({
    id_planta_destino: idPlanta || 0,
    id_banco: cuenta?.id_banco || 0,
    moneda: cuenta?.moneda || Moneda.Soles,
    numero_cuenta: cuenta?.numero_cuenta || "",
    cci: cuenta?.cci || "",
    es_para_detraccion: cuenta?.es_para_detraccion ? 1 : 0,
  });

  // Auto-selección del primer banco al cargar (solo si no estamos editando)
  useEffect(() => {
    if (payload.id_banco === 0 && bancos.length > 0 && !cuenta) {
      handleSelectBanco(bancos[0].id_banco.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bancos]);

  const handleChangeStr = (
    field: keyof CrearCuentaPlantaRequest,
    value: string,
  ) => {
    setPayload((prev) => {
      const newPayload = { ...prev, [field]: value };

      // Si se cambia la moneda y no es Soles, se resetea detracción
      if (field === "moneda" && value !== Moneda.Soles) {
        newPayload.es_para_detraccion = 0;
      }

      return newPayload;
    });
    if (error) setError(null);
  };

  const handleSelectBanco = (val: string | null) => {
    const idBanco = val ? Number(val) : 0;
    const banco = bancos.find((b) => b.id_banco === idBanco);

    setPayload((prev) => ({
      ...prev,
      id_banco: idBanco,
      // Solo habilitado si el banco es nacional y la moneda es Soles
      es_para_detraccion:
        banco?.es_nacional && prev.moneda === Moneda.Soles
          ? prev.es_para_detraccion
          : 0,
    }));
    if (error) setError(null);
  };

  const handleToggleDetraccion = (checked: boolean) => {
    setPayload((prev) => ({ ...prev, es_para_detraccion: checked ? 1 : 0 }));
  };

  const autoSelectBanco = (id: number) => {
    handleSelectBanco(id.toString());
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (cuenta) {
      const validation = Schema_EditarCuentaPlanta.safeParse({
        id_banco: payload.id_banco,
        moneda: payload.moneda,
        numero_cuenta: payload.numero_cuenta,
        cci: payload.cci,
        es_para_detraccion: payload.es_para_detraccion,
      });

      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const updated = await PlantasDestinoService.editarCuentaBancaria(
          cuenta.id_cuenta_bancaria,
          validation.data
        );
        notifySuccess("Cuenta bancaria actualizada correctamente");
        onAccountSaved(updated);
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || "Error al actualizar la cuenta bancaria";
        notifyError(msg);
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!idPlanta) {
        setError("Falta enlazar el registro a una planta destino");
        return;
      }

      const validation = Schema_CrearCuentaPlanta.safeParse({
        ...payload,
        id_planta_destino: idPlanta,
      });

      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await PlantasDestinoService.crearCuentaBancaria(validation.data);
        notifySuccess("Cuenta bancaria registrada correctamente");
        onAccountSaved(created);
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || "Error al registrar la cuenta bancaria";
        notifyError(msg);
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    payload,
    handleChangeStr,
    handleSelectBanco,
    handleToggleDetraccion,
    submit,
    isSubmitting,
    error,
    autoSelectBanco,
  };
};
