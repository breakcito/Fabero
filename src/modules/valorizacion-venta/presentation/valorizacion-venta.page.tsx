import { useState, useEffect, useMemo } from "react";
import {
  Group,
  Button,
  Select,
  Badge,
  ActionIcon,
  Text,
  Stack,
  Paper,
  Box,
  Loader,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconCheck,
  IconBan,
  IconFileText,
  IconFiles,
  IconHistory,
  IconX,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ValorizacionVentaAuxService } from "../service/valorizacion-venta.service";
import { useValorizacionesVenta } from "../hooks/useValorizacionesVenta";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { ModalFormValorizacionVenta } from "./components/modal-form-valorizacion-venta";
import { ModalAnularValorizacionVenta } from "./components/modal-anular-valorizacion";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import { CambiosLogViewer } from "../../../presentation/utils/cambios-log-viewer";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { EstadoValorizacionVenta } from "../../../shared/enums/valorizacion-venta/estado-valorizacion-venta";
import { formatNumber } from "../../../shared/functions/formatNumber";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { RES_ValorizacionVenta } from "../service/valorizacion-venta.responses";
import type { IArchivo } from "../../../shared/interfaces/archivo";

interface PlantaDisponible {
  id: number;
  ruc: string;
  razon_social: string;
}

