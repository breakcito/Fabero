import {
  Select,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { TabEmpleados } from "./tab-empleados";
import { useEmpleados } from "../hooks/useEmpleados";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { RegistroEmpleado } from "./registro-empleado";
import type { RES_EmpleadoResumen } from "../service/empleados.responses";

export const PersonalPage = () => {
  useTitlePage("Trabajadores / Personal");

  const empleadosCtrl = useEmpleados();

  const [openedRegEmp, { open: openRegEmp, close: closeRegEmp }] =
    useDisclosure(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<
    RES_EmpleadoResumen | null
  >(null);

  const cerrarEdicion = () => setEmpleadoAEditar(null);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex flex-col md:flex-row items-end gap-4 flex-1 w-full">
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
        </div>

        <Button
          leftSection={<PlusIcon className="w-5 h-5" />}
          onClick={openRegEmp}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-[38px] px-8 mb-1px"
        >
          Nuevo Empleado
        </Button>
      </div>

      <TabEmpleados
        controller={empleadosCtrl}
        onEditar={(empleado) => setEmpleadoAEditar(empleado)}
      />

      {/* Modal Registro Empleado */}
      <ModalEstandar
        opened={openedRegEmp}
        close={closeRegEmp}
        title="Registrar Empleado"
        size="md"
        validateClose
      >
        <RegistroEmpleado
          onSuccess={(nuevo) => {
            empleadosCtrl.pushNuevoEmpleado(nuevo);
            closeRegEmp();
          }}
          onCancel={closeRegEmp}
        />
      </ModalEstandar>

      {/* Modal Editar Empleado */}
      <ModalEstandar
        opened={empleadoAEditar !== null}
        close={cerrarEdicion}
        title={
          empleadoAEditar
            ? `Editar Empleado: ${empleadoAEditar.nombre} ${empleadoAEditar.apellido}`
            : "Editar Empleado"
        }
        size="md"
        validateClose
      >
        {empleadoAEditar && (
          <RegistroEmpleado
            empleadoEditar={empleadoAEditar}
            onSuccess={(editado) => {
              empleadosCtrl.actualizarEmpleadoEnLista(editado);
              cerrarEdicion();
            }}
            onCancel={cerrarEdicion}
          />
        )}
      </ModalEstandar>
    </div>
  );
};

export default PersonalPage;
