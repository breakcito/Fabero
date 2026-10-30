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
} from "@mantine/core";
import { IconPlus, IconTestPipe } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormLaboratorio } from "../../../../presentation/utils/form-laboratorio";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Laboratorio } from "../../../../service/responses/laboratorio";
import type { AnalisisDraftItem } from "../../service/cierre-leyes.requests";

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
}

interface FormBodyProps {
  itemEditar: AnalisisDraftItem | null;
  numeroEnsayoSugerido: number;
  defaultOrigen: TipoOrigen;
  laboratorios: RES_Laboratorio[];
  loadingLaboratorios: boolean;
  onRecargarLaboratorios: () => Promise<void>;
  onGuardarItem: (item: AnalisisDraftItem) => void;
  onClose: () => void;
}

const FormAnalisisItemBody = ({
  itemEditar,
  numeroEnsayoSugerido,
  defaultOrigen,
  laboratorios,
  loadingLaboratorios,
  onRecargarLaboratorios,
  onGuardarItem,
  onClose,
}: FormBodyProps) => {
  const { notifyError } = useNotify();

  const [idLaboratorio, setIdLaboratorio] = useState<string | null>(() => {
    if (itemEditar?.id_laboratorio) return String(itemEditar.id_laboratorio);
    if (laboratorios.length > 0) return String(laboratorios[0].id);
    return null;
  });
  const [nombreLabManual, setNombreLabManual] = useState<string | null>(
    itemEditar?.laboratorio_nombre ?? null,
  );
  const [tipoOrigen, setTipoOrigen] = useState<TipoOrigen>(
    itemEditar?.tipo_origen ?? defaultOrigen,
  );
  const [asumidoPor, setAsumidoPor] = useState<string>(
    itemEditar?.asumido_por ?? "Proveedor",
  );
  const [numeroEnsayo, setNumeroEnsayo] = useState<number>(
    itemEditar?.numero_ensayo ?? numeroEnsayoSugerido,
  );
  const [archivos, setArchivos] = useState<File[]>(
    itemEditar?.documentos ?? [],
  );

  const [modalLabAbierto, setModalLabAbierto] = useState(false);
  const [nuevoLabNombre, setNuevoLabNombre] = useState("");
  const [nuevoLabRuc, setNuevoLabRuc] = useState("");

  const resolvedIdLab =
    idLaboratorio ?? (laboratorios.length > 0 ? String(laboratorios[0].id) : null);

  const opcionesLaboratorios = laboratorios.map((lab) => ({
    value: String(lab.id),
    label: lab.nombre,
  }));

  const handleGuardar = () => {
    if (!resolvedIdLab) {
      notifyError("Selecciona un laboratorio para el análisis");
      return;
    }

    const labEncontrado = laboratorios.find((l) => String(l.id) === resolvedIdLab);
    const laboratorioNombre =
      labEncontrado?.nombre || nombreLabManual || `Laboratorio #${resolvedIdLab}`;

    onGuardarItem({
      localId: itemEditar?.localId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      id_laboratorio: Number(resolvedIdLab),
      laboratorio_nombre: laboratorioNombre,
      asumido_por: asumidoPor,
      numero_ensayo: numeroEnsayo > 0 ? numeroEnsayo : 1,
      tipo_origen: tipoOrigen,
      documentos: archivos,
    });
    onClose();
  };

  return (
    <>
      <Stack gap="sm">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <Select
            label="Laboratorio"
            placeholder={loadingLaboratorios ? "Cargando..." : "Selecciona laboratorio"}
            data={opcionesLaboratorios}
            value={resolvedIdLab}
            onChange={(val) => {
              setIdLaboratorio(val);
              setNombreLabManual(null);
            }}
            searchable
            required
            disabled={loadingLaboratorios}
            rightSection={loadingLaboratorios ? <Loader size={14} /> : undefined}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
              label: "text-zinc-300 mb-1 font-medium text-xs",
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
            onChange={(val) => setTipoOrigen((val as TipoOrigen) || defaultOrigen)}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
              label: "text-zinc-300 mb-1 font-medium text-xs",
            }}
          />

          <Select
            label="Asumido Por"
            data={[
              { value: "Proveedor", label: "Proveedor" },
              { value: "Fabero", label: "Fabero" },
            ]}
            value={asumidoPor}
            onChange={(val) => setAsumidoPor(val || "Proveedor")}
            comboboxProps={{ zIndex: 400 }}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
              label: "text-zinc-300 mb-1 font-medium text-xs",
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
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
              label: "text-zinc-300 mb-1 font-medium text-xs",
            }}
          />
        </div>

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
            disabled={!resolvedIdLab}
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
        />
      )}
    </ModalEstandar>
  );
};

