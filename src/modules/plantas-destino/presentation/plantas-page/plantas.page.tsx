import { Stack } from "@mantine/core";
import { useTitlePage } from "../../../../hooks/useTitlePage";
import { usePlantasDestino } from "../../hooks/usePlantasDestino";
import { RegistroPlanta } from "../registro-planta/registro-planta";
import { CuentasBancariasGenerico } from "../../../../presentation/utils/cuentas-bancarias";
import { ModalProveedores } from "./components/ModalProveedores";
import { useState } from "react";
import type {
  CuentaBancariaPlantaResponse,
  PlantaDestinoResponse,
} from "../../service/plantas-destino.responses";
import { Filtros } from "./components/filtros";
import { Planta } from "./components/planta";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { plantaCuentasAdapter } from "../../service/cuentas-bancarias.adapter";

export const PlantasDestinoPage = () => {
  useTitlePage("Plantas Destino");
  
  const {
    plantas,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    insertPlanta,
    updatePlanta,
    toggleEstado,
    actualizarCantidadCuentasPlanta,
    actualizarCantidadProveedoresPlanta,
  } = usePlantasDestino();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [plantaAEditar, setPlantaAEditar] = useState<PlantaDestinoResponse | null>(null);
  const [selectedPlantaCuentas, setSelectedPlantaCuentas] = useState<PlantaDestinoResponse | null>(null);
  const [selectedPlantaProveedores, setSelectedPlantaProveedores] = useState<PlantaDestinoResponse | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros
          onOpenRegistro={() => setOpenRegistro(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Planta
          plantas={plantas}
          loading={loading}
          togglingIds={togglingIds}
          onOpenCuentas={(p) => setSelectedPlantaCuentas(p)}
          onOpenProveedores={(p) => setSelectedPlantaProveedores(p)}
          onEdit={(p) => setPlantaAEditar(p)}
          onToggleEstado={toggleEstado}
        />
      </Stack>

      {/* Modal: Registro de Planta */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nueva Planta Destino"
        size="lg"
      >
        <RegistroPlanta
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(p) => {
            insertPlanta(p);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Planta */}
      <ModalEstandar
        opened={!!plantaAEditar}
        close={() => setPlantaAEditar(null)}
        title={plantaAEditar ? `Editar Planta Destino: ${plantaAEditar.razon_social}` : ""}
        size="lg"
      >
        {plantaAEditar && (
          <RegistroPlanta
            planta={plantaAEditar}
            onCancel={() => setPlantaAEditar(null)}
            onSuccess={(p) => {
              updatePlanta(p);
              setPlantaAEditar(null);
            }}
          />
        )}
      </ModalEstandar>

      {/* Modal: Gestión de Cuentas Bancarias */}
      <ModalEstandar
        opened={!!selectedPlantaCuentas}
        close={() => setSelectedPlantaCuentas(null)}
        title={selectedPlantaCuentas ? `Cuentas Bancarias: ${selectedPlantaCuentas.razon_social}` : ""}
        size="xl"
      >
        {selectedPlantaCuentas && (
          <CuentasBancariasGenerico<
            CuentaBancariaPlantaResponse,
            PlantaDestinoResponse
          >
            entity={selectedPlantaCuentas}
            adapter={plantaCuentasAdapter}
            onCuentasCountChange={(count) => {
              actualizarCantidadCuentasPlanta(selectedPlantaCuentas.id, count);
            }}
          />
        )}
      </ModalEstandar>

      {/* Modal: Gestión de Proveedores Asociados */}
      <ModalEstandar
        opened={!!selectedPlantaProveedores}
        close={() => setSelectedPlantaProveedores(null)}
        title={selectedPlantaProveedores ? `Proveedores Asociados: ${selectedPlantaProveedores.razon_social}` : ""}
        size="xl"
      >
        {selectedPlantaProveedores && (
          <ModalProveedores
            planta={selectedPlantaProveedores}
            onProveedoresCountChange={(count) => {
              actualizarCantidadProveedoresPlanta(selectedPlantaProveedores.id, count);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
