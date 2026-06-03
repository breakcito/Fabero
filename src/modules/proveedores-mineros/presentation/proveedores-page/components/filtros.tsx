import { Button, TextInput } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";

interface Props {
  onOpenRegistro: () => void;
}

export const Filtros = ({ onOpenRegistro }: Props) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
      <TextInput
        label="Buscar Proveedor"
        placeholder="Buscar por razón social, RUC o DNI..."
        leftSection={<IconSearch size={16} className="text-zinc-400" />}
        radius="lg"
        size="sm"
        className="flex-1 min-w-64"
        classNames={{
          label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
          input:
            "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
        }}
      />
      <Button
        leftSection={<IconPlus size={18} />}
        radius="lg"
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 px-6 font-semibold"
        onClick={onOpenRegistro}
      >
        Nuevo Proveedor
      </Button>
    </div>
  );
};
