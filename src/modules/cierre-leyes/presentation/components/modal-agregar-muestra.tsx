import { useEffect, useState } from "react";
import {
  Select,
  TextInput,
  Button,
  Stack,
  Group,
  Loader,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import "dayjs/locale/es";
import dayjs from "dayjs";
import { IconFlask, IconCalendarTime } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import { useNotify } from "../../../../hooks/useNotify";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import type { AnalisisDraftItem } from "../../service/cierre-leyes.requests";
import { ListaAnalisisBorrador } from "./lista-analisis-borrador";
import { ModalFormAnalisisItem } from "./modal-form-analisis-item";

interface ModalAgregarMuestraProps {
  opened: boolean;
  onClose: () => void;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

const getFechaHoraActual = () => dayjs().format("YYYY-MM-DD HH:mm:ss");

export const ModalAgregarMuestra = ({
  opened,
  onClose,
  ctrl,
}: ModalAgregarMuestraProps) => {
  const { notifyError } = useNotify();

  const [codigoCliente, setCodigoCliente] = useState("");
  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [fechaHoraIngreso, setFechaHoraIngreso] = useState<string | null>(getFechaHoraActual);
  const [analisisItems, setAnalisisItems] = useState<AnalisisDraftItem[]>([]);

  const [modalItemAbierto, setModalItemAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState<AnalisisDraftItem | null>(null);

  const { cargarProveedores, cargarLaboratorios } = ctrl;

  useEffect(() => {
    if (opened) {
      void cargarProveedores();
      void cargarLaboratorios();
    }
  }, [opened, cargarProveedores, cargarLaboratorios]);

  const resetEstado = () => {
    setCodigoCliente("");
    setIdProveedor(null);
    setFechaHoraIngreso(getFechaHoraActual());
    setAnalisisItems([]);
    setModalItemAbierto(false);
    setItemEditar(null);
  };

  const handleCerrar = () => {
    resetEstado();
    onClose();
  };

  const handleGuardarItem = (nuevo: AnalisisDraftItem) => {
    setAnalisisItems((prev) => {
      const existe = prev.some((it) => it.localId === nuevo.localId);
      if (existe) {
        return prev.map((it) => (it.localId === nuevo.localId ? nuevo : it));
      }
      return [...prev, nuevo];
    });
  };

  const handleEliminarItem = (localId: string) => {
    setAnalisisItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const handleSubmit = async () => {
    if (ctrl.iniciandoMuestra) return;

    if (!codigoCliente.trim()) {
      notifyError("Ingresa el código de cliente para la muestra");
      return;
    }

    if (!idProveedor) {
      notifyError("Selecciona el proveedor minero para la muestra");
      return;
    }

    const proveedorObj = ctrl.proveedores.find((p) => String(p.id_proveedor) === idProveedor);
    const fechaFormateada =
      fechaHoraIngreso && dayjs(fechaHoraIngreso).isValid()
        ? dayjs(fechaHoraIngreso).format("YYYY-MM-DD HH:mm:ss")
        : getFechaHoraActual();

    const ok = await ctrl.iniciarMuestraExterna({
      codigo_cliente: codigoCliente.trim(),
      nombre: codigoCliente.trim(),
      id_proveedor: Number(idProveedor),
      proveedor_nombre: proveedorObj?.razon_social,
      fecha: fechaFormateada,
      analisis: analisisItems.map((it) => ({
        id_laboratorio: it.id_laboratorio,
        asumido_por: it.asumido_por,
        numero_ensayo: it.numero_ensayo,
        tipo_origen: it.tipo_origen,
        documentos: it.documentos.length > 0 ? it.documentos : undefined,
      })),
    });

    if (ok) {
      handleCerrar();
    }
  };

  const opcionesProveedores = (ctrl.proveedores ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  const siguienteNumeroEnsayo =
    analisisItems.reduce((max, it) => Math.max(max, it.numero_ensayo), 0) + 1;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleCerrar}
        validateClose={analisisItems.length > 0 || Boolean(codigoCliente.trim())}
        title={
          <div className="flex items-center gap-2">
            <IconFlask size={18} className="text-cyan-400" />
            <span className="font-semibold text-sm">Registrar Muestra Externa</span>
          </div>
        }
        size="lg"
      >
        <Stack gap="sm">
          <div className="grid grid-cols-1 sm:grid-cols-[0.85fr_1.05fr_1.3fr] gap-2.5 items-end">
            <TextInput
              label="Código Cliente"
              placeholder="Ej: M-101..."
              value={codigoCliente}
              onChange={(e) => setCodigoCliente(e.currentTarget.value)}
              maxLength={20}
              required
              autoFocus
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs whitespace-nowrap",
              }}
            />

            <DateTimePicker
              locale="es"
              label="Fecha y Hora Ingreso"
              placeholder="DD/MM/YYYY HH:mm"
              valueFormat="DD/MM/YYYY HH:mm"
              value={fechaHoraIngreso}
              onChange={(val) => setFechaHoraIngreso(val)}
              leftSection={<IconCalendarTime size={15} className="text-zinc-400" />}
              size="xs"
              radius="lg"
              popoverProps={{
                withinPortal: true,
                classNames: {
                  dropdown: "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl p-3",
                },
              }}
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs whitespace-nowrap",
              }}
            />

            <Select
              label="Proveedor Minero"
              placeholder={ctrl.loadingProveedores ? "Cargando..." : "Selecciona proveedor"}
              data={opcionesProveedores}
              value={idProveedor}
              onChange={setIdProveedor}
              searchable
              clearable
              required
              disabled={ctrl.loadingProveedores}
              rightSection={ctrl.loadingProveedores ? <Loader size={14} /> : undefined}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs whitespace-nowrap",
              }}
            />
          </div>

          <ListaAnalisisBorrador
            items={analisisItems}
            disabled={ctrl.iniciandoMuestra}
            onAgregarClick={() => {
              setItemEditar(null);
              setModalItemAbierto(true);
            }}
            onEditarItem={(item) => {
              setItemEditar(item);
              setModalItemAbierto(true);
            }}
            onEliminarItem={handleEliminarItem}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              size="xs"
              radius="lg"
              disabled={ctrl.iniciandoMuestra}
              onClick={handleCerrar}
            >
              Cancelar
            </Button>
            <Button
              color="cyan"
              size="xs"
              radius="lg"
              onClick={handleSubmit}
              loading={ctrl.iniciandoMuestra}
              disabled={!codigoCliente.trim() || !idProveedor || ctrl.iniciandoMuestra}
            >
              {analisisItems.length > 0
                ? `Crear Muestra (${analisisItems.length} análisis)`
                : "Crear Muestra"}
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalFormAnalisisItem
        opened={modalItemAbierto}
        onClose={() => {
          setModalItemAbierto(false);
          setItemEditar(null);
        }}
        itemEditar={itemEditar}
        numeroEnsayoSugerido={siguienteNumeroEnsayo}
        defaultOrigen={TipoOrigen.Externo}
        laboratorios={ctrl.laboratorios}
        loadingLaboratorios={ctrl.loadingLaboratorios}
        onRecargarLaboratorios={ctrl.cargarLaboratorios}
        onGuardarItem={handleGuardarItem}
      />
    </>
  );
};
