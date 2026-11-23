import { useState } from "react";
import { NumberInput, Button, Select, Stack, Group, Text, Textarea } from "@mantine/core";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { RES_CondicionComercialPlanta } from "../../service/condiciones-comerciales-planta.responses";
import type {
  DTO_CrearCondicionComercialPlanta,
  DTO_ActualizarCondicionComercialPlanta,
} from "../../service/condiciones-comerciales-planta.requests";
import { useNotify } from "../../../../hooks/useNotify";
import { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";

type PlantaItem = { id: number; ruc: string; razon_social: string };

interface ModalCondicionComercialPlantaProps {
  opened: boolean;
  onClose: () => void;
  idPlanta: number | null;
  plantas: PlantaItem[];
  condicionEditar?: RES_CondicionComercialPlanta | null;
  onSubmit: (
    data: DTO_CrearCondicionComercialPlanta | DTO_ActualizarCondicionComercialPlanta,
  ) => Promise<boolean>;
  loading?: boolean;
}

const formSchema = z
  .object({
    id_planta: z.number().min(1, "Debe seleccionar una planta destino"),
    elemento_quimico: z.nativeEnum(ElementoQuimicoValorizacion, {
      message: "Debe seleccionar un elemento químico",
    }),
    ley_inicio: z.number().min(0).optional(),
    ley_fin: z.number().min(0).optional(),
    maquila: z.number().min(0).optional(),
    recuperacion: z
      .number()
      .min(0, "La recuperación debe ser entre 0 y 100")
      .max(100, "La recuperación debe ser entre 0 y 100")
      .optional(),
    consumo: z.number().min(0).optional(),
    riesgo_comercial: z.number().min(0).optional(),
    observacion: z
      .string()
      .max(1000, "La observación no debe superar los 1000 caracteres")
      .nullable()
      .optional(),
  })
  .refine((data) => {
    if (data.ley_inicio !== undefined && data.ley_fin !== undefined) {
      return data.ley_inicio <= data.ley_fin;
    }
    return true;
  }, {
    message: "La ley inicio no puede ser mayor que la ley fin",
    path: ["ley_fin"],
  });

const opcionesElemento = [
  { value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" },
  { value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" },
];

const fieldInputClass =
  "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px] rounded-xl";
const fieldLabelClass = "text-zinc-300 mb-1 font-medium text-xs";
const fieldDescriptionClass = "text-zinc-500 text-[11px] mt-1";

export const ModalCondicionComercialPlanta = ({
  opened,
  onClose,
  idPlanta,
  plantas,
  condicionEditar,
  onSubmit,
  loading = false,
}: ModalCondicionComercialPlantaProps) => {
  const { notifyError } = useNotify();

  const isEdit = !!condicionEditar;

  type FormShape = {
    id_planta: number;
    elemento_quimico: ElementoQuimicoValorizacion;
    ley_inicio: string | number;
    ley_fin: string | number;
    maquila: string | number;
    recuperacion: string | number;
    consumo: string | number;
    riesgo_comercial: string | number;
    observacion: string;
  };

  const [form, setForm] = useState<FormShape>({
    id_planta: idPlanta ?? 0,
    elemento_quimico: ElementoQuimicoValorizacion.Oro as ElementoQuimicoValorizacion,
    ley_inicio: "",
    ley_fin: "",
    maquila: "",
    recuperacion: "",
    consumo: "",
    riesgo_comercial: "",
    observacion: "",
  });

  const [prevModalKey, setPrevModalKey] = useState("");
  const currentModalKey = `${opened ? "open" : "closed"}-${condicionEditar?.id ?? "new"}-${idPlanta}`;

  if (currentModalKey !== prevModalKey) {
    setPrevModalKey(currentModalKey);
    if (opened) {
      if (condicionEditar) {
        setForm({
          id_planta: condicionEditar.id_planta,
          elemento_quimico: condicionEditar.elemento_quimico,
          ley_inicio: condicionEditar.ley_inicio ?? "",
          ley_fin: condicionEditar.ley_fin ?? "",
          maquila: condicionEditar.maquila ?? "",
          recuperacion: condicionEditar.recuperacion ?? "",
          consumo: condicionEditar.consumo ?? "",
          riesgo_comercial: condicionEditar.riesgo_comercial ?? "",
          observacion: condicionEditar.observacion ?? "",
        });
      } else {
        setForm({
          id_planta: idPlanta ?? (plantas[0]?.id ?? 0),
          elemento_quimico: ElementoQuimicoValorizacion.Oro,
          ley_inicio: "",
          ley_fin: "",
          maquila: "",
          recuperacion: "",
          consumo: "",
          riesgo_comercial: "",
          observacion: "",
        });
      }
    }
  }

  const plantaActual = plantas.find((p) => p.id === form.id_planta);

  // Convierte string vacío a undefined, y string numérico a number, antes de validar.
  const normalizeNumeric = (v: string | number | undefined): number | undefined => {
    if (v === undefined) return undefined;
    if (typeof v === "number") return v;
    if (v === "") return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  const handleSubmit = async () => {
    const normalizedForm = {
      ...form,
      ley_inicio: normalizeNumeric(form.ley_inicio),
      ley_fin: normalizeNumeric(form.ley_fin),
      maquila: normalizeNumeric(form.maquila),
      recuperacion: normalizeNumeric(form.recuperacion),
      consumo: normalizeNumeric(form.consumo),
      riesgo_comercial: normalizeNumeric(form.riesgo_comercial),
      observacion: form.observacion.trim() === "" ? null : form.observacion.trim(),
    };

    const result = formSchema.safeParse(normalizedForm);
    if (!result.success) {
      const firstError = result.error.issues[0];
      notifyError(firstError?.message || "Datos inválidos");
      return;
    }

    const success = await onSubmit(result.data);
    if (success) {
      onClose();
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        isEdit
          ? "Editar Condición Comercial de Planta"
          : "Nueva Condición Comercial de Planta"
      }
      size="xl"
      validateClose
    >
      <Stack gap="md">
        <Group grow gap="md" align="flex-end">
          <Select
            label="Planta Destino:"
            required
            disabled={isEdit}
            data={plantas.map((p) => ({
              value: String(p.id),
              label: `${p.razon_social} (${p.ruc})`,
            }))}
            value={form.id_planta ? String(form.id_planta) : null}
            onChange={(val) =>
              setForm((prev) => ({
                ...prev,
                id_planta: val ? Number(val) : 0,
              }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
          <Select
            label="Elemento Químico:"
            required
            data={opcionesElemento}
            value={form.elemento_quimico}
            onChange={(val) =>
              setForm((prev) => ({
                ...prev,
                elemento_quimico:
                  val === ElementoQuimicoValorizacion.Oro
                    ? ElementoQuimicoValorizacion.Oro
                    : ElementoQuimicoValorizacion.Plata,
              }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
        </Group>

        <Text size="xs" c="dimmed">
          {plantaActual
            ? `Planta seleccionada: ${plantaActual.razon_social} (${plantaActual.ruc})`
            : "Seleccione una planta destino."}
        </Text>

        <Group grow gap="md">
          <NumberInput
            label="Ley Inicio:"
            min={0}
            decimalScale={4}
            value={form.ley_inicio}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, ley_inicio: val ?? "" }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
          <NumberInput
            label="Ley Fin:"
            min={0}
            decimalScale={4}
            value={form.ley_fin}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, ley_fin: val ?? "" }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
        </Group>

        <Group grow gap="md">
          <NumberInput
            label="Maquila:"
            min={0}
            decimalScale={3}
            value={form.maquila}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, maquila: val ?? "" }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
          <NumberInput
            label="Recuperación Máxima (%):"
            description="Es el máximo permitido. En la valorización puede usarse un valor menor, nunca mayor."
            min={0}
            max={100}
            decimalScale={3}
            value={form.recuperacion}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, recuperacion: val ?? "" }))
            }
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
              description: fieldDescriptionClass,
            }}
          />
        </Group>

        <Group grow gap="md">
          <NumberInput
            label="Consumo:"
            min={0}
            decimalScale={3}
            value={form.consumo}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, consumo: val ?? "" }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
          <NumberInput
            label="Riesgo Comercial:"
            min={0}
            decimalScale={3}
            value={form.riesgo_comercial}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, riesgo_comercial: val ?? "" }))
            }
            classNames={{ input: fieldInputClass, label: fieldLabelClass }}
          />
        </Group>

        <Textarea
          label="Observación:"
          placeholder="Detalle adicional de la condición comercial (opcional)"
          autosize
          minRows={2}
          maxRows={5}
          maxLength={1000}
          value={form.observacion}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, observacion: event.currentTarget.value }))
          }
          classNames={{
            input: `${fieldInputClass} h-auto min-h-[70px] py-2`,
            label: fieldLabelClass,
            description: fieldDescriptionClass,
          }}
        />

        <Group justify="end" gap="xs" mt="sm">
          <Button
            variant="default"
            color="gray"
            onClick={onClose}
            disabled={loading}
            radius="lg"
          >
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleSubmit}
            loading={loading}
            radius="lg"
          >
            {isEdit ? "Guardar Cambios" : "Crear Condición"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
