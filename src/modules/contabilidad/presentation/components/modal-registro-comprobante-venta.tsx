import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  ScrollArea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle, IconCoin, IconReceipt, IconWallet } from "@tabler/icons-react";
import dayjs from "dayjs";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { ContabilidadVentaService } from "../../service/contabilidad-venta.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalRegistroTipoCambio } from "./modal-registro-tipo-cambio";
import type { RES_DetalleValorizacionDisponible } from "../../service/contabilidad-venta.responses";
import type { REQ_CrearComprobanteVenta } from "../../service/contabilidad-venta.requests";
import type { RES_Empresa } from "../../../../service/responses/empresa";

const comprobanteVentaSchema = z.object({
  id_planta_destino: z.number({ message: "Seleccione una planta destino." }).min(1),
  id_empresa: z.number({ message: "Seleccione una empresa." }).min(1),
  codigo_comprobante: z.string().trim().min(1, "El código del comprobante es obligatorio."),
  fecha_emision: z.string().min(10, "La fecha de emisión es obligatoria."),
  detalles_ids: z.array(z.number()).min(1, "Debe seleccionar al menos un lote valorizado."),
  monto_penalidad: z.number().min(0),
  monto_flete: z.number().min(0),
  percentaje_igv: z.number().min(0).max(1),
  porcentaje_detraccion: z.number().min(0).max(1),
});

const toDateString = (value: unknown): string => {
  if (!value) return "";
  const d = dayjs(value as Date | string);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DD");
};

interface AnticipoDisponibleItem {
  id: number;
  codigo_comprobante: string | null;
  saldo_actual: number;
  saldo_inicial: number;
  estado: string;
}

interface ModalRegistroComprobanteVentaProps {
  opened: boolean;
  onClose: () => void;
  plantas: Array<{ id: number; ruc?: string; razon_social?: string }>;
  loadingPlantas: boolean;
  submitting: boolean;
  onSubmit: (payload: REQ_CrearComprobanteVenta) => Promise<boolean>;
}

