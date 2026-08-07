import { useState, useEffect } from "react";
import { VehiculosService } from "../service/vehiculos.service";
import { MarcasService } from "../../marcas/service/marcas.service";
import type { MarcaResponse } from "../../marcas/service/marcas.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
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
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [tipos, setTipos] = useState<RES_TipoVehiculo[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const [payload, setPayload] = useState<CrearVehiculoRequest>({
    id_marca: vehiculo?.id_marca || 0,
    id_empresa_transporte: vehiculo?.id_empresa_transporte || 0,
    id_tipo_vehiculo: vehiculo?.id_tipo_vehiculo || 0,
    placa: vehiculo?.placa || "",
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
        const empData = await AuxService.get_empresas_transporte();
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
        const tpData = await AuxService.get_tipos_vehiculo();
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

  const handleChange = <K extends keyof CrearVehiculoRequest>(
    field: K,
    value: CrearVehiculoRequest[K]
  ) => {
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
        if (created.ya_existia) {
          notifySuccess("El vehículo ya se encontraba registrado.");
        } else {
          notifySuccess("Vehículo registrado exitosamente");
        }
        onSuccess(created);
      }
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || (vehiculo ? "Ocurrió un error al actualizar el vehículo" : "Ocurrió un error al registrar el vehículo");
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
