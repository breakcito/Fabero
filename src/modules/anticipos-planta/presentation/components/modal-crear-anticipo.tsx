import { useState } from "react";
import {
  Stack,
  TextInput,
  NumberInput,
  Select,
  Loader,
  Group,
  Button,
} from "@mantine/core";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { useNotify } from "../../../../hooks/useNotify";
import type { DTO_CrearAnticipoPlanta } from "../../service/anticipos-planta.requests";

interface ModalCrearAnticipoPlantaProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (dto: DTO_CrearAnticipoPlanta) => Promise<boolean>;
  plantas: Array<{ id: number; ruc: string; razon_social: string }>;
  loadingPlantas: boolean;
  submitting: boolean;
}

const anticipoPlantaSchema = z.object({
  id_planta: z
    .number({ message: "Debe seleccionar una planta destino." })
    .min(1, "Debe seleccionar una planta destino."),
  codigo_comprobante: z
    .string()
    .trim()
    .min(1, "Debe ingresar el código de comprobante."),
  saldo_inicial: z
    .number({ message: "Debe ingresar el saldo inicial." })
    .min(0.01, "El saldo inicial debe ser mayor a 0."),
});

export const ModalCrearAnticipoPlanta = ({
  opened,
  onClose,
  onSubmit,
  plantas,
  loadingPlantas,
  submitting,
}: ModalCrearAnticipoPlantaProps) => {
  const { notifyError } = useNotify();

  const [idPlanta, setIdPlanta] = useState<string | null>(null);
  const [codigoComprobante, setCodigoComprobante] = useState<string>("");
  const [saldoInicial, setSaldoInicial] = useState<number | string>("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const handleReset = () => {
    setIdPlanta(null);
    setCodigoComprobante("");
    setSaldoInicial("");
    setEvidencias([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    const rawDto = {
      id_planta: idPlanta ? Number(idPlanta) : 0,
      codigo_comprobante: codigoComprobante.trim() || undefined,
      saldo_inicial:
        typeof saldoInicial === "number" ? saldoInicial : Number(saldoInicial),
    };

    const parseResult = anticipoPlantaSchema.safeParse(rawDto);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || "Datos inválidos";
      notifyError(errorMsg);
      return;
    }

    const dto: DTO_CrearAnticipoPlanta = {
      ...parseResult.data,
      evidencias,
    };

    const success = await onSubmit(dto);
    if (success) {
      handleClose();
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title="Registrar Nuevo Anticipo a Planta"
      size="lg"
    >
      <Stack gap="md">
        {/* Planta Destino + Código Comprobante + Monto Inicial en la misma fila */}
        <Group grow gap="md" align="flex-end">
          {/* Planta Destino */}
          <Select
            label="Planta Destino:"
            placeholder={
              loadingPlantas ? "Cargando plantas..." : "Seleccione una planta"
            }
            searchable
            disabled={loadingPlantas}
            rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
            data={plantas.map((p) => ({
              value: String(p.id),
              label: `${p.razon_social} (${p.ruc})`,
            }))}
            value={idPlanta}
            onChange={setIdPlanta}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
            required
            comboboxProps={{ withinPortal: true }}
          />

          {/* Código Comprobante */}
          <TextInput
            label="Código de Comprobante:"
            placeholder="Ej: COMP-2026-0001"
            maxLength={30}
            value={codigoComprobante}
            onChange={(e) => setCodigoComprobante(e.currentTarget.value)}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
            required
          />

          {/* Saldo / Monto Inicial */}
          <NumberInput
            label="Monto Inicial del Anticipo:"
            placeholder="0.00"
            value={saldoInicial}
            onChange={setSaldoInicial}
            min={0.01}
            decimalScale={2}
            fixedDecimalScale
            classNames={fieldClasses}
            size="xs"
            radius="lg"
            prefix="$ "
            required
          />
        </Group>

        {/* Archivos / Evidencias */}
        <Stack gap="xs">
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            label="Evidencias / Comprobantes (Opcional)"
          />
        </Stack>

        <Group justify="end" mt="md" gap="xs">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="lg"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            color="emerald"
            size="xs"
            radius="lg"
            onClick={handleSubmit}
            loading={submitting}
          >
            Guardar Anticipo
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
