import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Group,
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
import { IconArrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { PlantasDestinoService } from "../../../plantas-destino/service/plantas-destino.service";
import { useNotify } from "../../../../hooks/useNotify";
import { MedioPagoComprobante } from "../../../../shared/enums/contabilidad-compra/medio-pago-comprobante";
import { MedioPagoComprobanteVenta } from "../../../../shared/enums/contabilidad-venta/medio-pago-comprobante-venta";
import type { REQ_RegistrarPago } from "../../service/contabilidad-compra.requests";
import type { REQ_RegistrarPagoVenta } from "../../service/contabilidad-venta.requests";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { RES_ComprobanteVenta } from "../../service/contabilidad-venta.responses";

interface ModalRegistroPagoProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra | RES_ComprobanteVenta;
  onSubmit: (payload: REQ_RegistrarPago | REQ_RegistrarPagoVenta) => Promise<unknown>;
  submitting: boolean;
}

interface CuentaOption {
  id_cuenta_bancaria: number;
  banco: string;
  banco_abv: string;
  id_banco: number;
  numero_cuenta: string;
  moneda: string;
  es_para_detraccion?: boolean;
}

const isMonedaSoles = (moneda: string): boolean => {
  if (!moneda) return false;
  const m = moneda.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return m === "SOLES" || m === "SOL" || m === "PEN" || m === "S/" || m === "S/.";
};

const isMonedaDolares = (moneda: string): boolean => {
  if (!moneda) return false;
  const m = moneda.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return m === "DOLARES" || m === "DOLAR" || m === "USD" || m === "$" || m === "US$";
};

