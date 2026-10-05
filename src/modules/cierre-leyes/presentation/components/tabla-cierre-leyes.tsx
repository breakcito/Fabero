import React, { useState } from "react";
import { IconChecks, IconPlus, IconTrashX, IconHistory, IconClipboardList } from "@tabler/icons-react";
import { Loader, Badge, Select, Tooltip, Group } from "@mantine/core";
import { EstadoLeyes } from "../../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { LoteCierreResponse, AnalisisMineralResponse, MuestraAsociadaResponse } from "../../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse, GrupoAnalisisDetalleResponse } from "../../../../modules/gestion-leyes/service/gestion-leyes.responses";
import type { GuardarValorPayload } from "../../service/cierre-leyes.service";
import type { CierreValidacion } from "../../hooks/useCierreLeyes";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import { CellInput } from "./cell-input";

interface TablaCierreLeyesProps {
  lotes: LoteCierreResponse[];
  grupos: GrupoAnalisisResponse[];
  onGuardarValor: (payload: GuardarValorPayload) => Promise<boolean>;
  onAgregarAnalisis: (idLoteMineral: number) => Promise<boolean>;
  onEliminarFila: (idLoteMineral: number, uuidFila: string) => Promise<boolean>;
  onConfirmarLote: (
    idLoteMineral: number,
    conValorComercial: boolean,
    leyesManuales?: Array<{ id_grupo_analisis_detalle: number; ley: number }>,
  ) => Promise<boolean>;
  onActualizarOrigenFila: (idLoteMineral: number, uuidFila: string, tipoOrigen: TipoOrigen | null) => Promise<boolean>;
  onCheckAll?: (idLoteMineral: number) => Promise<void>;
  isChequeandoLote?: (idLoteMineral: number) => boolean;
  confirmandoLote: Record<number, boolean>;
  agregandoAnalisisPorLote?: Record<number, boolean>;
  isGuardandoCelda?: (key: string) => boolean;
  cellKeyFn?: (p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) => string;
  validacionCierrePorLote?: Record<number, CierreValidacion>;
  /** Muestras externas ya asociadas a cada lote (para mostrar botón + modal de muestras). */
  muestrasAsociadasPorLote?: Record<number, MuestraAsociadaResponse[]>;
  /** Muestra actualmente siendo arrastrada desde la tabla inferior (HTML5 drag & drop). */
  muestraArrastradaId?: number | null;
  /** Cargar muestras asociadas cuando se abre el modal. */
  onCargarMuestrasAsociadas?: (idLoteMineral: number) => Promise<MuestraAsociadaResponse[]>;
  /** Indica a la tabla que la fila del lote es una zona de drop válida. */
  onDropMuestra?: (idLoteMineral: number, idMuestraExterna: number) => Promise<void>;
  /** Leyes manuales por lote y detalle: Record<idLote, Record<idGrupoAnalisisDetalle, string>> */
  leyManualPorLoteYDetalle?: Record<number, Record<number, string>>;
  onChangeLeyManual?: (idLoteMineral: number, idGrupoAnalisisDetalle: number, val: string) => void;
}

