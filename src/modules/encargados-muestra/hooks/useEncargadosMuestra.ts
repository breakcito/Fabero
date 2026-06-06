import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { EncargadosMuestraService } from "../service/encargados-muestra.service";
import type { RES_EncargadoMuestra } from "../service/encargados-muestra.responses";
import type { DTO_CrearEncargadoMuestra } from "../service/encargados-muestra.requests";
import { Schema_CrearEncargadoMuestra } from "../service/encargados-muestra.requests";

export const useEncargadosMuestra = (
  onSuccess?: (nueva: RES_EncargadoMuestra) => void,
  encargado?: RES_EncargadoMuestra | null,
) => {
  const { notifyError, notifySuccess } = useNotify();
  const [encargados, setEncargados] = useState<RES_EncargadoMuestra[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const initialValues: DTO_CrearEncargadoMuestra = {
    dni: encargado?.dni || "",
    ruc: encargado?.ruc || "",
    nombre: encargado?.nombre || "",
    apellido: encargado?.apellido || "",
  };

  const [form, setForm] = useState<DTO_CrearEncargadoMuestra>(initialValues);

  useEffect(() => {
    if (encargado) {
      setForm({
        dni: encargado.dni || "",
        ruc: encargado.ruc || "",
        nombre: encargado.nombre,
        apellido: encargado.apellido,
      });
    } else {
      setForm({
        dni: "",
        ruc: "",
        nombre: "",
        apellido: "",
      });
    }
  }, [encargado]);

  const listar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await EncargadosMuestraService.get_encargados_muestra();
      if (resp.success) {
        setEncargados(resp.data);
      } else {
        notifyError(resp.message || "Error al obtener encargados de muestra");
      }
    } catch (err) {
      notifyError("Error al cargar los encargados de muestra");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const setField = (field: keyof DTO_CrearEncargadoMuestra, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validation = Schema_CrearEncargadoMuestra.safeParse(form);
    if (!validation.success) {
      notifyError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (encargado) {
        const resp = await EncargadosMuestraService.editar_encargado_muestra(
          encargado.id_encargado_muestra,
          validation.data,
        );
        if (resp.success) {
          notifySuccess(resp.message);
          if (onSuccess) onSuccess(resp.data);
        } else {
          notifyError(resp.message);
        }
      } else {
        const resp = await EncargadosMuestraService.crear_encargado_muestra(validation.data);
        if (resp.success) {
          notifySuccess(resp.message);
          if (onSuccess) onSuccess(resp.data);
          setForm(initialValues);
        } else {
          notifyError(resp.message);
        }
      }
    } catch {
      notifyError("Error al guardar el encargado de muestra");
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return encargados;
    return encargados.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.apellido.toLowerCase().includes(q) ||
        (e.dni && e.dni.toLowerCase().includes(q)) ||
        (e.ruc && e.ruc.toLowerCase().includes(q))
    );
  }, [encargados, busqueda]);

  return {
    encargados: filtrados,
    loading,
    busqueda,
    setBusqueda,
    recargar: listar,
    form,
    setField,
    handleSubmit,
  };
};
