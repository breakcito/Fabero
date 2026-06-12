import { IconCalendar } from "@tabler/icons-react";
import { Grid, TextInput } from "@mantine/core";
import type { RecepcionVisitaFilters } from "../../service/recepcion-visitas.requests";

interface Props {
  filters: RecepcionVisitaFilters;
  handleFilterChange: <K extends keyof RecepcionVisitaFilters>(key: K, value: RecepcionVisitaFilters[K]) => void;
}

export const Filtros = ({
  filters,
  handleFilterChange,
}: Props) => {
  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
    section: "text-zinc-500 transition-colors",
  };

  return (
    <div className="animate-fadeIn w-full">
      <Grid gutter="md">
        {/* Fecha Inicio */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <TextInput
            type="date"
            label="Fecha Inicio"
            radius="lg"
            leftSection={<IconCalendar size={16} className={filters.fecha_inicio ? "text-indigo-400" : "text-zinc-500"} />}
            value={filters.fecha_inicio || ""}
            onChange={(e) => handleFilterChange("fecha_inicio", e.target.value)}
            classNames={fieldClasses}
            style={{ colorScheme: "dark" }}
          />
        </Grid.Col>

        {/* Fecha Fin */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <TextInput
            type="date"
            label="Fecha Fin"
            radius="lg"
            leftSection={<IconCalendar size={16} className={filters.fecha_fin ? "text-indigo-400" : "text-zinc-500"} />}
            value={filters.fecha_fin || ""}
            onChange={(e) => handleFilterChange("fecha_fin", e.target.value)}
            classNames={fieldClasses}
            style={{ colorScheme: "dark" }}
          />
        </Grid.Col>
      </Grid>
    </div>
  );
};
