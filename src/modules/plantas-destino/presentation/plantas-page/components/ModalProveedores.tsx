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
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";
import { useNotify } from "../../../../../hooks/useNotify";
import { PlantasDestinoService } from "../../../service/plantas-destino.service";
import { ProveedoresService } from "../../../../proveedores-mineros/service/proveedores.service";
import type { PlantaDestinoResponse } from "../../../service/plantas-destino.responses";
import type { ProveedorResponse } from "../../../../proveedores-mineros/service/proveedores.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  planta: PlantaDestinoResponse;
  onProveedoresCountChange?: (count: number) => void;
}

export const ModalProveedores = ({ planta, onProveedoresCountChange }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  // Proveedores asociados a la planta
  const [asociados, setAsociados] = useState<ProveedorResponse[]>([]);
  const [loadingAsociados, setLoadingAsociados] = useState(false);

  // Todos los proveedores del sistema (para asociar)
  const [todosProveedores, setTodosProveedores] = useState<ProveedorResponse[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);

  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Cargar asociados
  const fetchAsociados = async () => {
    setLoadingAsociados(true);
    try {
      const data = await PlantasDestinoService.getProveedoresAsociados(planta.id);
      setAsociados(data);
      onProveedoresCountChange?.(data.length);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los proveedores de la planta");
    } finally {
      setLoadingAsociados(false);
    }
  };

  // Cargar todos los proveedores del sistema
  const fetchTodos = async () => {
    setLoadingTodos(true);
    try {
      const data = await ProveedoresService.getProveedores();
      setTodosProveedores(data);
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
  }, [planta.id]);

  // Filtrar asociados
  const asociadosFiltrados = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return asociados;
    return asociados.filter(
      (p) =>
        p.razon_social.toLowerCase().includes(query) ||
        (p.ruc && p.ruc.toLowerCase().includes(query)) ||
        (p.dni && p.dni.toLowerCase().includes(query))
    );
  }, [asociados, searchQuery]);

  // Filtrar disponibles para asociar (excluyendo ya asociados e inactivos)
  const disponiblesParaAsociar = useMemo(() => {
    const asociadosIds = new Set(asociados.map((p) => p.id_proveedor));
    return todosProveedores
      .filter((p) => !asociadosIds.has(p.id_proveedor) && p.estado === EstadoBase.Activo)
      .map((p) => ({
        value: String(p.id_proveedor),
        label: `${p.razon_social} (RUC: ${p.ruc || "—"}${p.dni ? `, DNI: ${p.dni}` : ""})`,
      }));
  }, [todosProveedores, asociados]);

  // Asociar
  const handleAsociar = async () => {
    if (!selectedProveedorId) return;
    setIsLinking(true);
    try {
      await PlantasDestinoService.asociarProveedor(planta.id, Number(selectedProveedorId));
      notifySuccess("Proveedor asociado correctamente");
      setSelectedProveedorId(null);
      await fetchAsociados();
    } catch (e: any) {
      console.error(e);
      notifyError(e.response?.data?.message || "Error al asociar el proveedor");
    } finally {
      setIsLinking(false);
    }
  };

  // Desasociar
  const handleDesasociar = async (idProveedor: number) => {
    if (!confirm("¿Está seguro de desasociar este proveedor de la planta destino?")) return;
    setLoadingAction(idProveedor);
    try {
      await PlantasDestinoService.desasociarProveedor(planta.id, idProveedor);
      notifySuccess("Proveedor desasociado correctamente");
      await fetchAsociados();
    } catch (e) {
      console.error(e);
      notifyError("Error al desasociar el proveedor");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Stack gap="lg" className="p-1">
      {/* Sección 1: Asociar Proveedor Existente */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Text size="sm" fw={600} className="text-zinc-200 mb-3 uppercase tracking-wider text-xs">
          Asociar Proveedor Existente
        </Text>
        <Group align="flex-end" gap="md">
          <div className="flex-1">
            <Select
              placeholder={loadingTodos ? "Cargando proveedores..." : "Seleccionar proveedor de la lista..."}
              searchable
              disabled={loadingTodos || isLinking}
              rightSection={loadingTodos ? <Loader size={16} /> : undefined}
              data={disponiblesParaAsociar}
              value={selectedProveedorId}
              onChange={setSelectedProveedorId}
              radius="lg"
              size="xs"
              classNames={{
                input:
                  "bg-zinc-955/50 border-zinc-800 text-white placeholder:text-zinc-505 focus:border-zinc-300 transition-all",
                dropdown: "bg-zinc-900 border-zinc-800 text-white",
                option: "hover:bg-zinc-800 text-zinc-300",
              }}
            />
          </div>
          <Button
            onClick={handleAsociar}
            disabled={!selectedProveedorId || isLinking}
            loading={isLinking}
            radius="lg"
            size="xs"
            leftSection={<IconPlus size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-955/30"
          >
            Asociar
          </Button>
        </Group>
      </div>

      <Divider className="border-zinc-800/50" />

      {/* Sección 2: Listado y Búsqueda */}
      <div className="flex flex-col gap-3">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600} className="text-zinc-200 uppercase tracking-wider text-xs">
            Proveedores Asociados
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
              Cargando proveedores asociados...
            </Text>
          </div>
        ) : asociadosFiltrados.length > 0 ? (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {asociadosFiltrados.map((p) => (
              <div
                key={p.id_proveedor}
                className={`group p-3 bg-zinc-900/35 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/30 hover:border-zinc-700/40 transition-all duration-200 ${
                  p.estado === EstadoBase.Inactivo ? "opacity-60 bg-zinc-955/20" : ""
                }`}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" className="min-w-0 flex-1">
                    <div className={`p-2 bg-zinc-950/60 rounded-lg shrink-0 transition-colors ${
                      p.estado === EstadoBase.Inactivo ? "text-zinc-600" : "text-zinc-400 group-hover:text-teal-400"
                    }`}>
                      {p.tipo_entidad === "Persona Natural" ? (
                        <IconUser size={18} stroke={1.5} />
                      ) : (
                        <IconBuilding size={18} stroke={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Text
                          size="sm"
                          fw={500}
                          className={p.estado === EstadoBase.Inactivo ? "text-zinc-500 line-through truncate w-full" : "text-zinc-200 truncate w-full"}
                          title={p.razon_social}
                        >
                          {p.razon_social}
                        </Text>
                        <Badge
                          color={p.estado === EstadoBase.Activo ? "green" : "gray"}
                          variant="light"
                          size="xs"
                          radius="xl"
                          className="shrink-0"
                        >
                          {p.estado}
                        </Badge>
                      </Group>
                      <Text size="xs" className="text-zinc-500 font-medium truncate">
                        {p.ruc && `RUC: ${p.ruc}`} {p.dni && `· DNI: ${p.dni}`}{" "}
                        {p.telefono && `· Tel: ${p.telefono}`}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="xs" wrap="nowrap" className="shrink-0">
                    <Tooltip label="Eliminar Asociación" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        radius="xl"
                        size="md"
                        loading={loadingAction === p.id_proveedor}
                        onClick={() => handleDesasociar(p.id_proveedor)}
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
              No se encontraron proveedores asociados para esta planta.
            </Text>
          </div>
        )}
      </div>
    </Stack>
  );
};
