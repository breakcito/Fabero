import { useState, useEffect } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearCuentaBancaria,
  type CrearCuentaBancariaRequest,
} from "../service/proveedores.requests";
import type { CuentaBancariaResponse } from "../service/proveedores.responses";
import type { RES_Banco } from "../../../service/responses/banco";

export const useRegistroCuentaBancaria = (
  idProveedor: number | null,
  bancos: RES_Banco[],
  onAccountAdded: (account: CuentaBancariaResponse) => void,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearCuentaBancariaRequest>({
    id_proveedor: 0,
    id_banco: 0,
    moneda: "Soles",
    numero_cuenta: "",
    cci: "",
    es_para_detraccion: 0,
  });

  // Auto-selección del primer banco al cargar
  useEffect(() => {
    if (payload.id_banco === 0 && bancos.length > 0) {
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
      if (field === "moneda" && value !== "Soles") {
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
        banco?.es_nacional && prev.moneda === "Soles"
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
    if (!idProveedor) {
      setError("Falta enlazar el registro a un proveedor");
      return;
    }
    setError(null);

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
        id_proveedor: 0,
        id_banco: 0,
        moneda: "Soles",
        numero_cuenta: "",
        cci: "",
        es_para_detraccion: 0,
      });
      onAccountAdded(created);
    } catch (e) {
      console.error(e);
      notifyError("Error al añadir la cuenta bancaria");
    } finally {
      setIsSubmitting(false);
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
