import { useEffect, useState } from "react";
import { Stack, Textarea, Group, Button, Text, Badge, Alert } from "@mantine/core";
import { IconAlertTriangle, IconBan } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_ComprobanteNota } from "../../service/contabilidad-compra.responses";
import {
  TipoNotaComprobante,
  TIPO_NOTA_COLOR,
  TIPO_NOTA_DESCRIPCION,
} from "../../../../shared/enums/contabilidad-compra/tipo-nota-comprobante";

interface ModalAnularNotaComprobanteProps {
  opened: boolean;
  onClose: () => void;
  nota: RES_ComprobanteNota | null;
  onConfirm: (motivo: string) => Promise<void> | void;
  loading: boolean;
}

const formatMoneda = (valor: number): string =>
  valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Anulación de una nota de crédito / débito.
 * Al anular, el snapshot de montos ajustados del comprobante se recalcula.
 */
export const ModalAnularNotaComprobante = ({
  opened,
  onClose,
  nota,
  onConfirm,
  loading,
}: ModalAnularNotaComprobanteProps) => {
  const { notifyError } = useNotify();
  const [motivo, setMotivo] = useState<string>("");

  useEffect(() => {
    if (!opened) {
      queueMicrotask(() => setMotivo(""));
    }
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

  if (!nota) return null;

  const esCredito = nota.tipo === TipoNotaComprobante.Credito;
  const color = TIPO_NOTA_COLOR[nota.tipo];

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={
        <Group gap={6}>
          <IconBan size={20} className="text-red-400" />
          <Text fw={700} fz="sm" c="white">
            Anular {TIPO_NOTA_DESCRIPCION[nota.tipo]}
          </Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <Alert
          variant="light"
          color="red"
          title="Atención: se recalculará el saldo del comprobante"
          icon={<IconAlertTriangle size={16} />}
        >
          El monto a pagar del comprobante volverá a calcularse sin esta nota. El
          correlativo de dirimencia ya emitido no se revierte.
        </Alert>

        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs space-y-2">
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Tipo
            </Text>
            <Badge color={color} variant="filled" size="xs">
              {TIPO_NOTA_DESCRIPCION[nota.tipo]}
            </Badge>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Código
            </Text>
            <Text size="xs" c="white" fw={600} className="font-mono">
              {nota.codigo_nota ?? "—"}
            </Text>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Motivo SUNAT
            </Text>
            <Text size="xs" c="white" fw={600}>
              {nota.motivo_descripcion ?? nota.motivo ?? "—"}
            </Text>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Monto
            </Text>
            <Text size="sm" fw={800} c={color} className="font-mono">
              {esCredito ? "−" : "+"}$ {formatMoneda(nota.monto)}
            </Text>
          </Group>
        </div>

        <Textarea
          label="Motivo de Anulación:"
          placeholder="Escriba la razón de la anulación de la nota..."
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
            leftSection={<IconBan size={14} />}
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
