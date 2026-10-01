import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconInfoCircle,
  IconPackage,
  IconPlus,
  IconTruck,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
  DistribucionItem,
  GuiaSegundoTramo,
} from "../../service/programacion-despachos.responses";
import { useDespachoDetalle } from "../../hooks/useDespachoDetalle";
import { useActaSalidaVehiculo } from "../../hooks/useActaSalidaVehiculo";
import { DistribucionCard } from "./distribucion-card";
import { RegistroDistribucionModal } from "./registro-distribucion-modal";
import { ModalGuiaSegundoTramo } from "./modal-guia-segundo-tramo";
import { ModalLlegadaCliente } from "./modal-llegada-cliente";
import { ModalFechaLlegadaCliente } from "./modal-fecha-llegada-cliente";
import { FilaItemDespacho } from "./fila-item-despacho";
import type { DespachoDetalle } from "../../service/programacion-despachos.responses";
import { formatNumber } from "../../../../shared/functions/formatNumber";

interface Props {
  opened: boolean;
  idDespacho: number | null;
  onClose: () => void;
  onDistribucionCreada: (result: CrearDistribucionResult) => void;
  onVerLog: (dist: DistribucionItem) => void;
}

export const ModalDetalleDespacho = ({
  opened,
  idDespacho,
  onClose,
  onDistribucionCreada,
  onVerLog,
}: Props) => {
  const { detalle, loading, refrescar } = useDespachoDetalle(idDespacho);
  const { printActaSalida } = useActaSalidaVehiculo();

  const [modalDistribucionAbierto, setModalDistribucionAbierto] =
    useState(false);
  const [detallesParaDistribuir, setDetallesParaDistribuir] = useState<
    DespachoDetalleItem[]
  >([]);

  // ---- modal de Guia Segundo Tramo: una sola instancia, se reabre apuntando
  //      a la distribucion seleccionada desde la card.
  const [modalGuiaAbierto, setModalGuiaAbierto] = useState(false);
  const [guiaDistribucionSeleccionada, setGuiaDistribucionSeleccionada] =
    useState<DistribucionItem | null>(null);

  // ---- modal de Llegada del Cliente: misma mecánica que el de guía.
  const [modalLlegadaAbierto, setModalLlegadaAbierto] = useState(false);
  const [llegadaDistribucionSeleccionada, setLlegadaDistribucionSeleccionada] =
    useState<DistribucionItem | null>(null);

  // ---- modal pequeño (paso 1): captura sólo la fecha de llegada.
  //      Sólo se abre cuando la distribución NO tiene fecha registrada.
  const [modalFechaAbierto, setModalFechaAbierto] = useState(false);

  // ---- fecha YYYY-MM-DD que se pasa al ModalLlegadaCliente (paso 2).
  //      Se setea al cerrar el modal pequeño o al abrir en modo edición.
  const [fechaParaLlegada, setFechaParaLlegada] = useState<string | null>(null);

  useEffect(() => {
    if (opened && idDespacho !== null) {
      refrescar();
    }
  }, [opened, idDespacho, refrescar]);

  const cabecera = detalle?.cabecera ?? null;
  const detalles = detalle?.detalles ?? [];
  const distribuciones = detalle?.distribuciones ?? [];
  const pesoTotalTomado = detalles.reduce(
    (acc, d) => acc + (d.peso_tomado ?? 0),
    0,
  );
  const pesoTotalPendiente = detalles.reduce(
    (acc, d) => acc + (d.peso_actual ?? 0),
    0,
  );

  const handleClose = () => {
    onClose();
  };

  const abrirModalDistribucion = () => {
    if (!detalle) return;
    const pendientes = detalles.filter((d) => d.peso_actual > 0);
    if (pendientes.length === 0) return;
    setDetallesParaDistribuir(pendientes);
    setModalDistribucionAbierto(true);
  };

  const onDistribucionSuccess = (result: CrearDistribucionResult) => {
    setModalDistribucionAbierto(false);
    setDetallesParaDistribuir([]);
    onDistribucionCreada(result);
    refrescar();
    // Auto-imprimir acta de salida (mismo patrón que useTicketBalanza al
    // confirmar pesaje). El usuario puede cerrarla si no la necesita.
    printActaSalida(result.id_distribucion);
  };

  const abrirGuiaSegundoTramo = (dist: DistribucionItem) => {
    setGuiaDistribucionSeleccionada(dist);
    setModalGuiaAbierto(true);
  };

  const abrirActaSalida = (dist: DistribucionItem) => {
    printActaSalida(dist.id);
  };

  const cerrarGuiaSegundoTramo = () => {
    setModalGuiaAbierto(false);
    setGuiaDistribucionSeleccionada(null);
  };

  const abrirLlegadaCliente = (dist: DistribucionItem) => {
    setLlegadaDistribucionSeleccionada(dist);
    // Refrescar el detalle del despacho para asegurar que las nuevas columnas
    // del backend (p.ej. blending_ley_humedad) estén en el cache cuando se
    // renderiza el modal. Sin esto, el modal abre con datos viejos.
    refrescar();

    if (dist.fecha_llegada_cliente) {
      // Edición: la fecha ya existe, vamos directo al modal grande.
      setFechaParaLlegada(dist.fecha_llegada_cliente.slice(0, 10));
      setModalLlegadaAbierto(true);
    } else {
      // Primer registro: primero el modal pequeño para capturar la fecha.
      setModalFechaAbierto(true);
    }
  };

  const cerrarLlegadaCliente = () => {
    setModalLlegadaAbierto(false);
    setLlegadaDistribucionSeleccionada(null);
    setFechaParaLlegada(null);
  };

  /**
   * Al confirmar el modal pequeño (paso 1): la fecha ya fue persistida por el
   * hook. Refrescamos el detalle para que `distribucion.fecha_llegada_cliente`
   * llegue actualizado al modal grande, y abrimos el modal grande (paso 2).
   */
  const handleFechaConfirmed = (
    fecha: string,
    _despachoActualizado: DespachoDetalle,
  ): void => {
    void _despachoActualizado;
    refrescar();
    setFechaParaLlegada(fecha);
    setModalLlegadaAbierto(true);
  };

  const cerrarFechaLlegada = () => {
    setModalFechaAbierto(false);
  };

  const handleLlegadaSaved = (despachoActualizado: DespachoDetalle): void => {
    void despachoActualizado;
    cerrarLlegadaCliente();
    refrescar();
  };

  /**
   * Tras guardar/actualizar la guia, refrescar el detalle del despacho para
   * que DistribucionItem.guia_segundo_tramo se actualice y la card muestre el
   * estado correcto (tooltip "Editar" en vez de "Registrar").
   * La guia retornada por el modal ya viene persistida en backend; no la
   * inspeccionamos aca — el cache del detalle se reconstruye via `refrescar()`.
   */
  const handleGuiaSaved = (guia: GuiaSegundoTramo): void => {
    void guia;
    cerrarGuiaSegundoTramo();
    refrescar();
  };

  const renderItems = () => {
    if (detalles.length === 0) {
      return (
        <Box className="px-4 py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <IconInfoCircle size={20} className="mx-auto text-zinc-600 mb-2" />
          <Text size="xs" c="dimmed">
            Este despacho no tiene items asociados.
          </Text>
        </Box>
      );
    }
    return (
      <Box className="rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950/40">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/70 font-bold border-b border-zinc-800/80">
              <th className="py-2.5 px-3 text-center font-bold">
                Ítem / Proveedor
              </th>
              <th className="py-2.5 px-3 text-center font-bold">
                Pesos (Tomado / Pendiente)
              </th>
              <th className="py-2.5 px-3 text-center font-bold min-w-24">
                Ley Fabero
              </th>
              <th className="py-2.5 px-3 text-center font-bold min-w-28">
                Ley Cliente (Prom.)
              </th>
              <th className="py-2.5 px-3 text-center font-bold min-w-36">
                Ley Final (Au / Ag)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {detalles.map((d) => (
              <FilaItemDespacho
                key={d.id}
                detalle={d}
                onRefresh={refrescar}
              />
            ))}
            <tr className="bg-zinc-900/70 border-t-2 border-zinc-700 font-bold">
              <td />
              <td className="py-2 px-3 text-center align-middle">
                <Group gap="xs" justify="center" wrap="nowrap">
                  <div>
                    <Text
                      size="9px"
                      c="dimmed"
                      tt="uppercase"
                      lts="0.04em"
                      className="font-bold mb-0.5"
                    >
                      Total Tomado
                    </Text>
                    <Text size="xs" fw={800} c="zinc.100" className="font-mono">
                      {formatNumber(pesoTotalTomado, 3)}
                    </Text>
                  </div>
                  <Text c="zinc.7" className="select-none">|</Text>
                  <div>
                    <Text
                      size="9px"
                      c="dimmed"
                      tt="uppercase"
                      lts="0.04em"
                      className="font-bold mb-0.5"
                    >
                      Total Pendiente
                    </Text>
                    <Text
                      size="xs"
                      fw={800}
                      className={`font-mono ${
                        pesoTotalPendiente > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {formatNumber(pesoTotalPendiente, 3)}
                    </Text>
                  </div>
                </Group>
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </Box>
    );
  };

  const renderDistribuciones = () => {
    if (distribuciones.length === 0) {
      return (
        <Box className="px-4 py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <IconInfoCircle size={20} className="mx-auto text-zinc-600 mb-2" />
          <Text size="xs" c="dimmed">
            Aún no se han registrado distribuciones para este despacho.
          </Text>
        </Box>
      );
    }
    return (
      <Stack gap="sm">
        {distribuciones.map((d) => (
          <DistribucionCard
            key={d.id}
            distribucion={d}
            onVerLog={onVerLog}
            onAbrirGuiaSegundoTramo={abrirGuiaSegundoTramo}
            onAbrirLlegadaCliente={abrirLlegadaCliente}
            onVerActa={abrirActaSalida}
          />
        ))}
      </Stack>
    );
  };

  const puedeAgregarDistribucion =
    cabecera !== null && !cabecera.es_anulado && pesoTotalPendiente > 0;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleClose}
        title={
          <Group gap="xs">
            <IconTruck size={20} className="text-indigo-400" />
            <Text fw={700} fz="md" c="white">
              Detalle del Despacho
            </Text>
          </Group>
        }
        size="90%"
      >
        <ScrollArea h="calc(90vh - 160px)" type="auto" offsetScrollbars>
          <Stack gap="lg" p="md">
            {loading && !detalle ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader size="md" color="indigo" />
                <Text size="xs" c="dimmed">
                  Cargando detalle del despacho...
                </Text>
              </div>
            ) : !detalle || !cabecera ? (
              <Box className="px-4 py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <IconAlertCircle
                  size={28}
                  className="mx-auto text-zinc-600 mb-2"
                />
                <Text size="sm" c="dimmed">
                  No se pudo cargar el detalle del despacho.
                </Text>
              </Box>
            ) : (
              <>
                {/* Items del despacho */}
                <Stack gap="xs">
                  <Group gap={6}>
                    <IconPackage size={16} className="text-amber-400" />
                    <Text size="sm" fw={700} c="zinc.2">
                      Items del Despacho
                    </Text>
                    <Badge variant="light" color="amber" size="sm" radius="md">
                      {detalles.length}
                    </Badge>
                  </Group>
                  {renderItems()}
                </Stack>

                {/* Distribuciones */}
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={6}>
                      <IconTruck size={16} className="text-indigo-400" />
                      <Text size="sm" fw={700} c="zinc.2">
                        Distribuciones
                      </Text>
                      <Badge
                        variant="light"
                        color="indigo"
                        size="sm"
                        radius="md"
                      >
                        {distribuciones.length}
                      </Badge>
                    </Group>
                    <Tooltip
                      label={
                        puedeAgregarDistribucion
                          ? "Agregar nueva distribución"
                          : cabecera?.es_anulado
                            ? "El despacho está anulado"
                            : "No hay peso pendiente"
                      }
                      withArrow
                    >
                      <span>
                        <Button
                          size="xs"
                          radius="lg"
                          variant="filled"
                          color="indigo"
                          leftSection={<IconPlus size={14} />}
                          onClick={abrirModalDistribucion}
                          disabled={!puedeAgregarDistribucion}
                          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 disabled:opacity-100! disabled:bg-indigo-900/50! disabled:text-indigo-200! disabled:border! disabled:border-indigo-700/60! disabled:cursor-not-allowed"
                        >
                          Agregar Distribución
                        </Button>
                      </span>
                    </Tooltip>
                  </Group>
                  {renderDistribuciones()}
                </Stack>
              </>
            )}
          </Stack>
        </ScrollArea>
      </ModalEstandar>

      {modalDistribucionAbierto && idDespacho !== null && (
        <RegistroDistribucionModal
          opened={modalDistribucionAbierto}
          onClose={() => setModalDistribucionAbierto(false)}
          idDespacho={idDespacho}
          detallesDespacho={detallesParaDistribuir}
          onSuccess={onDistribucionSuccess}
        />
      )}

      {modalGuiaAbierto && guiaDistribucionSeleccionada !== null && (
        <ModalGuiaSegundoTramo
          opened={modalGuiaAbierto}
          idDistribucion={guiaDistribucionSeleccionada.id}
          guia={guiaDistribucionSeleccionada.guia_segundo_tramo ?? null}
          contexto={{
            distribucionId: guiaDistribucionSeleccionada.id,
            vehiculoPlaca: guiaDistribucionSeleccionada.vehiculo_placa,
            sucursalNombre: guiaDistribucionSeleccionada.sucursal_nombre,
          }}
          onClose={cerrarGuiaSegundoTramo}
          onSaved={handleGuiaSaved}
        />
      )}

      {modalFechaAbierto && llegadaDistribucionSeleccionada !== null && (
        <ModalFechaLlegadaCliente
          opened={modalFechaAbierto}
          idDistribucion={llegadaDistribucionSeleccionada.id}
          onClose={cerrarFechaLlegada}
          onSuccess={handleFechaConfirmed}
        />
      )}

      {modalLlegadaAbierto &&
        llegadaDistribucionSeleccionada !== null &&
        fechaParaLlegada !== null && (
          <ModalLlegadaCliente
            opened={modalLlegadaAbierto}
            distribucion={llegadaDistribucionSeleccionada}
            fechaInicial={fechaParaLlegada}
            onClose={cerrarLlegadaCliente}
            onSaved={handleLlegadaSaved}
          />
        )}
    </>
  );
};
