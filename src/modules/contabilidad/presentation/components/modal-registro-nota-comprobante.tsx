import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import {
  Schema_RegistrarNotaComprobante,
  type REQ_RegistrarNotaComprobante,
} from "../../service/contabilidad-compra.requests";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import {
  TipoNotaComprobante,
  TIPO_NOTA_COLOR,
  TIPO_NOTA_DESCRIPCION,
  TIPO_NOTA_SERIES_REFERENCIA,
  TIPO_NOTA_SIGNO,
} from "../../../../shared/enums/contabilidad-compra/tipo-nota-comprobante";
import { MOTIVO_NOTA_CREDITO_OPCIONES } from "../../../../shared/enums/contabilidad-compra/motivo-nota-credito-comprobante";
import { MOTIVO_NOTA_DEBITO_OPCIONES } from "../../../../shared/enums/contabilidad-compra/motivo-nota-debito-comprobante";

interface ModalRegistroNotaComprobanteProps {
  opened: boolean;
  close: () => void;
  comprobante: RES_ComprobanteCompra | null;
  tipo: TipoNotaComprobante;
  loading?: boolean;
  onSubmit: (payload: REQ_RegistrarNotaComprobante) => Promise<boolean>;
}

interface FormState {
  monto: number | string;
  codigo_nota: string;
  motivo: string;
  fecha_emision: Date | null;
}

const hoy = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const EMPTY_FORM = (): FormState => ({
  monto: "",
  codigo_nota: "",
  motivo: "",
  fecha_emision: hoy(),
});

const formatMoneda = (valor: number): string =>
  valor.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Formatea una fecha local a YYYY-MM-DD sin pasar por UTC (evita el corrimiento de día). */
const toFechaISO = (fecha: Date): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

/**
 * Modal de emisión de nota de crédito / débito sobre un comprobante de compra.
 *
 * El monto se registra en USD (moneda operativa del comprobante). La nota NO
 * altera los montos reales del comprobante: genera el snapshot ajustado
 * (neto y detracción) que define el nuevo saldo pagable.
 */
