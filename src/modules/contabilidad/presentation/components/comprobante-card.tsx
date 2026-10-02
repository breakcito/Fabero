import { Group, Text, Badge, Tooltip, ActionIcon, Progress, Stack, Paper, Box, Accordion } from "@mantine/core";
import {
  IconCheck,
  IconCircleDashed,
  IconCircleCheck,
  IconBan,
  IconCash,
  IconReceipt,
  IconCalendar,
  IconPaperclip,
} from "@tabler/icons-react";
import { EstadoComprobanteCompra } from "../../../../shared/enums/contabilidad-compra/estado-comprobante-compra";
import { TipoAprobacionComprobante } from "../../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type { RES_AprobacionComprobante } from "../../service/contabilidad-compra.responses";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { RES_ComprobanteVenta } from "../../service/contabilidad-venta.responses";

interface ComprobanteCardProps {
  comprobante: RES_ComprobanteCompra | RES_ComprobanteVenta;
  anulando: boolean;
  aprobandoTipo?: TipoAprobacionComprobante | null;
  onAprobar?: (tipo: TipoAprobacionComprobante) => void;
  onAnular: () => void;
  onVerPagos: () => void;
  onVerEvidencias: () => void;
}

const COLOR_BY_TIPO: Record<TipoAprobacionComprobante, string> = {
  [TipoAprobacionComprobante.Contabilidad]: "indigo",
  [TipoAprobacionComprobante.Comercial]: "blue",
  [TipoAprobacionComprobante.Documentaria]: "yellow",
};

const badgeEstado = (estado: string) => {
  switch (estado) {
    case "En Espera":
      return <Badge color="gray" variant="light" size="sm">{estado}</Badge>;
    case "En Proceso":
      return <Badge color="indigo" variant="filled" size="sm">{estado}</Badge>;
    case "Pagado":
      return <Badge color="teal" variant="filled" size="sm">{estado}</Badge>;
    case "Anulado":
      return <Badge color="red" variant="light" size="sm">{estado}</Badge>;
    default:
      return <Badge color="gray" variant="light" size="sm">{estado}</Badge>;
  }
};

