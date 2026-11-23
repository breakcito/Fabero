import { useState } from "react";
import {
  Select,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Grid,
  Group,
  Table,
  Text,
  Badge,
  Checkbox,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { TipoProducto } from "../../../../shared/enums/_generic/tipo-producto";
import { TipoMineral } from "../../../../shared/enums/_generic/tipo-mineral";
import {
  modoCorrelativoInicial,
  payloadCorrelativoMuestreo,
  reconstruirCorrelativo as reconstruirCorrelativoBase,
} from "../../../../shared/functions/correlativo-lote";
import type { DTO_ConfirmarMuestreo } from "../../service/muestreo.requests";
import type { RES_LoteMuestreo } from "../../service/muestreo.responses";

interface Props {
  lote: RES_LoteMuestreo | null;
  opened: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (dto: DTO_ConfirmarMuestreo) => void;
}

const OPCIONES_PRODUCTO = Object.values(TipoProducto);
const OPCIONES_MINERAL = Object.values(TipoMineral);

export const ModalConfirmarMuestreo = ({
  lote,
  opened,
  submitting,
  onCancel,
  onConfirm,
}: Props) => {
  const [tipoProducto, setTipoProducto] = useState<string | null>(null);
  const [tipoMineral, setTipoMineral] = useState<string | null>(null);
  const [correlativo, setCorrelativo] = useState<string>("");
  const [numeroCorrelativo, setNumeroCorrelativo] = useState<string>("");
  const [numeroCorrelativoInicial, setNumeroCorrelativoInicial] = useState("");

  /**
   * Modo del correlativo.
   *
   * - Manual: el N° correlativo va en NULL y el correlativo se escribe a mano.
   * - Secuencia: el correlativo no se edita y lo que se ajusta es el N°.
   *
   * Arranca en manual si el lote ya tiene el N° correlativo en NULL: es la
   * marca de "código escrito a mano".
   */
  const [correlativoManual, setCorrelativoManual] = useState(false);

  /**
   * Al abrir el modal se precargan los valores actuales del lote. El
   * correlativo y el N° son editables: el muestreo es el momento en que se
   * consolida el código definitivo.
   *
   * El estado se ajusta DURANTE el render (comparando con el valor previo)
   * en vez de dentro de un efecto: es el patrón que recomienda React para
   * "resetear estado cuando cambia una prop", evita el render extra y no
   * dispara la cascada de renders que marca la regla de hooks.
   */
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevLoteId, setPrevLoteId] = useState(lote?.id ?? null);

  const seAbrio = opened !== prevAbierto;
  const cambioLote = (lote?.id ?? null) !== prevLoteId;

  if (seAbrio || cambioLote) {
    setPrevAbierto(opened);
    setPrevLoteId(lote?.id ?? null);

    if (opened && lote) {
      setTipoProducto(lote.tipo_producto ?? null);
      setTipoMineral(lote.tipo_mineral ?? null);
      // En una PARTICIÓN el correlativo editable es el del LOTE PADRE (el de
      // la partición se deriva: `{correlativo_padre}-{letra}`).
      setCorrelativo(lote.correlativo_padre ?? lote.correlativo ?? "");
      setNumeroCorrelativo(
        lote.numero_correlativo !== null ? String(lote.numero_correlativo) : "",
      );
      setNumeroCorrelativoInicial(
        lote.numero_correlativo !== null ? String(lote.numero_correlativo) : "",
      );
      setCorrelativoManual(
        modoCorrelativoInicial(lote.numero_correlativo ?? null),
      );
    }
  }

  if (!lote) return null;

  /**
   * Reconstruye el correlativo conservando el año, el prefijo y el ancho de
   * ceros del correlativo actual (ej. `26-FB-00005` -> `26-FB-00012`).
   */
  const reconstruirCorrelativo = (numero: number): string =>
    reconstruirCorrelativoBase(correlativo, numero);

  /**
   * Cambia el modo del correlativo.
   *
   * - Manual: el N° correlativo va en NULL y el correlativo se escribe a mano.
   * - Secuencia: se restaura el N° con el que venía el lote y el correlativo
   *   vuelve a derivarse de él.
   */
  const handleCambiarModoCorrelativo = (manual: boolean) => {
    setCorrelativoManual(manual);

    if (manual) {
      setNumeroCorrelativo("");
      return;
    }

    const numero = Number(numeroCorrelativoInicial);
    setNumeroCorrelativo(numeroCorrelativoInicial);
    if (numero > 0) {
      setCorrelativo(reconstruirCorrelativo(numero));
    }
  };

  const handleNumeroChange = (valor: string | number) => {
    const texto = String(valor);
    setNumeroCorrelativo(texto);
    if (correlativoManual) return;

    const numero = Number(texto);
    if (texto !== "" && !Number.isNaN(numero) && numero > 0) {
      setCorrelativo(reconstruirCorrelativo(numero));
    }
  };

  const handleCorrelativoChange = (valor: string) => {
    if (!correlativoManual) return;
    setCorrelativo(valor.toUpperCase());
  };

  const handleConfirm = () => {
    if (!tipoProducto || !tipoMineral) return;
    if (!correlativo.trim()) return;

    onConfirm({
      tipo_producto: tipoProducto,
      tipo_mineral: tipoMineral,
      ...payloadCorrelativoMuestreo({
        manual: correlativoManual,
        correlativo,
        numeroCorrelativo,
      }),
      id_particion: lote?.id_particion ?? null,
    });
  };

  const puedeConfirmar =
    !!tipoProducto &&
    !!tipoMineral &&
    !!correlativo.trim() &&
    !submitting;

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-300 font-semibold text-xs mb-1.5",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onCancel}
      title="Confirmar Muestreo"
      size="lg"
      validateClose
    >
      <Stack gap="md" className="p-1">
        {/* Datos del lote */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <Text size="xs" className="text-zinc-400 uppercase tracking-wider">
              {lote.tipo_registro === "PARTICION" ? "Partición" : "Lote"}
            </Text>
            <Group gap={6} wrap="nowrap">
              <Text size="lg" fw={800} className="text-white font-mono">
                {lote.correlativo}
              </Text>
              {lote.tipo_registro === "PARTICION" && lote.particion && (
                <Badge size="md" variant="light" color="indigo" radius="sm">
                  {lote.particion}
                </Badge>
              )}
            </Group>
          </div>
          <div className="text-right">
            <Text size="xs" className="text-zinc-400 uppercase tracking-wider">
              Vehículo
            </Text>
            <Text size="sm" fw={700} className="text-white font-mono">
              {lote.vehiculo_placa ?? "SIN PLACA"}
            </Text>
          </div>
          <div className="text-right">
            <Text size="xs" className="text-zinc-400 uppercase tracking-wider">
              Proveedor
            </Text>
            <Text size="sm" fw={600} className="text-white truncate max-w-52">
              {lote.proveedor_razon_social ?? "—"}
            </Text>
          </div>
        </div>

        {/* Clasificación y correlativo */}
        <Grid gutter="xs">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Tipo de Producto"
              placeholder="Seleccionar producto"
              required
              withAsterisk
              data={OPCIONES_PRODUCTO}
              value={tipoProducto}
              onChange={setTipoProducto}
              allowDeselect={false}
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Tipo de Mineral"
              placeholder="Seleccionar mineral"
              required
              withAsterisk
              data={OPCIONES_MINERAL}
              value={tipoMineral}
              onChange={setTipoMineral}
              allowDeselect={false}
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              radius="md"
            />
          </Grid.Col>
        </Grid>

        {/* Modo del correlativo: manual (N° correlativo en NULL) o secuencia */}
        <Checkbox
          label="Correlativo manual"
          checked={correlativoManual}
          onChange={(e) => handleCambiarModoCorrelativo(e.currentTarget.checked)}
          color="indigo"
          classNames={{ label: "text-zinc-200 text-sm font-semibold" }}
        />

        <Grid gutter="xs">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Correlativo"
              description={
                correlativoManual
                  ? "Escribe el correlativo del lote. El cambio se aplica también a las particiones."
                  : "El correlativo se deriva del N° correlativo. El cambio se aplica también a las particiones."
              }
              placeholder="Ej: 26-FB-00005"
              value={correlativo}
              onChange={(e) => handleCorrelativoChange(e.target.value)}
              disabled={!correlativoManual}
              classNames={fieldClasses}
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              label="N° Correlativo"
              placeholder=""
              value={numeroCorrelativo}
              onChange={handleNumeroChange}
              min={1}
              allowDecimal={false}
              disabled={correlativoManual}
              classNames={fieldClasses}
              radius="md"
            />
          </Grid.Col>
        </Grid>

        {/* Particiones: se confirman junto con el lote */}
        {lote.particiones.length > 0 && (
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between">
              <Text size="xs" fw={700} className="text-zinc-300 uppercase tracking-wider">
                Particiones
              </Text>
              <Badge size="xs" variant="light" color="indigo" radius="sm">
                {lote.particiones.length}
              </Badge>
            </div>
            <Table verticalSpacing="xs" horizontalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="text-zinc-400 text-xs">Letra</Table.Th>
                  <Table.Th className="text-zinc-400 text-xs">Correlativo</Table.Th>
                  <Table.Th className="text-zinc-400 text-xs text-right">
                    Estado
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lote.particiones.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text size="sm" fw={800} className="text-white font-mono">
                        {p.particion}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" className="text-zinc-300 font-mono">
                        {correlativo.trim()
                          ? `${correlativo.trim().toUpperCase()}-${p.particion}`
                          : p.correlativo}
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right">
                      <Badge
                        size="xs"
                        radius="sm"
                        variant="light"
                        color={p.muestreo_confirmado ? "teal" : "yellow"}
                      >
                        {p.muestreo_confirmado ? "Muestreado" : "Pendiente"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <div className="px-4 py-2 border-t border-zinc-800/80">
              <Text size="xs" className="text-zinc-400">
                Al confirmar, las particiones quedan muestreadas y sus
                correlativos se realinean al correlativo del lote.
              </Text>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-800">
          <Button variant="subtle" color="zinc" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            color="teal"
            leftSection={<IconCheck size={16} />}
            onClick={handleConfirm}
            loading={submitting}
            disabled={!puedeConfirmar}
          >
            Confirmar Muestreo
          </Button>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
