import {
  Stack,
  Group,
  Select,
  MultiSelect,
  TextInput,
  Button,
  Loader,
  Grid,
  ActionIcon,
  Tooltip,
  Paper,
  Text,
  Badge,
} from "@mantine/core";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import "@mantine/dates/styles.css";
import {
  IconBuildingFactory,
  IconTruck,
  IconUser,
  IconCalendarTime,
  IconCheck,
  IconPlus,
  IconFileText,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { formatLocalDate, parseLocalDate } from "../../../../presentation/utils/local-date";
import { useProgramarForm } from "../../hooks/useProgramarForm";
import type { ProgramacionDetail } from "../../service/programar-recepcion.responses";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: (nueva: ProgramacionDetail) => void;
  /** Programación a editar. Si es null, el modal funciona en modo alta. */
  programacion?: ProgramacionDetail | null;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export const ProgramarRecepcionModal = ({
  opened,
  onClose,
  onSuccess,
  programacion,
}: Props) => {
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [openVehiculoModal, setOpenVehiculoModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);
  const [openCarretaModal, setOpenCarretaModal] = useState(false);
  const [openTipoVehiculoModal, setOpenTipoVehiculoModal] = useState(false);
  const [openConductorModal, setOpenConductorModal] = useState(false);

  const ctrl = useProgramarForm(
    (nueva) => {
      onSuccess(nueva);
      onClose();
    },
    programacion,
  );

  const {
    form,
    setField,
    submit,
    loading,
    esEdicion,
    empresas,
    vehiculos,
    proveedores,
    tiposVehiculo,
    conductores,
    loadingEmpresas,
    loadingVehiculos,
    loadingProveedores,
    loadingTiposVehiculo,
    loadingConductores,
    cargarCatalogos,
    cargarProgramacion,
    reset,
    setProveedoresSeleccionados,
    updateGuia,
    removeArchivoGuia,
    setArchivoNuevoGuia,
    handleEmpresaCreada,
    handleVehiculoCreado,
    handleProveedorCreado,
    handleCarretaCreada,
    handleTipoVehiculoCreado,
    handleConductorCreado,
  } = ctrl;

  useEffect(() => {
    if (!opened) {
      reset();
      return;
    }
    void cargarCatalogos();
    if (programacion) {
      cargarProgramacion(programacion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, programacion]);

  const empresasData = (empresas ?? []).map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));

  const vehiculosData = (vehiculos ?? [])
    .filter((v) => !v.es_carreta || Number(v.es_carreta) === 0)
    .map((v) => ({
      value: String(v.id_vehiculo),
      label: v.placa || "Vehículo sin placa",
    }));

  const proveedoresData = (proveedores ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  const razonSocialProveedor = (idProveedor: number): string =>
    proveedoresData.find((p) => p.value === String(idProveedor))?.label ??
    "Proveedor de la carga";

  const tiposVehiculoData = (tiposVehiculo ?? []).map((t) => ({
    value: String(t.id_tipo_vehiculo),
    label: t.nombre,
  }));

  const conductoresData = (conductores ?? []).map((c) => ({
    value: String(c.id_conductor),
    label: c.nombre_completo,
  }));

  // Vehículos tipo carreta (es_carreta === 1) para el dropdown opcional de "Vehículo Carreta".
  // El backend serializa TINYINT(1) como número 0/1, mismo patrón que guias-primer-tramo.
  const vehiculosCarreta = (vehiculos ?? []).filter(
    (v) => Number(v.es_carreta) === 1,
  );

  const carretasData = vehiculosCarreta.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa || "Vehículo sin placa",
  }));

  // id_tipo_vehiculo del TipoVehiculo con es_carreta=1, para pre-asignar al sub-modal de registro.
  const idTipoVehiculoCarreta =
    (tiposVehiculo ?? []).find((t) => Number(t.es_carreta) === 1)?.id_tipo_vehiculo ?? null;

  const proveedoresSeleccionados = form.guias.map((g) => String(g.id_proveedor));

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={
          esEdicion
            ? "Editar Programación de Recepción"
            : "Programar Recepción de Unidad"
        }
        size="lg"
        validateClose
      >
        <Stack gap="md">
          <Grid gutter="sm">
            {/* Fila 1: Empresa de Transporte */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Empresa de Transporte"
                  placeholder={loadingEmpresas ? "Cargando..." : "Seleccione la empresa"}
                  data={empresasData}
                  value={form.id_empresa_transporte ? String(form.id_empresa_transporte) : null}
                  onChange={(val) => setField("id_empresa_transporte", val ? Number(val) : 0)}
                  leftSection={<IconBuildingFactory className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
                  radius="xl"
                  disabled={loadingEmpresas || loading}
                  rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
                  classNames={fieldClasses}
                  className="flex-1"
                />
                <Tooltip label="Nueva empresa de transporte">
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="xl"
                    size="lg"
                    disabled={loading}
                    onClick={() => setOpenEmpresaModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            {/* Fila 2: Vehículo + Fecha Estimada de Llegada.
                La fecha va en la misma fila que el vehículo; el resto de
                campos (Tipo de Vehículo / Conductor / Carreta) solo aparece
                en EDICIÓN. */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Vehículo"
                  placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione el vehículo"}
                  data={vehiculosData}
                  value={form.id_vehiculo ? String(form.id_vehiculo) : null}
                  onChange={(val) => setField("id_vehiculo", val ? Number(val) : undefined)}
                  leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
                  radius="xl"
                  disabled={loadingVehiculos || loading}
                  rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                  classNames={fieldClasses}
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo vehículo">
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="xl"
                    size="lg"
                    disabled={loading}
                    onClick={() => setOpenVehiculoModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <CustomDatePicker
                label="Fecha Estimada de Llegada"
                placeholder="Seleccione fecha (opcional)"
                value={form.fecha_estimada_llegada ? parseLocalDate(form.fecha_estimada_llegada) : null}
                onChange={(val: unknown) => {
                  if (!val) {
                    setField("fecha_estimada_llegada", "");
                    return;
                  }
                  const d = typeof val === "string" ? new Date(val) : (val as Date);
                  setField("fecha_estimada_llegada", formatLocalDate(d));
                }}
                disabled={loading}
                clearable
                radius="xl"
                size="sm"
              />
            </Grid.Col>

            {esEdicion && (
              <>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div className="flex gap-2 items-end">
                    <Select
                      label="Tipo de Vehículo"
                      placeholder={
                        loadingTiposVehiculo
                          ? "Cargando tipos..."
                          : "Seleccione (opcional)"
                      }
                      data={tiposVehiculoData}
                      value={
                        form.id_tipo_vehiculo
                          ? String(form.id_tipo_vehiculo)
                          : null
                      }
                      onChange={(val) =>
                        setField(
                          "id_tipo_vehiculo",
                          val ? Number(val) : undefined,
                        )
                      }
                      leftSection={
                        <IconTruck className="w-4 h-4 text-zinc-500" />
                      }
                      searchable
                      clearable
                      radius="xl"
                      disabled={loadingTiposVehiculo || loading}
                      rightSection={
                        loadingTiposVehiculo ? (
                          <Loader size={16} />
                        ) : undefined
                      }
                      classNames={fieldClasses}
                      className="flex-1"
                    />
                    <Tooltip label="Registrar nuevo Tipo de Vehículo">
                      <ActionIcon
                        type="button"
                        variant="filled"
                        color="zinc"
                        radius="xl"
                        size="lg"
                        disabled={loadingTiposVehiculo || loading}
                        onClick={() => setOpenTipoVehiculoModal(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div className="flex gap-2 items-end">
                    <Select
                      label="Conductor"
                      placeholder={
                        loadingConductores
                          ? "Cargando conductores..."
                          : "Seleccione (opcional)"
                      }
                      data={conductoresData}
                      value={form.id_conductor ? String(form.id_conductor) : null}
                      onChange={(val) =>
                        setField("id_conductor", val ? Number(val) : undefined)
                      }
                      leftSection={
                        <IconUser className="w-4 h-4 text-zinc-500" />
                      }
                      searchable
                      clearable
                      radius="xl"
                      disabled={loadingConductores || loading}
                      rightSection={
                        loadingConductores ? (
                          <Loader size={16} />
                        ) : undefined
                      }
                      classNames={fieldClasses}
                      className="flex-1"
                    />
                    <Tooltip label="Registrar nuevo Conductor">
                      <ActionIcon
                        type="button"
                        variant="filled"
                        color="zinc"
                        radius="xl"
                        size="lg"
                        disabled={loadingConductores || loading}
                        onClick={() => setOpenConductorModal(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </Grid.Col>
              </>
            )}

            {esEdicion && (
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex gap-2 items-end">
                  <Select
                    label="Vehículo Carreta (opcional)"
                    placeholder={
                      loadingVehiculos || loadingTiposVehiculo
                        ? "Cargando..."
                        : carretasData.length === 0
                          ? "Sin vehículos carreta registrados"
                          : "Seleccione (opcional)"
                    }
                    data={carretasData}
                    value={
                      form.id_vehiculo_carreta
                        ? String(form.id_vehiculo_carreta)
                        : null
                    }
                    onChange={(val) =>
                      setField(
                        "id_vehiculo_carreta",
                        val ? Number(val) : undefined,
                      )
                    }
                    leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                    searchable
                    clearable
                    radius="xl"
                    disabled={loadingVehiculos || loadingTiposVehiculo || loading}
                    rightSection={
                      loadingVehiculos || loadingTiposVehiculo ? (
                        <Loader size={16} />
                      ) : undefined
                    }
                    classNames={fieldClasses}
                    className="flex-1"
                  />
                  <Tooltip label="Registrar nuevo Vehículo Carreta">
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={loadingTiposVehiculo || loading}
                      onClick={() => {
                        if (idTipoVehiculoCarreta === null) {
                          return;
                        }
                        setOpenCarretaModal(true);
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </Grid.Col>
            )}
          </Grid>

          {/* Proveedores de la carga + guías por proveedor */}
          <div className="border-t border-zinc-800 pt-3 space-y-3">
            <Grid gutter="sm">
              <Grid.Col span={12}>
                <div className="flex gap-2 items-end">
                  <MultiSelect
                    label="Proveedores"
                    placeholder={
                      loadingProveedores
                        ? "Cargando proveedores..."
                        : "Seleccione los proveedores"
                    }
                    data={proveedoresData}
                    value={proveedoresSeleccionados}
                    onChange={setProveedoresSeleccionados}
                    leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                    searchable
                    clearable
                    hidePickedOptions
                    withAsterisk
                    required
                    radius="xl"
                    disabled={loadingProveedores || loading}
                    rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
                    classNames={fieldClasses}
                    className="flex-1"
                  />
                  <Tooltip label="Registrar nuevo proveedor minero">
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={loading}
                      onClick={() => setOpenProveedorModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </Grid.Col>
            </Grid>

            {form.guias.length === 0 ? (
              <Paper
                p="md"
                radius="md"
                className="bg-zinc-900/20 border border-dashed border-zinc-800/80"
              >
                <Text size="xs" c="zinc.5" fw={600} fs="italic" ta="center">
                  Cada proveedor aporta su propia guía de remisión y de transporte.
                </Text>
              </Paper>
            ) : (
              form.guias.map((guia, indice) => (
                <Paper
                  key={guia.id_proveedor}
                  p="md"
                  radius="lg"
                  className="bg-zinc-900/30 border border-zinc-800/80 space-y-3"
                >
                  <Group gap="xs">
                    <IconFileText className="w-4 h-4 text-indigo-400" />
                    <Text size="xs" fw={700} className="text-zinc-200">
                      {razonSocialProveedor(guia.id_proveedor)}
                    </Text>
                    <Badge size="xs" variant="light" color="indigo" radius="sm">
                      Proveedor {indice + 1}
                    </Badge>
                  </Group>

                  <Grid gutter="sm">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Guía Remitente"
                        placeholder="Ej. 001-123456"
                        radius="xl"
                        value={guia.guia_remitente}
                        onChange={(e) =>
                          updateGuia(guia.id_proveedor, {
                            guia_remitente: e.currentTarget.value.toUpperCase(),
                          })
                        }
                        disabled={loading}
                        classNames={fieldClasses}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Guía Transportista (opcional)"
                        placeholder="Ej. 001-123456"
                        radius="xl"
                        value={guia.guia_transportista}
                        onChange={(e) =>
                          updateGuia(guia.id_proveedor, {
                            guia_transportista: e.currentTarget.value.toUpperCase(),
                          })
                        }
                        disabled={loading}
                        classNames={fieldClasses}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MultiFilePicker
                        label="Archivo Guía Remitente"
                        description="1 archivo (PDF o imagen)."
                        files={
                          guia.guia_remitente_file
                            ? [guia.guia_remitente_file]
                            : []
                        }
                        onFilesChange={(files) =>
                          setArchivoNuevoGuia(
                            guia.id_proveedor,
                            "guia_remitente",
                            files[0] ?? null,
                          )
                        }
                        existingFiles={
                          guia.guia_remitente_archivo
                            ? [guia.guia_remitente_archivo]
                            : []
                        }
                        onRemoveExisting={() =>
                          removeArchivoGuia(guia.id_proveedor, "guia_remitente")
                        }
                        multiple={false}
                        maxFiles={1}
                        accept="application/pdf,image/*"
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MultiFilePicker
                        label="Archivo Guía Transportista"
                        description="1 archivo (PDF o imagen)."
                        files={
                          guia.guia_transportista_file
                            ? [guia.guia_transportista_file]
                            : []
                        }
                        onFilesChange={(files) =>
                          setArchivoNuevoGuia(
                            guia.id_proveedor,
                            "guia_transportista",
                            files[0] ?? null,
                          )
                        }
                        existingFiles={
                          guia.guia_transportista_archivo
                            ? [guia.guia_transportista_archivo]
                            : []
                        }
                        onRemoveExisting={() =>
                          removeArchivoGuia(
                            guia.id_proveedor,
                            "guia_transportista",
                          )
                        }
                        multiple={false}
                        maxFiles={1}
                        accept="application/pdf,image/*"
                      />
                    </Grid.Col>
                  </Grid>
                </Paper>
              ))
            )}
          </div>

          <Group justify="flex-end" gap="md" mt="xl">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={loading}
              radius="xl"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              Cancelar
            </Button>
            <Button
              loading={loading}
              onClick={submit}
              radius="xl"
              size="sm"
              leftSection={
                esEdicion ? <IconCheck size={16} /> : <IconCalendarTime size={16} />
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
            >
              {esEdicion ? "Guardar Cambios" : "Programar Recepción"}
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalEstandar
        opened={openEmpresaModal}
        close={() => setOpenEmpresaModal(false)}
        title="Nueva Empresa de Transporte"
        size="lg"
        validateClose
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenEmpresaModal(false)}
          onSuccess={(nueva) => {
            handleEmpresaCreada(nueva);
            setOpenEmpresaModal(false);
          }}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={openVehiculoModal}
        close={() => setOpenVehiculoModal(false)}
        title="Registrar Nuevo Vehículo"
        size="md"
        validateClose
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={form.id_empresa_transporte || null}
          idTipoVehiculo={null}
          onCancel={() => setOpenVehiculoModal(false)}
          onSuccess={(nuevo) => {
            handleVehiculoCreado(nuevo);
            setOpenVehiculoModal(false);
          }}
        />
      </ModalEstandar>

      <ModalRegistroProveedor
        opened={openProveedorModal}
        onClose={() => setOpenProveedorModal(false)}
        onSuccess={(nuevo) => {
          handleProveedorCreado(nuevo);
        }}
      />

      <ModalEstandar
        opened={openCarretaModal}
        close={() => setOpenCarretaModal(false)}
        title="Registrar Vehículo Carreta"
        size="md"
        validateClose
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={form.id_empresa_transporte || null}
          idTipoVehiculo={idTipoVehiculoCarreta}
          onCancel={() => setOpenCarretaModal(false)}
          onSuccess={(nuevo) => {
            handleCarretaCreada(nuevo);
            setOpenCarretaModal(false);
          }}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={openTipoVehiculoModal}
        close={() => setOpenTipoVehiculoModal(false)}
        title="Registrar Tipo de Vehículo"
        size="md"
        validateClose
      >
        <RegistroTipoVehiculoSimple
          onCancel={() => setOpenTipoVehiculoModal(false)}
          onSuccess={(nuevo) => {
            handleTipoVehiculoCreado(nuevo);
            setOpenTipoVehiculoModal(false);
          }}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={openConductorModal}
        close={() => setOpenConductorModal(false)}
        title="Registrar Conductor"
        size="md"
        validateClose
      >
        <RegistroConductor
          onCancel={() => setOpenConductorModal(false)}
          onSuccess={(nuevo) => {
            handleConductorCreado(nuevo);
            setOpenConductorModal(false);
          }}
        />
      </ModalEstandar>
    </>
  );
};
