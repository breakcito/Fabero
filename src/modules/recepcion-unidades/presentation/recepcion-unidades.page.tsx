import { Stack, Button } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepciones } from "../hooks/useRecepciones";
import { Filtros } from "./components/filtros";
import { TablaRecepciones } from "./components/tabla-recepciones";
import { RegistroRecepcion } from "./components/registro-recepcion";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";

export const RecepcionUnidadesPage = () => {
  useTitlePage("Recepción de Unidades");

  const {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    handleSearch,
    empresas,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
    clearTextFilterAndSearch,
  } = useRecepciones();

  const [openRegistro, setOpenRegistro] = useState(false);

  const hasActiveFilters = 
    !!filters.fecha_inicio || 
    !!filters.fecha_fin || 
    !!filters.numero_placa || 
    !!filters.serie_placa ||
    filters.id_empresa_transporte !== undefined || 
    !!filters.tipo_ingreso;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full">
          <Filtros
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleSearch={handleSearch}
            empresas={empresas}
            onClearTextFilter={clearTextFilterAndSearch}
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0 pb-[2px]">
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              radius="lg"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={clearFilters}
              className="text-red-400 hover:bg-red-500/10 transition-colors h-[38px]"
            >
              Limpiar
            </Button>
          )}
          
          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={() => setOpenRegistro(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-[38px] px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Recepción
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaRecepciones
          recepciones={recepciones}
          loading={loading}
          onUpdateRecepcion={updateRecepcion}
        />
      </Stack>

      {/* Modal: Registrar Ingreso / Recepción */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Registrar Ingreso de Unidad"
        size="lg"
      >
        <RegistroRecepcion
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(r) => {
            insertRecepcion(r);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>
    </div>
  );
};
