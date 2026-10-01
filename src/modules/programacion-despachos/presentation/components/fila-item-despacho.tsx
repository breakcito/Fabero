import { useState, useEffect } from "react";
import {
  Badge,
  Checkbox,
  Group,
  Loader,
  NumberInput,
  Popover,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconCheck, IconLock } from "@tabler/icons-react";
import { formatNumber } from "../../../../shared/functions/formatNumber";
import type { DespachoDetalleItem } from "../../service/programacion-despachos.responses";
import { ProgramacionDespachosService } from "../../service/programacion-despachos.service";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  detalle: DespachoDetalleItem;
  onRefresh: () => void;
}

interface CheckboxConfirmacionProps {
  elemento: "Oro" | "Plata";
  valorizado: boolean;
  confirmado: boolean;
  puedeConfirmar: boolean;
  loading: boolean;
  onToggle: (checked: boolean) => void;
}

/**
 * Checkbox de confirmación con Popover informativo de Mantine
 */
const CheckboxConfirmacionPopover = ({
  elemento,
  valorizado,
  confirmado,
  puedeConfirmar,
  loading,
  onToggle,
}: CheckboxConfirmacionProps) => {
  const [opened, { close, open }] = useDisclosure(false);

  const disabled = valorizado || (!puedeConfirmar && !confirmado) || loading;

  const renderContenidoPopover = () => {
    if (valorizado) {
      return (
        <Group gap={8} wrap="nowrap" align="start">
          <IconLock size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <Text size="11px" fw={700} c="red.3">
              Valorizado en Venta
            </Text>
            <Text size="10px" c="zinc.4">
              Este item ya fue valorizado para {elemento}. No se puede modificar ni desconfirmar.
            </Text>
          </div>
        </Group>
      );
    }

    if (!puedeConfirmar && !confirmado) {
      return (
        <Group gap={8} wrap="nowrap" align="start">
          <IconAlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <Text size="11px" fw={700} c="amber.3">
              Confirmación Bloqueada
            </Text>
            <Text size="10px" c="zinc.4">
              Todas las distribuciones deben tener fecha de llegada al cliente y ley de {elemento} registrada.
            </Text>
          </div>
        </Group>
      );
    }

    if (confirmado) {
      return (
        <Group gap={8} wrap="nowrap" align="start">
          <IconCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <Text size="11px" fw={700} c="indigo.3">
              Ley Final Confirmada
            </Text>
            <Text size="10px" c="zinc.4">
              Haga clic para desmarcar y habilitar la edición de la ley final.
            </Text>
          </div>
        </Group>
      );
    }

    return (
      <Group gap={8} wrap="nowrap" align="start">
        <IconCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <Text size="11px" fw={700} c="emerald.3">
            Confirmar Ley Final
          </Text>
          <Text size="10px" c="zinc.4">
            Haga clic para fijar y confirmar la ley final de {elemento}.
          </Text>
        </div>
      </Group>
    );
  };

  if (loading) {
    return <Loader size={16} color="indigo" />;
  }

  return (
    <Popover
      opened={opened}
      position="top"
      withArrow
      shadow="xl"
      radius="md"
      withinPortal
    >
      <Popover.Target>
        <span
          onMouseEnter={open}
          onMouseLeave={close}
          className="inline-flex items-center"
        >
          <Checkbox
            size="xs"
            color={valorizado ? "emerald" : "indigo"}
            checked={confirmado}
            disabled={disabled}
            onChange={(e) => onToggle(e.currentTarget.checked)}
            styles={{
              input: { cursor: disabled ? "not-allowed" : "pointer" },
            }}
          />
        </span>
      </Popover.Target>
      <Popover.Dropdown className="bg-zinc-950/95 border border-zinc-700/80 p-2.5 max-w-xs shadow-2xl backdrop-blur-md">
        {renderContenidoPopover()}
      </Popover.Dropdown>
    </Popover>
  );
};

