import { useState, useCallback } from "react";
import { ProgramarRecepcionService } from "../service/programar-recepcion.service";
import { AuxService } from "../../../service/auxiliar.service";
import type {
  CrearProgramacionRequest,
  GuiaProgramacionArchivos,
  GuiaProgramacionInput,
} from "../service/programar-recepcion.requests";
import type { ProgramacionDetail } from "../service/programar-recepcion.responses";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { EmpresaTransporteResponse } from "../../empresas-transporte/service/empresas-transporte.responses";
import type { ProveedorResponse } from "../../proveedores-mineros/service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";

import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import { useUIStore } from "../../../stores/ui.store";

/**
 * Estado editable del formulario de programación.
 *
 * Los proveedores de la carga se derivan de `guias`: hay una entrada de
 * guía por proveedor, en el mismo orden.
 */
export interface ProgramacionFormState {
  id_empresa_transporte: number;
  tipo_ingreso: TipoIngreso | string;
  id_vehiculo?: number;
  id_tipo_vehiculo?: number;
  id_conductor?: number;
  id_sucursal?: number;
  fecha_estimada_llegada: string;
  id_vehiculo_carreta?: number | null;
  observacion: string;
  guias: GuiaProgramacionInput[];
}

const INITIAL_FORM: ProgramacionFormState = {
  id_empresa_transporte: 0,
  tipo_ingreso: TipoIngreso.RecepcionMineral,
  id_vehiculo: undefined,
  id_tipo_vehiculo: undefined,
  id_conductor: undefined,
  id_sucursal: undefined,
  fecha_estimada_llegada: "",
  id_vehiculo_carreta: undefined,
  observacion: "",
  guias: [],
};

const guiaVacia = (idProveedor: number): GuiaProgramacionInput => ({
  id_proveedor: idProveedor,
  guia_remitente: "",
  guia_transportista: "",
  guia_remitente_archivo: null,
  guia_transportista_archivo: null,
  guia_remitente_file: null,
  guia_transportista_file: null,
});

