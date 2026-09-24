import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Badge,
  ActionIcon,
  Loader,
  Box,
  Tooltip,
  NumberInput,
  TextInput,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconFileText,
  IconPencil,
  IconPaperclip,
  IconBuildingFactory,
} from "@tabler/icons-react";
import { useFormValorizacionVenta } from "../../hooks/useFormValorizacionVenta";
import { ModalAgregarDistribucionDetalle } from "./modal-agregar-distribucion-detalle";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { ValorizacionVentaAuxService } from "../../service/valorizacion-venta.service";
import type {
  RES_ValorizacionVenta,
  RES_ValorizacionVentaDetalle,
} from "../../service/valorizacion-venta.responses";
import type {
  REQ_ValorizacionVentaDetalleItem,
} from "../../service/valorizacion-venta.requests";

interface PlantaDisponible {
  id: number;
  ruc: string;
  razon_social: string;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  valorizacionEditar?: RES_ValorizacionVenta | null;
  onSuccess: () => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalFormValorizacionVenta = ({
  opened,
  onClose,
  valorizacionEditar,
  onSuccess,
}: Props) => {
  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [plantas, setPlantas] = useState<PlantaDisponible[]>([]);
  const [detalleEditando, setDetalleEditando] = useState<{
    req: REQ_ValorizacionVentaDetalleItem;
    display: RES_ValorizacionVentaDetalle;
    index: number;
  } | null>(null);

  const {
    loadingSubmit,
    idPlanta,
    setIdPlanta,
    codigo,
    setCodigo,
    detalles,
    totalSubtotal,
    evidencias,
    setEvidencias,
    evidenciasExistentes,
    setEvidenciasExistentes,
    fechaHoraValorizacion,
    setFechaHoraValorizacion,
    montoPenalidad,
    setMontoPenalidad,
    montoFlete,
    setMontoFlete,
    modalDetalleOpened,
    setModalDetalleOpened,
    handleAgregarDetalle,
    handleEditarDetalle,
    handleEliminarDetalle,
    handleSubmit,
  } = useFormValorizacionVenta({
    opened,
    valorizacionEditar,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (!opened) return;

    const cargar = async () => {
      setLoadingPlantas(true);
      try {
        const res = await ValorizacionVentaAuxService.getPlantasConDistribuciones();
        if (res.success && res.data) {
          setPlantas(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPlantas(false);
      }
    };

    cargar();
  }, [opened]);

  const isEdit = !!valorizacionEditar;

  const plantaSeleccionada = useMemo(() => {
    if (!idPlanta) return null;
    return plantas.find((p) => p.id === idPlanta) ?? null;
  }, [idPlanta, plantas]);

  const modalTitle = (
    <Group gap="xs">
      <Text fw={700} fz="sm" c="white">
        {isEdit
          ? valorizacionEditar.codigo
            ? `Editar Valorización de Venta: ${valorizacionEditar.codigo} | ${valorizacionEditar.planta_nombre ?? ""}`
            : `Editar Valorización de Venta | ${valorizacionEditar.planta_nombre ?? ""}`
          : "Nueva Valorización de Venta"}
      </Text>
    </Group>
  );

  const modalHeaderRight = (
    <Group gap="md" wrap="nowrap" align="center">
      <Select
        placeholder={loadingPlantas ? "Cargando..." : "[Seleccione Planta]"}
        disabled={loadingPlantas || isEdit}
        rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
        data={plantas.map((p) => ({
          value: String(p.id),
          label: p.ruc ? `${p.ruc} - ${p.razon_social}` : p.razon_social,
        }))}
        value={idPlanta ? String(idPlanta) : null}
        onChange={(val) => setIdPlanta(val ? Number(val) : null)}
        searchable
        size="xs"
        radius="lg"
        w={280}
        classNames={{
          ...fieldClasses,
          label: "text-zinc-400 mb-1 font-medium text-[10px] ml-1",
          input: "h-8 text-xs",
        }}
        comboboxProps={{ withinPortal: true }}
      />
      <Group gap={6} wrap="nowrap" align="center">
        <Text fz={10} fw={600} c="zinc.400" tt="uppercase" lts="0.04em">
          Fecha Valorización:
        </Text>
        <CustomDatePicker
          value={fechaHoraValorizacion ?? undefined}
          onChange={(d) => {
            if (!d) {
              setFechaHoraValorizacion(null);
              return;
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            const now = new Date();
            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            setFechaHoraValorizacion(iso);
          }}
          placeholder="DD/MM/YYYY"
          style={{ width: 150 }}
        />
      </Group>
    </Group>
  );

  // Total final = subtotal + penalidad - flete
  const totalFinal = totalSubtotal + montoPenalidad - montoFlete;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={modalTitle}
        size="1500px"
        rightSection={modalHeaderRight}
      >
        <Stack gap="sm" mt="xs" pb="md">
          <button
            data-autofocus
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only opacity-0 w-0 h-0 p-0 m-0 pointer-events-none absolute -z-50"
          />

          {/* Fila 1: Información de Planta y Código (3 columnas para mantener proporción visual con compra) */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full">
                <Stack gap="xs">
                  <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                    <IconBuildingFactory size={15} /> Información de Planta
                  </Text>
                  {plantaSeleccionada ? (
                    <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1">
                      <Group justify="space-between">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>RUC:</Text>
                        <Badge color="cyan" variant="outline" size="xs">
                          {plantaSeleccionada.ruc || "-"}
                        </Badge>
                      </Group>
                      <Group justify="space-between" wrap="nowrap">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Razón Social:</Text>
                        <Text fz={11} c="white" fw={600} className="truncate max-w-50">
                          {plantaSeleccionada.razon_social}
                        </Text>
                      </Group>
                    </Box>
                  ) : (
                    <Box p="xs" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center">
                      <Text fz={11} c="zinc.5">Seleccione una planta destino</Text>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full">
                <Stack gap="xs">
                  <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                    Código de Identificación
                  </Text>
                  <Stack gap={6}>
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      Código Interno del Cliente (opcional, máx. 20 caracteres):
                    </Text>
                    <TextInput
                      placeholder="Código interno del cliente"
                      value={codigo}
                      onChange={(e) => setCodigo(e.currentTarget.value)}
                      maxLength={20}
                      size="xs"
                      radius="lg"
                      classNames={fieldClasses}
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Fila 2: Lotes de Despacho (full-width) — equivalente a "Lotes Valorizados" en compra */}
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800">
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={6} wrap="nowrap">
                  <IconFileText size={16} className="text-amber-400" />
                  <Text fw={700} fz="xs" c="amber.4">
                    Lotes de Despacho ({detalles.length})
                  </Text>
                </Group>
                <Group gap={6}>
                  <Tooltip
                    label={!idPlanta ? "Seleccione una planta primero" : ""}
                    disabled={!!idPlanta}
                    withArrow
                  >
                    <Button
                      leftSection={<IconPlus size={14} />}
                      color="indigo"
                      radius="lg"
                      size="xs"
                      disabled={!idPlanta}
                      onClick={() => {
                        setDetalleEditando(null);
                        setModalDetalleOpened(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-[11px] px-2.5 font-bold"
                    >
                      Nuevo Lote
                    </Button>
                  </Tooltip>
                </Group>
              </Group>

              {/* Lista de lotes o placeholder */}
              {detalles.length === 0 ? (
                <Box p="md" bg="#0f0f12" className="rounded-lg border border-dashed border-zinc-800 text-center">
                  <Text fz="xs" c="zinc.5" fs="italic" fw={500}>
                    No hay lotes agregados a la valorización. Haga clic en "+ Nuevo Lote" para comenzar.
                  </Text>
                </Box>
              ) : (
                <Stack gap="xs" className="max-h-96 overflow-y-auto pr-1">
                  {detalles.map((d, idx) => {
                    const esOro = d.display.elemento_quimico === "Oro";
                    return (
                      <Paper
                        key={idx}
                        p="xs"
                        radius="md"
                        className="bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/60 transition-all duration-200"
                      >
                        {/* Header: badges + despacho + acciones */}
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap" className="min-w-0">
                            <Badge color={esOro ? "yellow" : "gray"} variant="filled" size="xs" fw={700}>
                              {d.display.elemento_quimico}
                            </Badge>
                            <Text fw={700} fz="xs" c="white" className="font-mono truncate">
                              Despacho: {d.display.despacho_correlativo || "-"}
                            </Text>
                            {d.display.lote_correlativo && (
                              <Badge variant="outline" color="cyan" size="xs">
                                Lote: {d.display.lote_correlativo}
                              </Badge>
                            )}
                            {d.display.blending_correlativo && (
                              <Badge variant="outline" color="grape" size="xs">
                                Blend: {d.display.blending_correlativo}
                              </Badge>
                            )}
                            {d.display.codigo_cliente && (
                              <Badge variant="outline" color="indigo" size="xs">
                                Cód: {d.display.codigo_cliente}
                              </Badge>
                            )}
                          </Group>
                          <Group gap={4} wrap="nowrap" className="shrink-0">
                            <Tooltip label="Editar detalle" withArrow>
                              <ActionIcon
                                color="cyan"
                                variant="subtle"
                                size="xs"
                                onClick={() => {
                                  setDetalleEditando({
                                    req: d.req,
                                    display: d.display,
                                    index: idx,
                                  });
                                  setModalDetalleOpened(true);
                                }}
                              >
                                <IconPencil size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Quitar detalle" withArrow>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                size="xs"
                                onClick={() => handleEliminarDetalle(idx)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Group>

                        {/* Grid Estructurada de Métricas — 4 columnas como en compra */}
                        <Grid pt="xs" gutter="xs" align="center">
                          {/* Col 1: TMH / % H2O / TMS */}
                          <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                            <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>TMH (t):</Text>
                                <Text fz={11} fw={700} c="white">{(d.display.tmh / 1000).toFixed(3)}</Text>
                              </Group>
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>% H2O:</Text>
                                <Text fz={11} fw={700} c="cyan.3">{d.display.ley_humedad.toFixed(2)}%</Text>
                              </Group>
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>TMS (t):</Text>
                                <Text fz={11} fw={700} c="emerald.3">{(d.display.tms / 1000).toFixed(3)}</Text>
                              </Group>
                            </Box>
                          </Grid.Col>

                          {/* Col 2: Ley Cliente / REC / Factor */}
                          <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                            <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Ley Cliente:</Text>
                                <Text fz={11} fw={700} c="yellow.3">{d.display.ley.toFixed(4)}</Text>
                              </Group>
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>REC (%):</Text>
                                <Text fz={11} fw={700} c="amber.3">{d.display.recuperacion.toFixed(2)}%</Text>
                              </Group>
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Factor:</Text>
                                <Text fz={11} fw={700} c="white">{d.display.factor.toFixed(4)}</Text>
                              </Group>
                            </Box>
                          </Grid.Col>

                          {/* Col 3: Inter / Des.Inter / Maquila / Consumo */}
                          <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                            <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Inter / Des.Inter:</Text>
                                <Text fz={11} fw={700} c="white">${d.display.inter.toFixed(2)} / ${d.display.des_inter.toFixed(2)}</Text>
                              </Group>
                              <Group justify="space-between">
                                <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Maquila / Consumo:</Text>
                                <Text fz={11} fw={700} c="white">${d.display.maquila.toFixed(3)} / ${d.display.consumo.toFixed(3)}</Text>
                              </Group>
                            </Box>
                          </Grid.Col>

                          {/* Col 4: Precio/TN + Subtotal */}
                          <Grid.Col span={{ base: 12, md: 3 }}>
                            <Group justify="end" gap="xs">
                              <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 text-right flex-1">
                                <Text fz={9} c="zinc.4" tt="uppercase" fw={600}>Precio / TN</Text>
                                <Text fz="xs" fw={700} c="white">$ {d.display.precio_por_tonelada.toFixed(2)}</Text>
                              </Box>
                              <Box p="xs" bg="#14532d/40" className="rounded border border-emerald-800/80 text-right flex-1">
                                <Text fz={9} c="emerald.4" tt="uppercase" fw={700}>Subtotal Lote</Text>
                                <Text fz="sm" fw={800} c="emerald.3">$ {d.display.subtotal.toFixed(2)}</Text>
                              </Box>
                            </Group>
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* Footer con totales (estilo compra) */}
              <Group
                justify="space-between"
                align="center"
                mt="xs"
                pt="sm"
                className="border-t border-zinc-800"
                wrap="wrap"
              >
                <Group gap="md" wrap="wrap">
                  <Text fz="xs" c="zinc.4" tt="uppercase" fw={700}>
                    Total Lotes: <span className="text-white font-mono">{detalles.length}</span>
                  </Text>
                </Group>

                <Group gap="lg" wrap="wrap" justify="end">
                  <Stack gap={2} align="end">
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      Subtotal:
                    </Text>
                    <Text fz="sm" fw={700} c="white" className="font-mono">
                      $ {totalSubtotal.toFixed(2)}
                    </Text>
                  </Stack>

                  <Stack gap={2}>
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      Penalidad:
                    </Text>
                    <NumberInput
                      value={montoPenalidad}
                      onChange={(val) =>
                        setMontoPenalidad(typeof val === "number" ? val : parseFloat(String(val)) || 0)
                      }
                      min={0}
                      decimalScale={2}
                      hideControls
                      size="xs"
                      radius="lg"
                      w={120}
                      classNames={{
                        input: "bg-zinc-950 border-yellow-700/50 text-yellow-300 font-mono font-bold h-7 text-right text-xs",
                        label: "text-yellow.5 mb-1 font-medium text-[10px] ml-0 text-right block",
                      }}
                    />
                  </Stack>

                  <Stack gap={2}>
                    <Text fz={10} c="cyan.4" tt="uppercase" fw={600}>
                      Flete:
                    </Text>
                    <NumberInput
                      value={montoFlete}
                      onChange={(val) =>
                        setMontoFlete(typeof val === "number" ? val : parseFloat(String(val)) || 0)
                      }
                      min={0}
                      decimalScale={2}
                      hideControls
                      size="xs"
                      radius="lg"
                      w={120}
                      classNames={{
                        input: "bg-zinc-950 border-cyan-700/50 text-cyan-300 font-mono font-bold h-7 text-right text-xs",
                        label: "text-cyan.5 mb-1 font-medium text-[10px] ml-0 text-right block",
                      }}
                    />
                  </Stack>

                  <Stack gap={2} align="end">
                    <Text fz={10} c="emerald.4" tt="uppercase" fw={700}>
                      Total Valorización:
                    </Text>
                    <Text fz="md" fw={800} c="emerald.3" className="font-mono">
                      $ {totalFinal.toFixed(2)}
                    </Text>
                  </Stack>
                </Group>
              </Group>
            </Stack>
          </Paper>

          {/* Fila 3: Evidencias Multimedia (full-width) */}
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800">
            <Stack gap="xs">
              <Group gap={4} align="center">
                <IconPaperclip size={14} className="text-indigo-400" />
                <Text fw={700} fz="xs" c="zinc.400" tt="uppercase">
                  Adjuntar Evidencias / Comprobantes (Opcional)
                </Text>
              </Group>
              <Text fz="xs" c="dimmed" fw={500}>
                Imágenes o documentos: PDF, JPG, PNG...
              </Text>
              <MultiFilePicker
                files={evidencias}
                onFilesChange={setEvidencias}
                existingFiles={evidenciasExistentes}
                onRemoveExisting={(path: string) =>
                  setEvidenciasExistentes((prev) =>
                    prev.filter((e) => e.path_relativo !== path),
                  )
                }
                maxFiles={10}
              />
            </Stack>
          </Paper>

          {/* Footer: Botones */}
          <Group justify="flex-end" mt="xs">
            <Button
              variant="light"
              color="gray"
              size="sm"
              radius="lg"
              onClick={onClose}
              disabled={loadingSubmit}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              radius="lg"
              type="submit"
              loading={loadingSubmit}
              onClick={() => handleSubmit()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isEdit ? "Guardar Cambios" : "Crear Valorización"}
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalAgregarDistribucionDetalle
        opened={modalDetalleOpened}
        onClose={() => {
          setModalDetalleOpened(false);
          setDetalleEditando(null);
        }}
        idPlanta={idPlanta}
        idValorizacionEdicion={valorizacionEditar?.id}
        existingDetalles={detalles.map((d) => ({
          id_distribucion_detalle: d.display.id_distribucion_detalle,
          elemento_quimico: d.display.elemento_quimico,
        }))}
        detalleEditar={detalleEditando}
        fechaHoraValorizacion={fechaHoraValorizacion}
        onAgregarDetalle={handleAgregarDetalle}
        onEditarDetalle={(index, req, display) => {
          handleEditarDetalle(index, req, display);
        }}
      />
    </>
  );
};
