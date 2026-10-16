import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Grid,
  Select,
  TextInput,
  Switch,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Table,
  Text,
  Loader,
  Badge,
  NumberInput,
  Checkbox,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconFileText,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { ArchivoService } from "../../../../service/archivo.service";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { ModalConcesionesProveedor } from "../../../../presentation/utils/modal-concesiones-proveedor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import {
  ConcesionesPorProveedorService,
  GuiasPrimerTramoService,
  ItemsMineralService,
} from "../../service/guias-primer-tramo.service";
import type { RES_ConcesionPorProveedor } from "../../service/guias-primer-tramo.responses";
import type {
  RES_ArchivosGuiasRecepcion,
  RES_ItemMineralDisponible,
} from "../../service/guias-primer-tramo.responses";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { ProveedorResponse } from "../../../proveedores-mineros/service/proveedores.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import { MOTIVO_TRASLADO_OPTIONS } from "../../../../shared/enums/_generic/motivo-traslado";
import { CONDICION_INGRESO_OPTIONS } from "../../../../shared/enums/_generic/condicion-ingreso";
import type {
  DTO_CrearGuiaPrimerTramo,
  DTO_ActualizarGuiaPrimerTramo,
  DTO_ItemGuiaInput,
} from "../../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";
import { useValidarDuplicadoGuiaEnVivo } from "../../hooks/useValidarDuplicadoGuiaEnVivo";

interface Props {
  opened: boolean;
  idSucursal: number;
  guia?: RES_GuiaPrimerTramo | null;
  onClose: () => void;
  onSubmit: (dto: DTO_CrearGuiaPrimerTramo) => Promise<void>;
  onUpdate?: (id: number, dto: DTO_ActualizarGuiaPrimerTramo) => Promise<void>;
}

interface ItemFormItem {
  tempId: string;
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
  tipo_item: "LOTE" | "PARTICION";
  correlativo: string;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  balanza_peso_inicial?: number | null;
  balanza_peso_final?: number | null;
  balanza_peso_neto?: number | null;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all text-xs",
  label: "text-zinc-300 font-medium text-xs mb-1 whitespace-nowrap",
};

/**
 * Identifica unívocamente un item (lote entero o partición).
 *
 * Crítico: una PARTICION tiene `id_lote_mineral` (padre) y `id_particion_lote_mineral`
 * ambos poblados. Si colapsáramos a `id_lote_mineral ?? id_particion_lote_mineral`,
 * dos particiones del mismo lote compartirían key, y seleccionar una marcaría
 * la otra. Acá discriminamos por tipo.
 */
const itemKey = (i: {
  tipo_item: "LOTE" | "PARTICION";
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
}): string => {
  if (i.tipo_item === "PARTICION") {
    return `PARTICION:${i.id_particion_lote_mineral ?? ""}`;
  }
  return `LOTE:${i.id_lote_mineral ?? ""}`;
};


/** Timestamp de creación del item. Valores no parseables caen en 0. */
const tsCreacion = (createdAt: string): number => {
  const t = Date.parse(createdAt);
  return Number.isFinite(t) ? t : 0;
};

/**
 * Parte el datetime del backend ("2026-10-13 14:38:20") en fecha y hora.
 *
 * No se usa `new Date(string)` a propósito: el formato SQLite con espacio no
 * es ISO y no está garantizado en todos los motores. El string viene ya
 * formateado, así que separar por espacios es más seguro que reinterpretarlo.
 */
const splitFechaHora = (
  valor: string | null,
): { fecha: string; hora: string } | null => {
  if (!valor) return null;
  const [fecha = "", resto = ""] = valor.trim().split(" ");
  if (!fecha) return null;
  return { fecha, hora: resto.slice(0, 5) };
};

const normalizarFechaHora = (fh: string | null | undefined): string => {
  if (!fh) return "";
  return fh.trim().replace("T", " ").slice(0, 16);
};