export const useProgramarForm = (
  onSuccess: (nueva: ProgramacionDetail) => void,
  programacion?: ProgramacionDetail | null,
) => {
  const { notifySuccess, notifyError } = useNotify();
  const [form, setForm] = useState<ProgramacionFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const esEdicion = Boolean(programacion?.id);

  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingTiposVehiculo, setLoadingTiposVehiculo] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    setLoadingEmpresas(true);
    setLoadingVehiculos(true);
    setLoadingProveedores(true);
    setLoadingTiposVehiculo(true);
    setLoadingConductores(true);

    try {
      const [emp, veh, prov, tipos, cond] = await Promise.all([
        AuxService.get_empresas_transporte(),
        AuxService.get_vehiculos(),
        AuxService.get_proveedores(),
        AuxService.get_tipos_vehiculo(),
        AuxService.get_conductores(),
      ]);
      setEmpresas(Array.isArray(emp) ? emp : []);
      setVehiculos(Array.isArray(veh) ? veh : []);
      if (prov && prov.success && Array.isArray(prov.data)) {
        setProveedores(prov.data);
      } else if (Array.isArray(prov)) {
        setProveedores(prov as unknown as RES_Proveedor[]);
      }
      setTiposVehiculo(Array.isArray(tipos) ? tipos : []);
      setConductores(Array.isArray(cond) ? cond : []);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los catálogos de programación");
    } finally {
      setLoadingEmpresas(false);
      setLoadingVehiculos(false);
      setLoadingProveedores(false);
      setLoadingTiposVehiculo(false);
      setLoadingConductores(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = useCallback(
    <K extends keyof ProgramacionFormState>(
      key: K,
      value: ProgramacionFormState[K],
    ) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "id_vehiculo" && value) {
          const vFound = vehiculos.find((v) => v.id_vehiculo === Number(value));
          if (vFound?.id_tipo_vehiculo) {
            next.id_tipo_vehiculo = vFound.id_tipo_vehiculo;
          }
        }
        return next;
      });
    },
    [vehiculos],
  );

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
  }, []);

  /**
   * Sincronizar la selección de proveedores con las entradas de guía.
   *
   * Se conserva el orden en que se eligieron los proveedores: cada uno
   * aporta su propia fila de guías (remitente, transportista y archivos).
   */
  const setProveedoresSeleccionados = useCallback((ids: string[]) => {
    setForm((prev) => {
      const actuales = prev.guias.map((g) => g.id_proveedor);
      const nuevos = ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

      const conservadas = prev.guias.filter((g) => nuevos.includes(g.id_proveedor));
      const agregadas = nuevos
        .filter((id) => !actuales.includes(id))
        .map((id) => guiaVacia(id));

      return { ...prev, guias: [...conservadas, ...agregadas] };
    });
  }, []);

  /**
   * Actualizar los datos editables de la guía de un proveedor.
   */
  const updateGuia = useCallback(
    (
      idProveedor: number,
      patch: Partial<
        Pick<
          GuiaProgramacionInput,
          "guia_remitente" | "guia_transportista"
        >
      >,
    ) => {
      setForm((prev) => ({
        ...prev,
        guias: prev.guias.map((g) =>
          g.id_proveedor === idProveedor ? { ...g, ...patch } : g,
        ),
      }));
    },
    [],
  );

  /**
   * Quitar un archivo ya guardado de la guía de un proveedor.
   */
  const removeArchivoGuia = useCallback(
    (
      idProveedor: number,
      tipo: "guia_remitente" | "guia_transportista",
    ) => {
      setForm((prev) => ({
        ...prev,
        guias: prev.guias.map((g) =>
          g.id_proveedor === idProveedor
            ? {
                ...g,
                [`${tipo}_archivo`]: null,
                [`${tipo}_file`]: null,
              }
            : g,
        ),
      }));
    },
    [],
  );

  /**
   * Registrar un archivo nuevo pendiente de subir.
   */
  const setArchivoNuevoGuia = useCallback(
    (
      idProveedor: number,
      tipo: "guia_remitente" | "guia_transportista",
      archivo: File | null,
    ) => {
      setForm((prev) => ({
        ...prev,
        guias: prev.guias.map((g) =>
          g.id_proveedor === idProveedor
            ? { ...g, [`${tipo}_file`]: archivo }
            : g,
        ),
      }));
    },
    [],
  );

  /**
   * Cargar en el formulario los datos de una programación existente para
   * editarlos. `tipo_ingreso` se conserva tal cual: es un campo bloqueado.
   */
  const cargarProgramacion = useCallback((p: ProgramacionDetail) => {
    // La API devuelve la fecha estimada con hora ("2026-11-25 00:00:00"); el
    // date picker del formulario trabaja solo con "YYYY-MM-DD".
    const fechaEstimada = p.fecha_estimada_llegada
      ? p.fecha_estimada_llegada.slice(0, 10)
      : "";

    const guiasExistentes = p.guias ?? [];
    const guiasPorProveedor = new Map(
      guiasExistentes.map((g) => [g.id_proveedor, g] as const),
    );

    const idsProveedor = (p.proveedores ?? []).map((prov) => prov.id_proveedor);
    const idsEnGuias = guiasExistentes.map((g) => g.id_proveedor);
    const ordenProveedores = [
      ...idsProveedor.filter((id) => idsEnGuias.includes(id)),
      ...idsEnGuias.filter((id) => !idsProveedor.includes(id)),
    ];

    setForm({
      id_empresa_transporte: p.id_empresa_transporte,
      tipo_ingreso: p.tipo_ingreso ?? TipoIngreso.RecepcionMineral,
      id_vehiculo: p.id_vehiculo ?? undefined,
      id_tipo_vehiculo: p.id_tipo_vehiculo ?? undefined,
      id_conductor: p.id_conductor ?? undefined,
      id_sucursal: p.id_sucursal ?? undefined,
      fecha_estimada_llegada: fechaEstimada,
      id_vehiculo_carreta: p.id_vehiculo_carreta ?? undefined,
      observacion: p.observacion ?? "",
      guias: ordenProveedores.map((idProveedor) => {
        const guia = guiasPorProveedor.get(idProveedor);
        return {
          id_proveedor: idProveedor,
          guia_remitente: guia?.guia_remitente ?? "",
          guia_transportista: guia?.guia_transportista ?? "",
          guia_remitente_archivo: guia?.guia_remitente_archivo ?? null,
          guia_transportista_archivo: guia?.guia_transportista_archivo ?? null,
          guia_remitente_file: null,
          guia_transportista_file: null,
        };
      }),
    });
  }, []);

  const submit = async (): Promise<boolean> => {
    if (!form.id_empresa_transporte) {
      notifyError("Debe seleccionar la empresa de transporte.");
      return false;
    }
    if (!form.id_vehiculo) {
      notifyError("Debe seleccionar el vehículo.");
      return false;
    }
    if (form.guias.length === 0) {
      notifyError("Debe seleccionar al menos un proveedor de la carga.");
      return false;
    }

    // En alta se usa la sucursal del contexto; en edición se conserva la de
    // la programación original (viene precargada en el formulario).
    const idSucursalFinal = esEdicion
      ? form.id_sucursal
      : form.id_sucursal ||
        useUIStore.getState().sucursal_elegida?.id_sucursal ||
        useUIStore.getState().sucursales[0]?.id_sucursal;

    const guias = form.guias.map((g) => ({
      id_proveedor: g.id_proveedor,
      guia_remitente: g.guia_remitente.trim().toUpperCase(),
      guia_transportista: g.guia_transportista.trim().toUpperCase(),
      guia_remitente_archivo: g.guia_remitente_archivo,
      guia_transportista_archivo: g.guia_transportista_archivo,
    }));

    const guiasArchivos: GuiaProgramacionArchivos = {};
    form.guias.forEach((g, indice) => {
      const archivos: { guia_remitente?: File; guia_transportista?: File } = {};
      if (g.guia_remitente_file) {
        archivos.guia_remitente = g.guia_remitente_file;
      }
      if (g.guia_transportista_file) {
        archivos.guia_transportista = g.guia_transportista_file;
      }
      if (Object.keys(archivos).length > 0) {
        guiasArchivos[indice] = archivos;
      }
    });

    const payload: CrearProgramacionRequest = {
      id_empresa_transporte: form.id_empresa_transporte,
      id_vehiculo: form.id_vehiculo,
      id_tipo_vehiculo: form.id_tipo_vehiculo,
      id_conductor: form.id_conductor,
      id_sucursal: idSucursalFinal,
      fecha_estimada_llegada: form.fecha_estimada_llegada,
      id_vehiculo_carreta: form.id_vehiculo_carreta ?? null,
      observacion: form.observacion,
      tipo_ingreso: form.tipo_ingreso,
      proveedores: form.guias.map((g) => g.id_proveedor),
      guias,
      guias_archivos: guiasArchivos,
    };

    setLoading(true);
    try {
      const nueva =
        esEdicion && programacion
          ? await ProgramarRecepcionService.actualizarProgramacion(
              programacion.id,
              payload,
            )
          : await ProgramarRecepcionService.crearProgramacion(payload);

      notifySuccess(
        esEdicion
          ? "Programación actualizada correctamente"
          : "Programación registrada correctamente",
      );
      onSuccess(nueva);
      reset();
      return true;
    } catch (e) {
      console.error(e);
      const axiosLike = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const backendMsg = axiosLike?.response?.data?.message;
      const fallback =
        e instanceof Error && e.message
          ? e.message
          : esEdicion
            ? "Error al actualizar la programación"
            : "Error al registrar la programación";
      notifyError(backendMsg || fallback);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaCreada = useCallback(
    (nueva: EmpresaTransporteResponse) => {
      const resEmp: RES_EmpresaTransporte = {
        id_empresa_transporte: nueva.id,
        ruc: nueva.ruc,
        razon_social: nueva.razon_social,
        estado: nueva.estado,
      };
      setEmpresas((prev) => [resEmp, ...prev.filter((e) => e.id_empresa_transporte !== nueva.id)]);
      setField("id_empresa_transporte", nueva.id);
    },
    [setField],
  );

  const handleVehiculoCreado = useCallback(
    (nuevo: RES_Vehiculo) => {
      setVehiculos((prev) => [nuevo, ...prev.filter((v) => v.id_vehiculo !== nuevo.id_vehiculo)]);
      setField("id_vehiculo", nuevo.id_vehiculo);
    },
    [setField],
  );

  const handleProveedorCreado = useCallback(
    (nuevo: ProveedorResponse) => {
      const resProv: RES_Proveedor = {
        id_proveedor: nuevo.id_proveedor,
        razon_social: nuevo.razon_social,
        direccion: nuevo.direccion,
        documento: nuevo.ruc || nuevo.dni || null,
        telefono: nuevo.telefono,
      };
      setProveedores((prev) => [resProv, ...prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor)]);
      setProveedoresSeleccionados([
        ...form.guias.map((g) => String(g.id_proveedor)),
        String(nuevo.id_proveedor),
      ]);
    },
    [form.guias, setProveedoresSeleccionados],
  );

  const handleCarretaCreada = useCallback(
    (nueva: RES_Vehiculo) => {
      setVehiculos((prev) => [nueva, ...prev.filter((v) => v.id_vehiculo !== nueva.id_vehiculo)]);
      setField("id_vehiculo_carreta", nueva.id_vehiculo);
    },
    [setField],
  );

  const handleTipoVehiculoCreado = useCallback(
    (nuevo: RES_TipoVehiculo) => {
      setTiposVehiculo((prev) => [
        nuevo,
        ...prev.filter((t) => t.id_tipo_vehiculo !== nuevo.id_tipo_vehiculo),
      ]);
      setField("id_tipo_vehiculo", nuevo.id_tipo_vehiculo);
    },
    [setField],
  );

  const handleConductorCreado = useCallback(
    (nuevo: RES_Conductor) => {
      setConductores((prev) => [
        nuevo,
        ...prev.filter((c) => c.id_conductor !== nuevo.id_conductor),
      ]);
      setField("id_conductor", nuevo.id_conductor);
    },
    [setField],
  );

  return {
    form,
    setField,
    reset,
    submit,
    loading,
    esEdicion,
    empresas,
    vehiculos,
    proveedores,
    tiposVehiculo,
    conductores,
    loadingEmpresas,
    loadingVehiculos,
    loadingProveedores,
    loadingTiposVehiculo,
    loadingConductores,
    cargarCatalogos,
    cargarProgramacion,
    setProveedoresSeleccionados,
    updateGuia,
    removeArchivoGuia,
    setArchivoNuevoGuia,
    handleEmpresaCreada,
    handleVehiculoCreado,
    handleProveedorCreado,
    handleCarretaCreada,
    handleTipoVehiculoCreado,
    handleConductorCreado,
  };
};
