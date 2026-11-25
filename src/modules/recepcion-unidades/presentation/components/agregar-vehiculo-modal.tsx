import { useState, type FormEvent } from "react";
import { IconFileUpload, IconTruck } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  Boton,
  CampoNumero,
  CampoTexto,
} from "../../../../presentation/utils/ui-tsx";

export interface DatosVehiculoForm {
  placa: string;
  fotos?: File[];
  cantidadPersonas: number;
}

interface Props {
  opened: boolean;
  datosIniciales?: DatosVehiculoForm | null;
  onClose: () => void;
  onGuardar: (
    placa: string,
    archivosVehiculo: File[],
    cantidadPersonas: number,
  ) => void;
}

const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const AgregarVehiculoModal = ({
  opened,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [placa, setPlaca] = useState(datosIniciales?.placa ?? "");
  const [fotosVehiculo, setFotosVehiculo] = useState<File[]>(
    datosIniciales?.fotos ?? [],
  );
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(
    datosIniciales?.cantidadPersonas ?? 1,
  );
  const [errorPlaca, setErrorPlaca] = useState<string | null>(null);

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (prevProps.datosIniciales !== datosIniciales || prevProps.opened !== opened) {
    setPrevProps({ datosIniciales, opened });
    setPlaca(datosIniciales?.placa ?? "");
    setFotosVehiculo(datosIniciales?.fotos ?? []);
    setCantidadPersonas(datosIniciales?.cantidadPersonas ?? 1);
    setErrorPlaca(null);
  }

  const handleClose = () => {
    setErrorPlaca(null);
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!placa.trim()) {
      setErrorPlaca("La placa del vehículo es obligatoria.");
      return;
    }

    onGuardar(
      formatPlaca(placa),
      fotosVehiculo,
      Math.max(1, cantidadPersonas || 1),
    );
    handleClose();
  };

  const isEditing = Boolean(datosIniciales);

  return (
    <ModalTsx
      opened={opened}
      onClose={handleClose}
      title={
        isEditing
          ? "Editar Vehículo Acompañante"
          : "Agregar Vehículo Acompañante"
      }
      ancho="sm"
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
            form="form-agregar-vehiculo"
            variante="primario"
          >
            <IconTruck size={14} />
            {isEditing ? "Actualizar Vehículo" : "Guardar Vehículo"}
          </Boton>
        </div>
      }
    >
      <form
        id="form-agregar-vehiculo"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <p className="text-xs text-zinc-500">
          Ingresa o actualiza la información del vehículo acompañante y la
          cantidad de personas que viajan en él.
        </p>

        <CampoTexto
          label="Placa del Vehículo"
          placeholder="Ej. ABC-123"
          requerido
          maxLength={7}
          value={placa}
          onChange={(e) => {
            setPlaca(formatPlaca(e.target.value));
            if (errorPlaca) setErrorPlaca(null);
          }}
          error={errorPlaca ?? undefined}
          className="font-mono uppercase tracking-wider"
        />

        <CampoNumero
          label="Cantidad de personas en el vehículo"
          min={1}
          max={50}
          value={cantidadPersonas}
          onChange={(e) => {
            const raw = e.currentTarget.value;
            setCantidadPersonas(raw === "" ? 1 : Number(raw));
          }}
        />

        <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700">
          <IconFileUpload size={16} />
          {fotosVehiculo.length > 0
            ? `${fotosVehiculo.length} foto(s) seleccionada(s)`
            : "Adjuntar Fotos Vehículo"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => setFotosVehiculo(Array.from(e.currentTarget.files ?? []))}
          />
        </label>
      </form>
    </ModalTsx>
  );
};
