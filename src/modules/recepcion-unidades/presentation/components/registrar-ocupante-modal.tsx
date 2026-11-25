import { useState, type FormEvent } from "react";
import { IconFileUpload, IconUserCheck } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { Boton, Casilla } from "../../../../presentation/utils/ui-tsx";
import { SelectVisitante } from "../../../../presentation/utils/select-visitante";

export interface DatosOcupanteSlot {
  nombre: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  es_conductor?: boolean;
  foto_documento?: File[];
  id_visitante?: number;
}

interface Props {
  opened: boolean;
  placaVehiculo?: string;
  numeroSlot?: number;
  datosIniciales?: DatosOcupanteSlot | null;
  onClose: () => void;
  onGuardar: (datos: DatosOcupanteSlot) => void;
}

export const RegistrarOcupanteModal = ({
  opened,
  placaVehiculo,
  numeroSlot,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [apellido, setApellido] = useState(datosIniciales?.apellido ?? "");
  const [dni, setDni] = useState(datosIniciales?.dni ?? "");
  const [telefono, setTelefono] = useState(datosIniciales?.telefono ?? "");
  const [esConductor, setEsConductor] = useState(
    Boolean(datosIniciales?.es_conductor),
  );
  const [fotos, setFotos] = useState<File[]>(
    datosIniciales?.foto_documento ?? [],
  );
  const [idVisitante, setIdVisitante] = useState<number | undefined>(
    datosIniciales?.id_visitante,
  );

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (prevProps.datosIniciales !== datosIniciales || prevProps.opened !== opened) {
    setPrevProps({ datosIniciales, opened });
    setNombre(datosIniciales?.nombre ?? "");
    setApellido(datosIniciales?.apellido ?? "");
    setDni(datosIniciales?.dni ?? "");
    setTelefono(datosIniciales?.telefono ?? "");
    setEsConductor(Boolean(datosIniciales?.es_conductor));
    setFotos(datosIniciales?.foto_documento ?? []);
    setIdVisitante(datosIniciales?.id_visitante);
  }

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    onGuardar({
      nombre: nombre.trim() || "VISITANTE",
      apellido: apellido.trim() || undefined,
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      es_conductor: esConductor,
      foto_documento: fotos,
      id_visitante: idVisitante,
    });

    handleClose();
  };

  return (
    <ModalTsx
      opened={opened}
      onClose={handleClose}
      title={`Ocupante ${String.fromCharCode(
        65 + Math.max(0, (numeroSlot ?? 1) - 1),
      )} - Vehículo ${placaVehiculo ?? ""}`}
      ancho="md"
      validateClose
      footer={
        <div className="flex items-center justify-end gap-2">
          <Boton
            variante="fantasma"
            onClick={handleClose}
            className="px-3 text-zinc-400 hover:text-white"
          >
            Cancelar
          </Boton>
          <Boton
            type="submit"
            form="form-registrar-ocupante"
            variante="primario"
          >
            <IconUserCheck size={14} />
            Guardar Ocupante
          </Boton>
        </div>
      }
    >
      <form
        id="form-registrar-ocupante"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <p className="text-xs text-zinc-500">
          Completa la información del ocupante de este vehículo acompañante.
        </p>

        <SelectVisitante
          label="Visitante"
          placeholder="Buscar por nombre o DNI..."
          value={idVisitante ?? null}
          onChange={(v) => {
            setIdVisitante(v.id_visitante);
            setNombre(v.nombre);
            setApellido(v.apellido);
            setDni(v.dni);
            setTelefono(v.telefono ?? "");
          }}
        />

        <Casilla
          label="¿Es Conductor de este Vehículo Acompañante?"
          checked={esConductor}
          onChange={(e) => setEsConductor(e.currentTarget.checked)}
        />

        <div className="border-t border-zinc-800 pt-3">
          <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700">
            <IconFileUpload size={14} />
            {fotos.length > 0
              ? `${fotos.length} foto(s) seleccionada(s)`
              : "Adjuntar Foto / Doc."}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => setFotos(Array.from(e.currentTarget.files ?? []))}
            />
          </label>
        </div>
      </form>
    </ModalTsx>
  );
};