const formatFecha = (iso: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const findAprob = (aprobaciones: RES_AprobacionComprobante[], tipo: TipoAprobacionComprobante) =>
  aprobaciones.find((a) => a.tipo === tipo) ?? null;

const MiniAprobacionChip = ({
  tipo,
  aprobaciones,
  aprobandoTipo,
  onAprobar,
}: {
  tipo: TipoAprobacionComprobante;
  aprobaciones: RES_AprobacionComprobante[];
  aprobandoTipo?: TipoAprobacionComprobante | null;
  onAprobar: (tipo: TipoAprobacionComprobante) => void;
}) => {
  const ap = findAprob(aprobaciones, tipo);
  const aprobado = ap?.esta_aprobado ?? false;
  const color = COLOR_BY_TIPO[tipo];
  const isThisLoading = aprobandoTipo === tipo;

  const tooltipLabel = aprobado
    ? `${tipo}: Aprobado por ${ap?.empleado_registro_nombre ?? "Usuario"}${ap?.created_at ? ` (${formatFecha(ap.created_at)})` : ""}`
    : `${tipo}: Pendiente — Clic para aprobar`;

  return (
    <Tooltip label={tooltipLabel} withArrow position="top">
      <ActionIcon
        variant={aprobado ? "filled" : "light"}
        color={aprobado ? color : "gray"}
        size="lg"
        radius="md"
        loading={isThisLoading}
        style={{ cursor: aprobado ? "default" : "pointer" }}
        onClick={() => !aprobado && !aprobandoTipo && onAprobar(tipo)}
      >
        {aprobado ? <IconCircleCheck size={18} /> : <IconCircleDashed size={18} />}
      </ActionIcon>
    </Tooltip>
  );
};

export const ComprobanteCard = ({
  comprobante,
  anulando,
  aprobandoTipo,
  onAprobar,
  onAnular,
  onVerPagos,
  onVerEvidencias,
}: ComprobanteCardProps) => {
  const isCompra = "aprobaciones" in comprobante;
  const isAnulado = comprobante.estado === EstadoComprobanteCompra.Anulado || comprobante.estado === "Anulado";
  const numEvidencias = Array.isArray(comprobante.evidencias) ? comprobante.evidencias.length : 0;

  const pctPagadoNeto =
    !isAnulado && comprobante.monto_neto > 0
      ? Math.min(100, (comprobante.avance_pago_neto / comprobante.monto_neto) * 100)
      : 0;
  const pctPagadoDetraccion =
    !isAnulado && comprobante.monto_detraccion_soles > 0
      ? Math.min(100, (comprobante.avance_pago_detraccion / comprobante.monto_detraccion_soles) * 100)
      : 0;
  const totalPagadoUsd = isAnulado
    ? 0
    : comprobante.monto_pagado_anticipos +
      comprobante.avance_pago_neto +
      (comprobante.tipo_cambio_venta > 0
        ? comprobante.avance_pago_detraccion / comprobante.tipo_cambio_venta
        : 0);
  const pctPagadoTotal =
    !isAnulado && comprobante.total_dolares > 0
      ? Math.min(100, (totalPagadoUsd / comprobante.total_dolares) * 100)
      : 0;

  const isDetraccionSaldado = !isAnulado && pctPagadoDetraccion >= 99.99;
  const isNetoSaldado = !isAnulado && pctPagadoNeto >= 99.99;
  const isTotalSaldado = !isAnulado && pctPagadoTotal >= 99.99;

  const todasAprobadas = isCompra
    ? (comprobante as RES_ComprobanteCompra).aprobaciones.every((a) => a.esta_aprobado)
    : true;

  const renderBadgeEstadoPago = (isSaldado: boolean) => {
    if (isAnulado) {
      return (
        <Badge variant="light" color="red" size="xs">
          Anulado
        </Badge>
      );
    }
    return (
      <Badge variant="light" color={isSaldado ? "teal" : "gray"} size="xs">
        {isSaldado ? "Saldado" : "Pendiente"}
      </Badge>
    );
  };

  return (
    <Paper
      p="md"
      radius="lg"
      bg="#0f0f12"
      className={`border ${isAnulado ? "border-red-900/40" : "border-zinc-800"} hover:border-indigo-500/60 transition-all`}
    >
      <Group justify="space-between" align="flex-start" mb="sm">
        <Stack gap={2}>
          <Group gap={6} wrap="nowrap">
            <Text fw={800} c="cyan.4" fz="md" className="font-mono">
              {comprobante.codigo_completo}
            </Text>
            {badgeEstado(comprobante.estado)}
          </Group>
          <Group gap={4}>
            <IconCalendar size={12} className="text-zinc-500" />
            <Text fz={11} c="dimmed">{formatFecha(comprobante.fecha_emision)}</Text>
            {isCompra ? (
              <>
                <Text fz={11} c="dimmed">·</Text>
                <Text fz={11} c="dimmed">{(comprobante as RES_ComprobanteCompra).valorizacion_correlativo}</Text>
                <Text fz={11} c="dimmed">·</Text>
                <Text fz={11} fw={600}>{(comprobante as RES_ComprobanteCompra).proveedor_nombre}</Text>
                <Text fz={11} c="dimmed">({(comprobante as RES_ComprobanteCompra).concesion_nombre ?? "—"})</Text>
              </>
            ) : (
              <>
                <Text fz={11} c="dimmed">·</Text>
                <Badge color="indigo" variant="light" size="xs">Planta</Badge>
                <Text fz={11} fw={600} c="white">{(comprobante as RES_ComprobanteVenta).planta_nombre}</Text>
                <Text fz={11} c="dimmed">
                  ({(comprobante as RES_ComprobanteVenta).empresa_nombre ?? "Fabero"})
                </Text>
              </>
            )}
          </Group>
        </Stack>
        <Group gap={6}>
          <Tooltip label={numEvidencias > 0 ? `Ver Evidencias (${numEvidencias})` : "Ver Evidencias (0)"}>
            <ActionIcon
              size="lg"
              variant="light"
              color={numEvidencias > 0 ? "indigo" : "gray"}
              radius="md"
              onClick={onVerEvidencias}
            >
              <IconPaperclip size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={isAnulado ? "Ver Historial de Pagos (Anulado)" : "Ver / Registrar Pagos"}>
            <ActionIcon
              size="lg"
              variant={isAnulado ? "light" : "filled"}
              color={isAnulado ? "red" : "teal"}
              radius="md"
              onClick={onVerPagos}
            >
              <IconCash size={18} />
            </ActionIcon>
          </Tooltip>
          {!isAnulado && (
            <Tooltip label="Anular comprobante">
              <ActionIcon
                size="lg"
                variant="light"
                color="red"
                radius="md"
                loading={anulando}
                disabled={anulando}
                onClick={onAnular}
              >
                <IconBan size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Group grow align="stretch" mb="sm">
        <div className={`bg-zinc-900/50 border ${isAnulado ? "border-red-900/30" : "border-indigo-500/30"} rounded-lg p-3`}>
          <Group justify="space-between">
            <Text fz={10} tt="uppercase" c={isAnulado ? "red.4" : "indigo.4"} fw={700}>Total</Text>
            {renderBadgeEstadoPago(isTotalSaldado)}
          </Group>
          <Text fz="lg" fw={800} c="white" className="font-mono">$ {comprobante.total_dolares.toFixed(2)}</Text>
          <Text fz={10} c="dimmed">
            Equiv: S/ {comprobante.total_soles.toFixed(2)} · IGV: S/ {comprobante.monto_igv_soles.toFixed(2)}
          </Text>
          <Text fz={10} c="dimmed">TC: {comprobante.tipo_cambio_venta.toFixed(3)}</Text>
          <Progress value={pctPagadoTotal} color={isAnulado ? "red" : "indigo"} size="xs" mt={6} />
          <Text fz={9} c="dimmed" mt={2}>
            Pagado: $ {totalPagadoUsd.toFixed(2)} / $ {comprobante.total_dolares.toFixed(2)}
          </Text>
        </div>

        <div className={`bg-zinc-900/50 border ${isAnulado ? "border-red-900/30" : "border-teal-500/30"} rounded-lg p-3`}>
          <Group justify="space-between">
            <Text fz={10} tt="uppercase" c={isAnulado ? "red.4" : "teal.4"} fw={700}>Saldo Neto</Text>
            {renderBadgeEstadoPago(isNetoSaldado)}
          </Group>
          <Text fz="lg" fw={800} c="white" className="font-mono">$ {comprobante.monto_neto.toFixed(2)}</Text>
          <Text fz={10} c="dimmed">Equiv: S/ {(comprobante.monto_neto * comprobante.tipo_cambio_venta).toFixed(2)}</Text>
          <Text fz={10} c="dimmed">TC: {comprobante.tipo_cambio_venta.toFixed(3)}</Text>
          <Progress value={pctPagadoNeto} color={isAnulado ? "red" : "teal"} size="xs" mt={6} />
          <Text fz={9} c="dimmed" mt={2}>
            Pagado: $ {(isAnulado ? 0 : comprobante.avance_pago_neto).toFixed(2)} / $ {comprobante.monto_neto.toFixed(2)}
          </Text>
        </div>

        <div className={`bg-zinc-900/50 border ${isAnulado ? "border-red-900/30" : "border-yellow-500/30"} rounded-lg p-3`}>
          <Group justify="space-between">
            <Text fz={10} tt="uppercase" c={isAnulado ? "red.4" : "yellow.4"} fw={700}>Detracción (S/)</Text>
            {renderBadgeEstadoPago(isDetraccionSaldado)}
          </Group>
          <Text fz="lg" fw={800} c="white" className="font-mono">S/ {comprobante.monto_detraccion_soles.toFixed(2)}</Text>
          <Text fz={10} c="dimmed">Equiv: $ {comprobante.monto_detraccion.toFixed(2)}</Text>
          <Text fz={10} c="dimmed">TC: {comprobante.tipo_cambio_venta.toFixed(3)} · {(comprobante.porcentaje_detraccion * 100).toFixed(0)}%</Text>
          <Progress value={pctPagadoDetraccion} color={isAnulado ? "red" : "yellow"} size="xs" mt={6} />
          <Text fz={9} c="dimmed" mt={2}>
            Pagado: S/ {(isAnulado ? 0 : comprobante.avance_pago_detraccion).toFixed(2)} / S/ {comprobante.monto_detraccion_soles.toFixed(2)}
          </Text>
        </div>
      </Group>

      <Accordion variant="separated" mt="sm" transitionDuration={200} radius="md">
        <Accordion.Item value="lotes">
          <Accordion.Control className="bg-zinc-900/40! border! border-zinc-800! hover:bg-zinc-900/60!">
            <Group justify="space-between" w="100%">
              <Group gap={6}>
                <IconReceipt size={14} className="text-amber-400" />
                <Text fz="xs" fw={700} c="amber.4">
                  Lotes Valorizados ({comprobante.lotes_valorizados?.length ?? 0})
                </Text>
              </Group>
            </Group>
          </Accordion.Control>
          <Accordion.Panel className="bg-zinc-900/40! border-zinc-800!">
            {comprobante.lotes_valorizados && comprobante.lotes_valorizados.length > 0 ? (
              <Stack gap={6}>
                {comprobante.lotes_valorizados.map((l) => (
                  <Group
                    key={l.id}
                    justify="space-between"
                    p="xs"
                    className={`rounded-md bg-zinc-950/50 border border-zinc-800 border-l-4 ${
                      l.elemento_quimico === "Oro"
                        ? "border-l-yellow-500"
                        : "border-l-zinc-500"
                    }`}
                  >
                    <Group gap={6}>
                      <Badge color={l.elemento_quimico === "Oro" ? "yellow" : "gray"} variant="filled" size="xs">
                        {l.elemento_quimico}
                      </Badge>
                      <Text fz="xs" fw={700} className="font-mono">
                        {l.lote_correlativo ?? "—"}
                      </Text>
                    </Group>
                    <Group gap={4}>
                      <Text fz={9} c="dimmed" tt="uppercase" fw={700}>Subtotal</Text>
                      <Text fz="xs" fw={800} c="emerald.4" className="font-mono">
                        $ {l.subtotal.toFixed(2)}
                      </Text>
                    </Group>
                  </Group>
                ))}
                {!isAnulado && (
                  isCompra ? (
                    (((comprobante as RES_ComprobanteCompra).monto_penalidad ?? 0) > 0 || ((comprobante as RES_ComprobanteCompra).monto_flete ?? 0) > 0) && (
                      <Box className="border-t border-zinc-800 pt-2 mt-1">
                        <Stack gap={4}>
                          <Group justify="space-between">
                            <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>
                              Subtotal Lotes
                            </Text>
                            <Text fz={11} fw={600} c="zinc.3" className="font-mono">
                              $ {comprobante.total_dolares_antes_descuento.toFixed(2)}
                            </Text>
                          </Group>
                          {((comprobante as RES_ComprobanteCompra).monto_penalidad ?? 0) > 0 && (
                            <Group justify="space-between">
                              <Text fz={10} c="amber.4">(–) Penalidad</Text>
                              <Text fz={11} fw={600} c="amber.4" className="font-mono">
                                –$ {(comprobante as RES_ComprobanteCompra).monto_penalidad.toFixed(2)}
                              </Text>
                            </Group>
                          )}
                          {((comprobante as RES_ComprobanteCompra).monto_flete ?? 0) > 0 && (
                            <Group justify="space-between">
                              <Text fz={10} c="cyan.4">(–) Flete</Text>
                              <Text fz={11} fw={600} c="cyan.4" className="font-mono">
                                –$ {(comprobante as RES_ComprobanteCompra).monto_flete.toFixed(2)}
                              </Text>
                            </Group>
                          )}
                          <Box className="border-t border-zinc-800 pt-2 mt-1">
                            <Group justify="space-between">
                              <Text fz={10} c="emerald.4" fw={700} tt="uppercase">
                                Total
                              </Text>
                              <Text fz={12} fw={800} c="emerald.4" className="font-mono">
                                $ {comprobante.total_dolares.toFixed(2)}
                              </Text>
                            </Group>
                          </Box>
                        </Stack>
                      </Box>
                    )
                  ) : (
                    ((comprobante as RES_ComprobanteVenta).descuento ?? 0) > 0 && (
                      <Box className="border-t border-zinc-800 pt-2 mt-1">
                        <Stack gap={4}>
                          <Group justify="space-between">
                            <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Subtotal Lotes</Text>
                            <Text fz={11} fw={600} c="zinc.3" className="font-mono">
                              $ {comprobante.total_dolares_antes_descuento.toFixed(2)}
                            </Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={10} c="amber.4">(–) Descuento (Penalidad / Flete)</Text>
                            <Text fz={11} fw={600} c="amber.4" className="font-mono">
                              –$ {(comprobante as RES_ComprobanteVenta).descuento.toFixed(2)}
                            </Text>
                          </Group>
                          <Box className="border-t border-zinc-800 pt-2 mt-1">
                            <Group justify="space-between">
                              <Text fz={10} c="emerald.4" fw={700} tt="uppercase">Total</Text>
                              <Text fz={12} fw={800} c="emerald.4" className="font-mono">
                                $ {comprobante.total_dolares.toFixed(2)}
                              </Text>
                            </Group>
                          </Box>
                        </Stack>
                      </Box>
                    )
                  )
                )}
              </Stack>
            ) : (
              <Text fz="xs" c="dimmed" fs="italic" ta="center" py="sm">
                No hay lotes valorizados registrados.
              </Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {isCompra && onAprobar && (
        <Group justify="space-between" align="center" mt="md">
          <Group gap="xs">
            <Text fz={10} tt="uppercase" fw={700} c="dimmed">Aprobaciones:</Text>
            <MiniAprobacionChip
              tipo={TipoAprobacionComprobante.Contabilidad}
              aprobaciones={(comprobante as RES_ComprobanteCompra).aprobaciones}
              aprobandoTipo={aprobandoTipo}
              onAprobar={onAprobar}
            />
            <MiniAprobacionChip
              tipo={TipoAprobacionComprobante.Comercial}
              aprobaciones={(comprobante as RES_ComprobanteCompra).aprobaciones}
              aprobandoTipo={aprobandoTipo}
              onAprobar={onAprobar}
            />
            <MiniAprobacionChip
              tipo={TipoAprobacionComprobante.Documentaria}
              aprobaciones={(comprobante as RES_ComprobanteCompra).aprobaciones}
              aprobandoTipo={aprobandoTipo}
              onAprobar={onAprobar}
            />
          </Group>
          <Text fz={10} c="dimmed">
            Reg: {comprobante.empleado_registro_nombre ?? "—"}
          </Text>
        </Group>
      )}

      {!isCompra && (
        <Group justify="space-between" align="center" mt="md">
          <Badge variant="outline" color="cyan" size="xs">
            Contabilidad Venta
          </Badge>
          <Text fz={10} c="dimmed">
            Reg: {comprobante.empleado_registro_nombre ?? "—"}
          </Text>
        </Group>
      )}

      {isCompra && todasAprobadas && !isAnulado && (
        <Group justify="flex-end" mt="sm">
          <Group gap={6} className="text-teal-400">
            <IconCheck size={14} />
            <Text fz={11} fw={700}>Aprobado — pagos habilitados</Text>
          </Group>
        </Group>
      )}
    </Paper>
  );
};