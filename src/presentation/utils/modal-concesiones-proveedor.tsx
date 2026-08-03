import { useState, useEffect, useMemo, useCallback } from "react";
import { Stack, Group, Select, Button, SegmentedControl, Text } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import { ModalEstandar } from "./modal-estandar";
import { RegistroConcesion } from "../../modules/proveedores-mineros/presentation/registro-concesion";
import { ConcesionesService } from "../../modules/proveedores-mineros/service/concesiones.service";
import { ProveedoresService } from "../../modules/proveedores-mineros/service/proveedores.service";
import { useNotify } from "../../hooks/useNotify";
import { EstadoBase } from "../../shared/enums/_generic/estado-base";
import type { RES_Concesion } from "../../modules/proveedores-mineros/service/concesiones.responses";

interface Props {
  opened: boolean;
  idProveedor: number;
  nombreProveedor?: string;
  onClose: () => void;
  onSuccess: (idConcesion: number) => void;
}

export const ModalConcesionesProveedor = ({
  opened,
  idProveedor,
  nombreProveedor,
  onClose,
  onSuccess,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();
  const [modo, setModo] = useState<"asociar" | "crear">("asociar");

  // Estado para asociar existente
  const [todasConcesiones, setTodasConcesiones] = useState<RES_Concesion[]>([]);
  const [concesionesAsociadas, setConcesionesAsociadas] = useState<RES_Concesion[]>([]);
  const [selectedConcesionId, setSelectedConcesionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConcesiones = useCallback(async () => {
    setLoading(true);
    try {
      const [resTodas, asociadas] = await Promise.all([
        ConcesionesService.get_concesiones(),
        ProveedoresService.getConcesionesProveedor(idProveedor),
      ]);
      if (resTodas.success) {
        setTodasConcesiones(resTodas.data);
      }
      setConcesionesAsociadas(asociadas || []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al cargar las concesiones del sistema.");
    } finally {
      setLoading(false);
    }
  }, [idProveedor, notifyError]);

  useEffect(() => {
    if (opened && idProveedor > 0) {
      setModo("asociar");
      setSelectedConcesionId(null);
      fetchConcesiones();
    }
  }, [opened, idProveedor, fetchConcesiones]);

  // Filtrar concesiones del sistema no asociadas aún
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

  const handleAsociarExistente = async () => {
    if (!selectedConcesionId) return;
    const idConc = Number(selectedConcesionId);
    setLoading(true);
    try {
      await ProveedoresService.asociarConcesionProveedor(idProveedor, idConc);
      notifySuccess("Concesión asociada correctamente.");
      onSuccess(idConc);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      notifyError(axiosError.response?.data?.message || "Error al asociar la concesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearYAsociar = async (nueva: RES_Concesion) => {
    setLoading(true);
    try {
      await ProveedoresService.asociarConcesionProveedor(idProveedor, nueva.id_concesion);
      notifySuccess(`Concesión "${nueva.nombre}" creada y asociada correctamente.`);
      onSuccess(nueva.id_concesion);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      notifyError(axiosError.response?.data?.message || "Error al asociar la nueva concesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={nombreProveedor ? `Concesiones de: ${nombreProveedor}` : "Gestión de Concesiones"}
      size="lg"
      rightSection={
        <SegmentedControl
          value={modo}
          onChange={(val) => setModo(val as "asociar" | "crear")}
          data={[
            { label: "Asociar Existente", value: "asociar" },
            { label: "Crear Nueva", value: "crear" },
          ]}
          radius="xl"
          size="xs"
          classNames={{
            root: "bg-zinc-900/80 border border-zinc-800 p-0.5",
            indicator: "bg-indigo-600",
            label: "text-zinc-300 font-medium text-xs data-[active=true]:text-white px-3 py-1",
          }}
        />
      }
    >
      <Stack gap="md" className="pt-2">
        {modo === "asociar" ? (
          <Stack gap="md" className="py-2">
            <Text size="xs" className="text-zinc-400">
              Seleccione una concesión activa registrada en el sistema para asociarla a este proveedor:
            </Text>
            <Select
              label="Concesiones Disponibles"
              placeholder={loading ? "Cargando..." : "Buscar concesión del sistema..."}
              searchable
              disabled={loading || concesionesDisponibles.length === 0}
              radius="lg"
              data={concesionesDisponibles}
              value={selectedConcesionId}
              onChange={setSelectedConcesionId}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-300 font-medium mb-1",
              }}
            />

            {concesionesDisponibles.length === 0 && !loading && (
              <Text size="xs" color="dimmed" className="italic text-zinc-500">
                Todas las concesiones activas del sistema ya están asociadas a este proveedor o no existen concesiones registradas. Use la opción &quot;Crear Nueva Concesión&quot;.
              </Text>
            )}

            <Group justify="flex-end" gap="md" mt="lg">
              <Button
                variant="subtle"
                color="gray"
                onClick={onClose}
                radius="lg"
                disabled={loading}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                Cancelar
              </Button>
              <Button
                loading={loading}
                disabled={!selectedConcesionId}
                onClick={handleAsociarExistente}
                radius="lg"
                leftSection={<IconLink size={16} />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-6"
              >
                Asociar a Proveedor
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md" className="py-2">
            <Text size="xs" className="text-zinc-400">
              Complete los datos para registrar una nueva concesión en el sistema y vincularla inmediatamente a este proveedor:
            </Text>
            <RegistroConcesion
              onCancel={onClose}
              onSuccess={handleCrearYAsociar}
            />
          </Stack>
        )}
      </Stack>
    </ModalEstandar>
  );
};