const recepcionGroupKey = (i: {
  vehiculo_placa?: string | null;
  fecha_hora_ingreso_vehiculo?: string | null;
  id_recepcion_unidad?: number | null;
  id_recepcion_unidad_padre?: number | null;
}): string => {
  const placa = (i.vehiculo_placa ?? "").trim().toUpperCase();
  const fechaIngreso = normalizarFechaHora(i.fecha_hora_ingreso_vehiculo);

  if (placa || fechaIngreso) {
    return `${placa}|${fechaIngreso}`;
  }
  return String(i.id_recepcion_unidad_padre ?? i.id_recepcion_unidad ?? "0");
};

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const ModalGuiaPrimerTramo = ({
  opened,
  idSucursal,
  guia,
  onClose,
  onSubmit,
  onUpdate,
}: Props) => {
  const { notifyError, notifyInfo } = useNotify();

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [carretas, setCarretas] = useState<RES_Vehiculo[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<
    RES_EmpresaTransporte[]
  >([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingEmpresasTransporte, setLoadingEmpresasTransporte] =
    useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [concesiones, setConcesiones] = useState<RES_ConcesionPorProveedor[]>(
    [],
  );
  const [loadingConcesiones, setLoadingConcesiones] = useState(false);
  const [idConcesion, setIdConcesion] = useState<string | null>(null);

  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idVehiculo, setIdVehiculo] = useState<string | null>(null);
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(
    null,
  );

  const [idVehiculoCarreta, setIdVehiculoCarreta] = useState<string | null>(
    null,
  );
  const [idEmpresaTransporteCarreta, setIdEmpresaTransporteCarreta] = useState<
    string | null
  >(null);

  const [motivoTraslado, setMotivoTraslado] = useState<string | null>(null);
  const [condicionIngreso, setCondicionIngreso] = useState<string | null>(null);
  const [fechaInicioTraslado, setFechaInicioTraslado] = useState<string | null>(
    todayIso(),
  );
  const [fechaEmision, setFechaEmision] = useState<string | null>(todayIso());
  const [fechaEnPlanta, setFechaEnPlanta] = useState<string | null>(todayIso());

  const [guiaRemitente, setGuiaRemitente] = useState("");
  const [guiaTransportista, setGuiaTransportista] = useState("");
  const [sinGuiaTransportista, setSinGuiaTransportista] = useState(false);

  const [documentoGuiaRemitente, setDocumentoGuiaRemitente] =
    useState<File | null>(null);
  const [documentoGuiaTransportista, setDocumentoGuiaTransportista] =
    useState<File | null>(null);

  const [conNoConformidad, setConNoConformidad] = useState(false);
  const [pesoGuiaRemision, setPesoGuiaRemision] = useState<number | null>(null);
  const [pesoVehicularTotal, setPesoVehicularTotal] = useState<number | null>(
    null,
  );
  const [idRecepcionUnidad, setIdRecepcionUnidad] = useState<number | null>(
    null,
  );
  const [documentoNotaNoConformidad, setDocumentoNotaNoConformidad] =
    useState<File | null>(null);

  // Confirmacion pendiente de reemplazo de documento. Mientras no sea null,
  // el modal de confirmacion esta visible. El file NO se asigna al state del
  // documento hasta que el usuario confirma.
  const [pendingReplacement, setPendingReplacement] = useState<{
    field: "remitente" | "transportista" | "nota_no_conformidad";
    file: File;
  } | null>(null);

  const [items, setItems] = useState<ItemFormItem[]>([]);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemsDisponibles, setItemsDisponibles] = useState<
    RES_ItemMineralDisponible[]
  >([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsFechaInicio, setItemsFechaInicio] = useState<string>(todayIso());
  const [itemsFechaFin, setItemsFechaFin] = useState<string>(todayIso());
  // Clave de la recepción activa seleccionada en la guía ("PLACA|FECHA_INGRESO").
  const [recepcionActivaKey, setRecepcionActivaKey] = useState<string | null>(
    null,
  );
  // Mapa itemKey -> id_recepcion_unidad para agrupar items por recepción
  // y permitir autocompletar las guias cuando todos comparten una sola.
  const [recepcionesPorItem, setRecepcionesPorItem] = useState<
    Map<string, number>
  >(new Map());
  const round2 = (n: number): number => Math.round(n * 100) / 100;

  const diferenciaKg = useMemo(() => {
    if (pesoVehicularTotal === null || pesoGuiaRemision === null) return 0;
    return round2(Math.abs(pesoVehicularTotal - pesoGuiaRemision));
  }, [pesoVehicularTotal, pesoGuiaRemision]);

  // Si la diferencia entre peso vehicular y peso de guía >= 1.99 TN (1990 kg), hay discrepancia
  const hayDiscrepancia = diferenciaKg >= 1990;

  useEffect(() => {
    if (hayDiscrepancia) {
      setConNoConformidad(true);
    }
  }, [hayDiscrepancia]);

  const totalBruto = useMemo(() => {
    return round2(
      items.reduce(
        (acc, it) => acc + (it.peso_inicial ?? 0),
        0,
      ),
    );
  }, [items]);

  const totalTara = useMemo(() => {
    return round2(
      items.reduce(
        (acc, it) => acc + (it.peso_final ?? 0),
        0,
      ),
    );
  }, [items]);

  const totalNeto = useMemo(() => {
    return round2(
      items.reduce(
        (acc, it) => acc + (it.peso_neto ?? 0),
        0,
      ),
    );
  }, [items]);

  /**
   * Actualiza el peso documentario de un item (lote o partición) en la guía,
   * manteniendo la regla invariante:
   * - Editar peso_inicial -> peso_final = peso_inicial - peso_neto
   * - Editar peso_final -> peso_inicial = peso_final + peso_neto
   * - Editar peso_neto -> peso_final = peso_inicial - peso_neto
   */
  const handleUpdatePesoItem = (
    tempId: string,
    field: "peso_inicial" | "peso_final" | "peso_neto",
    value: number,
  ) => {
    setItems((prev) => {
      const updated = prev.map((it) => {
        if (it.tempId !== tempId) return it;

        const val = round2(value);
        const currentIni = it.peso_inicial ?? 0;
        const currentFin = it.peso_final ?? 0;
        const currentNet = it.peso_neto ?? 0;

        let nuevoIni = currentIni;
        let nuevoFin = currentFin;
        let nuevoNet = currentNet;

        if (field === "peso_inicial") {
          nuevoIni = val;
          nuevoFin = round2(val - currentNet);
        } else if (field === "peso_final") {
          nuevoFin = val;
          nuevoIni = round2(val + currentNet);
        } else if (field === "peso_neto") {
          nuevoNet = val;
          nuevoFin = round2(currentIni - val);
        }

        return {
          ...it,
          peso_inicial: nuevoIni,
          peso_final: nuevoFin,
          peso_neto: nuevoNet,
        };
      });

      const sumGuia = round2(
        updated.reduce((acc, it) => acc + (it.peso_neto ?? 0), 0),
      );
      setPesoGuiaRemision(sumGuia);
      return updated;
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [validatingDuplicado, setValidatingDuplicado] = useState(false);

  // Validación en vivo de duplicados (debounce 400ms + AbortController).
  // Devuelve tres flags independientes (combinacion, remitente, transportista)
  // para resaltar cada input en error y bloquear el submit si hay cualquier
  // conflicto. `enabled: opened` evita validar con modal cerrado.
  const {
    validating: validatingEnVivo,
    existe_combinacion: existeCombinacionEnVivo,
    existe_remitente: existeRemitenteEnVivo,
    existe_transportista: existeTransportistaEnVivo,
    messages: mensajesDuplicado,
  } = useValidarDuplicadoGuiaEnVivo({
    id_sucursal: idSucursal,
    guia_remitente: guiaRemitente,
    guia_transportista: guiaTransportista,
    sin_guia_transportista: sinGuiaTransportista,
    id_excluir: guia?.id ?? null,
    enabled: opened,
  });

  const hayDuplicadoEnVivo =
    existeCombinacionEnVivo ||
    existeRemitenteEnVivo ||
    existeTransportistaEnVivo;

  const [openedModalProveedor, setOpenedModalProveedor] = useState(false);
  const [openedModalConcesion, setOpenedModalConcesion] = useState(false);

  // Para distinguir tractor/carreta cuando se registra un vehículo o empresa
  const [openedModalVehiculo, setOpenedModalVehiculo] = useState<
    null | "tractor" | "carreta"
  >(null);
  const [openedModalEmpresa, setOpenedModalEmpresa] = useState<
    null | "tractor" | "carreta"
  >(null);
  const [openedModalConductor, setOpenedModalConductor] = useState(false);

  // Resolución perezosa del TipoVehiculo con es_carreta=1. Se carga la primera
  // vez que se abre el submodal "Registrar Vehículo Carreta" para auto-asignar
  // el tipo correcto al crear el vehículo (de lo contrario el nuevo vehículo
  // quedaba con id_tipo_vehiculo=NULL y no aparecía en el dropdown filtrado).
  const [idTipoVehiculoCarreta, setIdTipoVehiculoCarreta] = useState<
    number | null
  >(null);
  const [loadingTipoCarreta, setLoadingTipoCarreta] = useState(false);
  const [tipoCarretaChecked, setTipoCarretaChecked] = useState(false);

  const reloadProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const res = await AuxService.get_proveedores();
      setProveedores(res.data ?? []);
    } catch (e) {
      console.error("Error al recargar proveedores", e);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const reloadConcesiones = async (provId: number) => {
    setLoadingConcesiones(true);
    try {
      const data =
        await ConcesionesPorProveedorService.get_concesiones_by_proveedor(
          provId,
        );
      setConcesiones(data);
    } catch (e) {
      console.error("Error al recargar concesiones del proveedor", e);
    } finally {
      setLoadingConcesiones(false);
    }
  };

  const handleProveedorCreado = async (nuevo: ProveedorResponse) => {
    await reloadProveedores();
    setIdProveedor(String(nuevo.id_proveedor));
  };

  const handleConcesionCreada = async (newIdConcesion: number) => {
    if (idProveedor) {
      await reloadConcesiones(Number(idProveedor));
      setIdConcesion(String(newIdConcesion));
    }
  };

  /**
   * Handler del Select de proveedor. Si ya hay items cargados y el operador
   * cambia a otro proveedor, pide confirmacion previa: al confirmar, limpia
   * los items, recepcionesPorItem, pesosOficialesPorLote y los inputs de guias
   * (autocompletados desde la recepcion) via `sincronizarGuiasPorRecepciones([])`.
   *
   * Si no hay items o el valor no cambia, asigna directamente. Esto incluye
   * el caso del autocompletado (que setea idProveedor desde handleAgregarItems
   * y NO pasa por aqui).
   */
  const handleProveedorChange = (newVal: string | null) => {
    if (newVal === idProveedor || items.length === 0) {
      setIdProveedor(newVal);
      return;
    }

    mostrarConfirmacion({
      title: "Cambiar proveedor y limpiar items",
      confirmLabel: "Sí, limpiar y cambiar",
      cancelLabel: "Cancelar",
      message: (
        <>
          Cambiar el proveedor eliminará los{" "}
          <strong className="text-rose-400">{items.length}</strong> item(s)
          actualmente seleccionados y las guías/autocompletados asociados.
          ¿Desea continuar?
        </>
      ),
      onConfirm: () => {
        setItems([]);
        setRecepcionesPorItem(new Map());
        setIdProveedor(newVal);
        void sincronizarGuiasPorRecepciones([]);
      },
    });
  };

  // Refresca el catálogo de vehículos (tractores/carretas) tras un registro exitoso
  const handleVehiculoCreado = async (
    vehiculo: { id_vehiculo: number; es_carreta?: number | boolean | null },
    destino: "tractor" | "carreta",
  ) => {
    // Re-cargar ambos catálogos desde el backend
    const [tractorRes, carretaRes] = await Promise.all([
      AuxService.get_vehiculos(),
      AuxService.get_vehiculos(),
    ]);
    setVehiculos(
      tractorRes.filter((v) => !v.es_carreta || Number(v.es_carreta) === 0),
    );
    setCarretas(
      carretaRes.filter((v) => !!v.es_carreta && Number(v.es_carreta) === 1),
    );
    const idStr = String(vehiculo.id_vehiculo);
    if (destino === "tractor") {
      setIdVehiculo(idStr);
      // Auto-completar empresa si aún no hay
      if (!idEmpresaTransporte) {
        const v = tractorRes.find(
          (x) => x.id_vehiculo === vehiculo.id_vehiculo,
        );
        if (v && v.id_empresa_transporte) {
          setIdEmpresaTransporte(String(v.id_empresa_transporte));
        }
      }
    } else {
      setIdVehiculoCarreta(idStr);
    }
    setOpenedModalVehiculo(null);
  };

  // Abre el submodal de registro de vehículo carreta. El id_tipo_vehiculo ya
  // se resolvió eagerly en el useEffect de catálogos (`loadTipoCarreta`), así
  // que acá solo validamos el estado y abrimos el modal. Si todavía no se
  // terminó de cargar, esperamos; si no existe el tipo carreta, notificamos.
  const handleOpenCarretaVehiculoModal = () => {
    if (!tipoCarretaChecked) {
      return;
    }
    if (idTipoVehiculoCarreta === null) {
      notifyError(
        "No existe un Tipo de Vehículo marcado como 'Carreta'. Créelo en Gestión de Tipos de Vehículo antes de continuar.",
      );
      return;
    }
    setOpenedModalVehiculo("carreta");
  };

  const handleEmpresaCreada = async (
    empresa: { id: number; razon_social?: string },
    destino: "tractor" | "carreta",
  ) => {
    try {
      const lista = await AuxService.get_empresas_transporte();
      setEmpresasTransporte(lista);
    } catch (e) {
      console.error("Error al refrescar empresas de transporte", e);
    }
    const idStr = String(empresa.id);
    if (destino === "tractor") {
      setIdEmpresaTransporte(idStr);
    } else {
      setIdEmpresaTransporteCarreta(idStr);
    }
    setOpenedModalEmpresa(null);
  };

  const handleConductorCreado = (conductor: { id_conductor: number }) => {
    // El hook useRegistroConductor ya hace notifySuccess y refresca el catálogo del módulo.
    // Aquí solo recargamos el nuestro y seleccionamos el nuevo.
    (async () => {
      try {
        const lista = await AuxService.get_conductores();
        setConductores(lista);
      } catch (e) {
        console.error("Error al refrescar conductores", e);
      }
      setIdConductor(String(conductor.id_conductor));
    })();
    setOpenedModalConductor(false);
  };

  // Cargar datos al abrir en modo Edición o limpiar en creación
  useEffect(() => {
    if (opened) {
      if (guia) {
        setIdProveedor(guia.id_proveedor ? String(guia.id_proveedor) : null);
        setIdConcesion(guia.id_concesion ? String(guia.id_concesion) : null);
        setIdConductor(guia.id_conductor ? String(guia.id_conductor) : null);
        setIdVehiculo(guia.id_vehiculo ? String(guia.id_vehiculo) : null);
        setIdEmpresaTransporte(
          guia.id_empresa_transporte
            ? String(guia.id_empresa_transporte)
            : null,
        );
        setIdVehiculoCarreta(
          guia.id_vehiculo_carreta ? String(guia.id_vehiculo_carreta) : null,
        );
        setIdEmpresaTransporteCarreta(
          guia.id_empresa_transporte_carreta
            ? String(guia.id_empresa_transporte_carreta)
            : null,
        );
        setMotivoTraslado(guia.motivo_traslado || null);
        setCondicionIngreso(guia.condicion_ingreso || null);
        setFechaInicioTraslado(
          guia.fecha_inicio_traslado
            ? guia.fecha_inicio_traslado.slice(0, 10)
            : null,
        );
        setFechaEmision(
          guia.fecha_emision ? guia.fecha_emision.slice(0, 10) : null,
        );
        setFechaEnPlanta(
          guia.fecha_en_planta ? guia.fecha_en_planta.slice(0, 10) : null,
        );

        // guia_remitente y guia_transportista son strings únicos almacenados en la BD.
        setGuiaRemitente(guia.guia_remitente ?? "");
        setGuiaTransportista(guia.guia_transportista ?? "");
        setSinGuiaTransportista(!!guia.sin_guia_transportista);
        setDocumentoGuiaRemitente(null);
        setDocumentoGuiaTransportista(null);
        setConNoConformidad(!!guia.con_no_conformidad);
        setPesoGuiaRemision(
          guia.peso_guia_remision !== null && guia.peso_guia_remision !== undefined
            ? Number(guia.peso_guia_remision)
            : null,
        );
        setPesoVehicularTotal(
          guia.peso_vehicular_total !== null && guia.peso_vehicular_total !== undefined
            ? Number(guia.peso_vehicular_total)
            : null,
        );
        setIdRecepcionUnidad(guia.id_recepcion_unidad ?? null);
        setDocumentoNotaNoConformidad(null);

        const mappedItems: ItemFormItem[] = (guia.lotes || []).map((l) => ({
          tempId: `${itemKey(l)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          id_lote_mineral: l.id_lote_mineral,
          id_particion_lote_mineral: l.id_particion_lote_mineral,
          tipo_item: l.tipo_item,
          correlativo: l.correlativo || "",
          peso_inicial: l.peso_inicial,
          peso_final: l.peso_final,
          peso_neto: l.peso_neto,
          tipo_producto: l.tipo_producto,
          tipo_mineral: l.tipo_mineral,
          balanza_peso_inicial: l.balanza_peso_inicial ?? l.peso_inicial ?? null,
          balanza_peso_final: l.balanza_peso_final ?? l.peso_final ?? null,
          balanza_peso_neto: l.balanza_peso_neto ?? l.peso_neto ?? null,
        }));
        setItems(mappedItems);
      } else {
        resetForm();
      }
    }
  }, [opened, guia]);

  // Cargar catálogos globales al abrir el modal
  useEffect(() => {
    if (!opened) return;
    let isMounted = true;

    const loadProveedores = async () => {
      setLoadingProveedores(true);
      try {
        const res = await AuxService.get_proveedores();
        if (isMounted) setProveedores(res.data ?? []);
      } catch (e) {
        console.error("Error al cargar proveedores", e);
      } finally {
        if (isMounted) setLoadingProveedores(false);
      }
    };

    const loadVehiculos = async () => {
      setLoadingVehiculos(true);
      try {
        const [tractorRes, carretaRes] = await Promise.all([
          AuxService.get_vehiculos(),
          AuxService.get_vehiculos(),
        ]);
        if (isMounted) {
          setVehiculos(
            tractorRes.filter(
              (v) => !v.es_carreta || Number(v.es_carreta) === 0,
            ),
          );
          setCarretas(
            carretaRes.filter(
              (v) => !!v.es_carreta && Number(v.es_carreta) === 1,
            ),
          );
        }
      } catch (e) {
        console.error("Error al cargar vehículos", e);
      } finally {
        if (isMounted) setLoadingVehiculos(false);
      }
    };

    const loadEmpresas = async () => {
      setLoadingEmpresasTransporte(true);
      try {
        const res = await AuxService.get_empresas_transporte();
        if (isMounted) setEmpresasTransporte(res);
      } catch (e) {
        console.error("Error al cargar empresas de transporte", e);
      } finally {
        if (isMounted) setLoadingEmpresasTransporte(false);
      }
    };

    const loadConductores = async () => {
      setLoadingConductores(true);
      try {
        const res = await AuxService.get_conductores();
        if (isMounted) setConductores(res);
      } catch (e) {
        console.error("Error al cargar conductores", e);
      } finally {
        if (isMounted) setLoadingConductores(false);
      }
    };

    const loadTipoCarreta = async () => {
      setLoadingTipoCarreta(true);
      try {
        const tipos: RES_TipoVehiculo[] = await AuxService.get_tipos_vehiculo();
        if (isMounted) {
          // El backend serializa TINYINT(1) como número (0/1), no boolean.
          // Usar `Number(...) === 1` para ser consistente con el filtro
          // existente de carretas (línea `Number(v.es_carreta) === 1`).
          const tipoCarreta = tipos.find((t) => Number(t.es_carreta) === 1);
          setIdTipoVehiculoCarreta(
            tipoCarreta ? tipoCarreta.id_tipo_vehiculo : null,
          );
        }
      } catch (e) {
        console.error("Error al cargar tipos de vehículo", e);
      } finally {
        if (isMounted) {
          setLoadingTipoCarreta(false);
          setTipoCarretaChecked(true);
        }
      }
    };

    loadProveedores();
    loadVehiculos();
    loadEmpresas();
    loadConductores();
    loadTipoCarreta();

    return () => {
      isMounted = false;
    };
  }, [opened]);

  // Cargar concesiones cuando cambia el proveedor
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!idProveedor) {
        setConcesiones([]);
        setIdConcesion(null);
        return;
      }
      setLoadingConcesiones(true);
      try {
        const data =
          await ConcesionesPorProveedorService.get_concesiones_by_proveedor(
            Number(idProveedor),
          );
        if (isMounted) {
          setConcesiones(data);
          setIdConcesion((current) => {
            if (
              current &&
              data.find((c) => String(c.id_concesion) === current)
            ) {
              return current;
            }
            return null;
          });
        }
      } catch (e) {
        console.error("Error al cargar concesiones del proveedor", e);
      } finally {
        if (isMounted) setLoadingConcesiones(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [idProveedor]);

  // Autocompletar empresa de transporte al elegir vehículo
  useEffect(() => {
    if (!idVehiculo) {
      setIdEmpresaTransporte(null);
      return;
    }
    const vehiculo = vehiculos.find(
      (v) => v.id_vehiculo === Number(idVehiculo),
    );
    if (vehiculo && vehiculo.id_empresa_transporte) {
      setIdEmpresaTransporte(String(vehiculo.id_empresa_transporte));
    }
  }, [idVehiculo, vehiculos]);

  useEffect(() => {
    if (!idVehiculoCarreta) {
      setIdEmpresaTransporteCarreta(null);
      return;
    }
    const vehiculo = carretas.find(
      (v) => v.id_vehiculo === Number(idVehiculoCarreta),
    );
    if (vehiculo && vehiculo.id_empresa_transporte) {
      setIdEmpresaTransporteCarreta(String(vehiculo.id_empresa_transporte));
    }
  }, [idVehiculoCarreta, carretas]);

  const setFechas = (value: string | null) => {
    setFechaInicioTraslado(value);
    setFechaEmision(value);
    setFechaEnPlanta(value);
  };

  // Cargar items disponibles (lotes o particiones) sin filtrar por proveedor
  const handleOpenItemModal = async () => {
    const inicio = todayIso();
    const fin = fechaEnPlanta ?? todayIso();
    setItemsFechaInicio(inicio);
    setItemsFechaFin(fin);
    setOpenItemModal(true);
    setLoadingItems(true);
    try {
      const data = await ItemsMineralService.get_items_disponibles(
        idSucursal,
        idProveedor ? Number(idProveedor) : undefined,
        inicio,
        fin,
      );
      const yaSeleccionados = new Set(items.map(itemKey));
      setItemsDisponibles(
        data.filter((i) => !yaSeleccionados.has(itemKey(i)) && !i.en_guia),
      );
    } catch (e) {
      console.error("Error al cargar items disponibles", e);
      notifyError("No se pudieron cargar los items de mineral disponibles.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAgregarItems = (seleccionados: RES_ItemMineralDisponible[]) => {
    // Autocompletar el proveedor si no hay uno seteado y los items vienen del mismo.
    // El sub-modal bloquea la mezcla de proveedores cuando no hay fijo, asi que
    // podemos tomar el primero con seguridad.
    if (!idProveedor && seleccionados.length > 0) {
      const primerProveedor = seleccionados.find(
        (i) => i.id_proveedor_minero !== null,
      )?.id_proveedor_minero;
      if (primerProveedor !== null && primerProveedor !== undefined) {
        setIdProveedor(String(primerProveedor));
      }
    }

    const nuevos: ItemFormItem[] = seleccionados.map((i) => ({
      tempId: `${itemKey(i)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      id_lote_mineral: i.tipo_item === "PARTICION" ? null : i.id_lote_mineral,
      id_particion_lote_mineral:
        i.tipo_item === "LOTE" ? null : i.id_particion_lote_mineral,
      tipo_item: i.tipo_item,
      correlativo: i.correlativo,
      peso_inicial: i.peso_inicial,
      peso_final: i.peso_final,
      peso_neto: i.peso_neto,
      tipo_producto: i.tipo_producto,
      tipo_mineral: i.tipo_mineral,
      balanza_peso_inicial: i.balanza_peso_inicial ?? i.peso_inicial ?? null,
      balanza_peso_final: i.balanza_peso_final ?? i.peso_final ?? null,
      balanza_peso_neto: i.balanza_peso_neto ?? i.peso_neto ?? null,
    }));
    const merged: ItemFormItem[] = [...items, ...nuevos];
    setItems(merged);

    if (seleccionados.length > 0) {
      setRecepcionActivaKey(recepcionGroupKey(seleccionados[0]));
    }

    const sumGuia = round2(
      merged.reduce((acc, it) => acc + (it.peso_neto ?? 0), 0),
    );
    const sumVehicular = round2(
      merged.reduce(
        (acc, it) => acc + (it.balanza_peso_neto ?? it.peso_neto ?? 0),
        0,
      ),
    );
    setPesoGuiaRemision(sumGuia);
    setPesoVehicularTotal(sumVehicular);

    // Construir el Map temporal de recepciones SINCRONAMENTE para pasarselo
    // al helper de sincronizacion. Esto evita el bug de timing del setState
    // de recepcionesPorItem (React batchea, el state nuevo no esta disponible
    // todavia cuando se llama al helper).
    const tempRecepciones = new Map(recepcionesPorItem);
    for (const i of seleccionados) {
      // Para PARTICIONES, la recepcion ficticia no tiene guias; usar la
      // del lote padre (recepcion_unidad_padre) que es donde se capturo la
      // guia_remitente, guia_transportista y documentos_programacion.
      const idRecep = i.id_recepcion_unidad_padre ?? i.id_recepcion_unidad;
      if (idRecep) tempRecepciones.set(itemKey(i), idRecep);
    }
    setRecepcionesPorItem(tempRecepciones);
    setOpenItemModal(false);

    // Sincronizar los inputs de guias (autocompletar o limpiar) segun
    // si los items resultantes siguen perteneciendo a una sola recepcion.
    void sincronizarGuiasPorRecepciones(merged, tempRecepciones);
  };

  const handleEliminarItem = (tempId: string) => {
    const itemsRestantes = items.filter((i) => i.tempId !== tempId);
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
    if (itemsRestantes.length === 0) {
      setRecepcionActivaKey(null);
    }
    const sumGuia = round2(
      itemsRestantes.reduce((acc, it) => acc + (it.peso_neto ?? 0), 0),
    );
    const sumVehicular = round2(
      itemsRestantes.reduce(
        (acc, it) => acc + (it.balanza_peso_neto ?? it.peso_neto ?? 0),
        0,
      ),
    );
    setPesoGuiaRemision(itemsRestantes.length > 0 ? sumGuia : null);
    setPesoVehicularTotal(itemsRestantes.length > 0 ? sumVehicular : null);
    // Sincronizar los inputs de guias (autocompletar o limpiar) segun
    // si los items resultantes siguen perteneciendo a una sola recepcion.
    void sincronizarGuiasPorRecepciones(itemsRestantes);
  };

  /**
   * Sincroniza los inputs de guias (textos + archivos) con la lista actual
   * de items:
   * - size === 1: si los inputs estan vacios, autocompletar desde la
   *   recepcion unica. Si ya estan poblados, no tocar.
   * - size !== 1 (mezcla de recepciones o 0 items): limpiar los 4 inputs.
   *
   * Centraliza la logica para que se aplique consistente desde
   * handleAgregarItems y handleEliminarItem.
   */
  const sincronizarGuiasPorRecepciones = async (
    itemsActuales: ItemFormItem[],
    recepcionesOverride?: Map<string, number>,
  ): Promise<void> => {
    const mapaRecepciones = recepcionesOverride ?? recepcionesPorItem;
    const recepciones = new Set<number>();
    for (const it of itemsActuales) {
      const id = mapaRecepciones.get(itemKey(it));
      if (id) recepciones.add(id);
    }

    if (recepciones.size !== 1) {
      // 0 items, o mezcla de recepciones. Limpiar inputs.
      setIdRecepcionUnidad(null);
      setGuiaRemitente("");
      setGuiaTransportista("");
      setDocumentoGuiaRemitente(null);
      setDocumentoGuiaTransportista(null);
      if (itemsActuales.length > 0) {
        notifyInfo(
          "Los items seleccionados pertenecen a múltiples recepciones. Las guías se han limpiado.",
        );
      }
      return;
    }

    // size === 1. Decidir si autocompletar o mantener.
    const unicaRecepcion = recepciones.values().next().value as number;
    setIdRecepcionUnidad(unicaRecepcion);

    // Fetch explicito al endpoint: trae vehiculo, conductor, textos (guia_remitente,
    // guia_transportista) y los archivos (documentos_programacion)
    // directamente desde recepcion_unidad de la BD.
    let dataRecepcion: RES_ArchivosGuiasRecepcion;
    try {
      dataRecepcion =
        await ItemsMineralService.get_archivos_guias_by_recepcion(
          unicaRecepcion,
        );
    } catch {
      return;
    }

    // Autocompletar vehiculo (tractor), carreta, conductor y empresa si estan vacios
    if (!idVehiculo && dataRecepcion.id_vehiculo) {
      setIdVehiculo(String(dataRecepcion.id_vehiculo));
    }
    if (!idVehiculoCarreta && dataRecepcion.id_vehiculo_carreta) {
      setIdVehiculoCarreta(String(dataRecepcion.id_vehiculo_carreta));
    }
    if (!idConductor && dataRecepcion.id_conductor) {
      setIdConductor(String(dataRecepcion.id_conductor));
    }
    if (!idEmpresaTransporte && dataRecepcion.id_empresa_transporte) {
      setIdEmpresaTransporte(String(dataRecepcion.id_empresa_transporte));
    }

    const inputsVacios =
      guiaRemitente.trim() === "" &&
      guiaTransportista.trim() === "" &&
      documentoGuiaRemitente === null &&
      documentoGuiaTransportista === null;

    if (!inputsVacios) {
      return;
    }

    if (
      dataRecepcion.guia_remitente !== null &&
      dataRecepcion.guia_remitente !== undefined
    ) {
      // console.log("[autocompletar] SET guiaRemitente =", dataRecepcion.guia_remitente);
      setGuiaRemitente(dataRecepcion.guia_remitente);
    }
    if (
      !sinGuiaTransportista &&
      dataRecepcion.guia_transportista !== null &&
      dataRecepcion.guia_transportista !== undefined
    ) {
      // console.log("[autocompletar] SET guiaTransportista =", dataRecepcion.guia_transportista);
      setGuiaTransportista(dataRecepcion.guia_transportista);
    }

    const docs = dataRecepcion.documentos;
    if (!docs) return;

    if (docs.guia_remitente?.url) {
      // console.log("[autocompletar] descargar archivo remitente", docs.guia_remitente);
      const file = await descargarArchivoADocumento(docs.guia_remitente);
      // console.log("[autocompletar] archivo remitente descargado?", !!file);
      if (file) setDocumentoGuiaRemitente(file);
    }
    if (
      !sinGuiaTransportista &&
      docs.guia_transportista?.url &&
      !documentoGuiaTransportista
    ) {
      // console.log("[autocompletar] descargar archivo transportista", docs.guia_transportista);
      const file = await descargarArchivoADocumento(docs.guia_transportista);
      // console.log("[autocompletar] archivo transportista descargado?", !!file);
      if (file) setDocumentoGuiaTransportista(file);
    }
  };

  /**
   * Mapea una extension de archivo a un MIME type. Usado como fallback
   * cuando el blob del backend llega con `application/octet-stream` y
   * no podemos inferir el tipo real desde el blob.
   */
  const mimeFromExtension = (ext: string): string => {
    const map: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return map[ext.toLowerCase()] || "application/octet-stream";
  };

  /**
   * Lee los primeros bytes de un Blob para detectar el tipo real del
   * archivo via magic bytes. Usado como ultimo fallback cuando tanto
   * blob.type como mimeFromExtension fallan (archivos viejos guardados
   * como .bin en storage que el backend no sabe tipar).
   *
   * Devuelve {mime, ext} o null si no reconoce los magic bytes.
   */
  const detectFromMagicBytes = async (
    b: Blob,
  ): Promise<{ mime: string; ext: string } | null> => {
    try {
      const buf = await b.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buf);
      // PDF: 25 50 44 46 (%PDF)
      if (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46
      ) {
        return { mime: "application/pdf", ext: "pdf" };
      }
      // ZIP / DOCX / XLSX: 50 4B 03 04 (PK..)
      if (
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      ) {
        // DOCX vs XLSX: DOCX tiene "word/" en offsets 38+, XLSX "xl/".
        // Por simplicidad y dado el dominio (documentos administrativos),
        // asumimos DOCX si no podemos leer mas profundo.
        const headerTail = Array.from(bytes.slice(4, 12))
          .map((b) => String.fromCharCode(b))
          .join("");
        if (headerTail.includes("xl")) {
          return {
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ext: "xlsx",
          };
        }
        return {
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ext: "docx",
        };
      }
      // PNG: 89 50 4E 47 (.PNG)
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        return { mime: "image/png", ext: "png" };
      }
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { mime: "image/jpeg", ext: "jpg" };
      }
      // GIF: 47 49 46 38 (GIF8)
      if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38
      ) {
        return { mime: "image/gif", ext: "gif" };
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Descarga un archivo de guias desde el backend (endpoint autenticado
   * via JWT) y lo convierte a un objeto File para el MultiFilePicker.
   * Devuelve null si falla la peticion o el tipo MIME no se puede inferir.
   */
  const descargarArchivoADocumento = async (
    archivo: IArchivo,
  ): Promise<File | null> => {
    if (!archivo.path_relativo) {
      return null;
    }
    const base = archivo.nombre_original || "archivo";
    let ext =
      archivo.extension && archivo.extension !== "bin" ? archivo.extension : "";
    let nombreCompleto =
      ext && !base.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
        ? `${base}.${ext}`
        : base;
    try {
      const blob = await ArchivoService.descargarArchivo(
        archivo.path_relativo,
        nombreCompleto,
      );
      let tipo =
        blob.type && blob.type !== "application/octet-stream"
          ? blob.type
          : mimeFromExtension(ext);

      // Ultimo fallback: detectar tipo real por magic bytes del blob.
      // Cubre archivos viejos guardados como .bin donde el backend no
      // puede inferir nada y la extension reportada tampoco sirve.
      if (!tipo || tipo === "application/octet-stream") {
        const detected = await detectFromMagicBytes(blob);
        if (detected) {
          tipo = detected.mime;
          if (!ext) {
            ext = detected.ext;
            const baseName = nombreCompleto.includes(".")
              ? nombreCompleto.split(".").slice(0, -1).join(".")
              : nombreCompleto;
            nombreCompleto = `${baseName}.${ext}`;
          }
        }
      }

      return new File([blob], nombreCompleto, { type: tipo });
    } catch {
      return null;
    }
  };

  /**
   * Handler unificado para los inputs de archivos de los documentos de la
   * guia. Si ya existe un archivo guardado para ese campo (modo edicion),
   * abre un modal controlado que pide confirmacion antes de sobrescribirlo.
   */
  const handleFilesChange = (
    field: "remitente" | "transportista" | "nota_no_conformidad",
    files: File[],
  ) => {
    // El MultiFilePicker envia `[]` cuando el usuario pulsa "Limpiar nuevos"
    // o elimina el unico archivo desde la papelera del card. Hay que tratarlo
    // como una operacion valida de limpieza y NO como un payload vacio a ignorar.
    if (files.length === 0) {
      if (field === "remitente") setDocumentoGuiaRemitente(null);
      else if (field === "transportista") setDocumentoGuiaTransportista(null);
      else setDocumentoNotaNoConformidad(null);
      return;
    }
    const file = files[0];
    const existing =
      field === "remitente"
        ? guia?.documentos?.guia_remitente
        : field === "transportista"
          ? guia?.documentos?.guia_transportista
          : guia?.documentos?.nota_no_conformidad;
    if (existing) {
      setPendingReplacement({ field, file });
    } else {
      if (field === "remitente") setDocumentoGuiaRemitente(file);
      else if (field === "transportista") setDocumentoGuiaTransportista(file);
      else setDocumentoNotaNoConformidad(file);
    }
  };

  const handleConfirmReplacement = () => {
    if (!pendingReplacement) return;
    if (pendingReplacement.field === "remitente") {
      setDocumentoGuiaRemitente(pendingReplacement.file);
    } else if (pendingReplacement.field === "transportista") {
      setDocumentoGuiaTransportista(pendingReplacement.file);
    } else {
      setDocumentoNotaNoConformidad(pendingReplacement.file);
    }
    setPendingReplacement(null);
  };

  const handleCancelReplacement = () => {
    setPendingReplacement(null);
  };

  const resetForm = () => {
    setIdProveedor(null);
    setIdConcesion(null);
    setConcesiones([]);
    setIdConductor(null);
    setIdVehiculo(null);
    setIdEmpresaTransporte(null);
    setIdVehiculoCarreta(null);
    setIdEmpresaTransporteCarreta(null);
    setMotivoTraslado("Venta");
    setCondicionIngreso(null);
    setFechaInicioTraslado(todayIso());
    setFechaEmision(todayIso());
    setFechaEnPlanta(todayIso());
    setGuiaRemitente("");
    setGuiaTransportista("");
    setSinGuiaTransportista(false);
    setDocumentoGuiaRemitente(null);
    setDocumentoGuiaTransportista(null);
    setConNoConformidad(false);
    setPesoGuiaRemision(null);
    setPesoVehicularTotal(null);
    setIdRecepcionUnidad(null);
    setDocumentoNotaNoConformidad(null);
    setItems([]);
    setRecepcionesPorItem(new Map());
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleConfirmar = async () => {
    if (!idProveedor) return notifyError("Seleccione un proveedor.");
    if (!idConcesion) return notifyError("Seleccione una concesión.");
    if (!idConductor) return notifyError("Seleccione un conductor.");
    if (!idVehiculo) return notifyError("Seleccione un vehículo.");
    if (!motivoTraslado)
      return notifyError("Seleccione el motivo de traslado.");
    if (items.length === 0)
      return notifyError("Debe agregar al menos un item a la guía.");

    const guiaRemitenteTrim = guiaRemitente.trim();
    if (!guiaRemitenteTrim) {
      return notifyError("Debe ingresar el número de guía del remitente.");
    }

    const numeroGuiaTransportista = sinGuiaTransportista
      ? null
      : guiaTransportista.trim() || null;

    // Chequeo pre-submit: si ya existe una guía activa con la misma
    // combinación (guia_remitente + transportista / sin_guia_transportista),
    // advertimos con notifyError y NO enviamos el POST. El modal permanece
    // abierto para que el operador cambie los valores. En edición pasamos
    // `id_excluir` con el id de la guía actual para no chocar consigo misma.
    try {
      setValidatingDuplicado(true);
      const resultadoValidacion =
        await GuiasPrimerTramoService.validar_duplicado({
          id_sucursal: idSucursal,
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          id_excluir: guia?.id ?? null,
        });

      if (resultadoValidacion.existe) {
        const msgs = resultadoValidacion.messages ?? {};
        const msgPrincipal =
          msgs.combinacion ??
          msgs.remitente ??
          msgs.transportista ??
          "Ya existe una guía activa con esos datos.";
        notifyError(msgPrincipal);
        return;
      }
    } catch (e) {
      console.error("Error al validar duplicado de guía", e);
      notifyError("No se pudo validar la guía. Intente nuevamente.");
      return;
    } finally {
      setValidatingDuplicado(false);
    }

    const getFinalDateTime = (
      currentVal: string | null,
      originalVal: string | null | undefined,
    ): string | null => {
      if (!currentVal) return null;
      if (originalVal && originalVal.startsWith(currentVal)) {
        return originalVal;
      }
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      return `${currentVal} ${hrs}:${mins}:${secs}`;
    };

    const itemsDto: DTO_ItemGuiaInput[] = items.map((i) => ({
      id_lote_mineral: i.id_lote_mineral,
      id_particion_lote_mineral: i.id_particion_lote_mineral,
      peso_inicial:
        i.peso_inicial !== null && i.peso_inicial !== undefined
          ? round2(Number(i.peso_inicial))
          : 0,
      peso_final:
        i.peso_final !== null && i.peso_final !== undefined
          ? round2(Number(i.peso_final))
          : 0,
      peso_neto:
        i.peso_neto !== null && i.peso_neto !== undefined
          ? round2(Number(i.peso_neto))
          : 0,
    }));

    setSubmitting(true);
    try {
      if (guia) {
        if (!onUpdate) return;
        const dto: DTO_ActualizarGuiaPrimerTramo = {
          id_sucursal: idSucursal,
          id_recepcion_unidad: idRecepcionUnidad,
          con_no_conformidad: conNoConformidad,
          peso_guia_remision: pesoGuiaRemision,
          peso_vehicular_total: pesoVehicularTotal,
          id_proveedor: Number(idProveedor),
          id_concesion: Number(idConcesion),
          id_conductor: Number(idConductor),
          id_vehiculo: Number(idVehiculo),
          id_empresa_transporte: idEmpresaTransporte
            ? Number(idEmpresaTransporte)
            : null,
          id_vehiculo_carreta: idVehiculoCarreta
            ? Number(idVehiculoCarreta)
            : null,
          id_empresa_transporte_carreta: idEmpresaTransporteCarreta
            ? Number(idEmpresaTransporteCarreta)
            : null,
          motivo_traslado: motivoTraslado,
          condicion_ingreso: condicionIngreso,
          fecha_inicio_traslado: getFinalDateTime(
            fechaInicioTraslado,
            guia.fecha_inicio_traslado,
          ),
          fecha_emision: getFinalDateTime(fechaEmision, guia.fecha_emision),
          fecha_en_planta: getFinalDateTime(
            fechaEnPlanta,
            guia.fecha_en_planta,
          ),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: itemsDto,
          documento_guia_remitente: documentoGuiaRemitente,
          documento_guia_transportista: sinGuiaTransportista
            ? null
            : documentoGuiaTransportista,
          documento_nota_no_conformidad: documentoNotaNoConformidad,
          motivo: null,
        };
        await onUpdate(guia.id, dto);
      } else {
        const dto: DTO_CrearGuiaPrimerTramo = {
          id_sucursal: idSucursal,
          id_recepcion_unidad: idRecepcionUnidad,
          con_no_conformidad: conNoConformidad,
          peso_guia_remision: pesoGuiaRemision,
          peso_vehicular_total: pesoVehicularTotal,
          id_proveedor: Number(idProveedor),
          id_concesion: Number(idConcesion),
          id_conductor: Number(idConductor),
          id_vehiculo: Number(idVehiculo),
          id_empresa_transporte: idEmpresaTransporte
            ? Number(idEmpresaTransporte)
            : null,
          id_vehiculo_carreta: idVehiculoCarreta
            ? Number(idVehiculoCarreta)
            : null,
          id_empresa_transporte_carreta: idEmpresaTransporteCarreta
            ? Number(idEmpresaTransporteCarreta)
            : null,
          motivo_traslado: motivoTraslado,
          condicion_ingreso: condicionIngreso,
          fecha_inicio_traslado: getFinalDateTime(fechaInicioTraslado, null),
          fecha_emision: getFinalDateTime(fechaEmision, null),
          fecha_en_planta: getFinalDateTime(fechaEnPlanta, null),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: itemsDto,
          documento_guia_remitente: documentoGuiaRemitente,
          documento_guia_transportista: sinGuiaTransportista
            ? null
            : documentoGuiaTransportista,
          documento_nota_no_conformidad: documentoNotaNoConformidad,
        };
        await onSubmit(dto);
      }
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const labelConcesion = useMemo(
    () => (loadingConcesiones ? "Concesión: (cargando...)" : "Concesión:"),
    [loadingConcesiones],
  );

  const fechasHeader = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">
          Inicio Traslado: <span className="text-red-400">*</span>
        </span>
        <TextInput
          type="date"
          value={fechaInicioTraslado ?? ""}
          onChange={(e) => setFechas(e.currentTarget.value || null)}
          classNames={fieldClasses}
          radius="md"
          size="xs"
          style={{ width: 135 }}
          required
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">
          Emisión:
        </span>
        <TextInput
          type="date"
          value={fechaEmision ?? ""}
          onChange={(e) => setFechaEmision(e.currentTarget.value || null)}
          classNames={fieldClasses}
          radius="md"
          size="xs"
          style={{ width: 135 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">
          En Planta:
        </span>
        <TextInput
          type="date"
          value={fechaEnPlanta ?? ""}
          onChange={(e) => setFechaEnPlanta(e.currentTarget.value || null)}
          classNames={fieldClasses}
          radius="md"
          size="xs"
          style={{ width: 135 }}
        />
      </div>
    </div>
  );

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleClose}
        title={guia ? "Editar Guía" : "Registrar Guía"}
        size="78rem"
        rightSection={fechasHeader}
      >
        <Stack
          gap="md"
          className="max-h-[85vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* ========== 1. Proveedor, Concesión y Guías ========== */}
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Proveedor:"
                  placeholder={
                    loadingProveedores ? "Cargando..." : "Seleccione"
                  }
                  searchable
                  clearable
                  data={proveedores.map((p) => ({
                    value: String(p.id_proveedor),
                    label:
                      p.razon_social + (p.documento ? ` (${p.documento})` : ""),
                  }))}
                  value={idProveedor}
                  onChange={handleProveedorChange}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingProveedores}
                  rightSection={
                    loadingProveedores ? <Loader size={16} /> : undefined
                  }
                  required
                  className="flex-1"
                />
                <Tooltip
                  label="Registrar Nuevo Proveedor Minero"
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="36px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalProveedor(true)}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label={labelConcesion}
                  placeholder={
                    loadingConcesiones ? "Cargando..." : "Seleccione"
                  }
                  searchable
                  clearable
                  data={concesiones.map((c) => ({
                    value: String(c.id_concesion),
                    label: c.nombre,
                  }))}
                  value={idConcesion}
                  onChange={setIdConcesion}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  required
                  disabled={!idProveedor || loadingConcesiones}
                  rightSection={
                    loadingConcesiones ? <Loader size={16} /> : undefined
                  }
                  className="flex-1"
                />
                <Tooltip
                  label={
                    idProveedor
                      ? "Asociar o Crear Concesión"
                      : "Seleccione primero un proveedor"
                  }
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="36px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    disabled={!idProveedor}
                    onClick={() => setOpenedModalConcesion(true)}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="N° Guía Remitente:"
                placeholder="Ej. 001-12345"
                value={guiaRemitente}
                onChange={(e) =>
                  setGuiaRemitente(e.currentTarget.value.toUpperCase())
                }
                classNames={fieldClasses}
                radius="lg"
                size="sm"
                maxLength={20}
                required
                error={
                  existeRemitenteEnVivo
                    ? (mensajesDuplicado.remitente ??
                      "Ya existe otra guía activa con este número de guía remitente.")
                    : undefined
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-300 font-medium text-xs whitespace-nowrap">
                    N° Guía Transportista:
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-400 select-none hover:text-zinc-200 transition-colors">
                    <span>Sin guía</span>
                    <Switch
                      checked={sinGuiaTransportista}
                      onChange={(e) =>
                        setSinGuiaTransportista(e.currentTarget.checked)
                      }
                      color="amber"
                      size="xs"
                    />
                  </label>
                </div>
                <TextInput
                  placeholder={
                    sinGuiaTransportista
                      ? "(Sin guía transportista)"
                      : "Ej. 001-12345"
                  }
                  value={guiaTransportista}
                  onChange={(e) =>
                    setGuiaTransportista(e.currentTarget.value.toUpperCase())
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  maxLength={20}
                  disabled={sinGuiaTransportista}
                  error={
                    existeTransportistaEnVivo
                      ? (mensajesDuplicado.transportista ??
                        "Ya existe otra guía activa con este número de guía transportista.")
                      : undefined
                  }
                />
              </div>
            </Grid.Col>
          </Grid>

          {/* Indicador de validación de duplicados */}
          {validatingEnVivo && (
            <Group gap="xs" align="center" pl="xs">
              <Loader size={12} color="yellow" />
              <Text size="xs" c="dimmed">
                Validando duplicados…
              </Text>
            </Group>
          )}

          {/* ========== 2. Vehículos y Conductor ========== */}
          <Grid columns={10} gutter="xs">
            <Grid.Col span={{ base: 10, sm: 2 }}>
              <Group gap={6} align="flex-end" wrap="nowrap">
                <Select
                  label="Vehículo (Tractor):"
                  placeholder={loadingVehiculos ? "Cargando..." : "Seleccione"}
                  searchable
                  clearable
                  data={vehiculos.map((v) => ({
                    value: String(v.id_vehiculo),
                    label: String(v.placa || `Vehículo #${v.id_vehiculo}`),
                  }))}
                  value={idVehiculo}
                  onChange={setIdVehiculo}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingVehiculos}
                  rightSection={
                    loadingVehiculos ? <Loader size={16} /> : undefined
                  }
                  required
                  className="flex-1 min-w-0"
                />
                <Tooltip label="Registrar nuevo Vehículo" withArrow radius="md">
                  <ActionIcon
                    size="32px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalVehiculo("tractor")}
                    className="mb-0.5 shrink-0"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 10, sm: 2 }}>
              <Group gap={6} align="flex-end" wrap="nowrap">
                <Select
                  label="Empresa Transporte:"
                  placeholder={
                    loadingEmpresasTransporte ? "Cargando..." : "Seleccione"
                  }
                  searchable
                  clearable
                  data={empresasTransporte.map((e) => ({
                    value: String(e.id_empresa_transporte),
                    label: e.razon_social,
                  }))}
                  value={idEmpresaTransporte}
                  onChange={setIdEmpresaTransporte}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingEmpresasTransporte}
                  rightSection={
                    loadingEmpresasTransporte ? <Loader size={16} /> : undefined
                  }
                  className="flex-1 min-w-0"
                />
                <Tooltip
                  label="Registrar nueva Empresa de Transporte"
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="32px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalEmpresa("tractor")}
                    className="mb-0.5 shrink-0"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 10, sm: 2 }}>
              <Group gap={6} align="flex-end" wrap="nowrap">
                <Select
                  label="Vehículo Carreta:"
                  placeholder={
                    loadingVehiculos ? "Cargando..." : "Seleccione (opcional)"
                  }
                  searchable
                  clearable
                  data={carretas.map((v) => ({
                    value: String(v.id_vehiculo),
                    label: String(v.placa || `Vehículo #${v.id_vehiculo}`),
                  }))}
                  value={idVehiculoCarreta}
                  onChange={setIdVehiculoCarreta}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingVehiculos}
                  rightSection={
                    loadingVehiculos ? <Loader size={16} /> : undefined
                  }
                  className="flex-1 min-w-0"
                />
                <Tooltip
                  label="Registrar nuevo Vehículo Carreta"
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="32px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    loading={loadingTipoCarreta}
                    disabled={loadingTipoCarreta}
                    onClick={handleOpenCarretaVehiculoModal}
                    className="mb-0.5 shrink-0"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 10, sm: 2 }}>
              <Group gap={6} align="flex-end" wrap="nowrap">
                <Select
                  label="Empresa Carreta:"
                  placeholder={
                    loadingEmpresasTransporte
                      ? "Cargando..."
                      : "Seleccione (opcional)"
                  }
                  searchable
                  clearable
                  data={empresasTransporte.map((e) => ({
                    value: String(e.id_empresa_transporte),
                    label: e.razon_social,
                  }))}
                  value={idEmpresaTransporteCarreta}
                  onChange={setIdEmpresaTransporteCarreta}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingEmpresasTransporte}
                  rightSection={
                    loadingEmpresasTransporte ? <Loader size={16} /> : undefined
                  }
                  className="flex-1 min-w-0"
                />
                <Tooltip
                  label="Registrar nueva Empresa de Transporte Carreta"
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="32px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalEmpresa("carreta")}
                    className="mb-0.5 shrink-0"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 10, sm: 2 }}>
              <Group gap={6} align="flex-end" wrap="nowrap">
                <Select
                  label="Conductor:"
                  placeholder={
                    loadingConductores ? "Cargando..." : "Seleccione"
                  }
                  searchable
                  clearable
                  data={conductores.map((c) => ({
                    value: String(c.id_conductor),
                    label: `${c.nombre_completo} (${c.dni})`,
                  }))}
                  value={idConductor}
                  onChange={setIdConductor}
                  classNames={fieldClasses}
                  radius="lg"
                  size="sm"
                  disabled={loadingConductores}
                  rightSection={
                    loadingConductores ? <Loader size={16} /> : undefined
                  }
                  required
                  className="flex-1 min-w-0"
                />
                <Tooltip
                  label="Registrar nuevo Conductor"
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="32px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalConductor(true)}
                    className="mb-0.5 shrink-0"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>

          {/* ========== 3. Motivo, Condición y Pesos ========== */}
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Motivo de Traslado:"
                data={MOTIVO_TRASLADO_OPTIONS}
                value={motivoTraslado}
                onChange={setMotivoTraslado}
                classNames={fieldClasses}
                radius="lg"
                size="sm"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Condición de Ingreso:"
                placeholder="Seleccione (opcional)"
                clearable
                data={CONDICION_INGRESO_OPTIONS}
                value={condicionIngreso}
                onChange={setCondicionIngreso}
                classNames={fieldClasses}
                radius="lg"
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <NumberInput
                label="Peso Guía Remisión (kg):"
                placeholder="0.00"
                value={pesoGuiaRemision ?? ""}
                onChange={(val) =>
                  setPesoGuiaRemision(typeof val === "number" ? val : null)
                }
                decimalScale={2}
                thousandSeparator=","
                classNames={fieldClasses}
                radius="lg"
                size="sm"
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <NumberInput
                label="Peso Balanza (kg):"
                placeholder="0.00"
                value={pesoVehicularTotal ?? ""}
                onChange={(val) =>
                  setPesoVehicularTotal(typeof val === "number" ? val : null)
                }
                decimalScale={2}
                thousandSeparator=","
                classNames={fieldClasses}
                radius="lg"
                size="sm"
                min={0}
              />
            </Grid.Col>
          </Grid>

          {/* ========== 6. Documentos de las Guías ========== */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <Text size="xs" fw={700} className="text-zinc-200 uppercase tracking-wide">
                Documentos de la Guía
              </Text>
              {hayDiscrepancia && (
                <Badge
                  color="orange"
                  size="xs"
                  variant="light"
                  leftSection={<IconAlertTriangle size={12} />}
                >
                  Discrepancia: {(diferenciaKg / 1000).toFixed(2)} TN ({diferenciaKg.toLocaleString("es-PE")} kg)
                </Badge>
              )}
            </div>
            <Tooltip
              label="Bloqueado automáticamente por discrepancia de peso (≥ 1.99 TN)"
              disabled={!hayDiscrepancia}
              withArrow
              position="left"
            >
              <div>
                <Switch
                  label="Con No Conformidad"
                  checked={conNoConformidad}
                  onChange={(e) => setConNoConformidad(e.currentTarget.checked)}
                  disabled={hayDiscrepancia}
                  color="orange"
                  size="sm"
                  styles={{
                    label: {
                      color: conNoConformidad ? "#fbbf24" : "#a1a1aa",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: hayDiscrepancia ? "not-allowed" : "pointer",
                    },
                  }}
                />
              </div>
            </Tooltip>
          </div>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: conNoConformidad ? 4 : 6 }}>
              <MultiFilePicker
                label="Guía Remitente:"
                description="PDF o imagen de la guía del remitente"
                files={documentoGuiaRemitente ? [documentoGuiaRemitente] : []}
                onFilesChange={(files) => handleFilesChange("remitente", files)}
                existingFiles={
                  documentoGuiaRemitente
                    ? []
                    : guia?.documentos?.guia_remitente
                      ? [guia.documentos.guia_remitente]
                      : []
                }
                onRemoveExisting={() =>
                  notifyInfo(
                    "El archivo existente solo se puede reemplazar. Suba uno nuevo encima para sobrescribirlo.",
                  )
                }
                accept="application/pdf,image/*"
                multiple={false}
                maxFiles={1}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: conNoConformidad ? 4 : 6 }}>
              <MultiFilePicker
                label="Guía Transportista:"
                description="PDF o imagen de la guía del transportista"
                files={
                  !sinGuiaTransportista && documentoGuiaTransportista
                    ? [documentoGuiaTransportista]
                    : []
                }
                onFilesChange={(files) =>
                  handleFilesChange("transportista", files)
                }
                existingFiles={
                  !sinGuiaTransportista &&
                  !documentoGuiaTransportista &&
                  guia?.documentos?.guia_transportista
                    ? [guia.documentos.guia_transportista]
                    : []
                }
                onRemoveExisting={() =>
                  notifyInfo(
                    "El archivo existente solo se puede reemplazar. Suba uno nuevo encima para sobrescribirlo.",
                  )
                }
                accept="application/pdf,image/*"
                multiple={false}
                maxFiles={1}
              />
            </Grid.Col>

            {/* El input de Nota de No Conformidad solo se muestra si conNoConformidad está marcado */}
            {conNoConformidad && (
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <div
                  className={
                    hayDiscrepancia
                      ? "ring-2 ring-amber-500/80 rounded-xl p-1 bg-amber-500/5 transition-all"
                      : ""
                  }
                >
                  <MultiFilePicker
                    label="Nota de No Conformidad:"
                    description={
                      hayDiscrepancia
                        ? "⚠️ Requerido por discrepancia (≥ 1.99 TN)"
                        : "PDF o imagen de nota de no conformidad"
                    }
                    files={
                      documentoNotaNoConformidad
                        ? [documentoNotaNoConformidad]
                        : []
                    }
                    onFilesChange={(files) =>
                      handleFilesChange("nota_no_conformidad", files)
                    }
                    existingFiles={
                      documentoNotaNoConformidad
                        ? []
                        : guia?.documentos?.nota_no_conformidad
                          ? [guia.documentos.nota_no_conformidad]
                          : []
                    }
                    onRemoveExisting={() =>
                      notifyInfo(
                        "El archivo existente solo se puede reemplazar. Suba uno nuevo encima para sobrescribirlo.",
                      )
                    }
                    accept="application/pdf,image/*"
                    multiple={false}
                    maxFiles={1}
                  />
                </div>
              </Grid.Col>
            )}
          </Grid>

          {/* ========== 7. Items Asociados ========== */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Text size="sm" fw={700} className="text-zinc-200">
                Items Asociados (Lotes o Particiones)
              </Text>
              {items.length > 0 && (
                <Group gap="xs">
                  <Badge variant="outline" color="blue" size="xs">
                    Bruto Total: {totalBruto.toLocaleString("es-PE")} kg
                  </Badge>
                  <Badge variant="outline" color="gray" size="xs">
                    Tara Total: {totalTara.toLocaleString("es-PE")} kg
                  </Badge>
                  <Badge variant="outline" color="teal" size="xs">
                    Neto Total: {totalNeto.toLocaleString("es-PE")} kg
                  </Badge>
                </Group>
              )}
            </div>
            <Button
              size="xs"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={handleOpenItemModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Agregar Item
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 shrink-0 min-h-37.5">
            <Table
              verticalSpacing="sm"
              horizontalSpacing="md"
              className="w-full"
            >
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-300 text-xs font-semibold">
                  <th className="text-center py-3 w-28 whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="text-center py-3 min-w-85 whitespace-nowrap">
                    Correlativo
                  </th>
                  <th className="text-center py-3 w-36 whitespace-nowrap">
                    P. Bruto
                  </th>
                  <th className="text-center py-3 w-36 whitespace-nowrap">
                    Tara
                  </th>
                  <th className="text-center py-3 w-36 whitespace-nowrap">
                    P. Neto
                  </th>
                  <th
                    className="text-center py-3 w-12"
                    style={{ width: 48 }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-6 text-zinc-500 text-xs"
                    >
                      No hay items agregados. Haga clic en "+ Agregar Item" para
                      seleccionar.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr
                      key={it.tempId}
                      className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-2.5 text-center whitespace-nowrap align-middle">
                        <Badge
                          variant="light"
                          color={
                            it.tipo_item === "PARTICION" ? "violet" : "teal"
                          }
                          size="sm"
                          radius="md"
                          className="font-bold uppercase"
                        >
                          {it.tipo_item}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap align-middle">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              <IconFileText size={14} />
                            </div>
                            <Text
                              size="xs"
                              fw={700}
                              className="text-zinc-200 font-mono tracking-wider whitespace-nowrap"
                            >
                              {it.correlativo}
                            </Text>
                          </div>

                          {/* Badges de pesos en balanza del lote o partición */}
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Badge
                              variant="light"
                              color="blue"
                              size="xs"
                              radius="sm"
                              className="font-mono text-[10px] px-1.5 py-0.5 border border-blue-500/20"
                            >
                              Bruto Bal: {(it.balanza_peso_inicial ?? 0).toLocaleString("es-PE")} kg
                            </Badge>
                            <Badge
                              variant="light"
                              color="gray"
                              size="xs"
                              radius="sm"
                              className="font-mono text-[10px] px-1.5 py-0.5 border border-zinc-700"
                            >
                              Tara Bal: {(it.balanza_peso_final ?? 0).toLocaleString("es-PE")} kg
                            </Badge>
                            <Badge
                              variant="light"
                              color="teal"
                              size="xs"
                              radius="sm"
                              className="font-mono text-[10px] px-1.5 py-0.5 border border-teal-500/20 font-semibold"
                            >
                              Neto Bal: {(it.balanza_peso_neto ?? 0).toLocaleString("es-PE")} kg
                            </Badge>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 text-center align-middle whitespace-nowrap">
                        <PesoGuiaInput
                          label={`Peso inicial ${it.correlativo}`}
                          value={it.peso_inicial ?? 0}
                          onChange={(v) =>
                            handleUpdatePesoItem(it.tempId, "peso_inicial", v)
                          }
                        />
                      </td>
                      <td className="py-2.5 text-center align-middle whitespace-nowrap">
                        <PesoGuiaInput
                          label={`Peso final ${it.correlativo}`}
                          value={it.peso_final ?? 0}
                          onChange={(v) =>
                            handleUpdatePesoItem(it.tempId, "peso_final", v)
                          }
                        />
                      </td>
                      <td className="py-2.5 text-center align-middle whitespace-nowrap">
                        <PesoGuiaInput
                          label={`Peso neto ${it.correlativo}`}
                          value={it.peso_neto ?? 0}
                          color="text-emerald-400 font-semibold"
                          onChange={(v) =>
                            handleUpdatePesoItem(it.tempId, "peso_neto", v)
                          }
                        />
                      </td>
                      <td className="py-2.5 text-center align-middle">
                        <Tooltip label="Eliminar" withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleEliminarItem(it.tempId)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <Divider my="xs" color="zinc.8" />

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button
              variant="subtle"
              color="gray"
              radius="lg"
              size="sm"
              onClick={handleClose}
              disabled={submitting || validatingDuplicado}
            >
              Cancelar
            </Button>
            <Button
              radius="lg"
              size="sm"
              loading={submitting || validatingDuplicado}
              onClick={handleConfirmar}
              disabled={submitting || validatingDuplicado || hayDuplicadoEnVivo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/20 px-6"
            >
              {guia ? "Editar Guía" : "Registrar Guía"}
            </Button>
          </div>
        </Stack>
      </ModalEstandar>

      {/* Modal controlado de confirmación para reemplazo de documento */}
      <ModalEstandar
        opened={pendingReplacement !== null}
        close={handleCancelReplacement}
        title="Reemplazar documento existente"
      >
        <Stack gap="md">
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
              <IconAlertTriangle size={24} />
            </div>
            <Text size="sm" c="zinc.3" className="flex-1 leading-relaxed">
              El documento actual de{" "}
              <strong className="text-zinc-100">
                {pendingReplacement?.field === "remitente"
                  ? "la guía del remitente"
                  : pendingReplacement?.field === "transportista"
                    ? "la guía del transportista"
                    : "la nota de no conformidad"}
              </strong>{" "}
              sera reemplazado por el archivo seleccionado. Esta accion no se
              puede deshacer.
            </Text>
          </div>
          <Group justify="end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              radius="xl"
              size="sm"
              onClick={handleCancelReplacement}
            >
              Cancelar
            </Button>
            <Button
              radius="xl"
              size="sm"
              onClick={handleConfirmReplacement}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 font-semibold"
            >
              Reemplazar
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Submodal para registrar proveedor de forma rápida */}
      <ModalRegistroProveedor
        opened={openedModalProveedor}
        onClose={() => setOpenedModalProveedor(false)}
        onSuccess={handleProveedorCreado}
      />

      {/* Submodal para asociar/crear concesión de forma rápida */}
      {idProveedor && (
        <ModalConcesionesProveedor
          opened={openedModalConcesion}
          idProveedor={Number(idProveedor)}
          nombreProveedor={
            proveedores.find((p) => String(p.id_proveedor) === idProveedor)
              ?.razon_social
          }
          onClose={() => setOpenedModalConcesion(false)}
          onSuccess={handleConcesionCreada}
        />
      )}

      {/* Submodal para registrar un vehículo (tractor o carreta) */}
      <ModalEstandar
        opened={openedModalVehiculo !== null}
        close={() => setOpenedModalVehiculo(null)}
        title={
          openedModalVehiculo === "carreta"
            ? "Registrar Vehículo Carreta"
            : "Registrar Vehículo Tractor"
        }
        size="md"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={
            idEmpresaTransporte ? Number(idEmpresaTransporte) : null
          }
          idTipoVehiculo={
            openedModalVehiculo === "carreta" ? idTipoVehiculoCarreta : null
          }
          onCancel={() => setOpenedModalVehiculo(null)}
          onSuccess={(vehiculo) =>
            handleVehiculoCreado(vehiculo, openedModalVehiculo ?? "tractor")
          }
        />
      </ModalEstandar>

      {/* Submodal para registrar una empresa de transporte (tractor o carreta) */}
      <ModalEstandar
        opened={openedModalEmpresa !== null}
        close={() => setOpenedModalEmpresa(null)}
        title={
          openedModalEmpresa === "carreta"
            ? "Registrar Empresa de Transporte (Carreta)"
            : "Registrar Empresa de Transporte"
        }
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenedModalEmpresa(null)}
          onSuccess={(e) =>
            handleEmpresaCreada(e, openedModalEmpresa ?? "tractor")
          }
        />
      </ModalEstandar>

      {/* Submodal para registrar un conductor */}
      <ModalEstandar
        opened={openedModalConductor}
        close={() => setOpenedModalConductor(false)}
        title="Registrar Conductor"
        size="md"
      >
        <RegistroConductor
          onCancel={() => setOpenedModalConductor(false)}
          onSuccess={handleConductorCreado}
        />
      </ModalEstandar>

      {/* Sub-modal selección de items */}
      <ModalSeleccionarItem
        opened={openItemModal}
        loading={loadingItems}
        items={itemsDisponibles}
        fechaInicioFiltroIngreso={itemsFechaInicio}
        fechaFinFiltroIngreso={itemsFechaFin}
        idProveedorFijo={idProveedor ? Number(idProveedor) : null}
        recepcionFija={recepcionActivaKey}
        onClose={() => setOpenItemModal(false)}
        onConfirm={handleAgregarItems}
        onFechaInicioChange={async (nuevaFecha) => {
          setItemsFechaInicio(nuevaFecha);
          setLoadingItems(true);
          try {
            const data = await ItemsMineralService.get_items_disponibles(
              idSucursal,
              idProveedor ? Number(idProveedor) : undefined,
              nuevaFecha,
              itemsFechaFin,
            );
            const yaSeleccionados = new Set(items.map(itemKey));
            setItemsDisponibles(
              data.filter(
                (i) => !yaSeleccionados.has(itemKey(i)) && !i.en_guia,
              ),
            );
          } catch (e) {
            console.error("Error al cargar items disponibles", e);
            notifyError(
              "No se pudieron cargar los items de mineral disponibles.",
            );
          } finally {
            setLoadingItems(false);
          }
        }}
        onFechaFinChange={async (nuevaFecha) => {
          setItemsFechaFin(nuevaFecha);
          setLoadingItems(true);
          try {
            const data = await ItemsMineralService.get_items_disponibles(
              idSucursal,
              idProveedor ? Number(idProveedor) : undefined,
              itemsFechaInicio,
              nuevaFecha,
            );
            const yaSeleccionados = new Set(items.map(itemKey));
            setItemsDisponibles(
              data.filter(
                (i) => !yaSeleccionados.has(itemKey(i)) && !i.en_guia,
              ),
            );
          } catch (e) {
            console.error("Error al cargar items disponibles", e);
            notifyError(
              "No se pudieron cargar los items de mineral disponibles.",
            );
          } finally {
            setLoadingItems(false);
          }
        }}
      />
    </>
  );
};

