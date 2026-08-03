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
  IconMapPin,
  IconPower,
} from "@tabler/icons-react";
import { useNotify } from "../../../../../hooks/useNotify";
import { ProveedoresService } from "../../../service/proveedores.service";
import { ConcesionesService } from "../../../service/concesiones.service";
import { ModalEstandar } from "../../../../../presentation/utils/modal-estandar";
import { RegistroConcesion } from "../../../presentation/registro-concesion";
import type { ProveedorResponse } from "../../../service/proveedores.responses";
import type { RES_Concesion } from "../../../service/concesiones.responses";
import { EstadoBase } from "../../../../../shared/enums/_generic/estado-base";

interface Props {
  proveedor: ProveedorResponse;
}

export const ModalConcesiones = ({ proveedor }: Props) => {
  const { notify, notifySuccess, notifyError } = useNotify();

  // Concesiones del proveedor
  const [concesionesAsociadas, setConcesionesAsociadas] = useState<RES_Concesion[]>([]);
  const [loadingAsociadas, setLoadingAsociadas] = useState(false);

  // Todas las concesiones del sistema (para asociar)
  const [todasConcesiones, setTodasConcesiones] = useState<RES_Concesion[]>([]);
  const [loadingTodas, setLoadingTodas] = useState(false);

  const [selectedConcesionId, setSelectedConcesionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [loadingStatusAction, setLoadingStatusAction] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Modales
  const [concesionAEditar, setConcesionAEditar] = useState<RES_Concesion | null>(null);
  const [openCrearConcesion, setOpenCrearConcesion] = useState(false);

  // Cargar concesiones asociadas
  const fetchAsociadas = async () => {
    setLoadingAsociadas(true);
    try {
      const data = await ProveedoresService.getConcesionesProveedor(proveedor.id_proveedor);
      setConcesionesAsociadas(data);
    } catch (e) {
      console.error(e);
      notify({ type: "error", content: "Error al cargar las concesiones del proveedor" });
    } finally {
      setLoadingAsociadas(false);
    }
  };

  // Cargar todas las concesiones
  const fetchTodas = async () => {
    setLoadingTodas(true);
    try {
      const res = await ConcesionesService.get_concesiones();
      if (res.success) {
        setTodasConcesiones(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTodas(false);
    }
  };

  useEffect(() => {
    fetchAsociadas();
    fetchTodas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor.id_proveedor]);

  // Filtrar concesiones asociadas
  const asociadasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return concesionesAsociadas;
    return concesionesAsociadas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(query) ||
        (c.codigo_reinfo && c.codigo_reinfo.toLowerCase().includes(query)) ||
        (c.departamento && c.departamento.toLowerCase().includes(query)) ||
        (c.provincia && c.provincia.toLowerCase().includes(query)) ||
        (c.distrito && c.distrito.toLowerCase().includes(query))
    );
  }, [concesionesAsociadas, searchQuery]);

  // Filtrar concesiones del sistema para el selector (excluyendo las ya asociadas e inactivas)
  const concesionesDisponibles = useMemo(() => {
    const asociadasIds = new Set(concesionesAsociadas.map((c) => c.id_concesion));
    return todasConcesiones
      .filter((c) => !asociadasIds.has(c.id_concesion) && c.estado === EstadoBase.Activo)
      .map((c) => ({
        value: String(c.id_concesion),
        label: `${c.nombre}${c.codigo_reinfo ? ` (REINFO: ${c.codigo_reinfo})` : ""}${
          c.departamento ? ` - ${c.departamento}` : ""
        }`,
      }));
  }, [todasConcesiones, concesionesAsociadas]);

  // Asociar concesion
  const handleAsociar = async () => {
    if (!selectedConcesionId) return;
    setIsLinking(true);
    try {
      await ProveedoresService.asociarConcesionProveedor(
        proveedor.id_proveedor,
        Number(selectedConcesionId)
      );
      notify({ type: "success", content: "Concesión asociada correctamente" });
      setSelectedConcesionId(null);
      await fetchAsociadas();
    } catch (e: unknown) {
      console.error(e);
      const axiosError = e as { response?: { data?: { message?: string } } };
      notify({ type: "error", content: axiosError.response?.data?.message || "Error al asociar la concesión" });
    } finally {
      setIsLinking(false);
    }
  };

  // Desasociar concesion
  const handleDesasociar = async (idConcesion: number) => {
    if (!confirm("¿Está seguro de desasociar esta concesión del proveedor?")) return;
    setLoadingAction(idConcesion);
    try {
      await ProveedoresService.desasociarConcesionProveedor(
        proveedor.id_proveedor,
        idConcesion
      );
      notify({ type: "success", content: "Concesión desasociada correctamente" });
      await fetchAsociadas();
    } catch (e: unknown) {
      console.error(e);
      notify({ type: "error", content: "Error al desasociar la concesión" });
    } finally {
      setLoadingAction(null);
    }
  };

  // Cambiar estado concesión (Activo/Inactivo)
  const handleToggleConcesionStatus = async (idConcesion: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    if (!confirm(`¿Está seguro de cambiar el estado de esta concesión a ${nuevoEstado}?`)) return;
    setLoadingStatusAction(idConcesion);
    try {
      await ConcesionesService.cambiar_estado_concesion(idConcesion, nuevoEstado);
      notifySuccess(`Concesión ${nuevoEstado.toLowerCase()} correctamente`);
      await fetchAsociadas();
      await fetchTodas();
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al cambiar el estado de la concesión");
    } finally {
      setLoadingStatusAction(null);
    }
  };

  return (
    <Stack gap="lg" className="p-1">
      {/* Sección 1: Asociar Concesión Existente */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
        <Text size="sm" fw={600} className="text-zinc-200 mb-3 uppercase tracking-wider text-xs">
          Asociar Concesión Existente
        </Text>
        <Group align="flex-end" gap="md">
          <div className="flex-1">
            <Select
              placeholder={loadingTodas ? "Cargando concesiones..." : "Seleccionar concesión del sistema..."}
              searchable
              disabled={loadingTodas || isLinking}
              rightSection={loadingTodas ? <Loader size={16} /> : undefined}
              data={concesionesDisponibles}
              value={selectedConcesionId}
              onChange={setSelectedConcesionId}
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
            disabled={!selectedConcesionId || isLinking}
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
            onClick={() => setOpenCrearConcesion(true)}
            className="text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
          >
            Registrar Nueva
          </Button>
        </Group>
      </div>

      <Divider className="border-zinc-800/50" />

      {/* Sección 2: Listado y Búsqueda */}
      <div className="flex flex-col gap-3">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600} className="text-zinc-200 uppercase tracking-wider text-xs">
            Concesiones del Proveedor
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

        {loadingAsociadas ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
            <Loader color="indigo" type="bars" size="sm" />
            <Text size="xs" mt="sm" className="text-zinc-500 font-medium uppercase tracking-widest">
              Cargando concesiones...
            </Text>
          </div>
        ) : asociadasFiltradas.length > 0 ? (
          <div className="flex flex-col gap-2.5 max-h-75 overflow-y-auto pr-1 custom-scrollbar">
            {asociadasFiltradas.map((c) => (
              <div
                key={c.id_concesion}
                className={`group p-3 bg-zinc-900/35 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/30 hover:border-zinc-700/40 transition-all duration-200 ${
                  c.estado === EstadoBase.Inactivo ? "opacity-60 bg-zinc-950/20" : ""
                }`}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <div className={`p-2 bg-zinc-950/60 rounded-lg transition-colors ${
                      c.estado === EstadoBase.Inactivo ? "text-zinc-600" : "text-zinc-400 group-hover:text-teal-400"
                    }`}>
                      <IconMapPin size={18} stroke={1.5} />
                    </div>
                    <div>
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Text size="sm" fw={500} className={c.estado === EstadoBase.Inactivo ? "text-zinc-500 line-through truncate" : "text-zinc-200 truncate"}>
                          {c.nombre}
                        </Text>
                        <Badge
                          color={c.estado === EstadoBase.Activo ? "green" : "red"}
                          variant="light"
                          size="xs"
                          radius="xl"
                          className="shrink-0"
                        >
                          {c.estado}
                        </Badge>
                      </Group>
                      <Text size="xs" className="text-zinc-500 font-medium truncate">
                        Ubigeo: {c.departamento && `${c.departamento} / ${c.provincia} / ${c.distrito}`}{" "}
                        {c.codigo_reinfo && `· REINFO: ${c.codigo_reinfo}`}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar Concesión" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        radius="xl"
                        size="md"
                        onClick={() => setConcesionAEditar(c)}
                      >
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label={c.estado === EstadoBase.Activo ? "Inactivar Concesión" : "Activar Concesión"} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color={c.estado === EstadoBase.Activo ? "orange" : "green"}
                        radius="xl"
                        size="md"
                        loading={loadingStatusAction === c.id_concesion}
                        onClick={() => handleToggleConcesionStatus(c.id_concesion, c.estado as EstadoBase)}
                      >
                        <IconPower size={16} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Desasociar Concesión" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        radius="xl"
                        size="md"
                        loading={loadingAction === c.id_concesion}
                        onClick={() => handleDesasociar(c.id_concesion)}
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
            <IconMapPin size={40} className="text-zinc-700 mb-2" stroke={1} />
            <Text size="sm" className="text-zinc-500">
              No se encontraron concesiones para este proveedor.
            </Text>
          </div>
        )}
      </div>

      {/* Sub-Modal: Registrar Nueva Concesión */}
      <ModalEstandar
        opened={openCrearConcesion}
        close={() => setOpenCrearConcesion(false)}
        title="Registrar Nueva Concesión"
        size="md"
      >
        <RegistroConcesion
          onCancel={() => setOpenCrearConcesion(false)}
          onSuccess={async (nueva: RES_Concesion) => {
            setOpenCrearConcesion(false);
            // Automatizar la asociación de la concesión recién creada
            setIsLinking(true);
            try {
              await ProveedoresService.asociarConcesionProveedor(
                proveedor.id_proveedor,
                nueva.id_concesion
              );
              notify({ type: "success", content: "Concesión registrada y asociada con éxito" });
              await fetchAsociadas();
              await fetchTodas();
            } catch {
              notify({ type: "info", content: "Concesión creada pero no se pudo asociar automáticamente" });
            } finally {
              setIsLinking(false);
            }
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Editar Concesión */}
      <ModalEstandar
        opened={!!concesionAEditar}
        close={() => setConcesionAEditar(null)}
        title={concesionAEditar ? `Editar Concesión: ${concesionAEditar.nombre}` : ""}
        size="md"
      >
        {concesionAEditar && (
          <RegistroConcesion
            concesion={concesionAEditar}
            onCancel={() => setConcesionAEditar(null)}
            onSuccess={async () => {
              setConcesionAEditar(null);
              await fetchAsociadas();
              await fetchTodas();
            }}
          />
        )}
      </ModalEstandar>
    </Stack>
  );
};
