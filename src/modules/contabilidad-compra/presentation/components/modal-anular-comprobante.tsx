import { useEffect, useState } from "react";
import { Stack, Textarea, Group, Button, Text, Badge, Alert } from "@mantine/core";
import { IconAlertTriangle, IconBan } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";

interface ModalAnularComprobanteProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra | null;
  onConfirm: (motivo: string) => Promise<void> | void;
  loading: boolean;
}

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

export const ModalAnularComprobante = ({
  opened,
  onClose,
  comprobante,
  onConfirm,
  loading,
}: ModalAnularComprobanteProps) => {
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

  if (!comprobante) return null;

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={
        <Group gap={6}>
          <IconBan size={20} className="text-red-400" />
          <Text fw={700} fz="sm" c="white">
            Anular Comprobante de Compra
          </Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <Alert
          variant="light"
          color="red"
          title="Atención: Acción irreversible"
          icon={<IconAlertTriangle size={16} />}
        >
          Al anular este comprobante, también se anularán automáticamente todos sus pagos registrados en cascada.
        </Alert>

        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs space-y-2">
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Comprobante
            </Text>
            <Badge color="red" variant="filled" size="xs">
              {comprobante.estado}
            </Badge>
          </Group>
          <Text size="sm" c="cyan.4" fw={800} className="font-mono">
            {comprobante.codigo_completo}
          </Text>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Proveedor
            </Text>
            <Text size="xs" c="white" fw={600}>
              {comprobante.proveedor_nombre}
            </Text>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Fecha Emisión
            </Text>
            <Text size="xs" c="white" fw={600}>
              {formatFecha(comprobante.fecha_emision)}
            </Text>
          </Group>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Total ($)
            </Text>
            <Text size="sm" fw={800} c="white" className="font-mono">
              $ {comprobante.total_dolares.toFixed(2)}
            </Text>
          </Group>
        </div>

        <Textarea
          label="Motivo de Anulación:"
          placeholder="Escriba la razón de la anulación del comprobante..."
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
