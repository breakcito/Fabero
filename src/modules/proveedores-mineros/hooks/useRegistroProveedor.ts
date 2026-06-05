import { useState } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearProveedor,
  type CrearProveedorRequest,
} from "../service/proveedores.requests";
import { TipoEntidad } from "../../../shared/enums/_generic/tipo-entidad";
import type { ProveedorResponse } from "../service/proveedores.responses";

export const useRegistroProveedor = (
  onSuccess: (p: ProveedorResponse) => void,
  proveedor?: ProveedorResponse | null,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearProveedorRequest>({
    tipo_entidad: (proveedor?.tipo_entidad as TipoEntidad) || TipoEntidad.Juridica,
    dni: proveedor?.dni || "",
    ruc: proveedor?.ruc || "",
    razon_social: proveedor?.razon_social || "",
    direccion: proveedor?.direccion || "",
    telefono: proveedor?.telefono || "",
    correo: proveedor?.correo || "",
  });

  const handleChange = (field: keyof CrearProveedorRequest, value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSelectChange = (value: string | null) => {
    if (value) {
      setPayload((prev) => ({
        ...prev,
        tipo_entidad: value as TipoEntidad,
        dni: "", // Limpiar para evitar basura entre tipos
        ruc: "",
      }));
      if (error) setError(null);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = Schema_CrearProveedor.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (proveedor) {
        const updated = await ProveedoresService.editarProveedor(proveedor.id_proveedor, validation.data);
        notifySuccess("Proveedor actualizado exitosamente");
        onSuccess(updated);
      } else {
        const created = await ProveedoresService.crearProveedor(validation.data);
        notifySuccess("Proveedor registrado exitosamente");
        setPayload({
          tipo_entidad: TipoEntidad.Juridica,
          dni: "",
          ruc: "",
          razon_social: "",
          direccion: "",
          telefono: "",
          correo: "",
        });
        onSuccess(created);
      }
    } catch (e) {
      console.error(e);
      notifyError(proveedor ? "Ocurrió un error al actualizar el proveedor" : "Ocurrió un error al registrar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, handleSelectChange, submit, loading, error };
};
