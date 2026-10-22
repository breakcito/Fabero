import { TextInput, Button, Stack, Text, Alert, Group } from "@mantine/core";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { getCoincidencias } from "../../shared/functions/get-coincidencias";
import type { RES_Laboratorio } from "../../service/responses/laboratorio";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";

export interface FormLaboratorioProps {
  nombre: string;
  setNombre: (val: string) => void;
  ruc?: string;
  setRuc?: (val: string) => void;
  onSuccess: (nuevo: RES_Laboratorio) => void;
  laboratoriosExistentes?: RES_Laboratorio[];
}

export const FormLaboratorio = ({
  nombre,
  setNombre,
  ruc = "",
  setRuc,
  onSuccess,
  laboratoriosExistentes = [],
}: FormLaboratorioProps) => {
  const { notifySuccess, notifyError } = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coincidencias = useMemo(() => {
    if (!nombre.trim() || nombre.length < 3) return [];

    return getCoincidencias(laboratoriosExistentes, nombre, {
      keys: ["nombre"],
      fuseThreshold: 0.3,
    });
  }, [nombre, laboratoriosExistentes]);

  const existeExacto = useMemo(() => {
    return laboratoriosExistentes.some(
      (l) => l.nombre.toLowerCase().trim() === nombre.toLowerCase().trim(),
    );
  }, [nombre, laboratoriosExistentes]);

  const handleSubmit = async () => {
    if (!nombre.trim() || existeExacto) return;
    setIsSubmitting(true);
    try {
      const res = await AuxService.crear_laboratorio({
        nombre: nombre.trim(),
        ruc: ruc ? ruc.trim() : undefined,
      });
      if (res.success && res.data) {
        notifySuccess("Laboratorio registrado correctamente");
        onSuccess(res.data);
      } else {
        notifyError(res.message || "Error al registrar laboratorio");
      }
    } catch (error) {
      console.error("Error al registrar laboratorio", error);
      notifyError("Error al registrar laboratorio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Nombre del Laboratorio"
        placeholder="Ej. Inspectorate, SGS, Interno..."
        withAsterisk
        required
        radius="lg"
        data-autofocus
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        error={existeExacto ? "Este laboratorio ya está registrado" : null}
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 w-full",
          label: "text-zinc-300 mb-1 font-medium text-sm",
        }}
      />

      {setRuc && (
        <TextInput
          label="RUC (Opcional)"
          placeholder="20XXXXXXXXX"
          radius="lg"
          maxLength={11}
          value={ruc}
          onChange={(e) => setRuc(e.currentTarget.value)}
          classNames={{
            input:
              "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 w-full",
            label: "text-zinc-300 mb-1 font-medium text-sm",
          }}
        />
      )}

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
          <Text size="xs">Se encontraron laboratorios con nombres similares:</Text>
          <Group gap={6} mt={4}>
            {coincidencias.slice(0, 3).map((c) => (
              <Text key={c.item.id} fw={700} c="orange.4" size="xs">
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
        Registrar Laboratorio
      </Button>
    </Stack>
  );
};
