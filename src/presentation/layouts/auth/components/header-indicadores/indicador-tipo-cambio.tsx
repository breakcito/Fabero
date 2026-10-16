import { useEffect, useState, useCallback } from "react";
import {
  Popover,
  Tooltip,
  Loader,
  Stack,
  Group,
  Text,
  Badge,
  NumberInput,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  IconCurrencyDollar,
  IconAlertTriangle,
  IconExternalLink,
  IconPlus,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { RefreshButton } from "../../../../utils/refresh-button";
import { CustomDatePicker } from "../../../../utils/date-picker-input";
import { useNotify } from "../../../../../hooks/useNotify";
import { AuxService } from "../../../../../service/auxiliar.service";
import { useTipoCambioStore } from "../../../../../stores/tipo-cambio.store";

const fieldClasses = {
  input:
    "bg-zinc-900/70 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-7.5 text-xs",
  label: "text-zinc-400 mb-0.5 font-medium text-[10px] ml-0.5 flex items-center gap-1",
};

export const IndicadorTipoCambio = () => {
  const { notifySuccess, notifyError } = useNotify();
  const {
    tipoCambioHoy,
    ultimoHistorico,
    registradoHoy,
    loading,
    fetchTipoCambioVigente,
  } = useTipoCambioStore();

  const [opened, setOpened] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [mostrarForm, setMostrarForm] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [valorCompra, setValorCompra] = useState<number | string>("");
  const [valorVenta, setValorVenta] = useState<number | string>("");
  const [submitting, setSubmitting] = useState(false);

  const recargar = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTipoCambioVigente();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTipoCambioVigente]);

  useEffect(() => {
    fetchTipoCambioVigente();
  }, [fetchTipoCambioVigente]);

  useEffect(() => {
    if (opened) {
      // Si hoy falta registrar, sugerir abrir formulario directamente
      setMostrarForm(!registradoHoy);
      setValorCompra("");
      setValorVenta("");
      setFecha(new Date());
    }
  }, [opened, registradoHoy]);

  const handleCrear = async () => {
    const numCompra = typeof valorCompra === "number" ? valorCompra : parseFloat(String(valorCompra));
    const numVenta = typeof valorVenta === "number" ? valorVenta : parseFloat(String(valorVenta));

    if (!fecha) {
      notifyError("Selecciona una fecha válida.");
      return;
    }
    if (isNaN(numCompra) || numCompra <= 0) {
      notifyError("Compra debe ser > 0.");
      return;
    }
    if (isNaN(numVenta) || numVenta <= 0) {
      notifyError("Venta debe ser > 0.");
      return;
    }

    const fechaStr = dayjs(fecha).format("YYYY-MM-DD");

    setSubmitting(true);
    try {
      const res = await AuxService.crear_tipo_cambio({
        fecha: fechaStr,
        valor_compra: numCompra,
        valor_venta: numVenta,
      });

      if (res.success) {
        notifySuccess("Tipo de cambio registrado.");
        setMostrarForm(false);
        setValorCompra("");
        setValorVenta("");
        await recargar();
      } else {
        notifyError(res.message || "Error al registrar.");
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al registrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      offset={10}
      withArrow
      arrowSize={10}
      shadow="xl"
      radius="lg"
      width={280}
      withinPortal
      zIndex={150}
    >
      <Popover.Target>
        <Tooltip
          label={
            registradoHoy && tipoCambioHoy
              ? `TC de hoy (${tipoCambioHoy.fecha}): C ${tipoCambioHoy.valor_compra.toFixed(3)} / V ${tipoCambioHoy.valor_venta.toFixed(3)}`
              : "TC de hoy no registrado. Clic para registrar."
          }
          withArrow
          position="bottom"
          disabled={opened}
        >
          <button
            onClick={() => setOpened((o) => !o)}
            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-xs font-medium ${
              opened
                ? "bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {loading && !tipoCambioHoy && !ultimoHistorico ? (
              <Loader size={12} color="amber" />
            ) : (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-lg ${
                  registradoHoy
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/15 text-red-400 animate-pulse"
                }`}
              >
                <IconCurrencyDollar size={13} stroke={2.2} />
              </div>
            )}

            {registradoHoy && tipoCambioHoy ? (
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[11px] font-bold text-zinc-300">TC</span>
                <span className="text-teal-400 font-semibold text-[11px]">
                  {tipoCambioHoy.valor_compra.toFixed(3)}
                </span>
                <span className="text-zinc-600 text-[10px]">/</span>
                <span className="text-indigo-400 font-semibold text-[11px]">
                  {tipoCambioHoy.valor_venta.toFixed(3)}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                  title="Al día (Hoy)"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400 text-[11px]">
                <IconAlertTriangle size={12} className="text-amber-400" />
                <span className="font-semibold">TC Pendiente</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            )}
          </button>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 p-3 text-white rounded-xl shadow-2xl">
        <Stack gap={8}>
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
            <Group gap={6}>
              <IconCurrencyDollar size={14} className="text-amber-400" />
              <Text fz="11px" fw={700} c="white">
                Tipo de Cambio
              </Text>
            </Group>
            <Group gap={4}>
              <RefreshButton
                onClick={recargar}
                loading={refreshing}
                label="Recargar"
                className="h-6 w-6 min-h-6 min-w-6"
              />
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                radius="xl"
                onClick={() => setOpened(false)}
                className="text-zinc-400 hover:text-white"
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>
          </div>

          {/* Tarjeta TC Vigente de hoy */}
          {registradoHoy && tipoCambioHoy ? (
            <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <Text fz="9px" fw={700} c="dimmed" tt="uppercase">
                  Cotización de Hoy
                </Text>
                <Badge color="emerald" variant="light" size="xs" radius="sm">
                  Al día
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800 text-center">
                  <Text fz="9px" c="dimmed" fw={600} tt="uppercase">
                    Compra
                  </Text>
                  <Text fz="sm" fw={800} c="teal.4" className="font-mono">
                    S/ {tipoCambioHoy.valor_compra.toFixed(3)}
                  </Text>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800 text-center">
                  <Text fz="9px" c="dimmed" fw={600} tt="uppercase">
                    Venta
                  </Text>
                  <Text fz="sm" fw={800} c="indigo.4" className="font-mono">
                    S/ {tipoCambioHoy.valor_venta.toFixed(3)}
                  </Text>
                </div>
              </div>

              {tipoCambioHoy.empleado_registro_nombre && (
                <Text fz="9px" c="dimmed" mt={3} className="text-right truncate">
                  Por: {tipoCambioHoy.empleado_registro_nombre}
                </Text>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
              <Group gap={4} justify="center" className="text-amber-400">
                <IconAlertTriangle size={14} />
                <Text fz="11px" fw={700}>
                  Pendiente de registro hoy
                </Text>
              </Group>
              <Text fz="10px" c="dimmed">
                Aún no se ha registrado el TC para la fecha actual.
              </Text>
              {ultimoHistorico && (
                <Text fz="9px" c="zinc.4" className="font-mono pt-1">
                  Último ({ultimoHistorico.fecha}): C {ultimoHistorico.valor_compra.toFixed(3)} / V {ultimoHistorico.valor_venta.toFixed(3)}
                </Text>
              )}
            </div>
          )}

          {/* Link SUNAT */}
          <a
            href="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2 py-1 rounded border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-[10px] transition-colors"
          >
            <div className="flex items-center gap-1">
              <IconExternalLink size={11} />
              <span>Ver oficial en SUNAT</span>
            </div>
          </a>

          {/* Formulario */}
          {!mostrarForm ? (
            <Button
              leftSection={<IconPlus size={12} />}
              variant="light"
              color="indigo"
              radius="md"
              size="xs"
              onClick={() => setMostrarForm(true)}
              className="w-full h-7 text-[11px]"
            >
              Registrar Tipo de Cambio
            </Button>
          ) : (
            <div className="p-2 rounded-lg bg-zinc-900/80 border border-indigo-500/30 space-y-1.5">
              <CustomDatePicker
                label="Fecha:"
                value={fecha}
                onChange={(d) => setFecha(d)}
                placeholder="DD/MM/YYYY"
                classNames={fieldClasses}
                size="xs"
                radius="md"
              />

              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Compra:"
                  value={valorCompra}
                  onChange={setValorCompra}
                  decimalScale={3}
                  fixedDecimalScale
                  min={0.001}
                  placeholder="3.750"
                  classNames={fieldClasses}
                  size="xs"
                  radius="md"
                />
                <NumberInput
                  label="Venta:"
                  value={valorVenta}
                  onChange={setValorVenta}
                  decimalScale={3}
                  fixedDecimalScale
                  min={0.001}
                  placeholder="3.785"
                  classNames={fieldClasses}
                  size="xs"
                  radius="md"
                />
              </div>

              <Group justify="end" gap={4} mt={3}>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  radius="md"
                  onClick={() => setMostrarForm(false)}
                  disabled={submitting}
                  className="h-6 text-[10px] px-2"
                >
                  Cancelar
                </Button>
                <Button
                  color="indigo"
                  size="xs"
                  radius="md"
                  onClick={handleCrear}
                  loading={submitting}
                  leftSection={<IconCheck size={11} />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-6 text-[10px] px-2.5"
                >
                  Guardar
                </Button>
              </Group>
            </div>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
