import { useState } from "react";
import { NumberInput, Button, Select } from "@mantine/core";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_CondicionComercialProveedor } from "../../service/condiciones-comerciales-proveedor.responses";
import type { DTO_CrearCondicionComercial, DTO_ActualizarCondicionComercial } from "../../service/condiciones-comerciales-proveedor.requests";
import { useNotify } from "../../../../hooks/useNotify";
import { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";

interface ModalCondicionComercialProps {
  opened: boolean;
  onClose: () => void;
  idProveedor: number | null;
  proveedores: RES_Proveedor[];
  condicionEditar?: RES_CondicionComercialProveedor | null;
  onSubmit: (data: DTO_CrearCondicionComercial | DTO_ActualizarCondicionComercial) => Promise<boolean>;
  loading?: boolean;
}

const formSchema = z.object({
  id_proveedor_minero: z.number().min(1, "Debe seleccionar un proveedor"),
  elemento_quimico: z.nativeEnum(ElementoQuimicoValorizacion, {
    message: "Debe seleccionar un elemento químico",
  }),
  ley_inicio: z.number().min(0, "La ley de inicio no puede ser menor a 0"),
  ley_fin: z.number().min(0, "La ley de fin no puede ser menor a 0"),
  maquila: z.number().min(0, "La maquila no puede ser menor a 0"),
  recuperacion: z.number().min(0, "La recuperación debe ser entre 0 y 100").max(100, "La recuperación debe ser entre 0 y 100"),
  consumo: z.number().min(0, "El consumo no puede ser menor a 0"),
  riesgo_comercial: z.number().min(0, "El riesgo comercial no puede ser menor a 0"),
}).refine((data) => data.ley_inicio <= data.ley_fin, {
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

export const ModalCondicionComercial = ({
  opened,
  onClose,
  idProveedor,
  proveedores,
  condicionEditar,
  onSubmit,
  loading = false,
}: ModalCondicionComercialProps) => {
  const { notifyError } = useNotify();

  const isEdit = !!condicionEditar;

  const [form, setForm] = useState({
    id_proveedor_minero: idProveedor ?? 0,
    elemento_quimico: ElementoQuimicoValorizacion.Oro as ElementoQuimicoValorizacion,
    ley_inicio: 0,
    ley_fin: 0,
    maquila: 0,
    recuperacion: 0,
    consumo: 0,
    riesgo_comercial: 0,
  });

  const [prevModalKey, setPrevModalKey] = useState("");
  const currentModalKey = `${opened ? "open" : "closed"}-${condicionEditar?.id ?? "new"}-${idProveedor}`;

  if (currentModalKey !== prevModalKey) {
    setPrevModalKey(currentModalKey);
    if (opened) {
      if (condicionEditar) {
        setForm({
          id_proveedor_minero: condicionEditar.id_proveedor_minero,
          elemento_quimico: condicionEditar.elemento_quimico,
          ley_inicio: condicionEditar.ley_inicio,
          ley_fin: condicionEditar.ley_fin,
          maquila: condicionEditar.maquila,
          recuperacion: condicionEditar.recuperacion,
          consumo: condicionEditar.consumo,
          riesgo_comercial: condicionEditar.riesgo_comercial,
        });
      } else {
        setForm({
          id_proveedor_minero: idProveedor ?? (proveedores[0]?.id_proveedor ?? 0),
          elemento_quimico: ElementoQuimicoValorizacion.Oro,
          ley_inicio: 0,
          ley_fin: 0,
          maquila: 0,
          recuperacion: 0,
          consumo: 0,
          riesgo_comercial: 0,
        });
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = formSchema.safeParse(form);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Por favor revise los campos ingresados";
      notifyError(msg);
      return;
    }

    const ok = await onSubmit(result.data);
    if (ok) {
      onClose();
    }
  };

  const opcionesProveedores = proveedores.map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social || `Proveedor #${p.id_proveedor}`,
  }));

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={isEdit ? "Editar condición comercial" : "Registrar condición comercial"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Proveedor */}
        <Select
          label="Proveedor"
          data={opcionesProveedores}
          value={form.id_proveedor_minero ? String(form.id_proveedor_minero) : null}
          onChange={(val) => setForm((prev) => ({ ...prev, id_proveedor_minero: val ? Number(val) : 0 }))}
          disabled={isEdit}
          searchable
          size="xs"
          radius="lg"
          comboboxProps={{ withinPortal: true }}
          classNames={{
            input: fieldInputClass,
            label: fieldLabelClass,
            option: "hover:bg-zinc-800 focus:bg-zinc-800",
          }}
        />

        {/* Elemento Químico */}
        <Select
          label="Elemento Químico"
          data={opcionesElemento}
          value={form.elemento_quimico}
          onChange={(val) =>
            setForm((prev) => ({
              ...prev,
              elemento_quimico: (val as ElementoQuimicoValorizacion) ?? ElementoQuimicoValorizacion.Oro,
            }))
          }
          size="xs"
          radius="lg"
          comboboxProps={{ withinPortal: true }}
          classNames={{
            input: fieldInputClass,
            label: fieldLabelClass,
            option: "hover:bg-zinc-800 focus:bg-zinc-800",
          }}
        />

        {/* Ley Inicio / Ley Final */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberInput
            label="Ley Inicio"
            value={form.ley_inicio}
            onChange={(val) => setForm((prev) => ({ ...prev, ley_inicio: typeof val === "number" ? val : 0 }))}
            min={0}
            decimalScale={4}
            step={0.0001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />

          <NumberInput
            label="Ley Final"
            value={form.ley_fin}
            onChange={(val) => setForm((prev) => ({ ...prev, ley_fin: typeof val === "number" ? val : 0 }))}
            min={0}
            decimalScale={4}
            step={0.0001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Maquila y Recuperación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberInput
            label="Maquila ($/TC)"
            value={form.maquila}
            onChange={(val) => setForm((prev) => ({ ...prev, maquila: typeof val === "number" ? val : 0 }))}
            min={0}
            decimalScale={3}
            step={0.001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />

          <NumberInput
            label="Recuperación (%)"
            value={form.recuperacion}
            onChange={(val) => setForm((prev) => ({ ...prev, recuperacion: typeof val === "number" ? val : 0 }))}
            min={0}
            max={100}
            decimalScale={3}
            step={0.001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Consumo y Riesgo Comercial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberInput
            label="Consumo ($/TC)"
            value={form.consumo}
            onChange={(val) => setForm((prev) => ({ ...prev, consumo: typeof val === "number" ? val : 0 }))}
            min={0}
            decimalScale={3}
            step={0.001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />

          <NumberInput
            label="Riesgo Comercial ($/TC)"
            value={form.riesgo_comercial}
            onChange={(val) => setForm((prev) => ({ ...prev, riesgo_comercial: typeof val === "number" ? val : 0 }))}
            min={0}
            decimalScale={3}
            step={0.001}
            size="xs"
            radius="lg"
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="lg"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            size="xs"
            radius="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-semibold"
          >
            {isEdit ? "Guardar cambios" : "Registrar"}
          </Button>
        </div>
      </form>
    </ModalEstandar>
  );
};