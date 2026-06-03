import {
  Group,
  Text,
  Badge,
  Avatar,
  FileButton,
  Stack,
  Loader,
} from "@mantine/core";
import {
  PencilSquareIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { type DataTableColumn } from "mantine-datatable";

import { useEmpleados } from "../hooks/useEmpleados";
import type { RES_EmpleadoResumen } from "../service/empleados.responses";
import { useNotify } from "../../../hooks/useNotify";

import { CompanyGroupCard } from "./empleados-components/company-group-card";

interface TabEmpleadosProps {
  controller: ReturnType<typeof useEmpleados>;
}

export const TabEmpleados = ({ controller }: TabEmpleadosProps) => {
  const { notifySuccess, notifyError } = useNotify();

  const { loading, groupedByCompany, actualizarFoto, idActualizandoFoto } =
    controller;

  const handleUpdateFoto = async (id: number, file: File | null) => {
    if (!file) return;
    const ok = await actualizarFoto(id, file);
    if (ok) {
      notifySuccess("Foto de perfil actualizada correctamente");
    } else {
      notifyError("No se pudo actualizar la foto de perfil");
    }
  };

  const columns: DataTableColumn<RES_EmpleadoResumen>[] = [
    {
      accessor: "index",
      title: "#",
      textAlign: "center",
      width: 50,
      render: (_, index) => index + 1,
    },
    {
      accessor: "empleado",
      title: "Empleado",
      width: 250,
      render: (r) => {
        const isUpdatingFoto = r.id_empleado === idActualizandoFoto;
        return (
          <Group gap="sm">
            <div className="relative group overflow-hidden rounded-full w-10 h-10 border border-zinc-800">
              {isUpdatingFoto && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full z-10">
                  <Loader size="xs" color="indigo" />
                </div>
              )}
              <FileButton
                onChange={(file) => handleUpdateFoto(r.id_empleado, file)}
                accept="image/png,image/jpeg,image/jpg"
                disabled={isUpdatingFoto}
              >
                {(props) => (
                  <div
                    {...props}
                    className={`w-full h-full cursor-pointer ${isUpdatingFoto ? "pointer-events-none" : ""}`}
                  >
                    <Avatar
                      src={r.path_foto}
                      radius="xl"
                      color="indigo"
                      variant="light"
                      className="w-full h-full"
                    >
                      {r.nombre[0]}
                      {r.apellido[0]}
                    </Avatar>
                    {!isUpdatingFoto && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PencilSquareIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </FileButton>
            </div>
            <div>
              <Text size="sm" fw={500} className="text-zinc-200">
                {r.nombre} {r.apellido}
              </Text>
              <Text size="11px" className="text-zinc-500 font-mono">
                DNI: {r.dni || "---"}
              </Text>
            </div>
          </Group>
        );
      },
    },
    {
      accessor: "ubicacion",
      title: "Área / Cargo",
      width: 200,
      render: (r) => (
        <Stack gap={4}>
          <Text size="sm" fw={700} className="text-zinc-100 leading-tight">
            {r.cargo}
          </Text>
          <Badge
            variant="light"
            color="indigo"
            radius="sm"
            size="xs"
            className="font-medium w-fit"
          >
            {r.area}
          </Badge>
        </Stack>
      ),
    },
    {
      accessor: "estado",
      title: "Estado",
      textAlign: "center",
      width: 110,
      render: (r) => (
        <Badge
          variant="light"
          color={r.estado === "Activo" ? "green" : "gray"}
          radius="md"
        >
          {r.estado}
        </Badge>
      ),
    },
  ];

  return (
    <Stack gap="xl">
      {loading ? (
        <Stack align="center" gap="md" py={100}>
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <BuildingOfficeIcon className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <Text
            size="xs"
            fw={900}
            className="uppercase tracking-[0.3em] text-zinc-500"
          >
            Consultando Personal...
          </Text>
        </Stack>
      ) : groupedByCompany.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/10 backdrop-blur-sm">
          <BuildingOfficeIcon className="w-12 h-12 text-zinc-700 mb-4" />
          <Text
            size="sm"
            fw={700}
            className="text-zinc-400 uppercase tracking-widest"
          >
            Sin resultados
          </Text>
          <Text size="xs" c="dimmed" className="mt-1">
            No se encontraron empleados para los filtros aplicados.
          </Text>
        </div>
      ) : (
        groupedByCompany.map((group) => (
          <CompanyGroupCard
            key={group.id}
            nombre={group.nombre}
            empleados={group.empleados}
            columns={columns}
            loading={loading}
          />
        ))
      )}
    </Stack>
  );
};
