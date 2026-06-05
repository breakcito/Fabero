import { useState, useEffect } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ConcesionesService } from "../service/concesiones.service";
import { AuxService } from "../../../service/auxiliar.service";
import {
  Schema_CrearConcesion,
  type DTO_CrearConcesion,
} from "../service/concesiones.requests";
import type { RES_Concesion } from "../service/concesiones.responses";
import type {
  RES_Departamento,
  RES_Provincia,
  RES_Distrito,
} from "../../sucursales/service/sucursales.responses";

export const useRegistroConcesion = (
  onSuccess: (nueva: RES_Concesion) => void,
  concesion?: RES_Concesion | null,
) => {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);

  // Geographic Lists
  const [departamentos, setDepartamentos] = useState<RES_Departamento[]>([]);
  const [provincias, setProvincias] = useState<RES_Provincia[]>([]);
  const [distritos, setDistritos] = useState<RES_Distrito[]>([]);

  // Loading Flags for Cascading Dropdowns
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);

  const initialValues: DTO_CrearConcesion = {
    id_departamento: concesion?.id_departamento || 0,
    id_provincia: concesion?.id_provincia || 0,
    id_distrito: concesion?.id_distrito || 0,
    nombre: concesion?.nombre || "",
    codigo_reinfo: concesion?.codigo_reinfo || "",
  };

  const [form, setForm] = useState<DTO_CrearConcesion>(initialValues);

  // Load geographic lists on mount / concession load
  useEffect(() => {
    const initLocation = async () => {
      try {
        const depResult = await AuxService.get_departamentos();
        if (depResult.success) {
          setDepartamentos(depResult.data);
        }

        if (concesion?.id_departamento) {
          setLoadingProvincias(true);
          const provResult = await AuxService.get_provincias(concesion.id_departamento);
          if (provResult.success) {
            setProvincias(provResult.data);
          }
          setLoadingProvincias(false);
        }

        if (concesion?.id_provincia) {
          setLoadingDistritos(true);
          const distResult = await AuxService.get_distritos(concesion.id_provincia);
          if (distResult.success) {
            setDistritos(distResult.data);
          }
          setLoadingDistritos(false);
        }
      } catch (err) {
        console.error("Error al cargar ubicaciones de la concesion", err);
      }
    };

    initLocation();
  }, [concesion]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = (field: keyof DTO_CrearConcesion, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartamentoChange = async (depId: number) => {
    setForm((prev) => ({
      ...prev,
      id_departamento: depId,
      id_provincia: 0,
      id_distrito: 0,
    }));
    setProvincias([]);
    setDistritos([]);

    if (depId > 0) {
      setLoadingProvincias(true);
      try {
        const result = await AuxService.get_provincias(depId);
        if (result.success) {
          setProvincias(result.data);
        } else {
          notify({ type: "error", content: result.message });
        }
      } catch (err) {
        console.error(err);
        notify({ type: "error", content: "Error al cargar provincias" });
      } finally {
        setLoadingProvincias(false);
      }
    }
  };

  const handleProvinciaChange = async (provId: number) => {
    setForm((prev) => ({
      ...prev,
      id_provincia: provId,
      id_distrito: 0,
    }));
    setDistritos([]);

    if (provId > 0) {
      setLoadingDistritos(true);
      try {
        const result = await AuxService.get_distritos(provId);
        if (result.success) {
          setDistritos(result.data);
        } else {
          notify({ type: "error", content: result.message });
        }
      } catch (err) {
        console.error(err);
        notify({ type: "error", content: "Error al cargar distritos" });
      } finally {
        setLoadingDistritos(false);
      }
    }
  };

  const handleSubmit = async () => {
    const validation = Schema_CrearConcesion.safeParse(form);
    if (!validation.success) {
      notify({ type: "error", content: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      if (concesion) {
        const resp = await ConcesionesService.editar_concesion(
          concesion.id_concesion,
          validation.data,
        );
        if (resp.success) {
          notify({ type: "success", content: resp.message });
          onSuccess(resp.data);
        } else {
          notify({ type: "error", content: resp.message });
        }
      } else {
        const resp = await ConcesionesService.crear_concesion(validation.data);
        if (resp.success) {
          notify({ type: "success", content: resp.message });
          onSuccess(resp.data);
          setForm(initialValues);
          setProvincias([]);
          setDistritos([]);
        } else {
          notify({ type: "error", content: resp.message });
        }
      }
    } catch {
      notify({ type: "error", content: "Error al registrar la concesión" });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setField,
    handleSubmit,
    loading,
    departamentos,
    provincias,
    distritos,
    loadingProvincias,
    loadingDistritos,
    handleDepartamentoChange,
    handleProvinciaChange,
  };
};
