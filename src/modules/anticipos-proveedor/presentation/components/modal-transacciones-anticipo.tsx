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
import { IconReceipt2, IconBuildingBank, IconUserCheck } from "@tabler/icons-react";
import dayjs from "dayjs";
import { AnticiposProveedorService } from "../../service/anticipos-proveedor.service";
import { ValorizacionCompraService } from "../../../valorizacion-compra/service/valorizacion-compra.service";
import { EstadoTransaccionAnticipo } from "../../../../shared/enums/valorizacion-compra/estado-transaccion-anticipo";
import type {
  RES_AnticipoProveedor,
  RES_TransaccionAnticipo,
} from "../../service/anticipos-proveedor.responses";

interface Props {
  opened: boolean;
  onClose: () => void;
  anticipoInfo: RES_AnticipoProveedor | null;
}

interface AprobInfo {
  empleado_aprobacion: string | null;
  fecha_hora_aprobacion: string | null;
}

export const ModalTransaccionesAnticipo = ({
  opened,
  onClose,
  anticipoInfo,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [transacciones, setTransacciones] = useState<RES_TransaccionAnticipo[]>([]);
  // Mapa id_valorizacion_compra -> datos de aprobación.
  // Se carga como fallback cuando el endpoint de transacciones aún no devuelve
  // los campos empleado_aprobacion / fecha_hora_aprobacion (JOIN pendiente en backend).
  const [aprobMap, setAprobMap] = useState<Map<number, AprobInfo>>(new Map());

  useEffect(() => {
    if (!opened || !anticipoInfo) {
      setTransacciones([]);
      setAprobMap(new Map());
      return;
    }

const cargarTransacciones = async () => {
      setLoading(true);
      try {
        const res = await AnticiposProveedorService.get_transacciones(anticipoInfo.id);
        if (res.success && res.data) {
          const aprobadas = res.data.filter(
            (t) => t.estado === EstadoTransaccionAnticipo.Aprobado,
          );
          setTransacciones(aprobadas);
          await cargarAprobInfoParaTransacciones(aprobadas);
        } else {
          setTransacciones([]);
        }
      } catch (e) {
        console.error("Error al cargar transactions del anticipo", e);
        setTransacciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTransacciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, anticipoInfo]);

  // Para cada transacción aprobada/anulada que NO tenga aún datos de aprobación,
  // consulta el detalle de la valorización y guarda el resultado en aprobMap.
  const cargarAprobInfoParaTransacciones = async (txs: RES_TransaccionAnticipo[]) => {
    const faltantes = txs.filter(
      (t) =>
        !t.empleado_aprobacion &&
        !t.fecha_hora_aprobacion &&
        t.id_valorizacion_compra &&
        String(t.estado || "").toLowerCase() !== "pendiente",
    );

    if (faltantes.length === 0) return;

    const idsUnicos = Array.from(
      new Set(faltantes.map((t) => t.id_valorizacion_compra)),
    );

    const nuevasEntradas = new Map<number, AprobInfo>();
    await Promise.all(
      idsUnicos.map(async (id) => {
        try {
          const res = await ValorizacionCompraService.obtenerValorizacion(id);
          if (res.success && res.data) {
            nuevasEntradas.set(id, {
              empleado_aprobacion: res.data.empleado_aprobacion ?? null,
              fecha_hora_aprobacion: res.data.fecha_hora_aprobacion ?? null,
            });
          }
        } catch (err) {
          console.error(`Error al cargar aprobación de valorización ${id}`, err);
        }
      }),
    );

    if (nuevasEntradas.size > 0) {
      setAprobMap((prev) => {
        const merged = new Map(prev);
        nuevasEntradas.forEach((v, k) => merged.set(k, v));
        return merged;
      });
    }
  };

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
      size="xl"
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
                  No hay transacciones aprobadas registradas para este anticipo.
                </Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea.Autosize mah={420}>
              <Table highlightOnHover border={0} verticalSpacing="xs">
                <Table.Thead bg="#09090b">
                  <Table.Tr>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px" }}>
                      Valorización
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "right" }}>
                      Monto Retirado
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "right" }}>
                      Saldo Actual
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "right" }}>
                      Saldo Resultante
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "center" }}>
                      Estado
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "center" }}>
                      Aprobado por
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "center" }}>
                      F. Aprobación
                    </Table.Th>
                    <Table.Th style={{ color: "#a1a1aa", fontSize: "11px", textAlign: "center" }}>
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

                    // Fuente 1: campos propios del backend de transacciones.
                    // Fuente 2: fallback via fetch del detalle de valorización.
                    const aprob =
                      t.empleado_aprobacion || t.fecha_hora_aprobacion
                        ? {
                            empleado: t.empleado_aprobacion,
                            fecha: t.fecha_hora_aprobacion,
                          }
                        : (() => {
                            const fallback = aprobMap.get(t.id_valorizacion_compra);
                            return {
                              empleado: fallback?.empleado_aprobacion ?? null,
                              fecha: fallback?.fecha_hora_aprobacion ?? null,
                            };
                          })();

                    return (
                      <Table.Tr key={t.id} className="border-b border-zinc-800/50">
                        <Table.Td>
                          <Badge variant="light" color="indigo" radius="sm" size="xs">
                            {t.valorizacion_codigo}
                          </Badge>
                        </Table.Td>

                        <Table.Td style={{ textAlign: "right" }}>
                          <Text fz="xs" fw={700} className="font-mono text-amber-400">
                            -${t.monto_retirado.toFixed(2)}
                          </Text>
                        </Table.Td>

                        <Table.Td style={{ textAlign: "right" }}>
                          <Text fz="xs" fw={600} className="font-mono text-cyan-400">
                            ${t.saldo_actual.toFixed(2)}
                          </Text>
                        </Table.Td>

                        <Table.Td style={{ textAlign: "right" }}>
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

                        <Table.Td style={{ textAlign: "center" }}>
                          <Badge
                            variant="dot"
                            color={isAprobado ? "teal" : isAnulado ? "red" : "amber"}
                            size="xs"
                          >
                            {t.estado}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          {aprob.empleado ? (
                            <Group gap={4} wrap="nowrap">
                              <ThemeIcon size="xs" variant="light" color="emerald" radius="sm">
                                <IconUserCheck size={10} />
                              </ThemeIcon>
                              <Text fz={11} fw={600} className="text-emerald-300 truncate">
                                {aprob.empleado}
                              </Text>
                            </Group>
                          ) : (
                            <Text fz="xs" c="dimmed" ta="center">
                              —
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: "center" }}>
                          {aprob.fecha ? (
                            <Text fz={11} className="font-mono text-zinc-300">
                              {dayjs(aprob.fecha).format("DD/MM/YYYY HH:mm")}
                            </Text>
                          ) : (
                            <Text fz="xs" c="dimmed">
                              —
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: "center" }}>
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
