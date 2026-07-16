import { useState, useEffect } from "react";
import { Grid, Paper, Text, Button, Table, Group, ActionIcon, Popover, Select, TextInput, Badge, Center, Loader, Stack, Tooltip } from "@mantine/core";
import { IconCheck, IconTrash, IconScale, IconPlus, IconBarcode, IconChecklist, IconPencil } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { useRecepcionMineral } from "../hooks/useRecepcionMineral";
import { AuxService } from "../../../service/auxiliar.service";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { RegistroConductor } from "../../../presentation/utils/registro-conductor";
import { ModalPesoInicial } from "./components/modal-peso-inicial";
import { ModalPesoFinal } from "./components/modal-peso-final";
import { ModalUnidadFicticia } from "./components/modal-unidad-ficticia";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_LoteMineral, RecepcionMineralResponse } from "../service/recepcion-mineral.responses";
import { useUIStore } from "../../../stores/ui.store";
import { useTicketLote } from "../hooks/useTicketLote";
import { useTicketBalanza } from "../hooks/useTicketBalanza";

export const RecepcionMineralPage = () => {
  useTitlePage("Recepción de Mineral", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const { printTicket, getBarcodePreviewUrl } = useTicketLote();
  const { printTicketBalanza } = useTicketBalanza();

  const {
    sinPesarList,
    enProcesoList,
    loading,
    selectedRecepcion,
    setSelectedRecepcion,
    validatingField,
    creatingLoteId,
    deletingLoteId,
    closingProcesoId,
    iniciarProceso,
    validarCampo,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    cerrarProceso,
    crearUnidadFicticia,
  } = useRecepcionMineral();

  const getFullPlaca = (serie: string | null, placa: string | null) => {
    if (!placa) return "SIN PLACA";
    return serie ? `${serie}-${placa}` : placa;
  };

  // Catálogos para popovers de edición
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);


  // Modales
  const [activeLotePesoInicial, setActiveLotePesoInicial] = useState<RES_LoteMineral | null>(null);
  const [activeLotePesoFinal, setActiveLotePesoFinal] = useState<RES_LoteMineral | null>(null);
  const [openFicticiaModal, setOpenFicticiaModal] = useState(false);
  const [editingFicticia, setEditingFicticia] = useState<RecepcionMineralResponse | null>(null);
  const [openNewConductorModal, setOpenNewConductorModal] = useState(false);

  // Popovers abiertos (estado de ID de recepción + clave del campo)
  const [openedPopover, setOpenedPopover] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [tempSerie, setTempSerie] = useState<string>("");
  const [tempPlaca, setTempPlaca] = useState<string>("");



  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [resEmp, resTipos, resCond] = await Promise.all([
          AuxService.get_empresas_transporte(),
          AuxService.get_tipos_vehiculo(),
          AuxService.get_conductores(),
        ]);
        if (isMounted) {
          setEmpresas(resEmp);
          setTiposVehiculo(resTipos);
          setConductores(resCond);
        }
      } catch (e) {
        console.error("Error al cargar catálogos para validación", e);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPopover = (recepcionId: number, field: string, currentValue: string, extraValue?: string | null) => {
    setOpenedPopover(`${recepcionId}-${field}`);
    if (field === "placa") {
      setTempSerie(extraValue || "");
      setTempPlaca(currentValue || "");
    } else {
      setTempValue(currentValue);
    }
  };

  const handleSaveField = async (recepcionId: number, field: string) => {
    const finalValue = field === "placa"
      ? tempSerie ? `${tempSerie.trim()}-${tempPlaca.trim()}` : tempPlaca.trim()
      : tempValue;
    await validarCampo(recepcionId, field, finalValue);
    setOpenedPopover(null);
    // Recargar conductores si se creó uno nuevo
    if (field === "conductor") {
      const resCond = await AuxService.get_conductores();
      setConductores(resCond);
    }
  };

  // Determinar si una recepción tiene todas las validaciones completadas
  const isValidationComplete = (recepcion: RecepcionMineralResponse) => {
    const val = recepcion.validacion_datos;
    if (!val) return false;
    return (
      val.condicion_ingreso &&
      val.placa &&
      val.empresa_transporte &&
      val.tipo_vehiculo &&
      val.segunda_placa &&
      val.conductor
    );
  };

  // Determinar si el proceso de balanza de la unidad puede cerrarse
  const canCloseProceso = (recepcion: RecepcionMineralResponse) => {
    if (!isValidationComplete(recepcion)) return false;
    if (!recepcion.lotes || recepcion.lotes.length === 0) return false;
    return recepcion.lotes.every((l: RES_LoteMineral) => l.peso_final !== null);
  };

  const getEmpresaNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const emp = empresas.find((e) => e.id_empresa_transporte === id);
    return emp ? emp.razon_social : `Cód: ${id}`;
  };

  const getTipoVehiculoNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const tipo = tiposVehiculo.find((t) => t.id_tipo_vehiculo === id);
    return tipo ? tipo.nombre : `Cód: ${id}`;
  };

  const getConductorNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const cond = conductores.find((c) => c.id_conductor === id);
    return cond ? cond.nombre_completo : `Cód: ${id}`;
  };

  const unidadesAOperar = enProcesoList;

  const fieldClasses = {
    input: "bg-zinc-900/60 border-zinc-800 text-white focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-semibold text-xs mb-1",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {loading && (
        <Center className="py-12">
          <Loader color="indigo" size="md" />
        </Center>
      )}

      {!loading && (
        <Grid columns={24} gutter="md">
          {/* Lateral Izquierdo: Unidades en Planta (Sin Pesar) */}
          <Grid.Col span={{ base: 24, sm: 8, md: 6, lg: 5 }}>
            <Paper radius="lg" p="md" className="bg-zinc-950/40 border border-zinc-900/80 min-h-[500px] h-full flex flex-col gap-4">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconChecklist size={18} className="text-indigo-400 shrink-0" />
                  <Text size="sm" fw={700} className="text-zinc-100 truncate" title="Unidades en Planta">
                    Unidades en Planta
                  </Text>
                </div>
                <Button
                  radius="md"
                  size="xs"
                  onClick={() => setOpenFicticiaModal(true)}
                  disabled={!sucursal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 h-7 w-7 p-0 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Unidad Ficticia"
                >
                  <IconPlus size={16} />
                </Button>
              </div>

              <Stack gap="sm" className="flex-1 overflow-y-auto pr-1">
                {sinPesarList.length === 0 ? (
                  <Center className="h-40 flex-col gap-2">
                    <Text size="xs" c="dimmed" ta="center">
                      No hay unidades pendientes de pesaje en esta sucursal.
                    </Text>
                  </Center>
                ) : (
                  sinPesarList.map((ru) => {
                    const isSelected = selectedRecepcion?.id === ru.id;
                    const formatFechaHora = (s: string | null | undefined): { fecha: string; hora: string } => {
                      if (!s) return { fecha: "---", hora: "---" };
                      const d = new Date(s);
                      if (isNaN(d.getTime())) return { fecha: "---", hora: "---" };
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      return {
                        fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
                        hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
                      };
                    };
                    const { fecha: formattedDate, hora: formattedTime } = formatFechaHora(ru.fecha_hora_ingreso);

                    return (
                      <Paper
                        key={ru.id}
                        radius="lg"
                        p={0}
                        onClick={() => {
                          if (ru.estado_pesaje === "Sin Pesar") {
                            mostrarConfirmacion({
                              title: "Confirmar Inicio de Pesaje",
                              confirmLabel: "Iniciar",
                              cancelLabel: "Cancelar",
                              message: (
                                <>
                                  ¿Desea iniciar el proceso de pesaje para la unidad con placa{" "}
                                  <strong className="text-indigo-400">
                                    "{getFullPlaca(ru.vehiculo_serie, ru.vehiculo_placa)}"
                                  </strong>
                                  ?
                                </>
                              ),
                              onConfirm: () => {
                                iniciarProceso(ru.id);
                              },
                            });
                          } else {
                            setSelectedRecepcion(ru);
                          }
                        }}
                        className={`cursor-pointer border transition-all duration-200 select-none overflow-hidden flex flex-col relative bg-zinc-950/30 border-zinc-900/80 `}
                      >
                        {/* Header: Placa */}
                        <div
                          className={`py-2 px-3 text-center font-bold text-xs tracking-wider font-mono uppercase bg-zinc-800 text-zinc-300`}
                        >
                          <Group justify="center" gap={8} wrap="nowrap">
                            <span className="truncate">
                              {getFullPlaca(
                                ru.tipo_ingreso === "Ficticio" ? null : ru.vehiculo_serie,
                                ru.vehiculo_placa
                              )}
                            </span>
                            {ru.tipo_ingreso === "Ficticio" && (
                              <Badge
                                variant="filled"
                                size="xs"
                                radius="md"
                                className="font-extrabold tracking-wider shrink-0 bg-zinc-700 text-zinc-100 border border-zinc-600/60"
                              >
                                FICTICIA
                              </Badge>
                            )}
                            {ru.tipo_ingreso === "Ficticio" && (
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                radius="md"
                                className={`shrink-0 transition-colors ${
                                  isSelected
                                    ? "text-zinc-950 hover:bg-zinc-950/30"
                                    : "text-zinc-300 hover:bg-zinc-700/40"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFicticia(ru);
                                }}
                                title="Editar fecha y hora"
                              >
                                <IconPencil size={12} stroke={2} />
                              </ActionIcon>
                            )}
                          </Group>
                        </div>

                        {/* Body: Fechas */}
                        <div className="p-3 space-y-1.5 bg-zinc-900/10">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">Fecha Ingreso</span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">Hora Ingreso</span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Área Central: Proceso de Pesaje y Lotes */}
          <Grid.Col span={{ base: 24, sm: 16, md: 18, lg: 19 }}>
            <Paper radius="lg" p="md" className="bg-zinc-950/40 border border-zinc-900/80 min-h-[500px] h-full flex flex-col gap-4 ">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <div>
                  <Text size="md" fw={700} className="text-zinc-200">
                    Proceso de Pesaje y Lotes
                  </Text>
                  
                </div>
              </div>

              {/* Contenido Dinámico */}
              {unidadesAOperar.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center py-12 gap-3">
                  <IconScale size={48} className="text-zinc-600 stroke-[1.5]" />
                  <Text size="sm" c="dimmed" ta="center">
                    Ningún proceso de pesaje activo. Seleccione una unidad del listado izquierdo para iniciar su pesaje.
                  </Text>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-8 overflow-y-auto min-h-0 pr-2">

                  {unidadesAOperar.map((ru) => {
                    const valComplete = isValidationComplete(ru);
                    const isFicticio = ru.tipo_ingreso === "Ficticio";
                    const lotesAMostrar = ru.lotes || [];

                    return (
                      <Paper
                        key={ru.id}
                        radius="2xl"
                        p="xl"
                        className="bg-zinc-950/20 border border-zinc-900/80 shadow-md flex flex-col gap-6"
                      >
                        {/* Fila de Encabezado de la Unidad */}
                        <Paper
                          radius="xl"
                          p="md"
                          className={`border transition-all duration-300 mb-4 ${
                            isFicticio
                              ? "bg-indigo-950/10 border-indigo-500/50"
                              : "bg-amber-950/10 border-amber-500/50"
                          }`}
                        >
                          <Group justify="space-between">
                            <div>
                              <Text size="xs" className={`font-bold ${isFicticio ? "text-indigo-400/80" : "text-amber-500/80"}`}>
                                PROCESO DE BALANZA ACTIVO
                              </Text>
                              <Text size="md" fw={700} className="text-zinc-100">
                                Unidad: <span className={`font-mono font-bold ${isFicticio ? "text-indigo-400" : "text-amber-400"}`}>
                                  {getFullPlaca(isFicticio ? null : ru.vehiculo_serie, ru.vehiculo_placa)}
                                </span>
                                {ru.tipo_ingreso === "Ficticio" && " (Ficticia)"}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Text size="xs" c="dimmed">Ingreso a Planta</Text>
                              <Text size="xs" fw={600} className="text-zinc-200">
                                {ru.fecha_hora_ingreso}
                              </Text>
                            </div>
                          </Group>
                        </Paper>

                        {/* Sección de Validación de Vigilancia en Grid */}
                        <div className="flex flex-col gap-3 mb-4">
                          <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider">
                            Validación de Datos de Vigilancia
                          </Text>
                          <Grid gutter="xs">
                            {/* 1. Condición Ingreso */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-condicion_ingreso`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "condicion_ingreso", ru.tipo_ingreso || "")}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.condicion_ingreso
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Condición Ingreso</Text>
                                      <Text size="xs" fw={600} className="truncate text-zinc-200 mt-0.5">
                                        {ru.tipo_ingreso || "No especificado"}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.condicion_ingreso ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    label="Condición Ingreso"
                                    data={["Recepción de Mineral", "Despacho de Mineral"]}
                                    value={tempValue}
                                    onChange={(val) => setTempValue(val || "")}
                                    classNames={fieldClasses}
                                    radius="md"
                                    comboboxProps={{ withinPortal: false }}
                                  />
                                  <Button
                                    fullWidth
                                    size="xs"
                                    color="indigo"
                                    radius="md"
                                    mt="sm"
                                    loading={validatingField?.id === ru.id && validatingField?.field === "condicion_ingreso"}
                                    onClick={() => handleSaveField(ru.id, "condicion_ingreso")}
                                  >
                                    Validar
                                  </Button>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>

                            {/* 2. Placa 1 */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-placa`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "placa", ru.vehiculo_placa || "", ru.vehiculo_serie)}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.placa
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Placa 1</Text>
                                      <Text size="xs" fw={700} className="truncate text-zinc-100 font-mono mt-0.5">
                                        {ru.vehiculo_placa ? getFullPlaca(ru.vehiculo_serie, ru.vehiculo_placa) : "Sin placa"}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.placa ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
                                  <Stack gap="xs">
                                    <TextInput
                                      label="Serie"
                                      placeholder="Ej: ASD"
                                      value={tempSerie}
                                      onChange={(e) => setTempSerie(e.currentTarget.value.toUpperCase())}
                                      classNames={fieldClasses}
                                      radius="md"
                                    />
                                    <TextInput
                                      label="Número Placa"
                                      placeholder="Ej: 125"
                                      value={tempPlaca}
                                      onChange={(e) => setTempPlaca(e.currentTarget.value.toUpperCase())}
                                      classNames={fieldClasses}
                                      radius="md"
                                    />
                                    <Button
                                      fullWidth
                                      size="xs"
                                      color="indigo"
                                      radius="md"
                                      mt="xs"
                                      loading={validatingField?.id === ru.id && validatingField?.field === "placa"}
                                      onClick={() => handleSaveField(ru.id, "placa")}
                                    >
                                      Validar
                                    </Button>
                                  </Stack>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>

                            {/* 3. Empresa Transporte */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-empresa_transporte`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "empresa_transporte", ru.id_empresa_transporte ? String(ru.id_empresa_transporte) : "")}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.empresa_transporte
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Emp. Transporte</Text>
                                      <Text size="xs" fw={600} className="truncate text-zinc-200 mt-0.5">
                                        {getEmpresaNombre(ru.id_empresa_transporte)}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.empresa_transporte ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    label="Empresa Transporte"
                                    searchable
                                    data={empresas.map((e) => ({ value: String(e.id_empresa_transporte), label: e.razon_social }))}
                                    value={tempValue}
                                    onChange={(val) => setTempValue(val || "")}
                                    classNames={fieldClasses}
                                    radius="md"
                                    comboboxProps={{ withinPortal: false }}
                                  />
                                  <Button
                                    fullWidth
                                    size="xs"
                                    color="indigo"
                                    radius="md"
                                    mt="sm"
                                    loading={validatingField?.id === ru.id && validatingField?.field === "empresa_transporte"}
                                    onClick={() => handleSaveField(ru.id, "empresa_transporte")}
                                  >
                                    Validar
                                  </Button>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>

                            {/* 4. Tipo Vehículo */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-tipo_vehiculo`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "tipo_vehiculo", ru.id_tipo_vehiculo ? String(ru.id_tipo_vehiculo) : "")}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.tipo_vehiculo
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Tipo Vehículo</Text>
                                      <Text size="xs" fw={600} className="truncate text-zinc-200 mt-0.5">
                                        {getTipoVehiculoNombre(ru.id_tipo_vehiculo)}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.tipo_vehiculo ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    label="Tipo Vehículo"
                                    searchable
                                    data={tiposVehiculo.map((t) => ({ value: String(t.id_tipo_vehiculo), label: t.nombre }))}
                                    value={tempValue}
                                    onChange={(val) => setTempValue(val || "")}
                                    classNames={fieldClasses}
                                    radius="md"
                                    comboboxProps={{ withinPortal: false }}
                                  />
                                  <Button
                                    fullWidth
                                    size="xs"
                                    color="indigo"
                                    radius="md"
                                    mt="sm"
                                    loading={validatingField?.id === ru.id && validatingField?.field === "tipo_vehiculo"}
                                    onClick={() => handleSaveField(ru.id, "tipo_vehiculo")}
                                  >
                                    Validar
                                  </Button>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>

                            {/* 5. Placa 2 */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-segunda_placa`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "segunda_placa", ru.segunda_placa || "")}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.segunda_placa
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Placa Acople</Text>
                                      <Text size="xs" fw={700} className="truncate text-zinc-200 font-mono mt-0.5">
                                        {ru.segunda_placa || "Sin acople"}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.segunda_placa ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                                  <TextInput
                                    label="Segunda Placa (Acople)"
                                    placeholder="Vacío o Placa"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.currentTarget.value.toUpperCase())}
                                    classNames={fieldClasses}
                                    radius="md"
                                  />
                                  <Button
                                    fullWidth
                                    size="xs"
                                    color="indigo"
                                    radius="md"
                                    mt="sm"
                                    loading={validatingField?.id === ru.id && validatingField?.field === "segunda_placa"}
                                    onClick={() => handleSaveField(ru.id, "segunda_placa")}
                                  >
                                    Validar
                                  </Button>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>

                            {/* 6. Conductor */}
                            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
                              <Popover
                                opened={openedPopover === `${ru.id}-conductor`}
                                onChange={() => setOpenedPopover(null)}
                                position="bottom"
                                withArrow
                                radius="lg"
                                styles={{ dropdown: { backgroundColor: "#18181b", borderColor: "#27272a" } }}
                              >
                                <Popover.Target>
                                  <Paper
                                    onClick={() => handleOpenPopover(ru.id, "conductor", ru.id_conductor ? String(ru.id_conductor) : "")}
                                    className={`p-2.5 cursor-pointer border rounded-xl flex flex-col justify-between h-20 transition-all ${
                                      ru.validacion_datos.conductor
                                        ? "bg-emerald-950/5 border-emerald-500/30 hover:bg-emerald-950/10"
                                        : "bg-zinc-900/30 border-zinc-800 hover:border-amber-500/40"
                                    }`}
                                  >
                                    <div>
                                      <Text size="10px" fw={700} c="dimmed" className="uppercase truncate">Conductor</Text>
                                      <Text size="xs" fw={600} className="truncate text-zinc-200 mt-0.5">
                                        {getConductorNombre(ru.id_conductor)}
                                      </Text>
                                    </div>
                                    <Group justify="space-between" align="center" mt="auto">
                                      {ru.validacion_datos.conductor ? (
                                        <Badge color="emerald" variant="light" size="xs" leftSection={<IconCheck size={10} />}>Validado</Badge>
                                      ) : (
                                        <Badge color="amber" variant="outline" size="xs">Validar</Badge>
                                      )}
                                    </Group>
                                  </Paper>
                                </Popover.Target>
                                <Popover.Dropdown className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-2 items-end">
                                    <Select
                                      label="Conductor"
                                      searchable
                                      data={conductores.map((c) => ({ value: String(c.id_conductor), label: `${c.nombre_completo} (${c.dni})` }))}
                                      value={tempValue}
                                      onChange={(val) => setTempValue(val || "")}
                                      classNames={fieldClasses}
                                      radius="md"
                                      className="flex-1"
                                      comboboxProps={{ withinPortal: false }}
                                    />
                                    <ActionIcon color="indigo" radius="md" size="lg" className="mb-0.5" onClick={() => setOpenNewConductorModal(true)}>
                                      <IconPlus size={16} />
                                    </ActionIcon>
                                  </div>
                                  <Button
                                    fullWidth
                                    size="xs"
                                    color="indigo"
                                    radius="md"
                                    mt="sm"
                                    loading={validatingField?.id === ru.id && validatingField?.field === "conductor"}
                                    onClick={() => handleSaveField(ru.id, "conductor")}
                                  >
                                    Validar
                                  </Button>
                                </Popover.Dropdown>
                              </Popover>
                            </Grid.Col>
                          </Grid>
                        </div>

                        {/* Sección Lotes */}
                        <div className="border border-zinc-900/60 rounded-3xl p-4 bg-zinc-950/20">
                          <Group justify="space-between" mb="md" className="border-b border-zinc-900 pb-2">
                            <Group gap="xs">
                              <Text size="sm" fw={700} className="text-zinc-200">
                                Lotes de Mineral Asociados
                              </Text>
                              {!valComplete && (
                                <Text size="11px" className="text-amber-500 font-semibold italic">
                                  * Debe validar todos los datos de vigilancia para poder agregar lotes.
                                </Text>
                              )}
                            </Group>
                            <Button
                              size="xs"
                              radius="md"
                              leftSection={<IconPlus size={14} />}
                              disabled={!valComplete}
                              loading={creatingLoteId === ru.id}
                              onClick={() => crearLote(ru.id)}
                              className={`font-bold ${
                                valComplete
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                              }`}
                            >
                              Lote
                            </Button>
                          </Group>

                          <div className="overflow-x-auto">
                            <Table verticalSpacing="md" horizontalSpacing="sm" className="w-full">
                              <thead>
                                <tr className="bg-zinc-900/40 border-b border-zinc-900 text-zinc-400 font-bold text-xs text-left">
                                  <th style={{ width: 60 }}>Acción</th>
                                  <th>Código</th>
                                  <th>Ticket</th>
                                  <th className="text-right">Peso Inicial (Bruto)</th>
                                  <th className="text-right">Peso Final (Tara)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lotesAMostrar.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="text-center py-6 text-zinc-500 text-xs">
                                      {!valComplete
                                        ? "Pendiente de validación de vigilancia."
                                        : "No hay lotes agregados para esta unidad. Haz clic en '+ Lote' para comenzar a generar los lotes."}
                                    </td>
                                  </tr>
                                ) : (
                                  lotesAMostrar.map((lote) => {
                                    const barcodeUrl = getBarcodePreviewUrl(lote);
                                    return (
                                      <tr key={lote.id} className="border-b border-zinc-900/40">
                                        <td>
                                          <Tooltip label="Eliminar lote" withArrow>
                                            <ActionIcon
                                              color="red"
                                              variant="subtle"
                                              radius="md"
                                              loading={deletingLoteId === lote.id}
                                              onClick={() => eliminarLote(ru.id, lote.id)}
                                            >
                                              <IconTrash size={16} />
                                            </ActionIcon>
                                          </Tooltip>
                                        </td>
                                        <td>
                                          <Group gap={6} wrap="nowrap">
                                            {barcodeUrl ? (
                                          <Tooltip label="Ver / reimprimir ticket" withArrow>
                                            <ActionIcon
                                              variant="default"
                                              radius="sm"
                                              size="md"
                                              onClick={() => printTicket(lote)}
                                              aria-label="Ver ticket"
                                              className="bg-white hover:bg-zinc-100 p-0.5 border border-zinc-700/80 shrink-0 h-6 w-12"
                                            >
                                              <img
                                                    src={barcodeUrl}
                                                    alt={`barcode ${lote.correlativo}`}
                                                    className="h-full w-full object-contain"
                                                  />
                                                </ActionIcon>
                                              </Tooltip>
                                            ) : (
                                              <IconBarcode size={18} className="text-zinc-500 shrink-0" />
                                            )}
                                            <Text size="xs" fw={700} className="text-zinc-200 font-mono">
                                              {lote.correlativo}
                                            </Text>
                                          </Group>
                                        </td>
                                        <td>
                                          <Text size="xs" className="text-zinc-300">
                                            {lote.numero_correlativo}
                                          </Text>
                                        </td>
                                        <td className="text-right">
                                          {lote.peso_inicial !== null ? (
                                            <Badge
                                              variant="gradient"
                                              gradient={{ from: "teal", to: "green", deg: 45 }}
                                              size="md"
                                              radius="md"
                                              className="font-bold text-zinc-950 px-2.5 py-2.5 shadow-sm shadow-emerald-500/10"
                                            >
                                              {lote.peso_inicial.toLocaleString()} Kg
                                            </Badge>
                                          ) : (
                                            <Button
                                              size="xs"
                                              radius="md"
                                              className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 transition-all hover:scale-105"
                                              onClick={() => setActiveLotePesoInicial(lote)}
                                            >
                                              Pesar
                                            </Button>
                                          )}
                                        </td>
                                        <td className="text-right">
                                          {lote.peso_final !== null ? (
                                            <Badge
                                              variant="gradient"
                                              gradient={{ from: "teal", to: "green", deg: 45 }}
                                              size="md"
                                              radius="md"
                                              className="font-bold text-zinc-950 px-2.5 py-2.5 shadow-sm shadow-emerald-500/10"
                                            >
                                              {lote.peso_final.toLocaleString()} Kg
                                            </Badge>
                                          ) : lote.peso_inicial !== null ? (
                                            <Button
                                              size="xs"
                                              radius="md"
                                              className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 transition-all hover:scale-105"
                                              onClick={() => setActiveLotePesoFinal(lote)}
                                            >
                                              Pesar
                                            </Button>
                                          ) : (
                                            <Text size="xs" c="dimmed">---</Text>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </Table>
                          </div>
                        </div>

                        {/* Botón Cerrar Proceso de Balanza */}
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-900">
                          <Button
                            radius="lg"
                            disabled={!canCloseProceso(ru)}
                            loading={closingProcesoId === ru.id}
                            onClick={() => cerrarProceso(ru.id)}
                            className={`font-bold ${
                              canCloseProceso(ru)
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                            }`}
                          >
                            Cerrar Proceso de Balanza
                          </Button>
                        </div>
                      </Paper>
                    );
                  })}
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {/* Modal: Peso Inicial */}
      {activeLotePesoInicial && (
        <ModalEstandar
          opened={!!activeLotePesoInicial}
          close={() => setActiveLotePesoInicial(null)}
          title={`Peso Inicial para Lote: ${activeLotePesoInicial.correlativo}`}
          size="md"
        >
          <ModalPesoInicial
            lote={activeLotePesoInicial}
            onCancel={() => setActiveLotePesoInicial(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) => r.lotes?.some((l) => l.id === loteId));
              if (ru) {
                const loteActualizado = await registrarPesoInicial(ru.id, loteId, dto);
                setActiveLotePesoInicial(null);
                if (loteActualizado) {
                  const emp = empresas.find(e => e.id_empresa_transporte === loteActualizado.id_empresa_transporte);
                  printTicketBalanza({
                    ...loteActualizado,
                    empresa_transporte_ruc: emp ? emp.ruc : ""
                  });
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Peso Final */}
      {activeLotePesoFinal && (
        <ModalEstandar
          opened={!!activeLotePesoFinal}
          close={() => setActiveLotePesoFinal(null)}
          title={`Peso Final para Lote: ${activeLotePesoFinal.correlativo}`}
          size="xl"
        >
          <ModalPesoFinal
            lote={activeLotePesoFinal}
            onCancel={() => setActiveLotePesoFinal(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) => r.lotes?.some((l) => l.id === loteId));
              if (ru) {
                const loteActualizado = await registrarPesoFinal(ru.id, loteId, dto);
                setActiveLotePesoFinal(null);
                if (loteActualizado) {
                  const emp = empresas.find(e => e.id_empresa_transporte === loteActualizado.id_empresa_transporte);
                  printTicketBalanza({
                    ...loteActualizado,
                    empresa_transporte_ruc: emp ? emp.ruc : ""
                  });
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Registro de Nuevo Conductor (dentro del selector rápido) */}
      <ModalEstandar
        opened={openNewConductorModal}
        close={() => setOpenNewConductorModal(false)}
        title="Registrar Nuevo Conductor"
        size="md"
      >
        <RegistroConductor
          onCancel={() => setOpenNewConductorModal(false)}
          onSuccess={async (conductor) => {
            // Actualizar el valor temporal al ID del conductor recién creado
            setTempValue(String(conductor.id_conductor));
            // Actualizar lista general de conductores
            const resCond = await AuxService.get_conductores();
            setConductores(resCond);
            setOpenNewConductorModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Unidad Ficticia (crear / editar fecha/hora) */}
      <ModalUnidadFicticia
        opened={openFicticiaModal || !!editingFicticia}
        onClose={() => {
          setOpenFicticiaModal(false);
          setEditingFicticia(null);
        }}
        mode={editingFicticia ? "edit" : "create"}
        initialFechaHoraIngreso={editingFicticia?.fecha_hora_ingreso ?? null}
        onConfirm={async (fechaHoraIngreso) => {
          if (editingFicticia) {
            await validarCampo(editingFicticia.id, "fecha_hora_ingreso", fechaHoraIngreso);
            setEditingFicticia(null);
          } else {
            await crearUnidadFicticia(fechaHoraIngreso);
            setOpenFicticiaModal(false);
          }
        }}
      />
    </div>
  );
};
