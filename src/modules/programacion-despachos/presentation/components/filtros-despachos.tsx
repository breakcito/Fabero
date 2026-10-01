import { Select, Loader } from "@mantine/core";
import { IconBuildingFactory } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { DateRangeFilter } from "../../../../presentation/utils/filtro-rango-fechas";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import type { DespachoFiltros } from "../../service/programacion-despachos.requests";

interface Props {
  filtros: DespachoFiltros;
  setFiltros: (f: DespachoFiltros) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-9",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

interface PlantaItem {
  id: number;
  razon_social: string;
  ruc: string;
}

export const FiltrosDespachos = ({ filtros, setFiltros }: Props) => {
  const { notifyError } = useNotify();
  const [plantas, setPlantas] = useState<PlantaItem[]>([]);
  const [loadingPlantas, setLoadingPlantas] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AuxService.get_plantas_despachable()
      .then((data) => {
        if (!cancelled) setPlantas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar las plantas destino");
      })
      .finally(() => {
        if (!cancelled) setLoadingPlantas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  const plantasData = plantas.map((p) => ({
    value: String(p.id),
    label: p.ruc ? `${p.razon_social} (${p.ruc})` : p.razon_social,
  }));

  return (
    <div className="flex flex-wrap items-end gap-3 flex-1 w-full">
      <div className="w-full sm:w-64">
        <Select
          label="Planta Destino"
          placeholder={loadingPlantas ? "Cargando plantas..." : "Todas las plantas"}
          data={plantasData}
          value={filtros.id_planta_destino ? String(filtros.id_planta_destino) : null}
          onChange={(val) =>
            setFiltros({ ...filtros, id_planta_destino: val ? Number(val) : undefined })
          }
          leftSection={<IconBuildingFactory className="w-4 h-4 text-zinc-500" />}
          clearable
          searchable
          radius="lg"
          size="sm"
          disabled={loadingPlantas}
          rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
        />
      </div>

      <div className="w-full sm:w-auto">
        <DateRangeFilter
          fechaInicio={filtros.fecha_inicio ?? null}
          fechaFin={filtros.fecha_fin ?? null}
          onFechaInicioChange={(v) => setFiltros({ ...filtros, fecha_inicio: v })}
          onFechaFinChange={(v) => setFiltros({ ...filtros, fecha_fin: v })}
        />
      </div>
    </div>
  );
};