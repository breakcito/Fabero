import { useState, useCallback, useEffect } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { EmpleadosService } from "../service/empleados.service";
import {
  Schema_CrearEmpleado,
  Schema_EditarEmpleado,
  type DTO_CrearEmpleado,
} from "../service/empleados.requests";
import type {
  RES_Area,
  RES_Cargo,
  RES_EmpleadoResumen,
} from "../service/empleados.responses";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Empresa } from "../../../service/responses/empresa";

const construirFormInicial = (
  empleado?: RES_EmpleadoResumen | null,
): DTO_CrearEmpleado => ({
  id_empresa: empleado?.id_empresa ?? 0,
  id_area: empleado?.id_area ?? null,
  id_cargo: empleado?.id_cargo ?? null,
  nombre: empleado?.nombre ?? "",
  apellido: empleado?.apellido ?? "",
  dni: empleado?.dni ?? "",
  ruc: empleado?.ruc ?? "",
  carnet_extranjeria: empleado?.carnet_extranjeria ?? "",
  pasaporte: empleado?.pasaporte ?? "",
  fecha_nacimiento: empleado?.fecha_nacimiento ?? "",
  path_foto: null,
});

export const useRegistroEmpleado = (
  onSuccess: (nuevo: RES_EmpleadoResumen) => void,
  empleadoEditar?: RES_EmpleadoResumen | null,
) => {
  const { notify } = useNotify();
  const esEdicion = Boolean(empleadoEditar);

  const [form, setForm] = useState<DTO_CrearEmpleado>(() =>
    construirFormInicial(empleadoEditar),
  );
  const [empresas, setEmpresas] = useState<RES_Empresa[]>([]);
  const [areas, setAreas] = useState<RES_Area[]>([]);
  const [cargos, setCargos] = useState<RES_Cargo[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);

  const cargarEmpresas = useCallback(async () => {
    setLoadingEmpresas(true);
    try {
      const resp = await AuxService.get_empresas();
      if (resp.success) setEmpresas(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  const cargarAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const resp = await EmpleadosService.get_areas();
      if (resp.success) setAreas(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  useEffect(() => {
    cargarEmpresas();
    cargarAreas();
  }, [cargarEmpresas, cargarAreas]);

  const cargarCargos = useCallback(async (areaId: number) => {
    setLoadingCargos(true);
    try {
      const resp = await EmpleadosService.get_cargos(areaId);
      if (resp.success) setCargos(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCargos(false);
    }
  }, []);

  const idArea = form.id_area;

  useEffect(() => {
    if (idArea) {
      void cargarCargos(idArea);
    } else {
      setCargos([]);
    }
  }, [idArea, cargarCargos]);

  const setField = <K extends keyof DTO_CrearEmpleado>(
    field: K,
    value: DTO_CrearEmpleado[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Cambiar el área limpia el cargo: el cargo siempre pertenece a un área.
   */
  const setIdArea = useCallback((nuevoIdArea: number | null) => {
    setForm((prev) => ({
      ...prev,
      id_area: nuevoIdArea,
      id_cargo: null,
    }));
  }, []);

  /**
   * Elegir un cargo implica su área: la lista de cargos corresponde al área
   * seleccionada, así que el área se mantiene y el cargo manda sobre ella.
   */
  const setIdCargo = useCallback((nuevoIdCargo: number | null) => {
    setForm((prev) => ({
      ...prev,
      id_cargo: nuevoIdCargo,
    }));
  }, []);

  const handleSubmit = async () => {
    const schema = esEdicion ? Schema_EditarEmpleado : Schema_CrearEmpleado;
    const validation = schema.safeParse(form);
    if (!validation.success) {
      notify({ type: "info", content: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      const resp = esEdicion
        ? await EmpleadosService.actualizar_empleado(
            (empleadoEditar as RES_EmpleadoResumen).id_empleado,
            validation.data,
          )
        : await EmpleadosService.crear_empleado(validation.data);

      if (resp.success) {
        notify({ type: "success", content: resp.message });
        onSuccess(resp.data);
        if (!esEdicion) {
          setForm(construirFormInicial(null));
        }
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
    idArea,
    setIdArea,
    setIdCargo,
    empresas,
    areas,
    setAreas,
    cargos,
    setCargos,
    loading,
    loadingEmpresas,
    loadingAreas,
    loadingCargos,
    esEdicion,
    handleSubmit,
  };
};
