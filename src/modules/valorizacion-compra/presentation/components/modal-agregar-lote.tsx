import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Loader,
  Badge,
  Box,
} from "@mantine/core";
import {
  IconFileText,
  IconCoins,
  IconCheck,
  IconFlask,
} from "@tabler/icons-react";
import { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { REQ_ValorizacionDetalleItem } from "../../service/valorizacion-compra.requests";
import type { RES_ValorizacionCompraDetalle } from "../../service/valorizacion-compra.responses";

export interface GrupoAnalisisLote {
  id: number;
  nombre: string;
  numero_correlativo: number;
  ley_oro_cierre: number;
  ley_plata_cierre: number;
  ley_humedad_cierre: number;
  ley_recuperacion_cierre: number;
  tiene_propuesta_oro?: boolean;
  tiene_propuesta_plata?: boolean;
}

export interface CondicionComercialItem {
  id: number;
  elemento_quimico: string;
  ley_inicio: number;
  ley_fin: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  riesgo_comercial?: number;
}

interface LoteDisponible {
  id_lote_guia: number;
  id_lote_mineral: number;
  numero_correlativo: number | null;
  correlativo_lote: string;
  grr: string;
  grt: string;
  fecha_en_planta: string;
  tmh: number;
  ley_humedad: number;
  tms: number;
  ley_oro: number;
  ley_plata: number;
  ley_recuperacion?: number;
  id_grupo_analisis?: number | null;
  grupos_analisis?: GrupoAnalisisLote[];
  condiciones_comerciales?: CondicionComercialItem[];
  es_valorizado_oro?: boolean;
  es_valorizado_plata?: boolean;
  con_valor_comercial?: boolean;
  condicion_oro: {
    id_condicion_comercial: number;
    recuperacion: number;
    maquila: number;
    consumo: number;
  } | null;
  condicion_plata: {
    id_condicion_comercial: number;
    recuperacion: number;
    maquila: number;
    consumo: number;
  } | null;
}

interface ExistingDetalleItem {
  id_lote_guia: number;
  elemento_quimico: ElementoQuimicoValorizacion;
}

interface DetalleEditar {
  req: REQ_ValorizacionDetalleItem;
  display: RES_ValorizacionCompraDetalle;
  index: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  idProveedor: number | null;
  idValorizacionEdicion?: number;
  existingDetalles?: ExistingDetalleItem[];
  detalleEditar?: DetalleEditar | null;
  fechaHoraValorizacion?: string | null;
  onAgregarLote: (
    det: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => void;
  onEditarLote?: (
    index: number,
    det: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalAgregarLote = ({
  opened,
  onClose,
  idProveedor,
  idValorizacionEdicion,
  existingDetalles = [],
  detalleEditar = null,
  fechaHoraValorizacion,
  onAgregarLote,
  onEditarLote,
}: Props) => {
  const { notifyError, notifyWarning } = useNotify();

  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotes, setLotes] = useState<LoteDisponible[]>([]);

  const [selectedLoteGuiaId, setSelectedLoteGuiaId] = useState<string | null>(null);
  const [selectedGrupoAnalisisId, setSelectedGrupoAnalisisId] = useState<string | null>(null);
  const [elemento, setElemento] = useState<ElementoQuimicoValorizacion | null>(
    ElementoQuimicoValorizacion.Oro,
  );

  const [leyOro, setLeyOro] = useState<number | string>(0);
  const [leyPlata, setLeyPlata] = useState<number | string>(0);
  const [leyHumedad, setLeyHumedad] = useState<number | string>(0);
  const [leyRecuperacion, setLeyRecuperacion] = useState<number | string>(0);

  const [recuperacion, setRecuperacion] = useState<number | string>(0);
  const [inter, setInter] = useState<number | string>(0);
  const [desInter, setDesInter] = useState<number | string>(0);
  const [maquila, setMaquila] = useState<number | string>(0);
  const [consumo, setConsumo] = useState<number | string>(0);
  const [factor, setFactor] = useState<number | string>(1.1023);
  const [montoPenalidad, setMontoPenalidad] = useState<number | string>(0);
  const [montoFlete, setMontoFlete] = useState<number | string>(0);

  // Lookup INTER (precio_elemento_quimico) por (elemento, fecha de valorización).
  const [precioEncontrado, setPrecioEncontrado] = useState<{
    id: number;
    inter: number;
    fecha: string;
  } | null>(null);

  // La fecha proviene del padre (formato "YYYY-MM-DD HH:MM:SS" o "YYYY-MM-DD").
  // Si por algún motivo llega null, el lookup del INTER queda deshabilitado.
  const fechaCorta = fechaHoraValorizacion?.split(" ")[0] ?? null;

  useEffect(() => {
    if (!opened) {
      setLotes([]);
      setSelectedLoteGuiaId(null);
      setSelectedGrupoAnalisisId(null);
      return;
    }

    if (detalleEditar) {
      setLotes([]);
      setLoadingLotes(false);
      return;
    }

    if (!idProveedor) {
      setLotes([]);
      setSelectedLoteGuiaId(null);
      setSelectedGrupoAnalisisId(null);
      return;
    }

    const cargar = async () => {
      setLoadingLotes(true);
      try {
        const data = await AuxService.get_lotes_disponibles_valorizacion(
          idProveedor,
          idValorizacionEdicion,
        );
        // Excluir lotes ya valorizados para ambos elementos
        const disponibles = data.filter((l) => {
          const tieneOro =
            l.es_valorizado_oro ||
            existingDetalles.some(
              (d) =>
                d.id_lote_guia === l.id_lote_guia &&
                d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
            );
          const tienePlata =
            l.es_valorizado_plata ||
            existingDetalles.some(
              (d) =>
                d.id_lote_guia === l.id_lote_guia &&
                d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
            );
          return !(tieneOro && tienePlata);
        });
        setLotes(disponibles);
      } catch (err) {
        notifyError(
          err instanceof Error ? err.message : "Error al cargar lotes disponibles",
        );
      } finally {
        setLoadingLotes(false);
      }
    };

    cargar();
  }, [opened, idProveedor, idValorizacionEdicion, existingDetalles, detalleEditar, notifyError]);

  useEffect(() => {
    if (!detalleEditar) return;
    const { req, display } = detalleEditar;
    setSelectedLoteGuiaId(String(req.id_lote_guia));
    setElemento(req.elemento_quimico);
    setInter(req.inter);
    setDesInter(req.des_inter);
    setRecuperacion(req.recuperacion);
    setMaquila(req.maquila);
    setConsumo(req.consumo);
    setFactor(req.factor ?? 1.1023);
    setMontoPenalidad(display.monto_penalidad ?? 0);
    setMontoFlete(display.monto_flete ?? 0);
    setSelectedGrupoAnalisisId(req.id_grupo_analisis ? String(req.id_grupo_analisis) : null);
    setLeyOro(req.ley_oro_manual ?? (req.elemento_quimico === ElementoQuimicoValorizacion.Oro ? display.ley : 0));
    setLeyPlata(req.ley_plata_manual ?? (req.elemento_quimico === ElementoQuimicoValorizacion.Plata ? display.ley : 0));
    setLeyHumedad(req.ley_humedad_manual ?? display.ley_humedad);
    setLeyRecuperacion(req.ley_recuperacion_manual ?? 0);
    // Preserva el id_valor_elemento_quimico del detalle para no romper el envio
    setPrecioEncontrado(
      display.id_valor_elemento_quimico
        ? {
          id: display.id_valor_elemento_quimico,
          inter: req.inter,
          fecha: fechaHoraValorizacion?.split(" ")[0] ?? "",
        }
        : null,
    );
  }, [detalleEditar, fechaHoraValorizacion]);

  // Lookup del precio INTER por (elemento, fecha). No aplica en edicion.
  // Se dispara cada vez que el modal se abre o cambian los parametros.
  useEffect(() => {
    if (!opened) return;
    if (detalleEditar) return;
    if (!elemento || !fechaCorta) {
      setPrecioEncontrado(null);
      setInter(0);
      return;
    }

    let cancelado = false;
    console.log("[ModalAgregarLote] Buscar INTER:", { elemento: elemento, fecha: fechaCorta });
    AuxService.buscar_precio_elemento({
      elemento,
      fecha: fechaCorta,
    })
      .then((res) => {
        if (cancelado) return;
        console.log("[ModalAgregarLote] Respuesta INTER:", res);
        if (res.success && res.data) {
          setPrecioEncontrado({
            id: res.data.id,
            inter: res.data.inter,
            fecha: res.data.fecha,
          });
          setInter(res.data.inter);
        } else {
          setPrecioEncontrado(null);
          setInter(0);
        }
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("[ModalAgregarLote] Error al buscar INTER:", err);
        setPrecioEncontrado(null);
        setInter(0);
      });

    return () => {
      cancelado = true;
    };
  }, [opened, elemento, fechaCorta, detalleEditar]);

  const loteEnEdicion = useMemo<LoteDisponible | null>(() => {
    if (!detalleEditar) return null;
    const { display, req } = detalleEditar;
    const esOro = display.elemento_quimico === ElementoQuimicoValorizacion.Oro;
    const condicion = req.id_condicion_comercial
      ? {
        id_condicion_comercial: req.id_condicion_comercial,
        recuperacion: display.recuperacion,
        maquila: display.maquila,
        consumo: display.consumo,
      }
      : null;
    return {
      id_lote_guia: display.id_lote_guia,
      id_lote_mineral: 0,
      numero_correlativo: display.numero_correlativo ?? null,
      correlativo_lote: display.lote_correlativo || "",
      grr: display.grr || "",
      grt: display.grt || "",
      fecha_en_planta: display.fecha_ingreso || "",
      tmh: display.tmh,
      ley_humedad: display.ley_humedad,
      tms: display.tms,
      ley_oro: esOro ? display.ley : 0,
      ley_plata: !esOro ? display.ley : 0,
      id_grupo_analisis: req.id_grupo_analisis ?? display.id_grupo_analisis ?? null,
      grupos_analisis: req.id_grupo_analisis
        ? [
          {
            id: req.id_grupo_analisis,
            nombre: display.grupo_analisis_nombre || "Grupo Asignado",
            numero_correlativo: 1,
            ley_oro_cierre: req.ley_oro_manual ?? (esOro ? display.ley : 0),
            ley_plata_cierre: req.ley_plata_manual ?? (!esOro ? display.ley : 0),
            ley_humedad_cierre: req.ley_humedad_manual ?? display.ley_humedad,
            ley_recuperacion_cierre: req.ley_recuperacion_manual ?? 0,
            tiene_propuesta_oro: false,
            tiene_propuesta_plata: false,
          },
        ]
        : [],
      condicion_oro: esOro ? condicion : null,
      condicion_plata: !esOro ? condicion : null,
    };
  }, [detalleEditar]);

  const loteSeleccionado = useMemo(() => {
    if (loteEnEdicion) return loteEnEdicion;
    if (!selectedLoteGuiaId) return null;
    return lotes.find((l) => String(l.id_lote_guia) === selectedLoteGuiaId) || null;
  }, [selectedLoteGuiaId, lotes, loteEnEdicion]);

  // Precargar grupo de analisis y leyes al seleccionar lote
  useEffect(() => {
    if (detalleEditar) return;
    if (!loteSeleccionado) {
      setSelectedGrupoAnalisisId(null);
      setLeyOro(0);
      setLeyPlata(0);
      setLeyHumedad(0);
      setLeyRecuperacion(0);
      return;
    }

    const grupos = loteSeleccionado.grupos_analisis || [];
    if (grupos.length > 0) {
      const g = grupos[0];
      setSelectedGrupoAnalisisId(String(g.id));
      setLeyOro(g.ley_oro_cierre);
      setLeyPlata(g.ley_plata_cierre);
      setLeyHumedad(g.ley_humedad_cierre > 0 ? g.ley_humedad_cierre : loteSeleccionado.ley_humedad);
      setLeyRecuperacion(g.ley_recuperacion_cierre || 0);
    } else {
      setSelectedGrupoAnalisisId(null);
      setLeyOro(loteSeleccionado.ley_oro || 0);
      setLeyPlata(loteSeleccionado.ley_plata || 0);
      setLeyHumedad(loteSeleccionado.ley_humedad || 0);
      setLeyRecuperacion(0);
    }
  }, [loteSeleccionado, detalleEditar]);

  const handleSelectGrupo = (grupoIdStr: string | null) => {
    setSelectedGrupoAnalisisId(grupoIdStr);
    if (!grupoIdStr || !loteSeleccionado?.grupos_analisis) return;
    const g = loteSeleccionado.grupos_analisis.find((item) => String(item.id) === grupoIdStr);
    if (g) {
      setLeyOro(g.ley_oro_cierre);
      setLeyPlata(g.ley_plata_cierre);
      setLeyHumedad(g.ley_humedad_cierre > 0 ? g.ley_humedad_cierre : loteSeleccionado.ley_humedad);
      setLeyRecuperacion(g.ley_recuperacion_cierre || 0);
    }
  };

  const opcionesGrupos = useMemo(() => {
    if (!loteSeleccionado?.grupos_analisis) return [];
    return loteSeleccionado.grupos_analisis.map((g) => ({
      value: String(g.id),
      label: `${g.nombre} — Au: ${g.ley_oro_cierre} | Ag: ${g.ley_plata_cierre}`,
    }));
  }, [loteSeleccionado]);

  const grupoSeleccionadoObj = useMemo(() => {
    if (!selectedGrupoAnalisisId || !loteSeleccionado?.grupos_analisis) return null;
    return (
      loteSeleccionado.grupos_analisis.find(
        (g) => String(g.id) === selectedGrupoAnalisisId,
      ) || null
    );
  }, [selectedGrupoAnalisisId, loteSeleccionado]);

  // Opciones de elemento dinámicas según lo que ya se haya valorizado para el lote seleccionado
  const opcionesElementos = useMemo(() => {
    if (detalleEditar) {
      const label =
        detalleEditar.display.elemento_quimico === ElementoQuimicoValorizacion.Oro
          ? "Oro (Au)"
          : "Plata (Ag)";
      return [{ value: detalleEditar.display.elemento_quimico, label }];
    }

    if (!loteSeleccionado) {
      return [
        { value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" },
        { value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" },
      ];
    }

    const tieneOro =
      Boolean(loteSeleccionado.es_valorizado_oro) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
      );
    const tienePlata =
      Boolean(loteSeleccionado.es_valorizado_plata) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
      );

    const list = [];
    if (!tieneOro) {
      list.push({ value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" });
    }
    if (!tienePlata) {
      list.push({ value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" });
    }
    return list;
  }, [loteSeleccionado, existingDetalles, detalleEditar]);

  // Ajustar automáticamente el elemento seleccionado si ya tiene uno de los dos
  useEffect(() => {
    if (detalleEditar) return;
    if (!loteSeleccionado) return;

    const tieneOro =
      Boolean(loteSeleccionado.es_valorizado_oro) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
      );
    const tienePlata =
      Boolean(loteSeleccionado.es_valorizado_plata) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
      );

    if (tieneOro && !tienePlata) {
      setElemento(ElementoQuimicoValorizacion.Plata);
    } else if (tienePlata && !tieneOro) {
      setElemento(ElementoQuimicoValorizacion.Oro);
    } else if (
      !elemento ||
      (elemento === ElementoQuimicoValorizacion.Oro && tieneOro) ||
      (elemento === ElementoQuimicoValorizacion.Plata && tienePlata)
    ) {
      if (!tieneOro) setElemento(ElementoQuimicoValorizacion.Oro);
      else if (!tienePlata) setElemento(ElementoQuimicoValorizacion.Plata);
    }
  }, [loteSeleccionado, existingDetalles, elemento, detalleEditar]);

  const numHum = typeof leyHumedad === "number" ? leyHumedad : parseFloat(String(leyHumedad)) || 0;
  const numOro = typeof leyOro === "number" ? leyOro : parseFloat(String(leyOro)) || 0;
  const numPlata = typeof leyPlata === "number" ? leyPlata : parseFloat(String(leyPlata)) || 0;
  const numRecLey = typeof leyRecuperacion === "number" ? leyRecuperacion : parseFloat(String(leyRecuperacion)) || 0;

  // Buscar dinámicamente la condición comercial correspondiente según elemento y ley actual
  const condicionActual = useMemo(() => {
    if (!loteSeleccionado || !elemento) return null;
    const currentLey = elemento === ElementoQuimicoValorizacion.Oro ? numOro : numPlata;

    // 1. Buscar coincidencia exacta en las condiciones comerciales del proveedor por rango de ley
    if (loteSeleccionado.condiciones_comerciales && loteSeleccionado.condiciones_comerciales.length > 0) {
      const match = loteSeleccionado.condiciones_comerciales.find((c) => {
        const matchElem = c.elemento_quimico === elemento;
        const inicio = typeof c.ley_inicio === "number" ? c.ley_inicio : parseFloat(String(c.ley_inicio)) || 0;
        const fin = typeof c.ley_fin === "number" ? c.ley_fin : parseFloat(String(c.ley_fin)) || 0;
        return matchElem && currentLey >= inicio && currentLey <= fin;
      });

      if (match) {
        return {
          id_condicion_comercial: match.id,
          recuperacion: Number(match.recuperacion),
          maquila: Number(match.maquila),
          consumo: Number(match.consumo),
          ley_inicio: Number(match.ley_inicio),
          ley_fin: Number(match.ley_fin),
        };
      }
    }

    // 2. Fallback a la condición precalculada para el elemento
    const fallback =
      elemento === ElementoQuimicoValorizacion.Oro
        ? loteSeleccionado.condicion_oro
        : loteSeleccionado.condicion_plata;

    if (fallback) {
      return {
        ...fallback,
        ley_inicio: null as number | null,
        ley_fin: null as number | null,
      };
    }

    return null;
  }, [loteSeleccionado, elemento, numOro, numPlata]);

  // Precargar condiciones comerciales al cambiar lote, elemento o ley
  useEffect(() => {
    if (detalleEditar) return;
    if (!loteSeleccionado || !elemento) {
      setRecuperacion(0);
      setMaquila(0);
      setConsumo(0);
      return;
    }

    if (condicionActual) {
      setRecuperacion(condicionActual.recuperacion);
      setMaquila(condicionActual.maquila);
      setConsumo(condicionActual.consumo);
    } else {
      setRecuperacion(0);
      setMaquila(0);
      setConsumo(0);
    }
  }, [condicionActual, loteSeleccionado, elemento, detalleEditar]);

  const esSinValorComercial = loteSeleccionado?.con_valor_comercial === false;

  const tmsCalculado = useMemo(() => {
    if (!loteSeleccionado) return 0;
    return Number((loteSeleccionado.tmh * (1 - (numHum / 100))).toFixed(4));
  }, [loteSeleccionado, numHum]);

  const ley = useMemo(() => {
    if (!loteSeleccionado || !elemento) return 0;
    return elemento === ElementoQuimicoValorizacion.Oro ? numOro : numPlata;
  }, [loteSeleccionado, elemento, numOro, numPlata]);

  const ptn = useMemo(() => {
    if (esSinValorComercial) return 0;

    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numRea = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;

    const res = ((numInter - numDes) * ley * (numRec / 100) - numMaq - numRea) * numFac;
    return res;
  }, [esSinValorComercial, inter, desInter, ley, recuperacion, maquila, consumo, factor]);

  const numPen = typeof montoPenalidad === "number" ? montoPenalidad : parseFloat(String(montoPenalidad)) || 0;
  const numFle = typeof montoFlete === "number" ? montoFlete : parseFloat(String(montoFlete)) || 0;
  const descuentoTotal = numPen + numFle;

  const subtotalSinDescuento = useMemo(() => {
    if (!loteSeleccionado || esSinValorComercial) return 0;
    return (ptn * tmsCalculado) / 1000;
  }, [esSinValorComercial, ptn, loteSeleccionado, tmsCalculado]);

  const totalItem = useMemo(() => {
    if (esSinValorComercial) return 0;
    return Math.max(0, subtotalSinDescuento - descuentoTotal);
  }, [esSinValorComercial, subtotalSinDescuento, descuentoTotal]);

  const handleAgregar = () => {
    if (!loteSeleccionado) {
      notifyWarning("Debe seleccionar un lote");
      return;
    }
    if (!elemento) {
      notifyWarning("Debe seleccionar un elemento químico");
      return;
    }

    // Validación de máximo 10 lotes únicos por propuesta
    const uniqueLotsCount = new Set(existingDetalles.map((d) => d.id_lote_guia)).size;
    const isEditingThisDetail = Boolean(
      detalleEditar && detalleEditar.display.id_lote_guia === loteSeleccionado.id_lote_guia,
    );
    const isLotAlreadyInDetalles = existingDetalles.some(
      (d) => d.id_lote_guia === loteSeleccionado.id_lote_guia,
    );
    if (!isEditingThisDetail && !isLotAlreadyInDetalles && uniqueLotsCount >= 10) {
      notifyWarning("Solo se puede valorizar un máximo de 10 lotes por propuesta");
      return;
    }

    if (!esSinValorComercial && !precioEncontrado) {
      notifyWarning(
        `No se encontró precio INTER para ${elemento} en la fecha de la valorización. Verifique el registro en el encabezado del sistema.`,
      );
      return;
    }

    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numRea = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;

    const cond = condicionActual;

    const reqItem: REQ_ValorizacionDetalleItem = {
      id_lote_guia: loteSeleccionado.id_lote_guia,
      elemento_quimico: elemento,
      id_grupo_analisis: selectedGrupoAnalisisId ? Number(selectedGrupoAnalisisId) : null,
      id_condicion_comercial: esSinValorComercial ? null : (cond ? cond.id_condicion_comercial : null),
      id_valor_elemento_quimico: esSinValorComercial ? null : (precioEncontrado?.id ?? null),
      inter: esSinValorComercial ? 0 : numInter,
      des_inter: esSinValorComercial ? 0 : numDes,
      recuperacion: esSinValorComercial ? 0 : numRec,
      maquila: esSinValorComercial ? 0 : numMaq,
      consumo: esSinValorComercial ? 0 : numRea,
      factor: esSinValorComercial ? 1 : numFac,
      monto_penalidad: numPen,
      monto_flete: numFle,
      ley_oro_manual: numOro,
      ley_plata_manual: numPlata,
      ley_humedad_manual: numHum,
      ley_recuperacion_manual: numRecLey,
    };

    const displayItem: RES_ValorizacionCompraDetalle = {
      id: detalleEditar ? detalleEditar.display.id : 0,
      id_valorizacion_compra: detalleEditar ? detalleEditar.display.id_valorizacion_compra : 0,
      id_lote_guia: loteSeleccionado.id_lote_guia,
      id_grupo_analisis: selectedGrupoAnalisisId ? Number(selectedGrupoAnalisisId) : null,
      grupo_analisis_nombre: grupoSeleccionadoObj ? grupoSeleccionadoObj.nombre : null,
      id_condicion_comercial: esSinValorComercial ? null : (cond ? cond.id_condicion_comercial : null),
      id_valor_elemento_quimico: esSinValorComercial ? null : (precioEncontrado?.id ?? null),
      elemento_quimico: elemento,
      numero_correlativo: loteSeleccionado.numero_correlativo,
      lote_correlativo: loteSeleccionado.correlativo_lote,
      grr: loteSeleccionado.grr,
      grt: loteSeleccionado.grt,
      fecha_ingreso: loteSeleccionado.fecha_en_planta,
      tmh: loteSeleccionado.tmh,
      ley_humedad: numHum,
      tms: tmsCalculado,
      ley,
      inter: esSinValorComercial ? 0 : numInter,
      des_inter: esSinValorComercial ? 0 : numDes,
      recuperacion: esSinValorComercial ? 0 : numRec,
      maquila: esSinValorComercial ? 0 : numMaq,
      consumo: esSinValorComercial ? 0 : numRea,
      factor: esSinValorComercial ? 1 : numFac,
      precio_por_tonelada: esSinValorComercial ? 0 : Number(ptn.toFixed(2)),
      monto_penalidad: numPen,
      monto_flete: numFle,
      descuento: Number(descuentoTotal.toFixed(2)),
      subtotal_sin_descuento: esSinValorComercial ? 0 : Number(subtotalSinDescuento.toFixed(2)),
      subtotal: esSinValorComercial ? 0 : Number(totalItem.toFixed(2)),
    };

    if (detalleEditar) {
      onEditarLote?.(detalleEditar.index, reqItem, displayItem);
    } else {
      onAgregarLote(reqItem, displayItem);
    }

    // reset campos y cerrar
    setSelectedLoteGuiaId(null);
    setSelectedGrupoAnalisisId(null);
    setInter(0);
    setDesInter(0);
    setFactor(1.1023);
    setMontoPenalidad(0);
    setMontoFlete(0);
    setPrecioEncontrado(null);
    onClose();
  };

  // INTER siempre bloqueado: el valor proviene del precio INTER registrado
  // para la fecha y elemento seleccionados (via boton "+").
  const interBloqueado = true;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={detalleEditar ? "Editar Condiciones del Lote" : "Agregar Lote a Valorización"}
      size="xl"
    >
      <Stack gap="sm" mt="xs">
        <button
          data-autofocus
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only opacity-0 w-0 h-0 p-0 m-0 pointer-events-none absolute -z-50"
        />
        {/* Selección de Lote y Elemento */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Select
              label="Lote Disponible:"
              placeholder={loadingLotes ? "Cargando..." : "[Seleccione Lote]"}
              disabled={loadingLotes || !!detalleEditar}
              rightSection={loadingLotes ? <Loader size={16} /> : undefined}
              data={
                detalleEditar
                  ? [
                    {
                      value: String(detalleEditar.display.id_lote_guia),
                      label:
                        detalleEditar.display.lote_correlativo ||
                        "-",
                    },
                  ]
                  : lotes.map((l) => ({
                    value: String(l.id_lote_guia),
                    label:
                      l.con_valor_comercial === false
                        ? `${l.correlativo_lote} (Sin Valor Comercial)`
                        : l.correlativo_lote,
                  }))
              }
              value={selectedLoteGuiaId}
              onChange={(val) => setSelectedLoteGuiaId(val)}
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Elemento:"
              placeholder="[Seleccione]"
              disabled={!!detalleEditar}
              data={opcionesElementos}
              value={elemento}
              onChange={(val) => setElemento(val as ElementoQuimicoValorizacion)}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>
        </Grid>

        {/* Card de Información del Lote Seleccionado (Sin Inputs Deshabilitados) */}
        {loteSeleccionado ? (
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80 space-y-2">
            <Group justify="space-between" align="center">
              <Group gap={6}>
                <IconFileText size={16} className="text-amber-400" />
                <Text fw={700} fz="xs" c="white">
                  Lote: {loteSeleccionado.correlativo_lote}
                </Text>
                {esSinValorComercial && (
                  <Badge variant="filled" color="red" size="xs">
                    SIN VALOR COMERCIAL
                  </Badge>
                )}
              </Group>
              <Group gap={6}>
                <Badge variant="outline" color="blue" size="xs">
                  G.R.R: {loteSeleccionado.grr || "-"}
                </Badge>
                <Badge variant="outline" color="indigo" size="xs">
                  G.R.T: {loteSeleccionado.grt || "-"}
                </Badge>
                <Badge variant="filled" color="dark" size="xs">
                  {loteSeleccionado.fecha_en_planta ? loteSeleccionado.fecha_en_planta.split(" ")[0] : "-"}
                </Badge>
              </Group>
            </Group>

            <Grid gutter="xs" pt={4}>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMH (t)
                  </Text>
                  <Text fz="xs" fw={700} c="cyan.3">
                    {(loteSeleccionado.tmh / 1000).toFixed(3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    % H2O
                  </Text>
                  <Text fz="xs" fw={700} c="amber.3">
                    {numHum.toFixed(2)}%
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMS (t)
                  </Text>
                  <Text fz="xs" fw={700} c="emerald.3">
                    {(tmsCalculado / 1000).toFixed(3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    Ley ({elemento})
                  </Text>
                  <Text fz="xs" fw={700} c="yellow.3">
                    {ley.toFixed(3)} oz/tc
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>
        ) : (
          <Box p="sm" bg="#18181b" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5">
              Seleccione un lote para visualizar su información y balances.
            </Text>
          </Box>
        )}

        {/* Selector de Grupo de Análisis y Ajuste de Leyes */}
        {loteSeleccionado && (
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80 space-y-2.5">
            <Group justify="space-between" align="center">
              <Text fw={700} fz="xs" c="cyan.4" className="flex items-center gap-1.5">
                <IconFlask size={16} /> Grupo de Análisis y Leyes
              </Text>
              {grupoSeleccionadoObj ? (
                <Badge color="cyan" variant="light" size="xs" radius="sm" fw={600}>
                  {grupoSeleccionadoObj.nombre}
                </Badge>
              ) : (
                <Badge color="zinc" variant="outline" size="xs" radius="sm">
                  Sin grupo asignado
                </Badge>
              )}
            </Group>

            <Grid gutter="xs" align="flex-end">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Seleccionar Grupo de Análisis:"
                  placeholder="[Seleccione Grupo de Análisis]"
                  data={opcionesGrupos}
                  value={selectedGrupoAnalisisId}
                  onChange={handleSelectGrupo}
                  disabled={!!detalleEditar}
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <NumberInput
                  label="Ley Oro:"
                  value={leyOro}
                  onChange={(val) => setLeyOro(val ?? 0)}
                  min={0}
                  step={0.001}
                  decimalScale={3}
                  size="xs"
                  radius="lg"
                  hideControls
                  rightSection={<Text fz={10} c="zinc.5" mr={6}>oz/tc</Text>}
                  rightSectionWidth={46}
                  classNames={fieldClasses}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <NumberInput
                  label="Ley Plata:"
                  value={leyPlata}
                  onChange={(val) => setLeyPlata(val ?? 0)}
                  min={0}
                  step={0.001}
                  decimalScale={3}
                  size="xs"
                  radius="lg"
                  hideControls
                  rightSection={<Text fz={10} c="zinc.5" mr={6}>oz/tc</Text>}
                  rightSectionWidth={46}
                  classNames={fieldClasses}
                />
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        {/* Inputs de Condiciones de Valorización */}
        <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80">
          <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap={8}>
            <Text fw={600} fz="xs" c="amber.4" className="flex items-center gap-1.5">
              <IconCoins size={15} /> Condiciones Comerciales y Valorización
            </Text>
            {condicionActual ? (
              <Badge color="teal" variant="light" size="xs">
                {condicionActual.ley_inicio !== null && condicionActual.ley_fin !== null
                  ? `Condición: [${condicionActual.ley_inicio} - ${condicionActual.ley_fin} oz/tc] (Rec: ${condicionActual.recuperacion}%, Maq: $${condicionActual.maquila})`
                  : `Condición aplicada (Rec: ${condicionActual.recuperacion}%, Maq: $${condicionActual.maquila})`}
              </Badge>
            ) : (
              <Badge color="zinc" variant="outline" size="xs">
                Sin condición registrada para esta ley (valores manuales)
              </Badge>
            )}
          </Group>

          <Grid gutter="xs">
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="INTER ($/oz):"
                value={inter}
                onChange={(val) => setInter(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$/oz</Text>}
                rightSectionWidth={44}
                classNames={fieldClasses}
                disabled={interBloqueado}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="DES. INTER ($/oz):"
                value={desInter}
                onChange={(val) => setDesInter(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$/oz</Text>}
                rightSectionWidth={44}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="RECUPERACIÓN (%):"
                value={recuperacion}
                onChange={(val) => setRecuperacion(val ?? 0)}
                min={0}
                max={100}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>%</Text>}
                rightSectionWidth={34}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="MAQUILA ($/tc):"
                value={maquila}
                onChange={(val) => setMaquila(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$/tc</Text>}
                rightSectionWidth={44}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="REACT ($/tc):"
                value={consumo}
                onChange={(val) => setConsumo(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$/tc</Text>}
                rightSectionWidth={44}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="FACTOR:"
                value={factor}
                onChange={(val) => setFactor(val ?? 1.1023)}
                min={0}
                step={0.0001}
                decimalScale={4}
                size="xs"
                radius="lg"
                hideControls
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="PENALIDAD ($):"
                value={montoPenalidad}
                onChange={(val) => setMontoPenalidad(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$</Text>}
                rightSectionWidth={34}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="FLETE ($):"
                value={montoFlete}
                onChange={(val) => setMontoFlete(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                hideControls
                rightSection={<Text fz={10} c="zinc.5" mr={6}>$</Text>}
                rightSectionWidth={34}
                classNames={fieldClasses}
                disabled={esSinValorComercial}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Resumen Final Resultante */}
        <Paper p="xs" radius="md" bg="#14532d/20" className="border border-emerald-800/60">
          <Group justify="space-between" align="center" wrap="wrap">
            <Stack gap={2}>
              <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                Precio * Tonelada:
              </Text>
              <Text fz="sm" fw={700} c="white">
                $ {ptn.toFixed(2)} / TN
              </Text>
            </Stack>

            <Group gap="lg">
              <Stack gap={2} align="end">
                <Text fz={11} c="zinc.4" fw={600} tt="uppercase">
                  Subtotal Sin Descuento:
                </Text>
                <Text fz="sm" fw={700} c="zinc.2">
                  $ {subtotalSinDescuento.toFixed(2)}
                </Text>
              </Stack>

              {descuentoTotal > 0 && (
                <Stack gap={2} align="end">
                  <Text fz={11} c="rose.4" fw={600} tt="uppercase">
                    Descuentos (Pen + Fle):
                  </Text>
                  <Text fz="sm" fw={700} c="rose.3">
                    -$ {descuentoTotal.toFixed(2)}
                  </Text>
                </Stack>
              )}

              <Stack gap={2} align="end">
                <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                  Subtotal Lote:
                </Text>
                <Text fz="md" fw={800} c="emerald.3">
                  $ {totalItem.toFixed(2)}
                </Text>
              </Stack>
            </Group>
          </Group>
        </Paper>

        {/* Acciones */}
        <Group justify="end" gap="xs" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose} radius="lg" size="xs">
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleAgregar}
            radius="lg"
            size="xs"
            leftSection={<IconCheck size={16} />}
            disabled={!loteSeleccionado || (!esSinValorComercial && !detalleEditar && !precioEncontrado)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {detalleEditar ? "Guardar Cambios" : "Agregar Lote"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
