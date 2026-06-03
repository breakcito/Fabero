import { Badge, Text, Group, Stack, ThemeIcon, Grid } from "@mantine/core";
import {
  IconCreditCard,
  IconCash,
  IconBuildingBank,
} from "@tabler/icons-react";
import { MONEDAS } from "../../../../../shared/variables/monedas";
import type { CuentaBancariaResponse } from "../../../service/proveedores.responses";

interface Props {
  cuenta: CuentaBancariaResponse;
}

export const CuentaBancaria = ({ cuenta }: Props) => {
  const isSoles = cuenta.moneda === MONEDAS.PEN.label;

  return (
    <div className="group p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-all duration-200">
      <Grid align="center" gutter="lg">
        {/* Info Banco */}
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Group gap="md">
            <ThemeIcon
              variant="light"
              color={isSoles ? "blue" : "emerald"}
              size="lg"
              radius="xl"
              className="bg-zinc-950/50"
            >
              <IconBuildingBank size={20} stroke={1.5} />
            </ThemeIcon>

            <Stack gap={0}>
              <Text size="sm" fw={600} className="text-zinc-200 truncate">
                {cuenta.banco}{" "}
                {cuenta.banco_abv && (
                  <span className="text-zinc-500 font-medium text-[10px] ml-1">
                    ({cuenta.banco_abv})
                  </span>
                )}
              </Text>
              <Group gap={6}>
                <IconCreditCard size={14} className="text-zinc-500" />
                <Text
                  size="xs"
                  className="text-zinc-400 font-mono tracking-tight"
                >
                  {cuenta.numero_cuenta}
                </Text>
              </Group>
            </Stack>
          </Group>
        </Grid.Col>

        {/* Moneda */}
        <Grid.Col span={{ base: 6, sm: 2 }}>
          <Stack gap={2} align="center">
            <Text
              size="10px"
              fw={700}
              className="text-zinc-600 uppercase tracking-widest"
            >
              MONEDA
            </Text>
            <Badge
              color={isSoles ? "blue" : "emerald"}
              variant="light"
              size="sm"
              radius="xl"
              leftSection={<IconCash size={12} />}
            >
              {cuenta.moneda}
            </Badge>
          </Stack>
        </Grid.Col>

        {/* CCI */}
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Stack gap={2} align="center">
            <Text
              size="10px"
              fw={700}
              className="text-zinc-600 uppercase tracking-widest"
            >
              CCI
            </Text>
            {cuenta.cci ? (
              <Text size="xs" fw={500} className="text-zinc-300 font-mono">
                {cuenta.cci}
              </Text>
            ) : (
              <Text size="xs" className="text-zinc-700 italic">
                No registrado
              </Text>
            )}
          </Stack>
        </Grid.Col>

        {/* Tipo (Detracción) */}
        <Grid.Col span={{ base: 12, sm: 2 }}>
          <Stack gap={2} align="end">
            <Text
              size="10px"
              fw={700}
              className="text-zinc-600 uppercase tracking-widest"
            >
              TIPO
            </Text>
            {cuenta.es_para_detraccion ? (
              <Badge color="yellow.9" variant="dot" size="sm" radius="xl">
                Detracción
              </Badge>
            ) : (
              <Badge
                color="zinc.7"
                variant="outline"
                size="sm"
                radius="xl"
                className="border-zinc-800 text-zinc-600 bg-transparent"
              >
                Estándar
              </Badge>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
};
