import { useState } from "react";
import { Stack, Button } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepcionVisitas } from "../hooks/useRecepcionVisitas";
import { Filtros } from "./components/filtros";
import { TablaVisitas } from "./components/tabla-visitas";
import { RegistroVisita } from "./components/registro-visita";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { IconPlus, IconX } from "@tabler/icons-react";

export const RecepcionVisitasPage = () => {
  useTitlePage("Recepción de Visitas");

  const {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
  } = useRecepcionVisitas();

  const [openRegistro, setOpenRegistro] = useState(false);

  const hasActiveFilters = !!filters.fecha_inicio || !!filters.fecha_fin;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full">
          <Filtros
            filters={filters}
            handleFilterChange={handleFilterChange}
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
            className="bg-[#7A604D] hover:bg-[#8c6d53] text-white shadow-lg shadow-zinc-900/40 shrink-0 h-[38px] px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaVisitas
          recepciones={recepciones}
          loading={loading}
          onUpdateRecepcion={updateRecepcion}
        />
      </Stack>

      {/* Modal: Registrar Ingreso / Recepción de Visitas */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Registro de Visita"
        size="lg"
      >
        <RegistroVisita
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
