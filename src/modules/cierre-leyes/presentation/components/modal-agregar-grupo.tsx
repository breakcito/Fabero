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
} from "@mantine/core";
import { IconPlus, IconFlask } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormLaboratorio } from "../../../../presentation/utils/form-laboratorio";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Laboratorio } from "../../../../service/responses/laboratorio";

interface ModalAgregarGrupoProps {
  opened: boolean;
  onClose: () => void;
  idLoteInicial?: number | null;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

export const ModalAgregarGrupo = ({
  opened,
  onClose,
  idLoteInicial,
  ctrl,
}: ModalAgregarGrupoProps) => {
  const { notifyError } = useNotify();

  const [idLote, setIdLote] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState("Grupo 1");
  const [idLaboratorio, setIdLaboratorio] = useState<string | null>(null);
  const [asumidoPor, setAsumidoPor] = useState<string>("Proveedor");
  const [numeroEnsayo, setNumeroEnsayo] = useState<number>(1);
  const [archivos, setArchivos] = useState<File[]>([]);

  // Sub-modal para registrar nuevo laboratorio
  const [modalLabAbierto, setModalLabAbierto] = useState(false);
  const [nuevoLabNombre, setNuevoLabNombre] = useState("");
  const [nuevoLabRuc, setNuevoLabRuc] = useState("");

  useEffect(() => {
    if (opened) {
      void ctrl.cargarLotesSugeridos();
      void ctrl.cargarLaboratorios();
      setIdLote(idLoteInicial ? String(idLoteInicial) : null);
      setNombreGrupo("Grupo 1");
      setIdLaboratorio(null);
      setAsumidoPor("Proveedor");
      setNumeroEnsayo(1);
      setArchivos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, idLoteInicial]);

  // Si idLoteInicial no viene, autoseleccionar el primer lote sugerido si hay
  useEffect(() => {
    if (opened && !idLoteInicial && ctrl.lotesSugeridos.length > 0 && !idLote) {
      setIdLote(String(ctrl.lotesSugeridos[0].id));
    }
  }, [opened, idLoteInicial, ctrl.lotesSugeridos, idLote]);

  // Si no hay laboratorios o hay alguno, seleccionar el primero por defecto
  useEffect(() => {
    if (ctrl.laboratorios.length > 0 && !idLaboratorio) {
      setIdLaboratorio(String(ctrl.laboratorios[0].id));
    }
  }, [ctrl.laboratorios, idLaboratorio]);

  const handleSubmit = async () => {
    if (!idLote) {
      notifyError("Debes seleccionar un lote mineral");
      return;
    }
    if (!nombreGrupo.trim()) {
      notifyError("Indica un nombre para el grupo");
      return;
    }

    const ok = await ctrl.crearGrupo({
      id_lote_mineral: Number(idLote),
      nombre: nombreGrupo.trim(),
      id_laboratorio: idLaboratorio ? Number(idLaboratorio) : undefined,
      asumido_por: asumidoPor,
      numero_ensayo: numeroEnsayo,
      tipo_origen: undefined,
      documentos: archivos.length > 0 ? archivos : undefined,
    });

    if (ok) {
      onClose();
    }
  };

  const gruposMap = new Map<string, { value: string; label: string }[]>();

  const lotesDisponibles = [...(ctrl.lotesSugeridos ?? [])];
  (ctrl.lotes ?? []).forEach((l) => {
    if (!lotesDisponibles.some((x) => x.id === l.id)) {
      lotesDisponibles.push(l as unknown as typeof lotesDisponibles[0]);
    }
  });

  lotesDisponibles.forEach((l) => {
    const prov = l.proveedor_razon_social || "Sin Proveedor";
    if (!gruposMap.has(prov)) {
      gruposMap.set(prov, []);
    }
    if (!gruposMap.get(prov)!.some((it) => it.value === String(l.id))) {
      gruposMap.get(prov)!.push({
        value: String(l.id),
        label: `${l.correlativo} (${l.peso_neto ? `${l.peso_neto} kg` : "Sin peso"})`,
      });
    }
  });

  const opcionesLotes = Array.from(gruposMap.entries()).map(([group, items]) => ({
    group,
    items,
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
            <IconFlask size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm">Crear Grupo de Análisis</span>
          </div>
        }
        size="md"
      >
        <Stack gap="sm">
          <Select
            label="Lote Mineral"
            placeholder={ctrl.loadingSugeridos ? "Cargando lotes..." : "Selecciona un lote"}
            data={opcionesLotes}
            value={idLote}
            onChange={setIdLote}
            searchable
            required
            disabled={ctrl.loadingSugeridos || !!idLoteInicial}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
              label: "text-zinc-300 mb-1 font-medium text-xs",
            }}
          />

          <TextInput
            label="Nombre del Grupo"
            placeholder="Ej. Grupo 1, Balanza A..."
            value={nombreGrupo}
            onChange={(e) => setNombreGrupo(e.currentTarget.value)}
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
            description="PDF, JPG, PNG u otros certificados (requerido para ingresar leyes)"
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
              loading={ctrl.creandoGrupo}
              onClick={handleSubmit}
            >
              Crear Grupo
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal para registrar Laboratorio al vuelo */}
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
