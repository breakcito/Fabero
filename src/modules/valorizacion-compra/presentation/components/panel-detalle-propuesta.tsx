import { useMemo } from "react";
import {
  Badge,
  Box,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Text,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBuildingBank,
  IconFileText,
  IconFlask,
  IconInfoCircle,
  IconMapPin,
  IconScale,
  IconShoppingCart,
  IconTruckDelivery,
  IconUser,
} from "@tabler/icons-react";
import { EstadoValorizacionCompra } from "../../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";
import { BadgeEstadoValorizacion } from "./badge-estado-valorizacion";
import {
  fmtMonedaUsd,
  obtenerCorrelativoDisplay,
} from "../utils/valorizacion-grupo.utils";

interface Props {
  valorizacion: RES_ValorizacionCompra | null;
  loading: boolean;
}

export const PanelDetallePropuesta = ({ valorizacion, loading }: Props) => {
  const metricasFisicas = useMemo(() => {
    if (!valorizacion) {
      return {
        lotesUnicos: 0,
        tmhTotalTon: 0,
        tmsTotalTon: 0,
        descuentoTotal: 0,
      };
    }
    const vistos = new Set<string>();
    let tmhKg = 0;
    let tmsKg = 0;
    let descuentoTotal = 0;

    for (const d of valorizacion.detalles || []) {
      const keyLote = String(d.id_lote_mineral ?? d.id_lote_guia);
      if (!vistos.has(keyLote)) {
        vistos.add(keyLote);
        tmhKg += Number(d.tmh || 0);
        tmsKg += Number(d.tms || 0);
      }
      descuentoTotal += Number(
        d.descuento ??
          Number(d.monto_penalidad || 0) + Number(d.monto_flete || 0),
      );
    }

    return {
      lotesUnicos: vistos.size,
      tmhTotalTon: tmhKg / 1000,
      tmsTotalTon: tmsKg / 1000,
      descuentoTotal,
    };
  }, [valorizacion]);

  if (loading && !valorizacion) {
    return (
      <Paper
        p="xl"
        radius="lg"
        className="bg-zinc-950/70 border border-zinc-800/80 min-h-125 flex flex-col items-center justify-center gap-3"
      >
        <Loader color="indigo" size="md" />
        <Text fz="xs" c="dimmed">
          Cargando detalle de propuesta...
        </Text>
      </Paper>
    );
  }

  if (!valorizacion) {
    return (
      <Paper
        p="xl"
        radius="lg"
        className="bg-zinc-950/70 border border-dashed border-zinc-800 min-h-125 flex flex-col items-center justify-center text-center gap-2"
      >
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-500">
          <IconFileText size={28} />
        </div>
        <Text fw={700} fz="sm" c="white">
          Seleccione una propuesta de valorización
        </Text>
        <Text fz="xs" c="dimmed" maw={360}>
          Haga clic sobre una propuesta en la columna izquierda para visualizar su resumen económico y el detalle de sus lotes asociados.
        </Text>
      </Paper>
    );
  }

  const detallesList = valorizacion.detalles || [];
  const transaccionesAnticipo = valorizacion.transacciones_anticipo || [];
  const correlativoStr = obtenerCorrelativoDisplay(valorizacion);
  const numProp = valorizacion.numero_version ?? 1;
  const fueAprobada =
    valorizacion.estado === EstadoValorizacionCompra.Aprobado ||
    Boolean(valorizacion.fecha_hora_aprobacion);
  const mostrarAnticiposKpi =
    fueAprobada || Number(valorizacion.total_anticipos || 0) > 0;
  const esSinValorGlobal =
    detallesList.length > 0 &&
    detallesList.every(
      (d) =>
        Number(d.subtotal || 0) === 0 &&
        Number(d.precio_por_tonelada || 0) === 0,
    );

  return (
    <Paper
      p="md"
      radius="lg"
      className="bg-zinc-950/80 border border-zinc-800/90 shadow-xl space-y-3.5"
    >
      {/* Barra superior contextual de la propuesta seleccionada */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 border-b border-zinc-800/80">
        <div className="space-y-1 min-w-0">
          <Group gap="xs" wrap="wrap">
            <Text
              fw={800}
              fz="md"
              c="cyan.4"
              className="font-mono tracking-tight"
            >
              {correlativoStr}
            </Text>
            <Badge
              color="indigo"
              variant="filled"
              size="sm"
              radius="sm"
              fw={800}
            >
              #{numProp}
            </Badge>
            <BadgeEstadoValorizacion estado={valorizacion.estado} size="sm" />
            {esSinValorGlobal && (
              <Badge color="red" variant="light" size="sm">
                Sin Valor Comercial
              </Badge>
            )}
            {valorizacion.tiene_factura && valorizacion.factura_asociada && (
              <Badge color="teal" variant="outline" size="sm">
                Factura: {valorizacion.factura_asociada}
              </Badge>
            )}
          </Group>

          <Group gap="md" wrap="wrap" className="text-zinc-300">
            <Group gap={6} wrap="nowrap">
              <IconUser size={14} className="text-indigo-400 shrink-0" />
              <Text fz="xs" fw={600} c="white">
                {valorizacion.proveedor_nombre || "—"}
              </Text>
              {valorizacion.proveedor_ruc && (
                <Text fz={11} c="dimmed" className="font-mono">
                  (RUC: {valorizacion.proveedor_ruc})
                </Text>
              )}
            </Group>

            <Group gap={5} wrap="nowrap">
              <IconMapPin size={14} className="text-cyan-400 shrink-0" />
              <Text fz="xs" c="gray.3">
                {valorizacion.concesion_nombre || "Sin concesión"}
                {valorizacion.concesion_codigo_reinfo
                  ? ` · REINFO ${valorizacion.concesion_codigo_reinfo}`
                  : ""}
              </Text>
            </Group>
          </Group>
        </div>

        <div className="flex flex-col sm:items-end gap-0.5 shrink-0 text-right">
          <Text fz={11} c="dimmed">
            Registro:{" "}
            <span className="text-zinc-300 font-mono">
              {valorizacion.created_at || "—"}
            </span>
          </Text>
          {valorizacion.empleado_registro && (
            <Text fz={11} c="dimmed">
              Por:{" "}
              <span className="text-zinc-300">
                {valorizacion.empleado_registro}
              </span>
            </Text>
          )}
          {valorizacion.fecha_hora_aprobacion && (
            <Text fz={11} c="teal.4">
              Aprobado:{" "}
              <span className="font-mono">
                {valorizacion.fecha_hora_aprobacion}
              </span>
              {valorizacion.empleado_aprobacion
                ? ` (${valorizacion.empleado_aprobacion})`
                : ""}
            </Text>
          )}
        </div>
      </div>

      {/* Banners informativos contextuales */}
      {valorizacion.estado === EstadoValorizacionCompra.Desestimada && (
        <Box
          p="xs"
          className="rounded-lg bg-zinc-900/80 border border-zinc-700/70 flex items-center gap-2.5"
        >
          <IconInfoCircle size={16} className="text-zinc-400 shrink-0" />
          <Text fz="xs" c="gray.4">
            Esta propuesta quedó{" "}
            <strong className="text-zinc-200">Desestimada</strong> porque otra
            propuesta del mismo grupo fue aprobada. Se mantiene visible para
            consulta e historial.
          </Text>
        </Box>
      )}

      {valorizacion.estado === EstadoValorizacionCompra.Anulado && (
        <Box
          p="xs"
          className="rounded-lg bg-red-950/30 border border-red-800/50 flex items-start gap-2.5"
        >
          <IconAlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <Text fz="xs" fw={600} c="red.3">
              Propuesta Anulada{" "}
              {valorizacion.fecha_hora_anulacion
                ? `el ${valorizacion.fecha_hora_anulacion}`
                : ""}
              {valorizacion.empleado_anulacion
                ? ` por ${valorizacion.empleado_anulacion}`
                : ""}
            </Text>
            {valorizacion.motivo_anulacion && (
              <Text fz="xs" c="gray.3">
                Motivo: {valorizacion.motivo_anulacion}
              </Text>
            )}
          </div>
        </Box>
      )}

      {valorizacion.id_empleado_solicita_oc && (
        <Box
          p="xs"
          className="rounded-lg bg-indigo-950/35 border border-indigo-800/50 flex items-center justify-between flex-wrap gap-2"
        >
          <Group gap="xs">
            <IconShoppingCart size={15} className="text-indigo-400" />
            <Text fz="xs" c="indigo.2">
              <strong className="font-semibold">
                Orden de Compra solicitada por:
              </strong>{" "}
              {valorizacion.empleado_solicita_oc || "Empleado"}
            </Text>
          </Group>
          <Text fz={11} c="gray.4" className="font-mono">
            {valorizacion.fecha_hora_solicitud_oc}
          </Text>
        </Box>
      )}

      {/* Franja compacta de Resumen Económico (1 sola fila en escritorio) */}
      <SimpleGrid
        cols={{ base: 2, sm: 3, md: mostrarAnticiposKpi ? 6 : 5 }}
        spacing="xs"
      >
        <Box
          px="sm"
          py={8}
          className="rounded-xl bg-zinc-900/70 border border-zinc-800/80"
        >
          <Text fz={10} tt="uppercase" fw={700} c="dimmed">
            Subtotal Lotes
          </Text>
          <Text fz="sm" fw={800} c="teal.3" className="font-mono mt-0.5">
            {fmtMonedaUsd(valorizacion.total_subtotal)}
          </Text>
        </Box>

        {mostrarAnticiposKpi && (
          <Box
            px="sm"
            py={8}
            className="rounded-xl bg-zinc-900/70 border border-zinc-800/80"
          >
            <Text fz={10} tt="uppercase" fw={700} c="dimmed">
              Anticipos
            </Text>
            <Text
              fz="sm"
              fw={700}
              c={valorizacion.total_anticipos > 0 ? "orange.4" : "gray.5"}
              className="font-mono mt-0.5"
            >
              {valorizacion.total_anticipos > 0
                ? `- ${fmtMonedaUsd(valorizacion.total_anticipos)}`
                : "$ 0.00"}
            </Text>
          </Box>
        )}

        <Box
          px="sm"
          py={8}
          className="rounded-xl bg-zinc-900/70 border border-zinc-800/80"
        >
          <Text fz={10} tt="uppercase" fw={700} c="dimmed">
            IGV ({Number(valorizacion.porcentaje_igv ?? 18).toFixed(0)}%)
          </Text>
          <Text fz="sm" fw={700} c="white" className="font-mono mt-0.5">
            {fmtMonedaUsd(valorizacion.igv)}
          </Text>
        </Box>

        <Box
          px="sm"
          py={8}
          className="rounded-xl bg-zinc-900/70 border border-zinc-800/80"
        >
          <Text fz={10} tt="uppercase" fw={700} c="dimmed">
            Total c/ IGV
          </Text>
          <Text fz="sm" fw={700} c="white" className="font-mono mt-0.5">
            {fmtMonedaUsd(valorizacion.total_con_igv)}
          </Text>
        </Box>

        <Box
          px="sm"
          py={8}
          className="rounded-xl bg-zinc-900/70 border border-zinc-800/80"
        >
          <Text fz={10} tt="uppercase" fw={700} c="dimmed">
            Detracción (
            {Number(valorizacion.porcentaje_detraccion ?? 10).toFixed(0)}%)
          </Text>
          <Text fz="sm" fw={700} c="yellow.4" className="font-mono mt-0.5">
            - {fmtMonedaUsd(valorizacion.monto_detraccion)}
          </Text>
        </Box>

        <Box
          px="sm"
          py={8}
          className="rounded-xl bg-indigo-950/40 border border-indigo-500/40"
        >
          <Text fz={10} tt="uppercase" fw={700} c="indigo.3">
            {fueAprobada ? "Neto a Pagar" : "Neto Estimado"}
          </Text>
          <Text fz="sm" fw={800} c="white" className="font-mono mt-0.5">
            {fmtMonedaUsd(valorizacion.neto_a_pagar)}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Datos bancarios, forma de pago y anticipos: SOLO visibles cuando la propuesta ya fue aprobada */}
      {fueAprobada && (
        <Box
          p="xs"
          className="rounded-xl bg-teal-950/20 border border-teal-800/40 space-y-2"
        >
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Group gap={6}>
              <IconBuildingBank size={15} className="text-teal-400" />
              <Text fz="xs" fw={700} c="teal.2">
                Datos de Liquidación y Pago
              </Text>
            </Group>

            {valorizacion.tipo_pago && (
              <Badge variant="light" color="teal" size="xs" fw={700}>
                PAGO: {valorizacion.tipo_pago.toUpperCase()}
              </Badge>
            )}
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Box
              px="xs"
              py={6}
              className="rounded-lg bg-zinc-950/75 border border-zinc-800/80"
            >
              <Text fz={10} tt="uppercase" fw={700} c="dimmed">
                Cuenta Bancaria Principal
              </Text>
              <Text fz="xs" fw={600} c="white" className="font-mono mt-0.5">
                {valorizacion.cuenta_bancaria_info || "No asignada"}
              </Text>
              {valorizacion.cuenta_bancaria_cci && (
                <Text fz={10.5} c="dimmed" className="font-mono">
                  CCI: {valorizacion.cuenta_bancaria_cci}
                </Text>
              )}
            </Box>

            <Box
              px="xs"
              py={6}
              className="rounded-lg bg-zinc-950/75 border border-zinc-800/80"
            >
              <Group gap={6} justify="space-between" wrap="nowrap">
                <Text fz={10} tt="uppercase" fw={700} c="dimmed">
                  Cuenta de Detracción
                </Text>
                <Text fz={10} tt="uppercase" fw={700} c="yellow.4">
                  {Number(valorizacion.porcentaje_detraccion ?? 10).toFixed(0)}%
                </Text>
              </Group>
              <Text fz="xs" fw={600} c="yellow.3" className="font-mono mt-0.5">
                {valorizacion.cuenta_detraccion_info || "No asignada"}
              </Text>
              {valorizacion.cuenta_detraccion_cci && (
                <Text fz={10.5} c="dimmed" className="font-mono">
                  CCI: {valorizacion.cuenta_detraccion_cci}
                </Text>
              )}
            </Box>
          </SimpleGrid>

          {transaccionesAnticipo.length > 0 && (
            <div className="pt-1.5 border-t border-zinc-800/70 space-y-1">
              <Group justify="space-between">
                <Text fz={11} fw={700} c="orange.3">
                  Anticipos descontados ({transaccionesAnticipo.length}):
                </Text>
                <Text fz={11} fw={800} c="orange.4" className="font-mono">
                  Total: - {fmtMonedaUsd(valorizacion.total_anticipos)}
                </Text>
              </Group>

              <Group gap={6} wrap="wrap">
                {transaccionesAnticipo.map((t) => (
                  <Badge
                    key={t.id}
                    color="orange"
                    variant="light"
                    size="sm"
                    className="font-mono"
                  >
                    {t.factura || `Anticipo #${t.id_anticipo_proveedor}`}: -{" "}
                    {fmtMonedaUsd(t.monto_retirado)}
                  </Badge>
                ))}
              </Group>
            </div>
          )}
        </Box>
      )}

      {/* Encabezado de Lotes Asociados */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
        <Group gap="xs">
          <IconScale size={16} className="text-yellow-400" />
          <Text fw={700} fz="sm" c="white">
            Lotes Asociados
          </Text>
          <Badge color="indigo" variant="light" size="sm">
            {metricasFisicas.lotesUnicos}{" "}
            {metricasFisicas.lotesUnicos === 1 ? "lote" : "lotes"}
          </Badge>
          {detallesList.length !== metricasFisicas.lotesUnicos && (
            <Badge color="gray" variant="light" size="sm">
              {detallesList.length} ítems (Au/Ag)
            </Badge>
          )}
        </Group>

        <Group gap={6} wrap="wrap">
          <Badge color="cyan" variant="light" size="sm">
            TMH Total: {metricasFisicas.tmhTotalTon.toFixed(3)} t
          </Badge>
          <Badge color="teal" variant="light" size="sm">
            TMS Total: {metricasFisicas.tmsTotalTon.toFixed(3)} t
          </Badge>
          {metricasFisicas.descuentoTotal > 0 && (
            <Badge color="orange" variant="light" size="sm">
              Ajustes: -{fmtMonedaUsd(metricasFisicas.descuentoTotal)}
            </Badge>
          )}
        </Group>
      </div>

      {/* Lista de Lotes optimizada para múltiples ítems con scroll dedicado */}
      {detallesList.length === 0 ? (
        <Box
          p="xl"
          className="rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center"
        >
          <Text fz="xs" c="dimmed">
            Esta propuesta no tiene lotes asociados.
          </Text>
        </Box>
      ) : (
        <div className="max-h-[calc(100vh-310px)] overflow-y-auto pr-1 space-y-2">
          {detallesList.map((d, idx) => {
            const esOro = d.elemento_quimico === "Oro";
            const sinValorLote =
              Number(d.subtotal || 0) === 0 &&
              Number(d.precio_por_tonelada || 0) === 0;
            const montoPenalidad = Number(d.monto_penalidad || 0);
            const montoFlete = Number(d.monto_flete || 0);

            return (
              <Paper
                key={d.id ?? `${d.id_lote_guia}-${d.elemento_quimico}-${idx}`}
                p="xs"
                radius="md"
                className={`bg-zinc-900/60 border border-zinc-800/90 border-l-4 ${
                  esOro ? "border-l-yellow-500" : "border-l-cyan-400"
                } hover:border-zinc-700 transition-colors space-y-2`}
              >
                {/* Fila superior compacta del lote: Identificación + Guías + Precio/TN y Subtotal en línea */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Group gap={6} wrap="wrap">
                    <Text fz={11} fw={700} c="dimmed" className="font-mono">
                      #{idx + 1}
                    </Text>

                    <Badge
                      color={esOro ? "yellow" : "cyan"}
                      variant="filled"
                      size="xs"
                      fw={800}
                    >
                      {d.elemento_quimico.toUpperCase()}
                    </Badge>

                    <Text fw={800} fz="xs" c="white" className="font-mono">
                      {d.lote_correlativo || `Lote #${d.id_lote_guia}`}
                    </Text>

                    {d.grupo_analisis_nombre && (
                      <Badge
                        color="violet"
                        variant="light"
                        size="xs"
                        leftSection={<IconFlask size={10} />}
                      >
                        {d.grupo_analisis_nombre}
                      </Badge>
                    )}

                    {d.grr && (
                      <Badge
                        color="blue"
                        variant="outline"
                        size="xs"
                        leftSection={<IconTruckDelivery size={10} />}
                      >
                        GRR: {d.grr}
                      </Badge>
                    )}

                    {d.grt && (
                      <Badge color="indigo" variant="outline" size="xs">
                        GRT: {d.grt}
                      </Badge>
                    )}

                    {d.fecha_ingreso && (
                      <Text fz={11} c="dimmed" className="font-mono">
                        Ingreso: {d.fecha_ingreso}
                      </Text>
                    )}

                    {montoPenalidad > 0 && (
                      <Badge color="orange" variant="light" size="xs">
                        Penalidad: -{fmtMonedaUsd(montoPenalidad)}
                      </Badge>
                    )}

                    {montoFlete > 0 && (
                      <Badge color="cyan" variant="light" size="xs">
                        Flete: -{fmtMonedaUsd(montoFlete)}
                      </Badge>
                    )}

                    {sinValorLote && (
                      <Badge color="red" variant="light" size="xs">
                        Sin Valor Comercial
                      </Badge>
                    )}
                  </Group>

                  <Group
                    gap="sm"
                    wrap="nowrap"
                    className="shrink-0 self-end sm:self-center"
                  >
                    <Group gap={5} wrap="nowrap">
                      <Text fz={10} tt="uppercase" c="dimmed" fw={700}>
                        Precio/TN:
                      </Text>
                      <Text fz="xs" fw={700} c="gray.2" className="font-mono">
                        {fmtMonedaUsd(d.precio_por_tonelada)}
                      </Text>
                    </Group>

                    <Group
                      gap={5}
                      wrap="nowrap"
                      className="pl-2.5 border-l border-zinc-800"
                    >
                      <Text
                        fz={10}
                        tt="uppercase"
                        c={sinValorLote ? "dimmed" : "teal.4"}
                        fw={700}
                      >
                        Subtotal:
                      </Text>
                      <Text
                        fz="sm"
                        fw={800}
                        c={sinValorLote ? "dimmed" : "teal.3"}
                        className="font-mono"
                      >
                        {fmtMonedaUsd(d.subtotal)}
                      </Text>
                    </Group>
                  </Group>
                </div>

                {/* Grilla densa en 3 bloques: Pesos | Leyes | Condiciones Comerciales */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                  {/* Bloque 1: Pesos y Humedad */}
                  <div className="md:col-span-4 rounded-lg bg-zinc-950/80 border border-zinc-800/80 px-2.5 py-1.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Text fz={10} c="dimmed">
                          TMH (t)
                        </Text>
                        <Text fz="xs" fw={700} c="white" className="font-mono">
                          {(Number(d.tmh || 0) / 1000).toFixed(3)}
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          % H2O
                        </Text>
                        <Text fz="xs" fw={700} c="cyan.3" className="font-mono">
                          {Number(d.ley_humedad || 0).toFixed(2)}%
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          TMS (t)
                        </Text>
                        <Text fz="xs" fw={700} c="teal.3" className="font-mono">
                          {(Number(d.tms || 0) / 1000).toFixed(3)}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Leyes y Factor */}
                  <div className="md:col-span-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 px-2.5 py-1.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Text fz={10} c="dimmed">
                          Ley ({esOro ? "Au" : "Ag"})
                        </Text>
                        <Text
                          fz="xs"
                          fw={800}
                          c={esOro ? "yellow.3" : "cyan.3"}
                          className="font-mono"
                        >
                          {Number(d.ley || 0).toFixed(3)}
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          Recup.
                        </Text>
                        <Text
                          fz="xs"
                          fw={700}
                          c="orange.3"
                          className="font-mono"
                        >
                          {Number(d.recuperacion || 0).toFixed(2)}%
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          Factor
                        </Text>
                        <Text fz="xs" fw={700} c="gray.2" className="font-mono">
                          {Number(d.factor || 0).toFixed(4)}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 3: Parámetros Comerciales */}
                  <div className="md:col-span-5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 px-2.5 py-1.5">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Text fz={10} c="dimmed">
                          Inter
                        </Text>
                        <Text fz="xs" fw={700} c="white" className="font-mono">
                          ${Number(d.inter || 0).toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          Des. Inter
                        </Text>
                        <Text fz="xs" fw={700} c="gray.3" className="font-mono">
                          ${Number(d.des_inter || 0).toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          Maquila
                        </Text>
                        <Text fz="xs" fw={700} c="gray.3" className="font-mono">
                          ${Number(d.maquila || 0).toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text fz={10} c="dimmed">
                          Reactivo
                        </Text>
                        <Text fz="xs" fw={700} c="gray.3" className="font-mono">
                          ${Number(d.consumo || 0).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Paper>
            );
          })}
        </div>
      )}
    </Paper>
  );
};
