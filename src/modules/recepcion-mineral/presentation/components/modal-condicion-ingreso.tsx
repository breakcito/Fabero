import { useState, useMemo } from "react";
import { Select, Button, Checkbox, TextInput, Stack } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Empresa } from "../../../../service/responses/empresa";

interface ModalCondicionIngresoProps {
  opened: boolean;
  onClose: () => void;
  empresasTitulares: RES_Empresa[];
  onConfirm: (
    condicion: CondicionIngreso,
    idEmpresa: number,
    flags?: {
      conCodigoManual: boolean;
      codigoManual?: string;
      particionar?: boolean;
    },
  ) => void;
}

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  empresasTitulares,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const { notifyError } = useNotify();
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [conCodigoManual, setConCodigoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [particionar, setParticionar] = useState(false);

  // Identifica la empresa Fabero por coincidencia en razon_social.
  // Heurística estable: primera empresa cuya razón social contiene "fabero"
  // (case-insensitive). Si no hay coincidencia, queda sin selección.
  const faberoEmpresa = useMemo(
    () =>
      empresasTitulares.find((e) =>
        e.razon_social?.toLowerCase().includes("fabero"),
      ),
    [empresasTitulares],
  );

  /**
   * Al abrir el modal se reinicia el formulario con sus valores por defecto.
   *
   * Se ajusta el estado DURANTE el render (comparando con el valor previo)
   * en vez de dentro de un efecto: es el patrón que recomienda React para
   * "resetear estado cuando cambia una prop", evita el render extra y no
   * dispara la cascada de renders que marca la regla de hooks.
   */
  const idFabero = faberoEmpresa?.id_empresa ?? null;
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevIdFabero, setPrevIdFabero] = useState(idFabero);

  const seAbrio = opened !== prevAbierto;
  const cambioFabero = idFabero !== prevIdFabero;

  if (seAbrio || cambioFabero) {
    setPrevAbierto(opened);
    setPrevIdFabero(idFabero);

    if (seAbrio) {
      if (opened) {
        // El modal se acaba de abrir: formulario en blanco con los valores
        // por defecto.
        setCondicion(CondicionIngreso.Comercializacion);
        setIdEmpresa(idFabero !== null ? String(idFabero) : null);
        setConCodigoManual(false);
        setCodigoManual("");
        setParticionar(false);
      }
    } else if (opened) {
      // Llegó (o cambió) la empresa Fabero mientras el modal está abierto:
      // se selecciona, pero sin pisar lo que el usuario ya eligió o escribió.
      setIdEmpresa((actual) => {
        const previo = prevIdFabero !== null ? String(prevIdFabero) : null;
        const usuarioEligio = actual !== null && actual !== previo;
        if (usuarioEligio) return actual;
        return idFabero !== null ? String(idFabero) : null;
      });
    }
  }

  const handleConfirm = () => {
    if (!idEmpresa) return;

    if (conCodigoManual && !codigoManual.trim()) {
      notifyError("Debe ingresar el código manual");
      return;
    }

    const payload: {
      conCodigoManual: boolean;
      codigoManual?: string;
      particionar?: boolean;
    } = {
      conCodigoManual,
    };
    if (conCodigoManual) {
      payload.codigoManual = codigoManual.trim().toUpperCase();
    }
    if (particionar) {
      payload.particionar = true;
    }

    onConfirm(condicion, Number(idEmpresa), payload);
  };

  const fieldClasses = {
    input: "bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500",
    label: "text-zinc-300 mb-1 font-semibold text-xs",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Nuevo Lote"
      size="md"
      rightSection={
        <Checkbox
          label="Particionar"
          checked={particionar}
          onChange={(e) => setParticionar(e.currentTarget.checked)}
          color="indigo"
          classNames={{ label: "text-zinc-200 text-sm" }}
        />
      }
    >
      <Stack gap="md" className="p-2">
        <Select
          label="Empresa Titular"
          placeholder="Seleccionar empresa"
          required
          withAsterisk
          data={empresasTitulares.map((e) => ({
            value: String(e.id_empresa),
            label: e.razon_social
          }))}
          value={idEmpresa}
          onChange={(val) => setIdEmpresa(val)}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
          radius="md"
        />

        <Select
          label="Condición de Ingreso"
          placeholder="Seleccionar condición"
          required
          withAsterisk
          data={[
            {
              value: CondicionIngreso.Comercializacion,
              label: "Comercialización",
            },
            {
              value: CondicionIngreso.OtrosServicios,
              label: "Otros Servicios",
            },
          ]}
          value={condicion}
          onChange={(val) => setCondicion((val as CondicionIngreso) || CondicionIngreso.Comercializacion)}
          allowDeselect={false}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
          radius="md"
        />

        <Checkbox
          label="Código manual"
          checked={conCodigoManual}
          onChange={(e) => setConCodigoManual(e.currentTarget.checked)}
          color="indigo"
          classNames={{ label: "text-zinc-200 text-sm" }}
        />

        {conCodigoManual && (
          <TextInput
            label="Código"
            placeholder="Ingrese el código del lote"
            required
            withAsterisk
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.currentTarget.value.toUpperCase())}
            classNames={fieldClasses}
            radius="md"
          />
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="subtle" color="zinc" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="indigo"
            disabled={!idEmpresa}
            onClick={handleConfirm}
          >
            Generar Lote
          </Button>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
