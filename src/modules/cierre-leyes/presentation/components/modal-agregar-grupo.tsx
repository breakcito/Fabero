import { useEffect, useState } from "react";
import {
  Select,
  TextInput,
  Button,
  Stack,
  Group,
  Loader,
} from "@mantine/core";
import { IconFlask } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import { useNotify } from "../../../../hooks/useNotify";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import type { AnalisisDraftItem } from "../../service/cierre-leyes.requests";
import { ListaAnalisisBorrador } from "./lista-analisis-borrador";
import { ModalFormAnalisisItem } from "./modal-form-analisis-item";

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

  const [idLoteManual, setIdLoteManual] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState("Grupo 1");
  const [analisisItems, setAnalisisItems] = useState<AnalisisDraftItem[]>([]);

  const [modalItemAbierto, setModalItemAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState<AnalisisDraftItem | null>(null);

  const { cargarLotesSugeridos, cargarLaboratorios } = ctrl;

  useEffect(() => {
    if (opened) {
      void cargarLotesSugeridos();
      void cargarLaboratorios();
    }
  }, [opened, cargarLotesSugeridos, cargarLaboratorios]);

  const resetEstado = () => {
    setIdLoteManual(null);
    setNombreGrupo("Grupo 1");
    setAnalisisItems([]);
    setModalItemAbierto(false);
    setItemEditar(null);
  };

  const handleCerrar = () => {
    resetEstado();
    onClose();
  };

  const idLoteSeleccionado = idLoteInicial
    ? String(idLoteInicial)
    : idLoteManual ?? (ctrl.lotesSugeridos[0] ? String(ctrl.lotesSugeridos[0].id) : null);

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
    if (!idLoteSeleccionado) {
      notifyError("Debes seleccionar un lote mineral");
      return;
    }
    if (!nombreGrupo.trim()) {
      notifyError("Indica un nombre para el grupo");
      return;
    }

    const ok = await ctrl.crearGrupo({
      id_lote_mineral: Number(idLoteSeleccionado),
      nombre: nombreGrupo.trim(),
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

  const gruposMap = new Map<string, { value: string; label: string }[]>();

  const lotesDisponibles: {
    id: number;
    correlativo: string;
    peso_neto: number | null;
    proveedor_razon_social: string | null;
  }[] = [...(ctrl.lotesSugeridos ?? [])];

  (ctrl.lotes ?? []).forEach((l) => {
    if (!lotesDisponibles.some((x) => x.id === l.id)) {
      lotesDisponibles.push({
        id: l.id,
        correlativo: l.correlativo,
        peso_neto: l.peso_neto,
        proveedor_razon_social: l.proveedor_razon_social,
      });
    }
  });

  lotesDisponibles.forEach((l) => {
    const prov = l.proveedor_razon_social || "Sin Proveedor";
    if (!gruposMap.has(prov)) {
      gruposMap.set(prov, []);
    }
    const listaProv = gruposMap.get(prov)!;
    if (!listaProv.some((it) => it.value === String(l.id))) {
      listaProv.push({
        value: String(l.id),
        label: `${l.correlativo} (${l.peso_neto ? `${l.peso_neto} kg` : "Sin peso"})`,
      });
    }
  });

  const opcionesLotes = Array.from(gruposMap.entries()).map(([group, items]) => ({
    group,
    items,
  }));

  const siguienteNumeroEnsayo =
    analisisItems.reduce((max, it) => Math.max(max, it.numero_ensayo), 0) + 1;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleCerrar}
        validateClose={analisisItems.length > 0}
        title={
          <div className="flex items-center gap-2">
            <IconFlask size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm">Crear Grupo de Análisis</span>
          </div>
        }
        size="md"
      >
        <Stack gap="sm">
          <div className="grid grid-cols-1 sm:grid-cols-[1.45fr_1fr] gap-2.5 items-end">
            <Select
              label="Lote Mineral"
              placeholder={ctrl.loadingSugeridos ? "Cargando lotes..." : "Selecciona un lote"}
              data={opcionesLotes}
              value={idLoteSeleccionado}
              onChange={setIdLoteManual}
              searchable
              required
              disabled={ctrl.loadingSugeridos || Boolean(idLoteInicial)}
              rightSection={ctrl.loadingSugeridos ? <Loader size={14} /> : undefined}
              size="xs"
              radius="lg"
              classNames={{
                input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500",
                label: "text-zinc-300 mb-1 font-medium text-xs whitespace-nowrap",
              }}
            />

            <TextInput
              label="Nombre del Grupo"
              placeholder="Ej. Grupo 1..."
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.currentTarget.value)}
              maxLength={20}
              required
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
            disabled={ctrl.creandoGrupo}
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
              disabled={ctrl.creandoGrupo}
              onClick={handleCerrar}
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              size="xs"
              radius="lg"
              loading={ctrl.creandoGrupo}
              disabled={!idLoteSeleccionado || !nombreGrupo.trim() || ctrl.creandoGrupo}
              onClick={handleSubmit}
            >
              {analisisItems.length > 0
                ? `Crear Grupo (${analisisItems.length} análisis)`
                : "Crear Grupo"}
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
        defaultOrigen={TipoOrigen.Interno}
        laboratorios={ctrl.laboratorios}
        loadingLaboratorios={ctrl.loadingLaboratorios}
        onRecargarLaboratorios={ctrl.cargarLaboratorios}
        onGuardarItem={handleGuardarItem}
      />
    </>
  );
};
