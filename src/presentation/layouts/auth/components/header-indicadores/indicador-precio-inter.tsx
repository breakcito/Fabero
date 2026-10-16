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
  SegmentedControl,
  ActionIcon,
} from "@mantine/core";
import {
  IconFlame,
  IconAlertTriangle,
  IconPlus,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { RefreshButton } from "../../../../utils/refresh-button";
import { CustomDatePicker } from "../../../../utils/date-picker-input";
import { useNotify } from "../../../../../hooks/useNotify";
import { AuxService } from "../../../../../service/auxiliar.service";
import { usePrecioInterStore } from "../../../../../stores/precio-inter.store";
import { ElementoQuimicoValorizacion } from "../../../../../shared/enums/_generic/elemento-quimico-valorizacion";

const fieldClasses = {
  input:
    "bg-zinc-900/70 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder:text-zinc-500 transition-all h-7.5 text-xs",
  label: "text-zinc-400 mb-0.5 font-medium text-[10px] ml-0.5 flex items-center gap-1",
};

export const IndicadorPrecioInter = () => {
  const { notifySuccess, notifyError } = useNotify();
  const { preciosVigentes, loading, fetchPreciosVigentes } = usePrecioInterStore();

  const [opened, setOpened] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [mostrarForm, setMostrarForm] = useState(false);
  const [elemento, setElemento] = useState<"Oro" | "Plata">("Oro");
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [inter, setInter] = useState<number | string>("");
  const [submitting, setSubmitting] = useState(false);

  const recargar = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPreciosVigentes();
    } finally {
      setRefreshing(false);
    }
  }, [fetchPreciosVigentes]);

  useEffect(() => {
    fetchPreciosVigentes();
  }, [fetchPreciosVigentes]);

  const oro = preciosVigentes.Oro;
  const plata = preciosVigentes.Plata;
  const ultimoOro = preciosVigentes.ultimo_oro;
  const ultimoPlata = preciosVigentes.ultimo_plata;

  const hayAmbosHoy = !!oro && !!plata;
  const hayAlgunoHoy = !!oro || !!plata;

  useEffect(() => {
    if (opened) {
      // Si falta registrar alguno hoy, desplegar form
      setMostrarForm(!hayAmbosHoy);
      // Auto-seleccionar el que falte
      if (!oro && plata) {
        setElemento("Oro");
      } else if (oro && !plata) {
        setElemento("Plata");
      }
      setInter("");
      setFecha(new Date());
    }
  }, [opened, hayAmbosHoy, oro, plata]);

  const handleCrear = async () => {
    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter));

    if (!fecha) {
      notifyError("Selecciona una fecha válida.");
      return;
    }
    if (isNaN(numInter) || numInter <= 0) {
      notifyError("El valor INTER debe ser mayor a 0.");
      return;
    }

    const fechaStr = dayjs(fecha).format("YYYY-MM-DD");

    setSubmitting(true);
    try {
      const res = await AuxService.registrar_precio_elemento({
        elemento_quimico:
          elemento === "Oro"
            ? ElementoQuimicoValorizacion.Oro
            : ElementoQuimicoValorizacion.Plata,
        fecha: fechaStr,
        inter: numInter,
      });

      if (res.success) {
        notifySuccess(`Precio INTER de ${elemento} registrado.`);
        setMostrarForm(false);
        setInter("");
        await recargar();
      } else {
        notifyError(res.message || "Error al registrar precio.");
      }
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al registrar precio.",
      );
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
      width={320}
      withinPortal
      zIndex={150}
    >
      <Popover.Target>
        <Tooltip
          label={
            hayAmbosHoy
              ? `INTER de hoy: Oro $${oro!.inter.toFixed(2)} | Plata $${plata!.inter.toFixed(2)}`
              : hayAlgunoHoy
              ? `INTER hoy parcial: ${oro ? `Oro $${oro.inter.toFixed(2)}` : "Oro pendiente"} - ${
                  plata ? `Plata $${plata.inter.toFixed(2)}` : "Plata pendiente"
                }`
              : "Precios INTER de hoy sin registrar. Clic para registrar."
          }
          withArrow
          position="bottom"
          disabled={opened}
        >
          <button
            onClick={() => setOpened((o) => !o)}
            className={`h-8 px-2.5 flex items-center gap-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-xs font-medium ${
              opened
                ? "bg-yellow-500/15 border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.25)]"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {loading && !hayAlgunoHoy && !ultimoOro ? (
              <Loader size={12} color="yellow" />
            ) : (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-lg ${
                  hayAmbosHoy
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-amber-500/15 text-amber-400 animate-pulse"
                }`}
              >
                <IconFlame size={13} stroke={2.2} />
              </div>
            )}

            {hayAmbosHoy ? (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-400">Au</span>
                  <span className="text-zinc-200 font-semibold">
                    ${oro!.inter.toFixed(1)}
                  </span>
                </div>
                <span className="text-zinc-600 text-[10px]">|</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-cyan-400">Ag</span>
                  <span className="text-zinc-200 font-semibold">
                    ${plata!.inter.toFixed(1)}
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              </div>
            ) : hayAlgunoHoy ? (
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {oro ? (
                  <span className="text-amber-400 font-semibold">Au ${oro.inter.toFixed(1)}</span>
                ) : (
                  <span className="text-amber-500/80">Au Pend.</span>
                )}
                <span className="text-zinc-600 text-[10px]">|</span>
                {plata ? (
                  <span className="text-cyan-400 font-semibold">Ag ${plata.inter.toFixed(1)}</span>
                ) : (
                  <span className="text-cyan-500/80">Ag Pend.</span>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400 text-[11px]">
                <IconAlertTriangle size={12} />
                <span>INTER Pendiente</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            )}
          </button>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 p-3 text-white rounded-xl shadow-2xl">
        <Stack gap={10}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <Group gap={6}>
              <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                <IconFlame size={13} stroke={2.2} />
              </div>
              <Text fz="12px" fw={700} c="white">
                Precios INTER (Hoy)
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

          {/* Tarjetas Oro / Plata */}
          <div className="grid grid-cols-2 gap-2">
            {/* Oro */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                oro
                  ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                  : "bg-zinc-900/60 border-zinc-800/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <Text fz="11px" fw={700} c="amber.4">
                  Oro
                </Text>
                {oro ? (
                  <Badge color="emerald" variant="light" size="xs" radius="sm" tt="none" className="shrink-0 text-[10px] px-1.5 h-4.5">
                    Hoy
                  </Badge>
                ) : (
                  <Badge color="yellow" variant="dot" size="xs" radius="sm" tt="none" className="shrink-0 text-[10px] px-1 h-4.5">
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="text-center py-0.5">
                <Text fz="md" fw={800} c={oro ? "amber.3" : "zinc.6"} className="font-mono tracking-tight">
                  {oro ? `$${oro.inter.toFixed(2)}` : "—"}
                </Text>
                <div className="mt-0.5">
                  {oro ? (
                    <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider">
                      $/OZ TC
                    </span>
                  ) : ultimoOro ? (
                    <span title={`Fecha: ${ultimoOro.fecha}`} className="text-[9.5px] text-zinc-400 font-medium">
                      Últ: <span className="font-mono text-zinc-300 font-semibold">${ultimoOro.inter.toFixed(2)}</span>
                      <span className="text-zinc-500 text-[9px] ml-1">({dayjs(ultimoOro.fecha).format("DD/MM")})</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-zinc-500">Sin registro</span>
                  )}
                </div>
              </div>
            </div>

            {/* Plata */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                plata
                  ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  : "bg-zinc-900/60 border-zinc-800/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <Text fz="11px" fw={700} c="cyan.3">
                  Plata
                </Text>
                {plata ? (
                  <Badge color="emerald" variant="light" size="xs" radius="sm" tt="none" className="shrink-0 text-[10px] px-1.5 h-4.5">
                    Hoy
                  </Badge>
                ) : (
                  <Badge color="yellow" variant="dot" size="xs" radius="sm" tt="none" className="shrink-0 text-[10px] px-1 h-4.5">
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="text-center py-0.5">
                <Text fz="md" fw={800} c={plata ? "cyan.3" : "zinc.6"} className="font-mono tracking-tight">
                  {plata ? `$${plata.inter.toFixed(2)}` : "—"}
                </Text>
                <div className="mt-0.5">
                  {plata ? (
                    <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider">
                      $/OZ TC
                    </span>
                  ) : ultimoPlata ? (
                    <span title={`Fecha: ${ultimoPlata.fecha}`} className="text-[9.5px] text-zinc-400 font-medium">
                      Últ: <span className="font-mono text-zinc-300 font-semibold">${ultimoPlata.inter.toFixed(2)}</span>
                      <span className="text-zinc-500 text-[9px] ml-1">({dayjs(ultimoPlata.fecha).format("DD/MM")})</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-zinc-500">Sin registro</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          {!mostrarForm ? (
            <Button
              leftSection={<IconPlus size={12} />}
              variant="light"
              color="amber"
              radius="md"
              size="xs"
              onClick={() => setMostrarForm(true)}
              className="w-full h-7 text-[11px] font-semibold"
            >
              Registrar Cotización
            </Button>
          ) : (
            <div className={`p-2.5 rounded-xl bg-zinc-900/90 border transition-all space-y-2 ${
              elemento === "Oro" ? "border-amber-500/30" : "border-cyan-500/30"
            }`}>
              <SegmentedControl
                value={elemento}
                onChange={(val) => setElemento(val as "Oro" | "Plata")}
                data={[
                  {
                    value: "Oro",
                    label: (
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                        <span>Oro</span>
                      </div>
                    ),
                  },
                  {
                    value: "Plata",
                    label: (
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                        <span>Plata</span>
                      </div>
                    ),
                  },
                ]}
                size="xs"
                radius="md"
                fullWidth
                color={elemento === "Oro" ? "yellow.8" : "cyan.8"}
                styles={{
                  root: {
                    backgroundColor: "rgba(24, 24, 27, 0.9)",
                    border: "1px solid rgba(63, 63, 70, 0.5)",
                    padding: "3px",
                  },
                  label: {
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#d4d4d8",
                  },
                  indicator: {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  },
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <CustomDatePicker
                  label="Fecha:"
                  value={fecha}
                  onChange={(d) => setFecha(d)}
                  placeholder="DD/MM/YYYY"
                  classNames={fieldClasses}
                  size="xs"
                  radius="md"
                />

                <NumberInput
                  label={`INTER ${elemento} ($/OZ TC):`}
                  value={inter}
                  onChange={setInter}
                  decimalScale={2}
                  fixedDecimalScale
                  min={0.01}
                  hideControls
                  placeholder={elemento === "Oro" ? "2650.00" : "31.50"}
                  classNames={fieldClasses}
                  size="xs"
                  radius="md"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  radius="md"
                  onClick={() => setMostrarForm(false)}
                  disabled={submitting}
                  className="h-7 text-xs px-2.5 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  size="xs"
                  radius="md"
                  onClick={handleCrear}
                  loading={submitting}
                  leftSection={<IconCheck size={12} />}
                  className={`h-7 text-xs px-3 font-semibold transition-all ${
                    elemento === "Oro"
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/30"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-600/30"
                  }`}
                >
                  Guardar {elemento}
                </Button>
              </div>
            </div>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
