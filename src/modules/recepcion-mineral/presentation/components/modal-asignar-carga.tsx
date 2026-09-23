import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import { useAsignarCarga } from "../../hooks/useAsignarCarga";
import type {
  DistribucionDetalleItem,
} from "../../../programacion-despachos/service/programacion-despachos.responses";

interface Props {
  opened: boolean;
  onClose: () => void;
  idDistribucion: number;
  onAsignado: (detalle: DistribucionDetalleItem) => void;
}

export const ModalAsignarCarga = ({
  opened,
  onClose,
  idDistribucion,
  onAsignado,
}: Props) => {
  const { notifyError, notifySuccess } = useNotify();
  const ctrl = useAsignarCarga(idDistribucion);

  // Mapa id_despacho_detalle -> peso a tomar (KG). Inicializa con peso_actual.
  const [pesos, setPesos] = useState<Record<number, number>>({});
  // Set de ids DESMARCADOS por el usuario. Por defecto todos los lotes están
  // seleccionados (el modal soporta asignación masiva y se asume "todo por defecto").
  const [deseleccionados, setDeseleccionados] = useState<Set<number>>(new Set());
  const [asignandoMasivo, setAsignandoMasivo] = useState(false);

  useEffect(() => {
    if (!opened) {
      setPesos({});
      setDeseleccionados(new Set());
      ctrl.reset();
      return;
    }
    ctrl.cargarLotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // Cada vez que llegan lotes, autocompletar el peso con peso_actual.
  useEffect(() => {
    if (ctrl.lotesDisponibles.length > 0) {
      setPesos((prev) => {
        const next = { ...prev };
        for (const l of ctrl.lotesDisponibles) {
          if (next[l.id] === undefined) {
            next[l.id] = Number(l.peso_actual ?? 0);
          }
        }
        return next;
      });
    }
  }, [ctrl.lotesDisponibles]);

  const cantidadSeleccionados = ctrl.lotesDisponibles.filter(
    (l) => !deseleccionados.has(l.id),
  ).length;

  const toggleSeleccion = (id: number, checked: boolean) => {
    setDeseleccionados((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAsignarSeleccionados = async () => {
    const idsAsignar = ctrl.lotesDisponibles
      .filter((l) => !deseleccionados.has(l.id))
      .map((l) => l.id);
    if (idsAsignar.length === 0) {
      notifyError("Selecciona al menos un lote.");
      return;
    }
    setAsignandoMasivo(true);
    let exitosos = 0;
    let errores = 0;

    // Asignar en serie para no saturar el backend y mantener orden.
    for (const id of idsAsignar) {
      const lote = ctrl.lotesDisponibles.find((l) => l.id === id);
      if (!lote) continue;
      const numPeso = Number(pesos[id] ?? 0);
      if (numPeso <= 0 || numPeso > Number(lote.peso_actual ?? 0) + 0.0001) {
        errores++;
        continue;
      }
      const detalle = await ctrl.asignar(id, numPeso);
      if (detalle) {
        exitosos++;
        onAsignado(detalle);
        setPesos((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        errores++;
      }
    }

    setAsignandoMasivo(false);
    setDeseleccionados(new Set());

    if (exitosos > 0) {
      notifySuccess(
        `Se asignaron ${exitosos} carga${exitosos > 1 ? "s" : ""}${errores > 0 ? ` (${errores} con error)` : ""}.`,
      );
      // Cerrar el modal apenas hubo al menos un éxito: los detalles ya quedan
      // reflejados en el card del padre vía `onAsignado`, sin recargar la página.
      onClose();
    }
    if (errores > 0 && exitosos === 0) {
      notifyError("No se pudo asignar ninguna carga.");
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Asignar Carga a la Distribución"
      size="xl"
    >
      <Stack gap="sm" mt="xs">
        <Box>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={700} c="amber.4" tt="uppercase">
              Lotes disponibles en el despacho
            </Text>
            {ctrl.loadingLotes && <Loader size={12} color="indigo" />}
          </Group>

          {ctrl.loadingLotes ? (
            <Box className="flex items-center justify-center py-6 gap-2 border border-zinc-800 rounded-md bg-zinc-900/30">
              <Loader size="sm" color="indigo" />
              <Text fz="xs" c="dimmed">Cargando lotes...</Text>
            </Box>
          ) : ctrl.lotesDisponibles.length === 0 ? (
            <Box className="py-6 text-center border border-dashed border-zinc-800 rounded-md bg-zinc-900/30">
              <Text fz="xs" c="dimmed">
                No hay más lotes disponibles para asignar.
              </Text>
            </Box>
          ) : (
            <Stack gap={6}>
              {ctrl.lotesDisponibles.map((l) => {
                const esLote = l.tipo_item === "LOTE";
                const disp = Number(l.peso_actual ?? 0);
                const checked = !deseleccionados.has(l.id);
                return (
                  <Box
                    key={l.id}
                    className={`grid grid-cols-12 gap-2 items-center border rounded-md p-2.5 transition-colors ${
                      checked
                        ? "border-indigo-500/60 bg-indigo-500/5"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-indigo-500/40"
                    }`}
                  >
                    <Box className="col-span-1 flex justify-center">
                      <Checkbox
                        checked={checked}
                        onChange={(e) =>
                          toggleSeleccion(l.id, e.currentTarget.checked)
                        }
                        disabled={ctrl.loading || asignandoMasivo}
                        size="md"
                        color="indigo"
                        aria-label={`Seleccionar ${l.lote_correlativo ?? l.blending_correlativo ?? l.id}`}
                      />
                    </Box>

                    <Box className="col-span-4 min-w-0">
                      <Group gap={6} wrap="nowrap" mb={1}>
                        <Badge
                          color={esLote ? "yellow" : "gray"}
                          variant="filled"
                          size="xs"
                          fw={700}
                        >
                          {l.tipo_item}
                        </Badge>
                        <Text fz="xs" fw={700} c="white" className="font-mono truncate">
                          {l.lote_correlativo ?? l.blending_correlativo ?? `—`}
                        </Text>
                      </Group>
                      
                    </Box>

                    <Box className="col-span-3">
                      <Text fz={9} c="amber.3" fw={700} tt="uppercase">
                        Pendiente
                      </Text>
                      <Text fz="xs" c="amber.3" fw={800} className="font-mono">
                        {disp.toFixed(3)} KG
                      </Text>
                    </Box>

                    <NumberInput
                      className="col-span-4"
                      label={checked ? "Peso a tomar" : "Peso a tomar (no marcado)"}
                      suffix=" KG"
                      placeholder="0.000"
                      min={0}
                      max={disp || undefined}
                      decimalScale={3}
                      fixedDecimalScale
                      hideControls
                      value={pesos[l.id] ?? disp}
                      onChange={(val) =>
                        setPesos((prev) => ({
                          ...prev,
                          [l.id]:
                            typeof val === "number" ? val : parseFloat(String(val)) || 0,
                        }))
                      }
                      disabled={ctrl.loading || asignandoMasivo}
                      size="xs"
                      radius="md"
                    />
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        <Group justify="end" gap="xs" mt="xs">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            radius="lg"
            size="xs"
            disabled={ctrl.loading || asignandoMasivo}
          >
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleAsignarSeleccionados}
            loading={asignandoMasivo}
            disabled={
              ctrl.loading ||
              asignandoMasivo ||
              cantidadSeleccionados === 0 ||
              ctrl.lotesDisponibles.length === 0
            }
            radius="lg"
            size="xs"
            leftSection={<IconCheck size={14} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Asignar Seleccionados ({cantidadSeleccionados})
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
