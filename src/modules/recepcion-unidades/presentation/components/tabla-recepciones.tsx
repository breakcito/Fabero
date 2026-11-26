import { useState } from "react";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import {
  IconClipboardCheck,
  IconPaperclip,
  IconPencil,
  IconPrinter,
  IconLock,
} from "@tabler/icons-react";
import { ModalSeleccionTicketIngreso } from "../../../../presentation/utils/modal-seleccion-ticket-ingreso";
import { ModalRegistrarSalida } from "./modal-registrar-salida";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { RES_TicketIngresoDisponible } from "../../../../service/responses/ticket-ingreso-vehiculo";

import { useDispositivo } from "../../../../hooks/useDispositivo";
import { useTicketIngresoVehiculo } from "../../../../hooks/useTicketIngresoVehiculo";
import { EstadoSalida } from "../../../../shared/enums/_generic/estado-salida";
import { EstadoUnidad } from "../../../../shared/enums/_generic/estado-unidad";
import type { GrupoEdicion } from "./modal-editar-campo-unidad";
import type { CampoObservacion } from "./modal-editar-observacion";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface Props {
  recepciones: RecepcionUnidadResponse[];
  loading: boolean;
  onUpdateRecepcion: (r: RecepcionUnidadResponse) => void;
  onConfirmarProgramacion: (r: RecepcionUnidadResponse) => void;
  onEditarObservacionEvidencias: (
    r: RecepcionUnidadResponse,
    campo: CampoObservacion,
  ) => void;
  onGestionarEvidencias: (r: RecepcionUnidadResponse) => void;
  onVerHistorial: (r: RecepcionUnidadResponse) => void;
  onEditarCampo: (r: RecepcionUnidadResponse, grupo: GrupoEdicion) => void;
  onEditarGuias: (r: RecepcionUnidadResponse) => void;
  onEditarGuiasSalida: (r: RecepcionUnidadResponse) => void;
  onEditarFecha: (
    r: RecepcionUnidadResponse,
    campo: "fecha_hora_ingreso" | "fecha_hora_salida",
  ) => void;
}


