import { useEffect, useMemo, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";

interface Props {
  opened: boolean;
  onClose: () => void;
  titulo: string;
  cambios: RES_CambiosLog[] | null | undefined;
}

/**
 * Copia defensiva del array de cambios ordenado del más reciente al más
 * antiguo (por `update_at` desc). El backend persiste en orden cronológico
 * ascendente; este modal lo invierte para mostrar primero lo más nuevo.
 */
const ordenarMasRecientePrimero = (
  cambios: RES_CambiosLog[] | null | undefined,
): RES_CambiosLog[] | null | undefined => {
  if (!cambios || cambios.length === 0) return cambios;
  return [...cambios].sort((a, b) => {
    const fa = a.update_at ?? "";
    const fb = b.update_at ?? "";
    return fb.localeCompare(fa);
  });
};

export const LogCambiosModal = ({ opened, onClose, titulo, cambios }: Props) => {
  const [internalOpened, setInternalOpened] = useState(opened);

  useEffect(() => {
    setInternalOpened(opened);
  }, [opened]);

  const cambiosOrdenados = useMemo(
    () => ordenarMasRecientePrimero(cambios),
    [cambios],
  );

  return (
    <ModalEstandar
      opened={internalOpened}
      close={onClose}
      title={titulo}
      size="md"
    >
      <CambiosLogViewer
        cambios={cambiosOrdenados}
        camposLegiblesCustom={{ estado: "Estado de distribución" }}
      />
    </ModalEstandar>
  );
};