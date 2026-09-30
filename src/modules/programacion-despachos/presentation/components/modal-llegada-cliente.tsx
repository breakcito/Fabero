import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconCalendar, IconClipboardCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import type {
  DespachoDetalle,
  DistribucionItem,
} from "../../service/programacion-despachos.responses";
import { useLlegadaCliente } from "../../hooks/useLlegadaCliente";
import type {
  DTO_DatoDetalleCliente,
  DTO_DatosCliente,
} from "../../service/programacion-despachos.requests";

interface Props {
  opened: boolean;
  onClose: () => void;
  distribucion: DistribucionItem;
  /**
   * Fecha de llegada al cliente en formato YYYY-MM-DD.
   *
   - En el flujo de primer registro, viene del `ModalFechaLlegadaCliente`
     (paso 1 de 2) que ya la persistió.
   - En edición, viene de `distribucion.fecha_llegada_cliente` (ya guardada).
   */
  fechaInicial: string;
  /**
   * Callback al guardar exitosamente. El padre refresca el detalle del despacho.
   */
  onSaved: (despachoActualizado: DespachoDetalle) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all h-[30px] text-xs",
  label: "text-zinc-400 mb-0.5 font-medium text-[10px] ml-0.5",
};

/**
 * Modal (paso 2 de 2) para registrar / editar los datos reportados por el cliente
 * al recibir la distribución. La fecha de llegada ya fue capturada en
 * `ModalFechaLlegadaCliente` (o viene de la distribución en modo edición).
 *
 * Se abre cuando la distribución está en "Salió de Planta" (primer registro) o
 * "Llegó al Cliente" (edición).
 */
