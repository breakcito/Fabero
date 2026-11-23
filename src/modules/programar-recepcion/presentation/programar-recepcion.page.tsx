import { Button, Stack } from "@mantine/core";
import { IconCalendarPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useNotify } from "../../../hooks/useNotify";
import { useProgramaciones } from "../hooks/useProgramaciones";
import { ProgramarRecepcionService } from "../service/programar-recepcion.service";
import type {
  ProgramacionDetail,
  ProgramacionListItem,
} from "../service/programar-recepcion.responses";
import { FiltrosProgramaciones } from "./components/filtros-programaciones";
import { TablaProgramaciones } from "./components/tabla-programaciones";
import { ProgramarRecepcionModal } from "./components/programar-modal";
import { useTicketIngresoVehiculo } from "../../../hooks/useTicketIngresoVehiculo";
import { ModalSeleccionTicketIngreso } from "../../../presentation/utils/modal-seleccion-ticket-ingreso";
import type { RES_TicketIngresoDisponible } from "../../../service/responses/ticket-ingreso-vehiculo";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { LimpiarFiltrosButton } from "../../../presentation/utils/limpiar-filtros-button";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

const toListItem = (nueva: ProgramacionDetail): ProgramacionListItem => ({
  id: nueva.id,
  id_empleado_autoriza: nueva.id_empleado_autoriza,
  empleado_autoriza_nombre: nueva.empleado_autoriza_nombre,
  id_empresa_transporte: nueva.id_empresa_transporte,
  empresa_transporte_razon_social: nueva.empresa_transporte_razon_social,
  id_vehiculo: nueva.id_vehiculo,
  vehiculo_placa: nueva.vehiculo_placa,
  id_tipo_vehiculo: nueva.id_tipo_vehiculo,
  tipo_vehiculo_nombre: nueva.tipo_vehiculo_nombre,
  id_conductor: nueva.id_conductor,
  conductor_nombre_completo: nueva.conductor_nombre_completo,
  conductor_numero_licencia: nueva.conductor_numero_licencia ?? null,
  guias: nueva.guias ?? [],
  proveedores: nueva.proveedores ?? [],
  id_proveedor_minero: nueva.id_proveedor_minero,
  proveedor_razon_social: nueva.proveedor_razon_social,
  tipo_ingreso: nueva.tipo_ingreso,
  guia_remitente: nueva.guia_remitente,
  guia_transportista: nueva.guia_transportista,
  documentos_programacion: nueva.documentos_programacion,
  fecha_estimada_llegada: nueva.fecha_estimada_llegada,
  observacion: nueva.observacion,
  es_programacion: nueva.es_programacion,
  id_empleado_recepcion: nueva.id_empleado_recepcion,
  fecha_hora_ingreso: nueva.fecha_hora_ingreso,
  estado: nueva.estado,
  id_ticket_recepcion_unidades: nueva.id_ticket_recepcion_unidades ?? null,
  ticket_correlativo: nueva.ticket_correlativo ?? null,
  ticket_numero_correlativo: nueva.ticket_numero_correlativo ?? null,
  created_at: null,
});

