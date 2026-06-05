import { Badge, Text, Group, Stack, ThemeIcon, ActionIcon, Tooltip, Divider } from "@mantine/core";
import {
  IconCreditCard,
  IconCash,
  IconBuildingBank,
  IconPencil,
  IconPower,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { useState } from "react";
import { Moneda } from "../../../../../shared/enums/_generic/moneda";
import type { CuentaBancariaResponse } from "../../../service/proveedores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  cuenta: CuentaBancariaResponse;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  loadingStatus?: boolean;
}

export const CuentaBancaria = ({ cuenta, onEdit, onToggleStatus, loadingStatus }: Props) => {
  const [copiedNum, setCopiedNum] = useState(false);
  const [copiedCci, setCopiedCci] = useState(false);
  const isSoles = cuenta.moneda === Moneda.Soles;

  const copyToClipboard = (text: string, isCci: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCci) {
      setCopiedCci(true);
      setTimeout(() => setCopiedCci(false), 2000);
    } else {
      setCopiedNum(true);
      setTimeout(() => setCopiedNum(false), 2000);
    }
  };

  return (
    <div className={`p-4 bg-zinc-950/20 border border-zinc-800/80 rounded-2xl transition-all duration-200 hover:bg-zinc-900/30 hover:border-zinc-700/50 ${
      cuenta.estado === EstadoBase.Inactivo ? "opacity-60 border-zinc-900 bg-zinc-950/10" : ""
    }`}>
      {/* Header of the Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/30">
        <Group gap="sm" className="min-w-0 flex-1">
          <ThemeIcon
            variant="light"
            color={isSoles ? "indigo" : "emerald"}
            size="lg"
            radius="xl"
            className="bg-zinc-900/50 shrink-0"
          >
            <IconBuildingBank size={18} stroke={1.5} />
          </ThemeIcon>

          <Stack gap={0} className="min-w-0">
            <Text size="sm" fw={600} className="text-zinc-100 truncate w-full" title={cuenta.banco}>
              {cuenta.banco}
            </Text>
            {cuenta.banco_abv && (
              <Text size="10px" fw={500} className="text-zinc-500 uppercase tracking-wider">
                {cuenta.banco_abv}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Badges and Actions */}
        <Group gap="xs" wrap="nowrap" className="shrink-0 self-end sm:self-center">
          <Badge
            color={isSoles ? "indigo" : "emerald"}
            variant="light"
            size="xs"
            radius="xl"
            leftSection={<IconCash size={10} />}
          >
            {cuenta.moneda}
          </Badge>

          {cuenta.es_para_detraccion && (
            <Badge color="yellow.9" variant="dot" size="xs" radius="xl">
              Detracción
            </Badge>
          )}

          <Badge
            color={cuenta.estado === EstadoBase.Activo ? "green" : "red"}
            variant="light"
            size="xs"
            radius="xl"
          >
            {cuenta.estado}
          </Badge>

          <Divider size="xs" orientation="vertical" className="border-zinc-800 h-4 mx-1" />

          {onEdit && (
            <Tooltip label="Editar Cuenta" withArrow>
              <ActionIcon
                variant="subtle"
                color="blue"
                radius="xl"
                size="md"
                onClick={onEdit}
              >
                <IconPencil size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          {onToggleStatus && (
            <Tooltip label={cuenta.estado === EstadoBase.Activo ? "Inactivar Cuenta" : "Activar Cuenta"} withArrow>
              <ActionIcon
                variant="subtle"
                color={cuenta.estado === EstadoBase.Activo ? "orange" : "green"}
                radius="xl"
                size="md"
                loading={loadingStatus}
                onClick={onToggleStatus}
              >
                <IconPower size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>

      {/* Body of the Card (Information Fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Nro de Cuenta */}
        <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl">
          <div className="min-w-0 flex-1">
            <Text size="9px" fw={700} className="text-zinc-500 uppercase tracking-widest mb-0.5">
              Número de Cuenta
            </Text>
            <Group gap={6} wrap="nowrap">
              <IconCreditCard size={14} className="text-zinc-650 shrink-0" />
              <Text size="xs" fw={500} className="text-zinc-300 font-mono truncate" title={cuenta.numero_cuenta}>
                {cuenta.numero_cuenta}
              </Text>
            </Group>
          </div>
          <Tooltip label={copiedNum ? "Copiado!" : "Copiar Número"} withArrow>
            <ActionIcon
              variant="subtle"
              color={copiedNum ? "green" : "gray"}
              size="sm"
              className="ml-2 shrink-0"
              onClick={() => copyToClipboard(cuenta.numero_cuenta, false)}
            >
              {copiedNum ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        </div>

        {/* CCI */}
        <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl">
          <div className="min-w-0 flex-1">
            <Text size="9px" fw={700} className="text-zinc-500 uppercase tracking-widest mb-0.5">
              Código Interbancario (CCI)
            </Text>
            {cuenta.cci ? (
              <Text size="xs" fw={500} className="text-zinc-300 font-mono truncate pl-1" title={cuenta.cci}>
                {cuenta.cci}
              </Text>
            ) : (
              <Text size="xs" className="text-zinc-600 italic pl-1">
                No registrado
              </Text>
            )}
          </div>
          {cuenta.cci && (
            <Tooltip label={copiedCci ? "Copiado!" : "Copiar CCI"} withArrow>
              <ActionIcon
                variant="subtle"
                color={copiedCci ? "green" : "gray"}
                size="sm"
                className="ml-2 shrink-0"
                onClick={() => copyToClipboard(cuenta.cci || "", true)}
              >
                {copiedCci ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
