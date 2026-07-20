import { useEffect, useState } from "react";
import { Loader, Text, Center, Select, Button } from "@mantine/core";
import { PlayIcon } from "@heroicons/react/24/outline";
import { useNotify } from "../../../../hooks/useNotify";
import { useCierreLeyes } from "../../hooks/useCierreLeyes";
import { EstadoLeyes } from "../../../../shared/enums/_generic/estado-leyes";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalIniciarAnalisisProps {
  opened: boolean;
  onClose: () => void;
  onIniciarExito?: () => void;
}

export const ModalIniciarAnalisis = ({ opened, onClose, onIniciarExito }: ModalIniciarAnalisisProps) => {
  const { notifyError } = useNotify();
  const ctrl = useCierreLeyes();

  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string | null>(null);

  // Al abrir, recargar sugeridos y limpiar selección.
  useEffect(() => {
    if (opened) {
      setLoteSeleccionadoId(null);
      void ctrl.cargarLotesSugeridos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // Autoseleccionar el primer lote cuando carguen los sugeridos
  useEffect(() => {
    if (ctrl.lotesSugeridos.length > 0 && !loteSeleccionadoId) {
      setLoteSeleccionadoId(String(ctrl.lotesSugeridos[0].id));
    }
  }, [ctrl.lotesSugeridos, loteSeleccionadoId]);

  const handleIniciar = async () => {
    if (!loteSeleccionadoId) return;
    const loteId = Number(loteSeleccionadoId);
    const lote = ctrl.lotesSugeridos.find((l) => l.id === loteId);

    if (lote && lote.estado_leyes && lote.estado_leyes !== EstadoLeyes.Pendiente) {
      notifyError("Solo se pueden iniciar análisis sobre lotes en estado Pendiente.");
      return;
    }
    const ok = await ctrl.iniciarLote(loteId);
    if (ok) {
      onIniciarExito?.();
      onClose();
    }
  };

  const opcionesSelect = ctrl.lotesSugeridos.map((l) => ({
    value: String(l.id),
    label: l.correlativo,
  }));

  const iniciando = ctrl.iniciandoLoteSugeridoId !== null;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Iniciar análisis"
      size="sm"
    >
      <div className="space-y-4">
        <Text size="xs" className="text-zinc-400 font-medium">
          Selecciona un lote de la lista para iniciar su cierre de leyes:
        </Text>

        {ctrl.loadingSugeridos && ctrl.lotesSugeridos.length === 0 ? (
          <Center className="py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader color="indigo" size="sm" />
              <Text size="xs" className="text-zinc-500">Cargando lotes...</Text>
            </div>
          </Center>
        ) : ctrl.lotesSugeridos.length === 0 ? (
          <Center className="py-8">
            <Text size="xs" className="text-zinc-500">No hay lotes pendientes disponibles.</Text>
          </Center>
        ) : (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <Select
                placeholder="Seleccione un lote..."
                data={opcionesSelect}
                value={loteSeleccionadoId}
                onChange={setLoteSeleccionadoId}
                searchable
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                classNames={{
                  input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all rounded-xl h-[40px] font-semibold text-sm",
                  option: "hover:bg-zinc-800 focus:bg-zinc-800",
                }}
              />
            </div>
            <Button
              onClick={handleIniciar}
              disabled={!loteSeleccionadoId || iniciando}
              loading={iniciando}
              leftSection={<PlayIcon className="w-4 h-4 text-emerald-400" />}
              radius="lg"
              size="xs"
              className="bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-700/60 text-emerald-400 font-semibold h-[40px] px-5 rounded-xl transition-all disabled:opacity-50"
            >
              Iniciar
            </Button>
          </div>
        )}
      </div>
    </ModalEstandar>
  );
};
