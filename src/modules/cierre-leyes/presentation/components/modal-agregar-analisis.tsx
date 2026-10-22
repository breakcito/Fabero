import { useEffect, useState } from "react";
import {
  Select,
  NumberInput,
  Button,
  Stack,
  Group,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { IconPlus, IconTestPipe } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormLaboratorio } from "../../../../presentation/utils/form-laboratorio";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { RES_Laboratorio } from "../../../../service/responses/laboratorio";
import { useNotify } from "../../../../hooks/useNotify";

interface ModalAgregarAnalisisProps {
  opened: boolean;
  onClose: () => void;
  idGrupo: number;
  nombreGrupo?: string;
  esMuestra?: boolean;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

export const ModalAgregarAnalisis = ({
  opened,
  onClose,
  idGrupo,
  nombreGrupo,
  esMuestra,
  ctrl,
}: ModalAgregarAnalisisProps) => {
  const { notifyError } = useNotify();
  const [idLaboratorio, setIdLaboratorio] = useState<string | null>(null);
  const [asumidoPor, setAsumidoPor] = useState<string>("Proveedor");
  const [numeroEnsayo, setNumeroEnsayo] = useState<number>(1);
  const [tipoOrigen, setTipoOrigen] = useState<TipoOrigen>(esMuestra ? TipoOrigen.Externo : TipoOrigen.Interno);
  const [archivos, setArchivos] = useState<File[]>([]);

  const [modalLabAbierto, setModalLabAbierto] = useState(false);
  const [nuevoLabNombre, setNuevoLabNombre] = useState("");
  const [nuevoLabRuc, setNuevoLabRuc] = useState("");

  useEffect(() => {
    if (opened) {
      void ctrl.cargarLaboratorios();
      setIdLaboratorio(null);
      setAsumidoPor("Proveedor");
      setNumeroEnsayo(1);
      setTipoOrigen(esMuestra ? TipoOrigen.Externo : TipoOrigen.Interno);
      setArchivos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, esMuestra]);

  const handleSubmit = async () => {
    if (!idLaboratorio) {
      notifyError("Selecciona el laboratorio para el análisis");
      return;
    }

    const payload = {
      id_laboratorio: Number(idLaboratorio),
      asumido_por: asumidoPor,
      numero_ensayo: numeroEnsayo,
      tipo_origen: tipoOrigen,
      documentos: archivos.length > 0 ? archivos : undefined,
    };

    const ok = esMuestra
      ? await ctrl.agregarAnalisisMuestraExterna(idGrupo, payload)
      : await ctrl.agregarAnalisisGrupo(idGrupo, payload);

    if (ok) {
      onClose();
    }
  };

  const opcionesLaboratorios = ctrl.laboratorios.map((lab) => ({
    value: String(lab.id),
    label: lab.nombre,
  }));

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={
          <div className="flex items-center gap-2">
            <IconTestPipe size={18} className="text-cyan-400" />
            <span className="font-semibold text-sm">
              Agregar Análisis — {esMuestra ? `Muestra ${nombreGrupo || `#${idGrupo}`}` : `Grupo ${nombreGrupo || `#${idGrupo}`}`}
            </span>
          </div>
        }
        size="md"
      >
        <Stack gap="sm">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Select
              label="Laboratorio"
              placeholder={ctrl.loadingLaboratorios ? "Cargando..." : "Selecciona laboratorio"}
              data={opcionesLaboratorios}
              value={idLaboratorio}
              onChange={setIdLaboratorio}
              searchable
              clearable
              required
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

          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Origen"
              data={[
                { value: TipoOrigen.Interno, label: "Interno" },
                { value: TipoOrigen.Externo, label: "Externo" },
              ]}
              value={tipoOrigen}
              onChange={(val) => setTipoOrigen((val as TipoOrigen) || TipoOrigen.Interno)}
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
            description="PDF, JPG, PNG u otros certificados (requerido para ingresar leyes en esta fila)"
            files={archivos}
            onFilesChange={setArchivos}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" radius="lg" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              color="indigo"
              size="xs"
              radius="lg"
              loading={ctrl.agregandoAnalisis[idGrupo]}
              disabled={!idLaboratorio || ctrl.agregandoAnalisis[idGrupo]}
              onClick={handleSubmit}
            >
              Agregar Análisis
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <Modal
        opened={modalLabAbierto}
        onClose={() => setModalLabAbierto(false)}
        title="Nuevo Laboratorio"
        centered
        radius="lg"
        size="sm"
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
          laboratoriosExistentes={ctrl.laboratorios}
          onSuccess={(nuevo: RES_Laboratorio) => {
            setModalLabAbierto(false);
            void ctrl.cargarLaboratorios();
            setIdLaboratorio(String(nuevo.id));
          }}
        />
      </Modal>
    </>
  );
};