export const ProgramarRecepcionPage = () => {
  useTitlePage("Programar Recepción", true);

  const {
    programaciones,
    loading,
    searchQuery,
    setSearchQuery,
    estadoConfirmacion,
    setEstadoConfirmacion,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetFilters,
    insertProgramacion,
    fetchProgramaciones,
  } = useProgramaciones();

  const { notifyError } = useNotify();

  const [openProgramar, setOpenProgramar] = useState(false);
  const [programacionAEditar, setProgramacionAEditar] =
    useState<ProgramacionDetail | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [viendoTicketId, setViendoTicketId] = useState<number | null>(null);
  const [modalSeleccionTicketOpen, setModalSeleccionTicketOpen] = useState(false);
  const [ticketsDisponibles, setTicketsDisponibles] = useState<RES_TicketIngresoDisponible[]>([]);
  const [programacionTicket, setProgramacionTicket] =
    useState<ProgramacionListItem | null>(null);
  const [idProveedorImprimiendo, setIdProveedorImprimiendo] = useState<number | null>(
    null,
  );

  const { printTicketIngreso, imprimirTicketPorProveedor } = useTicketIngresoVehiculo();

  const defaultInicio = defaultFechaInicio();
  const defaultFin = defaultFechaFin();
  const hasActiveFilters =
    fechaInicio !== defaultInicio ||
    fechaFin !== defaultFin ||
    estadoConfirmacion !== "todos" ||
    !!searchQuery;

  const cerrarModalProgramacion = () => {
    setOpenProgramar(false);
    setProgramacionAEditar(null);
  };

  const abrirNuevaProgramacion = () => {
    setProgramacionAEditar(null);
    setOpenProgramar(true);
  };

  const abrirEdicion = async (programacion: ProgramacionListItem) => {
    setEditandoId(programacion.id);
    try {
      const detalle = await ProgramarRecepcionService.getProgramacion(
        programacion.id,
      );
      setProgramacionAEditar(detalle);
      setOpenProgramar(true);
    } catch (e) {
      console.error(e);
      const axiosLike = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const backendMsg = axiosLike?.response?.data?.message;
      const fallback =
        e instanceof Error && e.message
          ? e.message
          : "No se pudo cargar la programación para editar";
      notifyError(backendMsg || fallback);
    } finally {
      setEditandoId(null);
    }
  };

  /**
   * El ticket de ingreso vehicular se muestra como PDF en otra pestaña
   * (mismo flujo que el botón de impresión de Recepción de Unidades).
   *
   * Si la unidad trae la carga de varios proveedores, primero se pregunta
   * cuál corresponde al ticket a imprimir; con uno solo se imprime directo.
   */
  const abrirTicket = async (programacion: ProgramacionListItem) => {
    setViendoTicketId(programacion.id);
    try {
      await imprimirTicketPorProveedor(programacion.id, (tickets) => {
        setProgramacionTicket(programacion);
        setTicketsDisponibles(tickets);
        setModalSeleccionTicketOpen(true);
      });
    } finally {
      setViendoTicketId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <FiltrosProgramaciones
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          estadoConfirmacion={estadoConfirmacion}
          setEstadoConfirmacion={setEstadoConfirmacion}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
        />

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {hasActiveFilters && (
            <LimpiarFiltrosButton onClick={resetFilters} />
          )}

          <RefreshButton
            onClick={fetchProgramaciones}
            loading={loading}
            label="Recargar programaciones"
          />

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconCalendarPlus size={18} />}
            onClick={abrirNuevaProgramacion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Programación
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaProgramaciones
          programaciones={programaciones}
          loading={loading}
          onEditar={abrirEdicion}
          onVerTicket={abrirTicket}
          editandoId={editandoId}
          viendoTicketId={viendoTicketId}
        />
      </Stack>

      <ProgramarRecepcionModal
        opened={openProgramar}
        onClose={cerrarModalProgramacion}
        programacion={programacionAEditar}
        onSuccess={(nueva) => {
          insertProgramacion(toListItem(nueva));
        }}
      />

      <ModalSeleccionTicketIngreso
        opened={modalSeleccionTicketOpen}
        tickets={ticketsDisponibles}
        idImprimiendo={idProveedorImprimiendo}
        onClose={() => setModalSeleccionTicketOpen(false)}
        onSelect={(ticket) => {
          if (programacionTicket) {
            setIdProveedorImprimiendo(ticket.id_proveedor);
            void printTicketIngreso(
              programacionTicket.id,
              ticket.id_guia_primer_tramo,
              ticket.id_proveedor,
            ).finally(() => setIdProveedorImprimiendo(null));
            setModalSeleccionTicketOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ProgramarRecepcionPage;
