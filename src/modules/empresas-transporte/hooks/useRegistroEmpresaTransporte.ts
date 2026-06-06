import { useState } from "react";
import { EmpresasTransporteService } from "../service/empresas-transporte.service";
import { useNotify } from "../../../hooks/useNotify";
import { Schema_CrearEmpresaTransporte, type CrearEmpresaTransporteRequest } from "../service/empresas-transporte.requests";
import { TipoEntidad } from "../../../shared/enums/_generic/tipo-entidad";
import type { EmpresaTransporteResponse } from "../service/empresas-transporte.responses";

export const useRegistroEmpresaTransporte = (
  onSuccess: (e: EmpresaTransporteResponse) => void,
  empresa?: EmpresaTransporteResponse | null
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearEmpresaTransporteRequest>({
    tipo_entidad: (empresa?.tipo_entidad as TipoEntidad) || TipoEntidad.Juridica,
    dni: empresa?.dni || "",
    ruc: empresa?.ruc || "",
    razon_social: empresa?.razon_social || "",
    direccion: empresa?.direccion || "",
    telefono: empresa?.telefono || "",
    correo: empresa?.correo || "",
  });

  const handleChange = (field: keyof CrearEmpresaTransporteRequest, value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSelectChange = (value: string | null) => {
    if (value) {
      setPayload((prev) => ({
        ...prev,
        tipo_entidad: value as TipoEntidad,
        dni: "", // Limpiar para evitar basura
      }));
      if (error) setError(null);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = Schema_CrearEmpresaTransporte.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (empresa) {
        const updated = await EmpresasTransporteService.editarEmpresaTransporte(empresa.id, validation.data);
        notifySuccess("Empresa de transporte actualizada exitosamente");
        onSuccess(updated);
      } else {
        const created = await EmpresasTransporteService.crearEmpresaTransporte(validation.data);
        notifySuccess("Empresa de transporte registrada exitosamente");
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
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || (empresa ? "Ocurrió un error al actualizar la empresa" : "Ocurrió un error al registrar la empresa");
      notifyError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, handleSelectChange, submit, loading, error };
};
