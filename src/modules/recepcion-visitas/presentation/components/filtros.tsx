import dayjs from "dayjs";
import type { RecepcionVisitaFilters } from "../../service/recepcion-visitas.requests";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";

interface Props {
  filters: RecepcionVisitaFilters;
  handleFilterChange: <K extends keyof RecepcionVisitaFilters>(
    key: K,
    value: RecepcionVisitaFilters[K],
  ) => void;
}

/**
 * Panel de filtros del listado de visitas.
 *
 * El botón que lo abre vive en la barra de acciones de la vista principal
 * (junto a "Quitar filtros", "Recargar" y "Nuevo Registro").
 */
export const Filtros = ({
  filters,
  handleFilterChange,
}: Props) => {
  const clasesFecha = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
    label: "text-zinc-300 mb-1.5 font-semibold text-sm",
  };

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <CustomDatePicker
        label="Fecha inicio"
        placeholder="DD/MM/AAAA"
        value={filters.fecha_inicio ?? null}
        onChange={(val) =>
          handleFilterChange(
            "fecha_inicio",
            val ? dayjs(val).format("YYYY-MM-DD") : undefined,
          )
        }
        radius="lg"
        size="md"
        classNames={clasesFecha}
      />

      <CustomDatePicker
        label="Fecha fin"
        placeholder="DD/MM/AAAA"
        value={filters.fecha_fin ?? null}
        onChange={(val) =>
          handleFilterChange(
            "fecha_fin",
            val ? dayjs(val).format("YYYY-MM-DD") : undefined,
          )
        }
        radius="lg"
        size="md"
        classNames={clasesFecha}
      />
    </div>
  );
};