const getArchivoObj = (item: unknown): IArchivo => {
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    const nombreOriginal = String(obj.nombre_original || obj.nombre || "archivo");
    const extension = String(obj.extension || nombreOriginal.split(".").pop() || "");
    const pathRelativo = String(obj.path_relativo || obj.path || "");
    let url = String(obj.url || "");
    if (!url && pathRelativo) {
      const backendUrl = import.meta.env.VITE_API_URL || "";
      const baseUrl = backendUrl.replace(/\/api\/?$/, "");
      url = `${baseUrl}/storage/${pathRelativo}`;
    }
    return {
      nombre_original: nombreOriginal,
      extension: extension,
      path_relativo: pathRelativo,
      url: url,
    };
  }

  const pathStr = String(item || "");
  const filename = pathStr.split("/").pop() || pathStr;
  const ext = filename.includes(".") ? filename.split(".").pop() || "" : "";
  const backendUrl = import.meta.env.VITE_API_URL || "";
  const baseUrl = backendUrl.replace(/\/api\/?$/, "");
  return {
    nombre_original: filename,
    extension: ext,
    path_relativo: pathStr,
    url: `${baseUrl}/storage/${pathStr}`,
  };
};

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ValorizacionVentaPage = () => {
  useTitlePage("Valorizaciones de Venta", true);

  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [plantas, setPlantas] = useState<PlantaDisponible[]>([]);

  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const [modalEvidenciasInfo, setModalEvidenciasInfo] = useState<{
    title: string;
    files: (IArchivo | string)[];
  } | null>(null);

  const [modalHistorialOpened, setModalHistorialOpened] = useState(false);
  const [valorizacionHistorial, setValorizacionHistorial] =
    useState<RES_ValorizacionVenta | null>(null);

  const {
    idPlantaFiltro,
    setIdPlantaFiltro,
    loading,
    valorizaciones,
    modalFormOpened,
    setModalFormOpened,
    valorizacionEditar,
    modalAnularOpened,
    setModalAnularOpened,
    valorizacionAnular,
    togglingIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleAprobar,
    handleAbrirAnular,
    handleConfirmarAnular,
  } = useValorizacionesVenta();

  useEffect(() => {
    const cargar = async () => {
      setLoadingPlantas(true);
      try {
        const res = await ValorizacionVentaAuxService.getPlantasConDistribuciones();
        if (res.success && res.data) {
          setPlantas(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPlantas(false);
      }
    };
    cargar();
  }, []);

  const hasActiveFilters =
    !!idPlantaFiltro ||
    fechaInicio !== defaultFechaInicio() ||
    fechaFin !== defaultFechaFin() ||
    (filtroEstado && filtroEstado !== "Todos");

  const clearFilters = () => {
    setIdPlantaFiltro(null);
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setFiltroEstado("Todos");
  };

  // Combina el log_cambios de la CABECERA + el de cada DETALLE para mostrarlos
  // ordenados por fecha desc en el CambiosLogViewer.
  const historialCambiosCombinados = useMemo(() => {
    if (!valorizacionHistorial) return [];

    type LogCrudo = Record<string, unknown>;
    type LogProcesado = LogCrudo & { motivo: string };

    // Cabecera: aprobación / anulación / edición de campos globales.
    const logsCabecera: LogProcesado[] = (valorizacionHistorial.log_cambios || [])
      .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
      .map((log) => ({
        ...log,
        motivo: `Valorización ${valorizacionHistorial.codigo || `#${valorizacionHistorial.id}`} — ${String(log.accion || "Cambio en cabecera")}`,
      }));

    // Detalle: modificaciones de parámetros.
    const logsDetalles: LogProcesado[] = (valorizacionHistorial.detalles || []).flatMap((d) => {
      // Identificador específico: preliminar / código + despacho + lote/blend
      const partes: string[] = [];
      if (d.codigos_cliente || d.codigo_cliente) partes.push(`Cód:${d.codigos_cliente || d.codigo_cliente}`);
      if (d.despacho_correlativo) partes.push(`Despacho:${d.despacho_correlativo}`);
      if (d.lote_correlativo) partes.push(`Lote:${d.lote_correlativo}`);
      if (d.blending_correlativo) partes.push(`Blend:${d.blending_correlativo}`);
      const identificador = partes.length > 0
        ? partes.join(' · ')
        : `Item Despacho #${d.id_despacho_detalle ?? d.id_distribucion_detalle}`;
      const elem = (d.elemento_quimico || "Oro").toUpperCase();
      return (d.log_cambios || [])
        .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
        .map((log) => ({
          ...log,
          motivo: `${identificador} (${elem}) — Modificación de parámetros`,
        }));
    });

    const combinados: LogProcesado[] = [...logsCabecera, ...logsDetalles];

    combinados.sort((a, b) => {
      const timeA = new Date(String(a.fecha_hora || a.update_at || 0)).getTime();
      const timeB = new Date(String(b.fecha_hora || b.update_at || 0)).getTime();
      return timeB - timeA;
    });

    return combinados;
  }, [valorizacionHistorial]);

  const handleVerHistorial = (r: RES_ValorizacionVenta) => {
    setValorizacionHistorial(r);
    setModalHistorialOpened(true);
  };

  const valorizacionesFiltradas = useMemo(() => {
    return valorizaciones.filter((item) => {
      if (filtroEstado !== "Todos" && item.estado !== filtroEstado) {
        return false;
      }
      if (fechaInicio) {
        const itemFecha = item.created_at ? item.created_at.split(" ")[0] : "";
        if (itemFecha < fechaInicio) return false;
      }
      if (fechaFin) {
        const itemFecha = item.created_at ? item.created_at.split(" ")[0] : "";
        if (itemFecha > fechaFin) return false;
      }
      return true;
    });
  }, [valorizaciones, filtroEstado, fechaInicio, fechaFin]);

  const getBadgeEstado = (estado: EstadoValorizacionVenta) => {
    switch (estado) {
      case EstadoValorizacionVenta.Pendiente:
        return (
          <Badge color="amber" variant="light" size="sm">
            Pendiente
          </Badge>
        );
      case EstadoValorizacionVenta.Aprobado:
        return (
          <Badge color="emerald" variant="filled" size="sm">
            Aprobado
          </Badge>
        );
      case EstadoValorizacionVenta.Anulado:
        return (
          <Badge color="red" variant="light" size="sm">
            Anulado
          </Badge>
        );
      default:
        return <Badge size="sm">{estado}</Badge>;
    }
  };

  const columns = [
    { accessor: "index", title: "#", textAlign: "center" as const, width: 50 },
    {
      accessor: "planta_nombre",
      title: "Planta Destino",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => (
        <Stack gap={2} align="center">
          <Text fw={600} fz="xs">{r.planta_nombre}</Text>
          <Text fz={11} c="dimmed">
            RUC: {r.planta_ruc}
          </Text>
        </Stack>
      ),
    },
    {
      accessor: "codigo",
      title: "Código",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => (
        <Text fz="xs" className="font-mono">{r.codigo || "—"}</Text>
      ),
    },
    {
      accessor: "total_subtotal",
      title: "Total Valorización",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => {
        const totalFinal = r.total_subtotal + (r.monto_penalidad ?? 0) - (r.monto_flete ?? 0);
        return (
          <Text fw={700} c="emerald.4" fz="xs">
            $ {formatNumber(totalFinal, 2)}
          </Text>
        );
      },
    },
    {
      accessor: "created_at",
      title: "Fecha Registro",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => (
        <Text fz="xs">{r.created_at ? r.created_at.split(" ")[0] : "-"}</Text>
      ),
    },
    {
      accessor: "estado",
      title: "Estado",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => getBadgeEstado(r.estado),
    },
    {
      accessor: "acciones",
      title: "Acciones",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionVenta) => {
        const isPendiente = r.estado === EstadoValorizacionVenta.Pendiente;
        const isAnulado = r.estado === EstadoValorizacionVenta.Anulado;
        const isBusy = togglingIds[r.id];

        return (
          <Group gap={6} justify="center">
            {isPendiente && (
              <Tooltip label="Editar Valorización">
                <ActionIcon
                  color="yellow"
                  variant="light"
                  size="sm"
                  onClick={() => handleEditar(r)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {isPendiente && (
              <Tooltip label="Aprobar Valorización">
                <ActionIcon
                  color="teal"
                  variant="filled"
                  size="sm"
                  loading={isBusy}
                  disabled={isBusy}
                  onClick={() => {
                    const totalFmt = (
                      r.total_subtotal + (r.monto_penalidad ?? 0) - (r.monto_flete ?? 0)
                    ).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    mostrarConfirmacion({
                      title: "Aprobar valorización de venta",
                      message: (
                        <div className="space-y-2">
                          <p>
                            Se aprobará la valorización para la planta {" "}
                            <strong className="text-white">{r.planta_nombre}</strong> con un total de {" "}
                            <strong className="text-emerald-400">$ {totalFmt}</strong>.
                          </p>
                        </div>
                      ),
                      confirmLabel: "Sí, aprobar",
                      cancelLabel: "Cancelar",
                      onConfirm: () => handleAprobar(r.id),
                    });
                  }}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {!isAnulado && (
              <Tooltip label="Anular / Eliminar Valorización">
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  loading={isBusy}
                  disabled={isBusy}
                  onClick={() => handleAbrirAnular(r)}
                >
                  <IconBan size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {r.evidencias && r.evidencias.length > 0 && (
              <Tooltip label="Evidencias de Registro">
                <ActionIcon
                  variant="light"
                  color="indigo"
                  size="sm"
                  onClick={() =>
                    setModalEvidenciasInfo({
                      title: r.codigo
                        ? `Evidencias de Registro (${r.codigo})`
                        : `Evidencias de Registro (VV-${r.id})`,
                      files: r.evidencias || [],
                    })
                  }
                >
                  <IconFiles size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label="Historial de Cambios">
              <ActionIcon
                color="blue"
                variant="light"
                size="sm"
                onClick={() => handleVerHistorial(r)}
              >
                <IconHistory size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  const renderRowExpansion = ({ record }: { record: RES_ValorizacionVenta }) => {
    const detallesList = record.detalles || [];

    return (
      <Box p="md" bg="#18181b">
        <Text fw={700} fz="xs" c="amber.4" mb="xs" className="flex items-center gap-1.5">
          <IconFileText size={15} /> Items de Despacho ({detallesList.length})
        </Text>

        {detallesList.length === 0 ? (
          <Box p="md" bg="#0f0f12" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5" fs="italic">
              Sin items de despacho valorizados
            </Text>
          </Box>
        ) : (
          <Stack gap="xs" className="max-h-95 overflow-y-auto pr-1">
            {detallesList.map((d, idx) => {
              const esOro = d.elemento_quimico === "Oro";
              const accentBorder = esOro
                ? "border-l-yellow-500/70"
                : "border-l-slate-400/70";
              return (
                <Paper
                  key={idx}
                  p="xs"
                  radius="md"
                  bg="#18181b"
                  className={`border border-zinc-800 border-l-2 ${accentBorder} hover:border-indigo-500/60 transition-all duration-200`}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" className="min-w-0">
                      <Badge
                        color={esOro ? "yellow" : "gray"}
                        variant="filled"
                        size="xs"
                        fw={700}
                      >
                        {d.elemento_quimico}
                      </Badge>
                      <Text fw={700} fz="xs" c="white" className="font-mono truncate">
                        Despacho: {d.despacho_correlativo || "-"}
                      </Text>
                      {d.lote_correlativo && (
                        <Badge variant="outline" color="cyan" size="xs">
                          Lote: {d.lote_correlativo}
                        </Badge>
                      )}
                      {d.blending_correlativo && (
                        <Badge variant="outline" color="grape" size="xs">
                          Blend: {d.blending_correlativo}
                        </Badge>
                      )}
                      {(d.codigos_cliente || d.codigo_cliente) && (
                        <Badge variant="outline" color="indigo" size="xs">
                          Cliente: {d.codigos_cliente || d.codigo_cliente}
                        </Badge>
                      )}
                    </Group>

                    <Group gap={6} wrap="nowrap" className="shrink-0">
                      <Text fz={9} c="emerald.4" tt="uppercase" fw={700}>
                        Subtotal
                      </Text>
                      <Text fz="sm" fw={800} c="emerald.3" className="font-mono">
                        $ {formatNumber(d.subtotal, 2)}
                      </Text>
                    </Group>
                  </Group>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2 mt-2">
                    {/* Bloque 1: Masa y Humedad */}
                    <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Masa y Humedad
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center items-center">
                        <div>
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">TMH (t)</div>
                          <div className="text-xs font-mono font-bold text-white mt-0.5">
                            {formatNumber(d.tmh / 1000, 3)}
                          </div>
                        </div>
                        <div className="border-x border-zinc-800/80 px-1">
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">% H2O</div>
                          <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                            {formatNumber(d.ley_humedad, 2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">TMS (t)</div>
                          <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                            {formatNumber(d.tms / 1000, 3)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Ley y Metalurgia */}
                    <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Ley y Metalurgia
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center items-center">
                        <div>
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">Ley Final</div>
                          <div className="text-xs font-mono font-bold text-yellow-400 mt-0.5 truncate">
                            {formatNumber(d.ley, 3)}{" "}
                            <span className="text-[9px] text-zinc-500 font-normal">
                              {esOro ? "g/t" : "oz/t"}
                            </span>
                          </div>
                        </div>
                        <div className="border-x border-zinc-800/80 px-1">
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">REC (%)</div>
                          <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                            {formatNumber(d.recuperacion, 2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 font-semibold uppercase">Factor</div>
                          <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
                            {formatNumber(d.factor, 4)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 3: Condiciones Comerciales */}
                    <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Condiciones Comerciales
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">Inter:</span>
                          <span className="text-xs font-mono font-bold text-white">
                            ${formatNumber(d.inter, 2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">D.Inter:</span>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            ${formatNumber(d.des_inter, 2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">Maquila:</span>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            ${formatNumber(d.maquila, 2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">Consumo:</span>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            ${formatNumber(d.consumo, 2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 4: Precio y Subtotal Lote */}
                    <div className="xl:col-span-3 flex flex-col justify-between gap-1.5">
                      <div className="bg-[#0d0d10] border border-zinc-800/90 rounded-lg px-3 py-1.5 flex items-center justify-between flex-1">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Precio / TN
                        </span>
                        <span className="text-xs font-mono font-extrabold text-white whitespace-nowrap">
                          $ {formatNumber(d.precio_por_tonelada, 2)}
                        </span>
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-lg px-3 py-1.5 flex items-center justify-between flex-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Subtotal Lote
                        </span>
                        <span className="text-sm font-mono font-extrabold text-emerald-300 whitespace-nowrap">
                          $ {formatNumber(d.subtotal, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex flex-wrap items-end gap-3 flex-1 w-full">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />

          <div className="w-full sm:w-60">
            <Select
              label="Planta Destino"
              placeholder={loadingPlantas ? "Cargando..." : "Todas las plantas"}
              disabled={loadingPlantas}
              rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
              data={plantas.map((p) => ({
                value: String(p.id),
                label: p.ruc ? `${p.ruc} - ${p.razon_social}` : p.razon_social,
              }))}
              value={idPlantaFiltro ? String(idPlantaFiltro) : null}
              onChange={(val) => setIdPlantaFiltro(val ? Number(val) : null)}
              clearable
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>

          <div className="w-full sm:w-40">
            <Select
              label="Estado"
              placeholder="Seleccionar estado"
              data={[
                "Todos",
                EstadoValorizacionVenta.Pendiente,
                EstadoValorizacionVenta.Aprobado,
                EstadoValorizacionVenta.Anulado,
              ]}
              value={filtroEstado}
              onChange={(val) => setFiltroEstado(val || "Todos")}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              radius="lg"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={clearFilters}
              className="text-red-400 hover:bg-red-500/10 transition-colors h-9.5"
            >
              Limpiar
            </Button>
          )}

          <RefreshButton
            onClick={() => void cargarValorizaciones()}
            loading={loading}
            label="Recargar valorizaciones"
          />

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={handleNuevo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Valorización
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <DataTableEstandar
          idAccessor="id"
          columns={columns}
          records={valorizacionesFiltradas}
          loading={loading}
          rowExpansion={{
            content: renderRowExpansion,
          }}
        />
      </Stack>

      <ModalFormValorizacionVenta
        opened={modalFormOpened}
        onClose={() => setModalFormOpened(false)}
        valorizacionEditar={valorizacionEditar}
        onSuccess={cargarValorizaciones}
      />

      <ModalEstandar
        opened={modalEvidenciasInfo !== null}
        close={() => setModalEvidenciasInfo(null)}
        title={modalEvidenciasInfo?.title || "Evidencias / Documentos Adjuntos"}
        size="md"
      >
        <Stack gap="xs">
          {modalEvidenciasInfo && modalEvidenciasInfo.files.length > 0 ? (
            modalEvidenciasInfo.files.map((filepath, idx) => (
              <ArchivoCard key={idx} archivo={getArchivoObj(filepath)} />
            ))
          ) : (
            <Text size="xs" c="dimmed">
              No se adjuntaron archivos.
            </Text>
          )}
        </Stack>
      </ModalEstandar>

      {/* Modal Historial de Cambios */}
      <ModalEstandar
        opened={modalHistorialOpened}
        close={() => setModalHistorialOpened(false)}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-amber-400" />
            <Text fw={700} fz="sm" c="white">
              Historial de cambios:{" "}
              {valorizacionHistorial?.codigo ?? `#${valorizacionHistorial?.id ?? "-"}`}
            </Text>
          </Group>
        }
        size="lg"
        rightSection={
          valorizacionHistorial ? (
            <Text size="xs" c="dimmed" fw={600} className="font-mono">
              VALORIZACIÓN #{valorizacionHistorial.id}
            </Text>
          ) : undefined
        }
      >
        {historialCambiosCombinados.length === 0 ? (
          <Box p="md" bg="#0f0f12" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5" fs="italic">
              Esta valorización aún no tiene cambios registrados en sus detalles.
            </Text>
          </Box>
        ) : (
          <CambiosLogViewer
            cambios={historialCambiosCombinados as unknown as RES_CambiosLog[]}
          />
        )}
      </ModalEstandar>

      <ModalAnularValorizacionVenta
        opened={modalAnularOpened}
        close={() => setModalAnularOpened(false)}
        valorizacion={valorizacionAnular}
        onConfirm={handleConfirmarAnular}
        loading={valorizacionAnular ? !!togglingIds[valorizacionAnular.id] : false}
      />
    </div>
  );
};

export const ValorizacionesVentaPage = ValorizacionVentaPage;
export default ValorizacionVentaPage;
