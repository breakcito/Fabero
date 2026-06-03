import { type DataTableColumn } from "mantine-datatable";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import type { RES_EmpleadoResumen } from "../../service/empleados.responses";
import { CompanyGroupHeader } from "./company-group-header";

interface CompanyGroupCardProps {
  nombre: string;
  empleados: RES_EmpleadoResumen[];
  columns: DataTableColumn<RES_EmpleadoResumen>[];
  loading: boolean;
}

export const CompanyGroupCard = ({
  nombre,
  empleados,
  columns,
  loading,
}: CompanyGroupCardProps) => {
  // Ocultamos la columna de empresa dentro del card ya que el header ya lo indica
  const filteredColumns = columns.filter((col) => col.accessor !== "empresa");

  return (
    <div className="bg-zinc-900/65 border border-zinc-800 rounded-[24px] shadow-2xl overflow-hidden flex flex-col backdrop-blur-md transition-all duration-300 hover:border-zinc-700/50">
      <CompanyGroupHeader nombre={nombre} count={empleados.length} />

      <div className="relative shadow-inner">
        <DataTableEstandar
          idAccessor="id_empleado"
          columns={filteredColumns}
          records={empleados}
          loading={loading}
          initialPageSize={10}
          minHeight={0}
        />
      </div>
    </div>
  );
};
