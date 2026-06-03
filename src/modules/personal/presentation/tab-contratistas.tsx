import {
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Avatar,
  FileButton,
  Stack,
  Loader,
} from "@mantine/core";
import {
  PencilSquareIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { type DataTableColumn } from "mantine-datatable";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { useContratistas } from "../hooks/useContratistas";
import { useAsignacionLaboresContratista } from "../hooks/useAsignacionLaboresContratista";
import type { RES_Contratista } from "../service/empleados.responses";
import { useNotify } from "../../../hooks/useNotify";

interface TabContratistasProps {
  controller: ReturnType<typeof useContratistas>;
  asignacion: ReturnType<typeof useAsignacionLaboresContratista>;
}

export const TabContratistas = ({
  controller,
  asignacion,
}: TabContratistasProps) => {
  const { notifySuccess, notifyError } = useNotify();

  const {
    contratistas,
    loading,
    actualizarFoto,
    idActualizandoFoto,
  } = controller;

  const handleUpdateFoto = async (id: number, file: File | null) => {
    if (!file) return;
    const ok = await actualizarFoto(id, file);
    if (ok) {
      notifySuccess("Foto de perfil actualizada correctamente");
    } else {
      notifyError("No se pudo actualizar la foto de perfil");
    }
  };

  const columns: DataTableColumn<RES_Contratista>[] = [
    {
      accessor: "index",
      title: "#",
      textAlign: "center",
      width: 50,
      render: (_, index) => index + 1,
    },
    {
      accessor: "contratista",
      title: "Contratista / Minero",
      width: 180,
      render: (r) => {
        const isUpdatingFoto = r.id_contratista === idActualizandoFoto;
        return (
          <Group gap="sm">
            <div className="relative group overflow-hidden rounded-full w-9 h-9 border border-zinc-800 shrink-0">
              {isUpdatingFoto && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full z-10">
                  <Loader size="xs" color="indigo" />
                </div>
              )}
              <FileButton
                onChange={(file) => handleUpdateFoto(r.id_contratista, file)}
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
                        <PencilSquareIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </FileButton>
            </div>
            <div className="min-w-0 flex-1">
              <Text size="xs" fw={700} className="text-zinc-200 truncate leading-tight">
                {r.nombre} {r.apellido}
              </Text>
              <Text size="10px" className="text-zinc-500 font-mono truncate">
                {r.dni || "---"}
              </Text>
            </div>
          </Group>
        );
      },
    },
    {
      accessor: "operativo",
      title: "Mina y Labores",
      width: 420,
      textAlign: "center",
      render: (r) => {
        const hasMina = r.id_mina && r.id_mina > 0;
        const sinLabores =
          r.labores_asignadas === "Sin asignar" ||
          r.labores_asignadas === "No aplica" ||
          !r.labores_asignadas;

        return (
          <div className="flex flex-row justify-center">
            <Group gap="lg" wrap="nowrap" justify="center" align="center">
              {!hasMina ? (
                <Text size="xs" c="dimmed" fs="italic" className="min-w-[130px]">
                  Sin asignar
                </Text>
              ) : (
                <>
                  <Badge
                    variant="light"
                    color="pink.6"
                    radius="md"
                    size="md"
                    className="font-bold h-7 border border-pink-500/20"
                    leftSection={<MapPinIcon className="w-3.5 h-3.5 text-pink-400" />}
                  >
                    {r.mina}
                  </Badge>

                  <Stack gap={4} align="center">
                    {sinLabores ? (
                      <Text size="xs" c="dimmed" fs="italic">
                        Sin asignar
                      </Text>
                    ) : (
                      r.labores_asignadas.split(" | ").map((lab, idx) => (
                        <Badge
                          key={idx}
                          variant="light"
                          color="cyan.6"
                          radius="sm"
                          size="xs"
                          className="font-bold h-6 border border-cyan-500/10"
                        >
                          {lab}
                        </Badge>
                      ))
                    )}
                  </Stack>
                </>
              )}

              <Tooltip label="Asignación de Mina y Labores">
                <ActionIcon
                  variant="subtle"
                  color="zinc"
                  size="lg"
                  onClick={() => asignacion.abrir(r)}
                  className="hover:bg-zinc-800 transition-colors rounded-xl"
                >
                  <PencilSquareIcon className="w-5 h-5 text-zinc-400" />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
        );
      },
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
    <>
      {loading ? (
        <Stack align="center" gap="md" py={100}>
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <UserGroupIcon className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <Text
            size="xs"
            fw={900}
            className="uppercase tracking-[0.3em] text-zinc-500"
          >
            Consultando Personal Minero...
          </Text>
        </Stack>
      ) : contratistas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/10 backdrop-blur-sm">
          <UserGroupIcon className="w-12 h-12 text-zinc-700 mb-4" />
          <Text
            size="sm"
            fw={700}
            className="text-zinc-400 uppercase tracking-widest"
          >
            Sin resultados
          </Text>
          <Text size="xs" c="dimmed" className="mt-1">
            No se encontraron contratistas. ¡Empieza registrando uno nuevo!
          </Text>
        </div>
      ) : (
        <DataTableEstandar
          idAccessor="id_contratista"
          columns={columns}
          records={contratistas}
          loading={loading}
        />
      )}
    </>
  );
};
