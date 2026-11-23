import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface Props {
  opened: boolean;
  onClose: () => void;
  value: string | null;
  onConfirm: (iso: string | null) => void;
  title?: string;
  label?: string;
  defaultValue?: Date | null;
}

const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const FechaHoraModal = ({
  opened,
  onClose,
  value,
  onConfirm,
  title = "Seleccionar fecha y hora",
  label = "Fecha y hora",
  defaultValue = null,
}: Props) => {
  const [local, setLocal] = useState<Date | null>(
    toDate(value) ?? defaultValue
  );

  /**
   * Al abrir el modal, el valor local se sincroniza con el de la fila.
   *
   * El ajuste se hace DURANTE el render (comparando con el valor previo) y
   * no dentro de un efecto: un `setState` síncrono en un efecto provoca
   * renders en cascada y la regla `react-hooks/set-state-in-effect` lo marca.
   */
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevValor, setPrevValor] = useState(value);

  if (opened !== prevAbierto || value !== prevValor) {
    setPrevAbierto(opened);
    setPrevValor(value);

    if (opened) {
      setLocal(toDate(value) ?? defaultValue);
    }
  }

  const handleConfirm = () => {
    if (local) {
      onConfirm(local.toISOString());
    } else {
      onConfirm(null);
    }
    onClose();
  };

  return (
    <ModalEstandar opened={opened} close={onClose} title={title} size="sm"
      validateClose
    >
      <Group gap="sm" align="flex-end">
        <DateTimePicker
          label={label}
          value={local}
          onChange={(v) => setLocal(v ? new Date(v) : null)}
          valueFormat="DD/MM/YYYY HH:mm:ss"
          withSeconds
          radius="lg"
          size="sm"
          style={{ flex: 1 }}
        />
        <Button size="sm" radius="lg" onClick={handleConfirm}>
          Aceptar
        </Button>
      </Group>
    </ModalEstandar>
  );
};