export const ModalRegistroNotaComprobante = ({
  opened,
  close,
  comprobante,
  tipo,
  loading = false,
  onSubmit,
}: ModalRegistroNotaComprobanteProps) => {
  const [form, setForm] = useState<FormState>(() => EMPTY_FORM());
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrores((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const esCredito = tipo === TipoNotaComprobante.Credito;
  const colorTipo = TIPO_NOTA_COLOR[tipo];
  const signo = TIPO_NOTA_SIGNO[tipo];

  const opcionesMotivo = esCredito
    ? MOTIVO_NOTA_CREDITO_OPCIONES
    : MOTIVO_NOTA_DEBITO_OPCIONES;

  const montoNeto = comprobante?.monto_neto ?? 0;
  const montoDetraccionSoles = comprobante?.monto_detraccion_soles ?? 0;
  const deltaActual = comprobante?.delta_neto ?? 0;
  const avancePagoNeto = comprobante?.avance_pago_neto ?? 0;

  const montoNumerico = Number(form.monto) || 0;
  const netoProyectado = Math.max(0, montoNeto + deltaActual + signo * montoNumerico);
  const detraccionProyectada =
    montoNeto > 0
      ? Math.max(0, (montoDetraccionSoles * netoProyectado) / montoNeto)
      : 0;
  const saldoProyectado = netoProyectado - avancePagoNeto;
  const avancePagoDetraccion = comprobante?.avance_pago_detraccion ?? 0;
  const saldoDetraccionProyectado = detraccionProyectada - avancePagoDetraccion;

  const handleClose = () => {
    setForm(EMPTY_FORM());
    setErrores({});
    setFiles([]);
    close();
  };

  const handleSubmit = async () => {
    const payloadBase = {
      tipo,
      monto: montoNumerico,
      codigo_nota: form.codigo_nota.trim(),
      motivo: form.motivo,
      fecha_emision: form.fecha_emision ? toFechaISO(form.fecha_emision) : "",
    };

    const parsed = Schema_RegistrarNotaComprobante.safeParse(payloadBase);
    if (!parsed.success) {
      const mapa: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "");
        if (key && !mapa[key]) mapa[key] = issue.message;
      });
      setErrores(mapa);
      return;
    }

    const ok = await onSubmit({
      ...parsed.data,
      tipo,
      documentos: files.length > 0 ? files : undefined,
    });

    if (ok) {
      handleClose();
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={
        <Group gap="xs">
          <Text fw={800} fz="md" c="white">
            Emitir {TIPO_NOTA_DESCRIPCION[tipo]}
          </Text>
          <Badge variant="light" color={colorTipo} size="sm" radius="md">
            {comprobante?.codigo_completo ?? ""}
          </Badge>
        </Group>
      }
      rightSection={
        <CustomDatePicker
          value={form.fecha_emision}
          onChange={(value) => setField("fecha_emision", value)}
          error={errores.fecha_emision}
          placeholder="DD/MM/AAAA"
          size="xs"
          radius="lg"
          w={168}
        />
      }
      size="lg"
    >
      <Stack gap="md">
        {comprobante && (
          <Group grow align="stretch">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
              <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                Neto del comprobante
              </Text>
              <Text fz="md" fw={800} c="white" className="font-mono">
                $ {formatMoneda(montoNeto)}
              </Text>
              {deltaActual !== 0 && (
                <Text fz={10} c={deltaActual < 0 ? "teal.4" : "orange.4"} fw={700}>
                  Ajuste vigente: {deltaActual < 0 ? "−" : "+"}$
                  {formatMoneda(Math.abs(deltaActual))}
                </Text>
              )}
              <Text fz={10} c="zinc.5">
                Pagado: $ {formatMoneda(avancePagoNeto)}
              </Text>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
              <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                Resultado de la nota
              </Text>
              <Text fz="md" fw={800} c={colorTipo} className="font-mono">
                $ {formatMoneda(netoProyectado)}
              </Text>
              <Text fz={10} c="zinc.5">
                Detracción: S/ {formatMoneda(detraccionProyectada)}
              </Text>
              <Text
                fz={10}
                fw={700}
                c={saldoDetraccionProyectado < 0 ? "yellow.4" : "zinc.5"}
              >
                {saldoDetraccionProyectado < 0
                  ? `Saldo a favor: S/ ${formatMoneda(Math.abs(saldoDetraccionProyectado))}`
                  : `Detracción pendiente: S/ ${formatMoneda(saldoDetraccionProyectado)}`}
              </Text>
              <Text
                fz={10}
                fw={700}
                c={saldoProyectado < 0 ? "yellow.4" : "zinc.5"}
              >
                {saldoProyectado < 0
                  ? `Saldo a favor: $ ${formatMoneda(Math.abs(saldoProyectado))}`
                  : `Saldo pendiente: $ ${formatMoneda(saldoProyectado)}`}
              </Text>
            </div>
          </Group>
        )}

        <Group grow align="flex-start" gap="sm" wrap="nowrap">
          <NumberInput
            label="Monto (USD)"
            placeholder="0.00"
            size="xs"
            radius="lg"
            hideControls
            fixedDecimalScale
            decimalScale={2}
            min={0}
            value={form.monto}
            onChange={(value) => setField("monto", value)}
            error={errores.monto}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white",
              label: "text-zinc-300 mb-1 font-medium",
            }}
          />

          <Select
            label="Motivo SUNAT"
            placeholder={
              esCredito
                ? "Catálogo 09 — Nota de crédito"
                : "Catálogo 10 — Nota de débito"
            }
            size="xs"
            radius="lg"
            searchable
            data={opcionesMotivo}
            value={form.motivo || null}
            onChange={(value) => setField("motivo", value ?? "")}
            error={errores.motivo}
          comboboxProps={{ withinPortal: true }}
          classNames={{
            input:
              "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white",
            label: "text-zinc-300 mb-1 font-medium",
          }}
        />

          <TextInput
            label="Código"
            placeholder="FC01-00001"
            description={TIPO_NOTA_SERIES_REFERENCIA[tipo]}
            size="xs"
            radius="lg"
            value={form.codigo_nota}
            onChange={(event) => setField("codigo_nota", event.currentTarget.value)}
            error={errores.codigo_nota}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white",
              label: "text-zinc-300 mb-1 font-medium",
              description: "text-zinc-500 text-[10px]",
            }}
          />
        </Group>

        <MultiFilePicker
          files={files}
          onFilesChange={setFiles}
          label="Documentos de la nota (opcional)"
          description="PDF o imagen del documento emitido por SUNAT"
        />

        {saldoProyectado < 0 && (
          <Alert
            variant="light"
            color="yellow"
            icon={<IconAlertCircle size={18} />}
            radius="lg"
            p="sm"
          >
            <Text fz="xs" lh={1.5}>
              El comprobante ya tiene pagado un monto mayor al neto ajustado: quedaría
              un <strong>saldo a favor de ${formatMoneda(Math.abs(saldoProyectado))}</strong>{ " "}
              a recuperar del proveedor. La nota se puede emitir igual.
            </Text>
          </Alert>
        )}

        <Group justify="flex-end" mt="xs">
          <Tooltip label="Cerrar sin emitir la nota">
            <Button variant="subtle" color="gray" radius="xl" size="xs" onClick={handleClose}>
              Cancelar
            </Button>
          </Tooltip>
          <Button
            radius="xl"
            size="xs"
            color={colorTipo}
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
          >
            Emitir {TIPO_NOTA_DESCRIPCION[tipo]}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
