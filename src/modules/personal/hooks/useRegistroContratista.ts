import { useState, useCallback, useEffect } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ContratistasService, EmpleadosService } from "../service/empleados.service";
import {
  Schema_CrearContratista,
  type DTO_CrearContratista,
} from "../service/empleados.requests";
import type {
  RES_Contratista,
  RES_Mina,
  RES_Labor,
} from "../service/empleados.responses";

const INITIAL_FORM: DTO_CrearContratista = {
  id_mina: 0,
  nombre: "",
  apellido: "",
  dni: "",
  ruc: "",
  carnet_extranjeria: "",
  pasaporte: "",
  fecha_nacimiento: "",
  path_foto: "",
  ids_labor: [],
};

export const useRegistroContratista = (
  onSuccess: (nuevo: RES_Contratista) => void,
  idMinaDefault: number | null = null,
) => {
  const { notify } = useNotify();
  const [form, setForm] = useState<DTO_CrearContratista>({
    ...INITIAL_FORM,
    id_mina: idMinaDefault ?? 0,
  });
  const [minas, setMinas] = useState<RES_Mina[]>([]);
  const [labores, setLabores] = useState<RES_Labor[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMinas, setLoadingMinas] = useState(false);
  const [loadingLabores, setLoadingLabores] = useState(false);

  const cargarMinas = useCallback(async () => {
    setLoadingMinas(true);
    try {
      const resp = await EmpleadosService.get_minas();
      if (resp.success) setMinas(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMinas(false);
    }
  }, []);

  const cargarLaboresMina = useCallback(async (minaId: number) => {
    setLoadingLabores(true);
    try {
      const resp = await ContratistasService.get_labores_disponibles(minaId);
      if (resp.success) setLabores(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLabores(false);
    }
  }, []);

  useEffect(() => {
    cargarMinas();
  }, [cargarMinas]);

  useEffect(() => {
    if (form.id_mina && form.id_mina > 0) {
      cargarLaboresMina(form.id_mina);
    } else {
      setLabores([]);
    }
    setForm((prev) => ({ ...prev, ids_labor: [] }));
  }, [form.id_mina, cargarLaboresMina]);

  const setField = <K extends keyof DTO_CrearContratista>(
    field: K,
    value: DTO_CrearContratista[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validation = Schema_CrearContratista.safeParse(form);
    if (!validation.success) {
      notify({ type: "info", content: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      const resp = await ContratistasService.crear_contratista(validation.data);
      if (resp.success) {
        notify({ type: "success", content: resp.message });
        onSuccess(resp.data);
        setForm({ ...INITIAL_FORM, id_mina: idMinaDefault ?? 0 });
      } else {
        notify({ type: "error", content: resp.message });
      }
    } catch (err) {
      console.error(err);
      notify({ type: "error", content: "Error inesperado" });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setField,
    minas,
    labores,
    loading,
    loadingMinas,
    loadingLabores,
    handleSubmit,
  };
};
