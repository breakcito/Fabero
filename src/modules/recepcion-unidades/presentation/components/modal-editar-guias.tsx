import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconLock,
  IconUser,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IGuiaRecepcion } from "../../../../shared/interfaces/guia-recepcion";
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

type GuiasEditables = Record<number, { remitente: string; transportista: string }>;

/**
 * Edición de las guías de una recepción de unidad.
 *
 * Cada proveedor de la carga tiene su propio par de guías (serie y número).
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

  const [guias, setGuias] = useState<IGuiaRecepcion[]>([]);
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
      setGuias(
        (recepcion.guias ?? []).map((g) => ({
          id_proveedor: g.id_proveedor,
          guia_remitente: g.guia_remitente ?? "",
          guia_transportista: g.guia_transportista ?? "",
          guia_remitente_archivo: g.guia_remitente_archivo ?? null,
          guia_transportista_archivo: g.guia_transportista_archivo ?? null,
        })),
      );
    }
  }

  if (!recepcion) return null;

  const bloqueados = recepcion.campos_bloqueados ?? [];
  const remitenteBloqueado = bloqueados.includes("guia_remitente");
  const transportistaBloqueado = bloqueados.includes("guia_transportista");
  const algunaBloqueada = remitenteBloqueado || transportistaBloqueado;

  const proveedores = recepcion.proveedores ?? [];
  const razonSocialProveedor = (idProveedor: number): string =>
    proveedores.find((p) => p.id_proveedor === idProveedor)?.razon_social ??
    (idProveedor === 0
      ? "Guías de la unidad (sin proveedor)"
      : "Proveedor de la carga");

  const valores: GuiasEditables = guias.reduce<GuiasEditables>(
    (acc, guia) => {
      acc[guia.id_proveedor] = {
        remitente: guia.guia_remitente,
        transportista: guia.guia_transportista,
      };
      return acc;
    },
    {},
  );

  const setGuia = (
    idProveedor: number,
    campo: "remitente" | "transportista",
    valor: string,
  ) => {
    setGuias((prev) =>
      prev.map((g) => {
        if (g.id_proveedor !== idProveedor) return g;
        if (campo === "remitente") {
          return { ...g, guia_remitente: valor };
        }
        return { ...g, guia_transportista: valor };
      }),
    );
  };

  const handleGuardar = async () => {
    setSubmitting(true);
    try {
      const actualizadas = guias.map((g) => ({
        ...g,
        guia_remitente: g.guia_remitente.trim().toUpperCase(),
        guia_transportista: g.guia_transportista.trim().toUpperCase(),
      }));

      await RecepcionUnidadesService.setGuias(recepcion.id, actualizadas);
      notifySuccess("Guías actualizadas correctamente");
      onGuardada({
        ...recepcion,
        guias: actualizadas,
        guia_remitente:
          actualizadas.find((g) => g.id_proveedor === proveedores[0]?.id_proveedor)
            ?.guia_remitente ?? null,
        guia_transportista:
          actualizadas.find((g) => g.id_proveedor === proveedores[0]?.id_proveedor)
            ?.guia_transportista ?? null,
      });
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

        {guias.length === 0 ? (
          <Text size="xs" c="dimmed" fs="italic" ta="center">
            La unidad no tiene guías registradas.
          </Text>
        ) : (
          guias.map((guia) => (
            <Paper
              key={guia.id_proveedor}
              p="sm"
              radius="lg"
              className="bg-zinc-900/30 border border-zinc-800/80 space-y-2"
            >
              <Group gap="xs">
                <IconUser className="w-4 h-4 text-zinc-500" />
                <Text size="xs" fw={700} className="text-zinc-200">
                  {razonSocialProveedor(guia.id_proveedor)}
                </Text>
              </Group>

              <TextInput
                label="Guía Remitente (serie-número)"
                placeholder="Ej. 001-123456"
                size="md"
                radius="lg"
                value={valores[guia.id_proveedor]?.remitente ?? ""}
                onChange={(e) =>
                  setGuia(
                    guia.id_proveedor,
                    "remitente",
                    e.currentTarget.value.toUpperCase(),
                  )
                }
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
                value={valores[guia.id_proveedor]?.transportista ?? ""}
                onChange={(e) =>
                  setGuia(
                    guia.id_proveedor,
                    "transportista",
                    e.currentTarget.value.toUpperCase(),
                  )
                }
                disabled={transportistaBloqueado || submitting}
                rightSection={
                  transportistaBloqueado ? (
                    <IconLock size={14} className="text-zinc-500" />
                  ) : undefined
                }
                classNames={fieldClasses}
              />
            </Paper>
          ))
        )}

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
              disabled={algunaBloqueada || guias.length === 0}
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
