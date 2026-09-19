import { useState, useEffect, useCallback } from "react";
import { Grid, Paper, Text, Group, Center, Loader, Stack, Badge, ActionIcon, Tooltip } from "@mantine/core";
import { IconScale, IconChecklist, IconCheck } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { useRecepcionMineral } from "../hooks/useRecepcionMineral";
import { AuxService } from "../../../service/auxiliar.service";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ModalPesoInicial } from "./components/modal-peso-inicial";
import { ModalPesoFinal } from "./components/modal-peso-final";
import { ModalCondicionIngreso } from "./components/modal-condicion-ingreso";
import { CardProcesoBalanza } from "./components/card-proceso-balanza";
import { CardDistribucionBalanza } from "./components/card-distribucion-balanza";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_Empresa } from "../../../service/responses/empresa";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type {
  RES_LoteMineral,
  RES_ParticionBalanza,
} from "../service/recepcion-mineral.responses";
import type {
  DTO_PesoInicialParticion,
  DTO_PesoFinalParticion,
} from "../service/recepcion-mineral.requests";
import { useTicketBalanza } from "../hooks/useTicketBalanza";
import { useNotify } from "../../../hooks/useNotify";

export const RecepcionMineralPage = () => {
  useTitlePage("Recepción de Mineral", true);

  const { printTicketBalanza, printTicketBalanzaParticion } = useTicketBalanza();
  const { notifyError, notifySuccess } = useNotify();

  const {
    sinPesarList,
    enProcesoList,
    loading,
    setSelectedRecepcion,
    validarCampo,
    deletingLoteId,
    closingProcesoId,
    iniciarProceso,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    actualizarDetalleDistribucion,
    cerrarProceso,
    loadRecepciones,
    lotesPadreParticionados,
    particionesByLote,
    loadingParticionesByLote,
    deletingParticionId,
    finalizandoLoteId,
    crearParticion,
    eliminarParticion,
    finalizarParticionLote,
    refreshParticionesLote,
    refreshLotesPadreParticionados,
    getLotesYParticionesDeUnidad,
    canCloseProcesoRecepcion,
  } = useRecepcionMineral();

  const getFullPlaca = (placa: string | null) => {
    return placa || "SIN PLACA";
  };

  // Catálogos para el panel de la unidad (izquierda) y modal de lote
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresasTitulares, setEmpresasTitulares] = useState<RES_Empresa[]>([]);


  // Modales
  const [activeLotePesoInicial, setActiveLotePesoInicial] = useState<RES_LoteMineral | null>(null);
  const [activeLotePesoFinal, setActiveLotePesoFinal] = useState<RES_LoteMineral | null>(null);

  // Modal para condición de ingreso de lote
  const [condicionModalOpen, setCondicionModalOpen] = useState(false);
  const [selectedRecepcionIdForLote, setSelectedRecepcionIdForLote] = useState<number | null>(null);

  // Modal de partición (peso inicial o final) — reusan los modales de lote
  // pasando el id de la partición vía `targetIdOverride`.
  const [activeParticionPesoInicial, setActiveParticionPesoInicial] = useState<{
    particion: RES_ParticionBalanza;
    lotePadre: RES_LoteMineral;
  } | null>(null);
  const [activeParticionPesoFinal, setActiveParticionPesoFinal] = useState<{
    particion: RES_ParticionBalanza;
    lotePadre: RES_LoteMineral;
  } | null>(null);

  // Drop state: id de la unidad sobre la que se está arrastrando un card del lote padre.
  const [dragOverRecepcionId, setDragOverRecepcionId] = useState<number | null>(null);

  // Carga perezosa de particiones para cada lote padre que aparece en el header.
  // Incluye también los padres ya finalizados: sus particiones hijas deben
  // seguir visibles hasta cerrar el proceso de cada unidad. El card del padre
  // en el header global se oculta vía `lotesPadreActivos` (línea ~315).
  useEffect(() => {
    lotesPadreParticionados.forEach((padre) => {
      const cached = particionesByLote[padre.id];
      const loading = loadingParticionesByLote[padre.id];
      if (!cached && !loading) {
        void refreshParticionesLote(padre.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotesPadreParticionados.length]);

  // Handler del drop: se dispara a nivel window porque el onDragOver/onDrop del
  // card-proceso-balanza no tiene acceso directo al id del lote padre que se arrastra.
  // Usamos window.addEventListener porque el drop ocurre sobre el card de la unidad,
  // pero el evento se propaga al window.
  useEffect(() => {
    const onWindowDragOver = (e: DragEvent) => {
      const hasLoteType = e.dataTransfer?.types.includes(
        "application/lote-particionar",
      );
      console.log("[DRAG-DIAG] window.dragover", {
        hasLoteType,
        targetTag: (e.target as HTMLElement | null)?.tagName,
        types: e.dataTransfer ? Array.from(e.dataTransfer.types) : null,
      });
      if (hasLoteType) {
        e.preventDefault();
      }
    };
    const onWindowDrop = (e: DragEvent) => {
      const idLoteStr = e.dataTransfer?.getData("application/lote-particionar");
      const target = e.target as HTMLElement | null;
      const hasLoteType = e.dataTransfer?.types.includes(
        "application/lote-particionar",
      );
      console.log("[DRAG-DIAG] window.drop", {
        idLoteStr,
        hasLoteType,
        targetTag: target?.tagName,
        targetClasses: target?.className,
        unidadCardFound: !!target?.closest("[data-unidad-id]"),
        unidadCardId: target?.closest("[data-unidad-id]")?.getAttribute("data-unidad-id"),
      });
      // Buscamos el card de unidad ancestor del target.
      const unidadCard = target?.closest("[data-unidad-id]");
      if (idLoteStr && unidadCard) {
        e.preventDefault();
        const idRecepcion = Number(unidadCard.getAttribute("data-unidad-id"));
        const idLote = Number(idLoteStr);
        if (idRecepcion && idLote) {
          // Datos para el modal de confirmación.
          const lotePadre = lotesPadreParticionados.find((l) => l.id === idLote);
          const unidadDestino = enProcesoList.find(
            (r) => r.id === idRecepcion,
          );
          const placaDestino =
            unidadDestino && typeof unidadDestino.vehiculo_placa === "string"
              ? unidadDestino.vehiculo_placa
              : null;
          console.log("[DRAG-DIAG] window.drop -> llamando a mostrarConfirmacion", {
            idLote,
            idRecepcion,
            lotePadreCorrelativo: lotePadre?.correlativo,
            placaDestino,
          });
          const modalId = mostrarConfirmacion({
            title: "Crear Partición",
            message: (
              <>
                ¿Crear una nueva partición del lote{" "}
                <strong className="text-indigo-400">
                  {lotePadre?.correlativo ?? `#${idLote}`}
                </strong>{" "}
                en la unidad{" "}
                <strong className="text-indigo-400">
                  {placaDestino ?? `#${idRecepcion}`}
                </strong>
                ?
              </>
            ),
            confirmLabel: "Crear Partición",
            cancelLabel: "Cancelar",
            onConfirm: () => {
              console.log("[DRAG-DIAG] onConfirm -> crearParticion", { idLote, idRecepcion });
              void crearParticion(idLote, idRecepcion);
            },
          });
          console.log("[DRAG-DIAG] mostrarConfirmacion devolvió modalId", { modalId });
        }
      }
      setDragOverRecepcionId(null);
    };
    console.log("[DRAG-DIAG] useEffect -> registrando listeners window");
    window.addEventListener("dragover", onWindowDragOver);
    window.addEventListener("drop", onWindowDrop);
    return () => {
      console.log("[DRAG-DIAG] useEffect cleanup -> removiendo listeners");
      window.removeEventListener("dragover", onWindowDragOver);
      window.removeEventListener("drop", onWindowDrop);
    };
  }, [crearParticion, enProcesoList, lotesPadreParticionados]);

  /**
   * Refresca la cache de particiones del lote padre al que pertenece una partición
   * recién pesada. Helper interno.
   */
  const refreshParticionesDeParticion = useCallback(
    (idParticion: number) => {
      for (const [idLoteStr, parts] of Object.entries(particionesByLote)) {
        if (parts.some((p) => p.id === idParticion)) {
          void refreshParticionesLote(Number(idLoteStr));
          return;
        }
      }
    },
    [particionesByLote, refreshParticionesLote],
  );

  /**
   * Handler para registrar el PESO INICIAL de una partición. Reusa el endpoint
   * `registrar_peso_inicial_particion` y refresca la cache. NO persiste
   * campos no-peso (eso se hace por separado con `actualizarCamposNoPeso`
   * si fuera necesario en el futuro).
   */
  const handleParticionPesoInicial = useCallback(
    async (idParticion: number, dto: DTO_PesoInicialParticion): Promise<void> => {
      try {
        const updated =
          await RecepcionMineralService.registrar_peso_inicial_particion(
            idParticion,
            dto,
          );
        notifySuccess("Peso inicial registrado correctamente");
        refreshParticionesDeParticion(idParticion);
        await refreshLotesPadreParticionados();
        if (updated.id_ticket_balanza !== null) {
          printTicketBalanzaParticion(updated.id);
        }
      } catch (e) {
        console.error(e);
        notifyError("No se pudo registrar el peso inicial de la partición");
      }
    },
    [
      notifyError,
      notifySuccess,
      printTicketBalanzaParticion,
      refreshParticionesDeParticion,
      refreshLotesPadreParticionados,
    ],
  );

  /**
   * Handler para registrar el PESO FINAL de una partición. Análogo al handler
   * de peso inicial.
   */
  const handleParticionPesoFinal = useCallback(
    async (idParticion: number, dto: DTO_PesoFinalParticion): Promise<void> => {
      try {
        const updated =
          await RecepcionMineralService.registrar_peso_final_particion(
            idParticion,
            dto,
          );
        notifySuccess("Peso final registrado correctamente");
        refreshParticionesDeParticion(idParticion);
        await refreshLotesPadreParticionados();
        if (updated.id_ticket_balanza !== null) {
          printTicketBalanzaParticion(updated.id);
        }
      } catch (e) {
        console.error(e);
        notifyError("No se pudo registrar el peso final de la partición");
      }
    },
    [
      notifyError,
      notifySuccess,
      printTicketBalanzaParticion,
      refreshParticionesDeParticion,
      refreshLotesPadreParticionados,
    ],
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [resEmp, resTipos, resVeh, resCond, resEmpTit] = await Promise.all([
          AuxService.get_empresas_transporte(),
          AuxService.get_tipos_vehiculo(),
          AuxService.get_vehiculos(),
          AuxService.get_conductores(),
          AuxService.get_empresas(),
        ]);
        if (isMounted) {
          setEmpresas(resEmp);
          setTiposVehiculo(resTipos);
          setVehiculos(resVeh);
          setConductores(resCond);
          if (resEmpTit?.data) {
            setEmpresasTitulares(resEmpTit.data);
          }
        }
      } catch (e) {
        console.error("Error al cargar catálogos para edición", e);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const unidadesAOperar = enProcesoList;

  // Solo se renderizan los lotes padre que aún no fueron finalizados. Si el
  // backend sigue trayendo al padre finalizado en `get_lotes_padre_particionados`,
  // este filtro evita que su card vuelva a aparecer en el header global.
  const lotesPadreActivos = lotesPadreParticionados.filter(
    (p) => !p.particion_finalizada,
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {loading && (
        <Center className="py-12">
          <Loader color="indigo" size="md" />
        </Center>
      )}

      {!loading && (
        <>
          <Grid columns={24} gutter="md">
          {/* Lateral Izquierdo: Unidades en Planta (Sin Pesar) */}
          <Grid.Col span={{ base: 24, sm: 8, md: 6, lg: 5 }}>
            <Paper
              radius="lg"
              p="md"
              className="bg-zinc-950/40 border border-zinc-900/80 min-h-125 h-full flex flex-col gap-4"
            >
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconChecklist
                    size={18}
                    className="text-indigo-400 shrink-0"
                  />
                  <Text
                    size="sm"
                    fw={700}
                    className="text-zinc-100 truncate"
                    title="Unidades en Planta"
                  >
                    Unidades en Planta
                  </Text>
                </div>
                <RefreshButton
                  onClick={loadRecepciones}
                  loading={loading}
                  label="Recargar unidades"
                />
              </div>

              <Stack gap="sm" className="flex-1 overflow-y-auto pr-1">
                {sinPesarList.length === 0 ? (
                  <Center className="h-40 flex-col gap-2">
                    <Text size="xs" c="dimmed" ta="center">
                      No hay unidades pendientes de pesaje en esta sucursal.
                    </Text>
                  </Center>
                ) : (
                  sinPesarList.map((ru) => {
                    const formatFechaHora = (
                      s: string | null | undefined,
                    ): { fecha: string; hora: string } => {
                      if (!s) return { fecha: "---", hora: "---" };
                      const d = new Date(s);
                      if (isNaN(d.getTime()))
                        return { fecha: "---", hora: "---" };
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      return {
                        fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
                        hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
                      };
                    };
                    const { fecha: formattedDate, hora: formattedTime } =
                      formatFechaHora(ru.fecha_hora_ingreso);

                    return (
                      <Paper
                        key={ru.id}
                        data-unidad-id={ru.id}
                        radius="lg"
                        p={0}
                        onClick={() => {
                          if (ru.estado_pesaje === "Sin Pesar") {
                            mostrarConfirmacion({
                              title: "Confirmar Inicio de Pesaje",
                              confirmLabel: "Iniciar",
                              cancelLabel: "Cancelar",
                              message: (
                                <>
                                  ¿Desea iniciar el proceso de pesaje para la
                                  unidad con placa{" "}
                                  <strong className="text-indigo-400">
                                    "
                                    {getFullPlaca(ru.vehiculo_placa)}
                                    "
                                  </strong>
                                  ?
                                </>
                              ),
                              onConfirm: () => {
                                iniciarProceso(ru.id);
                              },
                            });
                          } else {
                            setSelectedRecepcion(ru);
                          }
                        }}
                        className={`cursor-pointer border transition-all duration-200 select-none overflow-hidden flex flex-col relative bg-zinc-950/30 border-zinc-900/80 `}
                      >
                        {/* Header: Placa + Badge tipo ingreso */}
                        <div
                          className={`py-2 px-3 font-bold text-xs tracking-wider font-mono uppercase bg-zinc-800 text-zinc-300`}
                        >
                          <Group justify="space-between" align="center" gap={6} wrap="nowrap">
                            <span className="truncate">
                              {getFullPlaca(ru.vehiculo_placa)}
                            </span>
                            <Badge
                              size="xs"
                              variant="filled"
                              radius="sm"
                              color={
                                ru.tipo_ingreso === "Despacho de Mineral"
                                  ? "yellow"
                                  : "teal"
                              }
                            >
                              {ru.tipo_ingreso === "Despacho de Mineral"
                                ? "Despacho"
                                : "Recepción"}
                            </Badge>
                          </Group>
                        </div>

                        {/* Body: Fechas */}
                        <div className="p-3 space-y-1.5 bg-zinc-900/10">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">
                              Fecha Ingreso
                            </span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">
                              Hora Ingreso
                            </span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Área Central: Proceso de Pesaje y Lotes */}
          <Grid.Col span={{ base: 24, sm: 16, md: 18, lg: 19 }}>
            <Paper
              radius="lg"
              p="md"
              className="bg-zinc-950/40 border border-zinc-900/80 min-h-125 h-full flex flex-col gap-4 "
            >
              {/* Header GLOBAL: agrupa el título y los cards de lotes padre particionados */}
              <div className="flex items-center gap-2 flex-wrap">
                <Text size="md" fw={700} className="text-zinc-200">
                  Proceso Pesaje 
                </Text>
                {lotesPadreActivos.length > 0 && (
                  <Group gap={4} wrap="wrap">
                    {lotesPadreActivos.map((padre) => {
                      const sinPesar = padre.particiones_sin_peso_final;
                      const total = padre.total_particiones;
                      const puedeFinalizar = sinPesar === 0 && total > 0;
                      const tooltipFinalizar = puedeFinalizar
                        ? "Todas las particiones están pesadas. Click para sumar pesos y finalizar."
                        : `No se puede finalizar: ${sinPesar} partición(es) sin pesar.`;
                      const isFinalizando = finalizandoLoteId === padre.id;
                      return (
                        <Paper
                          key={padre.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData(
                              "application/lote-particionar",
                              String(padre.id),
                            );
                          }}
                          onDragEnd={() => setDragOverRecepcionId(null)}
                          className="bg-linear-to-br from-indigo-950/40 to-zinc-900/40 border border-indigo-800/60 cursor-grab active:cursor-grabbing select-none transition-all hover:border-indigo-400 shadow-sm"
                        >
                          <Group gap={4} wrap="nowrap" className="px-2 py-1">
                            <Badge
                              variant="light"
                              color="indigo"
                              size="xs"
                              radius="sm"
                              className="font-mono font-bold text-[10px]"
                            >
                              {padre.correlativo}
                            </Badge>
                            <Tooltip label={tooltipFinalizar} withArrow>
                              <ActionIcon
                                color={puedeFinalizar ? "green" : "zinc"}
                                variant={puedeFinalizar ? "filled" : "subtle"}
                                radius="md"
                                size="sm"
                                loading={isFinalizando}
                                disabled={!puedeFinalizar || isFinalizando}
                                onClick={() => finalizarParticionLote(padre.id, total)}
                                className={
                                  puedeFinalizar
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "text-zinc-600"
                                }
                                aria-label="Finalizar lote particionado"
                              >
                                <IconCheck size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Group>
                )}
              </div>

              {/* Contenido Dinámico */}
              {unidadesAOperar.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center py-12 gap-3">
                  <IconScale size={48} className="text-zinc-600 stroke-[1.5]" />
                  <Text size="sm" c="dimmed" ta="center">
                    Ningún proceso de pesaje activo. Seleccione una unidad del
                    listado izquierdo para iniciar su pesaje.
                  </Text>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-8 overflow-y-auto min-h-0 pr-2">
                  {unidadesAOperar.map((ru) => {
                    const esDespacho = ru.tipo_ingreso === "Despacho de Mineral";
                    if (esDespacho) {
                      return (
                        <CardDistribucionBalanza
                          key={ru.id}
                          ru={ru}
                          onDetalleUpdated={(actualizado) => {
                            actualizarDetalleDistribucion(ru.id, actualizado);
                          }}
                          cerrarProceso={cerrarProceso}
                          closingProcesoId={closingProcesoId}
                        />
                      );
                    }
                    return (
                      <CardProcesoBalanza
                        key={ru.id}
                        ru={ru}
                        empresas={empresas}
                        tiposVehiculo={tiposVehiculo}
                        vehiculos={vehiculos}
                        conductores={conductores}
                        setSelectedRecepcionIdForLote={
                          setSelectedRecepcionIdForLote
                        }
                        setCondicionModalOpen={setCondicionModalOpen}
                        deletingLoteId={deletingLoteId}
                        closingProcesoId={closingProcesoId}
                        validarCampo={validarCampo}
                        eliminarLote={eliminarLote}
                        printTicketBalanza={printTicketBalanza}
                        printTicketBalanzaParticion={printTicketBalanzaParticion}
                        setActiveLotePesoInicial={setActiveLotePesoInicial}
                        setActiveLotePesoFinal={setActiveLotePesoFinal}
                        setActiveParticionPesoInicial={(p, lote) =>
                          setActiveParticionPesoInicial({
                            particion: p,
                            lotePadre: lote,
                          })
                        }
                        setActiveParticionPesoFinal={(p, lote) =>
                          setActiveParticionPesoFinal({
                            particion: p,
                            lotePadre: lote,
                          })
                        }
                        cerrarProceso={cerrarProceso}
                        deletingParticionId={deletingParticionId}
                        eliminarParticion={eliminarParticion}
                        isDragOver={dragOverRecepcionId === ru.id}
                        onDragOverRecepcion={(id: number) =>
                          setDragOverRecepcionId(id)
                        }
                        onDragLeaveRecepcion={() => setDragOverRecepcionId(null)}
                        getLotesYParticionesDeUnidad={getLotesYParticionesDeUnidad}
                        canCloseProcesoRecepcion={canCloseProcesoRecepcion}
                      />
                    );
                  })}
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
        </>
      )}

      {/* Modal: Peso Inicial de PARTICIÓN — reutiliza ModalPesoInicial pasando
          el id de la partición vía `targetIdOverride`. */}
      {activeParticionPesoInicial && (
        <ModalEstandar
          opened={!!activeParticionPesoInicial}
          close={() => setActiveParticionPesoInicial(null)}
          title={`Peso Inicial: ${activeParticionPesoInicial.particion.correlativo}`}
          size="lg"
        >
          <ModalPesoInicial
            lote={activeParticionPesoInicial.lotePadre}
            targetIdOverride={activeParticionPesoInicial.particion.id}
            onCancel={() => setActiveParticionPesoInicial(null)}
            onSubmit={handleParticionPesoInicial}
          />
        </ModalEstandar>
      )}

      {/* Modal: Peso Final de PARTICIÓN — reutiliza ModalPesoFinal pasando
          el id de la partición vía `targetIdOverride`. */}
      {activeParticionPesoFinal && (
        <ModalEstandar
          opened={!!activeParticionPesoFinal}
          close={() => setActiveParticionPesoFinal(null)}
          title={`Peso Final: ${activeParticionPesoFinal.particion.correlativo}`}
          size="xl"
        >
          <ModalPesoFinal
            lote={activeParticionPesoFinal.lotePadre}
            targetIdOverride={activeParticionPesoFinal.particion.id}
            onCancel={() => setActiveParticionPesoFinal(null)}
            onSubmit={handleParticionPesoFinal}
          />
        </ModalEstandar>
      )}

      {/* Modal: Peso Inicial */}
      {activeLotePesoInicial && (
        <ModalEstandar
          opened={!!activeLotePesoInicial}
          close={() => setActiveLotePesoInicial(null)}
          title={`Peso Inicial: ${activeLotePesoInicial.correlativo}`}
          size="lg"
        >
          <ModalPesoInicial
            lote={activeLotePesoInicial}
            onCancel={() => setActiveLotePesoInicial(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) =>
                r.lotes?.some((l) => l.id === loteId),
              );
              if (ru) {
                const loteActualizado = await registrarPesoInicial(
                  ru.id,
                  loteId,
                  dto,
                );
                setActiveLotePesoInicial(null);
                if (loteActualizado) {
                  printTicketBalanza(loteActualizado.id);
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Peso Final */}
      {activeLotePesoFinal && (
        <ModalEstandar
          opened={!!activeLotePesoFinal}
          close={() => setActiveLotePesoFinal(null)}
          title={`Peso Final para Lote: ${activeLotePesoFinal.correlativo}`}
          size="xl"
        >
          <ModalPesoFinal
            lote={activeLotePesoFinal}
            onCancel={() => setActiveLotePesoFinal(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) =>
                r.lotes?.some((l) => l.id === loteId),
              );
              if (ru) {
                const loteActualizado = await registrarPesoFinal(
                  ru.id,
                  loteId,
                  dto,
                );
                setActiveLotePesoFinal(null);
                if (loteActualizado) {
                  printTicketBalanza(loteActualizado.id);
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Seleccionar Condición de Ingreso y Empresa */}
      <ModalCondicionIngreso
        opened={condicionModalOpen}
        onClose={() => {
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
        empresasTitulares={empresasTitulares}
        onConfirm={(condicion, idEmpresa, codigoManual) => {
          if (selectedRecepcionIdForLote) {
            crearLote(selectedRecepcionIdForLote, condicion, idEmpresa, codigoManual);
          }
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
      />
    </div>
  );
};
