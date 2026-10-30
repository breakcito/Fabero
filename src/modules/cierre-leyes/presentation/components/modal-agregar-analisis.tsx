import { useEffect, useState } from "react";
import { Button, Stack, Group } from "@mantine/core";
import { IconTestPipe } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import { useNotify } from "../../../../hooks/useNotify";
import type { useCierreLeyes } from "../../hooks/useCierreLeyes";
import type { AnalisisDraftItem } from "../../service/cierre-leyes.requests";
import { ListaAnalisisBorrador } from "./lista-analisis-borrador";
import { ModalFormAnalisisItem } from "./modal-form-analisis-item";

interface ModalAgregarAnalisisProps {
  opened: boolean;
  onClose: () => void;
  idGrupo: number;
  nombreGrupo?: string;
  esMuestra?: boolean;
  maxEnsayoExistente?: number;
  ctrl: ReturnType<typeof useCierreLeyes>;
}

export const ModalAgregarAnalisis = ({
  opened,
  onClose,
  idGrupo,
  nombreGrupo,
  esMuestra,
  maxEnsayoExistente = 0,
  ctrl,
}: ModalAgregarAnalisisProps) => {
  const { notifyError } = useNotify();

  const [analisisItems, setAnalisisItems] = useState<AnalisisDraftItem[]>([]);
  const [modalItemAbierto, setModalItemAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState<AnalisisDraftItem | null>(null);

  const { cargarLaboratorios } = ctrl;

  useEffect(() => {
    if (opened) {
      void cargarLaboratorios();
    }
  }, [opened, cargarLaboratorios]);

  const guardando = Boolean(ctrl.agregandoAnalisis[idGrupo]);

  const handleCerrar = () => {
    setAnalisisItems([]);
    setModalItemAbierto(false);
    setItemEditar(null);
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
    if (analisisItems.length === 0) {
      notifyError("Añade al menos un análisis a la lista antes de guardar");
      return;
    }

    const payload = {
      analisis: analisisItems.map((it) => ({
        id_laboratorio: it.id_laboratorio,
        asumido_por: it.asumido_por,
        numero_ensayo: it.numero_ensayo,
        tipo_origen: it.tipo_origen,
        documentos: it.documentos.length > 0 ? it.documentos : undefined,
      })),
    };

    const ok = esMuestra
      ? await ctrl.agregarAnalisisMuestraExterna(idGrupo, payload)
      : await ctrl.agregarAnalisisGrupo(idGrupo, payload);

    if (ok) {
      handleCerrar();
    }
  };

  const siguienteNumeroEnsayo =
    analisisItems.reduce((max, it) => Math.max(max, it.numero_ensayo), maxEnsayoExistente) + 1;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleCerrar}
        validateClose={analisisItems.length > 0}
        title={
          <div className="flex items-center gap-2">
            <IconTestPipe size={18} className="text-cyan-400" />
            <span className="font-semibold text-sm">
              Añadir Análisis
            </span>
          </div>
        }
        size="md"
      >
        <Stack gap="sm">
          <div
            className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
              esMuestra
                ? "bg-cyan-950/25 border-cyan-800/50 text-cyan-200"
                : "bg-indigo-950/30 border-indigo-800/50 text-indigo-200"
            }`}
          >
            <span className="text-zinc-400">
              {esMuestra ? "Muestra externa destino:" : "Grupo de análisis destino:"}
            </span>
            <strong className="font-bold text-white">
              {nombreGrupo || `#${idGrupo}`}
            </strong>
          </div>

          <ListaAnalisisBorrador
            items={analisisItems}
            disabled={guardando}
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
              disabled={guardando}
              onClick={handleCerrar}
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              size="xs"
              radius="lg"
              loading={guardando}
              disabled={analisisItems.length === 0 || guardando}
              onClick={handleSubmit}
            >
              {analisisItems.length > 0
                ? `Guardar Análisis (${analisisItems.length})`
                : "Guardar Análisis"}
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
        defaultOrigen={esMuestra ? TipoOrigen.Externo : TipoOrigen.Interno}
        laboratorios={ctrl.laboratorios}
        loadingLaboratorios={ctrl.loadingLaboratorios}
        onRecargarLaboratorios={ctrl.cargarLaboratorios}
        onGuardarItem={handleGuardarItem}
      />
    </>
  );
};
