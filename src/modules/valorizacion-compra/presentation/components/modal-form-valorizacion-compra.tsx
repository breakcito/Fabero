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
  IconBuildingBank,
  IconCheck,
  IconPencil,
  IconPaperclip,
  IconReceiptTax,
  IconCoins,
  IconScale,
  IconFlask,
} from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { useFormValorizacionCompra } from "../../hooks/useFormValorizacionCompra";
import { ModalAgregarLote } from "./modal-agregar-lote";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import type { RES_ValorizacionCompra, RES_ValorizacionCompraDetalle } from "../../service/valorizacion-compra.responses";
import type { REQ_ValorizacionDetalleItem } from "../../service/valorizacion-compra.requests";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";

interface Props {
  opened: boolean;
  onClose: () => void;
  valorizacionEditar?: RES_ValorizacionCompra | null;
  onSuccess: (idGuardado?: number) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalFormValorizacionCompra = ({
  opened,
  onClose,
  valorizacionEditar,
  onSuccess,
}: Props) => {
  const isEdit = Boolean(valorizacionEditar);
  const [modalMotivoOpened, setModalMotivoOpened] = useState(false);
  const [motivoEdicion, setMotivoEdicion] = useState("");
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const handlePresionarGuardar = () => {
    if (!validarFormulario()) return;
    if (isEdit) {
      setMotivoEdicion("");
      setModalMotivoOpened(true);
    } else {
      void handleSubmit();
    }
  };

  const handleConfirmarMotivo = async () => {
    setModalMotivoOpened(false);
    await handleSubmit(motivoEdicion);
  };
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [detalleEditando, setDetalleEditando] = useState<{
    req: REQ_ValorizacionDetalleItem;
    display: RES_ValorizacionCompraDetalle;
    index: number;
  } | null>(null);

  const {
    loadingSubmit,
    loadingCatalogo,
    idProveedor,
    setIdProveedor,
    idConcesion,
    setIdConcesion,
    detalles,
    concesiones,
    concesionSeleccionada,
    totalSubtotal,
    totalSubtotalSinDescuento,
    totalPenalidad,
    totalFlete,
    totalDescuentos,
    evidencias,
    setEvidencias,
    evidenciasExistentes,
    setEvidenciasExistentes,
    fechaHoraValorizacion,
    setFechaHoraValorizacion,
    porcentajeIgv,
    setPorcentajeIgv,
    porcentajeDetraccion,
    setPorcentajeDetraccion,
    modalLoteOpened,
    setModalLoteOpened,
    handleAgregarDetalle,
    handleEditarDetalle,
    handleEliminarDetalle,
    validarFormulario,
    handleSubmit,
  } = useFormValorizacionCompra({
    opened,
    valorizacionEditar,
    onSuccess: (idGuardado?: number) => {
      onSuccess(idGuardado);
      onClose();
    },
  });

  const lotesUnicosCount = useMemo(
    () => new Set(detalles.map((d) => d.req.id_lote_guia)).size,
    [detalles],
  );

  useEffect(() => {
    if (!opened) return;

    const cargarProv = async () => {
      setLoadingProveedores(true);
      try {
        if (valorizacionEditar) {
          const res = await AuxService.get_proveedores({ estado: EstadoBase.Activo });
          if (res.success && res.data) {
            setProveedores(res.data);
          }
        } else {
          const data = await AuxService.get_proveedores_valorizacion();
          setProveedores(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProveedores(false);
      }
    };

    cargarProv();
  }, [opened, valorizacionEditar]);




  const modalTitle = (
    <Group gap="xs">
      <Text fw={700} fz="sm" c="white">
        {isEdit && valorizacionEditar
          ? `Editar Propuesta: N° ${valorizacionEditar.numero_correlativo} | ${valorizacionEditar.proveedor_nombre}`
          : "Nueva Propuesta de Compra"}
      </Text>
    </Group>
  );

  const modalHeaderRight = (
    <Group gap="md" wrap="nowrap" align="center">
      <Select
        placeholder={loadingProveedores ? "Cargando..." : "[Seleccione Proveedor]"}
        disabled={loadingProveedores || isEdit}
        rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
        data={proveedores.map((p) => {
          const idVal = p.id_proveedor ?? (p as unknown as { id: number }).id;
          const doc = p.documento || (p as unknown as { ruc?: string }).ruc || "";
          return {
            value: String(idVal),
            label: doc ? `${doc} - ${p.razon_social}` : p.razon_social,
          };
        })}
        value={idProveedor ? String(idProveedor) : null}
        onChange={(val) => setIdProveedor(val ? Number(val) : null)}
        searchable
        size="xs"
        radius="lg"
        w={260}
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
      <Badge
        color="yellow"
        variant="filled"
        size="lg"
        radius="lg"
        className="h-8 px-3 text-xs font-bold uppercase tracking-wide"
      >
        PROPUESTA
      </Badge>
    </Group>
  );

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
        {/* Dos recuadros en la misma fila: Información Concesión (+ Tributación y Evidencias) y Lotes Valorizados */}
        <Grid gutter="sm" align="stretch">
          {/* Recuadro 1: Información Concesión y Tributación */}
          <Grid.Col span={{ base: 12, md: 4, lg: 3.5 }}>
            <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
              <Stack gap="xs">
                <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                  <IconBuildingBank size={15} /> Información Concesión
                </Text>

                <Select
                  label="Concesión:"
                  placeholder={
                    loadingCatalogo ? "Cargando..." : "[Seleccione Concesión]"
                  }
                  disabled={loadingCatalogo || !idProveedor}
                  rightSection={loadingCatalogo ? <Loader size={16} /> : undefined}
                  data={concesiones.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  value={idConcesion ? String(idConcesion) : null}
                  onChange={(val) => setIdConcesion(val ? Number(val) : null)}
                  searchable
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                />

                {concesionSeleccionada ? (
                  <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1">
                    <Group justify="space-between">
                      <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Código Único:</Text>
                      <Badge color="cyan" variant="outline" size="xs">
                        {concesionSeleccionada.codigo_reinfo || "-"}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Procedencia:</Text>
                      <Text fz={11} c="white" fw={600}>
                        {concesionSeleccionada.procedencia || "-"}
                      </Text>
                    </Group>
                  </Box>
                ) : (
                  <Box p="xs" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center">
                    <Text fz={11} c="zinc.5">Sin concesión seleccionada</Text>
                  </Box>
                )}

                <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5 mt-2">
                  <IconReceiptTax size={15} /> Configuración Tributaria
                </Text>

                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      label="% IGV:"
                      placeholder="0.00"
                      value={porcentajeIgv}
                      onChange={(val) => setPorcentajeIgv(typeof val === "number" ? val : 0)}
                      min={0}
                      max={100}
                      decimalScale={2}
                      suffix=" %"
                      size="xs"
                      radius="lg"
                      classNames={fieldClasses}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="% Detracción:"
                      placeholder="0.00"
                      value={porcentajeDetraccion}
                      onChange={(val) => setPorcentajeDetraccion(typeof val === "number" ? val : 0)}
                      min={0}
                      max={100}
                      decimalScale={2}
                      suffix=" %"
                      size="xs"
                      radius="lg"
                      classNames={fieldClasses}
                    />
                  </Grid.Col>
                </Grid>

                <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1 mt-1">
                  <Group justify="space-between" align="center">
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      IGV Estimado ({porcentajeIgv}%):
                    </Text>
                    <Text fz={11} fw={700} c="blue.3" className="font-mono">
                      $ {(totalSubtotal * (porcentajeIgv / 100)).toFixed(2)}
                    </Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                      Detracción Estimada ({porcentajeDetraccion}%):
                    </Text>
                    <Text fz={11} fw={700} c="amber.3" className="font-mono">
                      $ {((totalSubtotal + (totalSubtotal * (porcentajeIgv / 100))) * (porcentajeDetraccion / 100)).toFixed(2)}
                    </Text>
                  </Group>
                </Box>

                <Box className="mt-2">
                  <Group gap="xs" mb={4}>
                    <IconPaperclip size={14} className="text-amber-400" />
                    <Text fw={700} fz="xs" c="amber.4">
                      Evidencias ({evidencias.length + evidenciasExistentes.length})
                    </Text>
                  </Group>
                  <MultiFilePicker
                    files={evidencias}
                    onFilesChange={setEvidencias}
                    existingFiles={evidenciasExistentes}
                    onRemoveExisting={(path: string) =>
                      setEvidenciasExistentes((prev) =>
                        prev.filter((e) => e.path_relativo !== path),
                      )
                    }
                    label="Comprobantes / Evidencias (Opcional)"
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Recuadro 2: Lotes Valorizados */}
          <Grid.Col span={{ base: 12, md: 8, lg: 8.5 }}>
            <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between space-y-3">
              <Stack gap="xs" className="flex-1 flex flex-col">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <IconFileText size={16} className="text-amber-400" />
                    <Text fw={700} fz="xs" c="white">
                      Lotes Valorizados ({lotesUnicosCount}/10 lotes | {detalles.length} {detalles.length === 1 ? "elemento" : "elementos"})
                    </Text>
                  </Group>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    color="indigo"
                    size="xs"
                    radius="lg"
                    disabled={!idProveedor}
                    onClick={() => setModalLoteOpened(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold"
                  >
                    Nuevo Lote
                  </Button>
                </Group>

                {detalles.length === 0 ? (
                  <Box p="xl" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center flex-1 flex flex-col justify-center items-center py-16">
                    <IconFileText size={28} className="text-zinc-600 mb-2" />
                    <Text fz="xs" c="zinc.4">
                      No hay lotes agregados a la valorización.
                    </Text>
                    <Text fz={11} c="zinc.5">
                      Haga clic en "+ Nuevo Lote" para comenzar a valorar minerales.
                    </Text>
                  </Box>
                ) : (
                  <Stack gap="xs" className="max-h-[58vh] overflow-y-auto pr-1 flex-1">
                    {detalles.map((d, idx) => {
                      const esOro = d.display.elemento_quimico === "Oro";
                      const subtotalSinDesc =
                        d.display.subtotal_sin_descuento !== undefined
                          ? d.display.subtotal_sin_descuento
                          : d.display.subtotal +
                            (d.display.monto_penalidad ?? 0) +
                            (d.display.monto_flete ?? 0);

                      return (
                        <Paper
                          key={idx}
                          p="sm"
                          radius="md"
                          bg="#141417"
                          className={`border border-zinc-800/90 border-l-4 ${
                            esOro ? "border-l-amber-500" : "border-l-slate-400"
                          } hover:border-zinc-700/80 transition-all duration-200 shadow-sm`}
                        >
                          {/* Header del Lote */}
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {/* Elemento Químico Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                                  esOro
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : "bg-slate-400/20 text-slate-200 border border-slate-400/40"
                                }`}
                              >
                                {d.display.elemento_quimico}
                              </span>

                              {/* Lote Correlativo */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-zinc-400 font-medium">Lote:</span>
                                <span className="text-xs font-mono font-bold text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                                  {d.display.lote_correlativo || "-"}
                                </span>
                              </div>

                              {d.display.subtotal === 0 && d.display.precio_por_tonelada === 0 && (
                                <Badge variant="light" color="red" size="xs" fw={700}>
                                  Sin Valor Comercial
                                </Badge>
                              )}

                              {/* Guías */}
                              {d.display.grr && (
                                <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                                  G.R.R: {d.display.grr}
                                </span>
                              )}
                              {d.display.grt && (
                                <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                                  G.R.T: {d.display.grt}
                                </span>
                              )}

                              {/* Fecha Ingreso */}
                              {d.display.fecha_ingreso && (
                                <span className="text-[10px] text-zinc-500 hidden sm:inline-flex items-center gap-1 ml-1 font-mono">
                                  • Ingreso: {d.display.fecha_ingreso}
                                </span>
                              )}
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Tooltip label="Editar condiciones">
                                <ActionIcon
                                  color="indigo"
                                  variant="subtle"
                                  size="sm"
                                  radius="md"
                                  className="text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                                  onClick={() => {
                                    setDetalleEditando({
                                      req: d.req,
                                      display: d.display,
                                      index: idx,
                                    });
                                    setModalLoteOpened(true);
                                  }}
                                >
                                  <IconPencil size={15} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Eliminar Lote">
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  size="sm"
                                  radius="md"
                                  className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                                  onClick={() => handleEliminarDetalle(idx)}
                                >
                                  <IconTrash size={15} />
                                </ActionIcon>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Grid Estructurada de 4 Bloques: Pesos, Ley & Rec, Condiciones, Liquidación */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 items-stretch">
                            {/* Bloque 1: Pesos */}
                            <div className="bg-[#0d0d10] border border-zinc-800/80 rounded-md p-2.5 flex flex-col space-y-1.5">
                              <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between pb-1 border-b border-zinc-800/60">
                                <span className="flex items-center gap-1">
                                  <IconScale size={13} className="text-cyan-400" /> PESOS
                                </span>
                                <span className="text-[9px] text-zinc-500 font-normal">Toneladas</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-zinc-400 uppercase font-medium">TMH (t):</span>
                                  <span className="font-mono font-semibold text-zinc-200">
                                    {(d.display.tmh / 1000).toFixed(3)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-zinc-400 uppercase font-medium">% H₂O:</span>
                                  <span className="font-mono font-semibold text-cyan-400">
                                    {d.display.ley_humedad.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-0.5 border-t border-zinc-800/40">
                                  <span className="text-[10px] text-zinc-300 uppercase font-bold">TMS (t):</span>
                                  <span className="font-mono font-bold text-emerald-400">
                                    {(d.display.tms / 1000).toFixed(3)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 2: Ley & Ensayos */}
                            <div className="bg-[#0d0d10] border border-zinc-800/80 rounded-md p-2.5 flex flex-col space-y-1.5">
                              <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between pb-1 border-b border-zinc-800/60">
                                <span className="flex items-center gap-1">
                                  <IconFlask size={13} className="text-amber-400" /> LEY & REC
                                </span>
                                <span className="text-[9px] text-zinc-500 font-normal">oz/tc</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-zinc-400 uppercase font-medium">
                                    Ley ({d.display.elemento_quimico}):
                                  </span>
                                  <span className="font-mono font-bold text-amber-300">
                                    {d.display.ley.toFixed(4)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-zinc-400 uppercase font-medium">REC (%):</span>
                                  <span className="font-mono font-semibold text-sky-400">
                                    {d.display.recuperacion.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-0.5 border-t border-zinc-800/40">
                                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Factor:</span>
                                  <span className="font-mono font-semibold text-zinc-300">
                                    {d.display.factor.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 3: Condiciones Comerciales */}
                            <div className="bg-[#0d0d10] border border-zinc-800/80 rounded-md p-2.5 flex flex-col justify-between">
                              <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between pb-1 border-b border-zinc-800/60">
                                <span className="flex items-center gap-1">
                                  <IconCoins size={13} className="text-amber-400" /> CONDICIONES
                                </span>
                                <span className="text-[9px] text-zinc-500 font-normal">USD / TN</span>
                              </div>
                              <div className="space-y-2 text-xs py-0.5">
                                <div className="grid grid-cols-2 gap-x-2">
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Inter:</span>
                                    <span className="font-mono font-semibold text-zinc-200 text-[11px] mt-0.5 block">
                                      ${d.display.inter.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Des. Inter:</span>
                                    <span className="font-mono font-semibold text-zinc-300 text-[11px] mt-0.5 block">
                                      ${d.display.des_inter.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 pt-1.5 border-t border-zinc-800/40">
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Maquila:</span>
                                    <span className="font-mono font-semibold text-zinc-200 text-[11px] mt-0.5 block">
                                      ${d.display.maquila.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Reactivos:</span>
                                    <span className="font-mono font-semibold text-zinc-300 text-[11px] mt-0.5 block">
                                      ${d.display.consumo.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 4: Precios y Subtotal (Liquidación) */}
                            <div className="bg-[#0d0d10] border border-zinc-800/80 rounded-md p-2.5 flex flex-col space-y-1">
                              <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between pb-1 border-b border-zinc-800/60">
                                <span className="flex items-center gap-1">
                                  <IconReceiptTax size={13} className="text-emerald-400" /> LIQUIDACIÓN
                                </span>
                                <span className="text-[9px] text-zinc-500 font-normal">USD</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="grid grid-cols-2 gap-x-2">
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Precio / TN:</span>
                                    <span className="font-mono font-semibold text-zinc-200 text-[11px] mt-0.5 block">
                                      ${d.display.precio_por_tonelada.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Subt. Bruto:</span>
                                    <span className="font-mono font-semibold text-zinc-200 text-[11px] mt-0.5 block">
                                      ${subtotalSinDesc.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 pt-1 border-t border-zinc-800/40">
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Penalidad:</span>
                                    <span
                                      className={`font-mono text-[11px] mt-0.5 block ${
                                        (d.display.monto_penalidad ?? 0) > 0
                                          ? "text-rose-400 font-semibold"
                                          : "text-zinc-500"
                                      }`}
                                    >
                                      {(d.display.monto_penalidad ?? 0) > 0
                                        ? `-$${(d.display.monto_penalidad ?? 0).toFixed(2)}`
                                        : "$0.00"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase font-medium block leading-none">Flete:</span>
                                    <span
                                      className={`font-mono text-[11px] mt-0.5 block ${
                                        (d.display.monto_flete ?? 0) > 0
                                          ? "text-cyan-400 font-semibold"
                                          : "text-zinc-500"
                                      }`}
                                    >
                                      {(d.display.monto_flete ?? 0) > 0
                                        ? `-$${(d.display.monto_flete ?? 0).toFixed(2)}`
                                        : "$0.00"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-1 border-t border-emerald-900/50 bg-emerald-950/20 -mx-1 px-1.5 py-0.5 rounded">
                                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Subtotal Lote:</span>
                                  <span className="font-mono font-black text-emerald-300 text-[13px]">
                                    ${d.display.subtotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </Stack>

              {/* Footer Total General */}
              <Group justify="space-between" align="center" pt="xs" className="border-t border-zinc-800" wrap="wrap" gap="xs">
                <Text fz="xs" c="zinc.4">
                  Lotes únicos: <span className="text-white font-semibold">{lotesUnicosCount} / 10</span>{" "}
                  <span className="text-zinc-600">({detalles.length} {detalles.length === 1 ? "elemento" : "elementos"})</span>
                </Text>
                <Group gap="md" align="center" wrap="wrap">
                  <Group gap={6} align="center" wrap="nowrap">
                    <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                      Subtotal Sin Desc:
                    </Text>
                    <Text fz="xs" fw={700} c="white" className="font-mono">
                      ${totalSubtotalSinDescuento.toFixed(2)}
                    </Text>
                  </Group>
                  {totalPenalidad > 0 && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <Text fz={10} c="amber.5" tt="uppercase" fw={700}>
                        Penalidad:
                      </Text>
                      <Text fz="xs" fw={700} c="amber.4" className="font-mono">
                        -${totalPenalidad.toFixed(2)}
                      </Text>
                    </Group>
                  )}
                  {totalFlete > 0 && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <Text fz={10} c="cyan.5" tt="uppercase" fw={700}>
                        Flete:
                      </Text>
                      <Text fz="xs" fw={700} c="cyan.4" className="font-mono">
                        -${totalFlete.toFixed(2)}
                      </Text>
                    </Group>
                  )}
                  {totalDescuentos > 0 && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <Text fz={10} c="rose.5" tt="uppercase" fw={700}>
                        Total Desc:
                      </Text>
                      <Text fz="xs" fw={700} c="rose.4" className="font-mono">
                        -${totalDescuentos.toFixed(2)}
                      </Text>
                    </Group>
                  )}
                  <Group gap={6} align="center" wrap="nowrap">
                    <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                      Total Valorización:
                    </Text>
                    <Text fz="sm" fw={800} c="emerald.4" className="font-mono">
                      ${totalSubtotal.toFixed(2)}
                    </Text>
                  </Group>
                </Group>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

          {/* Botones de Acción Formulario */}
          <Group justify="end" gap="xs" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              onClick={onClose}
              disabled={loadingSubmit}
              radius="lg"
              size="xs"
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              onClick={handlePresionarGuardar}
              loading={loadingSubmit}
              disabled={
                loadingSubmit ||
                !idProveedor ||
                detalles.length === 0
              }
              radius="lg"
              size="xs"
              leftSection={<IconCheck size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-6"
            >
              {isEdit ? "Guardar Propuesta" : "Crear Propuesta"}
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Motivo de Edición */}
      <ModalEstandar
        opened={modalMotivoOpened}
        close={() => setModalMotivoOpened(false)}
        title="Motivo de la Modificación"
        size="sm"
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Ingrese un motivo u observación para esta modificación (Opcional). Si lo deja en blanco, se guardará con la descripción por defecto.
          </Text>
          <TextInput
            label="Motivo o Justificación del Cambio"
            placeholder="Ej: Corrección de cuenta bancaria / actualización de parámetros..."
            value={motivoEdicion}
            onChange={(e) => setMotivoEdicion(e.currentTarget.value)}
            classNames={fieldClasses}
            data-autofocus
          />
          <Group justify="end" gap="xs" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setModalMotivoOpened(false)}
              size="xs"
              radius="lg"
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              onClick={handleConfirmarMotivo}
              loading={loadingSubmit}
              size="xs"
              radius="lg"
              leftSection={<IconCheck size={14} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Confirmar y Guardar
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Agregar Lote */}
      <ModalAgregarLote
        opened={modalLoteOpened}
        onClose={() => {
          setModalLoteOpened(false);
          setDetalleEditando(null);
        }}
        idProveedor={idProveedor}
        idValorizacionEdicion={valorizacionEditar?.id}
        existingDetalles={detalles.map((d) => ({
          id_lote_guia: d.req.id_lote_guia,
          elemento_quimico: d.req.elemento_quimico,
        }))}
        detalleEditar={detalleEditando}
        onAgregarLote={handleAgregarDetalle}
        onEditarLote={handleEditarDetalle}
        fechaHoraValorizacion={fechaHoraValorizacion}
      />
    </>
  );
};