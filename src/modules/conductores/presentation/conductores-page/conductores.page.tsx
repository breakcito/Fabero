import { Stack } from "@mantine/core";
import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useConductores } from "../../hooks/useConductores";
import { RegistroConductor } from "../registro-conductor/registro-conductor";
import { useState } from "react";
import type { RES_Conductor } from "../../service/conductores.responses";
import { Filtros } from "./components/filtros";
import { Conductor } from "./components/conductor";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export const ConductoresPage = () => {
  useTitlePage("Conductores");

  const {
    conductores,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    insertConductor,
    updateConductor,
    toggleEstado,
  } = useConductores();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [conductorAEditar, setConductorAEditar] =
    useState<RES_Conductor | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros
          onOpenRegistro={() => setOpenRegistro(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Conductor
          conductores={conductores}
          loading={loading}
          togglingIds={togglingIds}
          onEdit={(c) => setConductorAEditar(c)}
          onToggleEstado={toggleEstado}
        />
      </Stack>

      {/* Modal: Registro de Conductor */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Conductor"
        size="lg"
      >
        <RegistroConductor
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(c) => {
            insertConductor(c);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Conductor */}
      <ModalEstandar
        opened={!!conductorAEditar}
        close={() => setConductorAEditar(null)}
        title={
          conductorAEditar
            ? `Editar Conductor: ${conductorAEditar.nombre} ${conductorAEditar.apellido}`
            : ""
        }
        size="lg"
      >
        {conductorAEditar && (
          <RegistroConductor
            conductor={conductorAEditar}
            onCancel={() => setConductorAEditar(null)}
            onSuccess={(c) => {
              updateConductor(c);
              setConductorAEditar(null);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
