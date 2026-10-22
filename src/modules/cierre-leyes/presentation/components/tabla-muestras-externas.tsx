import React, { useState } from "react";
import { ActionIcon, Select, Tooltip, Loader } from "@mantine/core";
import {
  IconPlus,
  IconTrashX,
  IconLink,
  IconFileDescription,
  IconLock,
  IconPrinter,
  IconGripVertical,
  IconX,
  IconChecklist,
  IconHistory,
} from "@tabler/icons-react";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type {
  MuestraExternaResponse,
  LoteCierreResponse,
  IArchivoDoc,
} from "../../service/cierre-leyes.responses";
import { CellInput } from "./cell-input";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import { ModalDocumentosAnalisis } from "./modal-documentos-analisis";
import type { GuardarValoresAnalisisPayload } from "../../service/cierre-leyes.service";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import { useNotify } from "../../../../hooks/useNotify";

interface TablaMuestrasExternasProps {
  muestras: MuestraExternaResponse[];
  lotesDisponibles: LoteCierreResponse[];
  onGuardarValoresAnalisis: (idAnalisis: number, payload: GuardarValoresAnalisisPayload) => Promise<boolean>;
  onAbrirModalAgregarAnalisis: (idGrupo: number, nombre: string) => void;
  onEliminarAnalisis: (idAnalisis: number) => Promise<boolean>;
  onAsociarAGrupo: (idMuestraExterna: number, idGrupo: number) => Promise<boolean>;
  onAsociarMuestrasMultiples?: (idsMuestraExterna: number[], idGrupo: number) => Promise<boolean>;
  onSubirDocumentos: (idAnalisis: number, archivos: File[]) => Promise<IArchivoDoc[] | boolean | null>;
  isAsociando?: (idMuestra: number) => boolean;
  onImprimirMuestra?: (muestra: MuestraExternaResponse) => void;
  onImprimirMuestras?: (muestras: MuestraExternaResponse[]) => void;
}

