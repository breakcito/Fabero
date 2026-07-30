import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowRight, IconPaperclip, IconPlus, IconReceipt, IconTrash } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { EstadoComprobanteCompra } from "../../../../shared/enums/contabilidad-compra/estado-comprobante-compra";
import type { RES_ComprobanteCompra, RES_PagoComprobante } from "../../service/contabilidad-compra.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { usePagosComprobante } from "../../hooks/usePagosComprobante";
import { ModalAnularPago } from "./modal-anular-pago";

interface ModalHistorialPagosProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra | null;
  onAnularPago: (idPago: number, motivo: string, evidenciasAnulacion?: File[]) => void;
  onRegistrarPago: () => void;
  approving: boolean;
}

const formatDateTime = (s: string): string => {
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
};

export const ModalHistorialPagos = ({
  opened,
  onClose,
  comprobante,
  onAnularPago,
  onRegistrarPago,
  approving,
}: ModalHistorialPagosProps) => {
  const { pagos, loading, anulandoId, cargarPagos } = usePagosComprobante();
  const [pagoAAnular, setPagoAAnular] = useState<RES_PagoComprobante | null>(null);
  const [evidenciasModalConfig, setEvidenciasModalConfig] = useState<{
    archivos: IArchivo[];
    titulo: string;
  } | null>(null);

  useEffect(() => {
    if (opened && comprobante) {
      void cargarPagos(comprobante.id);
    }
  }, [opened, comprobante, cargarPagos]);

  if (!comprobante) return null;

  const isAnulado = comprobante.estado === EstadoComprobanteCompra.Anulado;

  const totalPagadoUsd = isAnulado
    ? 0
    : comprobante.monto_pagado_anticipos +
      comprobante.avance_pago_neto +
      (comprobante.avance_pago_detraccion / comprobante.tipo_cambio_venta);

  const saldoPendienteNeto = isAnulado
    ? 0
    : Math.max(comprobante.monto_neto - comprobante.avance_pago_neto, 0);

  const saldoPendienteDetraccion = isAnulado
    ? 0
    : Math.max(comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion, 0);

  const todasAprobadas = comprobante.aprobaciones.every((a) => a.esta_aprobado);
  const habilitadoRegistrar = todasAprobadas && !isAnulado;

  const tooltipRegistrar = isAnulado
    ? "Comprobante Anulado — No se pueden registrar pagos"
    : !todasAprobadas
      ? "Complete las 3 aprobaciones"
      : "Registrar Pago";

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={
          <Group gap={6}>
            <IconReceipt size={20} className="text-emerald-400" />
            <Text fw={700} fz="sm" c="white">
              Historial de Pagos — {comprobante.codigo_completo}
            </Text>
          </Group>
        }
        rightSection={
          <Group gap="xs" align="center">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-center">
              <Text fz={9} tt="uppercase" c="dimmed" fw={700}>Total ($)</Text>
              <Text fz="xs" fw={800} c="white">$ {comprobante.total_dolares.toFixed(2)}</Text>
            </div>
            <div className="bg-zinc-900/60 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-center">
              <Text fz={9} tt="uppercase" c="emerald.4" fw={700}>Total Pagado ($)</Text>
              <Text fz="xs" fw={800} c="emerald.4">$ {totalPagadoUsd.toFixed(2)}</Text>
            </div>
            <div className="bg-zinc-900/60 border border-blue-500/40 rounded-lg px-2.5 py-1 text-center">
              <Text fz={9} tt="uppercase" c="blue.4" fw={700}>Pend. Neto ($)</Text>
              <Text fz="xs" fw={800} c="blue.4">$ {saldoPendienteNeto.toFixed(2)}</Text>
            </div>
            <div className="bg-zinc-900/60 border border-yellow-500/40 rounded-lg px-2.5 py-1 text-center">
              <Text fz={9} tt="uppercase" c="yellow.4" fw={700}>Pend. Detr. (S/)</Text>
              <Text fz="xs" fw={800} c="yellow.4">S/ {saldoPendienteDetraccion.toFixed(2)}</Text>
            </div>
            <Tooltip label={tooltipRegistrar}>
              <Button
                color="indigo"
                leftSection={<IconPlus size={14} />}
                radius="lg"
                size="xs"
                disabled={!habilitadoRegistrar}
                onClick={() => {
                  if (habilitadoRegistrar) onRegistrarPago();
                }}
              >
                Registrar Pago
              </Button>
            </Tooltip>
          </Group>
        }
        size="6xl"
      >
        <Stack gap="md">

          {loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          ) : pagos.length === 0 ? (
            <Text fz="xs" c="dimmed" fs="italic">No hay pagos registrados.</Text>
          ) : (
            <Stack gap="xs" className="max-h-95 overflow-y-auto pr-1">
              {pagos.map((p) => (
                <PagoCard
                  key={p.id}
                  pago={p}
                  anulando={anulandoId === p.id}
                  disabled={approving || isAnulado}
                  onSolicitarAnular={setPagoAAnular}
                  onVerEvidencias={(archivos, titulo) => setEvidenciasModalConfig({ archivos, titulo })}
                />
              ))}
            </Stack>
          )}

          <Group justify="space-between" align="center">
            <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
              Total Pagado ($): $ {totalPagadoUsd.toFixed(2)}
            </Text>
            <Button variant="default" onClick={onClose} radius="lg" size="xs">
              Cerrar
            </Button>
          </Group>
        </Stack>

        <ModalAnularPago
          opened={pagoAAnular !== null}
          onClose={() => setPagoAAnular(null)}
          pago={pagoAAnular}
          loading={pagoAAnular !== null && anulandoId === pagoAAnular.id}
          onConfirm={(motivo, evidenciasAnulacion) => {
            if (pagoAAnular) {
              onAnularPago(pagoAAnular.id, motivo, evidenciasAnulacion);
              setPagoAAnular(null);
            }
          }}
        />
      </ModalEstandar>

      {/* Modal: Evidencias del Pago / Anulación */}
      <ModalEstandar
        opened={evidenciasModalConfig !== null}
        close={() => setEvidenciasModalConfig(null)}
        title={evidenciasModalConfig?.titulo ?? "Evidencias"}
        size="md"
      >
        <div className="flex flex-col gap-3">
          {evidenciasModalConfig?.archivos.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>
    </>
  );
};

