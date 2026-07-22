import { useState } from "react";
import { Stack, Textarea, Group, Button, Text } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";

interface ModalAnularAnticipoProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<boolean>;
  loading: boolean;
  anticipoInfo?: {
    id: number;
    proveedor: string;
    saldo: number;
  } | null;
}

export const ModalAnularAnticipo = ({
  opened,
  onClose,
  onConfirm,
  loading,
  anticipoInfo,
}: ModalAnularAnticipoProps) => {
  const { notifyError } = useNotify();
  const [motivo, setMotivo] = useState<string>("");

  const handleClose = () => {
    setMotivo("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!motivo.trim() || motivo.trim().length < 3) {
      notifyError("Debe ingresar un motivo válido de anulación (mínimo 3 caracteres).");
      return;
    }

    const success = await onConfirm(motivo.trim());
    if (success) {
      handleClose();
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title="Anular Anticipo"
      size="md"
    >
      <Stack gap="md">
        {anticipoInfo && (
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs space-y-1">
            <Text size="xs" c="dimmed">
              Proveedor: <span className="text-white font-medium">{anticipoInfo.proveedor}</span>
            </Text>
            <Text size="xs" c="dimmed">
              Monto Inicial: <span className="text-emerald-400 font-semibold font-mono">${anticipoInfo.saldo.toFixed(2)}</span>
            </Text>
          </div>
        )}

        <Textarea
          label="Motivo de Anulación:"
          placeholder="Escriba la razón de la anulación..."
          value={motivo}
          onChange={(e) => setMotivo(e.currentTarget.value)}
          rows={3}
          classNames={fieldClasses}
          size="xs"
          radius="lg"
          required
        />

        <Group justify="end" mt="md" gap="xs">
          <Button
            variant="subtle"
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
