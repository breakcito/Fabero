import { useState, useEffect, useMemo } from "react";
import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Text,
  ActionIcon,
  Tooltip,
  Divider,
  Loader,
  Badge,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconPencil,
  IconUser,
  IconPower,
} from "@tabler/icons-react";
import { useNotify } from "../../../../../hooks/useNotify";
import { ProveedoresService } from "../../../service/proveedores.service";
import { EncargadosMuestraService } from "../../../../encargados-muestra/service/encargados-muestra.service";
import { ModalEstandar } from "../../../../../presentation/utils/modal-estandar";
import { RegistroEncargadoMuestra } from "../../../../encargados-muestra/presentation/registro-encargado-muestra/registro-encargado-muestra";
import type { ProveedorResponse } from "../../../service/proveedores.responses";
import type { RES_EncargadoMuestra } from "../../../../encargados-muestra/service/encargados-muestra.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  proveedor: ProveedorResponse;
  onCountChange?: (count: number) => void;
}

export const ModalEncargadosMuestra = ({ proveedor, onCountChange }: Props) => {
  const { notify, notifySuccess, notifyError } = useNotify();

  // Encargados asociados al proveedor
  const [asociados, setAsociados] = useState<RES_EncargadoMuestra[]>([]);
  const [loadingAsociados, setLoadingAsociados] = useState(false);

  // Todos los encargados del sistema
  const [todos, setTodos] = useState<RES_EncargadoMuestra[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [loadingStatusAction, setLoadingStatusAction] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Modales
  const [encargadoAEditar, setEncargadoAEditar] = useState<RES_EncargadoMuestra | null>(null);
  const [openCrear, setOpenCrear] = useState(false);

  // Cargar asociados
  const fetchAsociados = async () => {
    setLoadingAsociados(true);
    try {
      const data = await ProveedoresService.getEncargadosMuestraProveedor(proveedor.id_proveedor);
      setAsociados(data);
      if (onCountChange) {
        // Enviar cantidad activa al padre
        const activeCount = data.filter((e: any) => e.estado === EstadoBase.Activo).length;
        onCountChange(activeCount);
      }
    } catch (e) {
      console.error(e);
      notify({ type: "error", content: "Error al cargar los encargados de muestra del proveedor" });
    } finally {
      setLoadingAsociados(false);
    }
  };

  // Cargar todos
  const fetchTodos = async () => {
    setLoadingTodos(true);
    try {
      const res = await EncargadosMuestraService.get_encargados_muestra();
      if (res.success) {
        setTodos(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTodos(false);
    }
  };

  useEffect(() => {
    fetchAsociados();
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor.id_proveedor]);

  // Filtrar asociados
  const asociadosFiltrados = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return asociados;
    return asociados.filter(
      (e) =>
        e.nombre.toLowerCase().includes(query) ||
        e.apellido.toLowerCase().includes(query) ||
        (e.dni && e.dni.toLowerCase().includes(query)) ||
        (e.ruc && e.ruc.toLowerCase().includes(query))
    );
  }, [asociados, searchQuery]);

  // Filtrar para el Select (que no estén asociados y estén activos)
  const disponibles = useMemo(() => {
    const asociadosIds = new Set(asociados.map((a) => a.id_encargado_muestra));
    return todos
      .filter((e) => !asociadosIds.has(e.id_encargado_muestra) && e.estado === EstadoBase.Activo)
      .map((e) => ({
        value: String(e.id_encargado_muestra),
        label: `${e.apellido}, ${e.nombre}${e.dni ? ` (DNI: ${e.dni})` : ""}${
          e.ruc ? ` (RUC: ${e.ruc})` : ""
        }`,
      }));
  }, [todos, asociados]);

  // Asociar
  const handleAsociar = async () => {
    if (!selectedId) return;
    setIsLinking(true);
    try {
      await ProveedoresService.asociarEncargadoMuestraProveedor(
        proveedor.id_proveedor,
        Number(selectedId)
      );
      notify({ type: "success", content: "Encargado de muestra asociado correctamente" });
      setSelectedId(null);
      await fetchAsociados();
    } catch (e: any) {
      console.error(e);
      notify({ type: "error", content: e.response?.data?.message || "Error al asociar el encargado" });
    } finally {
      setIsLinking(false);
    }
  };

  // Desasociar
  const handleDesasociar = async (idEncargado: number) => {
    if (!confirm("¿Está seguro de desasociar este encargado del proveedor?")) return;
    setLoadingAction(idEncargado);
    try {
      await ProveedoresService.desasociarEncargadoMuestraProveedor(
        proveedor.id_proveedor,
        idEncargado
      );
      notify({ type: "success", content: "Encargado de muestra desasociado correctamente" });
      await fetchAsociados();
    } catch (e: any) {
      console.error(e);
      notify({ type: "error", content: "Error al desasociar el encargado" });
    } finally {
      setLoadingAction(null);
    }
  };

  // Cambiar estado encargado
  const handleToggleStatus = async (idEncargado: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    if (!confirm(`¿Está seguro de cambiar el estado de este encargado a ${nuevoEstado}?`)) return;
    setLoadingStatusAction(idEncargado);
    try {
      await EncargadosMuestraService.cambiar_estado_encargado_muestra(idEncargado, nuevoEstado);
      notifySuccess(`Encargado ${nuevoEstado.toLowerCase()} correctamente`);
      await fetchAsociados();
      await fetchTodos();
    } catch (e: any) {
      console.error(e);
      notifyError("Error al cambiar el estado del encargado");
    } finally {
      setLoadingStatusAction(null);
    }
  };

  return (
    <Stack gap="lg" className="p-1">
      {/* Sección 1: Asociar Existente */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Text size="sm" fw={600} className="text-zinc-200 mb-3 uppercase tracking-wider text-xs">
          Asociar Encargado Existente
        </Text>
        <Group align="flex-end" gap="md">
          <div className="flex-1">
            <Select
              placeholder="Seleccionar encargado del sistema..."
              searchable
              disabled={loadingTodos || isLinking}
              data={disponibles}
              value={selectedId}
              onChange={setSelectedId}
              radius="lg"
              size="xs"
              classNames={{
                input:
                  "bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                dropdown: "bg-zinc-900 border-zinc-800 text-white",
                option: "hover:bg-zinc-800 text-zinc-300",
              }}
            />
          </div>
          <Button
            onClick={handleAsociar}
            disabled={!selectedId || isLinking}
            loading={isLinking}
            radius="lg"
            size="xs"
            leftSection={<IconPlus size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-950/30"
          >
            Asociar
          </Button>
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            size="xs"
            onClick={() => setOpenCrear(true)}
            className="text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
          >
            Registrar Nuevo
          </Button>
        </Group>
      </div>

      <Divider className="border-zinc-800/50" />

      {/* Sección 2: Listado y Búsqueda */}
      <div className="flex flex-col gap-3">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600} className="text-zinc-200 uppercase tracking-wider text-xs">
            Encargados Asociados al Proveedor
          </Text>
          <TextInput
            placeholder="Buscar..."
            radius="lg"
            size="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={14} className="text-zinc-500" />}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white focus:border-zinc-300 transition-all w-60",
            }}
          />
        </Group>

        {loadingAsociados ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
            <Loader color="indigo" type="bars" size="sm" />
            <Text size="xs" mt="sm" className="text-zinc-500 font-medium uppercase tracking-widest">
              Cargando encargados...
            </Text>
          </div>
        ) : asociadosFiltrados.length > 0 ? (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {asociadosFiltrados.map((e) => (
              <div
                key={e.id_encargado_muestra}
                className={`group p-3 bg-zinc-900/35 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/30 hover:border-zinc-700/40 transition-all duration-200 ${
                  e.estado === EstadoBase.Inactivo ? "opacity-60 bg-zinc-950/20" : ""
                }`}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <div className={`p-2 bg-zinc-950/60 rounded-lg transition-colors ${
                      e.estado === EstadoBase.Inactivo ? "text-zinc-600" : "text-zinc-400 group-hover:text-indigo-400"
                    }`}>
                      <IconUser size={18} stroke={1.5} />
                    </div>
                    <div>
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Text size="sm" fw={500} className={e.estado === EstadoBase.Inactivo ? "text-zinc-500 line-through truncate" : "text-zinc-200 truncate"}>
                          {e.apellido}, {e.nombre}
                        </Text>
                        <Badge
                          color={e.estado === EstadoBase.Activo ? "green" : "red"}
                          variant="light"
                          size="xs"
                          radius="xl"
                          className="shrink-0"
                        >
                          {e.estado}
                        </Badge>
                      </Group>
                      <Text size="xs" className="text-zinc-500 font-medium truncate">
                        {e.dni && `DNI: ${e.dni}`} {e.dni && e.ruc && "·"} {e.ruc && `RUC: ${e.ruc}`}
                        {!e.dni && !e.ruc && "Sin documentos"}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar Encargado" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        radius="xl"
                        size="md"
                        onClick={() => setEncargadoAEditar(e)}
                      >
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label={e.estado === EstadoBase.Activo ? "Inactivar Encargado" : "Activar Encargado"} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color={e.estado === EstadoBase.Activo ? "orange" : "green"}
                        radius="xl"
                        size="md"
                        loading={loadingStatusAction === e.id_encargado_muestra}
                        onClick={() => handleToggleStatus(e.id_encargado_muestra, e.estado)}
                      >
                        <IconPower size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Desasociar Encargado" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        radius="xl"
                        size="md"
                        loading={loadingAction === e.id_encargado_muestra}
                        onClick={() => handleDesasociar(e.id_encargado_muestra)}
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
            <IconUser size={40} className="text-zinc-700 mb-2" stroke={1} />
            <Text size="sm" className="text-zinc-500">
              No se encontraron encargados de muestra para este proveedor.
            </Text>
          </div>
        )}
      </div>

      {/* Sub-Modal: Registrar Nuevo */}
      <ModalEstandar
        opened={openCrear}
        close={() => setOpenCrear(false)}
        title="Registrar Nuevo Encargado de Muestra"
        size="md"
      >
        <RegistroEncargadoMuestra
          onCancel={() => setOpenCrear(false)}
          onSuccess={async (nueva: RES_EncargadoMuestra) => {
            setOpenCrear(false);
            // Automatizar la asociación
            setIsLinking(true);
            try {
              await ProveedoresService.asociarEncargadoMuestraProveedor(
                proveedor.id_proveedor,
                nueva.id_encargado_muestra
              );
              notify({ type: "success", content: "Encargado registrado y asociado con éxito" });
              await fetchAsociados();
              await fetchTodos();
            } catch {
              notify({ type: "info", content: "Encargado creado pero no se pudo asociar automáticamente" });
            } finally {
              setIsLinking(false);
            }
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Editar */}
      <ModalEstandar
        opened={!!encargadoAEditar}
        close={() => setEncargadoAEditar(null)}
        title={encargadoAEditar ? `Editar Encargado: ${encargadoAEditar.nombre}` : ""}
        size="md"
      >
        {encargadoAEditar && (
          <RegistroEncargadoMuestra
            encargado={encargadoAEditar}
            onCancel={() => setEncargadoAEditar(null)}
            onSuccess={async () => {
              setEncargadoAEditar(null);
              await fetchAsociados();
              await fetchTodos();
            }}
          />
        )}
      </ModalEstandar>
    </Stack>
  );
};
