import React, { useState } from "react";
import {
  IconPlus,
  IconTrashX,
  IconEye,
  IconPrinter,
  IconFileDescription,
  IconLock,
  IconAlertCircle,
  IconCheck,
  IconLink,
  IconHistory,
} from "@tabler/icons-react";
import { Badge, Tooltip, ActionIcon, Loader } from "@mantine/core";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type {
  LoteCierreResponse,
  GrupoAnalisisLoteResponse,
  MuestraAsociadaResponse,
  IArchivoDoc,
} from "../../service/cierre-leyes.responses";
import type {
  GuardarValoresAnalisisPayload,
  GuardarLeyesCierreGrupoPayload,
} from "../../service/cierre-leyes.service";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import { CellInput } from "./cell-input";
import { ModalDocumentosAnalisis } from "./modal-documentos-analisis";

interface TablaCierreLeyesProps {
  lotes: LoteCierreResponse[];
  onGuardarValoresAnalisis: (idAnalisis: number, payload: GuardarValoresAnalisisPayload) => Promise<boolean>;
  onGuardarLeyesCierreGrupo: (idGrupo: number, payload: GuardarLeyesCierreGrupoPayload) => Promise<boolean>;
  onEliminarAnalisis: (idAnalisis: number) => Promise<boolean>;
  onAbrirModalCrearGrupo: (idLote: number) => void;
  onAbrirModalAgregarAnalisis: (idGrupo: number, nombreGrupo: string) => void;
  onSubirDocumentos: (idAnalisis: number, archivos: File[]) => Promise<IArchivoDoc[] | boolean | null>;
  muestrasAsociadasPorGrupo?: Record<number, MuestraAsociadaResponse[]>;
  onCargarMuestrasAsociadas?: (idGrupo: number) => Promise<MuestraAsociadaResponse[]>;
  onImprimirGrupo?: (lote: LoteCierreResponse, grupo?: GrupoAnalisisLoteResponse) => void;
  onConfirmarLote?: (idLote: number, conValorComercial: boolean) => Promise<boolean>;
  confirmandoLote?: Record<number, boolean>;
  onAsociarMuestrasMultiples?: (idsMuestraExterna: number[], idGrupo: number) => Promise<boolean>;
  onAsociarAGrupo?: (idMuestraExterna: number, idGrupo: number) => Promise<boolean>;
}

interface CierreInputProps {
  value: number;
  promedio: number;
  disabled?: boolean;
  onSave: (val: number) => void;
  tooltipLabel: string;
}

