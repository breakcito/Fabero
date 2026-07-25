import { useEffect, useState } from "react";
import {
  Modal,
  Group,
  Text,
  Stack,
  Paper,
  ThemeIcon,
  Badge,
  Table,
  Loader,
  Center,
  ScrollArea,
} from "@mantine/core";
import { IconReceipt2, IconBuildingBank } from "@tabler/icons-react";
import dayjs from "dayjs";
import { AnticiposProveedorService } from "../../service/anticipos-proveedor.service";
import type {
  RES_AnticipoProveedor,
  RES_TransaccionAnticipo,
} from "../../service/anticipos-proveedor.responses";

interface Props {
  opened: boolean;
  onClose: () => void;
  anticipoInfo: RES_AnticipoProveedor | null;
}

export const ModalTransaccionesAnticipo = ({
  opened,
  onClose,
  anticipoInfo,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [transacciones, setTransacciones] = useState<RES_TransaccionAnticipo[]>([]);

  useEffect(() => {
    if (!opened || !anticipoInfo) {
      setTransacciones([]);
      return;
    }

    const cargarTransacciones = async () => {
      setLoading(true);
      try {
        const res = await AnticiposProveedorService.get_transacciones(anticipoInfo.id);
        if (res.success && res.data) {
          setTransacciones(res.data);
        } else {
          setTransacciones([]);
        }
      } catch (e) {
        console.error("Error al cargar transacciones del anticipo", e);
        setTransacciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTransacciones();
  }, [opened, anticipoInfo]);

  if (!anticipoInfo) return null;

  const facturaStr =
    anticipoInfo.serie_factura || anticipoInfo.numero_factura
      ? `${anticipoInfo.serie_factura || "—"}-${anticipoInfo.numero_factura || "—"}`
      : "Sin Factura";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon variant="light" color="cyan" radius="md" size="md">
            <IconReceipt2 size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} fz="sm" c="white">
              Transacciones del Anticipo #{anticipoInfo.id}
            </Text>
            <Text fz={11} c="dimmed">
              {anticipoInfo.proveedor_nombre} • {facturaStr}
            </Text>
          </div>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      styles={{
        header: { backgroundColor: "#18181b", borderBottom: "1px solid #27272a" },
        content: { backgroundColor: "#09090b" },
      }}
    >
      <Stack gap="sm" py="xs">
        {/* Tabla / Lista de Transacciones */}
        <Paper p="xs" radius="md" bg="#18181b" className="border border-zinc-800">
          <Text fz="xs" fw={700} c="white" mb="xs">
            Movimientos y Uso en Valorizaciones
          </Text>

          {loading ? (
            <Center py="xl">
              <Loader size="sm" color="cyan" />
            </Center>
          ) : transacciones.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap={4}>
                <ThemeIcon size="lg" radius="xl" variant="light" color="gray">
                  <IconBuildingBank size={20} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" fw={500}>
                  No hay transacciones ni retiros registrados para este anticipo.
                </Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea.Autosize mah={360}>
              <Table highlightOnHover border={0} verticalSpacing="xs">
                <Table.Thead bg="#09090b">
                  <Table.Tr>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }}>
                      Valorización
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }} textAlign="right">
                      Monto Retirado
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }} textAlign="right">
                      Saldo Actual
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }} textAlign="right">
                      Saldo Resultante
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }} textAlign="center">
                      Estado
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }} textAlign="center">
                      Fecha / Hora
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transacciones.map((t) => {
                    const estadoStr = String(t.estado || "").toLowerCase();
                    const isAprobado = estadoStr === "aprobado";
                    const isAnulado = estadoStr === "anulado";

                    const saldoResultante = isAprobado
                      ? Math.max(0, t.saldo_actual - t.monto_retirado)
                      : null;

                    return (
                      <Table.Tr key={t.id} className="border-b border-zinc-800/50">
                        <Table.Td>
                          <Badge variant="light" color="indigo" radius="sm" size="xs">
                            {t.valorizacion_codigo}
                          </Badge>
                        </Table.Td>

                        <Table.Td textAlign="right">
                          <Text fz="xs" fw={700} className="font-mono text-amber-400">
                            -${t.monto_retirado.toFixed(2)}
                          </Text>
                        </Table.Td>

                        <Table.Td textAlign="right">
                          <Text fz="xs" fw={600} className="font-mono text-cyan-400">
                            ${t.saldo_actual.toFixed(2)}
                          </Text>
                        </Table.Td>

                        <Table.Td textAlign="right">
                          {isAprobado ? (
                            <Text fz="xs" fw={700} className="font-mono text-emerald-400">
                              ${saldoResultante?.toFixed(2)}
                            </Text>
                          ) : (
                            <Text fz="xs" c="dimmed">
                              —
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td textAlign="center">
                          <Badge
                            variant="dot"
                            color={isAprobado ? "teal" : isAnulado ? "red" : "amber"}
                            size="xs"
                          >
                            {t.estado}
                          </Badge>
                        </Table.Td>

                        <Table.Td textAlign="center">
                          <Text fz={11} c="dimmed">
                            {dayjs(t.created_at).format("DD/MM/YYYY HH:mm")}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}
        </Paper>
      </Stack>
    </Modal>
  );
};
