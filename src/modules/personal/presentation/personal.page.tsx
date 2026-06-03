import { useState } from "react";
import {
  Tabs,
  rem,
  Select,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import {
  UserGroupIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { TabEmpleados } from "./tab-empleados";
import { TabContratistas } from "./tab-contratistas";
import { useEmpleados } from "../hooks/useEmpleados";
import { useContratistas } from "../hooks/useContratistas";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { useDisclosure } from "@mantine/hooks";
import { RegistroEmpleado } from "./registro-empleado";
import { RegistroContratista } from "./registro-contratista";
import { AsignacionLaboresContratista } from "./asignacion-labores-contratista";
import { useAsignacionLaboresContratista } from "../hooks/useAsignacionLaboresContratista";

export const PersonalPage = () => {
  useTitlePage("Trabajadores / Personal");
  const [activeTab, setActiveTab] = useState<string | null>("empleados");

  const empleadosCtrl = useEmpleados();
  const contratistasCtrl = useContratistas();
  const asignacionCtrl = useAsignacionLaboresContratista(
    contratistasCtrl.actualizarContratistaEnLista,
  );

  const [openedRegEmp, { open: openRegEmp, close: closeRegEmp }] =
    useDisclosure(false);
  const [openedRegCon, { open: openRegCon, close: closeRegCon }] =
    useDisclosure(false);

  const iconStyle = { width: rem(18), height: rem(18) };

  return (
    <div className="animate-fade-in space-y-6">
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="pills"
        color="pink"
        classNames={{
          root: "space-y-6",
          list: "bg-zinc-950/80 p-0 rounded-[20px] border border-zinc-800 w-fit shrink-0 overflow-hidden gap-0",
          tab: "rounded-none px-8 py-3 transition-all duration-300 data-[active]:bg-pink-600! data-[active]:text-white text-zinc-400 hover:text-zinc-200 font-bold",
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
          <div className="flex flex-col md:flex-row items-end gap-4 flex-1 w-full">
            <Tabs.List>
              <Tabs.Tab
                value="empleados"
                leftSection={<UserGroupIcon style={iconStyle} />}
              >
                Empleados
              </Tabs.Tab>
              <Tabs.Tab
                value="contratistas"
                leftSection={<WrenchScrewdriverIcon style={iconStyle} />}
              >
                Contratistas
              </Tabs.Tab>
            </Tabs.List>

            {activeTab === "empleados" ? (
              <Group grow className="flex-1 w-full" align="flex-end">
                <Select
                  label="Empresa"
                  placeholder="Todas las empresas"
                  data={empleadosCtrl.empresas.map((e: { id_empresa: number; nombre: string }) => ({
                    value: e.id_empresa.toString(),
                    label: e.nombre,
                  }))}
                  value={empleadosCtrl.idEmpresa?.toString() || null}
                  onChange={(val: string | null) =>
                    empleadosCtrl.setIdEmpresa(val ? Number(val) : null)
                  }
                  leftSection={
                    <BuildingOfficeIcon className="w-4 h-4 text-zinc-400" />
                  }
                  radius="lg"
                  size="sm"
                  classNames={{
                    label: "text-zinc-400 mb-1 font-medium",
                    input:
                      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
                  }}
                  searchable
                  clearable
                />
                <TextInput
                  label="Buscar registro"
                  placeholder="Buscar por nombre, DNI o cargo..."
                  leftSection={
                    <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />
                  }
                  value={empleadosCtrl.busqueda}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    empleadosCtrl.setBusqueda(e.currentTarget.value)
                  }
                  radius="lg"
                  size="sm"
                  className="flex-1"
                  classNames={{
                    label: "text-zinc-400 mb-1 font-medium",
                    input:
                      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
                  }}
                />
              </Group>
            ) : (
              <Group grow className="flex-1 w-full" align="flex-end">
                <Select
                  label="Filtrar por Mina"
                  placeholder="Todas las minas"
                  data={contratistasCtrl.minas.map((m: { id_mina: number; nombre: string }) => ({
                    value: m.id_mina.toString(),
                    label: m.nombre,
                  }))}
                  value={contratistasCtrl.idMina?.toString() || null}
                  onChange={(val: string | null) =>
                    contratistasCtrl.setIdMina(val ? Number(val) : null)
                  }
                  leftSection={<MapPinIcon className="w-4 h-4 text-zinc-400" />}
                  radius="lg"
                  size="sm"
                  classNames={{
                    label: "text-zinc-400 mb-1 font-medium",
                    input:
                      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
                  }}
                  searchable
                  clearable
                />
                <TextInput
                  label="Buscar contratista"
                  placeholder="Buscar por nombre o DNI..."
                  leftSection={
                    <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />
                  }
                  value={contratistasCtrl.busqueda}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    contratistasCtrl.setBusqueda(e.currentTarget.value)
                  }
                  radius="lg"
                  size="sm"
                  className="flex-1"
                  classNames={{
                    label: "text-zinc-400 mb-1 font-medium",
                    input:
                      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
                  }}
                />
              </Group>
            )}
          </div>

          <Button
            leftSection={<PlusIcon className="w-5 h-5" />}
            onClick={activeTab === "empleados" ? openRegEmp : openRegCon}
            radius="lg"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-[38px] px-8 mb-[1px]"
          >
            Nuevo {activeTab === "empleados" ? "Empleado" : "Contratista"}
          </Button>
        </div>

        <Tabs.Panel value="empleados">
          <TabEmpleados controller={empleadosCtrl} />
        </Tabs.Panel>

        <Tabs.Panel value="contratistas">
          <TabContratistas
            controller={contratistasCtrl}
            asignacion={asignacionCtrl}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Modales Compartidos */}
      <ModalEstandar
        opened={openedRegEmp}
        close={closeRegEmp}
        title="Registrar Empleado"
        size="md"
      >
        <RegistroEmpleado
          onSuccess={(nuevo) => {
            empleadosCtrl.pushNuevoEmpleado(nuevo);
            closeRegEmp();
          }}
          onCancel={closeRegEmp}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={openedRegCon}
        close={closeRegCon}
        title="Registrar Contratista"
        size="md"
      >
        <RegistroContratista
          onSuccess={(nuevo) => {
            contratistasCtrl.pushNuevoContratista(nuevo);
            closeRegCon();
          }}
          onCancel={closeRegCon}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={asignacionCtrl.opened}
        close={asignacionCtrl.cerrar}
        title="Asignación de Mina y Labores"
        size="sm"
      >
        {asignacionCtrl.contratista && (
          <AsignacionLaboresContratista
            contratista={asignacionCtrl.contratista}
            minas={asignacionCtrl.minas}
            idMina={asignacionCtrl.idMina}
            onMinaChange={asignacionCtrl.onMinaChange}
            laboresDisponibles={asignacionCtrl.laboresDisponibles}
            seleccionados={asignacionCtrl.seleccionados}
            loading={asignacionCtrl.loading}
            loadingMinas={asignacionCtrl.loadingMinas}
            loadingLabores={asignacionCtrl.loadingLabores}
            onToggle={asignacionCtrl.toggleSeleccion}
            onAsignar={asignacionCtrl.handleAsignar}
            onCancelar={asignacionCtrl.cerrar}
          />
        )}
      </ModalEstandar>
    </div>
  );
};

export default PersonalPage;
