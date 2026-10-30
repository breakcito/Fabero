import { useState, useMemo, useEffect } from "react";
import { Button, TextInput, Loader, Center, Text } from "@mantine/core";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCierreLeyes } from "../hooks/useCierreLeyes";
import { useReporteCierreLeyes } from "../hooks/useReporteCierreLeyes";
import { useReporteMuestrasExternas } from "../hooks/useReporteMuestrasExternas";
import { TablaCierreLeyes } from "./components/tabla-cierre-leyes";
import { TablaMuestrasExternas } from "./components/tabla-muestras-externas";
import { ModalAgregarGrupo } from "./components/modal-agregar-grupo";
import { ModalAgregarMuestra } from "./components/modal-agregar-muestra";
import { ModalAgregarAnalisis } from "./components/modal-agregar-analisis";
import type { FiltrosLotesSugeridos } from "../service/cierre-leyes.service";
import type { LoteCierreResponse, GrupoAnalisisLoteResponse } from "../service/cierre-leyes.responses";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { useNotify } from "../../../hooks/useNotify";

const fieldInputClass =
  "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-8 text-xs rounded-lg";

const fieldLabelClass = "text-zinc-300 mb-1 font-medium text-xs";

export const CierreLeyesPage = () => {
  useTitlePage("Cierre de Leyes", false, true);

  const ctrl = useCierreLeyes();
  const { notifyWarning } = useNotify();

  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [idLoteParaGrupo, setIdLoteParaGrupo] = useState<number | null>(null);

  const [modalMuestraAbierto, setModalMuestraAbierto] = useState(false);

  const [modalAnalisisAbierto, setModalAnalisisAbierto] = useState(false);
  const [grupoParaAnalisis, setGrupoParaAnalisis] = useState<{
    id: number;
    nombre: string;
    esMuestra?: boolean;
    maxEnsayoExistente?: number;
  } | null>(null);

  const [fechaInicio, setFechaInicio] = useState<string | null>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string | null>(defaultFechaFin());
  const [busqueda, setBusqueda] = useState("");

  const { printReporte } = useReporteCierreLeyes();
  const { printReporteMuestras } = useReporteMuestrasExternas();

  const handleImprimirGrupo = (lote: LoteCierreResponse, grupo?: GrupoAnalisisLoteResponse) => {
    const grupoAImprimir = grupo || lote.grupo_analisis;
    if (!grupoAImprimir) {
      notifyWarning("Este lote no tiene grupo de análisis para imprimir");
      return;
    }
    const loteConGrupo: LoteCierreResponse = {
      ...lote,
      grupo_analisis: grupoAImprimir,
    };
    printReporte([loteConGrupo]);
  };

  const filtrosActuales: FiltrosLotesSugeridos = useMemo(
    () => ({
      fechaInicio,
      fechaFin,
    }),
    [fechaInicio, fechaFin],
  );

  const { cargarLotes, cargarMuestras, cargarLotesSugeridos } = ctrl;

  useEffect(() => {
    void cargarLotes(filtrosActuales);
  }, [cargarLotes, filtrosActuales]);

  useEffect(() => {
    void cargarMuestras();
    void cargarLotesSugeridos();
  }, [cargarMuestras, cargarLotesSugeridos]);

  const handleLimpiarFiltros = () => {
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setBusqueda("");
  };

  const filteredLotes = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return ctrl.lotes;
    return ctrl.lotes.filter((l) => l.correlativo.toLowerCase().includes(q));
  }, [ctrl.lotes, busqueda]);

  const obtenerMaxEnsayoGrupo = (idGrupo: number): number => {
    for (const lote of ctrl.lotes) {
      const grupos =
        lote.grupos_analisis && lote.grupos_analisis.length > 0
          ? lote.grupos_analisis
          : lote.grupo_analisis
          ? [lote.grupo_analisis]
          : [];
      const encontrado = grupos.find((g) => g.id === idGrupo);
      if (encontrado && encontrado.analisis.length > 0) {
        return encontrado.analisis.reduce((max, a) => Math.max(max, a.numero_ensayo), 0);
      }
    }
    return 0;
  };

  const obtenerMaxEnsayoMuestra = (idMuestra: number): number => {
    const encontrada = ctrl.muestras.find((m) => m.id === idMuestra || m.id_muestra_externa === idMuestra);
    if (encontrada && encontrada.analisis.length > 0) {
      return encontrada.analisis.reduce((max, a) => Math.max(max, a.numero_ensayo), 0);
    }
    return 0;
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end justify-between">
        <div className="flex items-end gap-2.5 flex-wrap flex-1">
          <div className="w-80 min-w-72">
            <DateRangeFilter
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              onFechaInicioChange={setFechaInicio}
              onFechaFinChange={setFechaFin}
            />
          </div>

          <div className="w-48 min-w-40">
            <TextInput
              label="Buscar"
              placeholder="Código de lote (ej: FB-001)..."
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

          <div className="flex items-center gap-1.5 pb-0.5">
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
            <RefreshButton
              onClick={() => {
                void cargarLotes(filtrosActuales);
                void cargarMuestras();
              }}
              loading={ctrl.loading || ctrl.loadingMuestras}
              label="Recargar"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pb-0.5 self-end lg:self-end">
          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={() => {
              setIdLoteParaGrupo(null);
              setModalGrupoAbierto(true);
            }}
            radius="lg"
            size="xs"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 font-semibold"
          >
            Agregar Grupo
          </Button>

          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={() => setModalMuestraAbierto(true)}
            variant="light"
            color="cyan"
            radius="lg"
            size="xs"
            className="font-semibold"
          >
            Agregar Muestra
          </Button>
        </div>
      </div>

      {/* Tabla Principal de Lotes */}
      {ctrl.loading && ctrl.lotes.length === 0 ? (
        <Center className="py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader color="indigo" size="md" />
            <Text size="sm" className="text-zinc-500">Cargando datos de leyes...</Text>
          </div>
        </Center>
      ) : filteredLotes.length === 0 && ctrl.muestras.length === 0 ? (
        <Center className="py-16">
          <div className="flex flex-col items-center gap-2 text-center">
            <Text size="sm" fw={600} className="text-zinc-400">
              No hay lotes con los filtros seleccionados.
            </Text>
            <Text size="xs" className="text-zinc-600">
              Usa los botones superiores para "Agregar Grupo" o "Agregar Muestra".
            </Text>
          </div>
        </Center>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Text fz="xs" fw={700} c="zinc.4" tt="uppercase" className="tracking-wider">
              Lotes de Mineral ({filteredLotes.length})
            </Text>
            <TablaCierreLeyes
              lotes={filteredLotes}
              onGuardarValoresAnalisis={ctrl.guardarValoresAnalisis}
              onGuardarLeyesCierreGrupo={ctrl.guardarLeyesCierreGrupo}
              onEliminarAnalisis={ctrl.eliminarAnalisis}
              eliminandoAnalisis={ctrl.eliminandoAnalisis}
              onAbrirModalCrearGrupo={(idLote) => {
                setIdLoteParaGrupo(idLote);
                setModalGrupoAbierto(true);
              }}
              onAbrirModalAgregarAnalisis={(idGrupo, nombre) => {
                setGrupoParaAnalisis({
                  id: idGrupo,
                  nombre,
                  esMuestra: false,
                  maxEnsayoExistente: obtenerMaxEnsayoGrupo(idGrupo),
                });
                setModalAnalisisAbierto(true);
              }}
              onSubirDocumentos={ctrl.subirDocumentos}
              muestrasAsociadasPorGrupo={ctrl.muestrasAsociadasPorGrupo}
              onCargarMuestrasAsociadas={ctrl.cargarMuestrasAsociadas}
              onImprimirGrupo={handleImprimirGrupo}
              onConfirmarLote={ctrl.confirmarLote}
              confirmandoLote={ctrl.confirmandoLote}
              onAsociarMuestrasMultiples={ctrl.asociarMuestrasMultiplesAGrupo}
              onAsociarAGrupo={ctrl.asociarMuestraAGrupo}
            />
          </div>

          {ctrl.muestras.length > 0 && (
            <div className="space-y-2 pt-4">
              <Text fz="xs" fw={700} c="cyan.4" tt="uppercase" className="tracking-wider">
                Muestras Externas Sin Lote ({ctrl.muestras.length})
              </Text>
              <TablaMuestrasExternas
                muestras={ctrl.muestras}
                lotesDisponibles={ctrl.lotes}
                onGuardarValoresAnalisis={ctrl.guardarValoresAnalisis}
                onAbrirModalAgregarAnalisis={(idMuestra, nombre) => {
                  setGrupoParaAnalisis({
                    id: idMuestra,
                    nombre,
                    esMuestra: true,
                    maxEnsayoExistente: obtenerMaxEnsayoMuestra(idMuestra),
                  });
                  setModalAnalisisAbierto(true);
                }}
                onEliminarAnalisis={ctrl.eliminarAnalisis}
                eliminandoAnalisis={ctrl.eliminandoAnalisis}
                onAsociarAGrupo={ctrl.asociarMuestraAGrupo}
                onAsociarMuestrasMultiples={ctrl.asociarMuestrasMultiplesAGrupo}
                onSubirDocumentos={ctrl.subirDocumentos}
                isAsociando={(id) => Boolean(ctrl.asociandoMuestra[id])}
                onImprimirMuestra={(m) => printReporteMuestras([m])}
                onImprimirMuestras={(ms) => printReporteMuestras(ms)}
              />
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <ModalAgregarGrupo
        opened={modalGrupoAbierto}
        onClose={() => setModalGrupoAbierto(false)}
        idLoteInicial={idLoteParaGrupo}
        ctrl={ctrl}
      />

      <ModalAgregarMuestra
        opened={modalMuestraAbierto}
        onClose={() => setModalMuestraAbierto(false)}
        ctrl={ctrl}
      />

      {grupoParaAnalisis && (
        <ModalAgregarAnalisis
          opened={modalAnalisisAbierto}
          onClose={() => {
            setModalAnalisisAbierto(false);
            setGrupoParaAnalisis(null);
          }}
          idGrupo={grupoParaAnalisis.id}
          nombreGrupo={grupoParaAnalisis.nombre}
          esMuestra={grupoParaAnalisis.esMuestra}
          maxEnsayoExistente={grupoParaAnalisis.maxEnsayoExistente}
          ctrl={ctrl}
        />
      )}
    </div>
  );
};