export const TablaRecepciones = ({
  recepciones,
  loading,
  onUpdateRecepcion,
  onConfirmarProgramacion,
  onEditarObservacionEvidencias,
  onGestionarEvidencias,
  onEditarCampo,
  onEditarGuias,
  onEditarGuiasSalida,
  onEditarFecha,
}: Props) => {
  const [modalSeleccionTicketOpen, setModalSeleccionTicketOpen] = useState(false);
  const [ticketsDisponibles, setTicketsDisponibles] = useState<RES_TicketIngresoDisponible[]>([]);
  const [recepcionSeleccionadaTicket, setRecepcionSeleccionadaTicket] = useState<RecepcionUnidadResponse | null>(null);
  const [loadingTicketsIngreso, setLoadingTicketsIngreso] = useState(false);
  const [idProveedorImprimiendo, setIdProveedorImprimiendo] = useState<number | null>(null);

  const [exitRecord, setExitRecord] = useState<RecepcionUnidadResponse | null>(null);
  const { printTicketIngreso, imprimirTicketPorProveedor, loadingTicket } = useTicketIngresoVehiculo();
  const { esPantallaPequena } = useDispositivo();

  /**
   * Imprime el Ticket de Ingreso de la unidad.
   *
   * Una unidad puede traer la carga de varios proveedores: si hay más de un
   * ticket disponible, el operador elige a cuál proveedor corresponde el
   * documento. Con un solo ticket se imprime directo.
   */
  const handlePrintTicket = async (r: RecepcionUnidadResponse) => {
    setLoadingTicketsIngreso(true);
    try {
      await imprimirTicketPorProveedor(r.id, (tickets) => {
        setRecepcionSeleccionadaTicket(r);
        setTicketsDisponibles(tickets);
        setModalSeleccionTicketOpen(true);
      });
    } finally {
      setLoadingTicketsIngreso(false);
    }
  };

  const formatFecha = (fechaStr: string | null | undefined) => {
    if (!fechaStr) return "—";
    try {
      const date = new Date(fechaStr.replace(" ", "T"));
      if (isNaN(date.getTime())) return fechaStr;

      const pad = (num: number) => num.toString().padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  /**
   * Colores por valor del enum `EstadoUnidad`. Sólo los 2 valores válidos
   * producen badge; cualquier otro valor (datos legacy fuera del enum,
   * como "Salió de Planta") se renderiza como "—" sin inventar mappings.
   */
  const ESTADO_UNIDAD_COLORS: Record<string, string> = {
    [EstadoUnidad.EnPlanta]: "border-teal-500/30 bg-teal-500/15 text-teal-300",
    [EstadoUnidad.FueraDePlanta]: "border-zinc-600/40 bg-zinc-700/40 text-zinc-300",
  };

  const ESTADO_UNIDAD_VALUES = new Set<string>(
    Object.values(EstadoUnidad) as string[],
  );

  /** Badge del estado de la unidad (En Planta / Fuera de Planta). */
  const estadoUnidadBadge = (estado: string | null | undefined) => {
    const texto = estado ?? "";
    if (!ESTADO_UNIDAD_VALUES.has(texto)) return null;

    return (
      <span
        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
          ESTADO_UNIDAD_COLORS[texto]
        }`}
      >
        {texto}
      </span>
    );
  };

  /** Badge del estado de carga (Con Carga / Vacío) del ingreso o de la salida. */
  const badgeCarga = (estado: string | null | undefined) => {
    if (!estado) return null;
    const conCarga = estado === EstadoSalida.ConCarga;

    return (
      <span
        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
          conCarga
            ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
            : "border-zinc-600/40 bg-zinc-700/40 text-zinc-300"
        }`}
      >
        {estado}
      </span>
    );
  };

  /**
   * Lápiz de edición por columna.
   *
   * Queda bloqueado si:
   *  - la llegada de la unidad todavía no fue confirmada (programación
   *    pendiente), o
   *  - el campo se registró en una programación (recepción o despacho).
   */
  const pencilCampo = (
    r: RecepcionUnidadResponse,
    campo: string,
    grupo: GrupoEdicion,
  ) => {
    const llegadaPendiente =
      r.es_programacion && !r.id_empleado_recepcion;
    const bloqueadoPorProgramacion = (r.campos_bloqueados ?? []).includes(campo);
    const bloqueado = llegadaPendiente || bloqueadoPorProgramacion;

    const motivo = llegadaPendiente
      ? "Confirme la llegada para poder editar"
      : bloqueadoPorProgramacion
        ? "Registrado en la programación: no se puede editar"
        : "Editar";

    return (
      <button
        type="button"
        title={motivo}
        disabled={bloqueado}
        onClick={() => onEditarCampo(r, grupo)}
        aria-label={motivo}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
          bloqueado
            ? "cursor-not-allowed text-zinc-600 opacity-50"
            : "text-indigo-300 hover:bg-indigo-500/10"
        }`}
      >
        {bloqueado ? <IconLock size={16} /> : <IconPencil size={16} />}
      </button>
    );
  };

  /**
   * Botón de edición de la fecha y hora de ingreso o de salida.
   */
  const pencilFecha = (
    r: RecepcionUnidadResponse,
    campo: "fecha_hora_ingreso" | "fecha_hora_salida",
  ) => {
    const llegadaPendiente = r.es_programacion && !r.id_empleado_recepcion;
    const bloqueado = llegadaPendiente;

    const motivo = bloqueado
      ? "Confirme la llegada para poder editar"
      : "Editar fecha y hora";

    return (
      <button
        type="button"
        title={motivo}
        aria-label={motivo}
        disabled={bloqueado}
        onClick={() => onEditarFecha(r, campo)}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
          bloqueado
            ? "cursor-not-allowed text-zinc-600 opacity-50"
            : "text-indigo-300 hover:bg-indigo-500/10"
        }`}
      >
        {bloqueado ? <IconLock size={16} /> : <IconPencil size={16} />}
      </button>
    );
  };

  /**
   * Abre el modal de salida. La precarga de las guías por proveedor la
   * hace el propio modal.
   */
  const abrirSalida = (r: RecepcionUnidadResponse) => {
    setExitRecord(r);
  };

  return (
    <>
      <DataTableEstandar
        idAccessor="id"
        records={recepciones}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
          },
          {
            accessor: "acciones",
            title: "Acciones",
            textAlign: "center",
            width: 260,
            render: (r: RecepcionUnidadResponse) => {
              const noConfirmada = r.es_programacion && !r.id_empleado_recepcion;

              const puedeRegistrarSalida =
                !noConfirmada && !r.fecha_hora_salida;

              /**
               * Unidad programada (recepción o despacho) que todavía no
               * confirmó su llegada: en vez de los botones (que estaban
               * deshabilitados) se muestra la acción principal. Al confirmar,
               * la fila vuelve a mostrar los botones de acción.
               */
              if (noConfirmada) {
                return (
                  <button
                    type="button"
                    onClick={() => onConfirmarProgramacion(r)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition-colors hover:bg-indigo-500"
                  >
                    <IconClipboardCheck size={18} />
                    Confirmar llegada
                  </button>
                );
              }

              return (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    type="button"
                    title="Subir evidencias"
                    aria-label="Subir evidencias"
                    onClick={() => onGestionarEvidencias(r)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400 transition-colors hover:bg-teal-500/20"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                  </button>

                  {/* Botón de historial OCULTO: el modal sigue disponible, pero
                      el operador no lo ve en la columna de acciones. */}
                  {/* <button
                    type="button"
                    title="Ver historial de cambios"
                    aria-label="Ver historial de cambios"
                    onClick={() => onVerHistorial(r)}
                    className="hidden h-9 w-9 items-center justify-center rounded-full border border-zinc-500/10 bg-zinc-700/10 text-zinc-400 transition-colors hover:bg-zinc-700/20"
                  >
                    <IconHistory size={18} />
                  </button> */}

                  {puedeRegistrarSalida ? (
                    <button
                      type="button"
                      onClick={() => abrirSalida(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
                    >
                      Marcar salida
                    </button>
                  ) : null}
                </div>
              );
            },
          },
          {
            accessor: "ticket_correlativo",
            title: "Ticket",
            textAlign: "center",
            width: 180,
            render: (r: RecepcionUnidadResponse) => {
              const noConfirmada = r.es_programacion && !r.id_empleado_recepcion;

              return (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-white">
                      {r.ticket_correlativo ?? "—"}
                    </span>
                    <button
                      type="button"
                      title="Imprimir Ticket de Ingreso"
                      aria-label="Imprimir Ticket de Ingreso"
                      disabled={noConfirmada || loadingTicket || loadingTicketsIngreso}
                      onClick={() => handlePrintTicket(r)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
                    >
                      <IconPrinter size={16} />
                    </button>
                  </div>

                  {/* El estado de la unidad va debajo del ticket: la columna
                      propia se eliminó para no ensanchar la grilla. */}
                  {estadoUnidadBadge(r.estado)}
                </div>
              );
            },
          },
          {
            accessor: "vehiculo_placa",
            title: "Vehículo",
            textAlign: "center",
            width: 190,
            render: (r: RecepcionUnidadResponse) => {
              if (!r.vehiculo_placa) {
                return (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm italic text-white">
                      (sin asignar)
                    </span>
                    {pencilCampo(r, "id_vehiculo", "vehiculo")}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-indigo-300">
                      {r.vehiculo_placa}
                    </span>
                    {pencilCampo(r, "id_vehiculo", "vehiculo")}
                  </div>
                  <span className="text-sm text-white">
                    {r.tipo_vehiculo_nombre ?? ""}
                  </span>
                </div>
              );
            },
          },
          {
            accessor: "empresa_transporte_razon_social",
            title: "Transportista",
            textAlign: "center",
            width: 240,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex items-center justify-center gap-1">
                <span
                  className="text-sm text-white"
                  style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                  title={r.empresa_transporte_razon_social}
                >
                  {r.empresa_transporte_razon_social}
                </span>
                {pencilCampo(r, "id_empresa_transporte", "transportista")}
              </div>
            ),
          },
          {
            accessor: "conductor_nombre_completo",
            title: "Conductor",
            textAlign: "center",
            width: 240,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className="text-sm font-medium text-white"
                    style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                    title={r.conductor_nombre_completo ?? ""}
                  >
                    {r.conductor_nombre_completo ?? "—"}
                  </span>
                  {pencilCampo(r, "id_conductor", "conductor")}
                </div>
                <span className="text-sm text-white">
                  Licencia: {r.conductor_numero_licencia ?? "—"}
                </span>
              </div>
            ),
          },
          {
            accessor: "fecha_hora_ingreso",
            title: "Fecha Ingreso",
            textAlign: "center",
            width: 210,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-white">
                    {formatFecha(r.fecha_hora_ingreso)}
                  </span>
                  {pencilFecha(r, "fecha_hora_ingreso")}
                </div>
                {badgeCarga(r.estado_ingreso)}
                {r.fecha_hora_ingreso ? (
                  <span className="text-sm text-white">
                    Por:{" "}
                    {r.empleado_recepcion_nombre ??
                      r.empleado_registro_nombre ??
                      "—"}
                  </span>
                ) : null}
              </div>
            ),
          },
          {
            accessor: "fecha_hora_salida",
            title: "F. Salida",
            textAlign: "center",
            width: 190,
            // Columna secundaria: en pantallas pequeñas se oculta para que
            // las columnas importantes quepan sin tanto scroll horizontal.
            hidden: esPantallaPequena,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-zinc-200">
                    {r.fecha_hora_salida ? formatFecha(r.fecha_hora_salida) : "—"}
                  </span>
                  {pencilFecha(r, "fecha_hora_salida")}
                </div>
                {badgeCarga(r.estado_salida)}
              </div>
            ),
          },
          {
            accessor: "guias",
            title: "Guías Ingreso",
            textAlign: "center",
            width: 290,
            render: (r: RecepcionUnidadResponse) => {
              const bloqueados = r.campos_bloqueados ?? [];
              const algunaBloqueada =
                bloqueados.includes("guia_remitente") ||
                bloqueados.includes("guia_transportista");

              const proveedores = r.proveedores ?? [];
              const guias = r.guias ?? [];

              /** Enlace al archivo de una guía (abre en otra pestaña). */
              const archivoGuia = (url: string | undefined) =>
                url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver archivo"
                    aria-label="Ver archivo de la guía"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
                  >
                    <IconPaperclip size={15} />
                  </a>
                ) : null;

              return (
                <div className="flex flex-col items-stretch gap-2">
                  {/* Encabezado con el pencil de proveedores
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Proveedores
                    </span>
                    {pencilCampo(r, "id_proveedor_minero", "proveedor")}
                  </div> */}

                  {guias.length === 0 ? (
                    <p className="py-2 text-center text-sm italic text-zinc-500">
                      Sin guías de ingreso
                    </p>
                  ) : (
                    guias.map((g) => (
                      <div
                        key={g.id_proveedor}
                        className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 text-left"
                      >
                        <p className="truncate text-xs font-bold text-zinc-200">
                          {proveedores.find(
                            (p) => p.id_proveedor === g.id_proveedor,
                          )?.razon_social ?? "Proveedor de la carga"}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-zinc-400">
                            Remitente:{" "}
                            <span className="font-mono text-zinc-200">
                              {g.guia_remitente || "—"}
                            </span>
                          </span>
                          {archivoGuia(g.guia_remitente_archivo?.url)}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-zinc-400">
                            Transp.:{" "}
                            <span className="font-mono text-zinc-200">
                              {g.guia_transportista || "—"}
                            </span>
                          </span>
                          {archivoGuia(g.guia_transportista_archivo?.url)}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Botón de edición de las guías de ingreso */}
                  <button
                    type="button"
                    title={
                      algunaBloqueada
                        ? "Las guías se registraron en la programación y no se pueden editar"
                        : "Editar guías de ingreso"
                    }
                    aria-label="Editar guías de ingreso"
                    disabled={algunaBloqueada}
                    onClick={() => onEditarGuias(r)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                      algunaBloqueada
                        ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                        : "border-indigo-500/25 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                    }`}
                  >
                    <IconPencil size={13} />
                    Editar guías
                  </button>
                </div>
              );
            },
          },
          {
            accessor: "guias_salida",
            title: "Guías Salida",
            textAlign: "center",
            width: 290,
            render: (r: RecepcionUnidadResponse) => {
              const guiasSalida = r.guias_salida ?? [];
              const proveedores = r.proveedores ?? [];

              /** Enlace al archivo de una guía de salida. */
              const archivoGuia = (url: string | undefined) =>
                url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver archivo"
                    aria-label="Ver archivo de la guía de salida"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
                  >
                    <IconPaperclip size={15} />
                  </a>
                ) : null;

              return (
                <div className="flex flex-col items-stretch gap-2">
                  {guiasSalida.length === 0 ? (
                    <p className="py-2 text-center text-sm italic text-zinc-500">
                      Sin guías de salida
                    </p>
                  ) : (
                    guiasSalida.map((g, indice) => (
                      <div
                        key={`${g.id_proveedor}-${indice}`}
                        className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 text-left"
                      >
                        <p className="truncate text-xs font-bold text-zinc-200">
                          {g.es_interno
                            ? "Internas de la empresa"
                            : (proveedores.find(
                                (p) => p.id_proveedor === g.id_proveedor,
                              )?.razon_social ?? "Proveedor de la carga")}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-zinc-400">
                            Remitente:{" "}
                            <span className="font-mono text-zinc-200">
                              {g.guia_remitente || "—"}
                            </span>
                          </span>
                          {archivoGuia(g.guia_remitente_archivo?.url)}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-zinc-400">
                            Transp.:{" "}
                            <span className="font-mono text-zinc-200">
                              {g.guia_transportista || "—"}
                            </span>
                          </span>
                          {archivoGuia(g.guia_transportista_archivo?.url)}
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    title="Editar guías de salida"
                    aria-label="Editar guías de salida"
                    onClick={() => onEditarGuiasSalida(r)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
                  >
                    <IconPencil size={13} />
                    Editar guías
                  </button>
                </div>
              );
            },
          },
          {
            accessor: "observacion",
            title: "Observación",
            textAlign: "center",
            width: 220,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex items-center justify-center gap-1">
                {!r.observacion ? (
                  <span className="max-w-45 truncate text-sm italic text-white">
                    —
                  </span>
                ) : (
                  <span
                    className="max-w-45 truncate text-sm italic text-white"
                    title={r.observacion}
                  >
                    {r.observacion}
                  </span>
                )}
                <button
                  type="button"
                  title="Editar observación"
                  aria-label="Editar observación"
                  onClick={() => onEditarObservacionEvidencias(r, "observacion")}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-indigo-300 transition-colors hover:bg-indigo-500/10"
                >
                  <IconPencil size={16} />
                </button>
              </div>
            ),
          },
          {
            accessor: "observacion_salida",
            title: "Observación Salida",
            textAlign: "center",
            width: 220,
            // Columna secundaria: se oculta en pantallas pequeñas.
            hidden: esPantallaPequena,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex items-center justify-center gap-1">
                {!r.observacion_salida ? (
                  <span className="max-w-45 truncate text-sm italic text-white">
                    —
                  </span>
                ) : (
                  <span
                    className="max-w-45 truncate text-sm italic text-white"
                    title={r.observacion_salida}
                  >
                    {r.observacion_salida}
                  </span>
                )}
                <button
                  type="button"
                  title="Editar observación de salida"
                  aria-label="Editar observación de salida"
                  onClick={() =>
                    onEditarObservacionEvidencias(r, "observacion_salida")
                  }
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-indigo-300 transition-colors hover:bg-indigo-500/10"
                >
                  <IconPencil size={16} />
                </button>
              </div>
            ),
          },
        ]}
      />

      <ModalRegistrarSalida
        opened={!!exitRecord}
        recepcion={exitRecord}
        onClose={() => setExitRecord(null)}
        onGuardada={(actualizada) => onUpdateRecepcion(actualizada)}
      />

      {/* Modal para elegir el proveedor cuando la unidad trae carga de varios */}
      <ModalSeleccionTicketIngreso
        opened={modalSeleccionTicketOpen}
        tickets={ticketsDisponibles}
        idImprimiendo={idProveedorImprimiendo}
        onClose={() => setModalSeleccionTicketOpen(false)}
        onSelect={(ticket) => {
          if (recepcionSeleccionadaTicket) {
            setIdProveedorImprimiendo(ticket.id_proveedor);
            void printTicketIngreso(
              recepcionSeleccionadaTicket.id,
              ticket.id_guia_primer_tramo,
              ticket.id_proveedor,
            ).finally(() => setIdProveedorImprimiendo(null));
            setModalSeleccionTicketOpen(false);
          }
        }}
      />
    </>
  );
};
