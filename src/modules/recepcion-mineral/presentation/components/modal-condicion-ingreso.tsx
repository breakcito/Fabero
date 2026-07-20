import { useState } from "react";
import { Select, Button } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";

interface ModalCondicionIngresoProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (condicion: CondicionIngreso) => void;
}

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);

  const handleConfirm = () => {
    onConfirm(condicion);
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Generar Lote - Condición de Ingreso"
      size="sm"
    >
      <div className="flex flex-col gap-4 p-2">
        <Select
          label="Seleccione la condición de ingreso para el lote"
          placeholder="Seleccionar condición"
          data={[
            { value: CondicionIngreso.Comercializacion, label: "Comercialización (Prefijo FB)" },
            { value: CondicionIngreso.Chancado, label: "Chancado (Prefijo LOT)" },
            { value: CondicionIngreso.Almacen, label: "Almacén (Prefijo LOT)" },
          ]}
          value={condicion}
          onChange={(val) => setCondicion((val as CondicionIngreso) || CondicionIngreso.Comercializacion)}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
          className="text-zinc-200"
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="subtle" color="zinc" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="indigo" onClick={handleConfirm}>
            Generar Lote
          </Button>
        </div>
      </div>
    </ModalEstandar>
  );
};
