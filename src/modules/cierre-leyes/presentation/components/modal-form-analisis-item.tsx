import { useState } from "react";
import {
  Select,
  NumberInput,
  Button,
  Stack,
  Group,
  ActionIcon,
  Modal,
  Loader,
  Text,
} from "@mantine/core";
import { IconPlus, IconTestPipe } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormLaboratorio } from "../../../../presentation/utils/form-laboratorio";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { RES_Laboratorio } from "../../../../service/responses/laboratorio";
import {
  ASUMIDO_POR_FABERO,
  ASUMIDO_POR_PROVEEDOR,
  type AnalisisDraftItem,
} from "../../service/cierre-leyes.requests";

interface ModalFormAnalisisItemProps {
  opened: boolean;
  onClose: () => void;
  itemEditar: AnalisisDraftItem | null;
  numeroEnsayoSugerido: number;
  defaultOrigen: TipoOrigen;
  laboratorios: RES_Laboratorio[];
  loadingLaboratorios: boolean;
  onRecargarLaboratorios: () => Promise<void>;
  onGuardarItem: (item: AnalisisDraftItem) => void;
  /**
   * Ley de humedad/recuperación heredada (cierre del grupo o análisis previo).
   * Si `editable` es false, el grupo impone el valor y el campo se bloquea.
   */
  leyHumedadHeredada?: number | null;
  leyHumedadEditable?: boolean;
  leyRecuperacionHeredada?: number | null;
  leyRecuperacionEditable?: boolean;
  /** El grupo está en propuesta de valorización: no se pueden ingresar leyes de Au/Ag. */
  bloqueadoOro?: boolean;
  bloqueadoPlata?: boolean;
}

type FormBodyProps = Omit<ModalFormAnalisisItemProps, "opened">;

const FIELD_INPUT =
  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500";
const FIELD_LABEL = "text-zinc-300 mb-1 font-medium text-xs";

/** El origen determina por defecto quién asume el análisis; siempre editable. */
const asumidoPorPorOrigen = (origen: TipoOrigen) =>
  origen === TipoOrigen.Interno
    ? ASUMIDO_POR_FABERO
    : ASUMIDO_POR_PROVEEDOR;

