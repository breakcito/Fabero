import { useState } from "react";
import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconCalendar, IconClipboardCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useLlegadaCliente } from "../../hooks/useLlegadaCliente";
import type { DespachoDetalle } from "../../service/programacion-despachos.responses";

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface Props {
  opened: boolean;
  onClose: () => void;
  idDistribucion: number;
  /**
   * Callback al persistir la fecha exitosamente. El padre refresca el detalle
   * del despacho y abre `ModalLlegadaCliente` con la fecha recién registrada.
   */
  onSuccess: (fecha: string, despachoActualizado: DespachoDetalle) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[34px] text-xs",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

/**
 * Modal pequeño (paso 1 de 2) para registrar la fecha de llegada al cliente
 * antes de capturar los datos por detalle (peso, leyes, etc.).
 *
 * Persistencia inmediata: al confirmar se hace PUT al endpoint
 * `actualizar_datos_cliente` con `detalles: []` (el backend ya soporta esa
 * forma — ver `actualizar_datos_cliente` en ProgramacionDespachosController).
 */
export const ModalFechaLlegadaCliente = ({
  opened,
  onClose,
  idDistribucion,
  onSuccess,
}: Props) => {
  const { loading, registrarFechaLlegada } = useLlegadaCliente();

  const [fecha, setFecha] = useState<string>(todayIso());
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  const resetForm = () => {
    setFecha(todayIso());
    setErrorFecha(null);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleContinuar = async (): Promise<void> => {
    if (!fecha) {
      setErrorFecha("La fecha de llegada al cliente es obligatoria.");
      return;
    }
    setErrorFecha(null);

    const result = await registrarFechaLlegada(idDistribucion, fecha);
    if (result) {
      resetForm();
      onSuccess(fecha, result);
      onClose();
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={
        <Group gap={6} wrap="nowrap">
          <IconClipboardCheck size={20} className="text-indigo-400" />
          <Text fw={700} fz="md" c="white">
             Fecha de Llegada al Cliente
          </Text>
        </Group>
      }
      size="xs"
    >
      <Stack gap="md">
        <Text size="xs" c="zinc.4">
          Indica la fecha en la que el cliente recibió la carga. Luego
          podrás completar los datos reportados (peso, leyes, humedad).
        </Text>

        <TextInput
          type="date"
          label="Fecha de llegada al cliente"
          placeholder="Seleccione fecha"
          value={fecha}
          onChange={(e) => {
            setFecha(e.currentTarget.value);
            if (errorFecha) setErrorFecha(null);
          }}
          leftSection={<IconCalendar size={14} />}
          required
          withAsterisk
          radius="lg"
          size="xs"
          disabled={loading}
          error={errorFecha}
          classNames={fieldClasses}
        />

        <Group justify="flex-end" gap="md" mt="xs">
          <Button
            variant="default"
            radius="lg"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="bg-zinc-800! text-zinc-300! border-zinc-700!"
          >
            Cancelar
          </Button>
          <Button
            radius="lg"
            size="sm"
            color="indigo"
            loading={loading}
            disabled={loading || !fecha}
            onClick={() => void handleContinuar()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30"
          >
            Continuar
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
