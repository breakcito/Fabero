import {
  TextInput,
  Button,
  Stack,
  Text,
  Alert,
  Group,
  Select,
  Loader,
} from "@mantine/core";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { getCoincidencias } from "../../shared/functions/get-coincidencias";
import { OrganigramaService } from "../../modules/organigrama/service/organigrama.service";
import type { RES_Cargo } from "../../modules/organigrama/service/organigrama.responses";
import { useNotify } from "../../hooks/useNotify";

export interface FormCargoProps {
  nombre: string;
  setNombre: (val: string) => void;
  areas: Array<{ id_area: number; nombre: string }>;
  idArea: number | null;
  setIdArea: (val: number | null) => void;
  onSuccess: (nuevoCargo: RES_Cargo) => void;
  cargosExistentes?: Array<{ id_cargo: number; nombre: string }>;
}

/**
 * Formulario autocontenido para registrar un cargo dentro de un área.
 *
 * El cargo pertenece siempre a un área: si el proceso que lo abre ya tiene un
 * área seleccionada, se recibe por `idArea` y el select queda bloqueado.
 */
export const FormCargo = ({
  nombre,
  setNombre,
  areas,
  idArea,
  setIdArea,
  onSuccess,
  cargosExistentes = [],
}: FormCargoProps) => {
  const { notifySuccess, notifyError } = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coincidencias = useMemo(() => {
    if (!nombre.trim() || nombre.length < 3) return [];

    return getCoincidencias(cargosExistentes, nombre, {
      keys: ["nombre"],
      fuseThreshold: 0.3,
    });
  }, [nombre, cargosExistentes]);

  const existeExacto = useMemo(
    () =>
      cargosExistentes.some(
        (c) => c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim(),
      ),
    [cargosExistentes, nombre],
  );

  const handleSubmit = async () => {
    if (!nombre.trim() || existeExacto || !idArea) return;
    setIsSubmitting(true);
    try {
      const res = await OrganigramaService.crear_cargo({ nombre, id_area: idArea });
      if (res.success) {
        notifySuccess("Cargo registrado correctamente");
        onSuccess(res.data);
        setNombre("");
      } else {
        notifyError(res.message);
      }
    } catch (error) {
      console.error("Error al registrar cargo", error);
      notifyError("Error al registrar cargo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <Select
        label="Área Perteneciente"
        placeholder="Seleccione el área..."
        withAsterisk
        required
        radius="lg"
        searchable
        nothingFoundMessage="No hay áreas disponibles"
        data={areas.map((a) => ({
          value: a.id_area.toString(),
          label: a.nombre,
        }))}
        value={idArea ? idArea.toString() : null}
        onChange={(val) => setIdArea(val ? Number(val) : null)}
        disabled={isSubmitting}
        rightSection={isSubmitting ? <Loader size={16} /> : undefined}
        classNames={{
          input:
            "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 w-full",
          label: "text-zinc-300 mb-1 font-medium text-sm",
        }}
      />

      <TextInput
        label="Nombre del Cargo"
        placeholder="Ej. Jefe de Almacén, Operario A..."
        withAsterisk
        required
        radius="lg"
        data-autofocus
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        error={existeExacto ? "Este cargo ya está registrado" : null}
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
          <Text size="xs">Se encontraron cargos con nombres similares:</Text>
          <Group gap={6} mt={4}>
            {coincidencias.slice(0, 3).map((c) => (
              <Text key={c.item.id_cargo} fw={700} c="orange.4" size="xs">
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
        disabled={!nombre.trim() || existeExacto || !idArea}
        color="indigo"
        radius="lg"
        size="sm"
      >
        Registrar Cargo
      </Button>
    </Stack>
  );
};
