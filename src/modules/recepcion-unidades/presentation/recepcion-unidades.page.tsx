import { Stack } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepciones } from "../hooks/useRecepciones";
import { Filtros } from "./components/filtros";
import { TablaRecepciones } from "./components/tabla-recepciones";
import { ConfirmarProgramacionModal } from "./components/confirmar-programacion-modal";
import { ModalEditarObservacion, type CampoObservacion } from "./components/modal-editar-observacion";
import { ModalEditarGuias } from "./components/modal-editar-guias";
import { ModalEditarGuiasSalida } from "./components/modal-editar-guias-salida";
import { ModalEditarFechas } from "./components/modal-editar-fechas";
import { ModalGestionarEvidencias } from "./components/modal-gestionar-evidencias";
import { ModalEditarCampoUnidad, type GrupoEdicion } from "./components/modal-editar-campo-unidad";
import { ModalVerHistorial } from "./components/modal-ver-historial";
import { Boton } from "../../../presentation/utils/ui-tsx";
import { useEffect, useMemo, useState } from "react";
import { IconFilter, IconPlus, IconRefresh, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import {
  ProgramarRecepcionService,
} from "../../programar-recepcion/service/programar-recepcion.service";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";

export const RecepcionUnidadesPage = () => {
  useTitlePage("Recepción de Unidades", true);

  const {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    empresas,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
    clearTextFilterAndSearch,
    fetchRecepciones,
  } = useRecepciones();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [programacionAConfirmar, setProgramacionAConfirmar] =
    useState<RecepcionUnidadResponse | null>(null);
  const [programacionConfirmadaFull, setProgramacionConfirmadaFull] =
    useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAEditar, setRecepcionAEditar] = useState<{
    recepcion: RecepcionUnidadResponse;
    campo: CampoObservacion;
  } | null>(null);
  const [recepcionAEvidencias, setRecepcionAEvidencias] =
    useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAVerHistorial, setRecepcionAVerHistorial] =
    useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAGuias, setRecepcionAGuias] =
    useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAGuiasSalida, setRecepcionAGuiasSalida] =
    useState<RecepcionUnidadResponse | null>(null);

  /** Edición de la fecha y hora de ingreso o de salida. */
  const [recepcionAFecha, setRecepcionAFecha] = useState<{
    recepcion: RecepcionUnidadResponse;
    campo: "fecha_hora_ingreso" | "fecha_hora_salida";
  } | null>(null);

  // Edición por columna (vehículo / transportista / conductor / proveedor).
  const [campoAEditar, setCampoAEditar] = useState<{
    recepcion: RecepcionUnidadResponse;
    grupo: GrupoEdicion;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (programacionAConfirmar) {
        try {
          const full = await ProgramarRecepcionService.getProgramacion(
            programacionAConfirmar.id,
          );
          if (cancelado) return;
          const merged: RecepcionUnidadResponse = {
            ...programacionAConfirmar,
            id_vehiculo: full.id_vehiculo,
            vehiculo_placa: full.vehiculo_placa,
            id_tipo_vehiculo: full.id_tipo_vehiculo,
            tipo_vehiculo_nombre: full.tipo_vehiculo_nombre,
            id_conductor: full.id_conductor,
            conductor_nombre_completo: full.conductor_nombre_completo,
            conductor_dni: full.conductor_dni,
            conductor_numero_licencia: full.conductor_numero_licencia,
            id_sucursal: full.id_sucursal,
            fecha_hora_inicio_pesaje: full.fecha_hora_inicio_pesaje,
            fecha_hora_final_pesaje: full.fecha_hora_final_pesaje,
            estado: full.estado,
            fecha_hora_ingreso: full.fecha_hora_ingreso,
            guias: full.guias ?? programacionAConfirmar.guias ?? [],
            guias_salida: full.guias_salida ?? programacionAConfirmar.guias_salida ?? [],
            estado_ingreso: full.estado_ingreso ?? programacionAConfirmar.estado_ingreso ?? null,
            proveedores: full.proveedores ?? programacionAConfirmar.proveedores ?? [],
            guia_remitente: full.guia_remitente,
            guia_transportista: full.guia_transportista,
            documentos_programacion:
              full.documentos_programacion ??
              programacionAConfirmar.documentos_programacion ??
              null,
            evidencias: [],
            visita: full.visita as RecepcionUnidadResponse["visita"],
          };
          setProgramacionConfirmadaFull(merged);
        } catch {
          if (cancelado) return;
          setProgramacionConfirmadaFull(programacionAConfirmar);
        }
      } else {
        setProgramacionConfirmadaFull(null);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [programacionAConfirmar]);

  // Memoizar la prop del modal para estabilizar su referencia y evitar re-renders innecesarios.
  const programacionParaModal = useMemo(
    () => programacionConfirmadaFull ?? programacionAConfirmar,
    [programacionConfirmadaFull, programacionAConfirmar],
  );

  const hasActiveFilters =
    filters.fecha_inicio !== defaultFechaInicio() ||
    filters.fecha_fin !== defaultFechaFin() ||
    !!filters.placa ||
    filters.id_empresa_transporte !== undefined;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Barra de acciones: filtros, recarga y nueva recepción */}
      <div className="flex flex-wrap items-center gap-2">
        <Boton
          variante={filtrosAbiertos || hasActiveFilters ? "primario" : "secundario"}
          onClick={() => setFiltrosAbiertos((v) => !v)}
          className="h-11 border-zinc-700 bg-zinc-800/80 px-4 text-zinc-100 hover:bg-zinc-700/80"
        >
          <IconFilter size={18} />
          Aplicar filtros
          {/* El chevron indica que el panel se despliega u oculta. */}
          {filtrosAbiertos ? (
            <IconChevronUp size={18} className="text-indigo-200" />
          ) : (
            <IconChevronDown size={18} className="text-zinc-400" />
          )}
        </Boton>

        {hasActiveFilters ? (
          <Boton
            variante="fantasma"
            onClick={clearFilters}
            className="h-11 px-4 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Quitar filtros
          </Boton>
        ) : null}

        <Boton
          variante="secundario"
          onClick={() => void fetchRecepciones()}
          cargando={loading}
          className="h-11 border-zinc-700 bg-zinc-800/80 px-4 text-zinc-100 hover:bg-zinc-700/80"
        >
          <IconRefresh size={18} />
          Recargar
        </Boton>

        <button
          type="button"
          onClick={() => setOpenRegistro(true)}
          className="ml-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 font-semibold text-white shadow-lg shadow-indigo-900/20 transition-colors hover:bg-indigo-700"
        >
          <IconPlus size={18} />
          <span className="truncate">Nueva Recepción</span>
        </button>
      </div>

      {filtrosAbiertos ? (
        <Filtros
          filters={filters}
          handleFilterChange={handleFilterChange}
          empresas={empresas}
          onClearTextFilter={clearTextFilterAndSearch}
        />
      ) : null}

      <Stack gap="md">
        <TablaRecepciones
          recepciones={recepciones}
          loading={loading}
          onUpdateRecepcion={updateRecepcion}
          onConfirmarProgramacion={(r) => setProgramacionAConfirmar(r)}
          onEditarObservacionEvidencias={(r, campo) =>
            setRecepcionAEditar({ recepcion: r, campo })
          }
          onGestionarEvidencias={(r) => setRecepcionAEvidencias(r)}
          onVerHistorial={(r) => setRecepcionAVerHistorial(r)}
          onEditarCampo={(r, grupo) => setCampoAEditar({ recepcion: r, grupo })}
          onEditarGuias={(r) => setRecepcionAGuias(r)}
          onEditarGuiasSalida={(r) => setRecepcionAGuiasSalida(r)}
          onEditarFecha={(r, campo) => setRecepcionAFecha({ recepcion: r, campo })}
        />
      </Stack>

      <ConfirmarProgramacionModal
        opened={openRegistro}
        programacion={null}
        onClose={() => setOpenRegistro(false)}
        onConfirmada={(nueva) => {
          insertRecepcion(nueva);
          setOpenRegistro(false);
        }}
      />

      <ConfirmarProgramacionModal
        opened={!!programacionAConfirmar}
        programacion={programacionParaModal}
        onClose={() => {
          setProgramacionAConfirmar(null);
          setProgramacionConfirmadaFull(null);
        }}
        onConfirmada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalEditarObservacion
        opened={!!recepcionAEditar}
        recepcion={recepcionAEditar?.recepcion ?? null}
        campo={recepcionAEditar?.campo ?? "observacion"}
        onClose={() => setRecepcionAEditar(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalGestionarEvidencias
        opened={!!recepcionAEvidencias}
        recepcion={recepcionAEvidencias}
        onClose={() => setRecepcionAEvidencias(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalVerHistorial
        opened={!!recepcionAVerHistorial}
        recepcion={recepcionAVerHistorial}
        onClose={() => setRecepcionAVerHistorial(null)}
      />

      <ModalEditarCampoUnidad
        opened={!!campoAEditar}
        recepcion={campoAEditar?.recepcion ?? null}
        grupo={campoAEditar?.grupo ?? "vehiculo"}
        onClose={() => setCampoAEditar(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalEditarGuias
        opened={!!recepcionAGuias}
        recepcion={recepcionAGuias}
        onClose={() => setRecepcionAGuias(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalEditarGuiasSalida
        opened={!!recepcionAGuiasSalida}
        recepcion={recepcionAGuiasSalida}
        onClose={() => setRecepcionAGuiasSalida(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalEditarFechas
        opened={!!recepcionAFecha}
        recepcion={recepcionAFecha?.recepcion ?? null}
        campo={recepcionAFecha?.campo ?? "fecha_hora_ingreso"}
        onClose={() => setRecepcionAFecha(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />
    </div>
  );
};

export default RecepcionUnidadesPage;
