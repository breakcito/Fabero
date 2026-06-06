import { useState, useEffect } from "react";
import { VehiculosService } from "../service/vehiculos.service";
import { EmpresasTransporteService } from "../../empresas-transporte/service/empresas-transporte.service";
import { MarcasService } from "../../marcas/service/marcas.service";
import { TiposVehiculoService } from "../../tipos-vehiculo/service/tipos-vehiculo.service";
import { useNotify } from "../../../hooks/useNotify";
import { Schema_CrearVehiculo, type CrearVehiculoRequest } from "../service/vehiculos.requests";
import type { VehiculoResponse } from "../service/vehiculos.responses";

export const useRegistroVehiculo = (
  onSuccess: (v: VehiculoResponse) => void,
  vehiculo?: VehiculoResponse | null
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  // dropdown data
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const [payload, setPayload] = useState<CrearVehiculoRequest>({
    id_marca: vehiculo?.id_marca || 0,
    id_empresa_transporte: vehiculo?.id_empresa_transporte || 0,
    id_tipo_vehiculo: vehiculo?.id_tipo_vehiculo || 0,
    serie_placa: vehiculo?.serie_placa || "",
    numero_placa: vehiculo?.numero_placa || "",
    numero_constancia_mtc: vehiculo?.numero_constancia_mtc || "",
    capacidad: vehiculo?.capacidad || 0,
    tara: vehiculo?.tara || 0,
    largo: vehiculo?.largo || "",
    ancho: vehiculo?.ancho || "",
    alto: vehiculo?.alto || "",
  });

  const fetchDropdownData = async () => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const empData = await EmpresasTransporteService.getEmpresasTransporte();
        setEmpresas(empData);
      } catch (e) {
        console.error(e);
        notifyError("Ocurrió un error al cargar las empresas de transporte");
      } finally {
        setLoadingEmpresas(false);
      }
    };

    const fetchMarcas = async () => {
      setLoadingMarcas(true);
      try {
        const mcData = await MarcasService.getMarcas();
        setMarcas(mcData);
      } catch (e) {
        console.error(e);
        notifyError("Ocurrió un error al cargar las marcas");
      } finally {
        setLoadingMarcas(false);
      }
    };

    const fetchTipos = async () => {
      setLoadingTipos(true);
      try {
        const tpData = await TiposVehiculoService.getTiposVehiculo();
        setTipos(tpData);
      } catch (e) {
        console.error(e);
        notifyError("Ocurrió un error al cargar los tipos de vehículo");
      } finally {
        setLoadingTipos(false);
      }
    };

    await Promise.allSettled([
      fetchEmpresas(),
      fetchMarcas(),
      fetchTipos(),
    ]);
  };

  useEffect(() => {
    fetchDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof CrearVehiculoRequest, value: any) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = Schema_CrearVehiculo.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (vehiculo) {
        const updated = await VehiculosService.editarVehiculo(vehiculo.id, validation.data);
        notifySuccess("Vehículo actualizado exitosamente");
        onSuccess(updated);
      } else {
        const created = await VehiculosService.crearVehiculo(validation.data);
        notifySuccess("Vehículo registrado exitosamente");
        onSuccess(created);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || (vehiculo ? "Ocurrió un error al actualizar el vehículo" : "Ocurrió un error al registrar el vehículo");
      notifyError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    payload,
    handleChange,
    submit,
    loading,
    error,
    empresas,
    marcas,
    tipos,
    loadingEmpresas,
    loadingMarcas,
    loadingTipos,
    fetchDropdownData,
  };
};
