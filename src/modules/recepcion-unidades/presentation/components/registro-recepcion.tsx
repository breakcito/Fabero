import { useState } from "react";
import { Button, Grid, Select, TextInput, Textarea, Alert, ActionIcon, Tooltip } from "@mantine/core";
import { IconDeviceFloppy, IconExclamationCircle, IconPlus } from "@tabler/icons-react";
import { useRegistroRecepcion } from "../../hooks/useRegistroRecepcion";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { TipoIngreso, TipoCarga } from "../../enums";

interface Props {
  onCancel: () => void;
  onSuccess: (r: RecepcionUnidadResponse) => void;
}

export const RegistroRecepcion = ({ onCancel, onSuccess }: Props) => {
  const {
    payload,
    handleChange,
    submit,
    loading,
    error,
    conductores,
    empresas,
    tiposVehiculo,
    loadingCatalogos,
    serieBusqueda,
    setSerieBusqueda,
    numeroBusqueda,
    setNumeroBusqueda,
    handleConductorCreado,
  } = useRegistroRecepcion(onSuccess);

  const [openConductorModal, setOpenConductorModal] = useState(false);

  const getEmpresasDropdown = () => {
    return empresas.map((e) => ({
      value: String(e.id_empresa_transporte),
      label: e.razon_social,
    }));
  };

  const getTiposDropdown = () => {
    return tiposVehiculo.map((t) => ({
      value: String(t.id_tipo_vehiculo),
      label: t.nombre,
    }));
  };

  const getConductoresDropdown = () => {
    return conductores
      .filter((c) => c && c.id_conductor)
      .map((c) => ({
        value: String(c.id_conductor),
        label: `${c.nombre_completo} (${c.dni})`,
      }));
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-medium text-xs mb-1.5",
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-6">
        {error && (
          <Alert
            icon={<IconExclamationCircle size={16} />}
            color="red"
            variant="filled"
            className="mb-2"
          >
            {error}
          </Alert>
        )}

        <Grid gutter="md">
          {/* Búsqueda de Vehículo por Serie, Número de Placa y Condición de Ingreso */}
          <Grid.Col span={12}>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end w-full">
              <TextInput
                label="Serie Placa"
                placeholder="Ej. F1B"
                radius="lg"
                className="w-full sm:w-[120px] md:w-[140px]"
                value={serieBusqueda}
                onChange={(e) => setSerieBusqueda(e.target.value.toUpperCase())}
                classNames={fieldClasses}
              />
              <TextInput
                label="Número Placa"
                placeholder="Ej. 890"
                radius="lg"
                className="w-full sm:w-[160px] md:w-[180px]"
                value={numeroBusqueda}
                onChange={(e) => setNumeroBusqueda(e.target.value.toUpperCase())}
                classNames={fieldClasses}
              />
              <Select
                label="Condición de Ingreso"
                placeholder="Seleccione"
                withAsterisk
                radius="lg"
                className="flex-1"
                data={[
                  { value: TipoIngreso.RecepcionMineral, label: "Recepción de Mineral" },
                  { value: TipoIngreso.DespachoMineral, label: "Despacho de Mineral" },
                ]}
                value={payload.tipo_ingreso || null}
                onChange={(val) => handleChange("tipo_ingreso", val as TipoIngreso)}
                classNames={fieldClasses}
              />
            </div>
          </Grid.Col>

          

          {/* Transportista */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Transportista / Empresa de Transporte"
              placeholder="Busque o seleccione"
              searchable
              withAsterisk
              radius="lg"
              disabled={loadingCatalogos}
              data={getEmpresasDropdown()}
              value={payload.id_empresa_transporte ? String(payload.id_empresa_transporte) : null}
              onChange={(val) => handleChange("id_empresa_transporte", val ? Number(val) : 0)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Tipo de Vehículo */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Tipo de Vehículo"
              placeholder="Busque o seleccione"
              searchable
              withAsterisk
              radius="lg"
              disabled={loadingCatalogos}
              data={getTiposDropdown()}
              value={payload.id_tipo_vehiculo ? String(payload.id_tipo_vehiculo) : null}
              onChange={(val) => handleChange("id_tipo_vehiculo", val ? Number(val) : 0)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Conductor y Tipo de Carga */}
          <Grid.Col span={12}>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end w-full">
              {/* Conductor + Botón */}
              <div className="flex-1 flex gap-2 items-end">
                <Select
                  label="Conductor"
                  placeholder="Busque y seleccione conductor"
                  searchable
                  withAsterisk
                  radius="lg"
                  className="flex-1"
                  disabled={loadingCatalogos}
                  data={getConductoresDropdown()}
                  value={payload.id_conductor ? String(payload.id_conductor) : null}
                  onChange={(val) => handleChange("id_conductor", val ? Number(val) : 0)}
                  classNames={fieldClasses}
                />
                <Tooltip label="Registrar Nuevo Conductor" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenConductorModal(true)}
                    className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-[38px] w-[38px] mb-2"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>

              {/* Tipo de Carga */}
              <Select
                label="Tipo de Carga"
                placeholder="Seleccione"
                withAsterisk
                radius="lg"
                className="w-full md:w-[250px] lg:w-[300px]"
                data={[
                  { value: TipoCarga.Granel, label: "Granel" },
                  { value: TipoCarga.Sacos, label: "Sacos" },
                  { value: TipoCarga.Mixto, label: "Mixto" },
                ]}
                value={payload.tipo_carga || null}
                onChange={(val) => handleChange("tipo_carga", val as TipoCarga)}
                classNames={fieldClasses}
              />
            </div>
          </Grid.Col>

          {/* Segunda Placa / Acople */}
          <Grid.Col span={12}>
            <TextInput
              label="Segunda Placa / Acople (Opcional)"
              placeholder="Ej. F1B-891"
              radius="lg"
              value={payload.segunda_placa || ""}
              onChange={(e) => handleChange("segunda_placa", e.target.value.toUpperCase())}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Evidencias del Ingreso */}
          <Grid.Col span={12}>
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
              <MultiFilePicker
                files={payload.evidencias || []}
                onFilesChange={(files) => handleChange("evidencias", files)}
                label="Evidencias del Ingreso"
                description="Fotografías de la unidad, guía de remisión o documentos adjuntos"
              />
            </div>
          </Grid.Col>

          {/* Observaciones */}
          <Grid.Col span={12}>
            <Textarea
              label="Observaciones (Opcional)"
              placeholder="Escribe alguna anotación adicional sobre el ingreso..."
              radius="lg"
              minRows={3}
              value={payload.observacion || ""}
              onChange={(e) => handleChange("observacion", e.target.value)}
              classNames={fieldClasses}
            />
          </Grid.Col>
        </Grid>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onCancel}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            radius="lg"
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Registrar Ingreso
          </Button>
        </div>
      </form>

      {/* Modal: Registro de Nuevo Conductor */}
      <ModalEstandar
        opened={openConductorModal}
        close={() => setOpenConductorModal(false)}
        title="Registrar Nuevo Conductor"
        size="md"
      >
        <RegistroConductor
          onCancel={() => setOpenConductorModal(false)}
          onSuccess={(conductor) => {
            handleConductorCreado(conductor);
            setOpenConductorModal(false);
          }}
        />
      </ModalEstandar>
    </>
  );
};