interface PagoCardProps {
  pago: RES_PagoComprobante;
  anulando: boolean;
  disabled: boolean;
  onSolicitarAnular: (pago: RES_PagoComprobante) => void;
  onVerEvidencias: (evidencias: IArchivo[], titulo: string) => void;
}

const PagoCard = ({ pago, anulando, disabled, onSolicitarAnular, onVerEvidencias }: PagoCardProps) => {
  const evidencias: IArchivo[] = Array.isArray(pago.evidencias)
    ? (pago.evidencias as unknown as IArchivo[])
    : [];

  const evidenciasAnulacion: IArchivo[] = Array.isArray(pago.evidencias_anulacion)
    ? (pago.evidencias_anulacion as unknown as IArchivo[])
    : [];

  const monedaSimbolo = pago.es_para_detraccion ? "S/" : "$";
  const colorMonto = pago.es_anulado ? "red.4" : pago.es_para_detraccion ? "yellow.4" : "emerald.4";

  return (
    <Paper
      p="xs"
      radius="md"
      bg="#18181b"
      className={`border ${pago.es_anulado ? "border-red-900/40 opacity-60" : pago.es_para_detraccion ? "border-yellow-700/50 border-l-2 border-l-yellow-400" : "border-indigo-700/50 border-l-2 border-l-indigo-400"}`}
    >
      <Group justify="space-between" align="center" wrap="nowrap" mb={6}>
        <Group gap="xs" wrap="nowrap" align="center">
          <Badge color={pago.es_para_detraccion ? "yellow" : "indigo"} variant="filled" size="xs">
            {pago.es_para_detraccion ? "Detracción" : "Neto"}
          </Badge>
          <Text fw={700} fz="xs" c="white">
            #{pago.id} — {pago.medio_pago}
          </Text>
          {pago.numero_operacion && (
            <Badge variant="outline" color="cyan" size="xs">
              Op: {pago.numero_operacion}
            </Badge>
          )}
        </Group>
        <Group gap="xs" align="center">
          <Text
            fz="xs"
            fw={800}
            c={colorMonto}
            className="font-mono bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800 shrink-0"
          >
            {monedaSimbolo} {pago.monto_pagado.toFixed(2)}
          </Text>
          <Text fz={10} c="dimmed">
            Reg: {formatDateTime(pago.created_at)} ({pago.empleado_registro_nombre ?? "—"})
          </Text>
          {evidencias.length > 0 && (
            <Tooltip label={`Ver evidencias del pago (${evidencias.length})`}>
              <ActionIcon
                variant="light"
                color="indigo"
                size="sm"
                radius="md"
                onClick={() => onVerEvidencias(evidencias, `Evidencias de Pago #${pago.id}`)}
              >
                <IconPaperclip size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {evidenciasAnulacion.length > 0 && (
            <Tooltip label={`Ver evidencias de anulación (${evidenciasAnulacion.length})`}>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                radius="md"
                onClick={() => onVerEvidencias(evidenciasAnulacion, `Evidencias de Anulación — Pago #${pago.id}`)}
              >
                <IconPaperclip size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {!pago.es_anulado && (
            <Tooltip label="Anular pago">
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                radius="md"
                loading={anulando}
                disabled={anulando || disabled}
                onClick={() => onSolicitarAnular(pago)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Group gap="md" wrap="wrap" align="center">
        <div>
          <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Fecha Pago</Text>
          <Text fz="xs" fw={600}>{formatDateTime(pago.fecha_hora_pago)}</Text>
        </div>
        <div>
          <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Origen (Planta)</Text>
          <Text fz="xs" fw={600}>
            {pago.banco_empresa_nombre ?? "—"} · {pago.empresa_numero_cuenta ?? "—"}
          </Text>
        </div>
        <IconArrowRight size={14} className="text-zinc-500 self-end mb-1" />
        <div>
          <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Destino (Proveedor)</Text>
          <Text fz="xs" fw={600}>
            {pago.banco_proveedor_nombre ?? "—"} · {pago.proveedor_numero_cuenta ?? "—"}
          </Text>
        </div>
      </Group>

      {pago.es_anulado && (
        <Text fz={10} c="red.4" mt={4}>
          Anulado el {formatDateTime(pago.fecha_hora_anulacion ?? "")} — {pago.motivo_anulacion}
        </Text>
      )}
    </Paper>
  );
};