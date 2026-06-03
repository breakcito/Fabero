import { Group, Text, Badge, Stack } from "@mantine/core";
import { BuildingOfficeIcon, HeartIcon } from "@heroicons/react/24/outline";

interface CompanyGroupHeaderProps {
  nombre: string;
  count: number;
}

export const CompanyGroupHeader = ({ nombre, count }: CompanyGroupHeaderProps) => {
  return (
    <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/80 to-transparent">
      <Group justify="space-between" align="center">
        <Group gap="md">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <BuildingOfficeIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <Stack gap={2}>
            <Text fw={800} className="uppercase tracking-[0.2em] text-zinc-500 text-[10px]! leading-none">
              Empresa
            </Text>
            <Text size="md" fw={900} className="text-white tracking-tight">
              {nombre}
            </Text>
          </Stack>
        </Group>

        <Badge
          variant="light"
          color="pink"
          size="md"
          radius="lg"
          leftSection={<HeartIcon className="w-3.5 h-3.5 text-pink-400" />}
          className="bg-pink-500/10 text-pink-300 font-bold border border-pink-500/30 h-8 px-4"
        >
          {count} {count === 1 ? "Empleado" : "Empleados"}
        </Badge>
      </Group>
    </div>
  );
};