export const TablaMuestrasExternas = ({
  muestras,
  lotesDisponibles,
  onGuardarValoresAnalisis,
  onAbrirModalAgregarAnalisis,
  onEliminarAnalisis,
  onAsociarAGrupo,
  onAsociarMuestrasMultiples,
  onSubirDocumentos,
  isAsociando,
  onImprimirMuestras,
}: TablaMuestrasExternasProps) => {
  const { notifyWarning } = useNotify();

  // Selección de muestras (restringida al mismo proveedor)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal asociar (soporta 1 o varias muestras)
  const [modalAsociarOpen, setModalAsociarOpen] = useState(false);
  const [muestrasParaAsociar, setMuestrasParaAsociar] = useState<MuestraExternaResponse[]>([]);
  const [idGrupoDestino, setIdGrupoDestino] = useState<string | null>(null);
  const [guardandoAsociar, setGuardandoAsociar] = useState(false);

  // Modal documentos
  const [modalDocsId, setModalDocsId] = useState<number | null>(null);
  const [modalDocsList, setModalDocsList] = useState<IArchivoDoc[]>([]);

  // Modal auditoría
  const [modalLogOpened, setModalLogOpened] = useState(false);
  const [selectedLogInfo, setSelectedLogInfo] = useState<{
    titulo: string;
    cambios: RES_CambiosLog[] | null | undefined;
  } | null>(null);

  const handleOpenLogModal = (titulo: string, cambios?: RES_CambiosLog[] | null) => {
    setSelectedLogInfo({ titulo, cambios });
    setModalLogOpened(true);
  };

  // Muestras seleccionadas actuales
  const muestrasSeleccionadas = muestras.filter((m) => selectedIds.includes(m.id_muestra_externa));
  const proveedorSeleccionadoNombre = muestrasSeleccionadas[0]?.proveedor_nombre;
  const proveedorSeleccionadoId = muestrasSeleccionadas[0]?.id_proveedor;

  const handleToggleSelect = (m: MuestraExternaResponse) => {
    if (selectedIds.includes(m.id_muestra_externa)) {
      setSelectedIds((prev) => prev.filter((id) => id !== m.id_muestra_externa));
      return;
    }

    if (selectedIds.length > 0) {
      const primer = muestras.find((x) => selectedIds.includes(x.id_muestra_externa));
      if (primer && primer.id_proveedor !== m.id_proveedor) {
        notifyWarning(
          `Solo puedes seleccionar muestras del mismo proveedor ("${
            primer.proveedor_nombre || "Sin Proveedor"
          }"). Limpia la selección previa para cambiar de proveedor.`
        );
        return;
      }
    }

    setSelectedIds((prev) => [...prev, m.id_muestra_externa]);
  };

  const handleAbrirAsociar = () => {
    if (muestrasSeleccionadas.length === 0) return;
    setMuestrasParaAsociar(muestrasSeleccionadas);
    setIdGrupoDestino(null);
    setModalAsociarOpen(true);
  };

  const handleConfirmarAsociar = async () => {
    if (muestrasParaAsociar.length === 0 || !idGrupoDestino || guardandoAsociar) return;
    setGuardandoAsociar(true);
    try {
      const destinoNum = Number(idGrupoDestino);

      let ok = false;
      if (muestrasParaAsociar.length === 1) {
        ok = await onAsociarAGrupo(muestrasParaAsociar[0].id_muestra_externa, destinoNum);
      } else if (onAsociarMuestrasMultiples) {
        ok = await onAsociarMuestrasMultiples(
          muestrasParaAsociar.map((m) => m.id_muestra_externa),
          destinoNum
        );
      } else {
        for (const m of muestrasParaAsociar) {
          await onAsociarAGrupo(m.id_muestra_externa, destinoNum);
        }
        ok = true;
      }

      if (ok) {
        setSelectedIds((prev) =>
          prev.filter((id) => !muestrasParaAsociar.some((m) => m.id_muestra_externa === id))
        );
        setModalAsociarOpen(false);
        setMuestrasParaAsociar([]);
      }
    } finally {
      setGuardandoAsociar(false);
    }
  };

  // Drag & drop: crear preview visual flotante (card con código de cliente o mini lista)
  const createDragGhost = (items: MuestraExternaResponse[]) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.zIndex = "999999";
    container.style.pointerEvents = "none";
    container.style.background = "linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.98))";
    container.style.border = "1.5px solid rgba(99, 102, 241, 0.85)";
    container.style.borderRadius = "12px";
    container.style.padding = "8px 12px";
    container.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.7), 0 0 18px rgba(99, 102, 241, 0.5)";
    container.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style.color = "#f8fafc";
    container.style.minWidth = "180px";
    container.style.maxWidth = "260px";

    if (items.length === 1) {
      const it = items[0];
      const codigo = it.codigo_cliente || it.correlativo || `Muestra #${it.id_muestra_externa}`;
      const proveedor = it.proveedor_nombre || "Sin Proveedor";
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(99, 102, 241, 0.35); border: 1px solid rgba(129, 140, 248, 0.6); display: flex; align-items: center; justify-content: center; font-size: 13px;">
            🔬
          </div>
          <div style="overflow: hidden;">
            <div style="font-weight: 800; font-size: 12px; color: #c7d2fe; letter-spacing: 0.3px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${codigo}</div>
            <div style="font-size: 10px; color: #94a3b8; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${proveedor}</div>
          </div>
        </div>
      `;
    } else {
      const count = items.length;
      const proveedor = items[0]?.proveedor_nombre || "Sin Proveedor";
      const itemsHtml = items
        .slice(0, 5)
        .map(
          (it) => `
          <span style="display: inline-block; background: rgba(99, 102, 241, 0.25); border: 1px solid rgba(129, 140, 248, 0.5); border-radius: 5px; padding: 1px 6px; font-size: 10px; font-weight: 700; color: #c7d2fe; margin-right: 4px; margin-bottom: 3px;">
            ${it.codigo_cliente || it.correlativo || it.nombre}
          </span>
        `
        )
        .join("");
      const moreHtml =
        count > 5
          ? `<span style="font-size: 10px; color: #94a3b8; font-weight: 600; padding: 1px 4px;">+${count - 5} más</span>`
          : "";

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(99, 102, 241, 0.3); padding-bottom: 3px;">
            <span style="font-size: 11px; font-weight: 800; color: #e0e7ff;">${count} Muestras</span>
            <span style="font-size: 9px; background: #4f46e5; color: white; padding: 1px 6px; border-radius: 9999px; font-weight: 700;">Arrastrando</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${proveedor}</div>
          <div style="display: flex; flex-wrap: wrap; margin-top: 2px;">
            ${itemsHtml}
            ${moreHtml}
          </div>
        </div>
      `;
    }

    document.body.appendChild(container);
    return container;
  };

  // Drag & drop: preparar datos y visual ghost
  const handleDragStart = (e: React.DragEvent, m: MuestraExternaResponse) => {
    const isSelected = selectedIds.includes(m.id_muestra_externa);
    const muestrasToDrag =
      isSelected && selectedIds.length > 0
        ? muestras.filter((x) => selectedIds.includes(x.id_muestra_externa))
        : [m];

    const ghost = createDragGhost(muestrasToDrag);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => {
      ghost.remove();
    }, 0);

    const payload = {
      ids: muestrasToDrag.map((x) => x.id_muestra_externa),
      idProveedor: m.id_proveedor,
      proveedorNombre: m.proveedor_nombre,
      muestras: muestrasToDrag.map((x) => ({
        id: x.id_muestra_externa,
        codigo: x.codigo_cliente || x.correlativo || x.nombre,
        proveedor: x.proveedor_nombre,
      })),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", JSON.stringify(payload.ids));
    e.dataTransfer.effectAllowed = "copyMove";
  };

  // Opciones de grupos disponibles para asociar (SOLO de lotes con el MISMO proveedor que la muestra)
  const proveedorReferencia = muestrasParaAsociar[0]?.id_proveedor ?? proveedorSeleccionadoId;
  const lotesMismoProveedor = proveedorReferencia
    ? lotesDisponibles.filter((l) => l.id_proveedor_minero === proveedorReferencia)
    : lotesDisponibles;

  const opcionesGrupos = lotesMismoProveedor.flatMap((l) => {
    const grupos =
      l.grupos_analisis && l.grupos_analisis.length > 0
        ? l.grupos_analisis
        : l.grupo_analisis
        ? [l.grupo_analisis]
        : [];

    return grupos.map((g) => ({
      value: String(g.id),
      label: `${l.correlativo} — ${g.nombre}`,
      idProveedor: l.id_proveedor_minero,
      proveedorNombre: l.proveedor_razon_social,
    }));
  });

  return (
    <>
      {/* Barra de Selección (Suple asociación individual y grupal + reportes) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-indigo-950/50 border border-indigo-700/60 shadow-lg shadow-indigo-950/40 mb-3 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-indigo-600/30 text-indigo-300">
              <IconChecklist size={16} />
            </span>
            <div>
              <span className="text-xs font-bold text-indigo-100">
                {selectedIds.length} {selectedIds.length === 1 ? "muestra seleccionada" : "muestras seleccionadas"}
              </span>
              {proveedorSeleccionadoNombre && (
                <span className="text-[11px] text-zinc-400 ml-2">
                  • Proveedor: <strong className="text-zinc-200">{proveedorSeleccionadoNombre}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onImprimirMuestras && (
              <button
                type="button"
                onClick={() => onImprimirMuestras(muestrasSeleccionadas)}
                className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-700/60 bg-cyan-950/60 hover:bg-cyan-900/60 transition-all cursor-pointer shadow-sm"
              >
                <IconPrinter size={13} /> Imprimir Reporte ({selectedIds.length})
              </button>
            )}

            <button
              type="button"
              disabled={muestrasSeleccionadas.some((m) => isAsociando?.(m.id_muestra_externa))}
              onClick={handleAbrirAsociar}
              className="text-xs font-semibold text-white flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-500 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-indigo-900/40"
            >
              <IconLink size={13} /> Asociar a Grupo {selectedIds.length > 1 ? `(${selectedIds.length})` : ""}
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-all cursor-pointer"
              title="Limpiar selección"
            >
              <IconX size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              <th className="p-2.5 border-r border-zinc-800 text-center min-w-44">Muestra</th>
              <th className="p-2 border-r border-zinc-800 text-center w-28">Origen</th>
              <th className="p-2 border-r border-zinc-800 text-center min-w-28">NWAU (Oro)</th>
              <th className="p-2 border-r border-zinc-800 text-center min-w-28">NWAG (Plata)</th>
              <th className="p-2 border-r border-zinc-800 text-center min-w-24">Humedad</th>
              <th className="p-2 border-r border-zinc-800 text-center min-w-24">Recuperación</th>
              <th className="p-2 text-center min-w-24">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-xs">
            {muestras.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-zinc-500 text-xs">
                  No hay muestras externas registradas.
                </td>
              </tr>
            ) : (
              muestras.map((muestra) => {
                const analisisList = muestra.analisis ?? [];
                const numAnalisis = analisisList.length > 0 ? analisisList.length : 1;
                const isSelected = selectedIds.includes(muestra.id_muestra_externa);

                return (
                  <React.Fragment key={muestra.id}>
                    {analisisList.length === 0 ? (
                      <tr
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, muestra)}
                        className={`transition-colors ${
                          isSelected ? "bg-indigo-950/30" : "hover:bg-zinc-800/20"
                        }`}
                      >
                        <td className="p-2.5 border-r border-zinc-800 text-center align-middle">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Checkbox, Nombre, Drag Handle */}
                            <div className="flex items-center gap-1.5 justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(muestra)}
                                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                                title="Seleccionar para asociar o imprimir"
                              />
                              <span className="font-bold text-zinc-200 text-xs">
                                {muestra.codigo_cliente || muestra.nombre}
                              </span>
                              <Tooltip label="Arrastra al grupo de un lote para asociar" withArrow>
                                <span className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-indigo-400">
                                  <IconGripVertical size={13} />
                                </span>
                              </Tooltip>
                            </div>

                            {/* Proveedor */}
                            {muestra.proveedor_nombre && (
                              <span className="text-[10px] text-zinc-400 font-medium truncate max-w-44 px-1.5 py-0.2 rounded bg-zinc-800/60 border border-zinc-700/50">
                                {muestra.proveedor_nombre}
                              </span>
                            )}

                            {/* Botón Añadir Análisis */}
                            <button
                              type="button"
                              onClick={() => onAbrirModalAgregarAnalisis(muestra.id, muestra.nombre)}
                              className="mt-0.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-800/60 bg-cyan-950/40 hover:bg-cyan-900/40 transition-all cursor-pointer"
                            >
                              <IconPlus size={11} /> Añadir Análisis
                            </button>
                          </div>
                        </td>
                        <td colSpan={6} className="p-4 border-r border-zinc-800 text-center text-zinc-500 text-xs">
                          Sin ensayos registrados en esta muestra.
                        </td>
                      </tr>
                    ) : (
                      analisisList.map((analisis, idx) => {
                        const tieneDocs = analisis.documentos && analisis.documentos.length > 0;

                        return (
                          <tr
                            key={analisis.id}
                            draggable={idx === 0}
                            onDragStart={(e) => idx === 0 && handleDragStart(e, muestra)}
                            className={`transition-colors ${
                              isSelected ? "bg-indigo-950/30" : "hover:bg-zinc-800/20"
                            }`}
                          >
                            {/* COLUMNA MUESTRA (Limpia: Checkbox + Nombre + Historial + Proveedor + Añadir Análisis) */}
                            {idx === 0 && (
                              <td rowSpan={numAnalisis} className="p-2.5 border-r border-zinc-800 text-center align-middle">
                                <div className="flex flex-col items-center gap-1.5">
                                  {/* Checkbox, Nombre, Historial, Drag Handle */}
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelect(muestra)}
                                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                                      title="Seleccionar para asociar o imprimir"
                                    />
                                    <span className="font-bold text-zinc-200 text-xs">
                                      {muestra.codigo_cliente || muestra.nombre}
                                    </span>
                                    {analisisList.some((a) => a.log_cambios && a.log_cambios.length > 0) && (
                                      <Tooltip label="Ver historial de cambios de la muestra" withArrow>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenLogModal(
                                              `Historial — Muestra ${muestra.codigo_cliente || muestra.nombre}`,
                                              analisisList.flatMap((a) => a.log_cambios || [])
                                            )
                                          }
                                          className="text-amber-400 hover:text-amber-300 transition-colors p-0.5 cursor-pointer flex items-center"
                                          title="Historial de cambios"
                                        >
                                          <IconHistory size={13} />
                                        </button>
                                      </Tooltip>
                                    )}
                                    <Tooltip label="Arrastra al grupo de un lote para asociar" withArrow>
                                      <span className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-indigo-400">
                                        <IconGripVertical size={13} />
                                      </span>
                                    </Tooltip>
                                  </div>

                                  {/* Proveedor */}
                                  {muestra.proveedor_nombre && (
                                    <span className="text-[10px] text-zinc-400 font-medium truncate max-w-44 px-1.5 py-0.2 rounded bg-zinc-800/60 border border-zinc-700/50">
                                      {muestra.proveedor_nombre}
                                    </span>
                                  )}

                                  {/* Botón Añadir Análisis */}
                                  <button
                                    type="button"
                                    onClick={() => onAbrirModalAgregarAnalisis(muestra.id, muestra.nombre)}
                                    className="mt-0.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-800/60 bg-cyan-950/40 hover:bg-cyan-900/40 transition-all cursor-pointer"
                                  >
                                    <IconPlus size={11} /> Añadir Análisis
                                  </button>
                                </div>
                              </td>
                            )}

                            {/* ORIGEN MODIFICABLE */}
                            <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <select
                                  value={analisis.tipo_origen ?? TipoOrigen.Externo}
                                  onChange={(e) => {
                                    const nuevoTipo = e.target.value as TipoOrigen;
                                    onGuardarValoresAnalisis(analisis.id, { tipo_origen: nuevoTipo });
                                  }}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border focus:outline-none transition-all cursor-pointer ${
                                    analisis.tipo_origen === TipoOrigen.Externo
                                      ? "bg-amber-950/60 border-amber-600/60 text-amber-300"
                                      : "bg-indigo-950/60 border-indigo-600/60 text-indigo-300"
                                  }`}
                                  title="Cambiar Tipo de Origen"
                                >
                                  <option value={TipoOrigen.Interno} className="bg-zinc-900 text-zinc-200">Interno</option>
                                  <option value={TipoOrigen.Externo} className="bg-zinc-900 text-zinc-200">Externo</option>
                                </select>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => onEliminarAnalisis(analisis.id)}
                                  title="Eliminar fila de análisis"
                                >
                                  <IconTrashX size={12} />
                                </ActionIcon>
                                {analisis.log_cambios && analisis.log_cambios.length > 0 && (
                                  <Tooltip label="Ver historial de cambios del análisis" withArrow>
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="yellow"
                                      onClick={() =>
                                        handleOpenLogModal(
                                          `Historial de Cambios — Análisis #${analisis.numero_ensayo}`,
                                          analisis.log_cambios
                                        )
                                      }
                                      title="Historial de cambios"
                                    >
                                      <IconHistory size={12} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </div>
                            </td>

                            {/* ORO */}
                            <td className="p-1 border-r border-zinc-800 text-center align-middle">
                              <CellInput
                                initialValue={analisis.ley_oro}
                                initialChecked={analisis.ley_oro_confirmada}
                                disabled={!tieneDocs}
                                hideCheckbox
                                onSave={(val) => {
                                  onGuardarValoresAnalisis(analisis.id, { ley_oro: val });
                                }}
                              />
                            </td>

                            {/* PLATA */}
                            <td className="p-1 border-r border-zinc-800 text-center align-middle">
                              <CellInput
                                initialValue={analisis.ley_plata}
                                initialChecked={analisis.ley_plata_confirmada}
                                disabled={!tieneDocs}
                                hideCheckbox
                                onSave={(val) => {
                                  onGuardarValoresAnalisis(analisis.id, { ley_plata: val });
                                }}
                              />
                            </td>

                            {/* HUMEDAD (un solo input por muestra) */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-1 border-r border-zinc-800 text-center align-middle bg-zinc-950/20"
                              >
                                <CellInput
                                  initialValue={
                                    analisisList.find((a) => a.ley_humedad > 0)?.ley_humedad ??
                                    analisisList[0]?.ley_humedad ??
                                    0
                                  }
                                  initialChecked={false}
                                  disabled={!analisisList.some((a) => a.documentos && a.documentos.length > 0)}
                                  hideCheckbox
                                  onSave={(val) => {
                                    analisisList.forEach((a) => {
                                      onGuardarValoresAnalisis(a.id, { ley_humedad: val });
                                    });
                                  }}
                                />
                              </td>
                            )}

                            {/* RECUPERACION (un solo input por muestra) */}
                            {idx === 0 && (
                              <td
                                rowSpan={numAnalisis}
                                className="p-1 border-r border-zinc-800 text-center align-middle bg-zinc-950/20"
                              >
                                <CellInput
                                  initialValue={
                                    analisisList.find((a) => a.ley_recuperacion > 0)?.ley_recuperacion ??
                                    analisisList[0]?.ley_recuperacion ??
                                    0
                                  }
                                  initialChecked={false}
                                  disabled={!analisisList.some((a) => a.documentos && a.documentos.length > 0)}
                                  hideCheckbox
                                  onSave={(val) => {
                                    analisisList.forEach((a) => {
                                      onGuardarValoresAnalisis(a.id, { ley_recuperacion: val });
                                    });
                                  }}
                                />
                              </td>
                            )}

                            {/* SUSTENTO */}
                            <td className="p-1.5 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalDocsId(analisis.id);
                                  setModalDocsList(analisis.documentos);
                                }}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 mx-auto transition-all ${
                                  tieneDocs
                                    ? "bg-indigo-950/50 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/50"
                                    : "bg-rose-950/30 border-rose-800/60 text-rose-400 hover:bg-rose-900/40"
                                }`}
                              >
                                {tieneDocs ? <IconFileDescription size={13} /> : <IconLock size={13} />}
                                <span>{analisis.documentos.length}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Asociar a Grupo */}
      <ModalEstandar
        opened={modalAsociarOpen}
        close={() => !guardandoAsociar && setModalAsociarOpen(false)}
        title={
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <IconLink size={17} />
            <span>Asociar Grupo</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-3.5">
          {/* Card de vista previa de muestra(s) en una sola fila compacta */}
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-2">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] shrink-0">
              {muestrasParaAsociar.length === 1 ? "Muestra:" : `${muestrasParaAsociar.length} Muestras:`}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto justify-end">
              {muestrasParaAsociar.map((m) => (
                <div
                  key={m.id_muestra_externa}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-xs font-semibold text-indigo-200"
                >
                  <span className="text-white">{m.codigo_cliente || m.correlativo || m.nombre}</span>
                  {m.proveedor_nombre && (
                    <span className="text-[10px] text-zinc-400">({m.proveedor_nombre})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {opcionesGrupos.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-xs text-amber-300 flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <div>
                No se encontraron lotes con grupos registrados para el proveedor{" "}
                <strong>"{muestrasParaAsociar[0]?.proveedor_nombre || "Sin Proveedor"}"</strong>.
                Crea primero un lote y grupo para este proveedor para poder asociar estas muestras.
              </div>
            </div>
          ) : (
            <Select
              label="Grupo de Análisis Destino"
              placeholder="Selecciona el grupo de destino..."
              data={opcionesGrupos}
              value={idGrupoDestino}
              onChange={setIdGrupoDestino}
              searchable
              required
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs",
              }}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              disabled={guardandoAsociar}
              onClick={() => setModalAsociarOpen(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={
                !idGrupoDestino ||
                opcionesGrupos.length === 0 ||
                guardandoAsociar ||
                muestrasParaAsociar.some((m) => isAsociando?.(m.id_muestra_externa))
              }
              onClick={handleConfirmarAsociar}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-900/40"
            >
              {guardandoAsociar ? (
                <>
                  <Loader size={13} color="white" />
                  <span>Asociando...</span>
                </>
              ) : (
                <>
                  <IconLink size={14} />
                  <span>Confirmar Asociación {muestrasParaAsociar.length > 1 ? `(${muestrasParaAsociar.length})` : ""}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal Historial */}
      <ModalEstandar
        opened={modalLogOpened}
        close={() => setModalLogOpened(false)}
        title={selectedLogInfo?.titulo ?? "Historial de Cambios"}
        size="lg"
      >
        <CambiosLogViewer cambios={selectedLogInfo?.cambios ?? []} />
      </ModalEstandar>

      {/* Modal Documentos */}
      {modalDocsId !== null && (
        <ModalDocumentosAnalisis
          opened={true}
          onClose={() => setModalDocsId(null)}
          idAnalisis={modalDocsId}
          documentos={
            (() => {
              for (const m of muestras) {
                const an = m.analisis?.find((a) => a.id === modalDocsId);
                if (an) return an.documentos;
              }
              return modalDocsList;
            })()
          }
          onSubirDocumentos={onSubirDocumentos}
        />
      )}
    </>
  );
};