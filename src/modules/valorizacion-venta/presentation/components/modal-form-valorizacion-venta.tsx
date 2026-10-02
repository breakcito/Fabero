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
import { ModalAgregarDespachoDetalle } from "./modal-agregar-despacho-detalle";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { formatNumber } from "../../../../shared/functions/formatNumber";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RES_Empresa } from "../../../../service/responses/empresa";
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
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [empresas, setEmpresas] = useState<RES_Empresa[]>([]);
  const [detalleEditando, setDetalleEditando] = useState<{
    req: REQ_ValorizacionVentaDetalleItem;
    display: RES_ValorizacionVentaDetalle;
    index: number;
  } | null>(null);

  const {
    loadingSubmit,
    idPlanta,
    setIdPlanta,
    idEmpresa,
    setIdEmpresa,
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

    queueMicrotask(() => {
      setLoadingPlantas(true);
      setLoadingEmpresas(true);
    });

    Promise.all([
      ValorizacionVentaAuxService.getPlantasConDistribuciones(),
      AuxService.get_empresas(),
    ])
      .then(([resPlantas, resEmpresas]) => {
        if (resPlantas.success && resPlantas.data) {
          setPlantas(resPlantas.data);
        }
        if (resEmpresas.success && resEmpresas.data) {
          setEmpresas(resEmpresas.data);
          if (!idEmpresa && !valorizacionEditar) {
            const fabero = resEmpresas.data.find((e) =>
              e.razon_social?.toLowerCase().includes("fabero")
            );
            if (fabero) {
              setIdEmpresa(fabero.id_empresa);
            } else if (resEmpresas.data.length > 0) {
              setIdEmpresa(resEmpresas.data[0].id_empresa);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoadingPlantas(false);
        setLoadingEmpresas(false);
      });
  }, [opened, valorizacionEditar, idEmpresa, setIdEmpresa]);

  const isEdit = !!valorizacionEditar;

  const plantaSeleccionada = useMemo(() => {
    if (!idPlanta) return null;
    return plantas.find((p) => p.id === idPlanta) ?? null;
  }, [idPlanta, plantas]);

  const empresaSeleccionada = useMemo(() => {
    if (!idEmpresa) return null;
    return empresas.find((e) => e.id_empresa === idEmpresa) ?? null;
  }, [idEmpresa, empresas]);

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
    <Group gap="xs" wrap="nowrap" align="center">
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
        w={240}
        classNames={{
          ...fieldClasses,
          label: "text-zinc-400 mb-1 font-medium text-[10px] ml-1",
          input: "h-8 text-xs",
        }}
        comboboxProps={{ withinPortal: true }}
      />
      <Select
        placeholder={loadingEmpresas ? "Cargando..." : "[Seleccione Empresa]"}
        disabled={loadingEmpresas || isEdit}
        rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
        data={empresas.map((e) => ({
          value: String(e.id_empresa),
          label: e.razon_social || e.ruc || `Empresa #${e.id_empresa}`,
        }))}
        value={idEmpresa ? String(idEmpresa) : null}
        onChange={(val) => setIdEmpresa(val ? Number(val) : null)}
        searchable
        size="xs"
        radius="lg"
        w={240}
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
          style={{ width: 140 }}
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

          {/* Grid principal: Información de Planta + Código Interno (izq) y Items de Despacho (der) */}
          <Grid gutter="sm" align="stretch">
            {/* Columna Izquierda: Información de Planta y Código Interno del Cliente */}
            <Grid.Col span={{ base: 12, md: 4, lg: 3.5 }}>
              <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
                <Stack gap="xs">
                  <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                    <IconBuildingFactory size={15} /> Información de Planta y Empresa
                  </Text>
                  {empresaSeleccionada && (
                    <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1.5">
                      <Group justify="space-between">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Empresa:</Text>
                        <Badge color="violet" variant="outline" size="xs">
                          {empresaSeleccionada.ruc || "-"}
                        </Badge>
                      </Group>
                      <Group justify="space-between" wrap="nowrap">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Razón Social:</Text>
                        <Text fz={11} c="white" fw={600} className="truncate max-w-50 text-right">
                          {empresaSeleccionada.razon_social}
                        </Text>
                      </Group>
                    </Box>
                  )}
                  {plantaSeleccionada ? (
                    <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1.5">
                      <Group justify="space-between">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Planta Destino:</Text>
                        <Badge color="cyan" variant="outline" size="xs">
                          {plantaSeleccionada.ruc || "-"}
                        </Badge>
                      </Group>
                      <Group justify="space-between" wrap="nowrap">
                        <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Razón Social:</Text>
                        <Text fz={11} c="white" fw={600} className="truncate max-w-50 text-right">
                          {plantaSeleccionada.razon_social}
                        </Text>
                      </Group>
                    </Box>
                  ) : (
                    <Box p="xs" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center">
                      <Text fz={11} c="zinc.5">Seleccione una planta destino</Text>
                    </Box>
                  )}

                  <Stack gap={6} mt="xs">
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      Código Valorización
                    </Text>
                    <TextInput
                      placeholder="Código de Valorización"
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

            {/* Columna Derecha: Items de Despacho */}
            <Grid.Col span={{ base: 12, md: 8, lg: 8.5 }}>
              <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
                <Stack gap="xs" className="flex-1">
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap={6} wrap="nowrap">
                      <IconFileText size={16} className="text-amber-400" />
                      <Text fw={700} fz="xs" c="amber.4">
                        Items de Despacho ({detalles.length})
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
                          Nuevo Item
                        </Button>
                      </Tooltip>
                    </Group>
                  </Group>

                  {/* Lista de items o placeholder */}
                  {detalles.length === 0 ? (
                    <Box p="md" bg="#0f0f12" className="rounded-lg border border-dashed border-zinc-800 text-center my-auto">
                      <Text fz="xs" c="zinc.5" fs="italic" fw={500}>
                        No hay items agregados a la valorización. Haga clic en "+ Nuevo Item" para comenzar.
                      </Text>
                    </Box>
                  ) : (
                    <Stack gap="xs" className="max-h-96 overflow-y-auto pr-1">
                      {detalles.map((d, idx) => {
                        const esOro = d.display.elemento_quimico === "Oro";
                        const codigosCliente = d.display.codigos_cliente || d.display.codigo_cliente;
                        return (
                          <Paper
                            key={idx}
                            p="xs"
                            radius="md"
                            className="bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/60 transition-all duration-200"
                          >
                            {/* Header: elemento + despacho + lote/blend + cliente + acciones */}
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
                                {codigosCliente && (
                                  <Badge variant="outline" color="indigo" size="xs">
                                    Cliente: {codigosCliente}
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

                            {/* Disposición mejorada de Métricas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2 pt-2.5">
                              {/* Bloque 1: Masa y Humedad */}
                              <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                  Masa y Humedad
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center items-center">
                                  <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">TMH (t)</div>
                                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                                      {formatNumber(d.display.tmh / 1000, 3)}
                                    </div>
                                  </div>
                                  <div className="border-x border-zinc-800/80 px-1">
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">% H2O</div>
                                    <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                                      {formatNumber(d.display.ley_humedad, 2)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">TMS (t)</div>
                                    <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                                      {formatNumber(d.display.tms / 1000, 3)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Bloque 2: Ley y Recuperación */}
                              <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                  Ley y Metalurgia
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center items-center">
                                  <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Ley Final</div>
                                    <div className="text-xs font-mono font-bold text-yellow-400 mt-0.5 truncate">
                                      {formatNumber(d.display.ley, 3)}{" "}
                                      <span className="text-[9px] text-zinc-500 font-normal">
                                        oz/tc
                                      </span>
                                    </div>
                                  </div>
                                  <div className="border-x border-zinc-800/80 px-1">
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">REC (%)</div>
                                    <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                                      {formatNumber(d.display.recuperacion, 2)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Factor</div>
                                    <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
                                      {formatNumber(d.display.factor, 4)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Bloque 3: Condiciones Comerciales */}
                              <div className="xl:col-span-3 bg-[#0d0d10] border border-zinc-800/90 rounded-lg p-2.5 flex flex-col justify-between">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                  Condiciones Comerciales
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Inter:</span>
                                    <span className="text-xs font-mono font-bold text-white">
                                      ${formatNumber(d.display.inter, 2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">D.Inter:</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                      ${formatNumber(d.display.des_inter, 2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Maquila:</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                      ${formatNumber(d.display.maquila, 2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Consumo:</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                      ${formatNumber(d.display.consumo, 2)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Bloque 4: Precio y Subtotal Lote */}
                              <div className="xl:col-span-3 flex flex-col justify-between gap-1.5">
                                <div className="bg-[#0d0d10] border border-zinc-800/90 rounded-lg px-3 py-1.5 flex items-center justify-between flex-1">
                                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                    Precio / TN
                                  </span>
                                  <span className="text-xs font-mono font-extrabold text-white whitespace-nowrap">
                                    $ {formatNumber(d.display.precio_por_tonelada, 2)}
                                  </span>
                                </div>
                                <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-lg px-3 py-1.5 flex items-center justify-between flex-1">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    Subtotal Lote
                                  </span>
                                  <span className="text-sm font-mono font-extrabold text-emerald-300 whitespace-nowrap">
                                    $ {formatNumber(d.display.subtotal, 2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>

                {/* Footer con totales */}
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
                        $ {formatNumber(totalSubtotal, 2)}
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
                        $ {formatNumber(totalFinal, 2)}
                      </Text>
                    </Stack>
                  </Group>
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>

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

      <ModalAgregarDespachoDetalle
        opened={modalDetalleOpened}
        onClose={() => {
          setModalDetalleOpened(false);
          setDetalleEditando(null);
        }}
        idPlanta={idPlanta}
        idValorizacionEdicion={valorizacionEditar?.id}
        existingDetalles={detalles.map((d) => ({
          id_despacho_detalle: (d.display.id_despacho_detalle ?? d.display.id_distribucion_detalle) as number,
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
