import { useMemo } from "react";
import { Button, Select } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import type { MuestraExternaResponse, LoteCierreResponse } from "../../service/cierre-leyes.responses";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalAsociarMultiplesProps {
  opened: boolean;
  onClose: () => void;
  muestras: MuestraExternaResponse[];
  seleccionadasIds: number[];
  lotesDisponibles: LoteCierreResponse[];
  loteDestinoId: string | null;
  onChangeLoteDestino: (val: string | null) => void;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
  onQuitar: (idMuestraExterna: number) => void;
}

export const ModalAsociarMultiples = ({
  opened,
  onClose,
  muestras,
  seleccionadasIds,
  lotesDisponibles,
  loteDestinoId,
  onChangeLoteDestino,
  onConfirm,
  loading,
  onQuitar,
}: ModalAsociarMultiplesProps) => {
  const seleccionadas = useMemo(
    () =>
      seleccionadasIds
        .map((id) => muestras.find((m) => m.id === id))
        .filter((m): m is MuestraExternaResponse => m != null),
    [seleccionadasIds, muestras],
  );

  const proveedoresUnicos = useMemo(
    () =>
      Array.from(
        new Set(
          seleccionadas.map(
            (m) => m.proveedor_razon_social ?? `Guest #${m.id_proveedor_minero}`,
          ),
        ),
      ),
    [seleccionadas],
  );
  const mezclaProveedores = proveedoresUnicos.length > 1;
  const idProveedorComun = mezclaProveedores
    ? null
    : (seleccionadas[0]?.id_proveedor_minero ?? null);

  const opcionesLotes = useMemo(() => {
    if (idProveedorComun == null) return [];
    return lotesDisponibles
      .filter(
        (l) => l.id_proveedor_minero !== null && l.id_proveedor_minero === idProveedorComun,
      )
      .map((l) => ({
        value: String(l.id),
        label: `${l.correlativo} (${l.estado_leyes})`,
      }));
  }, [lotesDisponibles, idProveedorComun]);

  const totalAnalisis = seleccionadas.reduce(
    (acc, m) => acc + (m.analisis?.length ?? 0),
    0,
  );
  const haySeleccion = seleccionadas.length > 0;
  const sinLotesCompatibles = opcionesLotes.length === 0;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <div className="flex items-center gap-2 text-sm!">
          <IconLink size={16} className="text-indigo-400 shrink-0" />
          <span className="text-sm! font-semibold">
            Asociar {seleccionadas.length} muestra{seleccionadas.length === 1 ? "" : "s"} externa{seleccionadas.length === 1 ? "" : "s"} a lote
          </span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {!haySeleccion && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            No hay muestras seleccionadas.
          </div>
        )}

        {mezclaProveedores && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Las muestras seleccionadas son de {proveedoresUnicos.length} proveedores distintos
            ({proveedoresUnicos.join(", ")}). Quita las que no correspondan para continuar.
          </div>
        )}

        {haySeleccion && !mezclaProveedores && (
          <div className="text-xs text-zinc-400 space-y-1.5">
            <p>
              Vas a asociar <span className="font-semibold text-indigo-300">{seleccionadas.length} muestra{seleccionadas.length === 1 ? "" : "s"}</span>{" "}
              del proveedor <span className="font-medium text-zinc-200">{proveedoresUnicos[0] ?? "—"}</span>{" "}
              a un lote del mismo proveedor. Se migrarán <span className="font-semibold">{totalAnalisis}</span> análisis en total.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {seleccionadas.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onQuitar(m.id)}
                  className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/30 border border-indigo-700/30 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
                  title={`Quitar ${m.correlativo} de la selección`}
                >
                  <span className="font-mono text-[11px] text-indigo-200 group-hover:text-rose-300 font-semibold">
                    {m.correlativo}
                  </span>
                  <span className="text-[10px] text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {haySeleccion && !mezclaProveedores && sinLotesCompatibles && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            No hay lotes disponibles del proveedor {proveedoresUnicos[0] ?? "seleccionado"}. Crea o inicia un lote del mismo proveedor antes de asociar.
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1">
            <Select
              placeholder={sinLotesCompatibles ? "No hay lotes compatibles" : "Seleccione un lote..."}
              data={opcionesLotes}
              value={loteDestinoId}
              onChange={onChangeLoteDestino}
              searchable
              size="xs"
              radius="lg"
              disabled={sinLotesCompatibles || mezclaProveedores || !haySeleccion}
              comboboxProps={{ withinPortal: true }}
              classNames={{
                input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all rounded-xl h-[40px] font-semibold text-sm",
                option: "hover:bg-zinc-800 focus:bg-zinc-800",
              }}
            />
          </div>
          <Button
            onClick={onConfirm}
            disabled={
              !loteDestinoId ||
              sinLotesCompatibles ||
              mezclaProveedores ||
              !haySeleccion ||
              loading
            }
            loading={loading}
            leftSection={<IconLink className="w-4 h-4 text-emerald-400" />}
            radius="lg"
            size="xs"
            className="bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-700/60 text-emerald-400 font-semibold h-10 px-5 rounded-xl transition-all disabled:opacity-50"
          >
            Asociar {seleccionadas.length}
          </Button>
        </div>
      </div>
    </ModalEstandar>
  );
};
