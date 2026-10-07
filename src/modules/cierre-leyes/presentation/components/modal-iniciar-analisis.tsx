import { useEffect, useRef, useState } from "react";
import { Loader, Text, Center, Select, Button, Checkbox } from "@mantine/core";
import { PlayIcon } from "@heroicons/react/24/outline";
import { useNotify } from "../../../../hooks/useNotify";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import { EstadoLeyes } from "../../../../shared/enums/_generic/estado-leyes";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalIniciarAnalisisProps {
  opened: boolean;
  onClose: () => void;
  onIniciarExito?: () => void;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

export const ModalIniciarAnalisis = ({ opened, onClose, onIniciarExito, ctrl }: ModalIniciarAnalisisProps) => {
  const { notifyError } = useNotify();

  const [esMuestraExterna, setEsMuestraExterna] = useState(false);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string | null>(null);
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string | null>(null);

  // Bloqueo local INMEDIATO contra doble/triple-click: useState es async hasta el siguiente render,
  // useRef se actualiza al instante, evitando N llamadas paralelas al backend.
  const enProgresoRef = useRef(false);

  // Al abrir, recargar sugeridos + proveedores y limpiar selección.
  useEffect(() => {
    if (opened) {
      setEsMuestraExterna(false);
      setLoteSeleccionadoId(null);
      setProveedorSeleccionadoId(null);
      enProgresoRef.current = false;
      void ctrl.cargarLotesSugeridos();
      void ctrl.cargarProveedores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // Autoseleccionar el primer lote cuando carguen los sugeridos (solo modo lote).
  useEffect(() => {
    if (!esMuestraExterna && ctrl.lotesSugeridos.length > 0 && !loteSeleccionadoId) {
      setLoteSeleccionadoId(String(ctrl.lotesSugeridos[0].id));
    }
    if (esMuestraExterna) {
      setLoteSeleccionadoId(null);
    }
  }, [ctrl.lotesSugeridos, loteSeleccionadoId, esMuestraExterna]);

  const handleIniciar = async () => {
    if (enProgresoRef.current) return;
    enProgresoRef.current = true;
    try {
      if (esMuestraExterna) {
        if (!proveedorSeleccionadoId) {
          notifyError("Selecciona un proveedor minero para iniciar la muestra externa.");
          return;
        }
        const ok = await ctrl.iniciarMuestraExterna(Number(proveedorSeleccionadoId));
        if (ok) {
          onIniciarExito?.();
          onClose();
        }
        return;
      }

      if (!loteSeleccionadoId) {
        notifyError("Selecciona un lote para iniciar el análisis.");
        return;
      }
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
    } finally {
      enProgresoRef.current = false;
    }
  };

  const opcionesLote = ctrl.lotesSugeridos.map((l) => ({
    value: String(l.id),
    label: l.correlativo,
  }));

  const opcionesProveedor = ctrl.proveedores.map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  const iniciando =
    enProgresoRef.current ||
    (esMuestraExterna && ctrl.iniciandoMuestraExterna) ||
    (!esMuestraExterna && ctrl.iniciandoLoteSugeridoId !== null);

  const title = esMuestraExterna ? "Agregar muestra" : "Iniciar análisis";

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={title}
      size="md"
      rightSection={
        <Checkbox
          label="Muestra externa"
          size="xs"
          color="indigo"
          checked={esMuestraExterna}
          onChange={(e) => setEsMuestraExterna(e.currentTarget.checked)}
          classNames={{
            label: "text-zinc-300 font-medium text-xs cursor-pointer select-none",
            input: "bg-zinc-950 border-zinc-700 cursor-pointer",
          }}
        />
      }
    >
      <div className="space-y-4">
        {esMuestraExterna ? (
          <>
            <Text size="xs" className="text-zinc-400 font-medium">
              Selecciona el proveedor minero al que pertenece la muestra. Se generará
              un correlativo <span className="text-indigo-300 font-mono">RC-NN</span> sin
              reinicio de tiempo.
            </Text>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <Select
                  placeholder={ctrl.loadingProveedores ? "Cargando proveedores..." : "Seleccione un proveedor..."}
                  data={opcionesProveedor}
                  value={proveedorSeleccionadoId}
                  onChange={setProveedorSeleccionadoId}
                  searchable
                  size="xs"
                  radius="lg"
                  disabled={ctrl.loadingProveedores}
                  rightSection={ctrl.loadingProveedores ? <Loader size={16} /> : undefined}
                  comboboxProps={{ withinPortal: true }}
                  classNames={{
                    input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all rounded-xl h-[40px] font-semibold text-sm",
                    option: "hover:bg-zinc-800 focus:bg-zinc-800",
                  }}
                />
              </div>
              <Button
                onClick={handleIniciar}
                disabled={!proveedorSeleccionadoId || iniciando}
                loading={iniciando}
                leftSection={<PlayIcon className="w-4 h-4 text-emerald-400" />}
                radius="lg"
                size="xs"
                className="bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-700/60 text-emerald-400 font-semibold h-10 px-5 rounded-xl transition-all disabled:opacity-50"
              >
                Agregar
              </Button>
            </div>
          </>
        ) : (
          <>
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
                    data={opcionesLote}
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
                  className="bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-700/60 text-emerald-400 font-semibold h-10 px-5 rounded-xl transition-all disabled:opacity-50"
                >
                  Iniciar
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ModalEstandar>
  );
};
