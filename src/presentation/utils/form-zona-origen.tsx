import { TextInput, Button, Stack, Text, Alert, Group } from "@mantine/core";
import { IconExclamationCircle } from "@tabler/icons-react";
import { useMemo } from "react";
import { getCoincidencias } from "../../shared/functions/get-coincidencias";
import type { RES_ZonaOrigen } from "../../service/responses/zona-origen";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import { useState } from "react";

export interface FormZonaOrigenProps {
  nombre: string;
  setNombre: (val: string) => void;
  onSuccess: (nuevaZona: RES_ZonaOrigen) => void;
  zonasExistentes?: RES_ZonaOrigen[];
}

export const FormZonaOrigen = ({
  nombre,
  setNombre,
  onSuccess,
  zonasExistentes = [],
}: FormZonaOrigenProps) => {
  const { notifySuccess, notifyError } = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar coincidencias similares (no exactas) para avisar al usuario
  const coincidencias = useMemo(() => {
    if (!nombre.trim() || nombre.length < 3) return [];

    return getCoincidencias(zonasExistentes, nombre, {
      keys: ["nombre"],
      fuseThreshold: 0.3,
    });
  }, [nombre, zonasExistentes]);

  // Verificar si hay una coincidencia exacta
  const existeExacto = useMemo(() => {
    return zonasExistentes.some(
      (z) => z.nombre.toLowerCase().trim() === nombre.toLowerCase().trim(),
    );
  }, [nombre, zonasExistentes]);

  const handleSubmit = async () => {
    if (!nombre.trim() || existeExacto) return;
    setIsSubmitting(true);
    try {
      const res = await AuxService.crear_zona_origen({ nombre });
      notifySuccess("Zona de origen registrada correctamente");
      onSuccess(res);
    } catch (error) {
      console.error("Error al registrar zona de origen", error);
      notifyError("Error al registrar zona de origen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Nombre de la Zona"
        placeholder="Ej. Ancash, La Libertad, Nazca, etc."
        withAsterisk
        required
        radius="lg"
        data-autofocus
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        error={existeExacto ? "Esta zona ya está registrada" : null}
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
          icon={<IconExclamationCircle className="w-5 h-5" />}
          radius="lg"
          styles={{
            title: { fontSize: "13px", fontWeight: 700 },
            message: { fontSize: "12px" },
          }}
        >
          <Text size="xs">Se encontraron zonas con nombres similares:</Text>
          <Group gap={6} mt={4}>
            {coincidencias.slice(0, 3).map((c) => (
              <Text key={c.item.id} fw={700} c="orange.4" size="xs">
                • {c.item.nombre}
              </Text>
            ))}
            {coincidencias.length - 3 > 0 && (
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
        Registrar Zona
      </Button>
    </Stack>
  );
};
