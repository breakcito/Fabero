import { useState, useEffect } from "react";
import { Stack, Button, TextInput, Group, Badge, ActionIcon, Tooltip } from "@mantine/core";
import { IconPlus, IconSearch, IconPencil, IconPower } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useEncargadosMuestra } from "../hooks/useEncargadosMuestra";
import { RegistroEncargadoMuestra } from "./registro-encargado-muestra/registro-encargado-muestra";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_EncargadoMuestra } from "../service/encargados-muestra.responses";

export const EncargadosMuestraPage = () => {
  useTitlePage("Encargados de Muestra");
  
  const {
    encargados,
    loading,
    busqueda,
    setBusqueda,
    recargar,
    insertEncargado,
    toggleEstado,
  } = useEncargadosMuestra();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [encargadoAEditar, setEncargadoAEditar] = useState<RES_EncargadoMuestra | null>(null);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <TextInput
            label="Buscar Encargado"
            placeholder="Buscar por nombre, apellido, DNI o RUC..."
            leftSection={<IconSearch size={16} className="text-zinc-400" />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            radius="lg"
            size="sm"
            className="flex-1 min-w-64"
            classNames={{
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
              input:
                "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
            }}
          />
          <Button
            leftSection={<IconPlus size={18} />}
            radius="lg"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 px-6 font-semibold"
            onClick={() => setOpenRegistro(true)}
          >
            Nuevo Encargado
          </Button>
        </div>

        {/* Tabla */}
        <DataTableEstandar
          idAccessor="id_encargado_muestra"
          records={encargados}
          loading={loading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlign: "center",
              width: 50,
              render: (_: RES_EncargadoMuestra, index: number) => index + 1,
            },
            {
              accessor: "nombre",
              title: "Encargado de Muestra",
              render: (r: RES_EncargadoMuestra) => (
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {r.nombre} {r.apellido}
                  </div>
                </div>
              ),
            },
            {
              accessor: "dni",
              title: "DNI",
              textAlign: "center",
              render: (r: RES_EncargadoMuestra) => r.dni || "—",
            },
            {
              accessor: "ruc",
              title: "RUC",
              textAlign: "center",
              render: (r: RES_EncargadoMuestra) => r.ruc || "—",
            },
            {
              accessor: "estado",
              title: "Estado",
              width: 120,
              textAlign: "center",
              render: (r: RES_EncargadoMuestra) => (
                <Badge
                  color={r.estado === EstadoBase.Activo ? "green" : "gray"}
                  variant="light"
                  size="sm"
                  radius="lg"
                >
                  {r.estado}
                </Badge>
              ),
            },
            {
              accessor: "acciones",
              title: "Acciones",
              width: 150,
              textAlign: "center",
              render: (r: RES_EncargadoMuestra) => (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <Tooltip label="Editar Encargado" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      radius="xl"
                      size="sm"
                      onClick={() => setEncargadoAEditar(r)}
                    >
                      <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={r.estado === EstadoBase.Activo ? "Inactivar Encargado" : "Activar Encargado"} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color={r.estado === EstadoBase.Activo ? "orange" : "green"}
                      radius="xl"
                      size="sm"
                      onClick={() => toggleEstado(r.id_encargado_muestra, r.estado)}
                    >
                      <IconPower size={16} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ),
            },
          ]}
        />
      </Stack>

      {/* Modal: Registro de Encargado de Muestra */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Encargado de Muestra"
        size="md"
      >
        <RegistroEncargadoMuestra
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(nueva) => {
            insertEncargado(nueva);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Encargado de Muestra */}
      <ModalEstandar
        opened={!!encargadoAEditar}
        close={() => setEncargadoAEditar(null)}
        title={encargadoAEditar ? `Editar Encargado: ${encargadoAEditar.nombre} ${encargadoAEditar.apellido}` : ""}
        size="md"
      >
        {encargadoAEditar && (
          <RegistroEncargadoMuestra
            encargado={encargadoAEditar}
            onCancel={() => setEncargadoAEditar(null)}
            onSuccess={(editada) => {
              insertEncargado(editada);
              setEncargadoAEditar(null);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
