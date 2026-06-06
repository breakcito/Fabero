import { IconPlus, IconSearch } from "@tabler/icons-react";
import { Button, Group, TextInput } from "@mantine/core";

interface Props {
  onOpenRegistro: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Filtros = ({
  onOpenRegistro,
  searchQuery,
  setSearchQuery,
}: Props) => {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" className="w-full">
      <TextInput
        placeholder="Buscar por Razón Social, RUC o DNI..."
        radius="xl"
        leftSection={<IconSearch size={18} className="text-zinc-500" />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-[350px] max-w-full"
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
        }}
      />
      <Button
        radius="xl"
        leftSection={<IconPlus size={18} />}
        onClick={onOpenRegistro}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
      >
        Nueva Empresa
      </Button>
    </Group>
  );
};
