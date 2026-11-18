import { TextInput, Button, Stack, Text, Alert, Group } from "@mantine/core";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { getCoincidencias } from "../../shared/functions/get-coincidencias";
import { OrganigramaService } from "../../modules/organigrama/service/organigrama.service";
import type { RES_Area } from "../../modules/organigrama/service/organigrama.responses";
import { useNotify } from "../../hooks/useNotify";

export interface FormAreaProps {
  nombre: string;
  setNombre: (val: string) => void;
  onSuccess: (nuevaArea: RES_Area) => void;
  areasExistentes?: Array<{ id_area: number; nombre: string }>;
}

/**
 * Formulario autocontenido para registrar un área.
 *
 * Se usa dentro de modales de procesos concurrentes (registro de empleados,
 * organigrama, etc.) donde el catálogo de áreas debe poder crecer sin salir
 * del flujo actual.
 */
export const FormArea = ({
  nombre,
  setNombre,
  onSuccess,
  areasExistentes = [],
}: FormAreaProps) => {
  const { notifySuccess, notifyError } = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coincidencias = useMemo(() => {
    if (!nombre.trim() || nombre.length < 3) return [];

    return getCoincidencias(areasExistentes, nombre, {
      keys: ["nombre"],
      fuseThreshold: 0.3,
    });
  }, [nombre, areasExistentes]);

  const existeExacto = useMemo(
    () =>
      areasExistentes.some(
        (a) => a.nombre.toLowerCase().trim() === nombre.toLowerCase().trim(),
      ),
    [areasExistentes, nombre],
  );

  const handleSubmit = async () => {
    if (!nombre.trim() || existeExacto) return;
    setIsSubmitting(true);
    try {
      const res = await OrganigramaService.crear_area({ nombre });
      if (res.success) {
        notifySuccess("Área registrada correctamente");
        onSuccess(res.data);
        setNombre("");
      } else {
        notifyError(res.message);
      }
    } catch (error) {
      console.error("Error al registrar área", error);
      notifyError("Error al registrar área");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Nombre del Área"
        placeholder="Ej. Operaciones, Recursos Humanos..."
        withAsterisk
        required
        radius="lg"
        data-autofocus
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        error={existeExacto ? "Esta área ya está registrada" : null}
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 w-full",
          label: "text-zinc-300 mb-1 font-medium text-sm",
        }}
      />

      {coincidencias.length > 0 && !existeExacto && (
        <Alert
          variant="light"
          color="orange"
          title="Posibles duplicados encontrados"
          icon={<ExclamationCircleIcon className="w-5 h-5" />}
          radius="lg"
          styles={{
            title: { fontSize: "13px", fontWeight: 700 },
            message: { fontSize: "12px" },
          }}
        >
          <Text size="xs">Se encontraron áreas con nombres similares:</Text>
          <Group gap={6} mt={4}>
            {coincidencias.slice(0, 3).map((c) => (
              <Text key={c.item.id_area} fw={700} c="orange.4" size="xs">
                • {c.item.nombre}
              </Text>
            ))}
            {coincidencias.length > 3 && (
              <Text size="xs" c="dimmed">
                y {coincidencias.length - 3} más...
              </Text>
            )}
          </Group>
        </Alert>
      )}

      <Button
        fullWidth
        className="font-bold shadow-lg shadow-indigo-500/20"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!nombre.trim() || existeExacto}
        color="indigo"
        radius="lg"
        size="sm"
      >
        Registrar Área
      </Button>
    </Stack>
  );
};
