import { useState } from "react";
import { Text, Button, Select, Textarea, Badge, Group, ActionIcon, Tooltip, type MantineColor } from "@mantine/core";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import { IconPaperclip, IconClipboardCheck, IconPencil, IconHistory, IconTruck, IconPrinter, IconLock } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ModalSeleccionGuiaTicket } from "../../../../presentation/utils/modal-seleccion-guia-ticket";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { GuiaRecepcionItem } from "../../../../service/responses/ticket-ingreso-vehiculo";

import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import { useNotify } from "../../../../hooks/useNotify";
import { useDispositivo } from "../../../../hooks/useDispositivo";
import { useTicketIngresoVehiculo } from "../../../../hooks/useTicketIngresoVehiculo";
import { TicketIngresoService } from "../../../../service/ticket-ingreso.service";
import { EstadoSalida } from "../../../../shared/enums/_generic/estado-salida";
import { EstadoUnidad } from "../../../../shared/enums/_generic/estado-unidad";
import type { GrupoEdicion } from "./modal-editar-campo-unidad";
import type { CampoObservacion } from "./modal-editar-observacion";

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
}

export const TablaRecepciones = ({
  recepciones,
  loading,
  onUpdateRecepcion,
  onConfirmarProgramacion,
  onEditarObservacionEvidencias,
  onGestionarEvidencias,
  onVerHistorial,
  onEditarCampo,
  onEditarGuias,
}: Props) => {
  const [modalSeleccionGuiaOpen, setModalSeleccionGuiaOpen] = useState(false);
  const [guiasRecepcion, setGuiasRecepcion] = useState<GuiaRecepcionItem[]>([]);
  const [recepcionSeleccionadaTicket, setRecepcionSeleccionadaTicket] = useState<RecepcionUnidadResponse | null>(null);
  const [loadingGuiasRecepcion, setLoadingGuiasRecepcion] = useState(false);
  const [idGuiaImprimiendo, setIdGuiaImprimiendo] = useState<number | null>(null);

  const [exitRecord, setExitRecord] = useState<RecepcionUnidadResponse | null>(null);
  const [estadoSalida, setEstadoSalida] = useState<EstadoSalida | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [evidenciasSalida, setEvidenciasSalida] = useState<File[]>([]);
  const [savingExit, setSavingExit] = useState(false);
  const { notifySuccess, notifyError } = useNotify();
  const { printTicketIngreso, loadingTicket } = useTicketIngresoVehiculo();
  const { esPantallaPequena } = useDispositivo();

  const handlePrintTicket = async (r: RecepcionUnidadResponse) => {
    try {
      setLoadingGuiasRecepcion(true);
      const guias = await TicketIngresoService.getGuiasRecepcion(r.id);
      if (guias && guias.length > 1) {
        setRecepcionSeleccionadaTicket(r);
        setGuiasRecepcion(guias);
        setModalSeleccionGuiaOpen(true);
      } else if (guias && guias.length === 1) {
        void printTicketIngreso(r.id, guias[0].id);
      } else {
        void printTicketIngreso(r.id);
      }
    } catch (e) {
      console.error("Error al obtener guías de la recepción para imprimir ticket", e);
      void printTicketIngreso(r.id);
    } finally {
      setLoadingGuiasRecepcion(false);
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
  const ESTADO_UNIDAD_COLORS: Record<EstadoUnidad, MantineColor> = {
    [EstadoUnidad.EnPlanta]: "teal",
    [EstadoUnidad.FueraDePlanta]: "dark",
  };

  const ESTADO_UNIDAD_VALUES = new Set<string>(
    Object.values(EstadoUnidad) as string[],
  );

  /**
   * Render del estado de la unit (`recepcion_unidad.estado`). Si el valor
   * está en el enum `EstadoUnidad` se muestra como badge; si no, se muestra
   * "—" (datos legacy fuera del enum no se inventan).
   */
  const estadoUnidadBadge = (estado: string | null | undefined) => {
    const texto = estado ?? "—";
    if (!ESTADO_UNIDAD_VALUES.has(texto)) {
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );
    }
    const color = ESTADO_UNIDAD_COLORS[texto as EstadoUnidad];

    return (
      <Badge
        color={color}
        variant="filled"
        radius="md"
        size="sm"
        fw={700}
        tt="uppercase"
        className="tracking-wide"
      >
        {texto}
      </Badge>
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
      <Tooltip label={motivo} withArrow>
        <ActionIcon
          variant="subtle"
          color={bloqueado ? "gray" : "indigo"}
          radius="sm"
          size="md"
          disabled={bloqueado}
          onClick={() => onEditarCampo(r, grupo)}
          className={
            bloqueado
              ? "text-zinc-600 opacity-50 cursor-not-allowed"
              : "text-indigo-300 hover:bg-indigo-500/10"
          }
          aria-label="Editar"
        >
          {bloqueado ? <IconLock size={16} /> : <IconPencil size={16} />}
        </ActionIcon>
      </Tooltip>
    );
  };

  const handleSaveExit = async () => {    if (!exitRecord) return;
    if (!estadoSalida) {
      notifyError("Debe seleccionar el estado de la unidad.");
      return;
    }

    setSavingExit(true);
    try {
      const updated = await RecepcionUnidadesService.registrarSalida(exitRecord.id, {
        estado_salida: estadoSalida,
        observacion_salida: observacionSalida,
        evidencias: evidenciasSalida,
      });
      notifySuccess("Salida de unidad registrada correctamente");
      onUpdateRecepcion(updated);
      setExitRecord(null);
      setEstadoSalida(null);
      setObservacionSalida("");
      setEvidenciasSalida([]);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al registrar la salida");
    } finally {
      setSavingExit(false);
    }
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
            width: 200,
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
                  <Button
                    radius="lg"
                    size="sm"
                    leftSection={<IconClipboardCheck size={18} />}
                    onClick={() => onConfirmarProgramacion(r)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-4 py-2 shadow-lg shadow-indigo-900/20"
                  >
                    Confirmar llegada
                  </Button>
                );
              }

              return (
                <Group gap={6} wrap="nowrap" justify="center">
                  <Tooltip
                    label={
                      Array.isArray(r.evidencias) && r.evidencias.length > 0
                        ? `Gestionar evidencias (${r.evidencias.length})`
                        : "Agregar evidencias"
                    }
                    withArrow
                  >
                    <ActionIcon
                      variant="light"
                      color="indigo"
                      radius="xl"
                      size="lg"
                      onClick={() => onGestionarEvidencias(r)}
                      className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/10"
                    >
                      <IconPaperclip size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Ver historial de cambios" withArrow>
                    <ActionIcon
                      variant="light"
                      color="gray"
                      radius="xl"
                      size="lg"
                      onClick={() => onVerHistorial(r)}
                      className="bg-zinc-700/10 hover:bg-zinc-700/20 text-zinc-400 border border-zinc-500/10 disabled:opacity-40"
                    >
                      <IconHistory size={18} />
                    </ActionIcon>
                  </Tooltip>

                  {puedeRegistrarSalida && (
                    <Tooltip label="Registrar salida" withArrow>
                      <ActionIcon
                        variant="light"
                        color="red"
                        radius="xl"
                        size="lg"
                        onClick={() => {
                          setExitRecord(r);
                          setEstadoSalida(null);
                          setObservacionSalida("");
                          setEvidenciasSalida([]);
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      >
                        <IconTruck size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              );
            },
          },
          {
            accessor: "ticket_correlativo",
            title: "Ticket",
            textAlign: "center",
            width: 170,
            render: (r: RecepcionUnidadResponse) => {
              const noConfirmada = r.es_programacion && !r.id_empleado_recepcion;

              return (
                <Group gap={6} wrap="nowrap" justify="center">
                  <Text size="sm" fw={700} className="text-white font-mono">
                    {r.ticket_correlativo ?? "—"}
                  </Text>
                  <Tooltip label="Imprimir Ticket de Ingreso" withArrow>
                    <ActionIcon
                      variant="light"
                      color="yellow"
                      radius="xl"
                      size="lg"
                      disabled={noConfirmada || loadingTicket || loadingGuiasRecepcion}
                      onClick={() => handlePrintTicket(r)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 disabled:opacity-40"
                    >
                      <IconPrinter size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
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
                  <Group gap={6} wrap="nowrap" justify="center">
                    <Text size="sm" className="text-white italic">
                      (sin asignar)
                    </Text>
                    {pencilCampo(r, "id_vehiculo", "vehiculo")}
                  </Group>
                );
              }
              return (
                <div className="flex flex-col gap-1.5 items-center">
                  <Group gap={6} wrap="nowrap" justify="center">
                    <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                      {r.vehiculo_placa}
                    </div>
                    {pencilCampo(r, "id_vehiculo", "vehiculo")}
                  </Group>
                  <Text size="sm" className="text-white">
                    {r.tipo_vehiculo_nombre ?? ""}
                  </Text>
                </div>
              );
            },
          },
          {
            accessor: "estado",
            title: "Estado Unidad",
            textAlign: "center",
            width: 180,
            render: (r: RecepcionUnidadResponse) => estadoUnidadBadge(r.estado),
          },
          {
            accessor: "empresa_transporte_razon_social",
            title: "Transportista",
            textAlign: "center",
            width: 240,
            render: (r: RecepcionUnidadResponse) => (
              <Group gap={6} wrap="nowrap" justify="center" align="center">
                <Text
                  size="sm"
                  className="text-white"
                  style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                  title={r.empresa_transporte_razon_social}
                >
                  {r.empresa_transporte_razon_social}
                </Text>
                {pencilCampo(r, "id_empresa_transporte", "transportista")}
              </Group>
            ),
          },
          {
            accessor: "conductor_nombre_completo",
            title: "Conductor",
            textAlign: "center",
            width: 240,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex flex-col gap-1 items-center">
                <Group gap={6} wrap="nowrap" justify="center" align="center">
                  <Text
                    size="sm"
                    className="text-white"
                    fw={500}
                    style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                    title={r.conductor_nombre_completo ?? ""}
                  >
                    {r.conductor_nombre_completo ?? "—"}
                  </Text>
                  {pencilCampo(r, "id_conductor", "conductor")}
                </Group>
                <Text size="sm" className="text-white">
                  Licencia: {r.conductor_numero_licencia ?? "—"}
                </Text>
              </div>
            ),
          },
          {
            accessor: "fecha_hora_ingreso",
            title: "Fecha Ingreso",
            textAlign: "center",
            width: 200,
            render: (r: RecepcionUnidadResponse) => (
              <div className="flex flex-col gap-1 items-center">
                <Text size="sm" className="text-white" fw={500}>
                  {formatFecha(r.fecha_hora_ingreso)}
                </Text>
                {r.fecha_hora_ingreso && (
                  <Text size="sm" className="text-white">
                    Por: {r.empleado_recepcion_nombre ?? r.empleado_registro_nombre ?? "—"}
                  </Text>
                )}
              </div>
            ),
          },
          {
            accessor: "fecha_hora_salida",
            title: "F. Salida",
            textAlign: "center",
            width: 170,
            // Columna secundaria: en pantallas pequeñas se oculta para que
            // las columnas importantes quepan sin tanto scroll horizontal.
            hidden: esPantallaPequena,
            render: (r: RecepcionUnidadResponse) => (
              <Text size="sm" className="text-zinc-200" fw={500}>
                {r.fecha_hora_salida ? formatFecha(r.fecha_hora_salida) : "—"}
              </Text>
            ),
          },
          {
            accessor: "guia_remitente",
            title: "Guías",
            textAlign: "center",
            width: 260,
            render: (r: RecepcionUnidadResponse) => {
              const bloqueados = r.campos_bloqueados ?? [];
              const remitenteBloqueado = bloqueados.includes("guia_remitente");
              const transportistaBloqueado = bloqueados.includes(
                "guia_transportista",
              );
              const algunaBloqueada =
                remitenteBloqueado || transportistaBloqueado;

              return (
                <Group gap={8} wrap="nowrap" justify="center">
                  <div className="flex flex-col gap-1 items-center">
                    <Text size="sm" className="text-white">
                      Remitente:{" "}
                      <span className="font-mono">
                        {r.guia_remitente ?? "—"}
                      </span>
                    </Text>
                    <Text size="sm" className="text-white">
                      Transportista:{" "}
                      <span className="font-mono">
                        {r.guia_transportista ?? "—"}
                      </span>
                    </Text>
                  </div>
                  <Tooltip
                    label={
                      algunaBloqueada
                        ? "Las guías se registraron en la programación y no se pueden editar"
                        : "Editar guías"
                    }
                    withArrow
                  >
                    <ActionIcon
                      variant="subtle"
                      color="indigo"
                      radius="sm"
                      size="md"
                      onClick={() => onEditarGuias(r)}
                      disabled={algunaBloqueada}
                      className={
                        algunaBloqueada
                          ? "text-zinc-700 opacity-40 cursor-not-allowed"
                          : "text-indigo-300 hover:bg-indigo-500/10"
                      }
                      aria-label="Editar guías"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              );
            },
          },
          {
            accessor: "observacion",
            title: "Observación",
            textAlign: "center",
            width: 220,
            render: (r: RecepcionUnidadResponse) => (
              <Group gap={6} wrap="nowrap" justify="center">
                {!r.observacion ? (
                  <Text size="sm" className="text-white italic max-w-45">
                    —
                  </Text>
                ) : (
                  <Tooltip label={r.observacion} multiline w={320} withArrow>
                    <Text size="sm" className="text-white italic max-w-45 truncate">
                      {r.observacion}
                    </Text>
                  </Tooltip>
                )}
                <Tooltip label="Editar observación" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="indigo"
                    radius="sm"
                    size="md"
                    onClick={() => onEditarObservacionEvidencias(r, "observacion")}
                    className="text-indigo-300 hover:bg-indigo-500/10"
                    aria-label="Editar observación"
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
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
              <Group gap={6} wrap="nowrap" justify="center">
                {!r.observacion_salida ? (
                  <Text size="sm" className="text-white italic max-w-45">
                    —
                  </Text>
                ) : (
                  <Tooltip label={r.observacion_salida} multiline w={320} withArrow>
                    <Text size="sm" className="text-white italic max-w-45 truncate">
                      {r.observacion_salida}
                    </Text>
                  </Tooltip>
                )}
                <Tooltip label="Editar observación de salida" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="indigo"
                    radius="sm"
                    size="md"
                    onClick={() =>
                      onEditarObservacionEvidencias(r, "observacion_salida")
                    }
                    className="text-indigo-300 hover:bg-indigo-500/10"
                    aria-label="Editar observación de salida"
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
        ]}
      />

      <ModalEstandar
        opened={!!exitRecord}
        close={() => setExitRecord(null)}
        title="Registro de Salida"
        size="md"
        validateClose
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Estado Unidad"
            placeholder="Elija una opción..."
            data={[
              { value: EstadoSalida.ConCarga, label: EstadoSalida.ConCarga },
              { value: EstadoSalida.Vacio, label: EstadoSalida.Vacio },
            ]}
            value={estadoSalida}
            onChange={(val) => setEstadoSalida(val as EstadoSalida)}
            required
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <Textarea
            label="Observación"
            placeholder="Escriba alguna observación de salida..."
            value={observacionSalida}
            onChange={(e) => setObservacionSalida(e.target.value)}
            minRows={3}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <MultiFilePicker
            label="Evidencias de Salida"
            files={evidenciasSalida}
            onFilesChange={setEvidenciasSalida}
          />
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => setExitRecord(null)}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExit}
              loading={savingExit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
            >
              Grabar
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal para elegir guía cuando la recepción tiene múltiples guías */}
      <ModalSeleccionGuiaTicket
        opened={modalSeleccionGuiaOpen}
        guias={guiasRecepcion}
        idGuiaImprimiendo={idGuiaImprimiendo}
        onClose={() => setModalSeleccionGuiaOpen(false)}
        onSelect={(idGuia) => {
          if (recepcionSeleccionadaTicket) {
            setIdGuiaImprimiendo(idGuia);
            void printTicketIngreso(recepcionSeleccionadaTicket.id, idGuia).finally(
              () => setIdGuiaImprimiendo(null),
            );
            setModalSeleccionGuiaOpen(false);
          }
        }}
      />
    </>
  );
};
