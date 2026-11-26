import { useCallback, useEffect, useMemo, useState } from "react";
import { IconUserPlus } from "@tabler/icons-react";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_Visitante } from "../../service/responses/auxiliar-visitas";
import { ModalRegistroVisitante } from "./modal-registro-visitante";
import { BotonIcono, CampoSeleccion } from "./ui-tsx";

export interface VisitanteFormValue {
  id_visitante?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string | null;
}

export interface SelectVisitanteProps {
  /** Valor seleccionado actualmente (id_visitante). */
  value?: number | null;
  /** Llamado cuando se selecciona un visitante existente o se crea uno nuevo. */
  onChange: (visitante: VisitanteFormValue) => void;
  /** Label opcional. */
  label?: string;
  /** Placeholder del input. */
  placeholder?: string;
  /** Mostrar el botón "+ Nuevo" al lado del select. Default true. */
  showCreateButton?: boolean;
  /** Mostrar teléfono como parte del label. */
  showPhone?: boolean;
  /** Ancho completo. */
  w?: number | string;
}

/**
 * Select reutilizable para seleccionar un Visitante existente.
 * - Permite buscar por nombre, apellido o DNI.
 * - Muestra un botón "+ Nuevo" al lado para crear un visitante en línea.
 * - Devuelve los datos completos del visitante seleccionado.
 */
export const SelectVisitante = ({
  value,
  onChange,
  label = "Visitante",
  placeholder = "Buscar por nombre o DNI...",
  showCreateButton = true,
  showPhone = false,
  w,
}: SelectVisitanteProps) => {
  const [visitantes, setVisitantes] = useState<RES_Visitante[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const { notifyError } = useNotify();

  const cargar = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const lista = await AuxService.get_visitantes(q.trim() || undefined);
        setVisitantes(lista);
      } catch (e) {
        console.error(e);
        notifyError("No se pudieron cargar los visitantes");
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  useEffect(() => {
    cargar("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `opciones` deriva de la lista completa para que el select muestre la
  // etiqueta del visitante recién creado (sin refetch).
  const opciones = useMemo(() => {
    return visitantes.map((v) => {
      const nombreCompleto = [v.nombre, v.apellido].filter(Boolean).join(" ");
      const dniStr = v.dni ? ` (${v.dni})` : "";
      const telStr = showPhone && v.telefono ? ` · ${v.telefono}` : "";
      return {
        value: String(v.id_visitante),
        label: `${nombreCompleto}${dniStr}${telStr}`,
      };
    });
  }, [visitantes, showPhone]);

  const handleVisitanteCreado = (v: RES_Visitante) => {
    setModalCrearAbierto(false);
    // Prepend el visitante nuevo al state local para que el select lo muestre
    // de inmediato, sin refetch ni esperar al próximo `cargar`.
    setVisitantes((prev) => [v, ...prev]);
    onChange({
      id_visitante: v.id_visitante,
      nombre: v.nombre,
      apellido: v.apellido ?? "",
      dni: v.dni ?? "",
      telefono: v.telefono ?? null,
    });
  };

  const seleccionar = (val: string | null) => {
    if (val === null) {
      onChange({
        id_visitante: undefined,
        nombre: "",
        apellido: "",
        dni: "",
        telefono: null,
      });
      return;
    }

    const id = Number(val);
    const v = visitantes.find((x) => x.id_visitante === id);
    if (v) {
      onChange({
        id_visitante: v.id_visitante,
        nombre: v.nombre,
        apellido: v.apellido ?? "",
        dni: v.dni ?? "",
        telefono: v.telefono ?? null,
      });
    }
  };

  return (
    <>
      <div className="flex items-end gap-2">
        <div
          className="min-w-0 flex-1"
          style={w ? { width: typeof w === "number" ? `${w}px` : w } : undefined}
        >
          <CampoSeleccion
            label={label}
            placeholder={loading ? "Buscando..." : placeholder}
            opciones={opciones}
            valor={value != null ? String(value) : null}
            onChange={seleccionar}
            onBusqueda={(texto) => void cargar(texto)}
            buscable
          />
        </div>

        {showCreateButton ? (
          <BotonIcono
            etiqueta="Crear nuevo visitante"
            color="indigo"
            onClick={() => setModalCrearAbierto(true)}
            className="h-11 w-11 shrink-0 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            <IconUserPlus size={18} />
          </BotonIcono>
        ) : null}
      </div>

      <ModalRegistroVisitante
        opened={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onCreated={handleVisitanteCreado}
      />
    </>
  );
};
