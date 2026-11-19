import { useState, useMemo, useEffect } from "react";
import { Select, Button, Checkbox, TextInput, NumberInput, Stack, Grid } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";
import { RecepcionMineralService } from "../../service/recepcion-mineral.service";
import type { RES_Empresa } from "../../../../service/responses/empresa";

interface ModalCondicionIngresoProps {
  opened: boolean;
  onClose: () => void;
  empresasTitulares: RES_Empresa[];
  onConfirm: (
    condicion: CondicionIngreso,
    idEmpresa: number,
    flags?: {
      particionar?: boolean;
      correlativo?: string;
      numero_correlativo?: number;
    },
  ) => void;
}

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  empresasTitulares,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [particionar, setParticionar] = useState(false);

  // Correlativo: se previsualiza el que se generará y el usuario puede
  // ajustarlo. Si lo cambia, el lote queda con código temporal.
  const [correlativoAuto, setCorrelativoAuto] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [numeroCorrelativo, setNumeroCorrelativo] = useState<string>("");
  const [loadingCorrelativo, setLoadingCorrelativo] = useState(false);

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
        setParticionar(false);
        setCorrelativoAuto("");
        setCorrelativo("");
        setNumeroCorrelativo("");
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

  /**
   * Previsualiza el correlativo del próximo lote para la empresa y condición
   * actuales. Cada vez que se abre el modal o cambian esos datos, se vuelve a
   * pedir (el correlativo depende del estado de la secuencia).
   */
  useEffect(() => {
    if (!opened || !idEmpresa) return;

    let cancelado = false;

    const cargarPreview = async () => {
      setLoadingCorrelativo(true);
      try {
        const resp = await RecepcionMineralService.preview_correlativo_lote({
          id_empresa: Number(idEmpresa),
          condicion_ingreso: condicion,
        });
        if (cancelado) return;
        if (resp.success && resp.data) {
          setCorrelativoAuto(resp.data.correlativo);
          setCorrelativo(resp.data.correlativo);
          setNumeroCorrelativo(String(resp.data.numero_correlativo));
        }
      } catch (e) {
        console.error("Error al previsualizar el correlativo del lote", e);
      } finally {
        if (!cancelado) setLoadingCorrelativo(false);
      }
    };

    void cargarPreview();

    return () => {
      cancelado = true;
    };
  }, [opened, idEmpresa, condicion]);

  /**
   * Reconstruye el correlativo conservando el año y el prefijo cuando el
   * usuario edita el número (ej. `26-FB-005` -> `26-FB-012`).
   */
  const reconstruirCorrelativo = (numero: number) => {
    const partes = correlativoAuto.split("-");
    if (partes.length < 3) return correlativoAuto;
    const [anio, prefijo] = partes;
    return `${anio}-${prefijo}-${String(numero).padStart(3, "0")}`;
  };

  const handleNumeroChange = (valor: string | number) => {
    const texto = String(valor);
    setNumeroCorrelativo(texto);
    const numero = Number(texto);
    if (texto !== "" && !Number.isNaN(numero) && numero > 0) {
      setCorrelativo(reconstruirCorrelativo(numero));
    }
  };

  /**
   * Al escribir un correlativo propio, el N° correlativo se borra: la tabla
   * admite `numero_correlativo` NULL para los códigos ingresados a mano.
   */
  const handleCorrelativoChange = (valor: string) => {
    const texto = valor.toUpperCase();
    setCorrelativo(texto);
    if (texto !== correlativoAuto) {
      setNumeroCorrelativo("");
    }
  };

  const handleConfirm = () => {
    if (!idEmpresa) return;

    const payload: {
      particionar?: boolean;
      correlativo?: string;
      numero_correlativo?: number;
    } = {};

    if (particionar) {
      payload.particionar = true;
    }

    // Solo se envía si el usuario ajustó el correlativo generado.
    const correlativoIngresado = correlativo.trim().toUpperCase();
    if (correlativoIngresado && correlativoIngresado !== correlativoAuto) {
      payload.correlativo = correlativoIngresado;
      const numero = Number(numeroCorrelativo);
      if (numero > 0) {
        payload.numero_correlativo = numero;
      }
    }

    onConfirm(condicion, Number(idEmpresa), payload);
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500",
    label: "text-zinc-300 font-semibold text-xs mb-1.5",
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
      validateClose
    >
      <Stack gap="md" className="p-2">
        <Select
          label="Empresa Titular"
          placeholder="Seleccionar empresa"
          required
          withAsterisk
          data={empresasTitulares.map((e) => ({
            value: String(e.id_empresa),
            label: e.razon_social,
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

        {/* Correlativo que se generará (editable) */}
        <Grid gutter="xs">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Correlativo"
              placeholder={loadingCorrelativo ? "Generando..." : "Ej: 26-FB-005"}
              value={correlativo}
              onChange={(e) => handleCorrelativoChange(e.target.value)}
              disabled={loadingCorrelativo}
              classNames={fieldClasses}
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              label="N° Correlativo"
              placeholder={loadingCorrelativo ? "..." : "5"}
              value={numeroCorrelativo}
              onChange={handleNumeroChange}
              min={1}
              disabled={loadingCorrelativo}
              classNames={fieldClasses}
              radius="md"
            />
          </Grid.Col>
        </Grid>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="subtle" color="zinc" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="indigo"
            disabled={!idEmpresa || loadingCorrelativo}
            onClick={handleConfirm}
          >
            Generar Lote
          </Button>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
