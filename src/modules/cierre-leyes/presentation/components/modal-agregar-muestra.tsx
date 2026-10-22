import { useEffect, useState } from "react";
import {
  Select,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Group,
  ActionIcon,
  Modal,
  Text,
} from "@mantine/core";
import { IconFlask, IconPlus } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormLaboratorio } from "../../../../presentation/utils/form-laboratorio";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import { useNotify } from "../../../../hooks/useNotify";

interface ModalAgregarMuestraProps {
  opened: boolean;
  onClose: () => void;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

export const ModalAgregarMuestra = ({
  opened,
  onClose,
  ctrl,
}: ModalAgregarMuestraProps) => {
  const { notifyError } = useNotify();

  const [codigoCliente, setCodigoCliente] = useState("");
  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [idLaboratorio, setIdLaboratorio] = useState<string | null>(null);
  const [asumidoPor, setAsumidoPor] = useState<string>("Proveedor");
  const [numeroEnsayo, setNumeroEnsayo] = useState<number>(1);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Submodal para registrar laboratorio
  const [modalLabAbierto, setModalLabAbierto] = useState(false);
  const [nuevoLabNombre, setNuevoLabNombre] = useState("");
  const [nuevoLabRuc, setNuevoLabRuc] = useState("");

  useEffect(() => {
    if (opened) {
      void ctrl.cargarProveedores();
      void ctrl.cargarLaboratorios();
      setCodigoCliente("");
      setIdProveedor(null);
      setFecha(new Date().toISOString().split("T")[0]);
      setIdLaboratorio(null);
      setAsumidoPor("Proveedor");
      setNumeroEnsayo(1);
      setArchivos([]);
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);



  const handleSubmit = async () => {
    if (submitting) return;

    if (!codigoCliente.trim()) {
      notifyError("Ingresa el código o identificador de cliente para la muestra");
      return;
    }

    if (!idProveedor) {
      notifyError("Selecciona el proveedor minero para la muestra");
      return;
    }

    if (!idLaboratorio) {
      notifyError("Selecciona el laboratorio para la muestra");
      return;
    }

    setSubmitting(true);
    try {
      const proveedorObj = ctrl.proveedores.find((p) => String(p.id_proveedor) === idProveedor);

      const ok = await ctrl.iniciarMuestraExterna({
        codigo_cliente: codigoCliente.trim(),
        nombre: codigoCliente.trim(),
        id_proveedor: Number(idProveedor),
        proveedor_nombre: proveedorObj?.razon_social,
        fecha,
        id_laboratorio: Number(idLaboratorio),
        asumido_por: asumidoPor,
        numero_ensayo: numeroEnsayo,
        documentos: archivos.length > 0 ? archivos : undefined,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const opcionesProveedores = (ctrl.proveedores ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  const opcionesLaboratorios = (ctrl.laboratorios ?? []).map((lab) => ({
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
            <IconFlask size={18} className="text-cyan-400" />
            <span className="font-semibold text-sm">Registrar Muestra Externa</span>
          </div>
        }
        size="lg"
      >
        <Stack gap="sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label="Código Cliente"
              placeholder="Ej: M-101, MINA-A..."
              value={codigoCliente}
              onChange={(e) => setCodigoCliente(e.currentTarget.value)}
              required
              autoFocus
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs",
              }}
            />

            <TextInput
              label="Fecha de Ingreso"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.currentTarget.value)}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs",
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <Select
              label="Proveedor"
              placeholder={ctrl.loadingProveedores ? "Cargando proveedores..." : "Selecciona proveedor"}
              data={opcionesProveedores}
              value={idProveedor}
              onChange={setIdProveedor}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              label="Número de Ensayo"
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
            description="PDF, JPG, PNG u otros certificados de laboratorio"
            files={archivos}
            onFilesChange={setArchivos}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" radius="lg" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              color="cyan"
              size="xs"
              radius="lg"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!codigoCliente.trim() || !idProveedor || !idLaboratorio || submitting}
            >
              Crear Muestra
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Submodal para Registrar Laboratorio al vuelo */}
      <Modal
        opened={modalLabAbierto}
        onClose={() => setModalLabAbierto(false)}
        title={<Text size="sm" fw={600}>Nuevo Laboratorio</Text>}
        centered
        radius="lg"
      >
        <FormLaboratorio
          nombre={nuevoLabNombre}
          setNombre={setNuevoLabNombre}
          ruc={nuevoLabRuc}
          setRuc={setNuevoLabRuc}
          laboratoriosExistentes={ctrl.laboratorios}
          onSuccess={async (nuevo) => {
            setModalLabAbierto(false);
            await ctrl.cargarLaboratorios();
            setIdLaboratorio(String(nuevo.id));
          }}
        />
      </Modal>
    </>
  );
};
