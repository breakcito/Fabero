import dayjs from "dayjs";
import type { RecepcionFilters } from "../../service/recepcion-unidades.requests";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import { defaultFechaInicio, defaultFechaFin } from "../../../../presentation/utils/filtro-rango-fechas";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import {
  CampoSeleccion,
  CampoTexto,
} from "../../../../presentation/utils/ui-tsx";

interface Props {
  filters: RecepcionFilters;
  handleFilterChange: <K extends keyof RecepcionFilters>(
    key: K,
    value: RecepcionFilters[K],
  ) => void;
  empresas: RES_EmpresaTransporte[];
  onClearTextFilter: (key: "placa") => void;
}

/**
 * Panel de filtros del listado de recepciones.
 *
 * El botón que lo abre vive en la barra de acciones de la vista principal
 * (junto a "Quitar filtros", "Recargar" y "Nueva Recepción").
 */
export const Filtros = ({
  filters,
  handleFilterChange,
  empresas,
  onClearTextFilter,
}: Props) => {
  const opcionesTransportista = empresas.map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.razon_social,
  }));

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <CustomDatePicker
        label="Fecha inicio"
        placeholder="DD/MM/AAAA"
        value={filters.fecha_inicio ?? defaultFechaInicio()}
        onChange={(val) =>
          handleFilterChange(
            "fecha_inicio",
            val ? dayjs(val).format("YYYY-MM-DD") : undefined,
          )
        }
        radius="lg"
        size="md"
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
          label: "text-zinc-300 mb-1.5 font-semibold text-sm",
        }}
      />

      <CustomDatePicker
        label="Fecha fin"
        placeholder="DD/MM/AAAA"
        value={filters.fecha_fin ?? defaultFechaFin()}
        onChange={(val) =>
          handleFilterChange(
            "fecha_fin",
            val ? dayjs(val).format("YYYY-MM-DD") : undefined,
          )
        }
        radius="lg"
        size="md"
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
          label: "text-zinc-300 mb-1.5 font-semibold text-sm",
        }}
      />

      <CampoTexto
        label="Placa"
        placeholder="ABC-123"
        maxLength={8}
        value={filters.placa || ""}
        onChange={(e) => {
          const raw = e.currentTarget.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");
          const formatted =
            raw.length <= 3 ? raw : `${raw.slice(0, 3)}-${raw.slice(3, 7)}`;
          handleFilterChange("placa", formatted);
          if (formatted === "") onClearTextFilter("placa");
        }}
      />

      <CampoSeleccion
        label="Transportista"
        placeholder="Todos"
        opciones={opcionesTransportista}
        valor={
          filters.id_empresa_transporte
            ? String(filters.id_empresa_transporte)
            : null
        }
        onChange={(val) =>
          handleFilterChange(
            "id_empresa_transporte",
            val ? Number(val) : undefined,
          )
        }
        buscable
      />
    </div>
  );
};
