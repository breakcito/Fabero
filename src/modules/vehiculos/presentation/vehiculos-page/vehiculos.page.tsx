import { Stack } from "@mantine/core";
import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useVehiculos } from "../../hooks/useVehiculos";
import { RegistroVehiculo } from "../registro-vehiculo/registro-vehiculo";
import { useState } from "react";
import type { VehiculoResponse } from "../../service/vehiculos.responses";
import { Filtros } from "./components/filtros";
import { Vehiculo } from "./components/vehiculo";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export const VehiculosPage = () => {
  useTitlePage("Vehículos");

  const {
    vehiculos,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    insertVehiculo,
    updateVehiculo,
    toggleEstado,
  } = useVehiculos();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [vehiculoAEditar, setVehiculoAEditar] = useState<VehiculoResponse | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros
          onOpenRegistro={() => setOpenRegistro(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Vehiculo
          vehiculos={vehiculos}
          loading={loading}
          togglingIds={togglingIds}
          onEdit={(v) => setVehiculoAEditar(v)}
          onToggleEstado={toggleEstado}
        />
      </Stack>

      {/* Modal: Registro de Vehículo */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Vehículo"
        size="lg"
      >
        <RegistroVehiculo
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(v) => {
            insertVehiculo(v);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Vehículo */}
      <ModalEstandar
        opened={!!vehiculoAEditar}
        close={() => setVehiculoAEditar(null)}
        title={vehiculoAEditar ? `Editar Vehículo: ${vehiculoAEditar.numero_placa}` : ""}
        size="lg"
      >
        {vehiculoAEditar && (
          <RegistroVehiculo
            vehiculo={vehiculoAEditar}
            onCancel={() => setVehiculoAEditar(null)}
            onSuccess={(v) => {
              updateVehiculo(v);
              setVehiculoAEditar(null);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