// ============================================================
// Input editable para pesos documentarios del item en la guía
// ============================================================

interface PesoGuiaInputProps {
  label: string;
  value: number;
  color?: string;
  onChange: (value: number) => void;
}

const PesoGuiaInput = ({
  label,
  value,
  color,
  onChange,
}: PesoGuiaInputProps) => {
  return (
    <NumberInput
      value={value}
      onChange={(v) => {
        const parsed = typeof v === "number" ? v : parseFloat(String(v));
        if (!Number.isFinite(parsed)) return;
        onChange(parsed);
      }}
      min={0}
      decimalScale={2}
      fixedDecimalScale
      thousandSeparator=","
      hideControls
      radius="lg"
      size="xs"
      aria-label={label}
      classNames={{
        input: `text-xs h-7.5 px-2.5 font-mono text-center bg-zinc-900/60 border-zinc-800 focus:border-indigo-500 ${color ? color : "text-zinc-200"}`,
      }}
      className="mx-auto"
      style={{ width: 115 }}
    />
  );
};

// ============================================================
// Sub-modal para seleccionar items (lotes o particiones)
// ============================================================

/** Nivel 2 de la jerarquía: un proveedor dentro de una recepción de unidad. */
interface GrupoProveedor {
  key: string;
  items: RES_ItemMineralDisponible[];
}

