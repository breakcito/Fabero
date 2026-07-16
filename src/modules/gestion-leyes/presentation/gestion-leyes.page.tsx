import { useState } from "react";
import { TextInput, Button, Group, SimpleGrid, Loader, Text, Center } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useGestionLeyes } from "../hooks/useGestionLeyes";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { GrupoCard } from "./components/grupo-card";
import { RegistroGrupo } from "./components/registro-grupo";
import type { GrupoAnalisisResponse } from "../service/gestion-leyes.responses";

export const GestionLeyesPage = () => {
  useTitlePage("Configuración Gestión Leyes");

  const leyesCtrl = useGestionLeyes();

  // Modals disclosure states
  const [openedGrupo, { open: openGrupoModal, close: closeGrupoModal }] = useDisclosure(false);

  // Edit group state
  const [grupoEditar, setGrupoEditar] = useState<GrupoAnalisisResponse | null>(null);

  const handleNuevoGrupo = () => {
    setGrupoEditar(null);
    openGrupoModal();
  };

  const handleEditarGrupo = (grupo: GrupoAnalisisResponse) => {
    setGrupoEditar(grupo);
    openGrupoModal();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="flex items-end gap-4 flex-1 w-full">
          <TextInput
            label="Buscar Grupo de Análisis"
            placeholder="Buscar por nombre..."
            leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />}
            value={leyesCtrl.busqueda}
            onChange={(e) => leyesCtrl.setBusqueda(e.currentTarget.value)}
            radius="lg"
            size="sm"
            className="w-full md:max-w-md"
            classNames={{
              label: "text-zinc-400 mb-1.5 font-medium text-sm",
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px] rounded-xl",
            }}
          />
        </div>

        <Group gap="sm" className="shrink-0 w-full md:w-auto">
          <Button
            leftSection={<PlusIcon className="w-5 h-5" />}
            onClick={handleNuevoGrupo}
            radius="lg"
            size="sm"
            className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-[38px] px-6"
          >
            Nuevo Grupo
          </Button>
        </Group>
      </div>

      {/* Main Grid */}
      {leyesCtrl.loading ? (
        <Center className="py-20">
          <Loader color="indigo" size="md" />
        </Center>
      ) : leyesCtrl.grupos.length === 0 ? (
        <Center className="py-20 flex flex-col gap-2">
          <Text size="sm" fw={600} className="text-zinc-500">
            No se encontraron grupos de análisis.
          </Text>
          <Text size="xs" className="text-zinc-600">
            Crea un nuevo grupo o ajusta la búsqueda.
          </Text>
        </Center>
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="lg"
          className="pb-10"
        >
          {leyesCtrl.grupos.map((g) => (
            <GrupoCard
              key={g.id}
              grupo={g}
              toggling={!!leyesCtrl.togglingIds[g.id]}
              onEdit={() => handleEditarGrupo(g)}
              onToggleEstado={() => leyesCtrl.toggleEstadoGrupo(g.id, g.estado)}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Modal Crear/Editar Grupo */}
      <ModalEstandar
        opened={openedGrupo}
        close={closeGrupoModal}
        title={grupoEditar ? "Editar Grupo de Análisis" : "Crear Grupo de Análisis"}
        size="xl"
      >
        <RegistroGrupo
          key={grupoEditar?.id ?? "new"}
          grupo={grupoEditar}
          analitosDisponibles={leyesCtrl.analitos}
          todosLosGrupos={leyesCtrl.todosLosGrupos}
          onSuccess={leyesCtrl.guardarGrupo}
          onCancel={closeGrupoModal}
          onAnalitoCreado={leyesCtrl.agregarAnalitoEnLista}
          onAnalitoEditado={leyesCtrl.editarAnalito}
        />
      </ModalEstandar>
    </div>
  );
};

export default GestionLeyesPage;