const CierreInput = ({
  value,
  promedio,
  disabled,
  onSave,
  tooltipLabel,
}: CierreInputProps) => {
  const [prevValue, setPrevValue] = useState(value);
  const [val, setVal] = useState<string>(value > 0 ? value.toString() : "");

  if (value !== prevValue) {
    setPrevValue(value);
    setVal(value > 0 ? value.toString() : "");
  }

  const isInputDisabled = Boolean(disabled || promedio <= 0);

  const resolvedTooltipLabel = disabled
    ? tooltipLabel
    : promedio <= 0
    ? "Confirma al menos un ensayo con valor mayor a cero para habilitar la ley de cierre"
    : tooltipLabel;

  const handleBlur = () => {
    if (isInputDisabled) return;
    const numeric = parseFloat(val) || 0;
    if (numeric !== value) {
      onSave(numeric);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleApplyPromedio = () => {
    if (isInputDisabled || promedio <= 0) return;
    const rounded = Number(promedio.toFixed(3));
    setVal(rounded.toString());
    onSave(rounded);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-1">
        <Tooltip
          label={
            promedio > 0
              ? "Promedio de análisis confirmados (clic para aplicar a la ley de cierre)"
              : "Promedio de análisis confirmados (marca el check en los ensayos para promediar)"
          }
          withArrow
        >
          <button
            type="button"
            disabled={disabled || promedio <= 0}
            onClick={handleApplyPromedio}
            className={`font-mono font-bold text-xs transition-all ${
              promedio > 0
                ? "text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                : "text-indigo-400/60 cursor-default"
            }`}
          >
            {promedio > 0 ? promedio.toFixed(3) : "0.000"}
          </button>
        </Tooltip>
        {disabled && (
          <Tooltip label="Bloqueado por propuesta de valorización" withArrow>
            <IconLock size={12} className="text-amber-400" />
          </Tooltip>
        )}
      </div>

      <Tooltip label={resolvedTooltipLabel} withArrow>
        <input
          type="number"
          step="any"
          disabled={isInputDisabled}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0.000"
          className={`w-16 h-6 text-center text-xs font-mono font-bold border rounded-lg focus:outline-none transition-all placeholder:text-zinc-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            isInputDisabled
              ? "text-zinc-500 bg-zinc-900/60 border-zinc-800 cursor-not-allowed opacity-60"
              : "text-amber-300 bg-zinc-950 border-amber-500/50 focus:border-amber-400"
          }`}
        />
      </Tooltip>
    </div>
  );
};

export const TablaCierreLeyes = ({
  lotes,
  onGuardarValoresAnalisis,
  onGuardarLeyesCierreGrupo,
  onEliminarAnalisis,
  onAbrirModalCrearGrupo,
  onAbrirModalAgregarAnalisis,
  onSubirDocumentos,
  muestrasAsociadasPorGrupo,
  onCargarMuestrasAsociadas,
  onImprimirGrupo,
  onConfirmarLote,
  confirmandoLote,
  onAsociarMuestrasMultiples,
  onAsociarAGrupo,
}: TablaCierreLeyesProps) => {
  // Estado para Drag and Drop sobre grupos
  const [dragOverGrupoId, setDragOverGrupoId] = useState<number | null>(null);

  // Modal de auditoría
  const [modalLogOpened, setModalLogOpened] = useState(false);
  const [selectedLogInfo, setSelectedLogInfo] = useState<{
    titulo: string;
    cambios: RES_CambiosLog[] | null | undefined;
  } | null>(null);

  // Modal para ver/subir documentos
  const [modalDocsAnalisisId, setModalDocsAnalisisId] = useState<number | null>(null);
  const [docsModalAnalisis, setDocsModalAnalisis] = useState<IArchivoDoc[]>([]);

  // Modal de muestras asociadas al grupo
  const [modalMuestrasInfo, setModalMuestrasInfo] = useState<{ id: number; nombre: string } | null>(null);

  // Modal de confirmación de valor comercial
  const [modalConfirmarLote, setModalConfirmarLote] = useState<LoteCierreResponse | null>(null);
  const [valorComercialElegido, setValorComercialElegido] = useState<boolean>(true);
  const [guardandoValor, setGuardandoValor] = useState<boolean>(false);

  // Modal de confirmación de asociación por arrastre
  const [confirmDropData, setConfirmDropData] = useState<{
    gaId: number;
    grupoNombre: string;
    loteId: number;
    loteCorrelativo: string;
    loteProveedor?: string;
    muestras: { id: number; codigo: string; proveedor?: string }[];
  } | null>(null);
  const [asociandoDrop, setAsociandoDrop] = useState<boolean>(false);

  const handleAbrirConfirmarValor = (lote: LoteCierreResponse) => {
    setModalConfirmarLote(lote);
    setValorComercialElegido(lote.con_valor_comercial === false ? false : true);
    setGuardandoValor(false);
  };

  const handleDropOnGrupo = (
    e: React.DragEvent,
    gaId: number,
    gaNombre: string,
    lote: LoteCierreResponse
  ) => {
    e.preventDefault();
    setDragOverGrupoId(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      const ids: number[] = data.ids;
      if (!ids || ids.length === 0) return;

      const muestras =
        data.muestras && data.muestras.length > 0
          ? data.muestras
          : ids.map((id: number) => ({
              id,
              codigo: `Muestra #${id}`,
              proveedor: data.proveedorNombre,
            }));

      setConfirmDropData({
        gaId,
        grupoNombre: gaNombre,
        loteId: lote.id,
        loteCorrelativo: lote.correlativo,
        loteProveedor: lote.proveedor_razon_social || undefined,
        muestras,
      });
    } catch (err) {
      console.error("Error al procesar arrastre de muestra:", err);
    }
  };

  const handleEjecutarAsociacionDrop = async () => {
    if (!confirmDropData || asociandoDrop) return;
    setAsociandoDrop(true);
    try {
      const ids = confirmDropData.muestras.map((m) => m.id);
      if (onAsociarMuestrasMultiples) {
        await onAsociarMuestrasMultiples(ids, confirmDropData.gaId);
      } else if (onAsociarAGrupo && ids.length === 1) {
        await onAsociarAGrupo(ids[0], confirmDropData.gaId);
      }
      setConfirmDropData(null);
    } finally {
      setAsociandoDrop(false);
    }
  };

  const handleOpenLogModal = (titulo: string, cambios?: RES_CambiosLog[] | null) => {
    setSelectedLogInfo({ titulo, cambios });
    setModalLogOpened(true);
  };

  const handleAbrirDocs = (idAnalisis: number, docs: IArchivoDoc[]) => {
    setModalDocsAnalisisId(idAnalisis);
    setDocsModalAnalisis(docs);
  };

  const handleAbrirMuestras = async (idGrupo: number, nombreGrupo?: string) => {
    setModalMuestrasInfo({ id: idGrupo, nombre: nombreGrupo || `Grupo ${idGrupo}` });
    if (onCargarMuestrasAsociadas) {
      await onCargarMuestrasAsociadas(idGrupo);
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            {/* Cabecera Principal */}
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              <th rowSpan={2} className="p-2.5 border-r border-zinc-800 text-center align-middle min-w-40">
                Lote
              </th>

              <th rowSpan={2} className="p-2.5 border-r border-zinc-800 text-center align-middle min-w-36">
                Grupo de Análisis
              </th>

              {/* LEYES (cubriendo Au, Ag, Humedad, Recuperación -> 7 columnas) */}
              <th colSpan={7} className="p-2 border-r border-zinc-800 text-center bg-zinc-900/40">
                Leyes
              </th>

              {/* EVIDENCIA */}
              <th rowSpan={2} className="p-2 text-center align-middle min-w-24">
                Evidencia
              </th>
            </tr>

            {/* Sub-Cabecera */}
            <tr className="bg-zinc-900/90 border-b border-zinc-800 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
              <th className="p-1.5 border-r border-zinc-800 text-center w-20">Origen</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-28">NWAU (Oro)</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-24 text-indigo-300">Promedio</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-28">NWAG (Plata)</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-24 text-indigo-300">Promedio</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-24">Humedad</th>
              <th className="p-1.5 border-r border-zinc-800 text-center min-w-24">Recuperación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-xs">
            {lotes.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-zinc-500 text-sm">
                  No hay lotes con grupos de análisis registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            ) : (
              lotes.map((lote) => {
                const grupos =
                  lote.grupos_analisis && lote.grupos_analisis.length > 0
                    ? lote.grupos_analisis
                    : lote.grupo_analisis
                    ? [lote.grupo_analisis]
                    : [];

                // Si el lote no tiene grupos creados aún
                if (grupos.length === 0) {
                  return (
                    <tr key={`lote-empty-${lote.id}`} className="hover:bg-zinc-800/20 transition-colors">
                      {/* Columna Lote */}
                      <td className="p-2.5 border-r border-zinc-800 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-200">
                            {lote.correlativo}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium truncate max-w-35">
                            {lote.proveedor_razon_social || "Sin Proveedor"}
                          </span>

                          {onConfirmarLote && (
                            <Tooltip label="Clic para definir si este lote es Con o Sin Valor Comercial" withArrow>
                              <button
                                type="button"
                                onClick={() => handleAbrirConfirmarValor(lote)}
                                disabled={confirmandoLote?.[lote.id]}
                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                                  lote.con_valor_comercial === null
                                    ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700/80 hover:text-white"
                                    : lote.con_valor_comercial === false
                                    ? "bg-rose-950/60 border-rose-600/70 text-rose-300 hover:bg-rose-900/60"
                                    : "bg-emerald-950/60 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/60"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    lote.con_valor_comercial === null
                                      ? "bg-zinc-400"
                                      : lote.con_valor_comercial === false
                                      ? "bg-rose-400"
                                      : "bg-emerald-400"
                                  }`}
                                />
                                {lote.con_valor_comercial === null
                                  ? "Definir Valor Comercial"
                                  : lote.con_valor_comercial === false
                                  ? "Sin Valor Comercial"
                                  : "Con Valor Comercial"}
                              </button>
                            </Tooltip>
                          )}

                          <button
                            type="button"
                            onClick={() => onAbrirModalCrearGrupo(lote.id)}
                            className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 px-2.5 py-0.5 rounded-xl border border-indigo-600/50 bg-indigo-600/20 hover:bg-indigo-600/40 shadow-sm transition-all cursor-pointer"
                          >
                            <IconPlus size={11} /> Agregar Grupo
                          </button>
                        </div>
                      </td>

                      <td className="p-4 border-r border-zinc-800 text-center text-zinc-500 text-xs">
                        <span className="text-[10px] text-zinc-500 italic">Sin grupo</span>
                      </td>

                      <td colSpan={7} className="p-4 border-r border-zinc-800 text-center text-zinc-500 text-xs">
                        Crea un grupo de análisis para ingresar leyes.
                      </td>

                      <td className="p-2 text-center align-middle text-zinc-600">-</td>
                    </tr>
                  );
                }

                // Cantidad total de filas del lote (suma de filas de todos sus grupos)
                const loteTotalRows = grupos.reduce(
                  (acc, g) => acc + (g.analisis && g.analisis.length > 0 ? g.analisis.length : 1),
                  0
                );

                let isFirstRowOfLote = true;

                return (
                  <React.Fragment key={`lote-${lote.id}`}>
                    {grupos.map((ga) => {
                      const analisisList = ga.analisis ?? [];
                      const numAnalisis = analisisList.length > 0 ? analisisList.length : 1;

                      // Promedios de las corridas confirmadas de este grupo específico
                      const plataConfirmadas = analisisList.filter((a) => a.ley_plata_confirmada && a.ley_plata > 0);
                      const promedioPlata =
                        plataConfirmadas.length > 0
                          ? plataConfirmadas.reduce((acc, a) => acc + a.ley_plata, 0) / plataConfirmadas.length
                          : 0;

                      const oroConfirmadas = analisisList.filter((a) => a.ley_oro_confirmada && a.ley_oro > 0);
                      const promedioOro =
                        oroConfirmadas.length > 0
                          ? oroConfirmadas.reduce((acc, a) => acc + a.ley_oro, 0) / oroConfirmadas.length
                          : 0;

                      // Celda de Lote (se muestra solo en la primera fila de todo el lote)
                      const renderLoteCell = isFirstRowOfLote ? (
                        <td
                          rowSpan={loteTotalRows}
                          className="p-2.5 border-r border-zinc-800 text-center align-middle bg-zinc-950/40"
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-200">
                              {lote.correlativo}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-35">
                              {lote.proveedor_razon_social || "Sin Proveedor"}
                            </span>

                            {/* Indicador Con/Sin Valor Comercial */}
                            {onConfirmarLote && (
                              <Tooltip label="Clic para definir si este lote es Con o Sin Valor Comercial" withArrow>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirConfirmarValor(lote)}
                                  disabled={confirmandoLote?.[lote.id]}
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                                    lote.con_valor_comercial === null
                                      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700/80 hover:text-white"
                                      : lote.con_valor_comercial === false
                                      ? "bg-rose-950/60 border-rose-600/70 text-rose-300 hover:bg-rose-900/60"
                                      : "bg-emerald-950/60 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/60"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      lote.con_valor_comercial === null
                                        ? "bg-zinc-400"
                                        : lote.con_valor_comercial === false
                                        ? "bg-rose-400"
                                        : "bg-emerald-400"
                                    }`}
                                  />
                                  {lote.con_valor_comercial === null
                                    ? "Definir Valor Comercial"
                                    : lote.con_valor_comercial === false
                                    ? "Sin Valor Comercial"
                                    : "Con Valor Comercial"}
                                </button>
                              </Tooltip>
                            )}

                            {/* Botón Agregar Grupo */}
                            <button
                              type="button"
                              onClick={() => onAbrirModalCrearGrupo(lote.id)}
                              className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 px-2.5 py-0.5 rounded-xl border border-indigo-600/50 bg-indigo-600/20 hover:bg-indigo-600/40 shadow-sm transition-all cursor-pointer"
                            >
                              <IconPlus size={11} /> Agregar Grupo
                            </button>
                          </div>
                        </td>
                      ) : null;

                      // Celda de Grupo (se muestra en la primera fila de cada grupo)
                      const renderGrupoCell = (
                        <td
                          rowSpan={numAnalisis}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverGrupoId !== ga.id) setDragOverGrupoId(ga.id);
                          }}
                          onDragLeave={(e) => {
                            if (dragOverGrupoId === ga.id) {
                              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                              setDragOverGrupoId(null);
                            }
                          }}
                          onDrop={(e) => {
                            handleDropOnGrupo(e, ga.id, ga.nombre, lote);
                          }}
                          className={`p-2.5 border-r border-zinc-800 text-center align-middle transition-all ${
                            dragOverGrupoId === ga.id
                              ? "bg-indigo-950/80 ring-2 ring-indigo-500 ring-inset"
                              : "bg-zinc-950/20"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {dragOverGrupoId === ga.id && (
                              <Badge size="xs" color="indigo" variant="filled" className="animate-pulse mb-1">
                                Soltar para asociar
                              </Badge>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-200 text-xs">{ga.nombre}</span>
                              {(() => {
                                const totalMuestras = (ga.total_muestras_asociadas ?? 0) > 0
                                  ? ga.total_muestras_asociadas!
                                  : (muestrasAsociadasPorGrupo?.[ga.id]?.length ?? 0);

                                return (
                                  <Tooltip
                                    label={
                                      totalMuestras > 0
                                        ? `Ver ${totalMuestras} muestra${totalMuestras > 1 ? "s" : ""} asociada${totalMuestras > 1 ? "s" : ""}`
                                        : "Ver muestras asociadas al grupo"
                                    }
                                    withArrow
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirMuestras(ga.id, ga.nombre)}
                                      className="relative p-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer rounded-lg hover:bg-zinc-800/60"
                                    >
                                      <IconEye size={13} />
                                      {totalMuestras > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 text-[9px] font-bold text-white bg-indigo-600 rounded-full border border-zinc-950 shadow-sm leading-none pointer-events-none">
                                          {totalMuestras}
                                        </span>
                                      )}
                                    </button>
                                  </Tooltip>
                                );
                              })()}
                              {onImprimirGrupo && (
                                <Tooltip label="Imprimir reporte del grupo" withArrow>
                                  <button
                                    type="button"
                                    onClick={() => onImprimirGrupo(lote, ga)}
                                    className="text-zinc-400 hover:text-indigo-300 transition-colors p-0.5 cursor-pointer"
                                  >
                                    <IconPrinter size={13} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                            {ga.tiene_propuesta_oro && (
                              <Badge
                                size="xs"
                                color={ga.estado_valorizacion_oro === "Aprobado" ? "teal" : "yellow"}
                                variant="light"
                                leftSection={<IconLock size={10} />}
                              >
                                {ga.estado_valorizacion_oro === "Aprobado" ? "Aprobado Au" : "Propuesta Au"}
                              </Badge>
                            )}
                            {ga.tiene_propuesta_plata && (
                              <Badge
                                size="xs"
                                color={ga.estado_valorizacion_plata === "Aprobado" ? "teal" : "gray"}
                                variant="light"
                                leftSection={<IconLock size={10} />}
                              >
                                {ga.estado_valorizacion_plata === "Aprobado" ? "Aprobado Ag" : "Propuesta Ag"}
                              </Badge>
                            )}
                            {!ga.tiene_propuesta_oro && !ga.tiene_propuesta_plata ? (
                              <button
                                type="button"
                                onClick={() => onAbrirModalAgregarAnalisis(ga.id, ga.nombre)}
                                className="mt-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 hover:bg-cyan-900/40 transition-all cursor-pointer"
                              >
                                <IconPlus size={11} /> Añadir Análisis
                              </button>
                            ) : (
                              <Tooltip
                                label={
                                  ga.estado_valorizacion_oro === "Aprobado" || ga.estado_valorizacion_plata === "Aprobado"
                                    ? "Bloqueado: el grupo tiene valorizaciones aprobadas o en propuesta"
                                    : "Bloqueado: el grupo está en una propuesta de valorización"
                                }
                                withArrow
                              >
                                <span
                                  className={`mt-1 text-[10px] flex items-center gap-1 font-medium ${
                                    ga.estado_valorizacion_oro === "Aprobado" || ga.estado_valorizacion_plata === "Aprobado"
                                      ? "text-teal-400/90"
                                      : "text-amber-500/80"
                                  }`}
                                >
                                  <IconLock size={11} /> Bloqueado
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      );

                      // Si el grupo no tiene análisis aún
                      if (analisisList.length === 0) {
                        const showLote = isFirstRowOfLote;
                        if (isFirstRowOfLote) isFirstRowOfLote = false;

                        return (
                          <tr key={`grupo-empty-${ga.id}`} className="hover:bg-zinc-800/20 transition-colors">
                            {showLote && renderLoteCell}
                            {renderGrupoCell}
                            <td colSpan={7} className="p-4 border-r border-zinc-800 text-center text-zinc-500 text-xs">
                              No hay ensayos de análisis registrados para este grupo.
                            </td>
                            <td className="p-2 text-center align-middle text-zinc-600">-</td>
                          </tr>
                        );
                      }

                      // Filas de análisis para el grupo
                      return analisisList.map((analisis, idx) => {
                        const showLote = isFirstRowOfLote;
                        if (isFirstRowOfLote) isFirstRowOfLote = false;

                        const tieneDocs = analisis.documentos && analisis.documentos.length > 0;

                        return (
                          <tr key={`analisis-${analisis.id}`} className="hover:bg-zinc-800/20 transition-colors">
                            {showLote && renderLoteCell}
                            {idx === 0 && renderGrupoCell}

                            {/* ORIGEN Y ACCIÓN */}
                            <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <select
                                  value={analisis.tipo_origen ?? TipoOrigen.Interno}
                                  disabled={ga.tiene_propuesta_oro || ga.tiene_propuesta_plata}
                                  onChange={(e) => {
                                    const nuevoTipo = e.target.value as TipoOrigen;
                                    onGuardarValoresAnalisis(analisis.id, { tipo_origen: nuevoTipo });
                                  }}
                                  className={`text-[10px] font-semibold px-1 py-0.5 rounded border focus:outline-none transition-all cursor-pointer ${
                                    analisis.tipo_origen === TipoOrigen.Externo
                                      ? "bg-amber-950/60 border-amber-600/60 text-amber-300"
                                      : "bg-indigo-950/60 border-indigo-600/60 text-indigo-300"
                                  }`}
                                  title="Cambiar Tipo de Origen"
                                >
                                  <option value={TipoOrigen.Interno} className="bg-zinc-900 text-zinc-200">
                                    Interno
                                  </option>
                                  <option value={TipoOrigen.Externo} className="bg-zinc-900 text-zinc-200">
                                    Externo
                                  </option>
                                </select>
                                <Tooltip
                                  disabled={!ga.tiene_propuesta_oro && !ga.tiene_propuesta_plata}
                                  label="No se puede eliminar: el grupo está en una propuesta de valorización"
                                  withArrow
                                >
                                  <span>
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="red"
                                      disabled={ga.tiene_propuesta_oro || ga.tiene_propuesta_plata}
                                      onClick={() => onEliminarAnalisis(analisis.id)}
                                      title="Eliminar fila de análisis"
                                    >
                                      <IconTrashX size={12} />
                                    </ActionIcon>
                                  </span>
                                </Tooltip>
                                {(() => {
                                  const anLogs = analisis.log_cambios || [];
                                  const gLogs = ga.log_cambios || [];
                                  let logsFila: RES_CambiosLog[] = anLogs;
                                  if (gLogs.length > 0) {
                                    if (anLogs.length === 0) {
                                      logsFila = gLogs;
                                    } else {
                                      logsFila = [...anLogs];
                                      for (const gLog of gLogs) {
                                        const gStamp = String(gLog.update_at || (gLog as unknown as Record<string, unknown>).fecha_hora || "");
                                        const yaExiste = logsFila.some((aLog) => {
                                          const aStamp = String(aLog.update_at || (aLog as unknown as Record<string, unknown>).fecha_hora || "");
                                          if (aStamp && gStamp && aStamp === gStamp) {
                                            const camposA = (aLog.cambios || []).map((c) => c.campo_bd?.replace("_cierre", ""));
                                            const camposG = (gLog.cambios || []).map((c) => c.campo_bd?.replace("_cierre", ""));
                                            return camposG.some((cg) => cg && camposA.includes(cg));
                                          }
                                          return false;
                                        });
                                        if (!yaExiste) {
                                          logsFila.push(gLog);
                                        }
                                      }
                                    }
                                  }

                                  if (logsFila.length === 0) return null;

                                  return (
                                    <Tooltip label="Ver historial de cambios del análisis y leyes" withArrow>
                                      <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="yellow"
                                        onClick={() =>
                                          handleOpenLogModal(
                                            `Historial de Cambios — Ensayo #${analisis.numero_ensayo}`,
                                            logsFila
                                          )
                                        }
                                        title="Historial de cambios"
                                      >
                                        <IconHistory size={12} />
                                      </ActionIcon>
                                    </Tooltip>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* NWAU (ORO) */}
                            <td className="p-1 border-r border-zinc-800 text-center align-middle">
                              <Tooltip
                                disabled={!ga.tiene_propuesta_oro}
                                label={
                                  ga.estado_valorizacion_oro === "Aprobado"
                                    ? "Bloqueado por valorización aprobada (Oro)"
                                    : "Bloqueado por propuesta de valorización (Oro)"
                                }
                                withArrow
                              >
                                <div>
                                  <CellInput
                                    initialValue={analisis.ley_oro}
                                    initialChecked={analisis.ley_oro_confirmada}
                                    disabled={ga.tiene_propuesta_oro}
                                    onSave={(val, chk) => {
                                      onGuardarValoresAnalisis(analisis.id, {
                                        ley_oro: val,
                                        ley_oro_confirmada: chk,
                                      });
                                    }}
                                  />
                                </div>
                              </Tooltip>
                            </td>

                            {/* PROMEDIO ORO & LEY CIERRE */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-2 border-r border-zinc-800 text-center align-middle bg-zinc-950/30"
                              >
                                <CierreInput
                                  value={ga.ley_oro_cierre}
                                  promedio={promedioOro}
                                  disabled={ga.tiene_propuesta_oro}
                                  onSave={(val) => onGuardarLeyesCierreGrupo(ga.id, { ley_oro_cierre: val })}
                                  tooltipLabel={
                                    ga.tiene_propuesta_oro
                                      ? (ga.estado_valorizacion_oro === "Aprobado"
                                          ? "Bloqueado: el grupo tiene una valorización aprobada para Oro"
                                          : "Bloqueado: el grupo tiene una propuesta de valorización para Oro")
                                      : "Ley final de cierre para Oro (escribe o haz clic en el promedio arriba para aplicarlo)"
                                  }
                                />
                              </td>
                            )}

                            {/* NWAG (PLATA) */}
                            <td className="p-1 border-r border-zinc-800 text-center align-middle">
                              <Tooltip
                                disabled={!ga.tiene_propuesta_plata}
                                label={
                                  ga.estado_valorizacion_plata === "Aprobado"
                                    ? "Bloqueado por valorización aprobada (Plata)"
                                    : "Bloqueado por propuesta de valorización (Plata)"
                                }
                                withArrow
                              >
                                <div>
                                  <CellInput
                                    initialValue={analisis.ley_plata}
                                    initialChecked={analisis.ley_plata_confirmada}
                                    disabled={ga.tiene_propuesta_plata}
                                    onSave={(val, chk) => {
                                      onGuardarValoresAnalisis(analisis.id, {
                                        ley_plata: val,
                                        ley_plata_confirmada: chk,
                                      });
                                    }}
                                  />
                                </div>
                              </Tooltip>
                            </td>

                            {/* PROMEDIO PLATA & LEY CIERRE */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-2 border-r border-zinc-800 text-center align-middle bg-zinc-950/30"
                              >
                                <CierreInput
                                  value={ga.ley_plata_cierre}
                                  promedio={promedioPlata}
                                  disabled={ga.tiene_propuesta_plata}
                                  onSave={(val) => onGuardarLeyesCierreGrupo(ga.id, { ley_plata_cierre: val })}
                                  tooltipLabel={
                                    ga.tiene_propuesta_plata
                                      ? (ga.estado_valorizacion_plata === "Aprobado"
                                          ? "Bloqueado: el grupo tiene una valorización aprobada para Plata"
                                          : "Bloqueado: el grupo tiene una propuesta de valorización para Plata")
                                      : "Ley final de cierre para Plata (escribe o haz clic en el promedio arriba para aplicarlo)"
                                  }
                                />
                              </td>
                            )}

                            {/* HUMEDAD (un solo input por grupo) */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-1 border-r border-zinc-800 text-center align-middle bg-zinc-950/20"
                              >
                                <Tooltip
                                  disabled={
                                    !ga.tiene_propuesta_oro &&
                                    !ga.tiene_propuesta_plata
                                  }
                                  label={
                                    ga.estado_valorizacion_oro === "Aprobado" || ga.estado_valorizacion_plata === "Aprobado"
                                      ? "Bloqueado por valorización aprobada"
                                      : "Bloqueado por propuesta de valorización"
                                  }
                                  withArrow
                                >
                                  <div>
                                    <CellInput
                                      initialValue={
                                        ga.ley_humedad_cierre > 0
                                          ? ga.ley_humedad_cierre
                                          : analisisList[0]?.ley_humedad || 0
                                      }
                                      initialChecked={false}
                                      hideCheckbox
                                      disabled={
                                        ga.tiene_propuesta_oro ||
                                        ga.tiene_propuesta_plata
                                      }
                                      onSave={(val) => {
                                        onGuardarLeyesCierreGrupo(ga.id, { ley_humedad_cierre: val });
                                        analisisList.forEach((a) => {
                                          onGuardarValoresAnalisis(a.id, { ley_humedad: val });
                                        });
                                      }}
                                    />
                                  </div>
                                </Tooltip>
                              </td>
                            )}

                            {/* RECUPERACIÓN (un solo input por grupo) */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-1 border-r border-zinc-800 text-center align-middle bg-zinc-950/20"
                              >
                                <Tooltip
                                  disabled={
                                    !ga.tiene_propuesta_oro &&
                                    !ga.tiene_propuesta_plata
                                  }
                                  label={
                                    ga.estado_valorizacion_oro === "Aprobado" || ga.estado_valorizacion_plata === "Aprobado"
                                      ? "Bloqueado por valorización aprobada"
                                      : "Bloqueado por propuesta de valorización"
                                  }
                                  withArrow
                                >
                                  <div>
                                    <CellInput
                                      initialValue={
                                        ga.ley_recuperacion_cierre > 0
                                          ? ga.ley_recuperacion_cierre
                                          : analisisList[0]?.ley_recuperacion || 0
                                      }
                                      initialChecked={false}
                                      hideCheckbox
                                      disabled={
                                        ga.tiene_propuesta_oro ||
                                        ga.tiene_propuesta_plata
                                      }
                                      onSave={(val) => {
                                        onGuardarLeyesCierreGrupo(ga.id, { ley_recuperacion_cierre: val });
                                        analisisList.forEach((a) => {
                                          onGuardarValoresAnalisis(a.id, { ley_recuperacion: val });
                                        });
                                      }}
                                    />
                                  </div>
                                </Tooltip>
                              </td>
                            )}

                            {/* EVIDENCIA */}
                            <td className="p-1.5 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => handleAbrirDocs(analisis.id, analisis.documentos)}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 mx-auto transition-all ${
                                  tieneDocs
                                    ? "bg-indigo-950/50 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/50"
                                    : "bg-rose-950/30 border-rose-800/60 text-rose-400 hover:bg-rose-900/40"
                                }`}
                              >
                                {tieneDocs ? (
                                  <IconFileDescription size={13} />
                                ) : (
                                  <IconLock size={13} className="text-rose-400" />
                                )}
                                <span>{analisis.documentos.length}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Historial de Cambios */}
      <ModalEstandar
        opened={modalLogOpened}
        close={() => setModalLogOpened(false)}
        title={selectedLogInfo?.titulo ?? "Historial de Cambios"}
        size="lg"
      >
        <CambiosLogViewer cambios={selectedLogInfo?.cambios ?? []} />
      </ModalEstandar>

      {/* Modal Documentos por análisis */}
      {modalDocsAnalisisId !== null && (
        <ModalDocumentosAnalisis
          opened={true}
          onClose={() => setModalDocsAnalisisId(null)}
          idAnalisis={modalDocsAnalisisId}
          documentos={
            (() => {
              for (const lote of lotes) {
                const grupos =
                  lote.grupos_analisis && lote.grupos_analisis.length > 0
                    ? lote.grupos_analisis
                    : lote.grupo_analisis
                    ? [lote.grupo_analisis]
                    : [];
                for (const g of grupos) {
                  const an = g.analisis?.find((a) => a.id === modalDocsAnalisisId);
                  if (an) return an.documentos;
                }
              }
              return docsModalAnalisis;
            })()
          }
          onSubirDocumentos={onSubirDocumentos}
        />
      )}

      {/* Modal Muestras Asociadas al Grupo */}
      {modalMuestrasInfo !== null && (
        <ModalEstandar
          opened={true}
          close={() => setModalMuestrasInfo(null)}
          title={`Muestras Asociadas — ${modalMuestrasInfo.nombre}`}
          size="sm"
        >
          <div className="space-y-2.5 pt-1">
            {(!muestrasAsociadasPorGrupo || (muestrasAsociadasPorGrupo[modalMuestrasInfo.id] ?? []).length === 0) ? (
              <p className="text-zinc-400 text-sm text-center py-6">
                No hay muestras externas asociadas a este grupo.
              </p>
            ) : (
              <div className="space-y-2 max-h-85 overflow-y-auto pr-0.5">
                {(muestrasAsociadasPorGrupo[modalMuestrasInfo.id] ?? []).map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide whitespace-nowrap">
                          {m.codigo_cliente ? `Muestra ${m.codigo_cliente}` : `Muestra #${m.id_muestra_externa}`}
                        </span>
                        {m.proveedor_nombre && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                            {m.proveedor_nombre}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shrink-0">
                        {m.total_ensayos ?? 1} análisis
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="text-zinc-500 font-medium shrink-0">
                        Laboratorio{m.laboratorio_nombre?.includes(",") ? "s" : ""}:
                      </span>
                      <span className="text-zinc-200 font-semibold truncate">
                        {m.laboratorio_nombre || "Sin laboratorio"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalEstandar>
      )}

      {/* Modal Confirmación Valor Comercial */}
      {modalConfirmarLote !== null && (
        <ModalEstandar
          opened={true}
          close={() => setModalConfirmarLote(null)}
          title={
            <div className="flex items-center gap-2">
              <IconAlertCircle size={18} className="text-amber-400" />
              <span className="font-semibold text-sm">Valor Comercial</span>
            </div>
          }
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Lote:</span>
                <span className="font-bold text-white">{modalConfirmarLote.correlativo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Proveedor:</span>
                <span className="font-medium text-zinc-300">
                  {modalConfirmarLote.proveedor_razon_social || "Sin Proveedor"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Condición actual:</span>
                <span
                  className={`font-semibold ${
                    modalConfirmarLote.con_valor_comercial === null
                      ? "text-zinc-400"
                      : modalConfirmarLote.con_valor_comercial
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {modalConfirmarLote.con_valor_comercial === null
                    ? "Sin Definir"
                    : modalConfirmarLote.con_valor_comercial
                    ? "Con Valor Comercial"
                    : "Sin Valor Comercial"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 block">
                Selecciona la condición comercial para este lote:
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValorComercialElegido(true)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    valorComercialElegido === true
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/50"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      valorComercialElegido === true
                        ? "border-emerald-400 bg-emerald-500"
                        : "border-zinc-600"
                    }`}
                  >
                    {valorComercialElegido === true && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    Con Valor Comercial
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValorComercialElegido(false)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    valorComercialElegido === false
                      ? "bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/50"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      valorComercialElegido === false
                        ? "border-rose-400 bg-rose-500"
                        : "border-zinc-600"
                    }`}
                  >
                    {valorComercialElegido === false && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </span>
                  <span className="text-xs font-bold text-rose-300">
                    Sin Valor Comercial
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                disabled={guardandoValor || (modalConfirmarLote ? !!confirmandoLote?.[modalConfirmarLote.id] : false)}
                onClick={() => setModalConfirmarLote(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoValor || (modalConfirmarLote ? !!confirmandoLote?.[modalConfirmarLote.id] : false)}
                onClick={async () => {
                  if (!onConfirmarLote || !modalConfirmarLote || guardandoValor) return;
                  setGuardandoValor(true);
                  try {
                    const ok = await onConfirmarLote(
                      modalConfirmarLote.id,
                      valorComercialElegido
                    );
                    if (ok) {
                      setModalConfirmarLote(null);
                    }
                  } finally {
                    setGuardandoValor(false);
                  }
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5 ${
                  valorComercialElegido
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-950/50"
                }`}
              >
                {(guardandoValor || (modalConfirmarLote && confirmandoLote?.[modalConfirmarLote.id])) ? (
                  <Loader size={13} color="white" />
                ) : (
                  <IconCheck size={14} />
                )}
                <span>
                  {(guardandoValor || (modalConfirmarLote && confirmandoLote?.[modalConfirmarLote.id]))
                    ? "Confirmando..."
                    : "Confirmar"}
                </span>
              </button>
            </div>
          </div>
        </ModalEstandar>
      )}

      {/* Modal Confirmación de Asociación por Arrastre */}
      {confirmDropData && (
        <ModalEstandar
          opened={true}
          close={() => !asociandoDrop && setConfirmDropData(null)}
          title={
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <IconLink size={17} />
              <span>Confirmar Asociación de Muestras</span>
            </div>
          }
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              ¿Deseas asociar{" "}
              {confirmDropData.muestras.length === 1 ? (
                <span>la siguiente muestra</span>
              ) : (
                <span>
                  las siguientes <strong>{confirmDropData.muestras.length}</strong> muestras
                </span>
              )}{" "}
              al grupo <strong className="text-white font-bold">{confirmDropData.grupoNombre}</strong> del lote{" "}
              <strong className="text-indigo-300 font-mono font-bold">{confirmDropData.loteCorrelativo}</strong>?
            </p>

            {/* Lista visual de muestras */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Muestras a asociar ({confirmDropData.muestras.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {confirmDropData.muestras.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-xs font-medium text-indigo-200"
                  >
                    <span className="font-bold text-white">{m.codigo}</span>
                    {m.proveedor && (
                      <span className="text-[10px] text-zinc-400">({m.proveedor})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Advertencia si difiere el proveedor */}
            {confirmDropData.loteProveedor &&
              confirmDropData.muestras.some(
                (m) => m.proveedor && m.proveedor !== confirmDropData.loteProveedor
              ) && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-[11px] text-amber-300 flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    Atención: El lote pertenece a <strong>{confirmDropData.loteProveedor}</strong>, mientras que alguna de las muestras proviene de otro proveedor.
                  </div>
                </div>
              )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={asociandoDrop}
                onClick={() => setConfirmDropData(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={asociandoDrop}
                onClick={handleEjecutarAsociacionDrop}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-900/40"
              >
                {asociandoDrop ? (
                  <>
                    <Loader size={13} color="white" />
                    <span>Asociando...</span>
                  </>
                ) : (
                  <>
                    <IconLink size={14} />
                    <span>Confirmar Asociación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalEstandar>
      )}
    </>
  );
};