/**
 * Nivel 1 de la jerarquía: una recepción de unidad, identificada por la placa
 * del vehículo que descendió. `totalItems` alimenta el rowspan de la celda que
 * spans todo el grupo; `createdAtMin` ordena las recepciones.
 */
interface GrupoRecepcion {
  key: string;
  placa: string | null;
  /** Datetime del ingreso del vehículo a planta. Null si el item no lo trae. */
  fecha_hora_ingreso_vehiculo: string | null;
  fechaHoraIngresoTs: number;
  proveedores: GrupoProveedor[];
  totalItems: number;
  createdAtMin: number;
}

interface ModalSeleccionarItemProps {
  opened: boolean;
  loading: boolean;
  items: RES_ItemMineralDisponible[];
  fechaInicioFiltroIngreso: string;
  fechaFinFiltroIngreso: string;
  /**
   * Si llega un id_proveedor, los items de OTROS proveedores se renderizan
   * deshabilitados (gris + tooltip) para impedir mezcla. Si es null, se
   * muestran todos pero el botón "Agregar" se bloquea si los seleccionados
   * pertenecen a mas de un proveedor.
   */
  idProveedorFijo: number | null;
  /**
   * Si la guía ya tiene items de una recepción específica, bloquea la
   * selección de items de cualquier otra recepción.
   */
  recepcionFija?: string | null;
  onClose: () => void;
  onConfirm: (seleccionados: RES_ItemMineralDisponible[]) => void;
  onFechaInicioChange: (fecha: string) => void;
  onFechaFinChange: (fecha: string) => void;
}

