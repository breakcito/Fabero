import { useState, useEffect } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearCuentaBancaria,
  Schema_EditarCuentaBancaria,
  type CrearCuentaBancariaRequest,
} from "../service/proveedores.requests";
import type { CuentaBancariaResponse } from "../service/proveedores.responses";
import type { RES_Banco } from "../../../service/responses/banco";
import { Moneda } from "../../../shared/enums/_generic/moneda";

export const useRegistroCuentaBancaria = (
  idProveedor: number | null,
  bancos: RES_Banco[],
  onAccountSaved: (account: CuentaBancariaResponse) => void,
  cuenta?: CuentaBancariaResponse | null,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearCuentaBancariaRequest>({
    id_proveedor: idProveedor || 0,
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
    field: keyof CrearCuentaBancariaRequest,
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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (cuenta) {
      const validation = Schema_EditarCuentaBancaria.safeParse({
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
        const updated = await ProveedoresService.editarCuentaBancaria(
          cuenta.id_cuenta_bancaria,
          validation.data
        );
        notifySuccess("Cuenta bancaria actualizada correctamente");
        onAccountSaved(updated);
      } catch (err) {
        console.error(err);
        notifyError("Error al actualizar la cuenta bancaria");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!idProveedor) {
        setError("Falta enlazar el registro a un proveedor");
        return;
      }

      const validation = Schema_CrearCuentaBancaria.safeParse({
        ...payload,
        id_proveedor: idProveedor,
      });

      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await ProveedoresService.crearCuentaBancaria(
          validation.data,
        );
        notifySuccess("Cuenta bancaria añadida");
        setPayload({
          id_proveedor: idProveedor,
          id_banco: bancos.length > 0 ? bancos[0].id_banco : 0,
          moneda: Moneda.Soles,
          numero_cuenta: "",
          cci: "",
          es_para_detraccion: 0,
        });
        onAccountSaved(created);
      } catch (e) {
        console.error(e);
        notifyError("Error al añadir la cuenta bancaria");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const autoSelectBanco = (idBanco: number) => {
    setPayload((prev) => ({ ...prev, id_banco: idBanco }));
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
