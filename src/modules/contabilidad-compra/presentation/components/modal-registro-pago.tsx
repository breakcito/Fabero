import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconAlertCircle, IconArrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { MedioPagoComprobante } from "../../../../shared/enums/contabilidad-compra/medio-pago-comprobante";
import type { REQ_RegistrarPago } from "../../service/contabilidad-compra.requests";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";

interface ModalRegistroPagoProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra;
  onSubmit: (payload: REQ_RegistrarPago) => Promise<boolean>;
  submitting: boolean;
}

interface CuentaOption {
  id_cuenta_bancaria: number;
  banco: string;
  banco_abv: string;
  id_banco: number;
  numero_cuenta: string;
  moneda: string;
}

export const ModalRegistroPago = ({
  opened,
  onClose,
  comprobante,
  onSubmit,
  submitting,
}: ModalRegistroPagoProps) => {
  const { notifyError } = useNotify();

  const [esParaDetraccion, setEsParaDetraccion] = useState(false);
  const [fechaPago, setFechaPago] = useState<Date | null>(new Date());
  const [medioPago, setMedioPago] = useState<MedioPagoComprobante>(MedioPagoComprobante.Transferencia);
  const [monto, setMonto] = useState<number | string>("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [observacion, setObservacion] = useState("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const [cuentasEmpresa, setCuentasEmpresa] = useState<CuentaOption[]>([]);
  const [loadingCuentasEmpresa, setLoadingCuentasEmpresa] = useState(false);
  const [idBancoEmpresa, setIdBancoEmpresa] = useState<string | null>(null);
  const [idCuentaEmpresa, setIdCuentaEmpresa] = useState<string | null>(null);

  const [cuentasProveedor, setCuentasProveedor] = useState<CuentaOption[]>([]);
  const [loadingCuentasProveedor, setLoadingCuentasProveedor] = useState(false);
  const [idBancoProveedor, setIdBancoProveedor] = useState<string | null>(null);
  const [idCuentaProveedor, setIdCuentaProveedor] = useState<string | null>(null);

  const calcPorPagar = (esDetraccion: boolean): number =>
    Math.max(
      esDetraccion
        ? comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion
        : comprobante.monto_neto - comprobante.avance_pago_neto,
      0,
    );

  /**
   * Serializa fecha+hora del DateTimePicker usando dayjs (mismo motor que usa
   * internamente Mantine v8) para evitar desfases de zona horaria al extraer
   * año/mes/día/hora/minuto con los getters nativos del Date.
   */
  const toDateTimeString = (value: Date | null) => {
    if (!value) return null;
    const d = dayjs(value);
    if (!d.isValid()) return null;
    return d.format("YYYY-MM-DD HH:mm:ss");
  };

  useEffect(() => {
    if (!opened) return;
    setEsParaDetraccion(false);
    setFechaPago(new Date());
    setMedioPago(MedioPagoComprobante.Transferencia);
    setMonto(calcPorPagar(false));
    setNumeroOperacion("");
    setObservacion("");
    setEvidencias([]);
    setIdBancoEmpresa(null);
    setIdCuentaEmpresa(null);
    setIdBancoProveedor(null);
    setIdCuentaProveedor(null);
    setCuentasEmpresa([]);
    setCuentasProveedor([]);
  }, [opened]);  // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Cuando el usuario alterna el switch "Pago de Detracción", re-pre-rellenamos
   * el monto con el saldo pendiente adecuado (en soles para detracción, en dólares
   * para neto). El usuario puede editarlo libremente después.
   *
   * También se re-dispara cuando el comprobante prop se actualiza con datos
   * frescos (p. ej. tras el refetch de `handleAbrirRegistroPago`), para evitar
   * que el modal siga mostrando el `porPagar` calculado con datos stale.
   */
  useEffect(() => {
    if (!opened) return;
    setMonto(calcPorPagar(esParaDetraccion));
  }, [
    esParaDetraccion,
    opened,
    comprobante.avance_pago_detraccion,
    comprobante.avance_pago_neto,
  ]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar cuentas empresa filtradas por moneda
  useEffect(() => {
    if (!opened) return;
    const moneda = esParaDetraccion ? "Soles" : "Dólares";
    setLoadingCuentasEmpresa(true);
    AuxService.get_cuentas_bancarias_empresa_por_moneda(moneda, esParaDetraccion)
      .then((res) => {
        if (res.success && res.data) {
          setCuentasEmpresa(res.data);
        } else {
          setCuentasEmpresa([]);
        }
      })
      .catch((e) => console.error("Error cuentas empresa:", e))
      .finally(() => setLoadingCuentasEmpresa(false));
  }, [esParaDetraccion, opened]);

  // Cargar cuentas proveedor del proveedor del comprobante
  useEffect(() => {
    if (!opened || !comprobante?.id_proveedor) return;
    setLoadingCuentasProveedor(true);
    AuxService.get_cuentas_bancarias_proveedor(comprobante.id_proveedor)
      .then((res) => {
        const lista = Array.isArray(res) ? res : [];
        setCuentasProveedor(
          lista.map((c: any) => ({
            id_cuenta_bancaria: c.id,
            banco: c.banco_nombre ?? "",
            banco_abv: "",
            id_banco: c.id_banco,
            numero_cuenta: c.numero_cuenta,
            moneda: c.moneda,
          })),
        );
      })
      .catch((e) => console.error("Error cuentas proveedor:", e))
      .finally(() => setLoadingCuentasProveedor(false));
  }, [opened, comprobante?.id_proveedor]);

  const bancosEmpresa = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
    cuentasEmpresa.forEach((c) => {
      if (!map.has(c.id_banco)) {
        map.set(c.id_banco, { id: c.id_banco, nombre: c.banco });
      }
    });
    return Array.from(map.values());
  }, [cuentasEmpresa]);

  const bancosProveedor = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
    cuentasProveedor.forEach((c) => {
      if (!map.has(c.id_banco)) {
        map.set(c.id_banco, { id: c.id_banco, nombre: c.banco });
      }
    });
    return Array.from(map.values());
  }, [cuentasProveedor]);

  const cuentasEmpresaFiltradas = useMemo(
    () => cuentasEmpresa.filter((c) => !idBancoEmpresa || c.id_banco === Number(idBancoEmpresa)),
    [cuentasEmpresa, idBancoEmpresa],
  );

  const cuentasProveedorFiltradas = useMemo(
    () => cuentasProveedor.filter((c) => !idBancoProveedor || c.id_banco === Number(idBancoProveedor)),
    [cuentasProveedor, idBancoProveedor],
  );

  const porPagar = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto);

  const equivSoles = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto) * comprobante.tipo_cambio_venta;

  const handleSubmit = async () => {
    if (submitting) return;
    const montoNum = typeof monto === "number" ? monto : Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      notifyError("El monto pagado debe ser mayor a 0.");
      return;
    }
    if (montoNum > porPagar + 0.0001) {
      notifyError(`El monto excede el saldo pendiente (${porPagar.toFixed(2)}).`);
      return;
    }
    if (medioPago !== MedioPagoComprobante.Efectivo && numeroOperacion.trim().length === 0) {
      notifyError("El número de operación es obligatorio para Transferencia/Depósito.");
      return;
    }

    const fechaHora = toDateTimeString(fechaPago);

    const ok = await onSubmit({
      id_cuenta_bancaria_empresa: idCuentaEmpresa ? Number(idCuentaEmpresa) : null,
      id_cuenta_bancaria_proveedor: idCuentaProveedor ? Number(idCuentaProveedor) : null,
      es_para_detraccion: esParaDetraccion,
      medio_pago: medioPago,
      monto_pagado: montoNum,
      fecha_hora_pago: fechaHora ?? undefined,
      numero_operacion: numeroOperacion.trim() || null,
      observacion: observacion.trim() || null,
      evidencias: evidencias.length > 0 ? evidencias : undefined,
    });

    if (ok) onClose();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Nuevo Pago — ${comprobante.codigo_completo}`}
      size="xl"
    >
      <Stack gap="md">
        {/* Cuentas Origen -> Destino */}
        <Group align="center" wrap="nowrap" gap="xs">
          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80 flex-1">
            <Stack gap="xs">
              <Text fz={11} fw={700} tt="uppercase" c="indigo.4" className="tracking-wider">
                Cuenta Origen (Empresa)
              </Text>
              <Select
                label="Banco"
                placeholder={loadingCuentasEmpresa ? "Cargando..." : "Elija una opción..."}
                data={bancosEmpresa.map((b) => ({ value: String(b.id), label: b.nombre }))}
                value={idBancoEmpresa}
                onChange={setIdBancoEmpresa}
                disabled={loadingCuentasEmpresa || bancosEmpresa.length === 0}
                rightSection={loadingCuentasEmpresa ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label="Cuenta"
                placeholder={
                  !idBancoEmpresa
                    ? "Seleccione banco"
                    : cuentasEmpresaFiltradas.length === 0
                      ? "Sin cuentas"
                      : "Seleccione cuenta"
                }
                data={cuentasEmpresaFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} — ${c.moneda}`,
                }))}
                value={idCuentaEmpresa}
                onChange={setIdCuentaEmpresa}
                disabled={!idBancoEmpresa || cuentasEmpresaFiltradas.length === 0}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
            </Stack>
          </Paper>

          <div className="flex items-center justify-center p-1">
            <IconArrowRight size={22} className="text-indigo-400 opacity-80" />
          </div>

          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80 flex-1">
            <Stack gap="xs">
              <Text fz={11} fw={700} tt="uppercase" c="amber.4" className="tracking-wider">
                Cuenta Destino (Proveedor)
              </Text>
              <Select
                label="Banco"
                placeholder={loadingCuentasProveedor ? "Cargando..." : "Elija una opción..."}
                data={bancosProveedor.map((b) => ({ value: String(b.id), label: b.nombre }))}
                value={idBancoProveedor}
                onChange={setIdBancoProveedor}
                disabled={loadingCuentasProveedor || bancosProveedor.length === 0}
                rightSection={loadingCuentasProveedor ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label="Cuenta"
                placeholder={
                  !idBancoProveedor
                    ? "Seleccione banco"
                    : cuentasProveedorFiltradas.length === 0
                      ? "Sin cuentas"
                      : "Seleccione cuenta"
                }
                data={cuentasProveedorFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} — ${c.moneda}`,
                }))}
                value={idCuentaProveedor}
                onChange={setIdCuentaProveedor}
                disabled={!idBancoProveedor || cuentasProveedorFiltradas.length === 0}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
            </Stack>
          </Paper>
        </Group>

        {/* Detalles del Pago */}
        <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80">
          <Stack gap="sm">
            <Group grow align="flex-start">
              <DateTimePicker
                label="Fecha Pago"
                value={fechaPago}
                onChange={(v) => setFechaPago(v as Date | null)}
                valueFormat="DD/MM/YYYY HH:mm"
                size="xs"
                radius="md"
              />
              <Select
                label="Medio Pago"
                data={Object.values(MedioPagoComprobante).map((v) => ({ value: v, label: v }))}
                value={medioPago}
                onChange={(v) => v && setMedioPago(v as MedioPagoComprobante)}
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
                required
              />
              <TextInput
                label="Nro. Operación"
                placeholder={medioPago === MedioPagoComprobante.Efectivo ? "Opcional" : "Ej: 123456"}
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.currentTarget.value)}
                size="xs"
                radius="md"
              />
            </Group>

            <Group align="center" grow justify="space-between">
              <Paper p="xs" radius="md" className="bg-zinc-950/60 border border-zinc-800">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fz="xs" fw={700} c="white">Pago de Detracción</Text>
                    <Text fz={10} c="dimmed">Marcar si este abono corresponde a la detracción</Text>
                  </div>
                  <Switch
                    checked={esParaDetraccion}
                    onChange={(e) => setEsParaDetraccion(e.currentTarget.checked)}
                    color="yellow"
                    size="sm"
                  />
                </Group>
              </Paper>

              <Stack gap={4} className="flex-1">
                <Group justify="space-between" align="center">
                  <Text fz={11} fw={700} c="dimmed" tt="uppercase">A pagar</Text>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-950/60 border border-zinc-800 rounded-md">
                    <Text fz={10} c="dimmed" fw={700}>PENDIENTE:</Text>
                    <Text fz={11} fw={800} c={esParaDetraccion ? "yellow.4" : "emerald.4"}>
                      {esParaDetraccion ? `S/ ${porPagar.toFixed(2)}` : `$ ${porPagar.toFixed(2)}`}
                    </Text>
                    {!esParaDetraccion && (
                      <Text fz={10} c="dimmed">(Equiv. S/ {equivSoles.toFixed(2)})</Text>
                    )}
                  </div>
                </Group>
                <NumberInput
                  placeholder="0.00"
                  prefix={esParaDetraccion ? "S/ " : "$ "}
                  decimalScale={2}
                  fixedDecimalScale
                  min={0.01}
                  max={porPagar}
                  value={monto}
                  onChange={setMonto}
                  disabled={submitting}
                  size="xs"
                  radius="md"
                />
              </Stack>
            </Group>
          </Stack>
        </Paper>

        {/* Evidencia y Observaciones */}
        <MultiFilePicker
          label="Evidencia"
          files={evidencias}
          onFilesChange={setEvidencias}
        />

        <Textarea
          label="Observación"
          autosize
          minRows={2}
          value={observacion}
          onChange={(e) => setObservacion(e.currentTarget.value)}
          size="xs"
          radius="md"
        />

        {!esParaDetraccion && monto && porPagar === 0 && (
          <Alert color="teal" variant="light" icon={<IconAlertCircle size={16} />}>
            Este pago cerrará el saldo neto. Si además la detracción está saldada, el comprobante pasará a Pagado.
          </Alert>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} radius="lg" size="xs" disabled={submitting}>
            Cerrar
          </Button>
          <Button
            color="indigo"
            onClick={handleSubmit}
            loading={submitting}
            radius="lg"
            size="xs"
            disabled={submitting || !monto || porPagar <= 0}
          >
            Confirmar Pago
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};