const FormAnalisisItemBody = ({
  itemEditar,
  numeroEnsayoSugerido,
  defaultOrigen,
  laboratorios,
  loadingLaboratorios,
  onRecargarLaboratorios,
  onGuardarItem,
  onClose,
  leyHumedadHeredada = 0,
  leyHumedadEditable = true,
  leyRecuperacionHeredada = 0,
  leyRecuperacionEditable = true,
  bloqueadoOro = false,
  bloqueadoPlata = false,
}: FormBodyProps) => {
  const [idLaboratorio, setIdLaboratorio] = useState<string | null>(() => {
    if (itemEditar?.id_laboratorio) return String(itemEditar.id_laboratorio);
    return null;
  });
  /** El laboratorio es opcional: si el usuario lo limpia, no se vuelve a sugerir. */
  const [laboratorioElegido, setLaboratorioElegido] = useState(false);
  const [nombreLabManual, setNombreLabManual] = useState<string | null>(
    itemEditar?.laboratorio_nombre ?? null,
  );
  const [tipoOrigen, setTipoOrigen] = useState<TipoOrigen>(
    itemEditar?.tipo_origen ?? defaultOrigen,
  );
  const [asumidoPor, setAsumidoPor] = useState<string>(
    itemEditar?.asumido_por ?? asumidoPorPorOrigen(defaultOrigen),
  );
  const [numeroEnsayo, setNumeroEnsayo] = useState<number>(
    itemEditar?.numero_ensayo ?? numeroEnsayoSugerido,
  );
  const [archivos, setArchivos] = useState<File[]>(
    itemEditar?.documentos ?? [],
  );

  const [leyOro, setLeyOro] = useState<number | string>(
    itemEditar?.ley_oro ?? "",
  );
  const [leyPlata, setLeyPlata] = useState<number | string>(
    itemEditar?.ley_plata ?? "",
  );
  const [leyHumedad, setLeyHumedad] = useState<number | string>(() => {
    if (typeof itemEditar?.ley_humedad === "number") return itemEditar.ley_humedad;
    const heredada = leyHumedadHeredada ?? 0;
    return heredada > 0 ? heredada : "";
  });
  const [leyRecuperacion, setLeyRecuperacion] = useState<number | string>(() => {
    if (typeof itemEditar?.ley_recuperacion === "number")
      return itemEditar.ley_recuperacion;
    const heredada = leyRecuperacionHeredada ?? 0;
    return heredada > 0 ? heredada : "";
  });

  const [modalLabAbierto, setModalLabAbierto] = useState(false);
  const [nuevoLabNombre, setNuevoLabNombre] = useState("");
  const [nuevoLabRuc, setNuevoLabRuc] = useState("");

  // El laboratorio es opcional: se sugiere el primero disponible mientras el
  // usuario no lo haya elegido ni lo haya limpiado explícitamente.
  const resolvedIdLab = laboratorioElegido
    ? idLaboratorio
    : (idLaboratorio ??
      (laboratorios.length > 0 ? String(laboratorios[0].id) : null));

  const opcionesLaboratorios = laboratorios.map((lab) => ({
    value: String(lab.id),
    label: lab.nombre,
  }));

  /**
   * Al cambiar el origen se reasigna por defecto quién asume el análisis.
   * El usuario puede volver a cambiarlo manualmente.
   */
  const handleCambioOrigen = (valor: string | null) => {
    const nuevoOrigen = (valor as TipoOrigen) || defaultOrigen;
    setTipoOrigen(nuevoOrigen);
    setAsumidoPor(asumidoPorPorOrigen(nuevoOrigen));
  };

  const humedadImpuesta = !leyHumedadEditable;
  const recuperacionImpuesta = !leyRecuperacionEditable;

  const handleGuardar = () => {
    const labEncontrado = laboratorios.find((l) => String(l.id) === resolvedIdLab);
    const laboratorioNombre = resolvedIdLab
      ? labEncontrado?.nombre || nombreLabManual || `Laboratorio #${resolvedIdLab}`
      : "";

    const aNumero = (v: number | string) =>
      typeof v === "number" && !Number.isNaN(v) ? v : null;

    onGuardarItem({
      localId: itemEditar?.localId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      id_laboratorio: resolvedIdLab ? Number(resolvedIdLab) : null,
      laboratorio_nombre: laboratorioNombre,
      asumido_por: asumidoPor,
      numero_ensayo: numeroEnsayo > 0 ? numeroEnsayo : 1,
      tipo_origen: tipoOrigen,
      documentos: archivos,
      ley_oro: bloqueadoOro ? null : aNumero(leyOro),
      ley_plata: bloqueadoPlata ? null : aNumero(leyPlata),
      ley_humedad: humedadImpuesta ? null : aNumero(leyHumedad),
      ley_recuperacion: recuperacionImpuesta ? null : aNumero(leyRecuperacion),
    });
    onClose();
  };

  return (
    <>
      <Stack gap="sm">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <Select
            label="Laboratorio"
            placeholder={
              loadingLaboratorios
                ? "Cargando..."
                : resolvedIdLab
                  ? "Selecciona laboratorio"
                  : "Opcional"
            }
            data={opcionesLaboratorios}
            value={resolvedIdLab}
            onChange={(val) => {
              setIdLaboratorio(val);
              setLaboratorioElegido(true);
              setNombreLabManual(null);
            }}
            searchable
            clearable
            disabled={loadingLaboratorios}
            rightSection={loadingLaboratorios ? <Loader size={14} /> : undefined}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
          <ActionIcon
            size="lg"
            radius="lg"
            variant="light"
            color="indigo"
            onClick={() => {
              setNuevoLabNombre("");
              setNuevoLabRuc("");
              setModalLabAbierto(true);
            }}
            title="Registrar nuevo laboratorio"
          >
            <IconPlus size={16} />
          </ActionIcon>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Select
            label="Origen"
            data={[
              { value: TipoOrigen.Interno, label: "Interno" },
              { value: TipoOrigen.Externo, label: "Externo" },
            ]}
            value={tipoOrigen}
            onChange={handleCambioOrigen}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />

          <Select
            label="Asumido Por"
            data={[
              { value: ASUMIDO_POR_PROVEEDOR, label: ASUMIDO_POR_PROVEEDOR },
              { value: ASUMIDO_POR_FABERO, label: ASUMIDO_POR_FABERO },
            ]}
            value={asumidoPor}
            onChange={(val) => setAsumidoPor(val || ASUMIDO_POR_PROVEEDOR)}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />

          <NumberInput
            label="N° Ensayo"
            value={numeroEnsayo}
            onChange={(val) => setNumeroEnsayo(typeof val === "number" ? val : 1)}
            min={1}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
        </div>

        {/* Leyes del ensayo (opcionales) */}
        <div className="grid grid-cols-4 gap-2.5">
          <NumberInput
            label="Ley Au"
            placeholder="0.000"
            value={leyOro}
            onChange={setLeyOro}
            min={0}
            decimalScale={3}
            fixedDecimalScale
            hideControls
            disabled={bloqueadoOro}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
          <NumberInput
            label="Ley Ag"
            placeholder="0.000"
            value={leyPlata}
            onChange={setLeyPlata}
            min={0}
            decimalScale={3}
            fixedDecimalScale
            hideControls
            disabled={bloqueadoPlata}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
          <NumberInput
            label="Humedad"
            placeholder="0.000"
            value={leyHumedad}
            onChange={setLeyHumedad}
            min={0}
            decimalScale={3}
            fixedDecimalScale
            hideControls
            disabled={humedadImpuesta}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
          <NumberInput
            label="Recuperación"
            placeholder="0.000"
            value={leyRecuperacion}
            onChange={setLeyRecuperacion}
            min={0}
            decimalScale={3}
            fixedDecimalScale
            hideControls
            disabled={recuperacionImpuesta}
            size="xs"
            radius="lg"
            classNames={{
              input: FIELD_INPUT,
              label: FIELD_LABEL,
            }}
          />
        </div>

        {(bloqueadoOro || bloqueadoPlata || humedadImpuesta || recuperacionImpuesta) && (
          <Text size="10px" className="text-zinc-400 leading-snug">
            {humedadImpuesta || recuperacionImpuesta ? (
              <>
                La ley de{" "}
                {humedadImpuesta && recuperacionImpuesta
                  ? "humedad y recuperación"
                  : humedadImpuesta
                    ? "humedad"
                    : "recuperación"}{" "}
                la impone el cierre vigente del grupo y no se puede modificar desde
                aquí.
              </>
            ) : (
              <>
                El grupo está en una propuesta de valorización, por lo que no se
                pueden ingresar leyes de{" "}
                {bloqueadoOro && bloqueadoPlata
                  ? "oro y plata"
                  : bloqueadoOro
                    ? "oro"
                    : "plata"}
                .
              </>
            )}
          </Text>
        )}

        <MultiFilePicker
          label="Documentos / Sustento de Análisis"
          description="PDF, JPG, PNG u otros certificados (opcional al crear, requerido para ingresar leyes)"
          files={archivos}
          onFilesChange={setArchivos}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" size="xs" radius="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="cyan"
            size="xs"
            radius="lg"
            onClick={handleGuardar}
          >
            {itemEditar ? "Guardar Cambios" : "Añadir a la Lista"}
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={modalLabAbierto}
        onClose={() => setModalLabAbierto(false)}
        title="Nuevo Laboratorio"
        centered
        radius="lg"
        size="sm"
        zIndex={420}
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        styles={{
          content: { background: "#09090b", border: "1px solid #27272a" },
          header: { background: "#09090b", color: "#fff" },
        }}
      >
        <FormLaboratorio
          nombre={nuevoLabNombre}
          setNombre={setNuevoLabNombre}
          ruc={nuevoLabRuc}
          setRuc={setNuevoLabRuc}
          laboratoriosExistentes={laboratorios}
          onSuccess={(nuevo: RES_Laboratorio) => {
            setModalLabAbierto(false);
            setIdLaboratorio(String(nuevo.id));
            setNombreLabManual(nuevo.nombre);
            void onRecargarLaboratorios();
          }}
        />
      </Modal>
    </>
  );
};

