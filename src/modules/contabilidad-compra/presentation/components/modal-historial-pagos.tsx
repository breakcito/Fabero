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
import { IconArrowRight, IconPlus, IconReceipt, IconTrash } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { RES_ComprobanteCompra, RES_PagoComprobante } from "../../service/contabilidad-compra.responses";
import { usePagosComprobante } from "../../hooks/usePagosComprobante";
import { ModalAnularPago } from "./modal-anular-pago";

interface ModalHistorialPagosProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra | null;
  onAnularPago: (idPago: number, motivo: string) => void;
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

  useEffect(() => {
    if (opened && comprobante) {
      void cargarPagos(comprobante.id);
    }
  }, [opened, comprobante, cargarPagos]);

  if (!comprobante) return null;

  const totalComprobante = comprobante.monto_neto + comprobante.monto_detraccion_soles;
  const totalPagadoNeto = comprobante.avance_pago_neto;
  const totalPagadoDetraccion = comprobante.avance_pago_detraccion;
  const totalPagado = totalPagadoNeto + totalPagadoDetraccion;
  const saldoPendiente = Math.max(totalComprobante - totalPagado, 0);

  const todasAprobadas = comprobante.aprobaciones.every((a) => a.esta_aprobado);
  const habilitadoRegistrar = todasAprobadas && comprobante.estado !== "Anulado";

  return (
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
            <Text fz={9} tt="uppercase" c="dimmed" fw={700}>Total</Text>
            <Text fz="xs" fw={800} c="white">$ {comprobante.total_dolares.toFixed(2)}</Text>
          </div>
          <div className="bg-zinc-900/60 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-center">
            <Text fz={9} tt="uppercase" c="emerald.4" fw={700}>Total Pagado</Text>
            <Text fz="xs" fw={800} c="emerald.4">$ {totalPagado.toFixed(2)}</Text>
          </div>
          <div className="bg-zinc-900/60 border border-red-500/40 rounded-lg px-2.5 py-1 text-center">
            <Text fz={9} tt="uppercase" c="red.4" fw={700}>Saldo Pendiente</Text>
            <Text fz="xs" fw={800} c="red.4">$ {saldoPendiente.toFixed(2)}</Text>
          </div>
          <Tooltip label={habilitadoRegistrar ? "Registrar Pago" : "Complete las 3 aprobaciones"}>
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
      size="5xl"
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
                disabled={approving}
                onSolicitarAnular={setPagoAAnular}
              />
            ))}
          </Stack>
        )}

        <Group justify="space-between" align="center">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Total Pagado ($): $ {totalPagado.toFixed(2)}
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
        onConfirm={(motivo) => {
          if (pagoAAnular) {
            onAnularPago(pagoAAnular.id, motivo);
            setPagoAAnular(null);
          }
        }}
      />
    </ModalEstandar>
  );
};

interface PagoCardProps {
  pago: RES_PagoComprobante;
  anulando: boolean;
  disabled: boolean;
  onSolicitarAnular: (pago: RES_PagoComprobante) => void;
}

const PagoCard = ({ pago, anulando, disabled, onSolicitarAnular }: PagoCardProps) => {
  return (
    <Paper
      p="xs"
      radius="md"
      bg="#18181b"
      className={`border ${pago.es_anulado ? "border-red-900/40 opacity-60" : pago.es_para_detraccion ? "border-yellow-700/50 border-l-2 border-l-yellow-400" : "border-indigo-700/50 border-l-2 border-l-indigo-400"}`}
    >
      <Group justify="space-between" align="center" wrap="nowrap" mb={6}>
        <Group gap="xs" wrap="nowrap">
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
        <Group gap={6}>
          <Text fz={10} c="dimmed">
            Reg: {formatDateTime(pago.created_at)} ({pago.empleado_registro_nombre ?? "—"})
          </Text>
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

      <Group gap="md" wrap="wrap">
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
        <div>
          <Text fz="xs" fw={800} c={pago.es_anulado ? "red.4" : pago.es_para_detraccion ? "yellow.4" : "emerald.4"}>
            {pago.es_para_detraccion ? "S/" : "$"} {pago.monto_pagado.toFixed(2)}
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