import { useState, useMemo, useEffect } from "react";
import { Button, TextInput, Loader, Center, Text, Group, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCierreLeyes } from "../hooks/useCierreLeyes";
import { TablaCierreLeyes } from "./components/tabla-cierre-leyes";
import { ModalIniciarAnalisis } from "./components/modal-iniciar-analisis";
import type { FiltrosLotesSugeridos } from "../service/cierre-leyes.service";
import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";

const ESTADOS_LEYES_OPCIONES = [
  { value: EstadoLeyes.Pendiente, label: "Pendiente" },
  { value: EstadoLeyes.EnProceso, label: "En Proceso" },
  { value: EstadoLeyes.Confirmado, label: "Confirmado" },
  { value: "Todos", label: "Todos" },
];



// Clases reutilizables de inputs (mismo aspecto en todos los filtros)
const fieldInputClass =
  "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px] rounded-xl";

const fieldLabelClass = "text-zinc-300 mb-1 font-medium text-xs";

export const CierreLeyesPage = () => {
  useTitlePage("Cierre de Leyes");

  const ctrl = useCierreLeyes();

  const [modalIniciarAbierto, setModalIniciarAbierto] = useState(false);

  // Filtros de la TABLA de análisis (no del modal). Default = fecha actual/todos.
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoLeyes | "Todos">("Todos");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [busqueda, setBusqueda] = useState("");

  const formatDate = (date: unknown): string | null => {
    if (!date) return null;
    if (typeof date === "string") {
      const trimmed = date.trim();
      if (!trimmed) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return null;
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return null;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  const parseDateValue = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "string") {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const filtrosActuales: FiltrosLotesSugeridos = useMemo(
    () => ({
      estado: estadoFiltro,
      fechaInicio: formatDate(fechaInicio),
      fechaFin: formatDate(fechaFin),
    }),
    [estadoFiltro, fechaInicio, fechaFin],
  );

  const { cargarLotes } = ctrl;

  // Auto-apply: cualquier cambio en los filtros dispara la consulta a la tabla.
  useEffect(() => {
    void cargarLotes(filtrosActuales);
  }, [cargarLotes, filtrosActuales]);

  const handleLimpiarFiltros = () => {
    setEstadoFiltro("Todos");
    setFechaInicio(new Date());
    setFechaFin(new Date());
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

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Filtros (sin Card wrapper — sueltos en la página) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Fecha Inicio */}
        <div className="md:col-span-2">
          <DateInput
            label="Fecha Inicio"
            size="xs"
            radius="lg"
            value={fechaInicio}
            onChange={(val: unknown) => setFechaInicio(parseDateValue(val))}
            placeholder="dd/mm/aaaa"
            locale="es"
            clearable
            leftSection={<CalendarDaysIcon className="w-4 h-4 text-zinc-500" />}
            popoverProps={{ withinPortal: true }}
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div className="md:col-span-2">
          <DateInput
            label="Fecha Fin"
            size="xs"
            radius="lg"
            value={fechaFin}
            onChange={(val: unknown) => setFechaFin(parseDateValue(val))}
            placeholder="dd/mm/aaaa"
            locale="es"
            clearable
            minDate={fechaInicio && fechaInicio instanceof Date && !isNaN(fechaInicio.getTime()) ? fechaInicio : undefined}
            leftSection={<CalendarDaysIcon className="w-4 h-4 text-zinc-500" />}
            popoverProps={{ withinPortal: true }}
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Estado leyes */}
        <div className="md:col-span-2">
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
        <div className="md:col-span-3">
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

        {/* Botones: Limpiar + Agregar registro */}
        <div className="md:col-span-3 flex items-end justify-end gap-2">
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
          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={handleAbrirModal}
            radius="lg"
            size="xs"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-[38px] px-5 rounded-xl font-semibold"
          >
            Agregar registro
          </Button>
        </div>
      </div>

      <Group gap="xs" className="text-xs text-zinc-500 hidden md:flex">
        <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
        <span>Gestión y Consolidación de Leyes</span>
      </Group>

      {/* Main Grid/Table */}
      {ctrl.loading && ctrl.lotes.length === 0 ? (
        <Center className="py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader color="indigo" size="md" />
            <Text size="sm" className="text-zinc-500">Cargando datos del módulo...</Text>
          </div>
        </Center>
      ) : filteredLotes.length === 0 ? (
        <Center className="py-16">
          <div className="flex flex-col items-center gap-2 text-center">
            <Text size="sm" fw={600} className="text-zinc-400">
              No hay lotes en proceso o confirmados de leyes con los filtros actuales.
            </Text>
            <Text size="xs" className="text-zinc-600">
              Usa el botón "Agregar registro" para iniciar el análisis de un lote pendiente.
            </Text>
          </div>
        </Center>
      ) : (
        <TablaCierreLeyes
          lotes={filteredLotes}
          grupos={ctrl.grupos}
          onGuardarValor={ctrl.guardarValor}
          onAgregarAnalisis={ctrl.agregarAnalisis}
          onEliminarFila={ctrl.eliminarFila}
          onConfirmarLote={ctrl.confirmarLote}
          onActualizarOrigenFila={ctrl.actualizarOrigenFila}
          confirmandoLote={ctrl.confirmandoLote}
          agregandoAnalisisPorLote={ctrl.agregandoAnalisisPorLote}
          isGuardandoCelda={ctrl.isGuardandoCelda}
          cellKeyFn={ctrl.cellKey}
          validacionCierrePorLote={ctrl.validacionCierrePorLote}
        />
      )}

      {/* Modal para iniciar análisis — sólo muestra lotes pendientes, sin filtros propios */}
      <ModalIniciarAnalisis
        opened={modalIniciarAbierto}
        onClose={() => setModalIniciarAbierto(false)}
        onIniciarExito={() => {
          void ctrl.cargarLotes(filtrosActuales);
        }}
      />
    </div>
  );
};

export default CierreLeyesPage;
