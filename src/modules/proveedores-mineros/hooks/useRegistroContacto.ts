import { useState } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearContactoProveedor,
  Schema_EditarContactoProveedor,
} from "../service/proveedores.requests";
import type { RES_ContactoProveedor } from "../service/proveedores.responses";

/** Campos editables de un contacto. */
interface PayloadContacto {
  nombre_completo: string;
  dni: string;
  telefono: string;
  correo: string;
}

const payloadVacio: PayloadContacto = {
  nombre_completo: "",
  dni: "",
  telefono: "",
  correo: "",
};

export const useRegistroContacto = (
  onSuccess: (contacto: RES_ContactoProveedor) => void,
  idProveedor: number,
  contacto?: RES_ContactoProveedor | null,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<PayloadContacto>({
    nombre_completo: contacto?.nombre_completo ?? "",
    dni: contacto?.dni ?? "",
    telefono: contacto?.telefono ?? "",
    correo: contacto?.correo ?? "",
  });

  const handleChange = (field: keyof PayloadContacto, value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (contacto) {
      const validacion = Schema_EditarContactoProveedor.safeParse(payload);
      if (!validacion.success) {
        setError(validacion.error.issues[0].message);
        return;
      }

      setLoading(true);
      try {
        const actualizado = await ProveedoresService.editarContactoProveedor(
          contacto.id,
          validacion.data,
        );
        notifySuccess("Contacto actualizado exitosamente");
        onSuccess(actualizado);
      } catch (e) {
        console.error(e);
        notifyError("Ocurrió un error al actualizar el contacto");
      } finally {
        setLoading(false);
      }
      return;
    }

    const validacion = Schema_CrearContactoProveedor.safeParse({
      ...payload,
      id_proveedor: idProveedor,
    });
    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const creado = await ProveedoresService.crearContactoProveedor(validacion.data);
      notifySuccess("Contacto registrado exitosamente");
      setPayload(payloadVacio);
      onSuccess(creado);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al registrar el contacto");
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
