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
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { DTO_CrearAnticipoProveedor } from "../../service/anticipos-proveedor.requests";

interface ModalCrearAnticipoProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (dto: DTO_CrearAnticipoProveedor) => Promise<boolean>;
  proveedores: RES_Proveedor[];
  loadingProveedores: boolean;
  submitting: boolean;
}

const anticipoSchema = z.object({
  id_proveedor_minero: z.number({ message: "Debe seleccionar un proveedor minero." }).min(1, "Debe seleccionar un proveedor minero."),
  serie_factura: z.string().optional(),
  numero_factura: z.string().optional(),
  saldo_inicial: z.number({ message: "Debe ingresar el saldo inicial." }).min(0.01, "El saldo inicial debe ser mayor a 0."),
});

export const ModalCrearAnticipo = ({
  opened,
  onClose,
  onSubmit,
  proveedores,
  loadingProveedores,
  submitting,
}: ModalCrearAnticipoProps) => {
  const { notifyError } = useNotify();

  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [serieFactura, setSerieFactura] = useState<string>("");
  const [numeroFactura, setNumeroFactura] = useState<string>("");
  const [saldoInicial, setSaldoInicial] = useState<number | string>("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const handleReset = () => {
    setIdProveedor(null);
    setSerieFactura("");
    setNumeroFactura("");
    setSaldoInicial("");
    setEvidencias([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    const rawDto = {
      id_proveedor_minero: idProveedor ? Number(idProveedor) : 0,
      serie_factura: serieFactura.trim() || undefined,
      numero_factura: numeroFactura.trim() || undefined,
      saldo_inicial: typeof saldoInicial === "number" ? saldoInicial : Number(saldoInicial),
    };

    const parseResult = anticipoSchema.safeParse(rawDto);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || "Datos inválidos";
      notifyError(errorMsg);
      return;
    }

    const dto: DTO_CrearAnticipoProveedor = {
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
      title="Registrar Nuevo Anticipo"
      size="lg"
    >
      <Stack gap="md">
        {/* Proveedor Minero */}
        <Select
          label="Proveedor Minero:"
          placeholder={loadingProveedores ? "Cargando proveedores..." : "Seleccione un proveedor"}
          searchable
          disabled={loadingProveedores}
          rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
          data={proveedores.map((p) => ({
            value: String(p.id_proveedor),
            label: `${p.razon_social} (${p.documento})`,
          }))}
          value={idProveedor}
          onChange={setIdProveedor}
          classNames={fieldClasses}
          size="xs"
          radius="lg"
          required
          comboboxProps={{ withinPortal: true }}
        />

        <Group grow gap="md">
          {/* Serie Factura */}
          <TextInput
            label="Serie Factura (Opcional):"
            placeholder="Ej: F001"
            value={serieFactura}
            onChange={(e) => setSerieFactura(e.currentTarget.value)}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
          />

          {/* Número Factura */}
          <TextInput
            label="Número Factura (Opcional):"
            placeholder="Ej: 00001234"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.currentTarget.value)}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
          />
        </Group>

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
