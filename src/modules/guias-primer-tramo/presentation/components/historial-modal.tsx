import { Group, Text } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";

interface HistorialModalProps {
  guia: RES_GuiaPrimerTramo | null;
  opened: boolean;
  onClose: () => void;
}

export const HistorialModal = ({ guia, opened, onClose }: HistorialModalProps) => {
  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <Group gap={6}>
          <IconHistory size={20} className="text-amber-400" />
          <span>Historial de cambios</span>
        </Group>
      }
      size="lg"
      rightSection={
        guia ? (
          <Text size="xs" c="dimmed" fw={600} className="font-mono">
            GUÍA #{guia.id}
          </Text>
        ) : undefined
      }
    >
      <CambiosLogViewer cambios={guia?.log_cambios} />
    </ModalEstandar>
  );
};

