import { useEffect, useState } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { Boton } from "../../../../presentation/utils/ui-tsx";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  /** Campo de fecha a editar. */
  campo: "fecha_hora_ingreso" | "fecha_hora_salida";
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/** "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM" (formato del input nativo). */
const aInputDateTime = (valor: string | null): string => {
  if (!valor) return "";
  const normalizado = valor.replace(" ", "T");
  return normalizado.length >= 16 ? normalizado.slice(0, 16) : normalizado;
};

/** "YYYY-MM-DDTHH:MM" → "YYYY-MM-DD HH:MM:SS" (formato de la BD). */
const aBackendDateTime = (valor: string): string | null => {
  if (!valor) return null;
  const normalizado = valor.replace("T", " ");
  return normalizado.length === 16 ? `${normalizado}:00` : normalizado;
};

/**
 * Edición de la fecha y hora de ingreso o de salida de una unidad.
 *
 * Usa el `<input type="datetime-local">` nativo: en Android abre el
 * selector de fecha y hora del propio sistema, que es lo que el operador
 * espera en planta.
 */
export const ModalEditarFechas = ({
  opened,
  recepcion,
  campo,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  const esIngreso = campo === "fecha_hora_ingreso";
  const titulo = esIngreso ? "Fecha y hora de ingreso" : "Fecha y hora de salida";

  // Precarga al abrir.
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevRecepcionId, setPrevRecepcionId] = useState(recepcion?.id ?? null);

  if (opened !== prevAbierto || (recepcion?.id ?? null) !== prevRecepcionId) {
    setPrevAbierto(opened);
    setPrevRecepcionId(recepcion?.id ?? null);

    if (opened && recepcion) {
      setValor(aInputDateTime(recepcion[campo] ?? null));
    }
  }

  // Al cerrar se descarta lo capturado.
  useEffect(() => {
    if (opened) return;
    setValor("");
  }, [opened]);

  if (!recepcion) return null;

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const actualizada = await RecepcionUnidadesService.actualizarCampos(
        recepcion.id,
        { campos: { [campo]: aBackendDateTime(valor) } },
      );
      notifySuccess(
        esIngreso
          ? "Fecha y hora de ingreso actualizada"
          : "Fecha y hora de salida actualizada",
      );
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar la fecha de la recepción.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalTsx
      opened={opened && recepcion !== null}
      onClose={onClose}
      title={titulo}
      ancho="sm"
      validateClose
      compacto
      footer={
        <div className="flex items-center justify-end gap-2">
          <Boton
            variante="fantasma"
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            onClick={() => void handleGuardar()}
            cargando={loading}
          >
            <IconDeviceFloppy size={18} />
            Guardar
          </Boton>
        </div>
      }
    >
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-300">
          {titulo}
        </label>
        <input
          type="datetime-local"
          value={valor}
          disabled={loading}
          onChange={(e) => setValor(e.currentTarget.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-base text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-zinc-500">
          Al vaciar la fecha de salida, la unidad vuelve a estado "En Planta".
        </p>
      </div>
    </ModalTsx>
  );
};
