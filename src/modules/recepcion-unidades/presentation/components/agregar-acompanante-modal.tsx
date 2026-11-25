import { useState, type FormEvent } from "react";
import { IconFileUpload, IconUserCheck } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import { Boton } from "../../../../presentation/utils/ui-tsx";
import { SelectVisitante } from "../../../../presentation/utils/select-visitante";

export interface DatosAcompananteForm {
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
  datosIniciales?: DatosAcompananteForm | null;
  onClose: () => void;
  onGuardar: (datos: DatosAcompananteForm) => void;
}

export const AgregarAcompananteModal = ({
  opened,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [apellido, setApellido] = useState(datosIniciales?.apellido ?? "");
  const [dni, setDni] = useState(datosIniciales?.dni ?? "");
  const [telefono, setTelefono] = useState(datosIniciales?.telefono ?? "");
  const [fotos, setFotos] = useState<File[]>(
    datosIniciales?.foto_documento ?? [],
  );
  const [idVisitante, setIdVisitante] = useState<number | undefined>(
    datosIniciales?.id_visitante,
  );

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (
    prevProps.datosIniciales !== datosIniciales ||
    prevProps.opened !== opened
  ) {
    setPrevProps({ datosIniciales, opened });
    setNombre(datosIniciales?.nombre ?? "");
    setApellido(datosIniciales?.apellido ?? "");
    setDni(datosIniciales?.dni ?? "");
    setTelefono(datosIniciales?.telefono ?? "");
    setFotos(datosIniciales?.foto_documento ?? []);
    setIdVisitante(datosIniciales?.id_visitante);
  }

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim()) {
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      es_conductor: false,
      foto_documento: fotos,
      id_visitante: idVisitante,
    });

    handleClose();
  };

  const isEditing = Boolean(datosIniciales);

  return (
    <ModalTsx
      opened={opened}
      onClose={handleClose}
      title={isEditing ? "Editar Acompañante" : "Agregar Acompañante"}
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
            form="form-agregar-acompanante"
            variante="primario"
          >
            <IconUserCheck size={14} />
            {isEditing ? "Actualizar Acompañante" : "Guardar Acompañante"}
          </Boton>
        </div>
      }
    >
      <form
        id="form-agregar-acompanante"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
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
