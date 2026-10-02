import React, { useState } from "react";
import { Loader, Select, Tooltip, Button } from "@mantine/core";
import { IconHistory, IconLink, IconPlus, IconTrashX } from "@tabler/icons-react";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { MuestraExternaResponse, LoteCierreResponse } from "../../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse, GrupoAnalisisDetalleResponse } from "../../../../modules/gestion-leyes/service/gestion-leyes.responses";
import { CellInput } from "./cell-input";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import type { GuardarValorMuestraPayload } from "../../service/cierre-leyes.service";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import { useNotify } from "../../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";

interface TablaMuestrasExternasProps {
  muestras: MuestraExternaResponse[];
  grupos: GrupoAnalisisResponse[];
  lotesDisponibles: LoteCierreResponse[]; // solo Pendiente / EnProceso
  onGuardarValor: (payload: GuardarValorMuestraPayload) => Promise<boolean>;
  onAgregarAnalisis: (idMuestraExterna: number) => Promise<boolean>;
  onEliminarFila: (idMuestraExterna: number, uuidFila: string) => Promise<boolean>;
  onActualizarOrigenFila: (idMuestraExterna: number, uuidFila: string, tipoOrigen: TipoOrigen | null) => Promise<boolean>;
  onAsociar: (idMuestraExterna: number, idLoteMineral: number) => Promise<boolean>;
  isAsociando?: (idMuestraExterna: number) => boolean;
  isAgregandoAnalisis?: (idMuestraExterna: number) => boolean;
  isGuardandoCelda?: (key: string) => boolean;
  cellKeyFn?: (p: Pick<GuardarValorMuestraPayload, "id_muestra_externa" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) => string;
  /** Determina si la muestra puede asociarse a un lote (todos los análisis con dato > 0). */
  puedeAsociar?: (m: MuestraExternaResponse) => { ok: boolean; motivo?: string };
  /** Permitir arrastrar las filas para soltarlas sobre un lote (HTML5 nativo). */
  onDragStart?: (idMuestraExterna: number, e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragEnd?: () => void;
}

export const TablaMuestrasExternas = ({
  muestras,
  grupos,
  lotesDisponibles,
  onGuardarValor,
  onAgregarAnalisis,
  onEliminarFila,
  onActualizarOrigenFila,
  onAsociar,
  isAsociando,
  isAgregandoAnalisis,
  isGuardandoCelda,
  cellKeyFn,
  puedeAsociar,
  onDragStart,
  onDragEnd,
}: TablaMuestrasExternasProps) => {
  const { notifyWarning } = useNotify();

  // Estado para modal "Asociar a lote"
  const [asociarOpen, setAsociarOpen] = useState(false);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState<MuestraExternaResponse | null>(null);
  const [loteDestinoId, setLoteDestinoId] = useState<string | null>(null);

  // Estado para modal de historial
  const [modalLogOpened, setModalLogOpened] = useState(false);
  const [selectedLogInfo, setSelectedLogInfo] = useState<{
    analitoNombre: string;
    cambios: RES_CambiosLog[] | null | undefined;
  } | null>(null);

  const handleOpenLogModal = (analitoNombre: string, cambios?: RES_CambiosLog[] | null) => {
    setSelectedLogInfo({ analitoNombre, cambios });
    setModalLogOpened(true);
  };

  /**
   * Crea un nodo DOM off-screen que contiene solo el badge "RC-XX" para usar como preview
   * del drag — así el navegador no muestra toda la fila durante el arrastre.
   */
  const handleDragStart = (m: MuestraExternaResponse, e: React.DragEvent<HTMLTableRowElement>) => {
    const ghost = document.createElement("div");
    ghost.textContent = m.correlativo;
    ghost.style.position = "absolute";
    ghost.style.top = "-1000px";
    ghost.style.padding = "4px 10px";
    ghost.style.background = "rgba(99, 102, 241, 0.85)";
    ghost.style.color = "#fff";
    ghost.style.borderRadius = "9999px";
    ghost.style.fontFamily = "monospace";
    ghost.style.fontSize = "11px";
    ghost.style.fontWeight = "700";
    ghost.style.border = "1px solid rgba(165, 180, 252, 0.6)";
    ghost.style.boxShadow = "0 4px 18px rgba(99, 102, 241, 0.45)";
    ghost.style.letterSpacing = "0.5px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 30, 8);
    setTimeout(() => document.body.removeChild(ghost), 0);
    onDragStart?.(m.id, e);
  };

  const handleAbrirAsociar = (m: MuestraExternaResponse) => {
    setMuestraSeleccionada(m);
    setLoteDestinoId(null);
    setAsociarOpen(true);
  };

  const handleConfirmarAsociacion = async () => {
    if (!muestraSeleccionada || !loteDestinoId) {
      notifyWarning("Selecciona un lote destino para asociar la muestra.");
      return;
    }
    const ok = await onAsociar(muestraSeleccionada.id, Number(loteDestinoId));
    if (ok) {
      setAsociarOpen(false);
      setMuestraSeleccionada(null);
      setLoteDestinoId(null);
    }
  };

  const handleEliminarFilaConfirm = (idMuestraExterna: number, uuidFila: string) => {
    mostrarConfirmacion({
      title: "Eliminar corrida de análisis",
      tipo: "peligro",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      message: (
        <div className="space-y-1">
          <p>¿Estás seguro de que deseas eliminar esta corrida de análisis?</p>
          <p className="text-zinc-500 text-xs">
            Se borrarán todos los valores ingresados en esta corrida (no se pueden revertir).
          </p>
        </div>
      ),
      onConfirm: async () => {
        await onEliminarFila(idMuestraExterna, uuidFila);
      },
    });
  };

  // Estado local optimista para el Tipo Origen de cada corrida (uuid_fila → TipoOrigen | null)
  const [runOrigines, setRunOrigines] = useState<Record<string, TipoOrigen | null>>({});

  const handleUpdateOrigen = async (
    idMuestra: number,
    uuidFila: string,
    newOrigen: TipoOrigen | null,
  ) => {
    setRunOrigines((prev) => ({ ...prev, [uuidFila]: newOrigen }));
    await onActualizarOrigenFila(idMuestra, uuidFila, newOrigen);
  };

  const buildCellKey = (
    p: Pick<GuardarValorMuestraPayload, "id_muestra_externa" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null },
  ): string =>
    cellKeyFn
      ? cellKeyFn(p)
      : `m${p.id_muestra_externa}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

  const opcionesLotes = lotesDisponibles.map((l) => ({
    value: String(l.id),
    label: `${l.correlativo} (${l.estado_leyes})`,
  }));

  if (muestras.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-x-auto border border-indigo-700/40 rounded-2xl bg-indigo-950/10 backdrop-blur-md shadow-2xl mt-6">
        <div className="px-4 py-2 border-b border-indigo-700/30 text-[11px] font-bold tracking-wider text-indigo-300 uppercase flex items-center gap-2">
          <IconLink size={12} stroke={2.5} />
          <span>Muestras externas en proceso</span>
          <span className="ml-auto text-zinc-500 normal-case font-medium">
            {muestras.length} activa{muestras.length === 1 ? "" : "s"} — arrastra una fila sobre un lote para asociarla
          </span>
        </div>
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              <th rowSpan={2} className="p-2.5 border-r border-zinc-800 text-center align-middle min-w-60">
                Muestra externa
              </th>
              {grupos.map((g: GrupoAnalisisResponse) => {
                // Para grupos con indicar_origen=true, se añade 1 columna extra (Tipo Origen) por cada corrida
                // → colSpan = (analitos con sus PROMEDIO) + 1 si indicar_origen
                const colSpan = g.analitos.reduce((acc: number, a: GrupoAnalisisDetalleResponse) => acc + (a.es_desplegable ? 2 : 1), 0) + (g.indicar_origen ? 1 : 0);
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
            </tr>

            <tr className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
              {grupos.map((g: GrupoAnalisisResponse) => {
                const elements: React.ReactNode[] = [];
                if (g.indicar_origen) {
                  elements.push(
                    <th key={`${g.id}-origen`} className="p-1.5 border-r border-zinc-800 text-center align-middle font-medium text-zinc-500">
                      Tipo Origen
                    </th>,
                  );
                }
                g.analitos.forEach((a: GrupoAnalisisDetalleResponse) => {
                  elements.push(
                    <th key={`${g.id}-${a.id_analito}`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/10">
                      <div className="flex flex-col items-center">
                        <span className="text-zinc-300 font-semibold">{a.nombre}</span>
                      </div>
                    </th>,
                  );
                  if (a.es_desplegable) {
                    elements.push(
                      <th key={`${g.id}-${a.id_analito}-prom`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/20 font-semibold text-indigo-400">
                        Promedio
                      </th>,
                    );
                  }
                });
                return elements;
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {muestras.map((m: MuestraExternaResponse) => {
              const dbUuids = Array.from(
                new Set(m.analisis.map((a) => a.uuid_fila).filter(Boolean)),
              );
              const runs = dbUuids.length > 0 ? dbUuids : [`default-run-${m.id}`];
              const totalRowsForMuestra = runs.length;
              const asociandoMuestraActual = !!isAsociando?.(m.id);
              const agregandoActual = !!isAgregandoAnalisis?.(m.id);

              return runs.map((uuidFila: string, runIdx: number) => {
                const dbRecord = m.analisis.find((a) => a.uuid_fila === uuidFila && a.tipo_origen !== null);
                const currentTipoOrigen = (
                  runOrigines[uuidFila] ?? dbRecord?.tipo_origen ?? null
                ) as TipoOrigen | null;

                return (
                  <tr
                    key={`${m.id}-${uuidFila}`}
                    draggable
                    onDragStart={(e) => handleDragStart(m, e)}
                    onDragEnd={() => onDragEnd?.()}
                    className="hover:bg-zinc-800/10 transition-colors border-b border-zinc-800 cursor-grab active:cursor-grabbing"
                  >
                    {runIdx === 0 && (
                      <td
                        rowSpan={totalRowsForMuestra}
                        className="p-2.5 border-r border-zinc-800 align-middle"
                      >
                        <div className="flex flex-col gap-2">
                          {/* Fila 1: acciones primarias */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 rounded-full font-mono text-xs font-semibold whitespace-nowrap">
                              {m.correlativo}
                            </span>
                            <Tooltip label="Agregar nueva corrida de análisis" withArrow position="top">
                              <button
                                type="button"
                                onClick={() => onAgregarAnalisis(m.id)}
                                disabled={agregandoActual || asociandoMuestraActual}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {agregandoActual ? <Loader size={9} color="currentColor" /> : <IconPlus size={10} />}
                                {agregandoActual ? "..." : "Análisis"}
                              </button>
                            </Tooltip>
                            {(() => {
                              const val = puedeAsociar ? puedeAsociar(m) : { ok: true };
                              const deshabilitado = !val.ok || asociandoMuestraActual || agregandoActual;
                              return (
                                <Tooltip
                                  label={val.ok ? "Asociar esta muestra a un lote" : (val.motivo ?? "No se puede asociar")}
                                  withArrow
                                  position="top"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirAsociar(m)}
                                    disabled={deshabilitado}
                                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {asociandoMuestraActual ? <Loader size={9} color="currentColor" /> : <IconLink size={10} />}
                                    Asociar
                                  </button>
                                </Tooltip>
                              );
                            })()}
                          </div>
                          {/* Fila 2: metadatos compactos (proveedor + fecha + empleado) */}
                          <div className="flex flex-col gap-0.5 text-[10px] leading-tight">
                            <span className="text-zinc-300 font-medium truncate max-w-55">
                              {m.proveedor_razon_social ?? `Guest #${m.id_proveedor_minero}`}
                            </span>
                            <span className="text-[9px] text-zinc-600">
                              {new Date(m.created_at).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {m.empleado_registro_nombre && (
                                <span className="text-zinc-600"> · {m.empleado_registro_nombre}</span>
                              )}
                            </span>
                            {(() => {
                              const val = puedeAsociar ? puedeAsociar(m) : { ok: true };
                              if (val.ok) return null;
                                return (
                                  <span className="text-[9px] text-amber-400 font-medium leading-tight mt-0.5">
                                    {val.motivo}
                                  </span>
                                );
                              })()}
                          </div>
                        </div>
                      </td>
                    )}

                    {grupos.map((g: GrupoAnalisisResponse) => (
                      <React.Fragment key={`${m.id}-${uuidFila}-${g.id}`}>
                        {/* Columna "Tipo Origen" — se renderiza por corrida (no rowspan) cuando el grupo lo requiere */}
                        {g.indicar_origen && (
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
                                  void handleUpdateOrigen(m.id, uuidFila, next);
                                }}
                                allowDeselect={false}
                                style={{ width: 36 }}
                                classNames={{
                                  input: "bg-zinc-950 border-zinc-800 text-white text-[11px] h-7 px-1 focus:border-zinc-500 text-center",
                                  option: "text-[11px]",
                                }}
                                comboboxProps={{ withinPortal: true }}
                              />
{totalRowsForMuestra > 1 && (
                                    <Tooltip label="Eliminar esta corrida de análisis" withArrow position="top">
                                      <button
                                        type="button"
                                        onClick={() => handleEliminarFilaConfirm(m.id, uuidFila)}
                                        className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-all"
                                      >
                                        <IconTrashX size={12} />
                                      </button>
                                    </Tooltip>
                                  )}
                            </div>
                          </td>
                        )}
                        {g.analitos.map((a: GrupoAnalisisDetalleResponse) => {
                          const runRecords = m.analisis.filter(
                            (item) => item.id_grupo_analisis_detalle === a.detalle_id && item.uuid_fila === uuidFila && item.tipo_origen === currentTipoOrigen,
                          );
                          const mainRecord = runRecords[0];
                          const cellSaving = !!isGuardandoCelda?.(
                            buildCellKey({
                              id_muestra_externa: m.id,
                              id_grupo_analisis_detalle: a.detalle_id,
                              uuid_fila: uuidFila,
                              tipo_origen: currentTipoOrigen,
                              id: mainRecord?.id ?? null,
                            }),
                          );

                          const recordsConfirmados = m.analisis.filter(
                            (it) => it.id_grupo_analisis_detalle === a.detalle_id && it.esta_confirmada,
                          );
                          const promedioGlobal =
                            a.es_desplegable && recordsConfirmados.length > 0
                              ? recordsConfirmados.reduce((acc, cur) => acc + cur.ley, 0) / recordsConfirmados.length
                              : null;

                          return (
                            <React.Fragment key={`${m.id}-${uuidFila}-${a.detalle_id}`}>
                              <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                                <CellInput
                                  key={mainRecord?.id || "new"}
                                  initialValue={mainRecord?.ley || 0}
                                  initialChecked={mainRecord ? mainRecord.esta_confirmada : false}
                                  saving={cellSaving}
                                  logCambios={mainRecord?.log_cambios}
                                  onViewLog={() => handleOpenLogModal(a.nombre, mainRecord?.log_cambios)}
                                  onSave={(val, checked) =>
                                    onGuardarValor({
                                      id: mainRecord?.id || null,
                                      id_muestra_externa: m.id,
                                      id_grupo_analisis_detalle: a.detalle_id,
                                      tipo_origen: currentTipoOrigen,
                                      uuid_fila: uuidFila,
                                      ley: val,
                                      esta_confirmada: checked,
                                    })
                                  }
                                />
                              </td>
                              {a.es_desplegable && runIdx === 0 && (
                                <td
                                  rowSpan={totalRowsForMuestra}
                                  className="p-1.5 border-r border-zinc-800 text-center font-bold text-[11px] text-indigo-400 bg-zinc-900/20 align-middle"
                                >
                                  {promedioGlobal !== null ? promedioGlobal.toFixed(3) : "0.000"}
                                </td>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <ModalEstandar
        opened={asociarOpen}
        close={() => setAsociarOpen(false)}
        title="Asociar muestra externa a lote"
        size="sm"
      >
        <div className="space-y-4">
          {muestraSeleccionada && (
            <div className="text-xs text-zinc-400">
              Vas a asociar <span className="font-mono text-indigo-300 font-semibold">{muestraSeleccionada.correlativo}</span> a un lote en estado Pendiente o En Proceso. Los análisis de la muestra se migrarán al lote y la muestra desaparecerá de esta tabla.
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <Select
                placeholder="Seleccione un lote..."
                data={opcionesLotes}
                value={loteDestinoId}
                onChange={setLoteDestinoId}
                searchable
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all rounded-xl h-[40px] font-semibold text-sm",
                  option: "hover:bg-zinc-800 focus:bg-zinc-800",
                }}
              />
            </div>
            <Button
              onClick={handleConfirmarAsociacion}
              disabled={!loteDestinoId || (muestraSeleccionada ? isAsociando?.(muestraSeleccionada.id) : false)}
              loading={muestraSeleccionada ? isAsociando?.(muestraSeleccionada.id) : false}
              leftSection={<IconLink className="w-4 h-4 text-emerald-400" />}
              radius="lg"
              size="xs"
              className="bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-700/60 text-emerald-400 font-semibold h-10 px-5 rounded-xl transition-all disabled:opacity-50"
            >
              Asociar
            </Button>
          </div>
        </div>
      </ModalEstandar>

      <ModalEstandar
        opened={modalLogOpened}
        close={() => setModalLogOpened(false)}
        title={
          <div className="flex items-center gap-1.5">
            <IconHistory size={20} className="text-amber-400" />
            <span>Historial de cambios ({selectedLogInfo?.analitoNombre || "Análisis"})</span>
          </div>
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
    </>
  );
};