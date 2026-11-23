import { useState } from "react";
import { Alert, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconLock,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-200 mb-1.5 font-semibold text-sm",
};

/**
 * Edición de las guías de una recepción de unidad (serie y número).
 *
 * Si la guía se registró en una PROGRAMACIÓN queda bloqueada: el backend lo
 * rechaza con `campos_bloqueados`, así que aquí solo se muestra el valor.
 */
export const ModalEditarGuias = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [guiaRemitente, setGuiaRemitente] = useState("");
  const [guiaTransportista, setGuiaTransportista] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Precarga al abrir (ajuste durante el render, igual que el modal de campos).
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevRecepcionId, setPrevRecepcionId] = useState(recepcion?.id ?? null);

  const seAbrio = opened !== prevAbierto;
  const cambioRecepcion = (recepcion?.id ?? null) !== prevRecepcionId;

  if (seAbrio || cambioRecepcion) {
    setPrevAbierto(opened);
    setPrevRecepcionId(recepcion?.id ?? null);

    if (opened && recepcion) {
      setGuiaRemitente(recepcion.guia_remitente ?? "");
      setGuiaTransportista(recepcion.guia_transportista ?? "");
    }
  }

  if (!recepcion) return null;

  const bloqueados = recepcion.campos_bloqueados ?? [];
  const remitenteBloqueado = bloqueados.includes("guia_remitente");
  const transportistaBloqueado = bloqueados.includes("guia_transportista");
  const algunaBloqueada = remitenteBloqueado || transportistaBloqueado;

  const handleGuardar = async () => {
    setSubmitting(true);
    try {
      const campos: {
        guia_remitente?: string | null;
        guia_transportista?: string | null;
      } = {};

      if (! remitenteBloqueado) {
        campos.guia_remitente = guiaRemitente.trim()
          ? guiaRemitente.trim().toUpperCase()
          : null;
      }
      if (! transportistaBloqueado) {
        campos.guia_transportista = guiaTransportista.trim()
          ? guiaTransportista.trim().toUpperCase()
          : null;
      }

      if (Object.keys(campos).length === 0) {
        notifyError("Las guías están bloqueadas: fueron registradas en la programación.");
        return;
      }

      const actualizada = await RecepcionUnidadesService.actualizarCampos(
        recepcion.id,
        { campos, motivo: "Edición de guías de la recepción de unidad" },
      );
      notifySuccess("Guías actualizadas correctamente");
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        e instanceof Error
          ? e.message
          : "No se pudieron actualizar las guías de la recepción.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Editar Guías"
      size="md"
      validateClose
    >
      <Stack gap="md">
        {algunaBloqueada && (
          <Alert
            color="yellow"
            variant="light"
            icon={<IconAlertCircle size={18} />}
            title="Guía registrada en la programación"
          >
            {remitenteBloqueado && transportistaBloqueado
              ? "Las guías se registraron en la programación de recepción, por lo que no se pueden modificar."
              : remitenteBloqueado
                ? "La guía remitente se registró en la programación de recepción, por lo que no se puede modificar."
                : "La guía transportista se registró en la programación de recepción, por lo que no se puede modificar."}
          </Alert>
        )}

        <TextInput
          label="Guía Remitente (serie-número)"
          placeholder="Ej. 001-123456"
          size="md"
          radius="lg"
          value={guiaRemitente}
          onChange={(e) => setGuiaRemitente(e.currentTarget.value)}
          disabled={remitenteBloqueado || submitting}
          rightSection={
            remitenteBloqueado ? (
              <IconLock size={14} className="text-zinc-500" />
            ) : undefined
          }
          classNames={fieldClasses}
        />

        <TextInput
          label="Guía Transportista (serie-número)"
          placeholder="Ej. 001-123456"
          size="md"
          radius="lg"
          value={guiaTransportista}
          onChange={(e) => setGuiaTransportista(e.currentTarget.value)}
          disabled={transportistaBloqueado || submitting}
          rightSection={
            transportistaBloqueado ? (
              <IconLock size={14} className="text-zinc-500" />
            ) : undefined
          }
          classNames={fieldClasses}
        />

        <Text size="xs" c="dimmed">
          La guía no puede repetirse en dos recepciones del mismo proveedor.
        </Text>

        <Stack gap={0}>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              onClick={onClose}
              disabled={submitting}
              radius="lg"
              size="sm"
              className="text-zinc-400 hover:bg-zinc-800/50"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleGuardar}
              loading={submitting}
              disabled={algunaBloqueada}
              size="sm"
              radius="lg"
              leftSection={<IconDeviceFloppy size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
            >
              Guardar Guías
            </Button>
          </Group>
        </Stack>
      </Stack>
    </ModalEstandar>
  );
};