const ModalSeleccionarItem = ({
  opened,
  loading,
  items,
  fechaInicioFiltroIngreso,
  fechaFinFiltroIngreso,
  idProveedorFijo,
  recepcionFija,
  onClose,
  onConfirm,
  onFechaInicioChange,
  onFechaFinChange,
}: ModalSeleccionarItemProps) => {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>(
    fechaInicioFiltroIngreso,
  );
  const [fechaFin, setFechaFin] = useState<string>(fechaFinFiltroIngreso);

  useEffect(() => {
    setFechaInicio(fechaInicioFiltroIngreso);
  }, [fechaInicioFiltroIngreso]);

  useEffect(() => {
    setFechaFin(fechaFinFiltroIngreso);
  }, [fechaFinFiltroIngreso]);

  const handleClose = () => {
    setSeleccionados(new Set());
    setBusqueda("");
    onClose();
  };

  // Recepción ancla: key de la recepción del primer item seleccionado.
  // Si no hay selección, queda null. Si se fijó desde el exterior, se respeta esa.
  const recepcionAncla = useMemo<string | null>(() => {
    if (recepcionFija) return recepcionFija;
    for (const i of items) {
      if (seleccionados.has(itemKey(i))) {
        return recepcionGroupKey(i);
      }
    }
    return null;
  }, [items, seleccionados, recepcionFija]);

  // Proveedor ancla: nombre del primer item seleccionado (estable mientras
  // no se deseleccione completamente). Si no hay seleccion, queda null.
  const proveedorAncla = useMemo<string | null>(() => {
    for (const i of items) {
      if (seleccionados.has(itemKey(i)) && i.proveedor_nombre)
        return i.proveedor_nombre;
    }
    return null;
  }, [items, seleccionados]);

  const isItemDisabled = (i: RES_ItemMineralDisponible): boolean => {
    // Si ya hay una recepcion elegida, cualquier item de otra recepcion queda disabled.
    if (recepcionAncla !== null && recepcionGroupKey(i) !== recepcionAncla) {
      return true;
    }

    if (idProveedorFijo !== null) {
      return (
        i.id_proveedor_minero !== null &&
        i.id_proveedor_minero !== idProveedorFijo
      );
    }
    // Sin proveedor fijo: si ya hay un proveedor ancla (primer seleccionado),
    // cualquier item de otro proveedor queda disabled.
    if (proveedorAncla !== null) {
      const provItem = i.proveedor_nombre ?? "(Sin proveedor)";
      return provItem !== proveedorAncla;
    }
    return false;
  };

  const toggle = (key: string) => {
    const item = items.find((i) => itemKey(i) === key);
    if (item && isItemDisabled(item)) return;
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleUnidad = (r: GrupoRecepcion) => {
    if (recepcionAncla !== null && r.key !== recepcionAncla) return;
    const allItemsInR = r.proveedores.flatMap((p) => p.items);
    let targetProvider = proveedorAncla;
    if (idProveedorFijo !== null) {
      targetProvider = null;
    } else if (!targetProvider && allItemsInR.length > 0) {
      targetProvider = allItemsInR[0].proveedor_nombre ?? "(Sin proveedor)";
    }

    const validItems = allItemsInR.filter((i) => {
      if (recepcionAncla !== null && recepcionGroupKey(i) !== recepcionAncla) {
        return false;
      }
      if (idProveedorFijo !== null) {
        return (
          i.id_proveedor_minero === null ||
          i.id_proveedor_minero === idProveedorFijo
        );
      }
      if (targetProvider !== null) {
        return (i.proveedor_nombre ?? "(Sin proveedor)") === targetProvider;
      }
      return true;
    });

    if (validItems.length === 0) return;

    const allSelected = validItems.every((i) => seleccionados.has(itemKey(i)));

    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const i of allItemsInR) {
          next.delete(itemKey(i));
        }
      } else {
        for (const i of validItems) {
          next.add(itemKey(i));
        }
      }
      return next;
    });
  };

  /**
   * Detecta proveedores unicos entre los items seleccionados. Si hay mas de uno
   * y no hay proveedor fijo, devuelve los nombres para el tooltip.
   */
  const proveedoresEnSeleccion = (): { count: number; nombres: string[] } => {
    const nombresSet = new Set<string>();
    for (const i of items) {
      if (seleccionados.has(itemKey(i)) && i.proveedor_nombre) {
        nombresSet.add(i.proveedor_nombre);
      }
    }
    return { count: nombresSet.size, nombres: Array.from(nombresSet) };
  };

  const mezclaProveedores = proveedoresEnSeleccion();

  const handleConfirm = () => {
    if (idProveedorFijo === null && mezclaProveedores.count > 1) return;
    const seleccionItems = items.filter((i) => seleccionados.has(itemKey(i)));
    onConfirm(seleccionItems);
    setSeleccionados(new Set());
    setBusqueda("");
  };

  const filtrados = items.filter((i) => {
    if (busqueda.trim() === "") return true;
    const query = busqueda.toLowerCase();
    const matchesCorrelativo = i.correlativo.toLowerCase().includes(query);
    const matchesProveedor =
      i.proveedor_nombre?.toLowerCase().includes(query) ?? false;
    const matchesPlaca =
      i.vehiculo_placa?.toLowerCase().includes(query) ?? false;
    return matchesCorrelativo || matchesProveedor || matchesPlaca;
  });

  // Orden estable dentro de la jerarquía: por correlativo. El orden de las
  // recepciones se resuelve DESPUÉS, comparando la fecha de registro más
  // antigua de cada grupo (ver `gruposPorRecepcion`).
  // `slice()` evita mutar el array filtrado.
  const ordenados = filtrados
    .slice()
    .sort((a, b) => a.correlativo.localeCompare(b.correlativo));

  /**
   * Agrupación en dos niveles para las celdas con rowspan.
   *
   * Jerarquía de izquierda a derecha: Recepción de unidad (rótulo: placa) >
   * Proveedor dentro de esa recepción > lote/partición. Antes solo se agrupaba
   * por proveedor, lo que mezclaba en un mismo bloque los items de descargas
   * distintas.
   */
  const porRecepcion = new Map<
    string,
    Map<string, RES_ItemMineralDisponible[]>
  >();
  for (const it of ordenados) {
    const rk = recepcionGroupKey(it);
    let porProveedor = porRecepcion.get(rk);
    if (!porProveedor) {
      porProveedor = new Map<string, RES_ItemMineralDisponible[]>();
      porRecepcion.set(rk, porProveedor);
    }
    const pk = it.proveedor_nombre ?? "(Sin proveedor)";
    const bucket = porProveedor.get(pk);
    if (bucket) bucket.push(it);
    else porProveedor.set(pk, [it]);
  }

  // Las recepciones se apilan por fecha de registro más antigua primero (orden
  // real de llegada a planta); el id desempata cuando dos descargas comparten
  // timestamp. Proveedores alfabéticos dentro de cada recepción (igual que
  // antes) e items por correlativo.
  const gruposPorRecepcion: GrupoRecepcion[] = Array.from(
    porRecepcion.entries(),
  ).map(([rk, porProveedor]) => {
    const proveedores: GrupoProveedor[] = Array.from(porProveedor.entries())
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => a.key.localeCompare(b.key));
    const todos = proveedores.flatMap((p) => p.items);
    return {
      key: rk,
      // La placa identifica la recepción (el vehículo que descendió). Se
      // toma la primera disponible porque dentro de una misma recepción la
      // placa puede variar entre tractor y carreta.
      placa: todos.find((i) => i.vehiculo_placa)?.vehiculo_placa ?? null,
      fecha_hora_ingreso_vehiculo:
        todos.find((i) => i.fecha_hora_ingreso_vehiculo)
          ?.fecha_hora_ingreso_vehiculo ?? null,
      fechaHoraIngresoTs: (() => {
        const fh = todos.find((i) => i.fecha_hora_ingreso_vehiculo)
          ?.fecha_hora_ingreso_vehiculo;
        return fh ? Date.parse(fh) || 0 : 0;
      })(),
      proveedores,
      totalItems: todos.length,
      createdAtMin: todos.reduce(
        (min, i) => Math.min(min, tsCreacion(i.created_at)),
        Infinity,
      ),
    };
  });

  gruposPorRecepcion.sort((a, b) => {
    if (a.fechaHoraIngresoTs !== b.fechaHoraIngresoTs) {
      return a.fechaHoraIngresoTs - b.fechaHoraIngresoTs;
    }
    return a.createdAtMin !== b.createdAtMin
      ? a.createdAtMin - b.createdAtMin
      : a.key.localeCompare(b.key);
  });

  const filtrosHeader = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Buscar
        </span>
        <TextInput
          placeholder="Correlativo, placa o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
          leftSection={<IconSearch size={12} className="text-zinc-500" />}
          classNames={fieldClasses}
          radius="md"
          size="xs"
          style={{ width: 200 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Inicio
        </span>
        <CustomDatePicker
          value={fechaInicio}
          onChange={(d) => {
            if (!d) {
              const hoy = todayIso();
              setFechaInicio(hoy);
              onFechaInicioChange(hoy);
              return;
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            setFechaInicio(iso);
            onFechaInicioChange(iso);
          }}
          placeholder="DD/MM/YYYY"
          style={{ width: 140 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Fin
        </span>
        <CustomDatePicker
          value={fechaFin}
          onChange={(d) => {
            if (!d) {
              const hoy = todayIso();
              setFechaFin(hoy);
              onFechaFinChange(hoy);
              return;
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            setFechaFin(iso);
            onFechaFinChange(iso);
          }}
          placeholder="DD/MM/YYYY"
          style={{ width: 140 }}
        />
      </div>
    </div>
  );

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title="Seleccionar Lotes o Particiones"
      size="85%"
      rightSection={filtrosHeader}
    >
      <Stack gap="md">
        <div className="max-h-[55vh] overflow-x-auto overflow-y-auto rounded-xl border border-zinc-800/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Table
            verticalSpacing="xs"
            horizontalSpacing="sm"
            className="w-full min-w-180"
          >
            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
              <tr className="text-zinc-300 text-xs">
                <th className="text-center">Recepción</th>
                <th className="text-center">Proveedor</th>
                <th style={{ width: 40 }} className="text-center">
                  #
                </th>
                <th className="text-center">Tipo</th>
                <th className="text-center">Correlativo</th>
                <th className="text-center">P. Bruto</th>
                <th className="text-center">Tara</th>
                <th className="text-center">P. Neto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-4 text-zinc-400 text-xs"
                  >
                    Cargando items...
                  </td>
                </tr>
              ) : ordenados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-4 text-zinc-500 text-xs"
                  >
                    No hay items disponibles para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gruposPorRecepcion.map((r) => {
                  const allItemsInR = r.proveedores.flatMap((p) => p.items);
                  const validItemsInR = allItemsInR.filter(
                    (i) => !isItemDisabled(i),
                  );
                  const isUnitDisabled = validItemsInR.length === 0;
                  const isAllUnitSelected =
                    validItemsInR.length > 0 &&
                    validItemsInR.every((i) => seleccionados.has(itemKey(i)));
                  const isSomeUnitSelected = validItemsInR.some((i) =>
                    seleccionados.has(itemKey(i)),
                  );

                  return (
                    <Fragment key={r.key}>
                      {r.proveedores.map((g, gIdx) =>
                        g.items.map((i, idx) => {
                          const key = itemKey(i);
                          const disabled = isItemDisabled(i);
                          // Solo la primera fila de la recepción pinta la celda
                          // con rowspan, así que solo ahí hace falta partir el
                          // datetime.
                          const fhIngreso =
                            gIdx === 0 && idx === 0
                              ? splitFechaHora(r.fecha_hora_ingreso_vehiculo)
                              : null;
                          const tooltipLabel = disabled
                            ? recepcionAncla !== null &&
                              recepcionGroupKey(i) !== recepcionAncla
                              ? `Solo puedes seleccionar items de la recepción elegida (${r.placa ? r.placa.toUpperCase() : "unidad actual"}). Desmarca los items seleccionados para cambiar de recepción.`
                              : idProveedorFijo !== null
                                ? `Este item pertenece al proveedor "${i.proveedor_nombre ?? "sin nombre"}". Cambie el proveedor o limpie los items seleccionados para poder elegir este.`
                                : `Este item pertenece al proveedor "${i.proveedor_nombre ?? "sin nombre"}". Solo puedes seleccionar items del mismo proveedor ("${proveedorAncla ?? g.key}").`
                            : "";
                          return (
                            <tr
                              key={key}
                              className={`border-b border-zinc-900/40 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-zinc-900/30"} ${seleccionados.has(key) ? "bg-emerald-950/20" : ""}`}
                              onClick={() => !disabled && toggle(key)}
                            >
                              {gIdx === 0 && idx === 0 && (
                                // Ojo: NO aplicar `flex` al <td>. Un td es
                                // display:table-cell; pasarlo a flex lo saca del
                                // algoritmo de tabla y rowSpan deja de funcionar
                                // (las celdas se descuadran y las columnas se
                                // colapsan). El layout vertical va en un <div>
                                // interno.
                                <td
                                  rowSpan={r.totalItems}
                                  className="align-middle bg-zinc-800/50 border-y border-r border-l border-zinc-700/60 px-3 py-2"
                                >
                                  <div className="flex flex-col items-center gap-1.5 p-1">
                                    <div
                                      className="flex items-center gap-2 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isUnitDisabled) toggleUnidad(r);
                                      }}
                                    >
                                      <Tooltip
                                        label={
                                          isUnitDisabled
                                            ? recepcionAncla !== null &&
                                              r.key !== recepcionAncla
                                              ? "Solo puedes seleccionar items de la recepción elegida"
                                              : "No hay items seleccionables para esta unidad"
                                            : isAllUnitSelected
                                              ? "Deseleccionar todos los items de esta unidad"
                                              : "Seleccionar todos los items de esta unidad"
                                        }
                                        withArrow
                                      >
                                        <div>
                                          <Checkbox
                                            color="teal"
                                            size="xs"
                                            checked={isAllUnitSelected}
                                            indeterminate={
                                              isSomeUnitSelected &&
                                              !isAllUnitSelected
                                            }
                                            disabled={isUnitDisabled}
                                            onChange={() => toggleUnidad(r)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="cursor-pointer"
                                          />
                                        </div>
                                      </Tooltip>
                                      <Badge
                                        color="teal"
                                        size="sm"
                                        radius="md"
                                        className="font-mono font-bold uppercase tracking-wide cursor-pointer select-none"
                                      >
                                        {r.placa ? r.placa.toUpperCase() : "—"}
                                      </Badge>
                                    </div>
                                    {fhIngreso ? (
                                      <span className="flex flex-col items-center leading-tight whitespace-nowrap">
                                        <span className="font-mono text-[10px] tabular-nums text-zinc-200">
                                          {fhIngreso.fecha}
                                        </span>
                                        <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-200">
                                          {fhIngreso.hora}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-zinc-600">
                                        sin fecha
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {idx === 0 && (
                                <td
                                  rowSpan={g.items.length}
                                  className="text-center align-middle font-semibold text-zinc-200 text-xs bg-zinc-800/25 border-r border-zinc-800/80 px-3"
                                >
                                  {g.key}
                                </td>
                              )}
                              <td
                                className="text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip
                                  label={tooltipLabel}
                                  withArrow
                                  disabled={!disabled}
                                >
                                  <div className="flex justify-center">
                                    <Checkbox
                                      color="teal"
                                      size="xs"
                                      checked={seleccionados.has(key)}
                                      onChange={() => toggle(key)}
                                      disabled={disabled}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                </Tooltip>
                              </td>
                            <td className="text-center">
                              <Badge
                                variant="light"
                                color={
                                  i.tipo_item === "PARTICION"
                                    ? "violet"
                                    : "teal"
                                }
                                size="sm"
                                radius="md"
                                className="font-bold uppercase"
                              >
                                {i.tipo_item}
                              </Badge>
                            </td>
                            <td className="text-center font-mono text-zinc-100 text-xs">
                              {i.correlativo}
                            </td>
                            <td className="text-center font-mono text-zinc-200 text-xs">
                              {i.peso_inicial?.toFixed(2) ?? "—"}
                            </td>
                            <td className="text-center font-mono text-zinc-200 text-xs">
                              {i.peso_final?.toFixed(2) ?? "—"}
                            </td>
                            <td className="text-center font-mono text-emerald-300 text-xs">
                              {i.peso_neto?.toFixed(2) ?? "—"}
                            </td>
                          </tr>
                        );
                      }),
                    )}
                  </Fragment>
                );
              })
            )}
            </tbody>
          </Table>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <Text size="xs" c="dimmed">
              {seleccionados.size} seleccionado(s)
            </Text>
            {idProveedorFijo === null && mezclaProveedores.count > 1 && (
              <Text size="xs" c="red.4">
                Mezcla de proveedores detectada (
                {mezclaProveedores.nombres.join(", ")}). Selecciona items de un
                solo proveedor o asigna uno en el formulario.
              </Text>
            )}
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant="subtle"
              color="gray"
              radius="md"
              size="sm"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Tooltip
              label={
                seleccionados.size === 0
                  ? "Selecciona al menos un item."
                  : idProveedorFijo === null && mezclaProveedores.count > 1
                    ? `Mezcla de proveedores: ${mezclaProveedores.nombres.join(", ")}.`
                    : ""
              }
              withArrow
              disabled={
                !(
                  seleccionados.size === 0 ||
                  (idProveedorFijo === null && mezclaProveedores.count > 1)
                )
              }
            >
              <Button
                radius="md"
                size="sm"
                onClick={handleConfirm}
                disabled={
                  seleccionados.size === 0 ||
                  (idProveedorFijo === null && mezclaProveedores.count > 1)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Agregar{" "}
                {seleccionados.size > 0 ? `(${seleccionados.size})` : ""}
              </Button>
            </Tooltip>
          </div>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
