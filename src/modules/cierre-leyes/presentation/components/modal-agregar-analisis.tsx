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
  /** Ley de humedad/recuperación heredada (cierre del grupo o análisis previo). */
  leyHumedadHeredada?: number | null;
  leyRecuperacionHeredada?: number | null;
  /** Si es false, el valor lo impone el cierre del grupo (campo bloqueado). */
  leyHumedadEditable?: boolean;
  leyRecuperacionEditable?: boolean;
  /** El grupo está en propuesta de valorización: no admite leyes de Au/Ag. */
  bloqueadoOro?: boolean;
  bloqueadoPlata?: boolean;
}

export const ModalAgregarAnalisis = ({
  opened,
  onClose,
  idGrupo,
  nombreGrupo,
  esMuestra,
  maxEnsayoExistente = 0,
  ctrl,
  leyHumedadHeredada = 0,
  leyRecuperacionHeredada = 0,
  leyHumedadEditable = true,
  leyRecuperacionEditable = true,
  bloqueadoOro = false,
  bloqueadoPlata = false,
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

    // Sin evidencia adjunta no se puede registrar NINGUNA ley: se valida
    // cada ítem del borrador antes de enviar.
    const itemSinEvidencia = analisisItems.find(
      (it) =>
        it.documentos.length === 0 &&
        ((it.ley_oro !== null && it.ley_oro !== undefined && it.ley_oro > 0) ||
          (it.ley_plata !== null &&
            it.ley_plata !== undefined &&
            it.ley_plata > 0) ||
          (it.ley_humedad !== null &&
            it.ley_humedad !== undefined &&
            it.ley_humedad > 0) ||
          (it.ley_recuperacion !== null &&
            it.ley_recuperacion !== undefined &&
            it.ley_recuperacion > 0)),
    );

    if (itemSinEvidencia) {
      notifyError(
        "Adjunta al menos un archivo de evidencia para poder registrar las leyes.",
      );
      return;
    }

    const payload = {
      // El borrador guarda humedad y recuperación en DECIMAL (la conversión
      // desde el porcentaje ocurre en el formulario del ítem), así que el
      // payload viaja en el mismo formato que usa el API.
      analisis: analisisItems.map((it) => ({
        id_laboratorio: it.id_laboratorio,
        asumido_por: it.asumido_por,
        numero_ensayo: it.numero_ensayo,
        tipo_origen: it.tipo_origen,
        ley_oro: it.ley_oro ?? undefined,
        ley_plata: it.ley_plata ?? undefined,
        ley_humedad: it.ley_humedad ?? undefined,
        ley_recuperacion: it.ley_recuperacion ?? undefined,
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
        leyHumedadHeredada={leyHumedadHeredada}
        leyRecuperacionHeredada={leyRecuperacionHeredada}
        leyHumedadEditable={leyHumedadEditable}
        leyRecuperacionEditable={leyRecuperacionEditable}
        bloqueadoOro={bloqueadoOro}
        bloqueadoPlata={bloqueadoPlata}
      />
    </>
  );
};
