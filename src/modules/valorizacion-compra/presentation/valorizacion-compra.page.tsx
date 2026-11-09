import { useState, useEffect, useMemo } from "react";
import {
  Group,
  Button,
  Select,
  Text,
  Stack,
  Loader,
} from "@mantine/core";
import {
  IconPlus,
  IconHistory,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { usePrint } from "../../../hooks/usePrint";
import { useNotify } from "../../../hooks/useNotify";
import { AuxService } from "../../../service/auxiliar.service";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import { DeclaracionJuradaPdf } from "../../contabilidad/presentation/components/declaracion-jurada-pdf";
import { useValorizacionesCompra } from "../hooks/useValorizacionesCompra";
import { useTicketLiquidacionCompra } from "../hooks/useTicketLiquidacionCompra";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { ModalFormValorizacionCompra } from "./components/modal-form-valorizacion-compra";
import { ModalAnularValorizacion } from "./components/modal-anular-valorizacion";
import { ModalAprobarValorizacion } from "./components/modal-aprobar-valorizacion";
import { PanelDetallePropuesta } from "./components/panel-detalle-propuesta";
import { PanelGruposVersiones } from "./components/panel-grupos-versiones";
import {
  obtenerCorrelativoDisplay,
  type GrupoValorizacionCompra,
} from "./utils/valorizacion-grupo.utils";
import { CambiosLogViewer } from "../../../presentation/utils/cambios-log-viewer";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { LimpiarFiltrosButton } from "../../../presentation/utils/limpiar-filtros-button";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { EstadoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { IArchivo } from "../../../shared/interfaces/archivo";

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
      extension,
      path_relativo: pathRelativo,
      url,
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

const elegirVersionPreferida = (
  versiones: RES_ValorizacionCompra[],
  filtroEstado: string,
): RES_ValorizacionCompra => {
  if (filtroEstado !== "Todos") {
    const coincidente = [...versiones]
      .reverse()
      .find((v) => v.estado === filtroEstado);
    if (coincidente) return coincidente;
  }
  const aprobada = versiones.find(
    (v) => v.estado === EstadoValorizacionCompra.Aprobado,
  );
  if (aprobada) return aprobada;

  const propuestas = versiones.filter(
    (v) => v.estado === EstadoValorizacionCompra.Propuesta,
  );
  if (propuestas.length > 0) return propuestas[propuestas.length - 1];

  return versiones[versiones.length - 1];
};

export const ValorizacionCompraPage = () => {
  useTitlePage("Valorizaciones de Compra", true, true);

  const { printTicketLiquidacion, printTicketDirimencia, printingId } = useTicketLiquidacionCompra();
  const { print, prepare } = usePrint();
  const { notifySuccess, notifyError } = useNotify();

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [solicitandoOcId, setSolicitandoOcId] = useState<number | null>(null);

  // Filtros UI (rango de 7 días atrás -> hoy)
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  // Selección activa de grupo (cabecera) y versión (propuesta)
  const [selectedGrupoUuid, setSelectedGrupoUuid] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const [modalHistorialOpened, setModalHistorialOpened] = useState(false);
  const [valorizacionHistorial, setValorizacionHistorial] =
    useState<RES_ValorizacionCompra | null>(null);
  const [modalEvidenciasInfo, setModalEvidenciasInfo] = useState<{
    title: string;
    files: (IArchivo | string)[];
  } | null>(null);

  const {
    idProveedorFiltro,
    setIdProveedorFiltro,
    loading,
    valorizaciones,
    modalFormOpened,
    setModalFormOpened,
    valorizacionEditar,
    modalAnularOpened,
    setModalAnularOpened,
    valorizacionAnular,
    togglingIds,
    clonandoIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleClonar,
    handleAprobar,
    handleAbrirAnular,
    handleConfirmarAnular,
  } = useValorizacionesCompra();

  const [modalAprobarOpened, setModalAprobarOpened] = useState(false);
  const [valorizacionAprobar, setValorizacionAprobar] =
    useState<RES_ValorizacionCompra | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setLoadingProveedores(true);
      try {
        const res = await AuxService.get_proveedores({ estado: EstadoBase.Activo });
        if (res.success && res.data) {
          setProveedores(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProveedores(false);
      }
    };
    void cargar();
  }, []);

  // Agrupación por uuid_grupo y filtrado manteniendo visibles todas las versiones del grupo
  const gruposFiltrados = useMemo<GrupoValorizacionCompra[]>(() => {
    const mapa = new Map<string, RES_ValorizacionCompra[]>();

    for (const item of valorizaciones) {
      const uuid = item.uuid_grupo || `legacy-${item.id}`;
      const lista = mapa.get(uuid);
      if (lista) {
        lista.push(item);
      } else {
        mapa.set(uuid, [item]);
      }
    }

    const cumpleFiltrosItem = (v: RES_ValorizacionCompra): boolean => {
      if (filtroEstado !== "Todos" && v.estado !== filtroEstado) {
        return false;
      }
      const itemFecha = v.created_at ? v.created_at.split(" ")[0] : "";
      if (fechaInicio && itemFecha < fechaInicio) return false;
      if (fechaFin && itemFecha > fechaFin) return false;
      return true;
    };

    const resultado: GrupoValorizacionCompra[] = [];

    for (const [uuidGrupo, itemsGrupo] of mapa.entries()) {
      if (!itemsGrupo.some(cumpleFiltrosItem)) {
        continue;
      }

      const versionesOrdenadas = [...itemsGrupo].sort((a, b) => {
        const verDiff = (a.numero_version ?? 1) - (b.numero_version ?? 1);
        if (verDiff !== 0) return verDiff;
        return a.id - b.id;
      });

      const versionAprobada =
        versionesOrdenadas.find(
          (v) => v.estado === EstadoValorizacionCompra.Aprobado,
        ) ?? null;

      const propuestasActivas = versionesOrdenadas.filter(
        (v) => v.estado === EstadoValorizacionCompra.Propuesta,
      );

      const versionActiva =
        versionAprobada ??
        (propuestasActivas.length > 0
          ? propuestasActivas[propuestasActivas.length - 1]
          : versionesOrdenadas[versionesOrdenadas.length - 1]);

      let estadoGrupo: EstadoValorizacionCompra = EstadoValorizacionCompra.Anulado;
      if (versionAprobada) {
        estadoGrupo = EstadoValorizacionCompra.Aprobado;
      } else if (propuestasActivas.length > 0) {
        estadoGrupo = EstadoValorizacionCompra.Propuesta;
      } else if (
        versionesOrdenadas.some(
          (v) => v.estado === EstadoValorizacionCompra.Desestimada,
        )
      ) {
        estadoGrupo = EstadoValorizacionCompra.Desestimada;
      }

      const fechaReciente = versionesOrdenadas.reduce((maxF, curr) => {
        const f = curr.created_at || "";
        return f > maxF ? f : maxF;
      }, "");

      resultado.push({
        uuidGrupo,
        correlativo: obtenerCorrelativoDisplay(versionesOrdenadas[0]),
        proveedorNombre: versionActiva.proveedor_nombre || "—",
        proveedorRuc: versionActiva.proveedor_ruc || "—",
        concesionNombre: versionActiva.concesion_nombre || "—",
        versiones: versionesOrdenadas,
        versionAprobada,
        versionActiva,
        estadoGrupo,
        fechaReciente,
      });
    }

    resultado.sort((a, b) => {
      if (b.fechaReciente !== a.fechaReciente) {
        return b.fechaReciente.localeCompare(a.fechaReciente);
      }
      const maxIdA = Math.max(...a.versiones.map((v) => v.id));
      const maxIdB = Math.max(...b.versiones.map((v) => v.id));
      return maxIdB - maxIdA;
    });

    return resultado;
  }, [valorizaciones, filtroEstado, fechaInicio, fechaFin]);

  // Selección efectiva derivada sin necesidad de efectos secundarios
  const grupoEfectivo = useMemo<GrupoValorizacionCompra | null>(() => {
    if (gruposFiltrados.length === 0) return null;
    if (selectedGrupoUuid) {
      const encontrado = gruposFiltrados.find(
        (g) => g.uuidGrupo === selectedGrupoUuid,
      );
      if (encontrado) return encontrado;
    }
    return gruposFiltrados[0];
  }, [gruposFiltrados, selectedGrupoUuid]);

  const versionEfectiva = useMemo<RES_ValorizacionCompra | null>(() => {
    if (!grupoEfectivo) return null;
    if (selectedVersionId !== null) {
      const encontrada = grupoEfectivo.versiones.find(
        (v) => v.id === selectedVersionId,
      );
      if (encontrada) return encontrada;
    }
    return elegirVersionPreferida(grupoEfectivo.versiones, filtroEstado);
  }, [grupoEfectivo, selectedVersionId, filtroEstado]);

  const handleSelectGrupo = (uuidGrupo: string) => {
    setSelectedGrupoUuid(uuidGrupo);
    const grp = gruposFiltrados.find((g) => g.uuidGrupo === uuidGrupo);
    if (grp) {
      const preferida = elegirVersionPreferida(grp.versiones, filtroEstado);
      setSelectedVersionId(preferida.id);
    }
  };

  const handleSelectVersion = (idVersion: number, uuidGrupo: string) => {
    setSelectedGrupoUuid(uuidGrupo);
    setSelectedVersionId(idVersion);
  };

  const handleConfirmarClonar = (v: RES_ValorizacionCompra) => {
    const corrStr = obtenerCorrelativoDisplay(v);
    const verNum = v.numero_version ?? 1;

    mostrarConfirmacion({
      title: "Clonar Propuesta",
      message: (
        <div className="space-y-2">
          <p>
            ¿Desea generar una nueva propuesta a partir de{" "}
            <strong className="text-white">
              {corrStr} (#{verNum})
            </strong>
            ?
          </p>
          <p className="text-zinc-400 text-xs">
            Se copiarán los datos de cabecera y sus lotes asociados en estado{" "}
            <strong className="text-yellow-300">Propuesta</strong> (bancos y anticipos se definen al aprobar).
          </p>
        </div>
      ),
      confirmLabel: "Sí, clonar propuesta",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        const clonada = await handleClonar(v);
        if (clonada) {
          setSelectedGrupoUuid(clonada.uuid_grupo);
          setSelectedVersionId(clonada.id);
        }
      },
    });
  };

  const handleAbrirAprobar = (r: RES_ValorizacionCompra) => {
    setValorizacionAprobar(r);
    setModalAprobarOpened(true);
  };

  const handleSolicitarOc = (r: RES_ValorizacionCompra) => {
    const yaSolicitado = Boolean(r.id_empleado_solicita_oc);
    const corrStr = obtenerCorrelativoDisplay(r);
    const verNum = r.numero_version ?? 1;

    mostrarConfirmacion({
      title: yaSolicitado
        ? "Actualizar Solicitud de OC"
        : "Solicitar Orden de Compra",
      message: (
        <div className="space-y-2">
          <p>
            {yaSolicitado ? (
              <>
                Esta valorización (
                <strong className="text-white">
                  {corrStr} · #{verNum}
                </strong>
                ) ya fue solicitada por{" "}
                <strong className="text-white">
                  {r.empleado_solicita_oc || "Empleado"}
                </strong>{" "}
                el{" "}
                <span className="text-zinc-300 font-mono">
                  {r.fecha_hora_solicitud_oc}
                </span>
                .
                <br />
                ¿Desea volver a registrar la solicitud con su usuario actual?
              </>
            ) : (
              <>
                ¿Desea registrar la solicitud de Orden de Compra para{" "}
                <strong className="text-white">
                  {corrStr} (#{verNum})
                </strong>
                ?
              </>
            )}
          </p>
          <p className="text-zinc-400 text-xs">
            Su usuario y fecha/hora quedarán registrados como el solicitante de la Orden de Compra.
          </p>
        </div>
      ),
      confirmLabel: yaSolicitado ? "Sí, actualizar" : "Sí, solicitar OC",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        setSolicitandoOcId(r.id);
        try {
          const res = await ValorizacionCompraService.solicitarOc(r.id);
          notifySuccess(
            res.message || "Solicitud de Orden de Compra registrada exitosamente",
          );
          await cargarValorizaciones();
        } catch (err) {
          notifyError(
            err instanceof Error
              ? err.message
              : "Error al solicitar Orden de Compra",
          );
        } finally {
          setSolicitandoOcId(null);
        }
      },
    });
  };

  const handleImprimirDeclaracionJurada = (r: RES_ValorizacionCompra) => {
    const target = `dj-val-${r.id}`;
    prepare(target);
    const corrStr = obtenerCorrelativoDisplay(r);
    const docTitle = `Declaracion Jurada - ${corrStr} - V${r.numero_version ?? 1}`;
    print(<DeclaracionJuradaPdf valorizacion={r} />, {
      documentTitle: docTitle,
      target,
    });
    notifySuccess("Declaración Jurada generada exitosamente.");
  };

  const historialCambiosCombinados = useMemo(() => {
    if (!valorizacionHistorial) return [];

    type LogCrudo = Record<string, unknown>;
    type LogProcesado = LogCrudo & { motivo: string };

    const sinTransicionAprobado = (log: LogCrudo): LogCrudo => {
      const cambios = Array.isArray(log.cambios) ? log.cambios : [];
      const filtrados = (cambios as Array<Record<string, unknown>>).filter(
        (c) =>
          !(
            c.campo_bd === "estado" && String(c.valor_nuevo ?? "") === "Aprobado"
          ),
      );
      return { ...log, cambios: filtrados };
    };

    const logsHeader: LogProcesado[] = (valorizacionHistorial.log_cambios || [])
      .filter(
        (log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0,
      )
      .map((log) => ({
        ...log,
        motivo: String(log.motivo || "Edición de Valorización de Compra"),
      }));

    const logsDetalles: LogProcesado[] = (
      valorizacionHistorial.detalles || []
    ).flatMap((d) => {
      const loteNombre = d.lote_correlativo || `ID #${d.id_lote_guia}`;
      const elem = (d.elemento_quimico || "Oro").toUpperCase();
      return (d.log_cambios || [])
        .filter(
          (log) =>
            Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0,
        )
        .map((log) => ({
          ...log,
          motivo: String(
            log.motivo || `Lote ${loteNombre} (${elem}) - Modificación de Parámetros`,
          ),
        }));
    });

    const logsTransacciones: LogProcesado[] = (
      valorizacionHistorial.transacciones_anticipo || []
    ).flatMap((t) => {
      const codigo = t.factura || `Anticipo #${t.id_anticipo_proveedor}`;
      return (t.log_cambios || [])
        .filter(
          (log) =>
            Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0,
        )
        .map((log) => sinTransicionAprobado(log))
        .filter(
          (log) =>
            Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0,
        )
        .map((log) => ({
          ...log,
          motivo: `Transacción Anticipo ${codigo} — ${obtenerCorrelativoDisplay(valorizacionHistorial)}`,
        }));
    });

    const combinados: LogProcesado[] = [
      ...logsHeader,
      ...logsDetalles,
      ...logsTransacciones,
    ];

    combinados.sort((a, b) => {
      const timeA = new Date(
        String(a.fecha_hora || a.update_at || 0),
      ).getTime();
      const timeB = new Date(
        String(b.fecha_hora || b.update_at || 0),
      ).getTime();
      return timeB - timeA;
    });

    return combinados;
  }, [valorizacionHistorial]);

  const handleVerHistorial = (r: RES_ValorizacionCompra) => {
    setValorizacionHistorial(r);
    setModalHistorialOpened(true);
  };

  const hasActiveFilters =
    Boolean(idProveedorFiltro) ||
    fechaInicio !== defaultFechaInicio() ||
    fechaFin !== defaultFechaFin() ||
    (filtroEstado && filtroEstado !== "Todos");

  const clearFilters = () => {
    setIdProveedorFiltro(null);
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setFiltroEstado("Todos");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Barra Superior de Filtros y Acciones */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex flex-wrap items-end gap-3 flex-1 w-full">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />

          <div className="w-full sm:w-64">
            <Select
              label="Proveedor"
              placeholder={
                loadingProveedores ? "Cargando..." : "Todos los proveedores"
              }
              disabled={loadingProveedores}
              rightSection={
                loadingProveedores ? <Loader size={16} /> : undefined
              }
              data={proveedores.map((p) => {
                const idVal =
                  p.id_proveedor ?? (p as unknown as { id: number }).id;
                const doc =
                  p.documento || (p as unknown as { ruc?: string }).ruc || "";
                return {
                  value: String(idVal),
                  label: doc ? `${doc} - ${p.razon_social}` : p.razon_social,
                };
              })}
              value={idProveedorFiltro ? String(idProveedorFiltro) : null}
              onChange={(val) => setIdProveedorFiltro(val ? Number(val) : null)}
              clearable
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              label="Estado"
              placeholder="Seleccionar estado"
              data={[
                "Todos",
                EstadoValorizacionCompra.Propuesta,
                EstadoValorizacionCompra.Aprobado,
                EstadoValorizacionCompra.Desestimada,
                EstadoValorizacionCompra.Anulado,
              ]}
              value={filtroEstado}
              onChange={(val) => setFiltroEstado(val || "Todos")}
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {hasActiveFilters && (
            <LimpiarFiltrosButton onClick={clearFilters} />
          )}

          <RefreshButton
            onClick={() => void cargarValorizaciones()}
            loading={loading}
            label="Recargar valorizaciones"
          />

          <Button
            radius="lg"
            size="xs"
            leftSection={<IconPlus size={17} />}
            onClick={handleNuevo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Propuesta
          </Button>
        </div>
      </div>

      {/* Disposición Principal: Izquierda (Cabecera y Propuestas más angosta) + Derecha (Detalle y Lotes más ancha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* IZQUIERDA: Cards de Cabecera + Propuestas */}
        <div className="lg:col-span-5 xl:col-span-4 min-w-0 lg:sticky lg:top-4">
          <PanelGruposVersiones
            grupos={gruposFiltrados}
            selectedGrupoUuid={grupoEfectivo?.uuidGrupo ?? null}
            selectedVersionId={versionEfectiva?.id ?? null}
            loading={loading}
            printingId={printingId}
            solicitandoOcId={solicitandoOcId}
            togglingIds={togglingIds}
            clonandoIds={clonandoIds}
            onSelectGrupo={handleSelectGrupo}
            onSelectVersion={handleSelectVersion}
            onDeclaracionJurada={handleImprimirDeclaracionJurada}
            onSolicitarOc={handleSolicitarOc}
            onClonarVersion={handleConfirmarClonar}
            onImprimirValorizacion={(v) => void printTicketLiquidacion(v)}
            onImprimirDirimencia={(v) => void printTicketDirimencia(v)}
            onEditarVersion={handleEditar}
            onAprobarVersion={handleAbrirAprobar}
            onAnularVersion={handleAbrirAnular}
            onVerHistorial={handleVerHistorial}
            onVerEvidencias={(title, files) =>
              setModalEvidenciasInfo({ title, files })
            }
          />
        </div>

        {/* DERECHA: Detalle económico, bancos/anticipos (si está aprobada) y lotes asociados */}
        <div className="lg:col-span-7 xl:col-span-8 min-w-0">
          <PanelDetallePropuesta
            valorizacion={versionEfectiva}
            loading={loading}
          />
        </div>
      </div>

      {/* Modal Formulario de Creación / Edición */}
      <ModalFormValorizacionCompra
        opened={modalFormOpened}
        onClose={() => setModalFormOpened(false)}
        valorizacionEditar={valorizacionEditar}
        onSuccess={(idGuardado?: number) => {
          void cargarValorizaciones();
          if (idGuardado) {
            setSelectedVersionId(idGuardado);
            if (!valorizacionEditar) {
              setSelectedGrupoUuid(null);
            }
            void printTicketLiquidacion(idGuardado);
          }
        }}
      />

      {/* Modal Historial de Cambios */}
      <ModalEstandar
        opened={modalHistorialOpened}
        close={() => setModalHistorialOpened(false)}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-yellow-400" />
            <Text fw={700} fz="sm" c="white">
              Historial de cambios:{" "}
              {valorizacionHistorial
                ? `${obtenerCorrelativoDisplay(valorizacionHistorial)} (#${valorizacionHistorial.numero_version ?? 1})`
                : "-"}
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
        <CambiosLogViewer
          cambios={historialCambiosCombinados as unknown as RES_CambiosLog[]}
        />
      </ModalEstandar>

      {/* Modal Evidencias */}
      <ModalEstandar
        opened={modalEvidenciasInfo !== null}
        close={() => setModalEvidenciasInfo(null)}
        title={
          modalEvidenciasInfo?.title || "Evidencias / Documentos Adjuntos"
        }
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

      {/* Modal Anular / Eliminar Valorización */}
      <ModalAnularValorizacion
        opened={modalAnularOpened}
        close={() => setModalAnularOpened(false)}
        valorizacion={valorizacionAnular}
        onConfirm={handleConfirmarAnular}
        loading={
          valorizacionAnular ? Boolean(togglingIds[valorizacionAnular.id]) : false
        }
      />

      {/* Modal Aprobar Valorización */}
      <ModalAprobarValorizacion
        opened={modalAprobarOpened}
        onClose={() => setModalAprobarOpened(false)}
        valorizacion={valorizacionAprobar}
        onAprobar={async (id, payload) => {
          const ok = await handleAprobar(id, payload);
          if (ok) {
            setSelectedVersionId(id);
          }
          return ok;
        }}
      />
    </div>
  );
};

export const ValorizacionesCompraPage = ValorizacionCompraPage;
export default ValorizacionCompraPage;