export const ModalRegistroComprobanteVenta = ({
  opened,
  onClose,
  plantas,
  loadingPlantas,
  submitting,
  onSubmit,
}: ModalRegistroComprobanteVentaProps) => {
  const { notifyError } = useNotify();

  const [idPlanta, setIdPlanta] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<RES_Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [codigoComprobante, setCodigoComprobante] = useState("");
  const [fechaEmision, setFechaEmision] = useState<string | null>(dayjs().format("YYYY-MM-DD"));
  const [porcentajeIgv, setPorcentajeIgv] = useState<number | string>(18);
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState<number | string>(11);
  const [montoPenalidad, setMontoPenalidad] = useState<number | string>(0);
  const [montoFlete, setMontoFlete] = useState<number | string>(0);
  const [evidencias, setEvidencias] = useState<File[]>([]);

  // Lotes valorizados disponibles para la planta
  const [detallesDisponibles, setDetallesDisponibles] = useState<RES_DetalleValorizacionDisponible[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [selectedDetalleIds, setSelectedDetalleIds] = useState<number[]>([]);

  // Anticipos
  const [aplicaAnticipos, setAplicaAnticipos] = useState(false);
  const [anticiposDisponibles, setAnticiposDisponibles] = useState<AnticipoDisponibleItem[]>([]);
  const [loadingAnticipos, setLoadingAnticipos] = useState(false);
  const [anticiposSeleccionados, setAnticiposSeleccionados] = useState<Record<number, number>>({});

  // Tipo de Cambio
  const [tipoCambio, setTipoCambio] = useState<{ id: number; valor_venta: number } | null>(null);
  const [loadingTipoCambio, setLoadingTipoCambio] = useState(false);
  const [modalTipoCambioOpened, setModalTipoCambioOpened] = useState(false);

  const fechaEmisionStr = toDateString(fechaEmision);

  useEffect(() => {
    if (!opened) return;
    queueMicrotask(() => {
      setIdPlanta(null);
      setCodigoComprobante("");
      setFechaEmision(dayjs().format("YYYY-MM-DD"));
      setPorcentajeIgv(18);
      setPorcentajeDetraccion(10);
      setMontoPenalidad(0);
      setMontoFlete(0);
      setEvidencias([]);
      setDetallesDisponibles([]);
      setSelectedDetalleIds([]);
      setAplicaAnticipos(false);
      setAnticiposDisponibles([]);
      setAnticiposSeleccionados({});
      setTipoCambio(null);
      setLoadingEmpresas(true);
    });

    AuxService.get_empresas()
      .then((res) => {
        if (res.success && res.data) {
          setEmpresas(res.data);
          const fabero = res.data.find((e) =>
            e.razon_social?.toLowerCase().includes("fabero")
          );
          if (fabero) {
            setIdEmpresa(String(fabero.id_empresa));
          } else if (res.data.length > 0) {
            setIdEmpresa(String(res.data[0].id_empresa));
          }
        }
      })
      .catch((e) => console.error("Error al cargar empresas:", e))
      .finally(() => setLoadingEmpresas(false));
  }, [opened]);

  // Cargar detalles de valorización y anticipos al cambiar de planta
  useEffect(() => {
    if (!idPlanta) {
      queueMicrotask(() => {
        setDetallesDisponibles([]);
        setSelectedDetalleIds([]);
        setAnticiposDisponibles([]);
        setAnticiposSeleccionados({});
      });
      return;
    }

    const plantaIdNum = Number(idPlanta);
    queueMicrotask(() => {
      setLoadingDetalles(true);
      setLoadingAnticipos(true);
    });

    ContabilidadVentaService.getDetallesDisponibles(plantaIdNum)
      .then((res) => {
        if (res.success && res.data) {
          setDetallesDisponibles(res.data);
        } else {
          setDetallesDisponibles([]);
        }
      })
      .catch((e) => console.error("Error al cargar detalles de valorización:", e))
      .finally(() => setLoadingDetalles(false));

    ContabilidadVentaService.getAnticiposDisponibles(plantaIdNum)
      .then((res) => {
        if (res.success && res.data) {
          setAnticiposDisponibles(res.data);
        } else {
          setAnticiposDisponibles([]);
        }
      })
      .catch((e) => console.error("Error al cargar anticipos de planta:", e))
      .finally(() => setLoadingAnticipos(false));
  }, [idPlanta]);

  // Consultar tipo de cambio al cambiar la fecha de emisión
  const consultarTipoCambio = useCallback((fechaStr: string) => {
    if (!fechaStr) {
      queueMicrotask(() => setTipoCambio(null));
      return;
    }
    queueMicrotask(() => setLoadingTipoCambio(true));
    let cancelled = false;
    AuxService.get_tipo_cambio_por_fecha(fechaStr)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setTipoCambio({ id: res.data.id, valor_venta: Number(res.data.valor_venta) || 0 });
        } else {
          setTipoCambio(null);
        }
      })
      .catch((e) => console.error("Error tipo cambio:", e))
      .finally(() => {
        if (!cancelled) setLoadingTipoCambio(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!opened || !fechaEmisionStr) return;
    const cancel = consultarTipoCambio(fechaEmisionStr);
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [opened, fechaEmisionStr, consultarTipoCambio]);

  // Selección de detalles de valorización
  // REGLA CRÍTICA: "durante la seleccion de las valorizaciones detalle si quita o agrega se resetea los anticipos seleccionados"
  const handleToggleDetalle = (idDetalle: number) => {
    setSelectedDetalleIds((prev) => {
      const next = prev.includes(idDetalle)
        ? prev.filter((id) => id !== idDetalle)
        : [...prev, idDetalle];
      return next;
    });
    // Resetear anticipos
    setAnticiposSeleccionados({});
  };

  const handleToggleAllDetalles = () => {
    if (selectedDetalleIds.length === detallesDisponibles.length) {
      setSelectedDetalleIds([]);
    } else {
      setSelectedDetalleIds(detallesDisponibles.map((d) => d.id));
    }
    // Resetear anticipos
    setAnticiposSeleccionados({});
  };

  // Cálculo de subtotales y fórmulas en tiempo real
  const detallesElegidos = useMemo(
    () => detallesDisponibles.filter((d) => selectedDetalleIds.includes(d.id)),
    [detallesDisponibles, selectedDetalleIds],
  );

  const totalDolaresAntesDescuento = useMemo(
    () => detallesElegidos.reduce((acc, d) => acc + (d.subtotal || 0), 0),
    [detallesElegidos],
  );

  const penalidadNum = typeof montoPenalidad === "number" ? montoPenalidad : Number(montoPenalidad) || 0;
  const fleteNum = typeof montoFlete === "number" ? montoFlete : Number(montoFlete) || 0;
  const descuentoTotal = penalidadNum + fleteNum;

  const totalDolares = Math.max(totalDolaresAntesDescuento - descuentoTotal, 0);

  const tcVenta = tipoCambio ? (Number(tipoCambio.valor_venta) || 0) : 0;
  const totalSolesAntesDescuento = totalDolaresAntesDescuento * tcVenta;
  const totalSoles = totalDolares * tcVenta;

  const igvPct = (typeof porcentajeIgv === "number" ? porcentajeIgv : Number(porcentajeIgv) || 18) / 100;
  const detraccionPct = (typeof porcentajeDetraccion === "number" ? porcentajeDetraccion : Number(porcentajeDetraccion) || 11) / 100;

  const montoIgvSoles = totalSoles * igvPct;

  // Monto total de anticipos aplicados
  const totalAnticiposAplicados = useMemo(() => {
    if (!aplicaAnticipos) return 0;
    return Object.values(anticiposSeleccionados).reduce((sum, val) => sum + (val || 0), 0);
  }, [aplicaAnticipos, anticiposSeleccionados]);

  // Detracción y Neto
  const baseDetraccion = Math.max(totalDolares - totalAnticiposAplicados, 0);
  const montoDetraccion = baseDetraccion * detraccionPct;
  const montoDetraccionSoles = montoDetraccion * tcVenta;
  const montoNeto = Math.max(totalDolares - totalAnticiposAplicados - montoDetraccion, 0);

  const handleMontoAnticipoChange = (idAnticipo: number, monto: number | string, saldoMax: number) => {
    const val = typeof monto === "number" ? monto : Number(monto) || 0;
    const clamped = Math.max(0, Math.min(val, saldoMax, totalDolares));

    setAnticiposSeleccionados((prev) => {
      const copy = { ...prev };
      if (clamped <= 0) {
        delete copy[idAnticipo];
      } else {
        copy[idAnticipo] = clamped;
      }
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!idPlanta) {
      notifyError("Seleccione la planta destino.");
      return;
    }
    if (selectedDetalleIds.length === 0) {
      notifyError("Debe seleccionar al menos un lote valorizado.");
      return;
    }
    if (!codigoComprobante.trim()) {
      notifyError("Ingrese el código del comprobante.");
      return;
    }
    if (!tipoCambio) {
      notifyError("Debe existir un tipo de cambio registrado para la fecha de emisión.");
      return;
    }
    if (totalAnticiposAplicados > totalDolares) {
      notifyError("El total de anticipos no puede superar el total en dólares del comprobante.");
      return;
    }

    const anticiposPayload = Object.entries(anticiposSeleccionados)
      .map(([idAnt, val]) => ({
        id_anticipo_planta: Number(idAnt),
        monto_retirado: val,
      }))
      .filter((a) => a.monto_retirado > 0);

    const parsed = comprobanteVentaSchema.safeParse({
      id_planta_destino: Number(idPlanta),
      id_empresa: Number(idEmpresa),
      codigo_comprobante: codigoComprobante.trim(),
      fecha_emision: fechaEmisionStr,
      detalles_ids: selectedDetalleIds,
      monto_penalidad: penalidadNum,
      monto_flete: fleteNum,
      percentaje_igv: igvPct,
      porcentaje_detraccion: detraccionPct,
    });

    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || "Datos del comprobante inválidos");
      return;
    }

    const ok = await onSubmit({
      ...parsed.data,
      id_tipo_cambio: tipoCambio.id,
      anticipos: anticiposPayload.length > 0 ? anticiposPayload : undefined,
      evidencias: evidencias.length > 0 ? evidencias : undefined,
    });

    if (ok) {
      onClose();
    }
  };

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title="Nuevo Comprobante de Venta"
        size="xl"
      >
        <Stack gap="md">
          {/* Fila 1: Planta Destino, Empresa, Código Comprobante, Fecha de Emisión */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Planta Destino"
                placeholder={loadingPlantas ? "Cargando..." : "Seleccione una planta"}
                data={plantas.map((p) => ({
                  value: String(p.id),
                  label: p.razon_social || p.ruc || `Planta #${p.id}`,
                }))}
                value={idPlanta}
                onChange={(v) => setIdPlanta(v)}
                searchable
                size="xs"
                radius="lg"
                disabled={loadingPlantas}
                rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Empresa"
                placeholder={loadingEmpresas ? "Cargando..." : "Seleccione una empresa"}
                data={empresas.map((e) => ({
                  value: String(e.id_empresa),
                  label: e.razon_social || e.ruc || `Empresa #${e.id_empresa}`,
                }))}
                value={idEmpresa}
                onChange={(v) => setIdEmpresa(v)}
                searchable
                size="xs"
                radius="lg"
                disabled={loadingEmpresas}
                rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Código Comprobante"
                placeholder="Ej: B-1, F001-00012"
                value={codigoComprobante}
                onChange={(e) => setCodigoComprobante(e.currentTarget.value)}
                size="xs"
                radius="lg"
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white font-mono",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DateInput
                label="Fecha de Emisión"
                placeholder="YYYY-MM-DD"
                value={fechaEmision ? dayjs(fechaEmision).toDate() : null}
                onChange={(v) => setFechaEmision(v ? (typeof v === "string" ? v : dayjs(v).format("YYYY-MM-DD")) : null)}
                valueFormat="YYYY-MM-DD"
                size="xs"
                radius="lg"
                clearable={false}
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>
          </Grid>

          {/* Banner de Tipo de Cambio */}
          <Box>
            {loadingTipoCambio ? (
              <Group gap="xs" p="xs" className="bg-zinc-900/40 rounded-lg border border-zinc-800">
                <Loader size={14} />
                <Text fz="xs" c="dimmed">Consultando tipo de cambio...</Text>
              </Group>
            ) : tipoCambio ? (
              <Group justify="space-between" p="xs" className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
                <Group gap="xs">
                  <Badge color="teal" variant="light" size="sm">TC Venta</Badge>
                  <Text fz="xs" fw={700} c="emerald.4" className="font-mono">
                    S/ {(Number(tipoCambio.valor_venta) || 0).toFixed(3)}
                  </Text>
                  <Text fz={11} c="dimmed">({fechaEmisionStr})</Text>
                </Group>
              </Group>
            ) : (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="yellow"
                variant="light"
                title="Sin tipo de cambio para la fecha"
                styles={{ root: { padding: "8px 12px" } }}
              >
                <Group justify="space-between">
                  <Text fz="xs">
                    No existe un tipo de cambio registrado para {fechaEmisionStr || "la fecha"}.
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="yellow"
                    radius="lg"
                    leftSection={<IconCoin size={14} />}
                    onClick={() => setModalTipoCambioOpened(true)}
                  >
                    Registrar TC
                  </Button>
                </Group>
              </Alert>
            )}
          </Box>

          {/* Tabla de Selección de Lotes Valorizados de Venta */}
          <Paper p="sm" radius="md" className="bg-zinc-950/60 border border-zinc-800">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconReceipt size={16} className="text-amber-400" />
                <Text fz="xs" fw={700} c="amber.4">
                  Lotes Valorizados Disponibles ({detallesDisponibles.length})
                </Text>
              </Group>
              {detallesDisponibles.length > 0 && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="indigo"
                  onClick={handleToggleAllDetalles}
                >
                  {selectedDetalleIds.length === detallesDisponibles.length
                    ? "Desmarcar todos"
                    : "Seleccionar todos"}
                </Button>
              )}
            </Group>

            {loadingDetalles ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
                <Text fz="xs" c="dimmed">Cargando valorizaciones de venta...</Text>
              </Group>
            ) : !idPlanta ? (
              <Text fz="xs" c="dimmed" fs="italic" ta="center" py="md">
                Seleccione una planta para ver los lotes disponibles.
              </Text>
            ) : detallesDisponibles.length === 0 ? (
              <Text fz="xs" c="dimmed" fs="italic" ta="center" py="md">
                No hay lotes valorizados aprobados disponibles para esta planta.
              </Text>
            ) : (
              <ScrollArea h={180}>
                <Table highlightOnHover verticalSpacing="xs" fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          size="xs"
                          checked={
                            detallesDisponibles.length > 0 &&
                            selectedDetalleIds.length === detallesDisponibles.length
                          }
                          indeterminate={
                            selectedDetalleIds.length > 0 &&
                            selectedDetalleIds.length < detallesDisponibles.length
                          }
                          onChange={handleToggleAllDetalles}
                        />
                      </Table.Th>
                      <Table.Th>Valorización</Table.Th>
                      <Table.Th>Elemento</Table.Th>
                      <Table.Th>Lote / Despacho</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Subtotal ($)</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {detallesDisponibles.map((d) => {
                      const isSelected = selectedDetalleIds.includes(d.id);
                      return (
                        <Table.Tr
                          key={d.id}
                          className={`cursor-pointer ${isSelected ? "bg-indigo-950/20" : ""}`}
                          onClick={() => handleToggleDetalle(d.id)}
                        >
                          <Table.Td onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="xs"
                              checked={isSelected}
                              onChange={() => handleToggleDetalle(d.id)}
                            />
                          </Table.Td>
                          <Table.Td className="font-mono font-semibold">
                            {d.valorizacion_codigo || d.valorizacion_correlativo || `VAL-${d.id_valorizacion_venta}`}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={d.elemento_quimico === "Oro" ? "yellow" : "gray"}
                              variant="filled"
                              size="xs"
                            >
                              {d.elemento_quimico}
                            </Badge>
                          </Table.Td>
                          <Table.Td c="dimmed">
                            {d.lote_correlativo || d.codigo_preliminar || d.despacho_correlativo || "—"}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }} fw={700} c="emerald.4" className="font-mono">
                            $ {d.subtotal.toFixed(2)}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}

            <Group justify="flex-end" pt="xs" className="border-t border-zinc-800 mt-2">
              <Text fz="xs" c="dimmed">
                Seleccionados: {selectedDetalleIds.length} · Subtotal antes de descuento:
              </Text>
              <Text fz="sm" fw={800} c="emerald.4" className="font-mono">
                $ {totalDolaresAntesDescuento.toFixed(2)}
              </Text>
            </Group>
          </Paper>

          {/* Descuentos: Flete y Penalidad */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Penalidad ($)"
                placeholder="0.00"
                value={montoPenalidad}
                onChange={(v) => setMontoPenalidad(v ?? 0)}
                min={0}
                decimalScale={2}
                fixedDecimalScale
                size="xs"
                radius="lg"
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white font-mono",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Flete ($)"
                placeholder="0.00"
                value={montoFlete}
                onChange={(v) => setMontoFlete(v ?? 0)}
                min={0}
                decimalScale={2}
                fixedDecimalScale
                size="xs"
                radius="lg"
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white font-mono",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="% IGV"
                value={porcentajeIgv}
                onChange={(v) => setPorcentajeIgv(v ?? 18)}
                min={0}
                max={100}
                size="xs"
                radius="lg"
                suffix="%"
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white font-mono",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="% Detracción"
                value={porcentajeDetraccion}
                onChange={(v) => setPorcentajeDetraccion(v ?? 11)}
                min={0}
                max={100}
                size="xs"
                radius="lg"
                suffix="%"
                classNames={{
                  input: "bg-zinc-900/50 border-zinc-800 text-white font-mono",
                  label: "text-zinc-400 text-xs font-medium mb-1",
                }}
              />
            </Grid.Col>
          </Grid>

          {/* Sección Anticipos de Planta */}
          <Paper p="sm" radius="md" className="bg-zinc-950/60 border border-zinc-800">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconWallet size={16} className="text-cyan-400" />
                <Text fz="xs" fw={700} c="cyan.4">
                  Anticipos de Planta Disponibles
                </Text>
              </Group>
              <Switch
                label="¿Aplicar anticipos?"
                size="xs"
                checked={aplicaAnticipos}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setAplicaAnticipos(checked);
                  if (!checked) {
                    setAnticiposSeleccionados({});
                  }
                }}
              />
            </Group>

            {aplicaAnticipos && (
              <>
                {loadingAnticipos ? (
                  <Group justify="center" py="xs">
                    <Loader size="xs" />
                    <Text fz="xs" c="dimmed">Buscando anticipos con saldo...</Text>
                  </Group>
                ) : anticiposDisponibles.length === 0 ? (
                  <Text fz="xs" c="dimmed" fs="italic" ta="center" py="xs">
                    No hay anticipos con saldo disponibles para esta planta.
                  </Text>
                ) : (
                  <Stack gap="xs" mt="xs">
                    {anticiposDisponibles.map((ant) => {
                      const montoActual = anticiposSeleccionados[ant.id] ?? 0;
                      return (
                        <Group key={ant.id} justify="space-between" p="xs" className="bg-zinc-900/40 rounded-lg border border-zinc-800">
                          <Stack gap={2}>
                            <Group gap={6}>
                              <Text fz="xs" fw={700} className="font-mono text-cyan-300">
                                {ant.codigo_comprobante || `ANT-${ant.id}`}
                              </Text>
                              <Badge size="xs" color="teal" variant="light">
                                Saldo: $ {ant.saldo_actual.toFixed(2)}
                              </Badge>
                            </Group>
                            <Text fz={10} c="dimmed">
                              Inicial: $ {ant.saldo_inicial.toFixed(2)}
                            </Text>
                          </Stack>

                          <Group gap="xs">
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="cyan"
                              onClick={() => handleMontoAnticipoChange(ant.id, ant.saldo_actual, ant.saldo_actual)}
                            >
                              Usar máx
                            </Button>
                            <NumberInput
                              placeholder="0.00"
                              size="xs"
                              radius="lg"
                              w={120}
                              decimalScale={2}
                              fixedDecimalScale
                              min={0}
                              max={ant.saldo_actual}
                              value={montoActual > 0 ? montoActual : ""}
                              onChange={(v) => handleMontoAnticipoChange(ant.id, v ?? 0, ant.saldo_actual)}
                              classNames={{
                                input: "bg-zinc-950/80 border-zinc-800 text-white font-mono text-right",
                              }}
                            />
                          </Group>
                        </Group>
                      );
                    })}

                    <Group justify="flex-end" pt="xs">
                      <Text fz="xs" c="dimmed">Total anticipos aplicados:</Text>
                      <Text fz="sm" fw={800} c="cyan.4" className="font-mono">
                        $ {totalAnticiposAplicados.toFixed(2)}
                      </Text>
                    </Group>
                  </Stack>
                )}
              </>
            )}
          </Paper>

          {/* Resumen de Importes Calculados */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className="bg-zinc-900/50 border border-indigo-500/30 rounded-lg p-3">
                <Text fz={10} tt="uppercase" c="indigo.4" fw={700}>Total Comprobante</Text>
                <Text fz="md" fw={800} c="white" className="font-mono">
                  $ {totalDolares.toFixed(2)}
                </Text>
                <Text fz={10} c="dimmed">
                  Equiv: S/ {totalSoles.toFixed(2)} {totalSolesAntesDescuento > totalSoles && `(Orig: S/ ${totalSolesAntesDescuento.toFixed(2)})`} · IGV: S/ {montoIgvSoles.toFixed(2)}
                </Text>
                {descuentoTotal > 0 && (
                  <Text fz={9} c="yellow.4">
                    Descuento flete/penalidad: –$ {descuentoTotal.toFixed(2)}
                  </Text>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className="bg-zinc-900/50 border border-teal-500/30 rounded-lg p-3">
                <Text fz={10} tt="uppercase" c="teal.4" fw={700}>Saldo Neto a Cobrar</Text>
                <Text fz="md" fw={800} c="white" className="font-mono">
                  $ {montoNeto.toFixed(2)}
                </Text>
                <Text fz={10} c="dimmed">
                  Equiv: S/ {(montoNeto * tcVenta).toFixed(2)}
                </Text>
                {totalAnticiposAplicados > 0 && (
                  <Text fz={9} c="cyan.4">
                    Anticipos descontados: –$ {totalAnticiposAplicados.toFixed(2)}
                  </Text>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className="bg-zinc-900/50 border border-yellow-500/30 rounded-lg p-3">
                <Text fz={10} tt="uppercase" c="yellow.4" fw={700}>Detracción ({porcentajeDetraccion}%)</Text>
                <Text fz="md" fw={800} c="white" className="font-mono">
                  S/ {montoDetraccionSoles.toFixed(2)}
                </Text>
                <Text fz={10} c="dimmed">
                  Equiv: $ {montoDetraccion.toFixed(2)}
                </Text>
                <Text fz={9} c="dimmed">
                  Base: $ {baseDetraccion.toFixed(2)}
                </Text>
              </div>
            </Grid.Col>
          </Grid>

          {/* Adjuntar Evidencias */}
          <Box>
            <Text fz="xs" fw={500} c="dimmed" mb={4}>
              Evidencias del Comprobante (Opcional)
            </Text>
            <MultiFilePicker files={evidencias} onFilesChange={setEvidencias} />
          </Box>

          {/* Acciones */}
          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="default" radius="lg" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              color="indigo"
              radius="lg"
              size="sm"
              loading={submitting}
              disabled={submitting || !tipoCambio || selectedDetalleIds.length === 0}
              onClick={handleSubmit}
            >
              Registrar Comprobante
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalRegistroTipoCambio
        opened={modalTipoCambioOpened}
        onClose={() => setModalTipoCambioOpened(false)}
        fecha={fechaEmisionStr}
        onCreated={() => consultarTipoCambio(fechaEmisionStr)}
      />
    </>
  );
};