export const FilaItemDespacho = ({ detalle: d, onRefresh }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const total = d.peso_tomado ?? 0;
  const pend = d.peso_actual ?? 0;
  const dist = Math.max(total - pend, 0);
  const pct = total > 0 ? (dist / total) * 100 : 0;
  const esLote = d.lote_correlativo !== null;
  const correlativo = d.lote_correlativo ?? d.blending_correlativo ?? "—";

  // Valores de inputs de leyes finales
  const [leyOro, setLeyOro] = useState<number | string>(() => {
    if (d.ley_oro_final && d.ley_oro_final > 0) return d.ley_oro_final;
    if (d.ley_oro_cliente_promedio !== null && d.ley_oro_cliente_promedio !== undefined)
      return d.ley_oro_cliente_promedio;
    return 0;
  });

  const [leyPlata, setLeyPlata] = useState<number | string>(() => {
    if (d.ley_plata_final && d.ley_plata_final > 0) return d.ley_plata_final;
    if (d.ley_plata_cliente_promedio !== null && d.ley_plata_cliente_promedio !== undefined)
      return d.ley_plata_cliente_promedio;
    return 0;
  });

  // Sincronizar si cambian los props desde el backend
  useEffect(() => {
    if (d.ley_oro_final_confirmada || (d.ley_oro_final && d.ley_oro_final > 0)) {
      setLeyOro(d.ley_oro_final ?? 0);
    } else if (d.ley_oro_cliente_promedio !== null && d.ley_oro_cliente_promedio !== undefined) {
      setLeyOro(d.ley_oro_cliente_promedio);
    }

    if (d.ley_plata_final_confirmada || (d.ley_plata_final && d.ley_plata_final > 0)) {
      setLeyPlata(d.ley_plata_final ?? 0);
    } else if (d.ley_plata_cliente_promedio !== null && d.ley_plata_cliente_promedio !== undefined) {
      setLeyPlata(d.ley_plata_cliente_promedio);
    }
  }, [
    d.ley_oro_final,
    d.ley_oro_final_confirmada,
    d.ley_oro_cliente_promedio,
    d.ley_plata_final,
    d.ley_plata_final_confirmada,
    d.ley_plata_cliente_promedio,
  ]);

  const [loadingOro, setLoadingOro] = useState(false);
  const [loadingPlata, setLoadingPlata] = useState(false);

  const confirmadaOro = Boolean(d.ley_oro_final_confirmada);
  const confirmadaPlata = Boolean(d.ley_plata_final_confirmada);
  const valorizadaOro = Boolean(d.esta_valorizado_oro);
  const valorizadaPlata = Boolean(d.esta_valorizado_plata);
  const puedeConfirmar = Boolean(d.puede_confirmar_leyes);

  const handleToggleConfirmacion = async (
    elemento: "Oro" | "Plata",
    nuevoConfirmado: boolean,
  ) => {
    const valor =
      elemento === "Oro"
        ? Number(leyOro || 0)
        : Number(leyPlata || 0);

    if (nuevoConfirmado && valor < 0) {
      notifyError("La ley final no puede ser negativa.");
      return;
    }

    if (elemento === "Oro") setLoadingOro(true);
    else setLoadingPlata(true);

    try {
      await ProgramacionDespachosService.actualizarLeyFinal(d.id, {
        elemento,
        ley_final: valor,
        confirmada: nuevoConfirmado,
      });

      notifySuccess(
        nuevoConfirmado
          ? `Ley final de ${elemento} confirmada.`
          : `Ley final de ${elemento} desbloqueada para edición.`,
      );
      onRefresh();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || `Error al actualizar ley de ${elemento}.`;
      notifyError(errorMsg);
    } finally {
      if (elemento === "Oro") setLoadingOro(false);
      else setLoadingPlata(false);
    }
  };

  return (
    <tr className="hover:bg-zinc-900/40 transition-colors">
      {/* 1. Ítem / Cód. Preliminar / Proveedor (Combinado para ahorrar espacio) */}
      <td className="py-2.5 px-3 text-center align-middle">
        <div className="flex flex-col items-center justify-center gap-1">
          <Group justify="center" gap={6} wrap="nowrap">
            
            <Badge
              color={esLote ? "yellow" : "gray"}
              variant="filled"
              size="xs"
              fw={700}
              radius="sm"
              className="text-[9px] px-1 py-0"
            >
              {esLote ? "LOTE" : "BLEND"}
            </Badge>
            <Text size="xs" className="text-zinc-200 font-mono font-bold">
              {correlativo}
            </Text>
            {d.codigo_preliminar && (
              <span className="inline-flex items-center justify-center bg-teal-500/10 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold tracking-wide">
                {d.codigo_preliminar}
              </span>
            )}
            
          </Group>
          {d.proveedor_razon_social && (
            <Text size="10px" c="dimmed" className="truncate max-w-44 text-center">
              {d.proveedor_razon_social}
            </Text>
          )}
        </div>
      </td>

      {/* 2. Pesos Tomado y Pendiente (Combinado y bien distribuido) */}
      <td className="py-2.5 px-3 text-center align-middle">
        <div className="flex flex-col items-center justify-center gap-1">
          <Group gap="sm" justify="center" wrap="nowrap">
            <div className="text-center">
              <Text size="9px" c="dimmed" tt="uppercase" fw={600} className="tracking-wider">
                Tomado
              </Text>
              <Text size="xs" fw={700} className="text-zinc-200 font-mono">
                {formatNumber(total, 3)}
              </Text>
            </div>
            <Text c="zinc.7" className="select-none">|</Text>
            <div className="text-center">
              <Text size="9px" c="dimmed" tt="uppercase" fw={600} className="tracking-wider">
                Pendiente
              </Text>
              <Text
                size="xs"
                fw={700}
                className={`font-mono ${
                  pend > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {formatNumber(pend, 3)}
              </Text>
            </div>
          </Group>

          {/* Barra de progreso */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-0.5">
            <div className="w-14 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  pct >= 99.99 ? "bg-emerald-400" : "bg-indigo-400"
                } transition-all`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <Text
              size="10px"
              fw={700}
              className={`font-mono ${
                pct >= 99.99 ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              {pct.toFixed(1)}%
            </Text>
          </div>
        </div>
      </td>

      {/* 3. Ley Fabero */}
      <td className="py-2.5 px-3 text-center align-middle">
        <Stack gap={3} align="center">
          <Group gap={4} justify="center">
            <Badge size="xs" color="yellow" variant="light" radius="sm" px={4} py={0} className="font-bold text-[9px]">
              Au
            </Badge>
            <Text size="xs" fw={600} className="font-mono text-zinc-200">
              {(d.ley_oro_fabero ?? 0).toFixed(3)}
            </Text>
          </Group>
          <Group gap={4} justify="center">
            <Badge size="xs" color="gray" variant="light" radius="sm" px={4} py={0} className="font-bold text-[9px]">
              Ag
            </Badge>
            <Text size="xs" fw={600} className="font-mono text-zinc-400">
              {(d.ley_plata_fabero ?? 0).toFixed(3)}
            </Text>
          </Group>
        </Stack>
      </td>

      {/* 4. Ley Cliente (Promedio Simple) */}
      <td className="py-2.5 px-3 text-center align-middle">
        <Stack gap={3} align="center">
          <Group gap={4} justify="center">
            <Badge size="xs" color="yellow" variant="light" radius="sm" px={4} py={0} className="font-bold text-[9px]">
              Au
            </Badge>
            <Text
              size="xs"
              fw={600}
              className={`font-mono ${
                d.ley_oro_cliente_promedio !== null && d.ley_oro_cliente_promedio !== undefined
                  ? "text-zinc-200"
                  : "text-zinc-500"
              }`}
            >
              {d.ley_oro_cliente_promedio !== null && d.ley_oro_cliente_promedio !== undefined
                ? d.ley_oro_cliente_promedio.toFixed(3)
                : "—"}
            </Text>
          </Group>
          <Group gap={4} justify="center">
            <Badge size="xs" color="gray" variant="light" radius="sm" px={4} py={0} className="font-bold text-[9px]">
              Ag
            </Badge>
            <Text
              size="xs"
              fw={600}
              className={`font-mono ${
                d.ley_plata_cliente_promedio !== null && d.ley_plata_cliente_promedio !== undefined
                  ? "text-zinc-300"
                  : "text-zinc-500"
              }`}
            >
              {d.ley_plata_cliente_promedio !== null && d.ley_plata_cliente_promedio !== undefined
                ? d.ley_plata_cliente_promedio.toFixed(3)
                : "—"}
            </Text>
          </Group>
        </Stack>
      </td>

      {/* 5. Ley Final (Inputs y Checkboxes con Popover) */}
      <td className="py-2.5 px-3 text-center align-middle">
        <Stack gap={4} align="center">
          {/* Fila Oro */}
          <Group gap={6} justify="center" wrap="nowrap">
            <Badge size="xs" color="yellow" variant="filled" radius="sm" px={5} py={1} className="font-bold text-[9px]">
              Au
            </Badge>
            <NumberInput
              size="xs"
              radius="md"
              decimalScale={3}
              fixedDecimalScale
              hideControls
              w={75}
              value={leyOro}
              onChange={(val) => setLeyOro(val)}
              disabled={confirmadaOro || valorizadaOro || loadingOro}
              classNames={{
                input:
                  "bg-zinc-900/60 border-zinc-800 text-center font-mono text-xs text-zinc-100 disabled:bg-zinc-950/40 disabled:text-zinc-400 disabled:border-zinc-800/50",
              }}
            />
            <CheckboxConfirmacionPopover
              elemento="Oro"
              valorizado={valorizadaOro}
              confirmado={confirmadaOro}
              puedeConfirmar={puedeConfirmar}
              loading={loadingOro}
              onToggle={(checked) => handleToggleConfirmacion("Oro", checked)}
            />
          </Group>

          {/* Fila Plata */}
          <Group gap={6} justify="center" wrap="nowrap">
            <Badge size="xs" color="gray" variant="filled" radius="sm" px={5} py={1} className="font-bold text-[9px]">
              Ag
            </Badge>
            <NumberInput
              size="xs"
              radius="md"
              decimalScale={3}
              fixedDecimalScale
              hideControls
              w={75}
              value={leyPlata}
              onChange={(val) => setLeyPlata(val)}
              disabled={confirmadaPlata || valorizadaPlata || loadingPlata}
              classNames={{
                input:
                  "bg-zinc-900/60 border-zinc-800 text-center font-mono text-xs text-zinc-100 disabled:bg-zinc-950/40 disabled:text-zinc-400 disabled:border-zinc-800/50",
              }}
            />
            <CheckboxConfirmacionPopover
              elemento="Plata"
              valorizado={valorizadaPlata}
              confirmado={confirmadaPlata}
              puedeConfirmar={puedeConfirmar}
              loading={loadingPlata}
              onToggle={(checked) => handleToggleConfirmacion("Plata", checked)}
            />
          </Group>
        </Stack>
      </td>
    </tr>
  );
};