export const ModalLlegadaCliente = ({
  opened,
  onClose,
  distribucion,
  fechaInicial,
  onSaved,
}: Props) => {
  const { notifyError } = useNotify();
  const { loading, submit } = useLlegadaCliente();

  const [fechaLlegadaCliente, setFechaLlegadaCliente] = useState<string>(
    fechaInicial,
  );
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  // Estado por detalle: claves = id_detalle, valores = campos opcionales.
  const [datosPorDetalle, setDatosPorDetalle] = useState<
    Record<number, Partial<Omit<DTO_DatoDetalleCliente, "id_detalle">>>
  >({});

  const esEdicion =
    distribucion.estado === "Llegó al Cliente" ||
    !!distribucion.fecha_llegada_cliente;

  // Cargar / resetear estado al abrir.
  useEffect(() => {
    if (!opened) {
      setFechaLlegadaCliente(fechaInicial);
      setErrorFecha(null);
      setDatosPorDetalle({});
      return;
    }

    setFechaLlegadaCliente(fechaInicial);
    setErrorFecha(null);

    const inicial: typeof datosPorDetalle = {};
    for (const d of distribucion.detalles) {
      inicial[d.id] = {
        peso_neto_cliente: d.peso_neto_cliente,
        codigo_cliente: d.codigo_cliente,
        ley_oro_cliente: d.ley_oro_cliente,
        ley_plata_cliente: d.ley_plata_cliente,
        ley_humedad_cliente: d.ley_humedad_cliente,
      };
    }
    setDatosPorDetalle(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, distribucion.id]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  /**
   * Variación (cliente − empresa) para el mensaje inline debajo de cada input.
   * Retorna `null` cuando no hay referencia empresa, no hay valor cliente,
   * o la diferencia es despreciable. Indicador NO bloqueante: sólo informa.
   */
  const variacionLabel = (
    emp: number | null,
    cli: number | null,
    decimals: number,
    unidad: string,
  ): { texto: string; color: "emerald.4" | "red.4" } | null => {
    if (emp == null || cli == null) return null;
    const diff = cli - emp;
    if (Math.abs(diff) <= 0.001) return null;
    return {
      texto: `${diff > 0 ? "+" : ""}${diff.toFixed(decimals)} ${unidad}`,
      color: diff > 0 ? "emerald.4" : "red.4",
    };
  };

  const setDato = (
    idDetalle: number,
    campo: keyof Omit<DTO_DatoDetalleCliente, "id_detalle">,
    valor: number | string | null,
  ): void => {
    setDatosPorDetalle((prev) => ({
      ...prev,
      [idDetalle]: { ...prev[idDetalle], [campo]: valor },
    }));
  };

  const handleGuardar = async (): Promise<void> => {
    if (!fechaLlegadaCliente) {
      setErrorFecha("La fecha de llegada al cliente es obligatoria.");
      notifyError("Debe indicar la fecha de llegada al cliente.");
      return;
    }
    setErrorFecha(null);

    const detallesPayload: DTO_DatoDetalleCliente[] = distribucion.detalles.map(
      (d) => {
        const actual = datosPorDetalle[d.id] ?? {};
        return {
          id_detalle: d.id,
          peso_neto_cliente: actual.peso_neto_cliente ?? null,
          codigo_cliente: actual.codigo_cliente ?? null,
          ley_oro_cliente: actual.ley_oro_cliente ?? null,
          ley_plata_cliente: actual.ley_plata_cliente ?? null,
          ley_humedad_cliente: actual.ley_humedad_cliente ?? null,
        };
      },
    );

    const payload: DTO_DatosCliente = {
      fecha_llegada_cliente: fechaLlegadaCliente,
      detalles: detallesPayload,
    };

    const result = await submit(distribucion.id, payload);
    if (result) {
      onSaved(result);
      onClose();
    }
  };

  const titulo = esEdicion
    ? `Editar Datos del Cliente — Distribución #${distribucion.id}`
    : `Registrar Datos del Cliente — Distribución #${distribucion.id}`;

  // Header rightSection: input de fecha (editable, pre-cargado).
  const headerRightSection = (
    <Group gap={6} align="center" wrap="nowrap">
      <Text
        size="xs"
        c={errorFecha ? "red.4" : "zinc.400"}
        fw={600}
        tt="uppercase"
        lts="0.04em"
        className="whitespace-nowrap"
      >
        Fecha: *
      </Text>
      <TextInput
        type="date"
        size="xs"
        radius="lg"
        value={fechaLlegadaCliente}
        onChange={(e) => {
          setFechaLlegadaCliente(e.currentTarget.value);
          if (errorFecha) setErrorFecha(null);
        }}
        leftSection={<IconCalendar size={14} />}
        classNames={{ input: fieldClasses.input }}
        error={errorFecha}
        disabled={loading}
        required
      />
    </Group>
  );

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={
        <Group gap={6} wrap="nowrap">
          <IconClipboardCheck size={20} className="text-indigo-400" />
          <Text fw={700} fz="md" c="white">
            {titulo}
          </Text>
        </Group>
      }
      size="70%"
      rightSection={headerRightSection}
    >
      <Stack gap="md" className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <Box className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden">
          <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/40 font-bold border-b border-zinc-800/60">
            DATOS REPORTADOS POR EL CLIENTE (por detalle · todos opcionales)
          </div>
          {distribucion.detalles.length === 0 ? (
            <Box className="px-4 py-6 text-center">
              <Text size="xs" c="dimmed">
                Esta distribución no tiene items.
              </Text>
            </Box>
          ) : (
            <table className="w-full text-xs border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "21%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/40 font-bold border-b border-zinc-800/60">
                  <th className="py-2 px-3 text-center font-bold">Item</th>
                  <th className="py-2 px-3 text-center font-bold">Parte</th>
                  <th className="py-2 px-3 text-center font-bold">Cód. Cliente</th>
                  <th className="py-2 px-3 text-center font-bold">Peso Neto (KG)</th>
                  <th className="py-2 px-3 text-center font-bold">Ley Oro (g/t)</th>
                  <th className="py-2 px-3 text-center font-bold">Ley Plata (g/t)</th>
                  <th className="py-2 px-3 text-center font-bold">Humedad (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {distribucion.detalles.map((det) => {
                  const datos = datosPorDetalle[det.id] ?? {};
                  const esLote = det.lote_correlativo !== null;
                  const correlativo =
                    det.lote_correlativo ??
                    det.blending_correlativo ??
                    "—";
                  const empPeso = det.peso_neto;
                  const empAu =
                    det.lote_ley_oro ?? det.blending_ley_oro ?? null;
                  const empAg =
                    det.lote_ley_plata ?? det.blending_ley_plata ?? null;
                  const empHu =
                    det.lote_ley_humedad ?? det.blending_ley_humedad ?? null;
                  const vPeso = variacionLabel(empPeso, datos.peso_neto_cliente ?? null, 3, "KG");
                  const vAu = variacionLabel(empAu, datos.ley_oro_cliente ?? null, 2, "g/t");
                  const vAg = variacionLabel(empAg, datos.ley_plata_cliente ?? null, 2, "g/t");
                  const vHu = variacionLabel(empHu, datos.ley_humedad_cliente ?? null, 2, "%");
                  return (
                    <React.Fragment>
                      <tr key={det.id} className="hover:bg-zinc-900/30">
                      <td className="py-2 px-3 text-center align-top">
                        <Group gap={4} wrap="nowrap" justify="center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-[10px] ${
                              esLote
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-zinc-500/20 text-zinc-300"
                            }`}
                          >
                            {esLote ? "LOTE" : "BLEND"}
                          </span>
                          <Text size="xs" className="font-mono truncate">
                            {correlativo}
                          </Text>
                        </Group>
                      </td>
                      <td className="py-2 px-2 text-center align-top">
                        <Text size="xs" className="font-mono text-zinc-400">
                          {det.numero_particion !== null
                            ? `P${det.numero_particion}`
                            : "—"}
                        </Text>
                      </td>
                      <td className="py-2 px-2 text-center align-top">
                        <TextInput
                          size="xs"
                          radius="md"
                          maxLength={50}
                          placeholder="—"
                          value={datos.codigo_cliente ?? ""}
                          onChange={(e) =>
                            setDato(
                              det.id,
                              "codigo_cliente",
                              e.currentTarget.value || null,
                            )
                          }
                          disabled={loading}
                          classNames={{ input: fieldClasses.input }}
                        />
                      </td>
                      <td className="py-2 px-2 text-center align-top">
                        <NumberInput
                          size="xs"
                          radius="md"
                          decimalScale={3}
                          fixedDecimalScale
                          hideControls
                          min={0}
                          suffix=" KG"
                          placeholder="0.000"
                          value={datos.peso_neto_cliente ?? ""}
                          onChange={(val) =>
                            setDato(
                              det.id,
                              "peso_neto_cliente",
                              typeof val === "number" ? val : parseFloat(String(val)) || null,
                            )
                          }
                          disabled={loading}
                          classNames={{ input: fieldClasses.input }}
                        />
                        {vPeso && (
                          <Text fz={10} c={vPeso.color} fw={700} ta="center" className="mt-1 font-mono whitespace-nowrap">
                            {vPeso.texto}
                          </Text>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center align-top">
                        <NumberInput
                          size="xs"
                          radius="md"
                          decimalScale={2}
                          fixedDecimalScale
                          hideControls
                          min={0}
                          placeholder="0.00"
                          value={datos.ley_oro_cliente ?? ""}
                          onChange={(val) =>
                            setDato(
                              det.id,
                              "ley_oro_cliente",
                              typeof val === "number" ? val : parseFloat(String(val)) || null,
                            )
                          }
                          disabled={loading}
                          classNames={{ input: fieldClasses.input }}
                        />
                        {vAu && (
                          <Text fz={10} c={vAu.color} fw={700} ta="center" className="mt-1 font-mono whitespace-nowrap">
                            {vAu.texto}
                          </Text>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center align-top">
                        <NumberInput
                          size="xs"
                          radius="md"
                          decimalScale={2}
                          fixedDecimalScale
                          hideControls
                          min={0}
                          placeholder="0.00"
                          value={datos.ley_plata_cliente ?? ""}
                          onChange={(val) =>
                            setDato(
                              det.id,
                              "ley_plata_cliente",
                              typeof val === "number" ? val : parseFloat(String(val)) || null,
                            )
                          }
                          disabled={loading}
                          classNames={{ input: fieldClasses.input }}
                        />
                        {vAg && (
                          <Text fz={10} c={vAg.color} fw={700} ta="center" className="mt-1 font-mono whitespace-nowrap">
                            {vAg.texto}
                          </Text>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center align-top">
                        <NumberInput
                          size="xs"
                          radius="md"
                          decimalScale={2}
                          fixedDecimalScale
                          hideControls
                          min={0}
                          max={100}
                          placeholder="0.00"
                          value={datos.ley_humedad_cliente ?? ""}
                          onChange={(val) =>
                            setDato(
                              det.id,
                              "ley_humedad_cliente",
                              typeof val === "number" ? val : parseFloat(String(val)) || null,
                            )
                          }
                          disabled={loading}
                          classNames={{ input: fieldClasses.input }}
                        />
                        {vHu && (
                          <Text fz={10} c={vHu.color} fw={700} ta="center" className="mt-1 font-mono whitespace-nowrap">
                            {vHu.texto}
                          </Text>
                        )}
                      </td>
                    </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </Box>

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="default"
            radius="lg"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="bg-zinc-800! text-zinc-300! border-zinc-700!"
          >
            Cancelar
          </Button>
          <Button
            radius="lg"
            size="sm"
            color="indigo"
            loading={loading}
            disabled={loading}
            onClick={() => void handleGuardar()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30"
          >
            {esEdicion ? "Guardar cambios" : "Guardar"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
