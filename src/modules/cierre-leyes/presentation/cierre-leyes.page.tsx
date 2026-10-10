import { useState, useMemo, useEffect, useRef } from "react";
import { Button, TextInput, Loader, Center, Text, Select } from "@mantine/core";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCierreLeyes, puedeAsociarMuestra } from "../hooks/useCierreLeyes";
import { useReporteCierreLeyes } from "../hooks/useReporteCierreLeyes.tsx";
import { useReporteMuestrasExternas } from "../hooks/useReporteMuestrasExternas";
import { TablaCierreLeyes } from "./components/tabla-cierre-leyes";
import { TablaMuestrasExternas } from "./components/tabla-muestras-externas";
import { ModalIniciarAnalisis } from "./components/modal-iniciar-analisis";
import { ModalAsociarMultiples } from "./components/modal-asociar-multiples";
import type { FiltrosLotesSugeridos } from "../service/cierre-leyes.service";
import type { LoteCierreResponse } from "../service/cierre-leyes.responses";
import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { useNotify } from "../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";

const ESTADOS_LEYES_OPCIONES = [
  { value: EstadoLeyes.Pendiente, label: "Pendiente" },
  { value: EstadoLeyes.EnProceso, label: "En Proceso" },
  { value: EstadoLeyes.Confirmado, label: "Confirmado" },
  { value: "Todos", label: "Todos" },
];

// Clases reutilizables de inputs (mismo aspecto en todos los filtros)
const fieldInputClass =
  "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-8 text-xs rounded-lg";

const fieldLabelClass = "text-zinc-300 mb-1 font-medium text-xs";

const MIME_MUESTRA = "application/x-fabero-muestra";

const AUTOSCROLL_EDGE_PX = 60;
const AUTOSCROLL_MIN_SPEED = 4;
const AUTOSCROLL_MAX_SPEED = 18;