export const TablaCierreLeyes = ({
  lotes,
  grupos,
  onGuardarValor,
  onAgregarAnalisis,
  onEliminarFila,
  onConfirmarLote,
  onActualizarOrigenFila,
  onCheckAll,
  isChequeandoLote,
  confirmandoLote,
  agregandoAnalisisPorLote,
  isGuardandoCelda,
  cellKeyFn,
  validacionCierrePorLote,
  muestrasAsociadasPorLote,
  muestraArrastradaId,
  onCargarMuestrasAsociadas,
  onDropMuestra,
  leyManualPorLoteYDetalle,
  onChangeLeyManual,
}: TablaCierreLeyesProps) => {
  const { notifyWarning } = useNotify();

  // Local state for history modal
  const [modalLogOpened, setModalLogOpened] = useState(false);
  const [selectedLogInfo, setSelectedLogInfo] = useState<{
    analitoNombre: string;
    cambios: RES_CambiosLog[] | null | undefined;
  } | null>(null);

  // Modal "Ver muestras asociadas"
  const [modalMuestrasAbierto, setModalMuestrasAbierto] = useState(false);
  const [muestrasModalLoteId, setMuestrasModalLoteId] = useState<number | null>(null);
  const [cargandoMuestrasModal, setCargandoMuestrasModal] = useState(false);

  const handleAbrirModalMuestras = async (idLote: number) => {
    setMuestrasModalLoteId(idLote);
    setModalMuestrasAbierto(true);
    if (onCargarMuestrasAsociadas) {
      setCargandoMuestrasModal(true);
      try {
        await onCargarMuestrasAsociadas(idLote);
      } finally {
        setCargandoMuestrasModal(false);
      }
    }
  };

  const handleOpenLogModal = (analitoNombre: string, cambios?: RES_CambiosLog[] | null) => {
    setSelectedLogInfo({ analitoNombre, cambios });
    setModalLogOpened(true);
  };

  // Local state to track selected TipoOrigen for each run (key: uuidFila, value: TipoOrigen | null)
  const [runOrigines, setRunOrigines] = useState<Record<string, TipoOrigen | null>>({});

  const handleUpdateOrigen = async (
    loteId: number,
    uuidFila: string,
    newOrigen: TipoOrigen | null,
  ) => {
    setRunOrigines((prev) => ({ ...prev, [uuidFila]: newOrigen }));
    await onActualizarOrigenFila(loteId, uuidFila, newOrigen);
  };

  const handleRemoveFilaLocal = (loteId: number, uuidFila: string) => {
    mostrarConfirmacion({
      title: "Eliminar corrida de análisis",
      tipo: "peligro",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      message: (
        <div className="space-y-1">
          <p>¿Estás seguro de que deseas eliminar este análisis?</p>
          <p className="text-zinc-500 text-xs">
            Se borrarán todos los valores ingresados en esta corrida (no se puden revertir).
          </p>
        </div>
      ),
      onConfirm: async () => {
        await onEliminarFila(loteId, uuidFila);
      },
    });
  };

  // Helper function to calculate averages on the fly
  const getPromedioAnalito = (lote: LoteCierreResponse, detalleId: number): number => {
    const records = lote.analisis.filter(
      (a: AnalisisMineralResponse) =>
        a.id_grupo_analisis_detalle === detalleId &&
        a.esta_confirmada
    );
    if (records.length === 0) return 0;
    const sum = records.reduce((acc: number, curr: AnalisisMineralResponse) => acc + curr.ley, 0);
    return sum / records.length;
  };

  const buildCellKey = (
    p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null },
  ): string =>
    cellKeyFn
      ? cellKeyFn(p)
      : `${p.id_lote_mineral}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

  /**
   * Obtiene el valor para la ley consolidada del analito en el lote:
   *  - Si el usuario escribió un valor manual en ese input, se usa ese valor.
   *  - Por defecto, toma el valor del promedio calculado (formateado a 3 decimales si es > 0).
   */
  const getValorLeyConsolidada = (loteId: number, detalleId: number, promedio: number): string => {
    const manual = leyManualPorLoteYDetalle?.[loteId]?.[detalleId];
    if (manual !== undefined) return manual;
    return promedio > 0 ? promedio.toFixed(3) : "";
  };

  /**
   * Valida que todos los analitos desplegables del lote con análisis confirmados
   * tengan un valor válido (> 0) en su input de ley consolidada.
   * Si no coloca un valor o lo deja vacío, no podrá cerrar.
   */
  const validarInputsLeyesConsolidadas = (
    lote: LoteCierreResponse,
    gruposActivos: GrupoAnalisisResponse[],
  ): { ok: boolean; motivo?: string } => {
    for (const g of gruposActivos) {
      for (const a of g.analitos) {
        if (!a.es_desplegable) continue;
        const records = lote.analisis.filter(
          (it) => it.id_grupo_analisis_detalle === a.detalle_id && it.esta_confirmada,
        );
        if (records.length === 0) continue;
        const promedio = getPromedioAnalito(lote, a.detalle_id);
        const valStr = getValorLeyConsolidada(lote.id, a.detalle_id, promedio);
        const parsed = parseFloat(valStr.trim());
        if (valStr.trim() === "" || Number.isNaN(parsed) || parsed <= 0) {
          return {
            ok: false,
            motivo: `Debe ingresar un valor mayor a cero en la ley de "${a.nombre}".`,
          };
        }
      }
    }
    return { ok: true };
  };

  /**
   * Recolecta las leyes consolidadas (manual o promedio por defecto) para enviarlas al backend.
   */
  const buildLeyesManuales = (
    lote: LoteCierreResponse,
    gruposActivos: GrupoAnalisisResponse[],
  ): Array<{ id_grupo_analisis_detalle: number; ley: number }> => {
    const out: Array<{ id_grupo_analisis_detalle: number; ley: number }> = [];
    for (const g of gruposActivos) {
      for (const a of g.analitos) {
        if (!a.es_desplegable) continue;
        const records = lote.analisis.filter(
          (it) => it.id_grupo_analisis_detalle === a.detalle_id && it.esta_confirmada,
        );
        if (records.length === 0) continue;
        const promedio = getPromedioAnalito(lote, a.detalle_id);
        const valStr = getValorLeyConsolidada(lote.id, a.detalle_id, promedio);
        const parsed = parseFloat(valStr);
        if (!Number.isNaN(parsed) && parsed > 0) {
          out.push({ id_grupo_analisis_detalle: a.detalle_id, ley: parsed });
        }
      }
    }
    return out;
  };

  const intentarCerrarLote = (lote: LoteCierreResponse, conValor: boolean) => {
    const validacion = validacionCierrePorLote?.[lote.id] ?? { ok: false, motivo: "Validación pendiente" };
    if (!validacion.ok) {
      notifyWarning(validacion.motivo ?? "No se puede cerrar el lote");
      return;
    }
    const valInputs = validarInputsLeyesConsolidadas(lote, grupos);
    if (!valInputs.ok) {
      notifyWarning(valInputs.motivo ?? "Complete todos los campos de leyes consolidadas con un valor mayor a cero.");
      return;
    }
    const leyesManuales = buildLeyesManuales(lote, grupos);
    void onConfirmarLote(lote.id, conValor, leyesManuales.length > 0 ? leyesManuales : undefined);
  };

  const handleDragOverRow = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (!muestraArrastradaId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "link";
  };

  const handleDropRow = async (idLoteMineral: number, e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    const idMuestra = muestraArrastradaId;
    if (!idMuestra || !onDropMuestra) return;
    await onDropMuestra(idLoteMineral, idMuestra);
  };

  const muestrasModalActual = muestrasModalLoteId !== null ? muestrasAsociadasPorLote?.[muestrasModalLoteId] ?? [] : [];

  return (
    <>
      <div className="w-full overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            {/* First Header Row */}
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              <th colSpan={2} rowSpan={2} className="p-2.5 border-r border-zinc-800 text-center align-middle min-w-45">
                Lote
              </th>
              {grupos.map((g: GrupoAnalisisResponse) => {
                // Calculate colSpan dynamically
                let colSpan = 0;
                if (g.indicar_origen) {
                  // Tipo Origen + (Value + Promedio if es_desplegable, or Value if not)
                  colSpan = 1 + g.analitos.reduce((acc: number, a: GrupoAnalisisDetalleResponse) => acc + (a.es_desplegable ? 2 : 1), 0);
                } else {
                  colSpan = g.analitos.reduce((acc: number, a: GrupoAnalisisDetalleResponse) => acc + (a.es_desplegable ? 2 : 1), 0);
                }

                return (
                  <th
                    key={g.id}
                    colSpan={colSpan}
                    className="p-2 border-r border-zinc-800 text-center align-middle bg-zinc-900/50"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-200 font-semibold">{g.nombre}</span>
                    </div>
                  </th>
                );
              })}
              <th colSpan={2} rowSpan={2} className="p-2.5 text-center align-middle min-w-44">
                Cierre
              </th>
            </tr>

            {/* Second Header Row */}
            <tr className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
              {grupos.map((g: GrupoAnalisisResponse) => {
                const elements: React.ReactNode[] = [];
                if (g.indicar_origen) {
                  elements.push(
                    <th key={`${g.id}-origen`} className="p-1.5 border-r border-zinc-800 text-center align-middle font-medium text-zinc-500">
                      Tipo Origen
                    </th>
                  );
                  g.analitos.forEach((a: GrupoAnalisisDetalleResponse) => {
                    elements.push(
                      <th key={`${g.id}-${a.id_analito}`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/10">
                        <div className="flex flex-col items-center">
                          <span className="text-zinc-300 font-semibold">{a.nombre}</span>
                        </div>
                      </th>
                    );
                    if (a.es_desplegable) {
                      elements.push(
                        <th key={`${g.id}-${a.id_analito}-prom`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/20 font-semibold text-indigo-400">
                          Promedio
                        </th>
                      );
                    }
                  });
                } else {
                  g.analitos.forEach((a: GrupoAnalisisDetalleResponse) => {
                    elements.push(
                      <th key={`${g.id}-${a.id_analito}`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/10">
                        <div className="flex flex-col items-center">
                          <span className="text-zinc-300 font-semibold">{a.nombre}</span>
                        </div>
                      </th>
                    );
                    if (a.es_desplegable) {
                      elements.push(
                        <th key={`${g.id}-${a.id_analito}-prom`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/20 font-semibold text-indigo-400">
                          Promedio
                        </th>
                      );
                    }
                  });
                }
                return elements;
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {lotes.filter((l): l is LoteCierreResponse => l != null).map((l: LoteCierreResponse) => {
              // Get unique uuid_filas saved in database for this lote
              const dbUuids = Array.from(
                new Set(l.analisis.map((a: AnalisisMineralResponse) => a.uuid_fila).filter(Boolean))
              );
              const runs = dbUuids.length > 0 ? dbUuids : [`default-run-${l.id}`];
              const totalRowsForLote = runs.length;
              const muestrasDeEsteLote = muestrasAsociadasPorLote?.[l.id] ?? [];
              const puedeRecibirDrop =
                muestraArrastradaId !== null && muestraArrastradaId !== undefined &&
                (l.estado_leyes === EstadoLeyes.Pendiente || l.estado_leyes === EstadoLeyes.EnProceso);

              return runs.map((uuidFila: string, runIdx: number) => {
                const dbRecord = l.analisis.find((item: AnalisisMineralResponse) => item.uuid_fila === uuidFila && item.tipo_origen !== null);
                const currentTipoOrigen = (dbRecord?.tipo_origen ?? runOrigines[uuidFila] ?? null) as TipoOrigen | null;

                return (
                  <tr
                    key={`${l.id}-${uuidFila}`}
                    onDragOver={handleDragOverRow}
                    onDrop={(e) => void handleDropRow(l.id, e)}
                    className={`hover:bg-zinc-800/10 transition-colors border-b border-zinc-800 ${puedeRecibirDrop ? "bg-indigo-500/5 ring-1 ring-indigo-500/40" : ""}`}
                  >
                    {/* Lote Code & Date - render only on first row of run */}
                    {runIdx === 0 && (
                      <>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 font-semibold text-xs text-zinc-100 align-middle text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 rounded-full">
                                {l.correlativo}
                              </span>
                              <Tooltip label="Confirmar todos los análisis del lote" withArrow position="top">
                                <button
                                  type="button"
                                  disabled={
                                    l.estado_leyes === EstadoLeyes.Confirmado ||
                                    isChequeandoLote?.(l.id) === true
                                  }
                                  onClick={() => onCheckAll?.(l.id)}
                                  className="p-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                  aria-label="Confirmar todos los análisis del lote"
                                >
                                  {isChequeandoLote?.(l.id) ? (
                                    <Loader size={11} color="currentColor" />
                                  ) : (
                                    <IconChecks size={12} stroke={2.5} />
                                  )}
                                </button>
                              </Tooltip>
                            </div>
                            {(() => {
                              const agregando = !!agregandoAnalisisPorLote?.[l.id];
                              const disabled = l.estado_leyes === EstadoLeyes.Confirmado || agregando;
                              return (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => onAgregarAnalisis(l.id)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {agregando ? <Loader size={10} color="currentColor" /> : <IconPlus size={10} />}
                                  {agregando ? "Agregando..." : "Agregar Análisis"}
                                </button>
                              );
                            })()}
                            {/* Botón ver muestras asociadas al lote */}
                              <button
                                type="button"
                                onClick={() => void handleAbrirModalMuestras(l.id)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-lg border transition-all ${muestrasDeEsteLote.length > 0 ? "text-indigo-300 bg-indigo-500/15 border-indigo-500/30 hover:bg-indigo-500/25" : "text-zinc-400 bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-200"}`}
                                title={muestrasDeEsteLote.length > 0 ? `${muestrasDeEsteLote.length} muestra(s) externa(s) asociada(s) — clic para ver` : "Ver muestras externas asociadas"}
                              >
                                <IconClipboardList size={10} />
                                {muestrasDeEsteLote.length > 0 ? `${muestrasDeEsteLote.length} muestra${muestrasDeEsteLote.length === 1 ? "" : "s"}` : "Ver muestras"}
                              </button>

                          </div>
                        </td>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 text-[11px] text-zinc-400 align-middle text-center"
                        >
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="font-semibold text-zinc-500">Inicio:</span>{" "}
                              {l.fecha_hora_inicio_analisis
                                ? new Date(l.fecha_hora_inicio_analisis).toLocaleString("es-ES", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "-"}
                            </div>
                            <div className="font-semibold text-zinc-300">
                              {l.empleado_inicio_nombre || "Desconocido"}
                            </div>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Render groups */}
                    {grupos.map((g: GrupoAnalisisResponse) => {
                      if (g.indicar_origen) {
                        return (
                          <React.Fragment key={`${l.id}-${uuidFila}-${g.id}`}>
                            {/* Tipo Origen column */}
                            <td className="p-2 border-r border-zinc-800 text-[10px] font-semibold text-zinc-400 text-center bg-zinc-900/10 align-middle">
                              <div className="flex items-center justify-center gap-1.5">
                                <Select
                                  size="xs"
                                  data={[
                                    { value: "null", label: "—" },
                                    { value: TipoOrigen.Proveedor, label: "P" },
                                    { value: TipoOrigen.Interno, label: "I" },
                                  ]}
                                  value={currentTipoOrigen ?? "null"}
                                  onChange={(val) => {
                                    if (val === undefined) return;
                                    const next = val === "null" ? null : (val as TipoOrigen);
                                    handleUpdateOrigen(l.id, uuidFila, next);
                                  }}
                                  allowDeselect={false}
                                  disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                  style={{ width: 48 }}
                                  classNames={{
                                    input: "bg-zinc-950 border-zinc-800 text-white text-[11px] h-7 px-1 focus:border-zinc-500 text-center",
                                    option: "text-[11px]",
                                  }}
                                  comboboxProps={{ withinPortal: true }}
                                />
                                {runs.length > 1 && l.estado_leyes !== EstadoLeyes.Confirmado && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFilaLocal(l.id, uuidFila)}
                                    className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-all"
                                    title="Eliminar este análisis"
                                  >
                                    <IconTrashX size={14} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Analitos in group */}
                            {g.analitos.map((a: GrupoAnalisisDetalleResponse) => {
                              const allRecordsOfDetalle = l.analisis.filter(
                                (item: AnalisisMineralResponse) => item.id_grupo_analisis_detalle === a.detalle_id
                              );

                              if (a.es_desplegable) {
                                const runRecords = allRecordsOfDetalle.filter(
                                  (item: AnalisisMineralResponse) =>
                                    item.uuid_fila === uuidFila &&
                                    item.tipo_origen === currentTipoOrigen
                                );
                                const mainRecord = runRecords[0];
                                const cellSaving = !!isGuardandoCelda?.(
                                  buildCellKey({
                                    id_lote_mineral: l.id,
                                    id_grupo_analisis_detalle: a.detalle_id,
                                    uuid_fila: uuidFila,
                                    tipo_origen: currentTipoOrigen,
                                    id: mainRecord?.id ?? null,
                                  }),
                                );

                                const promedio = getPromedioAnalito(l, a.detalle_id);

                                return (
                                  <React.Fragment key={`${l.id}-${uuidFila}-orig-frag-${a.detalle_id}`}>
                                    <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                                      <div className="flex flex-col gap-1 items-center">
                                        <CellInput
                                          key={mainRecord?.id || "new"}
                                          initialValue={mainRecord?.ley || 0}
                                          initialChecked={mainRecord ? mainRecord.esta_confirmada : false}
                                          disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                          saving={cellSaving}
                                          logCambios={mainRecord?.log_cambios}
                                          onViewLog={() => handleOpenLogModal(a.nombre, mainRecord?.log_cambios)}
                                          onSave={(val, checked) =>
                                            onGuardarValor({
                                              id: mainRecord?.id || null,
                                              id_lote_mineral: l.id,
                                              id_grupo_analisis_detalle: a.detalle_id,
                                              tipo_origen: currentTipoOrigen,
                                              uuid_fila: uuidFila,
                                              ley: val,
                                              esta_confirmada: checked,
                                            })
                                          }
                                        />
                                      </div>
                                    </td>
                                    {runIdx === 0 && (() => {
                                      const valActual = getValorLeyConsolidada(l.id, a.detalle_id, promedio);
                                      const estaInvalido = valActual.trim() === "" || Number(valActual) <= 0;
                                      return (
                                        <td
                                          rowSpan={totalRowsForLote}
                                          className="p-1.5 border-r border-zinc-800 text-center align-middle"
                                        >
                                          <div className="flex flex-col gap-1 items-center">
                                            <span className="font-bold text-[11px] text-indigo-400">
                                              {promedio.toFixed(3)}
                                            </span>
                                            <input
                                              type="number"
                                              step="any"
                                              min="0"
                                              disabled={l.estado_leyes === EstadoLeyes.Confirmado || promedio <= 0}
                                              placeholder={promedio > 0 ? promedio.toFixed(3) : "0.000"}
                                              value={valActual}
                                              onChange={(e) => onChangeLeyManual?.(l.id, a.detalle_id, e.currentTarget.value)}
                                              className={`w-16 h-5 text-center text-[10px] leading-none px-1 bg-zinc-950 border ${
                                                estaInvalido
                                                  ? "border-amber-500/80 text-amber-300 focus:border-amber-400 ring-1 ring-amber-500/20"
                                                  : "border-indigo-700/50 text-indigo-200 focus:border-indigo-400"
                                              } rounded-md focus:outline-none transition-all placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                              title={`Ley consolidada para ${a.nombre} (por defecto es el promedio, editable manualmente)`}
                                            />
                                          </div>
                                        </td>
                                      );
                                    })()}
                                  </React.Fragment>
                                );
                              } else {
                                // NOT desplegable: spans all rows vertically and renders only on runIdx === 0
                                if (runIdx !== 0) return null;

                                const cellSaving = !!isGuardandoCelda?.(
                                  buildCellKey({
                                    id_lote_mineral: l.id,
                                    id_grupo_analisis_detalle: a.detalle_id,
                                    uuid_fila: `default-run-${l.id}`,
                                    tipo_origen: null,
                                    id: allRecordsOfDetalle[0]?.id ?? null,
                                  }),
                                );

                                return (
                                  <td
                                    key={`${l.id}-orig-single-${a.detalle_id}`}
                                    rowSpan={totalRowsForLote}
                                    className="p-1.5 border-r border-zinc-800 text-center align-middle"
                                  >
                                    <div className="flex flex-col gap-1 items-center">
                                      <CellInput
                                        initialValue={allRecordsOfDetalle[0]?.ley || 0}
                                        initialChecked={allRecordsOfDetalle[0] ? allRecordsOfDetalle[0].esta_confirmada : false}
                                        disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                        saving={cellSaving}
                                        logCambios={allRecordsOfDetalle[0]?.log_cambios}
                                        onViewLog={() => handleOpenLogModal(a.nombre, allRecordsOfDetalle[0]?.log_cambios)}
                                        onSave={(val, checked) =>
                                          onGuardarValor({
                                            id: allRecordsOfDetalle[0]?.id || null,
                                            id_lote_mineral: l.id,
                                            id_grupo_analisis_detalle: a.detalle_id,
                                            tipo_origen: null,
                                            uuid_fila: `default-run-${l.id}`,
                                            ley: val,
                                            esta_confirmada: checked,
                                          })
                                        }
                                      />
                                    </div>
                                  </td>
                                );
                              }
                            })}
                          </React.Fragment>
                        );
                      } else {
                        return g.analitos.map((a: GrupoAnalisisDetalleResponse) => {
                          const allRecordsOfDetalle = l.analisis.filter(
                            (item: AnalisisMineralResponse) => item.id_grupo_analisis_detalle === a.detalle_id
                          );

                          if (a.es_desplegable) {
                            const runRecords = allRecordsOfDetalle.filter(
                              (item: AnalisisMineralResponse) =>
                                item.uuid_fila === uuidFila &&
                                item.tipo_origen === null
                            );
                            const mainRecord = runRecords[0];
                            const cellSaving = !!isGuardandoCelda?.(
                              buildCellKey({
                                id_lote_mineral: l.id,
                                id_grupo_analisis_detalle: a.detalle_id,
                                uuid_fila: uuidFila,
                                tipo_origen: null,
                                id: mainRecord?.id ?? null,
                              }),
                            );

                            const promedio = getPromedioAnalito(l, a.detalle_id);

                            return (
                              <React.Fragment key={`${l.id}-${uuidFila}-noorig-${a.detalle_id}`}>
                                <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                                  <div className="flex flex-col gap-1 items-center">
                                    <CellInput
                                      key={mainRecord?.id || "new"}
                                      initialValue={mainRecord?.ley || 0}
                                      initialChecked={mainRecord ? mainRecord.esta_confirmada : false}
                                      disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                      saving={cellSaving}
                                      logCambios={mainRecord?.log_cambios}
                                      onViewLog={() => handleOpenLogModal(a.nombre, mainRecord?.log_cambios)}
                                      onSave={(val, checked) =>
                                        onGuardarValor({
                                          id: mainRecord?.id || null,
                                          id_lote_mineral: l.id,
                                          id_grupo_analisis_detalle: a.detalle_id,
                                          tipo_origen: null,
                                          uuid_fila: uuidFila,
                                          ley: val,
                                          esta_confirmada: checked,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                {runIdx === 0 && (() => {
                                  const valActual = getValorLeyConsolidada(l.id, a.detalle_id, promedio);
                                  const estaInvalido = valActual.trim() === "" || Number(valActual) <= 0;
                                  return (
                                    <td
                                      rowSpan={totalRowsForLote}
                                      className="p-1.5 border-r border-zinc-800 text-center align-middle"
                                    >
                                      <div className="flex flex-col gap-1 items-center">
                                        <span className="font-bold text-[11px] text-indigo-400">
                                          {promedio.toFixed(3)}
                                        </span>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          disabled={l.estado_leyes === EstadoLeyes.Confirmado || promedio <= 0}
                                          placeholder={promedio > 0 ? promedio.toFixed(3) : "0.000"}
                                          value={valActual}
                                          onChange={(e) => onChangeLeyManual?.(l.id, a.detalle_id, e.currentTarget.value)}
                                          className={`w-16 h-5 text-center text-[10px] leading-none px-1 bg-zinc-950 border ${
                                            estaInvalido
                                              ? "border-amber-500/80 text-amber-300 focus:border-amber-400 ring-1 ring-amber-500/20"
                                              : "border-indigo-700/50 text-indigo-200 focus:border-indigo-400"
                                          } rounded-md focus:outline-none transition-all placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                          title={`Ley consolidada para ${a.nombre} (por defecto es el promedio, editable manualmente)`}
                                        />
                                      </div>
                                    </td>
                                  );
                                })()}
                              </React.Fragment>
                            );
                          } else {
                            // NOT desplegable: spans all rows vertically and renders only on runIdx === 0
                            if (runIdx !== 0) return null;

                            const cellSaving = !!isGuardandoCelda?.(
                              buildCellKey({
                                id_lote_mineral: l.id,
                                id_grupo_analisis_detalle: a.detalle_id,
                                uuid_fila: `default-run-${l.id}`,
                                tipo_origen: null,
                                id: allRecordsOfDetalle[0]?.id ?? null,
                              }),
                            );

                            return (
                              <td
                                key={`${l.id}-noorig-single-${a.detalle_id}`}
                                rowSpan={totalRowsForLote}
                                className="p-1.5 border-r border-zinc-800 text-center align-middle"
                              >
                                <div className="flex flex-col gap-1 items-center">
                                  <CellInput
                                    initialValue={allRecordsOfDetalle[0]?.ley || 0}
                                    initialChecked={allRecordsOfDetalle[0] ? allRecordsOfDetalle[0].esta_confirmada : false}
                                    disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                    saving={cellSaving}
                                    logCambios={allRecordsOfDetalle[0]?.log_cambios}
                                    onViewLog={() => handleOpenLogModal(a.nombre, allRecordsOfDetalle[0]?.log_cambios)}
                                    onSave={(val, checked) =>
                                      onGuardarValor({
                                        id: allRecordsOfDetalle[0]?.id || null,
                                        id_lote_mineral: l.id,
                                        id_grupo_analisis_detalle: a.detalle_id,
                                        tipo_origen: null,
                                        uuid_fila: `default-run-${l.id}`,
                                        ley: val,
                                        esta_confirmada: checked,
                                      })
                                    }
                                  />
                                </div>
                              </td>
                            );
                          }
                        });
                      }
                    })}

                    {/* Render Cierre status & action */}
                    {runIdx === 0 && (
                      <>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 text-xs text-center align-middle"
                        >
                          {l.estado_leyes === EstadoLeyes.Confirmado ? (
                            <Badge color="blue" radius="lg" size="xs" variant="light" className="font-semibold px-3 py-1">
                              Confirmado
                            </Badge>
                          ) : (
                            <Badge color="orange" radius="lg" size="xs" variant="light" className="font-semibold px-3 py-1">
                              En Proceso
                            </Badge>
                          )}
                        </td>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 text-xs text-center align-middle"
                        >
                          {l.estado_leyes === EstadoLeyes.Confirmado ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold text-[11px] px-2 py-0.5 rounded-lg ${l.con_valor_comercial
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/10 border border-red-500/20 text-red-400"
                                }`}>
                                {l.con_valor_comercial ? "Con Valor Comercial" : "Sin Valor Comercial"}
                              </span>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                <span className="font-semibold">Cerrado por:</span>{" "}
                                <span className="text-zinc-400 block">{l.empleado_confirmacion_nombre || "Desconocido"}</span>
                                <span className="block mt-0.5 text-[9px]">
                                  {l.fecha_hora_confirmacion_analisis
                                    ? new Date(l.fecha_hora_confirmacion_analisis).toLocaleString("es-ES")
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ) : (() => {
                            const validacion = validacionCierrePorLote?.[l.id] ?? { ok: false, motivo: "Validación pendiente" };
                            const valInputs = validarInputsLeyesConsolidadas(l, grupos);
                            const okParaCerrar = validacion.ok && valInputs.ok;
                            const bloqueado = confirmandoLote[l.id] || !okParaCerrar;
                            const tooltip = okParaCerrar
                              ? "Cerrar lote"
                              : (!validacion.ok ? validacion.motivo : valInputs.motivo) ?? "No se puede cerrar el lote";
                            return (
                              <div className="flex flex-col gap-2 w-full max-w-40 mx-auto">
                                <button
                                  type="button"
                                  disabled={bloqueado}
                                  title={tooltip}
                                  onClick={() => intentarCerrarLote(l, true)}
                                  className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {confirmandoLote[l.id] ? <Loader size={12} color="white" /> : null}
                                  Con Valor Comercial
                                </button>
                                <button
                                  type="button"
                                  disabled={bloqueado}
                                  title={tooltip}
                                  onClick={() => intentarCerrarLote(l, false)}
                                  className="w-full py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {confirmandoLote[l.id] ? <Loader size={12} color="white" /> : null}
                                  Sin Valor Comercial
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <ModalEstandar
        opened={modalLogOpened}
        close={() => setModalLogOpened(false)}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-amber-400" />
            <span>Historial de cambios ({selectedLogInfo?.analitoNombre || "Análisis"})</span>
          </Group>
        }
        size="lg"
      >
        <CambiosLogViewer
          cambios={selectedLogInfo?.cambios?.filter((c) => !c.motivo?.toLowerCase().includes("muestra externa") && !c.cambios?.some((sub) => sub.campo_bd === "id_muestra_externa" || (sub.campo_bd === "id_lote_mineral" && sub.valor_anterior === null)))}
          camposLegiblesCustom={{
            ley: "Ley",
            esta_confirmada: "Estado Confirmado",
            tipo_origen: "Tipo de origen",
            id_lote_mineral: "Lote Mineral",
            id_muestra_externa: "Muestra Externa",
          }}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalMuestrasAbierto}
        close={() => setModalMuestrasAbierto(false)}
        title={
          <div className="flex items-center gap-2 text-sm!">
            <IconClipboardList size={16} className="text-indigo-400 shrink-0" />
            <span className="text-sm! font-semibold">Muestras asociadas</span>
            {muestrasModalLoteId != null && (
              <span className="text-xs! px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                {lotes.find((l) => l.id === muestrasModalLoteId)?.correlativo ?? `#${muestrasModalLoteId}`}
              </span>
            )}
          </div>
        }
        size="md"
      >
        {cargandoMuestrasModal ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" color="indigo" />
          </div>
        ) : muestrasModalActual.length === 0 ? (
          <div className="text-center py-6 text-sm text-zinc-500">
            Este lote no tiene muestras externas asociadas.
          </div>
        ) : (
          <div className="space-y-2">
            {muestrasModalActual.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-700/30 bg-indigo-950/20"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-indigo-300 font-semibold text-sm">{m.correlativo}</span>
                  <span className="text-xs text-zinc-300">
                    {m.proveedor_razon_social ?? `Prov #${m.id_proveedor_minero}`}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {/* <span className="text-[10px] text-gray-300 uppercase tracking-wide">Asociada</span> */}
                  <span className="text-xs text-zinc-300 font-bold">
                    {new Date(m.created_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {m.empleado_registro_nombre && (
                    <span className="text-xs text-zinc-300">por {m.empleado_registro_nombre}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalEstandar>
    </>
  );
};
