import { useState, useEffect, useMemo } from "react";
import {
  Checkbox,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Loader,
  Paper,
  Box,
  Grid,
} from "@mantine/core";
import { IconCoins, IconCheck } from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { REQ_ValorizacionAnticipoItem } from "../../service/valorizacion-compra.requests";

interface AnticipoDisponible {
  id: number;
  factura: string;
  serie_factura: string;
  numero_factura: string;
  saldo_inicial: number;
  saldo_actual: number;
  created_at: string;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  idProveedor: number | null;
  montoACubrir: number;
  selectedAnticipos: REQ_ValorizacionAnticipoItem[];
  anticipoSaldoEfectivoMap?: Map<number, number>;
  onConfirmarAnticipos: (anticipos: REQ_ValorizacionAnticipoItem[]) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-8 text-xs",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
};

export const ModalSeleccionarAnticipos = ({
  opened,
  onClose,
  idProveedor,
  montoACubrir,
  selectedAnticipos,
  anticipoSaldoEfectivoMap,
  onConfirmarAnticipos,
}: Props) => {
  const { notifyError } = useNotify();

  const [loading, setLoading] = useState(false);
  const [anticipos, setAnticipos] = useState<AnticipoDisponible[]>([]);
  const [seleccionadosMap, setSeleccionadosMap] = useState<
    Record<number, { checked: boolean; monto: number }>
  >({});

  useEffect(() => {
    if (!opened || !idProveedor) {
      setAnticipos([]);
      setSeleccionadosMap({});
      return;
    }

    const cargar = async () => {
      setLoading(true);
      try {
        const data = await AuxService.get_anticipos_proveedor(idProveedor);
        setAnticipos(data);

        const initialMap: Record<number, { checked: boolean; monto: number }> = {};
        data.forEach((ant) => {
          const match = selectedAnticipos.find(
            (sa) => sa.id_anticipo_proveedor === ant.id,
          );
          if (match) {
            initialMap[ant.id] = { checked: true, monto: match.monto_retirado };
          } else {
            initialMap[ant.id] = { checked: false, monto: 0 };
          }
        });
        setSeleccionadosMap(initialMap);
      } catch (err) {
        notifyError(
          err instanceof Error ? err.message : "Error al cargar anticipos",
        );
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [opened, idProveedor, notifyError, selectedAnticipos]);

  const totalSeleccionado = useMemo(() => {
    return Object.values(seleccionadosMap).reduce((acc, curr) => {
      return curr.checked ? acc + (curr.monto || 0) : acc;
    }, 0);
  }, [seleccionadosMap]);

  const restante = useMemo(() => {
    return Math.max(0, montoACubrir - totalSeleccionado);
  }, [montoACubrir, totalSeleccionado]);

  const getSaldoEfectivo = (ant: AnticipoDisponible) => {
    const ef = anticipoSaldoEfectivoMap?.get(ant.id);
    return ef !== undefined ? ef : ant.saldo_actual;
  };

  const handleToggle = (ant: AnticipoDisponible, checked: boolean) => {
    const saldoEfectivo = getSaldoEfectivo(ant);
    setSeleccionadosMap((prev) => {
      const currentMap = { ...prev };
      if (checked) {
        const acumuladoOtro = Object.entries(currentMap).reduce((acc, [id, val]) => {
          return Number(id) !== ant.id && val.checked ? acc + val.monto : acc;
        }, 0);
        const pendPorCubrir = Math.max(0, montoACubrir - acumuladoOtro);
        const sugerido = Math.min(pendPorCubrir, saldoEfectivo);

        currentMap[ant.id] = { checked: true, monto: sugerido };
      } else {
        currentMap[ant.id] = { checked: false, monto: 0 };
      }
      return currentMap;
    });
  };

  const handleMontoChange = (idAnticipo: number, valor: number | string) => {
    const valNum = typeof valor === "number" ? valor : parseFloat(String(valor)) || 0;
    setSeleccionadosMap((prev) => ({
      ...prev,
      [idAnticipo]: {
        checked: valNum > 0,
        monto: valNum,
      },
    }));
  };

  const handleConfirmar = () => {
    const resultado: REQ_ValorizacionAnticipoItem[] = Object.entries(
      seleccionadosMap,
    )
      .filter(([, val]) => val.checked && val.monto > 0)
      .map(([id, val]) => {
        const idNum = Number(id);
        const ant = anticipos.find((a: AnticipoDisponible) => a.id === idNum);
        return {
          id_anticipo_proveedor: idNum,
          monto_retirado: val.monto,
          factura: ant ? ant.factura : undefined,
        };
      });

    onConfirmarAnticipos(resultado);
    onClose();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Seleccionar Anticipos Disponibles"
      size="lg"
    >
      <Stack gap="sm" mt="xs">
        {/* Banner Resumen Métrica */}
        <Paper p="xs" radius="md" bg="#18181b" className="border border-zinc-800">
          <Grid align="center" gutter="xs">
            <Grid.Col span={4}>
              <Box p={6} bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                  Total Valorización
                </Text>
                <Text fz="xs" fw={700} c="cyan.3">
                  $ {montoACubrir.toFixed(2)}
                </Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={4}>
              <Box p={6} bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                  Anticipos Seleccionados
                </Text>
                <Text fz="xs" fw={700} c="emerald.3">
                  $ {totalSeleccionado.toFixed(2)}
                </Text>
              </Box>
            </Grid.Col>
            <Grid.Col span={4}>
              <Box p={6} bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                  Restante a Transferir
                </Text>
                <Text fz="xs" fw={700} c="amber.3">
                  $ {restante.toFixed(2)}
                </Text>
              </Box>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Listado en Cards de Anticipos */}
        {loading ? (
          <Box p="lg" className="text-center">
            <Loader size="sm" color="indigo" />
            <Text fz="xs" c="zinc.4" mt="xs">
              Cargando anticipos del proveedor...
            </Text>
          </Box>
        ) : anticipos.length === 0 ? (
          <Box p="md" bg="#18181b" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <IconCoins size={24} className="mx-auto text-zinc-500 mb-1" />
            <Text fz="xs" c="zinc.4">
              El proveedor no cuenta con anticipos aprobados con saldo disponible.
            </Text>
          </Box>
        ) : (
          <Stack gap="xs" className="max-h-87.5 overflow-y-auto pr-1">
            {anticipos.map((ant) => {
              const sel = seleccionadosMap[ant.id] || { checked: false, monto: 0 };
              const saldoEfectivo = getSaldoEfectivo(ant);

              return (
                <Paper
                  key={ant.id}
                  p="xs"
                  radius="md"
                  bg={sel.checked ? "#1e1b4b/40" : "#18181b"}
                  className={`border transition-all duration-200 ${
                    sel.checked ? "border-indigo-500/80 shadow-md shadow-indigo-950/20" : "border-zinc-800"
                  }`}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Checkbox
                        checked={sel.checked}
                        onChange={(e) => handleToggle(ant, e.currentTarget.checked)}
                        color="indigo"
                        size="xs"
                      />
                      <Stack gap={0}>
                        <Group gap={6}>
                          <Text fw={700} fz="xs" c="white">
                            Factura: {ant.factura}
                          </Text>
                          <Badge color="cyan" variant="light" size="xs">
                            Saldo: ${saldoEfectivo.toFixed(2)}
                          </Badge>
                        </Group>
                        <Text fz={10} c="dimmed">
                          Fecha: {ant.created_at ? ant.created_at.split(" ")[0] : "-"}
                        </Text>
                      </Stack>
                    </Group>

                    <div className="w-36">
                      <NumberInput
                        placeholder="Monto a retirar"
                        value={sel.checked ? sel.monto : ""}
                        disabled={!sel.checked}
                        onChange={(val) => handleMontoChange(ant.id, val ?? 0)}
                        min={0}
                        max={saldoEfectivo}
                        decimalScale={2}
                        size="xs"
                        radius="md"
                        classNames={fieldClasses}
                      />
                    </div>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}

        {/* Acciones */}
        <Group justify="end" gap="xs" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose} radius="lg" size="xs">
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleConfirmar}
            radius="lg"
            size="xs"
            leftSection={<IconCheck size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Confirmar Selección
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