export const CierreLeyesPage = () => {
  useTitlePage("Cierre de Leyes");

  const ctrl = useCierreLeyes();
  const { notifyError, notifyWarning } = useNotify();

  const [modalIniciarAbierto, setModalIniciarAbierto] = useState(false);

  // Filtros de la TABLA de análisis (no del modal). Default: 7 días atrás → hoy.
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoLeyes | "Todos">("Todos");
  const [fechaInicio, setFechaInicio] = useState<string | null>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string | null>(defaultFechaFin());
  const [busqueda, setBusqueda] = useState("");

  // Estado drag & drop (HTML5 nativo)
  const [muestraArrastradaId, setMuestraArrastradaId] = useState<number | null>(null);
  const isMuestraDragRef = useRef(false);

  // Leyes manuales por lote y detalle: Record<idLote, Record<idGrupoAnalisisDetalle, string>>
  const [leyManualPorLoteYDetalle, setLeyManualPorLoteYDetalle] = useState<
    Record<number, Record<number, string>>
  >({});

  // Selección múltiple de muestras externas (para asociar en bloque)
  const [muestrasSeleccionadasIds, setMuestrasSeleccionadasIds] = useState<number[]>([]);

  // Modal "Asociar N seleccionadas a lote"
  const [modalMultiAsociarOpen, setModalMultiAsociarOpen] = useState(false);
  const [loteDestinoIdMulti, setLoteDestinoIdMulti] = useState<string | null>(null);
  const [asociandoMulti, setAsociandoMulti] = useState(false);

  // Selección múltiple de lotes para el reporte PDF (solo Confirmados)
  const [lotesSeleccionadosIds, setLotesSeleccionadosIds] = useState<number[]>([]);

  // Hook de impresión del reporte de lotes
  const { printReporte } = useReporteCierreLeyes();

  // Hook de impresión del reporte de muestras externas
  const { printReporteMuestras } = useReporteMuestrasExternas();

  // Selección múltiple de muestras externas para imprimir reporte
  const [muestrasParaImprimirIds, setMuestrasParaImprimirIds] = useState<number[]>([]);

  const handleToggleSeleccionMuestraImprimir = (idMuestraExterna: number) => {
    setMuestrasParaImprimirIds((prev) =>
      prev.includes(idMuestraExterna)
        ? prev.filter((x) => x !== idMuestraExterna)
        : [...prev, idMuestraExterna],
    );
  };

  const handleToggleSelectAllMuestraImprimir = () => {
    if (muestrasParaImprimirIds.length === ctrl.muestras.length) {
      setMuestrasParaImprimirIds([]);
    } else {
      setMuestrasParaImprimirIds(ctrl.muestras.map((m) => m.id));
    }
  };

  const handleImprimirMuestras = () => {
    const candidatas = ctrl.muestras.filter((m) =>
      muestrasParaImprimirIds.includes(m.id),
    );
    if (candidatas.length === 0) {
      notifyWarning("No hay muestras seleccionadas para imprimir");
      return;
    }
    printReporteMuestras(candidatas, ctrl.grupos);
  };

  const handleToggleSeleccionMuestra = (idMuestraExterna: number) => {
    setMuestrasSeleccionadasIds((prev) =>
      prev.includes(idMuestraExterna) ? prev.filter((x) => x !== idMuestraExterna) : [...prev, idMuestraExterna],
    );
  };

  const handleToggleSeleccionLote = (idLote: number) => {
    setLotesSeleccionadosIds((prev) =>
      prev.includes(idLote) ? prev.filter((x) => x !== idLote) : [...prev, idLote],
    );
  };

  const handleLimpiarSeleccionLotes = () => setLotesSeleccionadosIds([]);

  const handleImprimirSeleccion = () => {
    const candidatos = lotes.filter(
      (l) => lotesSeleccionadosIds.includes(l.id) && l.estado_leyes === EstadoLeyes.Confirmado,
    );
    if (candidatos.length === 0) {
      notifyWarning("No hay lotes Confirmados seleccionados");
      return;
    }
    printReporte(candidatos);
  };

  const handleAbrirModalMultiAsociar = () => {
    if (muestrasSeleccionadasIds.length === 0) {
      notifyWarning("No hay muestras seleccionadas");
      return;
    }
    setLoteDestinoIdMulti(null);
    setModalMultiAsociarOpen(true);
  };

  const handleCerrarModalMulti = () => {
    setModalMultiAsociarOpen(false);
    setLoteDestinoIdMulti(null);
  };

  const handleConfirmarMultiAsociacion = async () => {
    if (!loteDestinoIdMulti) {
      notifyWarning("Selecciona un lote destino");
      return;
    }
    if (muestrasSeleccionadasIds.length === 0) {
      handleCerrarModalMulti();
      return;
    }
    setAsociandoMulti(true);
    const ok = await ctrl.asociarMultiplesMuestrasALote(
      [...muestrasSeleccionadasIds],
      Number(loteDestinoIdMulti),
    );
    setAsociandoMulti(false);
    if (ok) {
      handleCerrarModalMulti();
      setMuestrasSeleccionadasIds([]);
    }
  };

  const filtrosActuales: FiltrosLotesSugeridos = useMemo(
    () => ({
      estado: estadoFiltro,
      fechaInicio,
      fechaFin,
    }),
    [estadoFiltro, fechaInicio, fechaFin],
  );

  const { cargarLotes, cargarMuestrasExternas, cargarLotesSugeridos, cargarMuestrasAsociadas, lotes, lotesSugeridos } = ctrl;

  // Auto-apply: cualquier cambio en los filtros dispara la consulta a la tabla.
  useEffect(() => {
    void cargarLotes(filtrosActuales);
  }, [cargarLotes, filtrosActuales]);

  // Cargar muestras externas + lotes sugeridos (Pendiente) al montar — los Pendiente sirven
  // para que la tabla inferior permita asociar muestras a lotes aún no iniciados.
  useEffect(() => {
    void cargarMuestrasExternas();
    void cargarLotesSugeridos();
  }, [cargarMuestrasExternas, cargarLotesSugeridos]);

  /**
   * Auto-cargar el cache de `muestrasAsociadasPorLote` para cada lote cargado.
   * Esto permite que el "ojo" aparezca inmediatamente al renderizar la tabla de lotes
   * sin esperar a que el usuario abra el modal.
   * Usamos un ref para evitar disparar el efecto múltiples veces con la misma lista.
   */
  useEffect(() => {
    for (const lote of ctrl.lotes) {
      if (lote?.id && ctrl.muestrasAsociadasPorLote[lote.id] === undefined) {
        void cargarMuestrasAsociadas(lote.id);
      }
    }
  }, [ctrl.lotes, ctrl.muestrasAsociadasPorLote, cargarMuestrasAsociadas]);

  const handleLimpiarFiltros = () => {
    setEstadoFiltro("Todos");
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setBusqueda("");
  };

  const handleAbrirModal = () => {
    setModalIniciarAbierto(true);
  };

  const filteredLotes = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return ctrl.lotes;
    return ctrl.lotes.filter((l) => l.correlativo.toLowerCase().includes(q));
  }, [ctrl.lotes, busqueda]);

  // Lotes disponibles para asociar (filtrar Pendiente / EnProceso) — alimenta el modal "Asociar a lote" de la tabla inferior.
  // Mezcla los EnProceso/Confirmado de la tabla principal con los Pendiente (lotesSugeridos) para soportar
  // también lotes que aún no han sido iniciados.
  const lotesDisponiblesParaAsociar = useMemo(() => {
    const map = new Map<number, LoteCierreResponse>();
    for (const l of lotes) {
      if (l.estado_leyes === EstadoLeyes.Pendiente || l.estado_leyes === EstadoLeyes.EnProceso) {
        map.set(l.id, l);
      }
    }
    // lotesSugeridos solo trae Pendientes — agregar los que falten
    for (const l of lotesSugeridos) {
      if (l.estado_leyes === EstadoLeyes.Pendiente) {
        if (!map.has(l.id)) {
          // Mapear LoteSugeridoResponse al shape de Lote (sin análisis porque aún no se inicia)
          map.set(l.id, {
            ...l,
            estado_leyes: EstadoLeyes.Pendiente,
            con_valor_comercial: null,
            fecha_hora_inicio_analisis: null,
            empleado_inicio_nombre: null,
            fecha_hora_confirmacion_analisis: null,
            empleado_confirmacion_nombre: null,
            ley_oro: null,
            ley_plata: null,
            ley_humedad: null,
            ley_recuperacion: null,
            analisis: [],
          });
        }
      }
    }
    return Array.from(map.values());
  }, [lotes, lotesSugeridos]);

  const handleLeyManualChange = (idLoteMineral: number, idGrupoAnalisisDetalle: number, val: string) => {
    setLeyManualPorLoteYDetalle((prev) => ({
      ...prev,
      [idLoteMineral]: {
        ...(prev[idLoteMineral] ?? {}),
        [idGrupoAnalisisDetalle]: val,
      },
    }));
  };

  const handleDragStart = (idMuestraExterna: number, e: React.DragEvent<HTMLTableRowElement>) => {
    setMuestraArrastradaId(idMuestraExterna);
    isMuestraDragRef.current = true;
    e.dataTransfer.setData(MIME_MUESTRA, String(idMuestraExterna));
    e.dataTransfer.effectAllowed = "link";
  };

  const handleDragEnd = () => {
    setMuestraArrastradaId(null);
    isMuestraDragRef.current = false;
  };

  useEffect(() => {
    let rafId: number | null = null;
    let lastClientY: number | null = null;

    const tick = () => {
      rafId = null;
      if (lastClientY === null) return;
      const y = lastClientY;
      const h = window.innerHeight;

      let delta = 0;
      if (y < AUTOSCROLL_EDGE_PX) {
        const ratio = 1 - y / AUTOSCROLL_EDGE_PX;
        delta = -Math.round(AUTOSCROLL_MIN_SPEED + (AUTOSCROLL_MAX_SPEED - AUTOSCROLL_MIN_SPEED) * ratio);
      } else if (y > h - AUTOSCROLL_EDGE_PX) {
        const ratio = 1 - (h - y) / AUTOSCROLL_EDGE_PX;
        delta = Math.round(AUTOSCROLL_MIN_SPEED + (AUTOSCROLL_MAX_SPEED - AUTOSCROLL_MIN_SPEED) * ratio);
      }

      if (delta !== 0) {
        window.scrollBy({ top: delta, behavior: "auto" });
        rafId = requestAnimationFrame(tick);
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (!isMuestraDragRef.current) return;
      e.preventDefault();
      lastClientY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    const onDragEndWindow = () => {
      isMuestraDragRef.current = false;
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragend", onDragEndWindow);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragend", onDragEndWindow);
    };
  }, []);

  const handleDropMuestra = async (idLoteMineral: number, idMuestraExterna: number): Promise<void> => {
    setMuestraArrastradaId(null);

    const loteEnTabla = ctrl.lotes.find((l) => l.id === idLoteMineral);
    const loteSugerido = ctrl.lotesSugeridos.find((l) => l.id === idLoteMineral);
    if (!loteEnTabla && !loteSugerido) {
      notifyError("Lote destino no encontrado");
      return;
    }
    const loteDestino = loteEnTabla ?? loteSugerido;
    if (!loteDestino) {
      notifyError("Lote destino no encontrado");
      return;
    }
    const loteCorrelativo = loteDestino.correlativo ?? `#${idLoteMineral}`;

    // Determinar si el drop es multi (la muestra arrastrada está en la selección)
    const esDropMulti = muestrasSeleccionadasIds.includes(idMuestraExterna);
    const idsParaAsociar = esDropMulti ? [...muestrasSeleccionadasIds] : [idMuestraExterna];
    const muestrasParaAsociar = idsParaAsociar
      .map((id) => ctrl.muestras.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m != null);

    if (muestrasParaAsociar.length === 0) {
      notifyError("Muestra externa no encontrada");
      return;
    }

    // Validar mismo proveedor entre lote y TODAS las muestras a asociar
    const lotesProveedor = loteDestino.id_proveedor_minero;
    const distintasDeProveedor = muestrasParaAsociar.filter(
      (m) => m.id_proveedor_minero !== lotesProveedor,
    );
    if (distintasDeProveedor.length > 0) {
      notifyError(
        `${distintasDeProveedor.length === 1 ? "Una muestra pertenece" : `${distintasDeProveedor.length} muestras pertenecen`} a un proveedor distinto al lote ${loteCorrelativo}. Solo se pueden asociar muestras y lotes del mismo proveedor.`,
      );
      return;
    }

    // Si el drop es single (no estaba en la selección), aplicar validación clásica
    if (!esDropMulti) {
      const muestra = muestrasParaAsociar[0];
      if (loteDestino && muestra.id_proveedor_minero !== loteDestino.id_proveedor_minero) {
        notifyError(
          `La muestra pertenece a "${muestra.proveedor_razon_social ?? "—"}" pero el lote ${loteCorrelativo} es de "${loteDestino.proveedor_razon_social ?? "—"}". Solo se pueden asociar muestras y lotes del mismo proveedor.`,
        );
        return;
      }
    }

    const totalAnalisis = muestrasParaAsociar.reduce((acc, m) => acc + (m.analisis?.length ?? 0), 0);
    const resumenMuestras = muestrasParaAsociar.map((m) => m.correlativo).join(", ");

    if (esDropMulti) {
      mostrarConfirmacion({
        title: `Asociar ${muestrasParaAsociar.length} muestra${muestrasParaAsociar.length === 1 ? "" : "s"} externa${muestrasParaAsociar.length === 1 ? "" : "s"} a lote`,
        tipo: "info",
        confirmLabel: `Asociar ${muestrasParaAsociar.length}`,
        cancelLabel: "Cancelar",
        message: (
          <div className="space-y-1.5">
            <p>
              Vas a asociar <span className="font-semibold text-indigo-300">{muestrasParaAsociar.length} muestra{muestrasParaAsociar.length === 1 ? "" : "s"}</span>
              {' '}(<span className="font-mono text-zinc-300">{resumenMuestras}</span>)
              {' '}a <span className="font-mono text-indigo-300 font-semibold">{loteCorrelativo}</span>.
            </p>
            <p className="text-zinc-400">
              Se migrarán <span className="font-semibold">{totalAnalisis}</span> análisis al lote y las muestras desaparecerán de la tabla inferior.
            </p>
          </div>
        ),
        onConfirm: async () => {
          await ctrl.asociarMultiplesMuestrasALote(idsParaAsociar, idLoteMineral);
          setMuestrasSeleccionadasIds([]);
        },
      });
      return;
    }

    const muestra = muestrasParaAsociar[0];
    mostrarConfirmacion({
      title: "Asociar muestra externa a lote",
      tipo: "info",
      confirmLabel: "Asociar",
      cancelLabel: "Cancelar",
      message: (
        <div className="space-y-1.5">
          <p>
            Vas a asociar <span className="font-mono text-indigo-300 font-semibold">{muestra.correlativo}</span>
            {' '}a <span className="font-mono text-indigo-300 font-semibold">{loteCorrelativo}</span>.
          </p>
          <p className="text-zinc-400">
            Los <span className="font-semibold">{totalAnalisis}</span> análisis de la muestra se migrarán al lote y
            la muestra desaparecerá de la tabla inferior.
          </p>
        </div>
      ),
      onConfirm: async () => {
        await ctrl.asociarMuestraALote(idMuestraExterna, idLoteMineral);
      },
    });
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Filtros (sin Card wrapper — sueltos en la página) */}
      <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
        <div className="md:basis-4/12 min-w-90">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />
        </div>

        {/* Estado leyes */}
        <div className="md:basis-2/12 min-w-45">
          <Select
            label="Estado Leyes"
            size="xs"
            radius="lg"
            data={ESTADOS_LEYES_OPCIONES}
            value={estadoFiltro}
            onChange={(val) => {
              if (
                val === EstadoLeyes.Pendiente ||
                val === EstadoLeyes.EnProceso ||
                val === EstadoLeyes.Confirmado ||
                val === "Todos"
              ) {
                setEstadoFiltro(val);
              }
            }}
            searchable
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
            placeholder="Seleccione"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
              option: "hover:bg-zinc-800 focus:bg-zinc-800",
            }}
          />
        </div>

        {/* Buscador por correlativo */}
        <div className="md:basis-2/12 min-w-50">
          <TextInput
            label="Buscar"
            placeholder="Buscar por código de lote (ej: FB-001)..."
            leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            radius="lg"
            size="xs"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Botones: Limpiar + Recargar + Agregar registro */}
        <div className="md:flex-1 min-w-70 flex items-end justify-end gap-2 flex-wrap">
          <Button
            variant="subtle"
            size="xs"
            radius="lg"
            leftSection={<XMarkIcon className="w-4 h-4" />}
            onClick={handleLimpiarFiltros}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            Limpiar
          </Button>
          <RefreshButton
            onClick={() => {
              void cargarLotes(filtrosActuales);
              void cargarMuestrasExternas();
            }}
            loading={ctrl.loading || ctrl.loadingMuestras}
            label="Recargar cierres"
          />
          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={handleAbrirModal}
            radius="lg"
            size="xs"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-9.5 px-5 rounded-xl font-semibold"
          >
            Agregar registro
          </Button>
        </div>
      </div>

      {/* Main Grid/Table */}
      {ctrl.loading && ctrl.lotes.length === 0 ? (
        <Center className="py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader color="indigo" size="md" />
            <Text size="sm" className="text-zinc-500">Cargando datos del módulo...</Text>
          </div>
        </Center>
      ) : filteredLotes.length === 0 && ctrl.muestras.length === 0 ? (
        <Center className="py-16">
          <div className="flex flex-col items-center gap-2 text-center">
            <Text size="sm" fw={600} className="text-zinc-400">
              No hay lotes en proceso ni muestras externas con los filtros actuales.
            </Text>
            <Text size="xs" className="text-zinc-600">
              Usa el botón "Agregar registro" para iniciar el análisis de un lote pendiente o crear una muestra externa.
            </Text>
          </div>
        </Center>
      ) : (
        <>
          {filteredLotes.length > 0 && (
            <TablaCierreLeyes
              lotes={filteredLotes}
              grupos={ctrl.grupos}
              onGuardarValor={ctrl.guardarValor}
              onAgregarAnalisis={ctrl.agregarAnalisis}
              onEliminarFila={ctrl.eliminarFila}
              onConfirmarLote={async (idLote, conValor, leyesManuales) => {
                const loteActualizado = await ctrl.confirmarLote(idLote, conValor, leyesManuales);
                if (loteActualizado) {
                  printReporte([loteActualizado]);
                  return true;
                }
                return false;
              }}
              onActualizarOrigenFila={ctrl.actualizarOrigenFila}
              onCheckAll={ctrl.confirmarTodoElLote}
              isChequeandoLote={ctrl.isChequeandoLote}
              confirmandoLote={ctrl.confirmandoLote}
              agregandoAnalisisPorLote={ctrl.agregandoAnalisisPorLote}
              isGuardandoCelda={ctrl.isGuardandoCelda}
              cellKeyFn={ctrl.cellKey}
              validacionCierrePorLote={ctrl.validacionCierrePorLote}
              muestrasAsociadasPorLote={ctrl.muestrasAsociadasPorLote}
              muestraArrastradaId={muestraArrastradaId}
              onCargarMuestrasAsociadas={ctrl.cargarMuestrasAsociadas}
              onDropMuestra={handleDropMuestra}
              leyManualPorLoteYDetalle={leyManualPorLoteYDetalle}
              onChangeLeyManual={handleLeyManualChange}
              seleccionadasIds={lotesSeleccionadosIds}
              onToggleSeleccion={handleToggleSeleccionLote}
              onLimpiarSeleccion={handleLimpiarSeleccionLotes}
              onImprimirSeleccion={handleImprimirSeleccion}
            />
          )}

          <div className="flex flex-col xl:flex-row gap-4 items-start">
            <div className="flex-1 min-w-0 w-full">
              <TablaMuestrasExternas
                muestras={ctrl.muestras}
                grupos={ctrl.grupos}
                lotesDisponibles={lotesDisponiblesParaAsociar}
                onGuardarValor={ctrl.guardarValorMuestra}
                onAgregarAnalisis={ctrl.agregarAnalisisMuestra}
                onEliminarFila={ctrl.eliminarFilaMuestra}
                onActualizarOrigenFila={ctrl.actualizarOrigenFilaMuestra}
                onAsociar={ctrl.asociarMuestraALote}
                isAsociando={ctrl.isAsociandoMuestra}
                isAgregandoAnalisis={ctrl.isAgregandoAnalisisMuestra}
                isGuardandoCelda={ctrl.isGuardandoCelda}
                puedeAsociar={puedeAsociarMuestra}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                seleccionadasIds={muestrasSeleccionadasIds}
                onToggleSeleccion={handleToggleSeleccionMuestra}
                onAsociarMultiplesClick={handleAbrirModalMultiAsociar}
                seleccionadasImprimirIds={muestrasParaImprimirIds}
                onToggleSeleccionImprimir={handleToggleSeleccionMuestraImprimir}
                onToggleSelectAllImprimir={handleToggleSelectAllMuestraImprimir}
                onImprimirReporte={handleImprimirMuestras}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal para iniciar análisis — sólo muestra lotes pendientes, sin filtros propios */}
      <ModalIniciarAnalisis
        opened={modalIniciarAbierto}
        onClose={() => setModalIniciarAbierto(false)}
        onIniciarExito={() => {
          void ctrl.cargarLotes(filtrosActuales);
          void ctrl.cargarMuestrasExternas();
        }}
        ctrl={ctrl}
      />

      <ModalAsociarMultiples
        opened={modalMultiAsociarOpen}
        onClose={handleCerrarModalMulti}
        muestras={ctrl.muestras}
        seleccionadasIds={muestrasSeleccionadasIds}
        lotesDisponibles={lotesDisponiblesParaAsociar}
        loteDestinoId={loteDestinoIdMulti}
        onChangeLoteDestino={setLoteDestinoIdMulti}
        onConfirm={handleConfirmarMultiAsociacion}
        loading={asociandoMulti}
        onQuitar={handleToggleSeleccionMuestra}
      />
    </div>
  );
};

export default CierreLeyesPage;
