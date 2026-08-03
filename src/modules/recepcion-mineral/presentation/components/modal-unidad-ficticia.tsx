import { useState, useEffect } from "react";
import {
  Stack,
  Grid,
  Text,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import { IconCalendarPlus, IconClock, IconCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: (fechaHoraIngreso: string) => Promise<void> | void;
  initialFechaHoraIngreso?: string | null;
  mode?: "create" | "edit";
  loading?: boolean;
}

const pad = (n: number) => n.toString().padStart(2, "0");

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toTimeInput = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const ModalUnidadFicticia = ({
  opened,
  onClose,
  onConfirm,
  initialFechaHoraIngreso,
  mode = "create",
  loading,
}: Props) => {
  const { notifyError } = useNotify();

  const ahora = new Date();
  const [fecha, setFecha] = useState<string>(toDateInput(ahora));
  const [hora, setHora] = useState<string>(toTimeInput(ahora));
  const [internalLoading, setInternalLoading] = useState(false);

  const isBusy = !!loading || internalLoading;

  useEffect(() => {
    if (!opened) return;

    const base = initialFechaHoraIngreso
      ? new Date(initialFechaHoraIngreso)
      : new Date();

    if (!isNaN(base.getTime())) {
      setFecha(toDateInput(base));
      setHora(toTimeInput(base));
    } else {
      const now = new Date();
      setFecha(toDateInput(now));
      setHora(toTimeInput(now));
    }
  }, [opened, initialFechaHoraIngreso]);

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
  };

  const handleConfirm = async () => {
    if (!fecha) {
      notifyError("Debe seleccionar una fecha de ingreso");
      return;
    }
    const combinado = `${fecha} ${hora || "00:00"}:00`;
    const fechaHora = new Date(combinado);
    if (isNaN(fechaHora.getTime())) {
      notifyError("La combinación de fecha y hora no es válida");
      return;
    }

    if (fechaHora.getTime() > Date.now()) {
      notifyError("La fecha y hora no pueden estar en el futuro");
      return;
    }

    try {
      setInternalLoading(true);
      await onConfirm(combinado);
    } catch (e) {
      console.error(e);
    } finally {
      setInternalLoading(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={isEdit ? "Editar Fecha y Hora de Unidad Ficticia" : "Registrar Unidad Ficticia"}
      size="md"
    >
      <Stack gap="md">
        <Text size="xs" c="zinc.4">
          {isEdit
            ? "Modifique la fecha y hora en que se conceptuará el ingreso de esta unidad ficticia. La placa se gestiona desde el flujo de validación."
            : "Se generará una unidad vehicular ficticia para iniciar un proceso de pesaje sin placa física. Complete la fecha y hora en que se conceptuará el ingreso."}
        </Text>

        <Grid gutter="sm">
          <Grid.Col span={{ base: 12, sm: 7 }}>
            <TextInput
              type="date"
              label="Fecha de Ingreso"
              leftSection={
                <IconCalendarPlus size={16} className="text-indigo-400" />
              }
              value={fecha}
              onChange={(e) => setFecha(e.currentTarget.value)}
              classNames={fieldClasses}
              style={{ colorScheme: "dark" }}
              disabled={isBusy}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <TextInput
              type="time"
              label="Hora de Ingreso"
              leftSection={<IconClock size={16} className="text-indigo-400" />}
              value={hora}
              onChange={(e) => setHora(e.currentTarget.value)}
              classNames={fieldClasses}
              style={{ colorScheme: "dark" }}
              disabled={isBusy}
              required
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" gap="xs" pt="xs">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onClose}
            disabled={isBusy}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cancelar
          </Button>
          <Button
            radius="lg"
            loading={isBusy}
            disabled={isBusy}
            onClick={handleConfirm}
            leftSection={<IconCheck size={18} />}
            className={`font-bold shadow-lg px-6 ${
              isEdit
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-900/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
            }`}
          >
            {isEdit ? "Guardar Cambios" : "Crear Unidad"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};