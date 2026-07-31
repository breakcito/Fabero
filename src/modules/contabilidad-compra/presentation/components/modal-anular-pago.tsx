import { useEffect, useState } from "react";
import { Stack, Textarea, Group, Button, Text, Badge } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_PagoComprobante } from "../../service/contabilidad-compra.responses";

interface ModalAnularPagoProps {
  opened: boolean;
  onClose: () => void;
  pago: RES_PagoComprobante | null;
  onConfirm: (motivo: string) => Promise<void> | void;
  loading: boolean;
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

export const ModalAnularPago = ({
  opened,
  onClose,
  pago,
  onConfirm,
  loading,
}: ModalAnularPagoProps) => {
  const { notifyError } = useNotify();
  const [motivo, setMotivo] = useState<string>("");

  useEffect(() => {
    if (!opened) setMotivo("");
  }, [opened]);

  const handleClose = () => {
    if (loading) return;
    setMotivo("");
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = motivo.trim();
    if (!trimmed || trimmed.length < 3) {
      notifyError("Debe ingresar un motivo válido de anulación (mínimo 3 caracteres).");
      return;
    }
    await onConfirm(trimmed);
  };

  if (!pago) return null;

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title="Anular Pago"
      size="md"
    >
      <Stack gap="md">
        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs space-y-2">
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Pago #
            </Text>
            <Badge
              color={pago.es_para_detraccion ? "yellow" : "indigo"}
              variant="filled"
              size="xs"
            >
              {pago.es_para_detraccion ? "Detracción" : "Neto"}
            </Badge>
          </Group>
          <Text size="sm" c="white" fw={700}>
            #{pago.id} — {pago.medio_pago}
            {pago.numero_operacion && (
              <Text component="span" c="dimmed" ml="xs">
                · Op: {pago.numero_operacion}
              </Text>
            )}
          </Text>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Fecha Pago
            </Text>
            <Text size="xs" c="white" fw={600}>
              {formatDateTime(pago.fecha_hora_pago)}
            </Text>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Monto
            </Text>
            <Text
              size="sm"
              fw={800}
              c={pago.es_para_detraccion ? "yellow.4" : "emerald.4"}
            >
              {pago.es_para_detraccion ? "S/" : "$"} {pago.monto_pagado.toFixed(2)}
            </Text>
          </Group>
        </div>

        <Textarea
          label="Motivo de Anulación:"
          placeholder="Escriba la razón de la anulación..."
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          rows={3}
          size="xs"
          radius="lg"
          required
          disabled={loading}
          classNames={{
            input:
              "bg-zinc-900/50 border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder:text-zinc-500 transition-all",
            label: "text-zinc-300 mb-1 font-medium",
          }}
        />

        <Group justify="end" mt="xs" gap="xs">
          <Button
            variant="default"
            color="gray"
            size="xs"
            radius="lg"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="red"
            size="xs"
            radius="lg"
            leftSection={<IconTrash size={14} />}
            onClick={handleSubmit}
            loading={loading}
          >
            Confirmar Anulación
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
