import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Badge,
  ActionIcon,
  Loader,
  Box,
  Tooltip,
  ThemeIcon,
  NumberInput,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCoins,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconReceiptTax,
} from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ModalSeleccionarAnticipos } from "./modal-seleccionar-anticipos";
import { TipoPagoValorizacionCompra } from "../../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";
import type { REQ_AprobarValorizacion, REQ_ValorizacionAnticipoItem } from "../../service/valorizacion-compra.requests";

interface Props {
  opened: boolean;
  onClose: () => void;
  valorizacion: RES_ValorizacionCompra | null;
  onAprobar: (id: number, payload: REQ_AprobarValorizacion) => Promise<boolean>;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9 text-xs",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

interface CuentaBancariaProv {
  id: number;
  id_banco: number;
  moneda: string;
  numero_cuenta: string;
  cci: string;
  es_para_detraccion: boolean;
  banco_nombre: string;
}

export const ModalAprobarValorizacion = ({
  opened,
  onClose,
  valorizacion,
  onAprobar,
}: Props) => {
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancariaProv[]>([]);
  const [cuentasDetraccion, setCuentasDetraccion] = useState<CuentaBancariaProv[]>([]);

  const [idCuentaBancaria, setIdCuentaBancaria] = useState<number | null>(null);
  const [idCuentaDetraccion, setIdCuentaDetraccion] = useState<number | null>(null);

  const [anticipos, setAnticipos] = useState<REQ_ValorizacionAnticipoItem[]>([]);
  const [anticiposCatalog, setAnticiposCatalog] = useState<
    Array<{
      id: number;
      factura: string;
      serie_factura: string;
      numero_factura: string;
      saldo_inicial: number;
      saldo_actual: number;
      created_at: string;
    }>
  >([]);

  const [modalAnticiposOpened, setModalAnticiposOpened] = useState(false);
  const [evidencias, setEvidencias] = useState<File[]>([]);

  // Cargar catálogo de cuentas y anticipos al abrir
  useEffect(() => {
    if (!opened || !valorizacion) {
      setIdCuentaBancaria(null);
      setIdCuentaDetraccion(null);
      setAnticipos([]);
      setEvidencias([]);
      return;
    }

    const cargar = async () => {
      setLoadingCatalogos(true);
      try {
        const [cuentas, ants] = await Promise.all([
          AuxService.get_cuentas_bancarias_proveedor(valorizacion.id_proveedor_minero),
          AuxService.get_anticipos_proveedor(valorizacion.id_proveedor_minero),
        ]);

        const ordinarias = cuentas.filter((c) => !c.es_para_detraccion);
        const detraccion = cuentas.filter((c) => c.es_para_detraccion);

        setCuentasBancarias(ordinarias);
        setCuentasDetraccion(detraccion);
        setAnticiposCatalog(ants || []);

        // Preselección de cuentas si ya estaban asignadas o si hay única opción
        if (valorizacion.id_cuenta_bancaria) {
          setIdCuentaBancaria(valorizacion.id_cuenta_bancaria);
        } else if (ordinarias.length === 1) {
          setIdCuentaBancaria(ordinarias[0].id);
        }

        if (valorizacion.id_cuenta_detraccion) {
          setIdCuentaDetraccion(valorizacion.id_cuenta_detraccion);
        } else if (detraccion.length === 1) {
          setIdCuentaDetraccion(detraccion[0].id);
        }

        // Si ya tenía transacciones de anticipo cargadas
        if (valorizacion.transacciones_anticipo && valorizacion.transacciones_anticipo.length > 0) {
          setAnticipos(
            valorizacion.transacciones_anticipo.map((t) => ({
              id_anticipo_proveedor: t.id_anticipo_proveedor,
              monto_retirado: t.monto_retirado,
            })),
          );
        }
      } catch (err) {
        console.error("Error al cargar cuentas y anticipos:", err);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargar();
  }, [opened, valorizacion]);

  const anticipoSaldoMap = useMemo(() => {
    const map = new Map<number, number>();
    anticiposCatalog.forEach((a) => {
      map.set(a.id, a.saldo_actual);
    });
    return map;
  }, [anticiposCatalog]);

  const subtotalNeto = valorizacion?.total_subtotal ?? 0;
  const porcentajeIgv = valorizacion?.porcentaje_igv ?? 0;
  const porcentajeDetraccion = valorizacion?.porcentaje_detraccion ?? 0;

  const montoIgv = useMemo(() => {
    return subtotalNeto * (porcentajeIgv / 100);
  }, [subtotalNeto, porcentajeIgv]);

  const totalConIgv = useMemo(() => {
    return subtotalNeto + montoIgv;
  }, [subtotalNeto, montoIgv]);

  const montoDetraccion = useMemo(() => {
    return totalConIgv * (porcentajeDetraccion / 100);
  }, [totalConIgv, porcentajeDetraccion]);

  const totalAnticipos = useMemo(() => {
    return anticipos.reduce((acc, curr) => acc + (Number(curr.monto_retirado) || 0), 0);
  }, [anticipos]);

  const montoTransferencia = useMemo(() => {
    const transfer = subtotalNeto - totalAnticipos;
    return transfer < 0 ? 0 : transfer;
  }, [subtotalNeto, totalAnticipos]);

  const tipoPago = useMemo((): TipoPagoValorizacionCompra => {
    if (totalAnticipos <= 0) {
      return TipoPagoValorizacionCompra.Transferencia;
    }
    if (montoTransferencia <= 0.001) {
      return TipoPagoValorizacionCompra.Anticipo;
    }
    return TipoPagoValorizacionCompra.Mixto;
  }, [totalAnticipos, montoTransferencia]);

  const anticipoExcedeSaldo = useMemo(() => {
    return anticipos.some((a) => {
      const saldo = anticipoSaldoMap.get(a.id_anticipo_proveedor);
      if (saldo === undefined) return false;
      return a.monto_retirado > saldo + 0.0001;
    });
  }, [anticipos, anticipoSaldoMap]);

  const handleAnticipoMontoChange = (index: number, val: number | string) => {
    const num = typeof val === "number" ? val : parseFloat(String(val)) || 0;
    setAnticipos((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, monto_retirado: num } : item)),
    );
  };

  const handleEliminarAnticipo = (index: number) => {
    setAnticipos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAprobarSubmit = async () => {
    if (!valorizacion || !idCuentaBancaria || !idCuentaDetraccion) return;

    setLoadingSubmit(true);
    try {
      const success = await onAprobar(valorizacion.id, {
        id_cuenta_bancaria: idCuentaBancaria,
        id_cuenta_detraccion: idCuentaDetraccion,
        tipo_pago: tipoPago,
        anticipos,
        evidencias,
      });
      if (success) {
        onClose();
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const correlativoText =
    valorizacion?.correlativo ||
    (valorizacion?.numero_correlativo ? `VAL-${valorizacion.numero_correlativo}` : `#${valorizacion?.id}`);

  const modalTitle = (
    <Group gap="xs" align="center">
      <ThemeIcon color="teal" variant="light" size="md" radius="md">
        <IconCheck size={18} />
      </ThemeIcon>
      <div>
        <Text fw={700} fz="sm" c="white">
          Aprobar Propuesta de Valorización: {correlativoText}
        </Text>
        <Text fz={11} c="dimmed">
          {valorizacion?.proveedor_nombre} | RUC/DOC: {valorizacion?.proveedor_documento || valorizacion?.proveedor_ruc || "-"}
        </Text>
      </div>
    </Group>
  );

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={modalTitle}
        size="1100px"
      >
        <Stack gap="md" mt="xs">
          {loadingCatalogos ? (
            <Paper p="xl" bg="#18181b" className="border border-zinc-800 text-center">
              <Group justify="center" gap="xs">
                <Loader size="sm" color="indigo" />
                <Text fz="xs" c="zinc.4">Cargando cuentas bancarias y anticipos del proveedor...</Text>
              </Group>
            </Paper>
          ) : (
            <Grid gutter="sm">
              {/* Columna Izquierda: Cuentas Bancarias */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 space-y-3 h-full flex flex-col justify-between">
                  <Stack gap="xs">
                    <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                      <IconBuildingBank size={15} /> Asignación de Cuentas Bancarias (Obligatorio)
                    </Text>

                    <Select
                      label="Cuenta Bancaria (Soles / Dólares):"
                      placeholder={
                        cuentasBancarias.length === 0
                          ? "Sin cuentas ordinarias registradas"
                          : "[Seleccione Cuenta Bancaria]"
                      }
                      data={cuentasBancarias.map((cb) => ({
                        value: String(cb.id),
                        label: `${cb.banco_nombre} (${cb.moneda}) - ${cb.numero_cuenta}`,
                      }))}
                      value={idCuentaBancaria ? String(idCuentaBancaria) : null}
                      onChange={(val) => setIdCuentaBancaria(val ? Number(val) : null)}
                      size="xs"
                      radius="lg"
                      classNames={fieldClasses}
                      required
                    />

                    <Select
                      label="Cuenta Detracción (Banco de la Nación):"
                      placeholder={
                        cuentasDetraccion.length === 0
                          ? "Sin cuenta de detracción registrada"
                          : "[Seleccione Cuenta Detracción]"
                      }
                      data={cuentasDetraccion.map((cd) => ({
                        value: String(cd.id),
                        label: `${cd.banco_nombre} - ${cd.numero_cuenta}`,
                      }))}
                      value={idCuentaDetraccion ? String(idCuentaDetraccion) : null}
                      onChange={(val) => setIdCuentaDetraccion(val ? Number(val) : null)}
                      size="xs"
                      radius="lg"
                      classNames={fieldClasses}
                      required
                    />

                    {(!idCuentaBancaria || !idCuentaDetraccion) && (
                      <Paper p="xs" bg="#451a03/30" className="border border-amber-800/60 rounded-md">
                        <Group gap="xs" align="center" wrap="nowrap">
                          <IconAlertTriangle size={15} className="text-amber-400 shrink-0" />
                          <Text fz={10} c="amber.2">
                            Para formalizar la aprobación de la valorización se requiere asignar ambas cuentas bancarias.
                          </Text>
                        </Group>
                      </Paper>
                    )}
                  </Stack>

                  {/* Resumen de Tipo de Pago */}
                  <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 mt-2">
                    <Group justify="space-between" align="center">
                      <Text fz={11} c="zinc.4" fw={700} tt="uppercase">
                        Modalidad de Pago Resultante:
                      </Text>
                      <Badge
                        color={
                          tipoPago === TipoPagoValorizacionCompra.Transferencia
                            ? "blue"
                            : tipoPago === TipoPagoValorizacionCompra.Anticipo
                            ? "purple"
                            : "teal"
                        }
                        size="md"
                        variant="filled"
                        className="font-mono font-bold"
                      >
                        {tipoPago}
                      </Badge>
                    </Group>
                  </Box>
                </Paper>
              </Grid.Col>

              {/* Columna Derecha: Gestión de Anticipos */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 space-y-2 h-full flex flex-col justify-between">
                  <Stack gap="xs" className="flex-1">
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <IconCoins size={16} className="text-amber-400" />
                        <Text fw={700} fz="xs" c="amber.4">
                          Anticipos Aplicables ({anticipos.length})
                        </Text>
                      </Group>
                      <Group gap={6}>
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          radius="lg"
                          onClick={() => setModalAnticiposOpened(true)}
                          className="h-7 text-[11px] px-2.5 font-bold"
                        >
                          Seleccionar Anticipos
                        </Button>
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          radius="lg"
                          onClick={() => setAnticipos([])}
                          disabled={anticipos.length === 0}
                          className="h-7 text-[11px] px-2"
                        >
                          Limpiar
                        </Button>
                      </Group>
                    </Group>

                    <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 flex-1 space-y-2">
                      <Group justify="space-between" align="center">
                        <Text fz={11} c="zinc.4" fw={600}>
                          Total Anticipos Aplicados:
                        </Text>
                        <Badge color="blue" size="sm" variant="filled" className="font-mono font-bold">
                          $ {totalAnticipos.toFixed(2)}
                        </Badge>
                      </Group>

                      {anticipos.length > 0 ? (
                        <Stack gap="xs" className="max-h-48 overflow-y-auto pr-1">
                          {anticipos.map((ant, i) => {
                            const itemCatalog = anticiposCatalog.find(
                              (a) => a.id === ant.id_anticipo_proveedor,
                            );
                            const saldo = anticipoSaldoMap.get(ant.id_anticipo_proveedor);
                            const excede = saldo !== undefined && ant.monto_retirado > saldo + 0.0001;
                            const facturaTitle =
                              itemCatalog?.factura || `Anticipo #${ant.id_anticipo_proveedor}`;

                            return (
                              <Paper
                                key={i}
                                p="xs"
                                radius="md"
                                className={`bg-zinc-900/90 border transition-all ${
                                  excede
                                    ? "border-red-500/80 bg-red-950/20"
                                    : "border-zinc-800 hover:border-zinc-700"
                                }`}
                              >
                                <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                                  <Stack gap={2} className="min-w-0 flex-1">
                                    <Text fw={700} fz="xs" c="white" className="truncate font-mono">
                                      {facturaTitle}
                                    </Text>
                                    {saldo !== undefined && (
                                      <Text fz={10} c={excede ? "red.4" : "dimmed"}>
                                        Saldo disp: ${saldo.toFixed(2)}
                                      </Text>
                                    )}
                                  </Stack>

                                  <Group gap={6} wrap="nowrap" align="center">
                                    <NumberInput
                                      value={ant.monto_retirado}
                                      onChange={(val) => handleAnticipoMontoChange(i, val ?? 0)}
                                      min={0}
                                      max={saldo !== undefined ? saldo : undefined}
                                      prefix="$ "
                                      decimalScale={2}
                                      size="xs"
                                      radius="md"
                                      hideControls
                                      w={95}
                                      classNames={{
                                        input: excede
                                          ? "border-red-500 bg-zinc-950 text-red-300 font-mono font-bold text-xs h-7 text-right"
                                          : "bg-zinc-950 border-zinc-800 text-white font-mono text-xs h-7 text-right",
                                      }}
                                    />
                                    <Tooltip label="Quitar" withArrow>
                                      <ActionIcon
                                        size="sm"
                                        color="red"
                                        variant="subtle"
                                        onClick={() => handleEliminarAnticipo(i)}
                                      >
                                        <IconX size={14} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </Group>
                              </Paper>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Box p="md" className="text-center my-auto py-4">
                          <Text fz="xs" c="zinc.5" fs="italic">
                            Sin anticipos seleccionados. El monto total se liquidará por transferencia.
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          )}

          {/* Liquidación Económica Final */}
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 space-y-2">
            <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
              <IconReceiptTax size={15} /> Resumen de Liquidación de la Valorización
            </Text>

            <Grid gutter="xs">
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 text-center">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Subtotal Neto</Text>
                  <Text fz="sm" fw={800} c="white" className="font-mono">
                    $ {subtotalNeto.toFixed(2)}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 6, md: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 text-center">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>IGV ({porcentajeIgv}%)</Text>
                  <Text fz="sm" fw={800} c="blue.3" className="font-mono">
                    $ {montoIgv.toFixed(2)}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 6, md: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 text-center">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Detracción ({porcentajeDetraccion}%)</Text>
                  <Text fz="sm" fw={800} c="amber.3" className="font-mono">
                    $ {montoDetraccion.toFixed(2)}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 6, md: 3 }}>
                <Box p="xs" bg="#14532d/40" className="rounded-lg border border-emerald-800 text-center">
                  <Text fz={10} c="emerald.4" tt="uppercase" fw={700}>Monto a Transferir</Text>
                  <Text fz="sm" fw={800} c="emerald.3" className="font-mono">
                    $ {montoTransferencia.toFixed(2)}
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Evidencias de Aprobación */}
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800">
            <MultiFilePicker
              files={evidencias}
              onFilesChange={setEvidencias}
              label="Evidencias / Comprobantes de Aprobación (Opcional)"
            />
          </Paper>

          {/* Footer de Acciones */}
          <Group justify="space-between" align="center" mt="xs">
            <Text fz={11} c="dimmed">
              ⚠️ Una vez aprobada, la valorización queda bloqueada y solo podrá ser anulada.
            </Text>
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                onClick={onClose}
                disabled={loadingSubmit}
                size="xs"
                radius="lg"
              >
                Cancelar
              </Button>
              <Button
                color="teal"
                onClick={handleAprobarSubmit}
                loading={loadingSubmit}
                disabled={
                  loadingSubmit ||
                  loadingCatalogos ||
                  !idCuentaBancaria ||
                  !idCuentaDetraccion ||
                  anticipoExcedeSaldo
                }
                size="xs"
                radius="lg"
                leftSection={<IconCheck size={16} />}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20 px-5"
              >
                Confirmar y Aprobar
              </Button>
            </Group>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Seleccionar Anticipos */}
      {valorizacion && (
        <ModalSeleccionarAnticipos
          opened={modalAnticiposOpened}
          onClose={() => setModalAnticiposOpened(false)}
          idProveedor={valorizacion.id_proveedor_minero}
          montoACubrir={subtotalNeto}
          selectedAnticipos={anticipos}
          anticipoSaldoEfectivoMap={anticipoSaldoMap}
          onConfirmarAnticipos={(ants) => setAnticipos(ants)}
        />
      )}
    </>
  );
};
