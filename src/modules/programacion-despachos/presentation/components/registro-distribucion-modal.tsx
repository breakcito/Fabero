import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FileButton,
  Grid,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCalendar,
  IconFileText,
  IconPlus,
  IconTrash,
  IconTruck,
  IconUpload,
  IconUser,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { useNotify } from "../../../../hooks/useNotify";
import { useRegistroDistribucion } from "../../hooks/useRegistroDistribucion";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
} from "../../service/programacion-despachos.responses";
import {
  formatLocalDate,
  parseLocalDate,
} from "../../../../presentation/utils/local-date";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import type {
  RES_EmpresaTransporte,
} from "../../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_Sucursal } from "../../../../service/responses/sucursal";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { EmpresaTransporteResponse } from "../../../empresas-transporte/service/empresas-transporte.responses";
import type { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import {
  MOTIVO_TRASLADO_OPTIONS,
  type MotivoTraslado,
} from "../../../../shared/enums/_generic/motivo-traslado";

interface Props {
  opened: boolean;
  onClose: () => void;
  idDespacho: number;
  detallesDespacho: DespachoDetalleItem[];
  onSuccess: (result: CrearDistribucionResult) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const RegistroDistribucionModal = ({
  opened,
  onClose,
  idDespacho,
  detallesDespacho,
  onSuccess,
}: Props) => {
  const { notifyError } = useNotify();
  const ctrl = useRegistroDistribucion(
    idDespacho,
    detallesDespacho,
    (result) => {
      onSuccess(result);
      onClose();
    },
  );

  const [sucursales, setSucursales] = useState<RES_Sucursal[]>([]);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [vehiculosCarreta, setVehiculosCarreta] = useState<RES_Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingVehiculosCarreta, setLoadingVehiculosCarreta] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

  // Estado de modales anidados para crear nuevos registros.
  const [modalCrearEmpresa, setModalCrearEmpresa] = useState(false);
  const [modalCrearTipoVehiculo, setModalCrearTipoVehiculo] = useState(false);
  const [modalCrearVehiculo, setModalCrearVehiculo] = useState(false);
  const [modalCrearVehiculoCarreta, setModalCrearVehiculoCarreta] = useState(false);
  const [modalCrearConductor, setModalCrearConductor] = useState(false);

  useEffect(() => {
    if (!opened) {
      ctrl.reset();
      return;
    }
    let cancelled = false;

    setLoadingSucursales(true);
    setLoadingEmpresas(true);
    setLoadingVehiculos(true);
    setLoadingVehiculosCarreta(true);
    setLoadingTipos(true);
    setLoadingConductores(true);

    AuxService.get_sucursales()
      .then((data) => {
        if (!cancelled) setSucursales(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar sucursales");
      })
      .finally(() => {
        if (!cancelled) setLoadingSucursales(false);
      });

    AuxService.get_empresas_transporte()
      .then((data) => {
        if (!cancelled) setEmpresas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar empresas de transporte");
      })
      .finally(() => {
        if (!cancelled) setLoadingEmpresas(false);
      });

    AuxService.get_vehiculos({ es_carreta: false })
      .then((data) => {
        if (!cancelled) setVehiculos(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar vehículos");
      })
      .finally(() => {
        if (!cancelled) setLoadingVehiculos(false);
      });

    AuxService.get_vehiculos({ es_carreta: true })
      .then((data) => {
        if (!cancelled) setVehiculosCarreta(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar vehículos carreta");
      })
      .finally(() => {
        if (!cancelled) setLoadingVehiculosCarreta(false);
      });

    AuxService.get_tipos_vehiculo()
      .then((data) => {
        if (!cancelled) setTiposVehiculo(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar tipos de vehículo");
      })
      .finally(() => {
        if (!cancelled) setLoadingTipos(false);
      });

    AuxService.get_conductores()
      .then((data) => {
        if (!cancelled) setConductores(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar conductores");
      })
      .finally(() => {
        if (!cancelled) setLoadingConductores(false);
      });

    return () => {
      cancelled = true;
    };
  }, [opened]);

  const sucursalesData = sucursales.map((s) => ({ value: String(s.id_sucursal), label: s.nombre }));
  const empresasData = empresas.map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));
  const vehiculosData = vehiculos.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa ? v.placa : `Vehículo #${v.id_vehiculo}`,
  }));
  const vehiculosCarretaData = vehiculosCarreta.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa ? v.placa : `Vehículo #${v.id_vehiculo}`,
  }));
  const tiposVehiculoData = tiposVehiculo.map((t) => ({
    value: String(t.id_tipo_vehiculo),
    label: t.nombre,
  }));
  const conductoresData = conductores.map((c) => ({
    value: String(c.id_conductor),
    label: c.nombre_completo,
  }));

  // Helpers para crear nuevos registros.
  const handleEmpresaCreada = (nueva: EmpresaTransporteResponse) => {
    const adapt: RES_EmpresaTransporte = {
      id_empresa_transporte: nueva.id,
      ruc: nueva.ruc,
      razon_social: nueva.razon_social,
      estado: nueva.estado,
    };
    setEmpresas((prev) => [...prev, adapt]);
    ctrl.setField("id_empresa_transporte", adapt.id_empresa_transporte);
    setModalCrearEmpresa(false);
  };
  const handleTipoVehiculoCreado = (nuevo: { id_tipo_vehiculo: number; nombre: string; estado: EstadoBase }) => {
    const adapt: RES_TipoVehiculo = {
      id_tipo_vehiculo: nuevo.id_tipo_vehiculo,
      nombre: nuevo.nombre,
      tiene_carreta: false,
      es_carreta: false,
      estado: nuevo.estado,
    };
    setTiposVehiculo((prev) => [...prev, adapt]);
    ctrl.setField("id_tipo_vehiculo", adapt.id_tipo_vehiculo);
    setModalCrearTipoVehiculo(false);
  };
  const handleVehiculoCreado = (nuevo: RES_Vehiculo) => {
    setVehiculos((prev) => [...prev, nuevo]);
    ctrl.setField("id_vehiculo", nuevo.id_vehiculo);
    setModalCrearVehiculo(false);
  };
  const handleVehiculoCarretaCreado = (nuevo: RES_Vehiculo) => {
    setVehiculosCarreta((prev) => [...prev, nuevo]);
    ctrl.setField("id_vehiculo_carreta", nuevo.id_vehiculo);
    setModalCrearVehiculoCarreta(false);
  };

  // Resolver id_tipo_vehiculo de la carreta a partir del catálogo ya cargado.
  // Sin tipo carreta registrado, el submodal no puede crear nada coherente.
  const idTipoVehiculoCarreta =
    tiposVehiculo.find((t) => t.es_carreta === true)?.id_tipo_vehiculo ?? null;
  const handleConductorCreado = (nuevo: { id_conductor: number; nombre_completo: string; dni: string; numero_licencia?: string | null }) => {
    const adapt: RES_Conductor = {
      id_conductor: nuevo.id_conductor,
      dni: nuevo.dni,
      nombre_completo: nuevo.nombre_completo,
      numero_licencia: nuevo.numero_licencia ?? null,
    };
    setConductores((prev) => [...prev, adapt]);
    ctrl.setField("id_conductor", adapt.id_conductor);
    setModalCrearConductor(false);
  };

  // Vehículo requiere empresa y tipo ya elegidos (FKs).
  const vehiculoFormReady =
    ctrl.form.id_empresa_transporte > 0 && ctrl.form.id_tipo_vehiculo > 0;

  /**
   * Al activar "También registrar la Guía de Segundo Tramo ahora", precarga
   * las fechas con el día actual si están vacías. Si el usuario desmarca y
   * vuelve a marcar, no pisa valores que ya haya editado.
   */
  const handleToggleRegistrarGuia = (checked: boolean) => {
    if (checked) {
      const today = todayIso();
      if (!ctrl.guia.fecha_inicio_traslado) {
        ctrl.setGuiaField("fecha_inicio_traslado", today);
      }
      if (!ctrl.guia.fecha_emision) {
        ctrl.setGuiaField("fecha_emision", today);
      }
      if (!ctrl.guia.fecha_en_planta) {
        ctrl.setGuiaField("fecha_en_planta", today);
      }
    }
    ctrl.setRegistrarGuia(checked);
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Registrar Distribución"
      size="80%"
      rightSection={
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Text component="label" size="xs" fw={500} c="zinc.3" className="shrink-0">
            Fecha Estimada de Llegada
            <span className="text-red-400 ml-0.5">*</span>
          </Text>
          <div className="w-52">
            <CustomDatePicker
              label=""
              placeholder="Seleccione fecha"
              value={
                ctrl.form.fecha_estimada_llegada
                  ? parseLocalDate(ctrl.form.fecha_estimada_llegada)
                  : null
              }
              onChange={(val: unknown) => {
                if (!val) {
                  ctrl.setField("fecha_estimada_llegada", "");
                  return;
                }
                const d = typeof val === "string" ? new Date(val) : (val as Date);
                ctrl.setField("fecha_estimada_llegada", formatLocalDate(d));
              }}
              disabled={ctrl.loading}
              required
              minDate={new Date()}
              radius="lg"
              size="xs"
            />
          </div>
        </div>
      }
      validateClose={
        ctrl.form.detalles.some((d) => d.peso_tomado > 0) ||
        ctrl.form.id_sucursal > 0
      }
      closeConfirmationTitle="¿Cerrar sin guardar?"
    >
      <Stack gap="md">
        {ctrl.advertencias.length > 0 && (
          <Alert
            color="yellow"
            radius="lg"
            icon={<IconAlertTriangle size={16} />}
            title="Advertencias"
            classNames={{
              root: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200",
              title: "text-yellow-300 font-semibold",
              message: "text-yellow-200/90",
              icon: "text-yellow-400",
            }}
          >
            <Stack gap={4} mt={4}>
              {ctrl.advertencias.map((msg, idx) => (
                <Text key={idx} size="xs">
                  • {msg}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        <Grid gutter="sm">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Sucursal"
              placeholder={loadingSucursales ? "Cargando sucursales..." : "Seleccione la sucursal"}
              data={sucursalesData}
              value={ctrl.form.id_sucursal ? String(ctrl.form.id_sucursal) : null}
              onChange={(val) => ctrl.setField("id_sucursal", val ? Number(val) : 0)}
              leftSection={<IconBuilding className="w-4 h-4 text-zinc-500" />}
              withAsterisk
              required
              searchable
              radius="lg"
              disabled={loadingSucursales || ctrl.loading}
              rightSection={loadingSucursales ? <Loader size={16} /> : undefined}
              classNames={fieldClasses}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Empresa de Transporte"
                placeholder={loadingEmpresas ? "Cargando..." : "Seleccione"}
                data={empresasData}
                value={ctrl.form.id_empresa_transporte ? String(ctrl.form.id_empresa_transporte) : null}
                onChange={(val) => ctrl.setField("id_empresa_transporte", val ? Number(val) : 0)}
                leftSection={<IconTruckDelivery className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingEmpresas || ctrl.loading}
                rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nueva empresa de transporte" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearEmpresa(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nueva empresa de transporte"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Vehículo"
                placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione"}
                data={vehiculosData}
                value={ctrl.form.id_vehiculo ? String(ctrl.form.id_vehiculo) : null}
                onChange={(val) => {
                  ctrl.setField("id_vehiculo", val ? Number(val) : 0);
                  if (val) {
                    const v = vehiculos.find((x) => x.id_vehiculo === Number(val));
                    if (v?.id_tipo_vehiculo) {
                      ctrl.setField("id_tipo_vehiculo", v.id_tipo_vehiculo);
                    }
                  }
                }}
                leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingVehiculos || ctrl.loading}
                rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip
                label={
                  vehiculoFormReady
                    ? "Registrar nuevo vehículo"
                    : "Selecciona primero la empresa y el tipo de vehículo"
                }
                withArrow
              >
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearVehiculo(true)}
                  disabled={ctrl.loading || !vehiculoFormReady}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5 disabled:opacity-50"
                  aria-label="Nuevo vehículo"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Tipo de Vehículo"
                placeholder={loadingTipos ? "Cargando tipos..." : "Seleccione"}
                data={tiposVehiculoData}
                value={ctrl.form.id_tipo_vehiculo ? String(ctrl.form.id_tipo_vehiculo) : null}
                onChange={(val) => ctrl.setField("id_tipo_vehiculo", val ? Number(val) : 0)}
                leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingTipos || ctrl.loading}
                rightSection={loadingTipos ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nuevo tipo de vehículo" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearTipoVehiculo(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nuevo tipo de vehículo"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Conductor"
                placeholder={loadingConductores ? "Cargando conductores..." : "Seleccione"}
                data={conductoresData}
                value={ctrl.form.id_conductor ? String(ctrl.form.id_conductor) : null}
                onChange={(val) => ctrl.setField("id_conductor", val ? Number(val) : 0)}
                leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingConductores || ctrl.loading}
                rightSection={loadingConductores ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nuevo conductor" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearConductor(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nuevo conductor"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Vehículo Carreta (opcional)"
                placeholder={
                  loadingVehiculosCarreta
                    ? "Cargando carretas..."
                    : "Seleccione (opcional)"
                }
                data={vehiculosCarretaData}
                value={
                  ctrl.form.id_vehiculo_carreta
                    ? String(ctrl.form.id_vehiculo_carreta)
                    : null
                }
                onChange={(val) =>
                  ctrl.setField("id_vehiculo_carreta", val ? Number(val) : null)
                }
                leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                searchable
                clearable
                radius="lg"
                disabled={loadingVehiculosCarreta || ctrl.loading}
                rightSection={
                  loadingVehiculosCarreta ? <Loader size={16} /> : undefined
                }
                comboboxProps={{ withinPortal: true }}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip
                label={
                  ctrl.form.id_empresa_transporte > 0
                    ? "Registrar nuevo vehículo carreta"
                    : "Selecciona primero la empresa de transporte"
                }
                withArrow
              >
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearVehiculoCarreta(true)}
                  disabled={ctrl.loading || ctrl.form.id_empresa_transporte <= 0}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5 disabled:opacity-50"
                  aria-label="Nuevo vehículo carreta"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>
        </Grid>

        <Divider
          label="Guía de Segundo Tramo (opcional)"
          labelPosition="left"
          classNames={{ label: "text-zinc-400 text-xs uppercase tracking-wider" }}
        />

        <Box className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-3">
          <Checkbox
            label="También registrar la Guía de Segundo Tramo ahora"
            checked={ctrl.registrarGuia}
            onChange={(e) => handleToggleRegistrarGuia(e.currentTarget.checked)}
            disabled={ctrl.loading}
            color="indigo"
            size="sm"
          />
          <Text fz={10} c="dimmed" mt={4}>
            Si los campos quedan vacíos, se omite este registro y podrás llenar la guía después desde la distribución creada.
          </Text>

          {ctrl.registrarGuia && (
            <Stack gap="xs" mt="md">
              <Grid gutter="xs">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    type="date"
                    label="Fecha Inicio Traslado"
                    value={ctrl.guia.fecha_inicio_traslado ?? ""}
                    onChange={(e) =>
                      ctrl.setGuiaField(
                        "fecha_inicio_traslado",
                        e.currentTarget.value || null,
                      )
                    }
                    disabled={ctrl.loading}
                    radius="lg"
                    size="xs"
                    leftSection={<IconCalendar size={14} />}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    type="date"
                    label="Fecha Emisión"
                    value={ctrl.guia.fecha_emision ?? ""}
                    onChange={(e) =>
                      ctrl.setGuiaField(
                        "fecha_emision",
                        e.currentTarget.value || null,
                      )
                    }
                    disabled={ctrl.loading}
                    radius="lg"
                    size="xs"
                    leftSection={<IconCalendar size={14} />}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    type="date"
                    label="Fecha En Planta"
                    value={ctrl.guia.fecha_en_planta ?? ""}
                    onChange={(e) =>
                      ctrl.setGuiaField(
                        "fecha_en_planta",
                        e.currentTarget.value || null,
                      )
                    }
                    disabled={ctrl.loading}
                    radius="lg"
                    size="xs"
                    leftSection={<IconCalendar size={14} />}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
              </Grid>

              <Grid gutter="xs" align="flex-end">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Select
                    label="Motivo de Traslado"
                    placeholder="Seleccione"
                    data={MOTIVO_TRASLADO_OPTIONS.map((m) => ({ value: m, label: m }))}
                    value={ctrl.guia.motivo_traslado}
                    onChange={(val) =>
                      ctrl.setGuiaField("motivo_traslado", val as MotivoTraslado | null)
                    }
                    disabled={ctrl.loading}
                    searchable
                    radius="lg"
                    size="xs"
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="N° Guía Remitente"
                    placeholder="Ej. 001-12345"
                    value={ctrl.guia.guia_remitente}
                    onChange={(e) =>
                      ctrl.setGuiaField(
                        "guia_remitente",
                        e.currentTarget.value.toUpperCase(),
                      )
                    }
                    disabled={ctrl.loading}
                    radius="lg"
                    size="xs"
                    maxLength={20}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="N° Guía Transportista"
                    placeholder={
                      ctrl.guia.sin_guia_transportista
                        ? "Sin guía transportista"
                        : "Ej. 001-12345"
                    }
                    value={ctrl.guia.guia_transportista}
                    onChange={(e) =>
                      ctrl.setGuiaField(
                        "guia_transportista",
                        e.currentTarget.value.toUpperCase(),
                      )
                    }
                    disabled={ctrl.loading || ctrl.guia.sin_guia_transportista}
                    radius="lg"
                    size="xs"
                    maxLength={20}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 1 }}>
                  <Stack gap={2} align="center" justify="flex-end" pb={4}>
                    <Text fz={10} c="zinc.400" fw={600} tt="uppercase" lts="0.04em" ta="center">
                      Sin Guía
                    </Text>
                    <Switch
                      size="md"
                      color="indigo"
                      checked={ctrl.guia.sin_guia_transportista}
                      onChange={(e) =>
                        ctrl.setGuiaField(
                          "sin_guia_transportista",
                          e.currentTarget.checked,
                        )
                      }
                      onLabel="SÍ"
                      offLabel="NO"
                      disabled={ctrl.loading}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              {/* REMITENTE (ENTIDAD) — Empresa o Planta destino */}
              <Box>
                <Group justify="space-between" align="flex-end" mb={6} wrap="wrap">
                  <Text
                    size="xs"
                    fw={800}
                    tt="uppercase"
                    lts="0.06em"
                    className="text-zinc-100"
                  >
                    Remitente (Entidad)
                  </Text>
                  <Group gap="xs" align="center">
                    <Text size="xs" c="zinc.4">
                      Empresa
                    </Text>
                    <Switch
                      size="xs"
                      color="indigo"
                      checked={ctrl.esPlantaDestinoRemitente}
                      onChange={(e) => {
                        const next = e.currentTarget.checked;
                        ctrl.setEsPlantaDestinoRemitente(next);
                        ctrl.setRemitenteId(null);
                      }}
                      onLabel="PLANTA"
                      offLabel="EMPRESA"
                      disabled={ctrl.loading}
                    />
                    <Text size="xs" c="zinc.4">
                      Planta destino
                    </Text>
                  </Group>
                </Group>
                <Select
                  label={
                    ctrl.esPlantaDestinoRemitente
                      ? "Planta destino remitente:"
                      : "Empresa remitente:"
                  }
                  placeholder={
                    ctrl.loadingCatalogosRemitente
                      ? "Cargando..."
                      : "Seleccione (opcional)"
                  }
                  data={
                    ctrl.loadingCatalogosRemitente
                      ? []
                      : (ctrl.esPlantaDestinoRemitente
                          ? ctrl.plantasRemitente
                          : ctrl.empresasRemitente
                        ).map((item) => ({
                          value: String(item.id),
                          label: `${item.razon_social || "Sin nombre"} — ${item.ruc || "Sin RUC"}`,
                        }))
                  }
                  value={ctrl.remitenteId}
                  onChange={ctrl.setRemitenteId}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  disabled={ctrl.loading}
                  rightSection={
                    ctrl.loadingCatalogosRemitente ? (
                      <Loader size={16} />
                    ) : undefined
                  }
                  searchable
                  clearable
                  comboboxProps={{ withinPortal: true }}
                />
              </Box>

              <Box>
                <Group justify="space-between" align="flex-end" mb={6}>
                  <Text size="xs" fw={800} className="text-zinc-100 uppercase tracking-widest">
                    Documento Guía Remitente
                  </Text>
                  <FileButton
                    onChange={(f) => f && ctrl.setGuiaField("documento_guia_remitente", f)}
                    accept="*"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        color="indigo"
                        size="xs"
                        radius="md"
                        leftSection={<IconUpload size={14} />}
                        disabled={ctrl.loading}
                      >
                        {ctrl.guia.documento_guia_remitente ? "Reemplazar" : "Adjuntar"}
                      </Button>
                    )}
                  </FileButton>
                </Group>
                {ctrl.guia.documento_guia_remitente && (
                  <Group gap="xs" wrap="nowrap" align="stretch">
                    <div className="flex-1 min-w-0">
                      <ArchivoCard
                        archivo={{
                          url: URL.createObjectURL(ctrl.guia.documento_guia_remitente),
                          path_relativo: "",
                          nombre_original: ctrl.guia.documento_guia_remitente.name,
                          extension:
                            ctrl.guia.documento_guia_remitente.name.split(".").pop()?.toLowerCase() ||
                            null,
                        }}
                        className="h-full"
                      />
                    </div>
                    <Tooltip label="Quitar archivo" withArrow>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="lg"
                        radius="md"
                        onClick={() => ctrl.setGuiaField("documento_guia_remitente", null)}
                        disabled={ctrl.loading}
                        className="bg-red-500/5 hover:bg-red-500/10 self-center"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
                {!ctrl.guia.documento_guia_remitente && (
                  <Box className="rounded-md border border-dashed border-zinc-800 p-2 text-center">
                    <Group justify="center" gap="xs">
                      <IconFileText size={14} className="text-zinc-600" />
                      <Text fz={10} c="zinc.5" fw={600} fs="italic">
                        Sin archivo adjunto.
                      </Text>
                    </Group>
                  </Box>
                )}
              </Box>

              {!ctrl.guia.sin_guia_transportista && (
                <Box>
                  <Group justify="space-between" align="flex-end" mb={6}>
                    <Text size="xs" fw={800} className="text-zinc-100 uppercase tracking-widest">
                      Documento Guía Transportista
                    </Text>
                    <FileButton
                      onChange={(f) => f && ctrl.setGuiaField("documento_guia_transportista", f)}
                      accept="*"
                    >
                      {(props) => (
                        <Button
                          {...props}
                          variant="light"
                          color="indigo"
                          size="xs"
                          radius="md"
                          leftSection={<IconUpload size={14} />}
                          disabled={ctrl.loading}
                        >
                          {ctrl.guia.documento_guia_transportista ? "Reemplazar" : "Adjuntar"}
                        </Button>
                      )}
                    </FileButton>
                  </Group>
                  {ctrl.guia.documento_guia_transportista && (
                    <Group gap="xs" wrap="nowrap" align="stretch">
                      <div className="flex-1 min-w-0">
                        <ArchivoCard
                          archivo={{
                            url: URL.createObjectURL(ctrl.guia.documento_guia_transportista),
                            path_relativo: "",
                            nombre_original: ctrl.guia.documento_guia_transportista.name,
                            extension:
                              ctrl.guia.documento_guia_transportista.name
                                .split(".")
                                .pop()
                                ?.toLowerCase() || null,
                          }}
                          className="h-full"
                        />
                      </div>
                      <Tooltip label="Quitar archivo" withArrow>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="lg"
                          radius="md"
                          onClick={() => ctrl.setGuiaField("documento_guia_transportista", null)}
                          disabled={ctrl.loading}
                          className="bg-red-500/5 hover:bg-red-500/10 self-center"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                  {!ctrl.guia.documento_guia_transportista && (
                    <Box className="rounded-md border border-dashed border-zinc-800 p-2 text-center">
                      <Group justify="center" gap="xs">
                        <IconFileText size={14} className="text-zinc-600" />
                        <Text fz={10} c="zinc.5" fw={600} fs="italic">
                          Sin archivo adjunto.
                        </Text>
                      </Group>
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </Box>

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={ctrl.loading}
            radius="xl"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            Cancelar
          </Button>
          <Button
            loading={ctrl.loading || ctrl.loadingGuia}
            disabled={ctrl.loading || ctrl.loadingGuia}
            onClick={() => ctrl.submit()}
            radius="xl"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
          >
            Registrar Distribución
          </Button>
        </Group>
      </Stack>

      {/* Modales anidados para crear nuevos registros */}
      <ModalEstandar
        opened={modalCrearEmpresa}
        close={() => setModalCrearEmpresa(false)}
        title="Nueva Empresa de Transporte"
        size="md"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setModalCrearEmpresa(false)}
          onSuccess={handleEmpresaCreada}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearTipoVehiculo}
        close={() => setModalCrearTipoVehiculo(false)}
        title="Nuevo Tipo de Vehículo"
        size="sm"
      >
        <RegistroTipoVehiculoSimple
          onCancel={() => setModalCrearTipoVehiculo(false)}
          onSuccess={handleTipoVehiculoCreado}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearVehiculo}
        close={() => setModalCrearVehiculo(false)}
        title="Nuevo Vehículo"
        size="sm"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={ctrl.form.id_empresa_transporte || null}
          idTipoVehiculo={ctrl.form.id_tipo_vehiculo || null}
          onCancel={() => setModalCrearVehiculo(false)}
          onSuccess={handleVehiculoCreado}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearVehiculoCarreta}
        close={() => setModalCrearVehiculoCarreta(false)}
        title="Nuevo Vehículo Carreta"
        size="sm"
      >
        {idTipoVehiculoCarreta === null ? (
          <Text size="sm" c="zinc.4" ta="center" py="md">
            No existe un tipo de vehículo con <strong>es_carreta = true</strong>.
            Créalo primero desde el catálogo de tipos de vehículo.
          </Text>
        ) : (
          <RegistroVehiculoSimple
            idEmpresaTransporte={ctrl.form.id_empresa_transporte || null}
            idTipoVehiculo={idTipoVehiculoCarreta}
            onCancel={() => setModalCrearVehiculoCarreta(false)}
            onSuccess={handleVehiculoCarretaCreado}
          />
        )}
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearConductor}
        close={() => setModalCrearConductor(false)}
        title="Nuevo Conductor"
        size="sm"
      >
        <RegistroConductor
          onCancel={() => setModalCrearConductor(false)}
          onSuccess={handleConductorCreado}
        />
      </ModalEstandar>
    </ModalEstandar>
  );
};
