import { useState, useEffect } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";
import type { CrearRecepcionRequest } from "../service/recepcion-unidades.requests";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import { TipoCarga } from "../../../shared/enums/_generic/tipo-carga";
import { useNotify } from "../../../hooks/useNotify";
import { useUIStore } from "../../../stores/ui.store";

export const useRegistroRecepcion = (
  onSuccess: (r: RecepcionUnidadResponse) => void
) => {
  const sucursal_elegida = useUIStore((state) => state.sucursal_elegida);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  // Catálogos para los selects
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Búsqueda de placa (Serie y Número)
  const [serieBusqueda, setSerieBusqueda] = useState("");
  const [numeroBusqueda, setNumeroBusqueda] = useState("");
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(false);
  const [vehiculoOriginal, setVehiculoOriginal] = useState<RES_Vehiculo | null>(null);
  const [nombreVehiculoEncontrado, setNombreVehiculoEncontrado] = useState("");

  // Estado del formulario
  const [payload, setPayload] = useState<CrearRecepcionRequest>({
    id_vehiculo: 0,
    id_empresa_transporte: 0,
    id_tipo_vehiculo: 0,
    id_conductor: 0,
    tipo_ingreso: "" as TipoIngreso,
    tipo_carga: "" as TipoCarga,
    segunda_placa: "",
    observacion: "",
    evidencias: [],
  });

  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [conds, emps, tps] = await Promise.all([
        AuxService.get_conductores(),
        AuxService.get_empresas_transporte(),
        AuxService.get_tipos_vehiculo(),
      ]);
      setConductores(conds);
      setEmpresas(emps);
      setTiposVehiculo(tps);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los catálogos auxiliares.");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda automática al escribir (debounce de 450ms)
  useEffect(() => {
    const serieLimpia = serieBusqueda.trim().toUpperCase();
    const numeroLimpio = numeroBusqueda.trim().toUpperCase();

    if (serieLimpia === "" || numeroLimpio === "") {
      setVehiculoEncontrado(false);
      setVehiculoOriginal(null);
      setNombreVehiculoEncontrado("");
      setPayload((prev) => ({
        ...prev,
        id_vehiculo: 0,
      }));
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleBuscarVehiculo(serieLimpia, numeroLimpio);
    }, 450);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serieBusqueda, numeroBusqueda]);

  const handleBuscarVehiculo = async (serie: string, numero: string) => {
    const serieLimpia = serie ? serie.trim().toUpperCase() : "";
    const numeroLimpio = numero ? numero.trim().toUpperCase() : "";

    if (serieLimpia === "" || numeroLimpio === "") {
      return;
    }

    setLoading(true);
    try {
      const vResult = await AuxService.get_vehiculos({ 
        serie: serieLimpia, 
        numero_placa: numeroLimpio 
      });
      if (vResult && vResult.length > 0) {
        const found = vResult[0];
        setVehiculoEncontrado(true);
        setVehiculoOriginal(found);
        setNombreVehiculoEncontrado(`${found.serie_placa}-${found.numero_placa} (${found.tipo_vehiculo_nombre})`);
        
        setPayload((prev) => ({
          ...prev,
          id_vehiculo: found.id_vehiculo,
          id_empresa_transporte: found.id_empresa_transporte,
          id_tipo_vehiculo: found.id_tipo_vehiculo,
          id_conductor: found.last_id_conductor || prev.id_conductor || 0,
        }));
        notifySuccess("Vehículo localizado correctamente");
      } else {
        setVehiculoEncontrado(false);
        setVehiculoOriginal(null);
        setNombreVehiculoEncontrado("");
        setPayload((prev) => ({
          ...prev,
          id_vehiculo: 0,
        }));
      }
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al realizar la búsqueda del vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof CrearRecepcionRequest>(
    field: K,
    value: CrearRecepcionRequest[K]
  ) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleConductorCreado = (nuevoConductor: RES_Conductor) => {
    if (!nuevoConductor || !nuevoConductor.id_conductor) return;
    setConductores((prev) => [...prev, nuevoConductor]);
    handleChange("id_conductor", nuevoConductor.id_conductor);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!serieBusqueda.trim() || !numeroBusqueda.trim()) {
      setError("La serie y el número de placa son obligatorios.");
      return;
    }
    if (!payload.id_empresa_transporte) {
      setError("El transportista es obligatorio.");
      return;
    }
    if (!payload.id_tipo_vehiculo) {
      setError("El tipo de vehículo es obligatorio.");
      return;
    }
    if (!payload.id_conductor) {
      setError("El conductor es obligatorio.");
      return;
    }
    if (!payload.tipo_ingreso) {
      setError("La condición de ingreso es obligatoria.");
      return;
    }
    if (!payload.tipo_carga) {
      setError("El tipo de carga es obligatorio.");
      return;
    }
    if (!sucursal_elegida || !sucursal_elegida.id_sucursal) {
      setError("Debe seleccionar una sucursal en el encabezado antes de registrar el ingreso.");
      return;
    }

    setLoading(true);
    try {
      let finalVehiculoId = payload.id_vehiculo;

      // 1. Si el vehículo no existe, lo creamos
      if (!vehiculoEncontrado) {
        const nuevoVehiculo = await AuxService.crear_vehiculo({
          serie_placa: serieBusqueda.trim().toUpperCase() || null,
          numero_placa: numeroBusqueda.trim().toUpperCase(),
          id_empresa_transporte: payload.id_empresa_transporte,
          id_tipo_vehiculo: payload.id_tipo_vehiculo,
        });
        finalVehiculoId = nuevoVehiculo.id_vehiculo;
        if (nuevoVehiculo.ya_existia) {
          notifySuccess("El vehículo ya se encontraba registrado. Seleccionado automáticamente.");
        }
      } 
      // 2. Si existe pero cambió transportista o tipo
      else if (
        vehiculoOriginal &&
        (vehiculoOriginal.id_empresa_transporte !== payload.id_empresa_transporte ||
          vehiculoOriginal.id_tipo_vehiculo !== payload.id_tipo_vehiculo)
      ) {
        await AuxService.editar_vehiculo(payload.id_vehiculo, {
          id_empresa_transporte: payload.id_empresa_transporte,
          id_tipo_vehiculo: payload.id_tipo_vehiculo,
        });
      }

      // 3. Crear el registro de recepción final
      const finalPayload = {
        ...payload,
        id_vehiculo: finalVehiculoId,
        id_sucursal: sucursal_elegida.id_sucursal,
      };

      const created = await RecepcionUnidadesService.crearRecepcion(finalPayload);
      notifySuccess("Recepción de unidad registrada correctamente");
      onSuccess(created);
    } catch (err: unknown) {
      console.error("Error al registrar la recepción de unidad:", err);
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const rawMsg = axiosError.response?.data?.message;
      
      const isInternalError = status === 500 || (rawMsg && (rawMsg.includes("SQLSTATE") || rawMsg.includes("database") || rawMsg.includes("column")));
      const msg = isInternalError
        ? "Ocurrió un error en el servidor al registrar la recepción de unidad."
        : (rawMsg || "Ocurrió un error al registrar la recepción.");

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
    conductores,
    empresas,
    tiposVehiculo,
    loadingCatalogos,
    serieBusqueda,
    setSerieBusqueda,
    numeroBusqueda,
    setNumeroBusqueda,
    vehiculoEncontrado,
    nombreVehiculoEncontrado,
    handleBuscarVehiculo,
    handleConductorCreado,
    fetchCatalogos,
  };
};