export const ModalFormAnalisisItem = ({
  opened,
  onClose,
  itemEditar,
  numeroEnsayoSugerido,
  defaultOrigen,
  laboratorios,
  loadingLaboratorios,
  onRecargarLaboratorios,
  onGuardarItem,
  leyHumedadHeredada,
  leyHumedadEditable,
  leyRecuperacionHeredada,
  leyRecuperacionEditable,
  bloqueadoOro,
  bloqueadoPlata,
}: ModalFormAnalisisItemProps) => {
  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      zIndex={320}
      title={
        <div className="flex items-center gap-2">
          <IconTestPipe size={18} className="text-cyan-400" />
          <span className="font-semibold text-sm">
            {itemEditar ? `Editar Ensayo #${itemEditar.numero_ensayo}` : "Añadir Análisis"}
          </span>
        </div>
      }
      size="md"
      validateClose
    >
      {opened && (
        <FormAnalisisItemBody
          key={itemEditar?.localId ?? `nuevo-${numeroEnsayoSugerido}`}
          itemEditar={itemEditar}
          numeroEnsayoSugerido={numeroEnsayoSugerido}
          defaultOrigen={defaultOrigen}
          laboratorios={laboratorios}
          loadingLaboratorios={loadingLaboratorios}
          onRecargarLaboratorios={onRecargarLaboratorios}
          onGuardarItem={onGuardarItem}
          onClose={onClose}
          leyHumedadHeredada={leyHumedadHeredada}
          leyHumedadEditable={leyHumedadEditable}
          leyRecuperacionHeredada={leyRecuperacionHeredada}
          leyRecuperacionEditable={leyRecuperacionEditable}
          bloqueadoOro={bloqueadoOro}
          bloqueadoPlata={bloqueadoPlata}
        />
      )}
    </ModalEstandar>
  );
};
