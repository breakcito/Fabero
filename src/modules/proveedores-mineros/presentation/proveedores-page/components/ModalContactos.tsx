import { useState, useEffect, useMemo } from "react";
import {
  Stack,
  Group,
  TextInput,
  Button,
  Text,
  ActionIcon,
  Tooltip,
  Loader,
  Badge,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconPencil,
  IconAddressBook,
} from "@tabler/icons-react";
import { useNotify } from "../../../../../hooks/useNotify";
import { ProveedoresService } from "../../../service/proveedores.service";
import { ModalEstandar } from "../../../../../presentation/utils/modal-estandar";
import { RegistroContacto } from "../../../presentation/registro-contacto/registro-contacto";
import type {
  ProveedorResponse,
  RES_ContactoProveedor,
} from "../../../service/proveedores.responses";

interface Props {
  proveedor: ProveedorResponse;
  /** Se invoca cuando cambia la cantidad de contactos del proveedor. */
  onCantidadChange?: (cantidad: number) => void;
}

export const ModalContactos = ({ proveedor, onCantidadChange }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [contactos, setContactos] = useState<RES_ContactoProveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [openRegistro, setOpenRegistro] = useState(false);
  const [contactoAEditar, setContactoAEditar] = useState<RES_ContactoProveedor | null>(
    null,
  );

  const fetchContactos = async () => {
    setLoading(true);
    try {
      const data = await ProveedoresService.getContactosProveedor(
        proveedor.id_proveedor,
      );
      setContactos(data);
      onCantidadChange?.(data.length);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los contactos del proveedor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor.id_proveedor]);

  const contactosFiltrados = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return contactos;
    return contactos.filter(
      (c) =>
        c.nombre_completo.toLowerCase().includes(query) ||
        (c.dni && c.dni.toLowerCase().includes(query)) ||
        (c.telefono && c.telefono.toLowerCase().includes(query)) ||
        (c.correo && c.correo.toLowerCase().includes(query)),
    );
  }, [contactos, searchQuery]);

  const handleEliminar = async (contacto: RES_ContactoProveedor) => {
    if (
      !confirm(
        `¿Está seguro de eliminar el contacto "${contacto.nombre_completo}"?`,
      )
    ) {
      return;
    }
    setLoadingAction(contacto.id);
    try {
      await ProveedoresService.eliminarContactoProveedor(contacto.id);
      notifySuccess("Contacto eliminado correctamente");
      await fetchContactos();
    } catch (e) {
      console.error(e);
      notifyError("Error al eliminar el contacto");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Stack gap="lg" className="p-1">
      <div className="flex flex-col gap-3">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <TextInput
              placeholder="Buscar..."
              radius="lg"
              size="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={14} className="text-zinc-500" />}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white focus:border-zinc-300 transition-all w-56",
              }}
            />
            <Button
              onClick={() => setOpenRegistro(true)}
              radius="lg"
              size="xs"
              leftSection={<IconPlus size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-950/30"
            >
              Registrar Contacto
            </Button>
          </Group>
        </Group>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
            <Loader color="indigo" type="bars" size="sm" />
            <Text
              size="xs"
              mt="sm"
              className="text-zinc-500 font-medium uppercase tracking-widest"
            >
              Cargando contactos...
            </Text>
          </div>
        ) : contactosFiltrados.length > 0 ? (
          <div className="flex flex-col gap-2.5 max-h-75 overflow-y-auto pr-1 custom-scrollbar">
            {contactosFiltrados.map((c) => (
              <div
                key={c.id}
                className="group p-3 bg-zinc-900/35 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/30 hover:border-zinc-700/40 transition-all duration-200"
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <div className="p-2 bg-zinc-950/60 rounded-lg text-zinc-400 group-hover:text-indigo-400 transition-colors">
                      <IconAddressBook size={18} stroke={1.5} />
                    </div>
                    <div className="min-w-0">
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Text
                          size="sm"
                          fw={500}
                          className="text-zinc-200 truncate"
                        >
                          {c.nombre_completo}
                        </Text>
                        {c.dni && (
                          <Badge
                            color="teal"
                            variant="light"
                            size="xs"
                            radius="xl"
                            className="shrink-0 font-mono"
                          >
                            DNI: {c.dni}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" className="text-zinc-500 font-medium truncate">
                        {[
                          c.telefono ? `Tel: ${c.telefono}` : null,
                          c.correo,
                          c.empleado_registro_nombre
                            ? `Registrado por ${c.empleado_registro_nombre}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar Contacto" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        radius="xl"
                        size="md"
                        onClick={() => setContactoAEditar(c)}
                      >
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Eliminar Contacto" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        radius="xl"
                        size="md"
                        loading={loadingAction === c.id}
                        onClick={() => handleEliminar(c)}
                      >
                        <IconTrash size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
            <IconAddressBook size={40} className="text-zinc-700 mb-2" stroke={1} />
            <Text size="sm" className="text-zinc-500">
              Este proveedor no tiene contactos registrados.
            </Text>
            <Text size="xs" className="text-zinc-600 mt-1 text-center max-w-md">
              Mientras no registre contactos, los documentos usarán la razón
              social, el teléfono y el correo del propio proveedor.
            </Text>
          </div>
        )}
      </div>

      {/* Sub-Modal: Registrar Contacto */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Registrar Contacto"
        size="md"
        validateClose
      >
        <RegistroContacto
          idProveedor={proveedor.id_proveedor}
          onCancel={() => setOpenRegistro(false)}
          onSuccess={async () => {
            setOpenRegistro(false);
            await fetchContactos();
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Editar Contacto */}
      <ModalEstandar
        opened={!!contactoAEditar}
        close={() => setContactoAEditar(null)}
        title={
          contactoAEditar ? `Editar Contacto: ${contactoAEditar.nombre_completo}` : ""
        }
        size="md"
        validateClose
      >
        {contactoAEditar && (
          <RegistroContacto
            idProveedor={proveedor.id_proveedor}
            contacto={contactoAEditar}
            onCancel={() => setContactoAEditar(null)}
            onSuccess={async () => {
              setContactoAEditar(null);
              await fetchContactos();
            }}
          />
        )}
      </ModalEstandar>
    </Stack>
  );
};