export const ModalRegistroPago = ({
  opened,
  onClose,
  comprobante,
  onSubmit,
  submitting,
}: ModalRegistroPagoProps) => {
  const { notifyError } = useNotify();

  const isVenta = "id_planta_destino" in comprobante;

  const [esParaDetraccion, setEsParaDetraccion] = useState(() => {
    const netoSaldadoInit =
      (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
    const detraccionSaldadaInit =
      (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;
    if (netoSaldadoInit && !detraccionSaldadaInit) return true;
    if (detraccionSaldadaInit && !netoSaldadoInit) return false;
    return false;
  });

  const [fechaPago, setFechaPago] = useState<string | null>(dayjs().format("YYYY-MM-DD HH:mm:ss"));
  const [medioPago, setMedioPago] = useState<MedioPagoComprobante>(MedioPagoComprobante.Transferencia);
  const [monto, setMonto] = useState<number | string>("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [observacion, setObservacion] = useState("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  // Cuenta Origen
  // En Compra: Empresa Fabero. En Venta: Planta Destino.
  const [cuentasOrigen, setCuentasOrigen] = useState<CuentaOption[]>([]);
  const [loadingCuentasOrigen, setLoadingCuentasOrigen] = useState(false);
  const [idBancoOrigen, setIdBancoOrigen] = useState<string | null>(null);
  const [idCuentaOrigen, setIdCuentaOrigen] = useState<string | null>(null);

  // Cuenta Destino
  // En Compra: Proveedor. En Venta: Empresa Fabero.
  const [cuentasDestino, setCuentasDestino] = useState<CuentaOption[]>([]);
  const [loadingCuentasDestino, setLoadingCuentasDestino] = useState(false);
  const [idBancoDestino, setIdBancoDestino] = useState<string | null>(null);
  const [idCuentaDestino, setIdCuentaDestino] = useState<string | null>(null);

  const calcPorPagar = useCallback(
    (esDetraccion: boolean): number =>
      Math.max(
        esDetraccion
          ? comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion
          : comprobante.monto_neto - comprobante.avance_pago_neto,
        0,
      ),
    [
      comprobante.monto_detraccion_soles,
      comprobante.avance_pago_detraccion,
      comprobante.monto_neto,
      comprobante.avance_pago_neto,
    ],
  );

  const toDateTimeString = (value: unknown) => {
    if (!value) return null;
    const d = dayjs(value as Date | string);
    if (!d.isValid()) return null;
    return d.format("YYYY-MM-DD HH:mm:ss");
  };

  const wasOpenedRef = useRef(false);

  useEffect(() => {
    if (!opened) {
      wasOpenedRef.current = false;
      return;
    }
    if (!wasOpenedRef.current) {
      wasOpenedRef.current = true;
      queueMicrotask(() => {
        const netoSaldadoInit =
          (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
        const detraccionSaldadaInit =
          (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;
        const initDetraccion = netoSaldadoInit && !detraccionSaldadaInit;

        setEsParaDetraccion(initDetraccion);
        setFechaPago(dayjs().format("YYYY-MM-DD HH:mm:ss"));
        setMedioPago(MedioPagoComprobante.Transferencia);
        setMonto(calcPorPagar(initDetraccion));
        setNumeroOperacion("");
        setObservacion("");
        setEvidencias([]);
        setIdBancoOrigen(null);
        setIdCuentaOrigen(null);
        setIdBancoDestino(null);
        setIdCuentaDestino(null);
      });
    }
  }, [
    opened,
    calcPorPagar,
    comprobante.monto_neto,
    comprobante.avance_pago_neto,
    comprobante.monto_detraccion_soles,
    comprobante.avance_pago_detraccion,
  ]);

  useEffect(() => {
    if (!opened) return;
    queueMicrotask(() => {
      setMonto(calcPorPagar(esParaDetraccion));
    });
  }, [esParaDetraccion, opened, calcPorPagar]);

  // Cargar Cuentas Origen y Destino según si es Compra o Venta
  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    const moneda = esParaDetraccion ? "Soles" : "Dólares";

    if (isVenta) {
      // VENTA: Origen = Planta Destino, Destino = Empresa Fabero
      const idPlanta = (comprobante as RES_ComprobanteVenta).id_planta_destino;
      if (idPlanta) {
        queueMicrotask(() => {
          if (!cancelled) setLoadingCuentasOrigen(true);
        });
        PlantasDestinoService.getCuentasBancarias(idPlanta)
          .then((res) => {
            if (cancelled) return;
            const lista = Array.isArray(res) ? res : [];
            const mapped: CuentaOption[] = lista.map((c) => {
              const item = c as unknown as Record<string, unknown>;
              const bancoStr =
                typeof item.banco === "string"
                  ? item.banco
                  : typeof (item.banco as Record<string, unknown>)?.nombre === "string"
                    ? ((item.banco as Record<string, unknown>).nombre as string)
                    : typeof item.banco_nombre === "string"
                      ? item.banco_nombre
                      : "Banco";
              const bancoAbv =
                typeof item.banco_abv === "string"
                  ? item.banco_abv
                  : typeof (item.banco as Record<string, unknown>)?.abreviatura === "string"
                    ? ((item.banco as Record<string, unknown>).abreviatura as string)
                    : "";
              return {
                id_cuenta_bancaria: Number(item.id_cuenta_bancaria ?? item.id),
                banco: bancoStr,
                banco_abv: bancoAbv,
                id_banco: Number(item.id_banco),
                numero_cuenta: String(item.numero_cuenta || ""),
                moneda: String(item.moneda || ""),
                es_para_detraccion: Boolean(item.es_para_detraccion),
              };
            });
            setCuentasOrigen(mapped);
          })
          .catch((e: unknown) => console.error("Error cuentas planta:", e))
          .finally(() => {
            if (!cancelled) setLoadingCuentasOrigen(false);
          });
      }

      queueMicrotask(() => {
        if (!cancelled) setLoadingCuentasDestino(true);
      });
      AuxService.get_cuentas_bancarias_empresa_por_moneda(moneda, esParaDetraccion)
        .then((res) => {
          if (cancelled) return;
          setCuentasDestino(Array.isArray(res) ? res : []);
        })
        .catch((e: unknown) => console.error("Error cuentas empresa:", e))
        .finally(() => {
          if (!cancelled) setLoadingCuentasDestino(false);
        });
    } else {
      // COMPRA: Origen = Empresa Fabero, Destino = Proveedor
      queueMicrotask(() => {
        if (!cancelled) setLoadingCuentasOrigen(true);
      });
      AuxService.get_cuentas_bancarias_empresa_por_moneda(moneda, esParaDetraccion)
        .then((res) => {
          if (cancelled) return;
          setCuentasOrigen(Array.isArray(res) ? res : []);
        })
        .catch((e: unknown) => console.error("Error cuentas empresa:", e))
        .finally(() => {
          if (!cancelled) setLoadingCuentasOrigen(false);
        });

      const idProveedor = (comprobante as RES_ComprobanteCompra).id_proveedor;
      if (idProveedor) {
        queueMicrotask(() => {
          if (!cancelled) setLoadingCuentasDestino(true);
        });
        AuxService.get_cuentas_bancarias_proveedor(idProveedor)
          .then((res) => {
            if (cancelled) return;
            const lista = Array.isArray(res) ? res : [];
            const mapped: CuentaOption[] = lista.map((c) => ({
              id_cuenta_bancaria: c.id,
              banco: c.banco_nombre ?? "",
              banco_abv: "",
              id_banco: Number(c.id_banco),
              numero_cuenta: c.numero_cuenta,
              moneda: c.moneda,
              es_para_detraccion: Boolean(c.es_para_detraccion),
            }));
            setCuentasDestino(mapped);
          })
          .catch((e: unknown) => console.error("Error cuentas proveedor:", e))
          .finally(() => {
            if (!cancelled) setLoadingCuentasDestino(false);
          });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [opened, esParaDetraccion, isVenta, comprobante]);

  const cuentasOrigenMoneda = useMemo(() => {
    if (!esParaDetraccion) {
      return cuentasOrigen.filter((c) => isMonedaDolares(c.moneda));
    }
    return cuentasOrigen.filter((c) => isMonedaSoles(c.moneda));
  }, [cuentasOrigen, esParaDetraccion]);

  const cuentasDestinoMoneda = useMemo(() => {
    if (!esParaDetraccion) {
      return cuentasDestino.filter((c) => isMonedaDolares(c.moneda));
    }
    return cuentasDestino.filter((c) => isMonedaSoles(c.moneda));
  }, [cuentasDestino, esParaDetraccion]);

  const bancosOrigen = useMemo(() => {
    const map = new Map<number, string>();
    cuentasOrigenMoneda.forEach((c) => {
      if (!map.has(c.id_banco)) map.set(c.id_banco, c.banco);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({
      value: String(id),
      label: nombre,
    }));
  }, [cuentasOrigenMoneda]);

  const bancosDestino = useMemo(() => {
    const map = new Map<number, string>();
    cuentasDestinoMoneda.forEach((c) => {
      if (!map.has(c.id_banco)) map.set(c.id_banco, c.banco);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({
      value: String(id),
      label: nombre,
    }));
  }, [cuentasDestinoMoneda]);

  const cuentasOrigenFiltradas = useMemo(() => {
    if (!idBancoOrigen) return cuentasOrigenMoneda;
    return cuentasOrigenMoneda.filter((c) => String(c.id_banco) === idBancoOrigen);
  }, [cuentasOrigenMoneda, idBancoOrigen]);

  const cuentasDestinoFiltradas = useMemo(() => {
    if (!idBancoDestino) return cuentasDestinoMoneda;
    return cuentasDestinoMoneda.filter((c) => String(c.id_banco) === idBancoDestino);
  }, [cuentasDestinoMoneda, idBancoDestino]);

  // Selección automática inteligente de cuentas
  useEffect(() => {
    if (!opened) return;

    queueMicrotask(() => {
      if (cuentasOrigenMoneda.length > 0) {
        const c = cuentasOrigenMoneda[0];
        setIdBancoOrigen(String(c.id_banco));
        setIdCuentaOrigen(String(c.id_cuenta_bancaria));
      } else {
        setIdBancoOrigen(null);
        setIdCuentaOrigen(null);
      }

      if (cuentasDestinoMoneda.length > 0) {
        let target: CuentaOption = cuentasDestinoMoneda[0];
        if (esParaDetraccion) {
          target =
            cuentasDestinoMoneda.find((c) => c.es_para_detraccion) ??
            cuentasDestinoMoneda[0];
        } else {
          const idSugerido = !isVenta
            ? (comprobante as RES_ComprobanteCompra).id_cuenta_bancaria_proveedor_sugerida
            : undefined;
          target =
            (idSugerido ? cuentasDestinoMoneda.find((c) => c.id_cuenta_bancaria === idSugerido) : undefined) ??
            cuentasDestinoMoneda.find((c) => !c.es_para_detraccion) ??
            cuentasDestinoMoneda[0];
        }
        setIdBancoDestino(String(target.id_banco));
        setIdCuentaDestino(String(target.id_cuenta_bancaria));
      } else {
        setIdBancoDestino(null);
        setIdCuentaDestino(null);
      }
    });
  }, [opened, esParaDetraccion, cuentasOrigenMoneda, cuentasDestinoMoneda, isVenta, comprobante]);

  useEffect(() => {
    if (!opened || !idBancoOrigen || cuentasOrigenFiltradas.length === 0) return;
    const belongs = cuentasOrigenFiltradas.some(
      (c) => String(c.id_cuenta_bancaria) === idCuentaOrigen,
    );
    if (!belongs) {
      queueMicrotask(() => {
        setIdCuentaOrigen(String(cuentasOrigenFiltradas[0].id_cuenta_bancaria));
      });
    }
  }, [idBancoOrigen, cuentasOrigenFiltradas, opened, idCuentaOrigen]);

  useEffect(() => {
    if (!opened || !idBancoDestino || cuentasDestinoFiltradas.length === 0) return;
    const belongs = cuentasDestinoFiltradas.some(
      (c) => String(c.id_cuenta_bancaria) === idCuentaDestino,
    );
    if (!belongs) {
      queueMicrotask(() => {
        setIdCuentaDestino(String(cuentasDestinoFiltradas[0].id_cuenta_bancaria));
      });
    }
  }, [idBancoDestino, cuentasDestinoFiltradas, opened, idCuentaDestino]);

  const porPagar = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto);

  const equivSoles = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto) * comprobante.tipo_cambio_venta;

  const netoSaldado =
    (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
  const detraccionSaldada =
    (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;

  useEffect(() => {
    if (!opened) return;
    queueMicrotask(() => {
      if (netoSaldado && !detraccionSaldada) {
        setEsParaDetraccion(true);
      } else if (detraccionSaldada && !netoSaldado) {
        setEsParaDetraccion(false);
      }
    });
  }, [opened, netoSaldado, detraccionSaldada]);

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

    if (isVenta) {
      const payload: REQ_RegistrarPagoVenta = {
        id_cuenta_bancaria_planta: idCuentaOrigen ? Number(idCuentaOrigen) : null,
        id_cuenta_bancaria_empresa: idCuentaDestino ? Number(idCuentaDestino) : null,
        es_para_detraccion: esParaDetraccion,
        medio_pago: medioPago as unknown as MedioPagoComprobanteVenta,
        monto_pagado: montoNum,
        fecha_hora_pago: fechaHora ?? undefined,
        numero_operacion: numeroOperacion.trim() || null,
        observacion: observacion.trim() || null,
        evidencias: evidencias.length > 0 ? evidencias : undefined,
      };
      const res = await onSubmit(payload);
      if (res) onClose();
    } else {
      const payload: REQ_RegistrarPago = {
        id_cuenta_bancaria_empresa: idCuentaOrigen ? Number(idCuentaOrigen) : null,
        id_cuenta_bancaria_proveedor: idCuentaDestino ? Number(idCuentaDestino) : null,
        es_para_detraccion: esParaDetraccion,
        medio_pago: medioPago,
        monto_pagado: montoNum,
        fecha_hora_pago: fechaHora ?? undefined,
        numero_operacion: numeroOperacion.trim() || null,
        observacion: observacion.trim() || null,
        evidencias: evidencias.length > 0 ? evidencias : undefined,
      };
      const res = await onSubmit(payload);
      if (res) onClose();
    }
  };

  const labelOrigen = isVenta ? "1. CUENTA ORIGEN (PLANTA DESTINO)" : "1. CUENTA ORIGEN (EMPRESA FABERO)";
  const labelDestino = isVenta ? "2. CUENTA DESTINO (EMPRESA FABERO)" : "2. CUENTA DESTINO (PROVEEDOR)";
  const colorTema = esParaDetraccion ? "yellow" : "teal";
  const monedaSimbolo = esParaDetraccion ? "S/" : "$";

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Nuevo Pago — ${comprobante.codigo_completo} (${isVenta ? "Venta" : "Compra"})`}
      rightSection={
        <Switch
          label={esParaDetraccion ? "Pago de Detracción" : "Pago de Neto"}
          checked={esParaDetraccion}
          onChange={(event) => {
            const next = event.currentTarget.checked;
            if (next && detraccionSaldada) {
              notifyError("La detracción ya está totalmente pagada.");
              return;
            }
            if (!next && netoSaldado) {
              notifyError("El saldo neto ya está totalmente pagado.");
              return;
            }
            setEsParaDetraccion(next);
            setIdBancoOrigen(null);
            setIdCuentaOrigen(null);
            setIdBancoDestino(null);
            setIdCuentaDestino(null);
          }}
          color="yellow"
          size="md"
        />
      }
      size="6xl"
    >
      <Stack gap="md">
        {/* Banner informativo de cuentas */}
        <Paper
          p="xs"
          radius="md"
          className="bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300"
        >
          <Group justify="space-between">
            <Group gap="xs">
              <Text fz="xs" fw={700} c="white">
                Ruta del Pago:
              </Text>
              <Text fz="xs" c="cyan.4">
                {isVenta ? (comprobante as RES_ComprobanteVenta).planta_nombre : "Empresa Fabero"}
              </Text>
              <IconArrowRight size={14} className="text-zinc-500" />
              <Text fz="xs" c="emerald.4">
                {isVenta ? "Empresa Fabero" : (comprobante as RES_ComprobanteCompra).proveedor_nombre}
              </Text>
            </Group>
            <Badge color={colorTema} variant="light" size="sm">
              Moneda: {esParaDetraccion ? "Soles (S/)" : "Dólares ($)"}
            </Badge>
          </Group>
        </Paper>

        {/* Fila Cuentas: Origen y Destino */}
        <Group grow align="stretch" gap="md">
          {/* Origen */}
          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800">
            <Text fz={10} tt="uppercase" fw={700} c="zinc.4" mb="xs">
              {labelOrigen}
            </Text>
            <Stack gap="xs">
              <Select
                label="Banco"
                placeholder={loadingCuentasOrigen ? "Cargando..." : "Seleccione banco..."}
                data={bancosOrigen}
                value={idBancoOrigen}
                onChange={setIdBancoOrigen}
                disabled={loadingCuentasOrigen || bancosOrigen.length === 0}
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950/80 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs mb-1",
                }}
              />
              <Select
                label="Número de Cuenta"
                placeholder={loadingCuentasOrigen ? "Cargando..." : "Seleccione cuenta..."}
                data={cuentasOrigenFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} (${c.moneda})`,
                }))}
                value={idCuentaOrigen}
                onChange={setIdCuentaOrigen}
                disabled={loadingCuentasOrigen || cuentasOrigenFiltradas.length === 0}
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950/80 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs mb-1",
                }}
              />
            </Stack>
          </Paper>

          {/* Destino */}
          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800">
            <Text fz={10} tt="uppercase" fw={700} c="zinc.4" mb="xs">
              {labelDestino}
            </Text>
            <Stack gap="xs">
              <Select
                label="Banco"
                placeholder={loadingCuentasDestino ? "Cargando..." : "Seleccione banco..."}
                data={bancosDestino}
                value={idBancoDestino}
                onChange={setIdBancoDestino}
                disabled={loadingCuentasDestino || bancosDestino.length === 0}
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950/80 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs mb-1",
                }}
              />
              <Select
                label="Número de Cuenta"
                placeholder={loadingCuentasDestino ? "Cargando..." : "Seleccione cuenta..."}
                data={cuentasDestinoFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} (${c.moneda})${c.es_para_detraccion ? " [Detracción]" : ""}`,
                }))}
                value={idCuentaDestino}
                onChange={setIdCuentaDestino}
                disabled={loadingCuentasDestino || cuentasDestinoFiltradas.length === 0}
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950/80 border-zinc-800 text-white",
                  label: "text-zinc-400 text-xs mb-1",
                }}
              />
            </Stack>
          </Paper>
        </Group>

        {/* Detalles de la operación */}
        <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800">
          <Group justify="space-between" mb="xs">
            <Text fz={10} tt="uppercase" fw={700} c="zinc.4">
              DETALLES DE LA OPERACIÓN
            </Text>
            <Badge size="sm" color={colorTema} variant="light">
              PENDIENTE: {monedaSimbolo} {porPagar.toFixed(2)}
              {!esParaDetraccion && comprobante.tipo_cambio_venta > 0 && (
                <span> (Equiv. S/ {equivSoles.toFixed(2)})</span>
              )}
            </Badge>
          </Group>

          <Group grow align="flex-start" gap="sm">
            <DateTimePicker
              label="Fecha Pago"
              value={fechaPago ? dayjs(fechaPago).toDate() : null}
              onChange={(v) => setFechaPago(v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : null)}
              valueFormat="DD/MM/YYYY HH:mm"
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-950/80 border-zinc-800 text-white",
                label: "text-zinc-400 text-xs mb-1",
              }}
            />

            <Select
              label="Medio Pago"
              data={[
                { value: MedioPagoComprobante.Transferencia, label: "Transferencia" },
                { value: MedioPagoComprobante.Deposito, label: "Depósito" },
                { value: MedioPagoComprobante.Efectivo, label: "Efectivo" },
              ]}
              value={medioPago}
              onChange={(v) => setMedioPago((v as MedioPagoComprobante) || MedioPagoComprobante.Transferencia)}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-950/80 border-zinc-800 text-white",
                label: "text-zinc-400 text-xs mb-1",
              }}
            />

            <TextInput
              label="N° Operación"
              placeholder="12345678"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.currentTarget.value)}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-950/80 border-zinc-800 text-white",
                label: "text-zinc-400 text-xs mb-1",
              }}
            />

            <NumberInput
              label={`Monto a Pagar (${monedaSimbolo})`}
              value={monto}
              onChange={setMonto}
              min={0}
              max={porPagar}
              decimalScale={2}
              fixedDecimalScale
              prefix={`${monedaSimbolo} `}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-950/80 border-zinc-800 text-white font-mono font-bold",
                label: "text-zinc-400 text-xs mb-1",
              }}
            />
          </Group>
        </Paper>

        {/* Evidencias */}
        <div>
          <Text fz="xs" fw={500} c="dimmed" mb={4}>
            Evidencia (Imágenes o documentos: PDF, JPG, PNG...)
          </Text>
          <MultiFilePicker files={evidencias} onFilesChange={setEvidencias} />
        </div>

        {/* Observación */}
        <Textarea
          label="Observación"
          placeholder="Comentario u observación sobre el pago..."
          value={observacion}
          onChange={(e) => setObservacion(e.currentTarget.value)}
          rows={2}
          size="xs"
          radius="lg"
          classNames={{
            input: "bg-zinc-900/50 border-zinc-800 text-white",
            label: "text-zinc-400 text-xs mb-1",
          }}
        />

        {/* Acciones */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="lg" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            color="indigo"
            radius="lg"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || (Number(monto) || 0) <= 0}
          >
            Registrar Pago
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};