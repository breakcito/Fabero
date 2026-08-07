import { useState } from "react";
import { IconDeviceFloppy, IconExclamationCircle, IconSettings } from "@tabler/icons-react";
import { Button, Grid, Select, TextInput, Alert, ActionIcon, Group, NumberInput, Tooltip, Loader } from "@mantine/core";
import { useRegistroVehiculo } from "../../hooks/useRegistroVehiculo";
import type { VehiculoResponse } from "../../service/vehiculos.responses";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormMarca } from "../../../../presentation/utils/form-marca";
import { FormTipoVehiculo } from "../../../../presentation/utils/form-tipo-vehiculo";

interface Props {
  vehiculo?: VehiculoResponse | null;
  onCancel: () => void;
  onSuccess: (v: VehiculoResponse) => void;
}

const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const RegistroVehiculo = ({ vehiculo, onCancel, onSuccess }: Props) => {
  const {
    payload,
    handleChange,
    submit,
    loading,
    error,
    empresas,
    marcas,
    tipos,
    loadingEmpresas,
    loadingMarcas,
    loadingTipos,
    fetchDropdownData,
  } = useRegistroVehiculo((v) => {
    onSuccess(v);
  }, vehiculo);

  const [openMarcasModal, setOpenMarcasModal] = useState(false);
  const [openTiposModal, setOpenTiposModal] = useState(false);
  const [nombreMarca, setNombreMarca] = useState("");

  // Filter lists: Active ones + currently selected one
  const getEmpresasDropdown = () => {
    return empresas
      .filter((e) => e.estado === EstadoBase.Activo || e.id_empresa_transporte === payload.id_empresa_transporte)
      .map((e) => ({
        value: String(e.id_empresa_transporte),
        label: `${e.razon_social} (${e.ruc})`,
      }));
  };

  const getMarcasDropdown = () => {
    return marcas
      .filter((m) => m.estado === EstadoBase.Activo || m.id === payload.id_marca)
      .map((m) => ({
        value: String(m.id),
        label: m.nombre,
      }));
  };

  const getTiposDropdown = () => {
    return tipos
      .filter((t) => t.estado === EstadoBase.Activo || t.id_tipo_vehiculo === payload.id_tipo_vehiculo)
      .map((t) => ({
        value: String(t.id_tipo_vehiculo),
        label: t.nombre,
      }));
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
          {/* Empresa de Transporte */}
          <Grid.Col span={12}>
            <Select
              label="Empresa de Transporte"
              placeholder="Seleccione la empresa propietaria"
              searchable
              withAsterisk
              radius="xl"
              disabled={loadingEmpresas}
              rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
              data={getEmpresasDropdown()}
              value={payload.id_empresa_transporte ? String(payload.id_empresa_transporte) : null}
              onChange={(val) => handleChange("id_empresa_transporte", val ? Number(val) : 0)}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>

          {/* Marca */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Group align="flex-end" gap="xs" wrap="nowrap" className="w-full">
              <Select
                label="Marca"
                placeholder="Seleccione"
                searchable
                withAsterisk
                radius="xl"
                className="flex-1"
                disabled={loadingMarcas}
                rightSection={loadingMarcas ? <Loader size={16} /> : undefined}
                data={getMarcasDropdown()}
                value={payload.id_marca ? String(payload.id_marca) : null}
                onChange={(val) => handleChange("id_marca", val ? Number(val) : 0)}
                classNames={{
                  input:
                    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                  label: "text-zinc-400 font-medium text-xs mb-1.5",
                }}
              />
              <Tooltip label="Gestionar Marcas" withArrow>
                <ActionIcon
                  variant="filled"
                  color="zinc"
                  radius="xl"
                  size="lg"
                  onClick={() => setOpenMarcasModal(true)}
                  className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-[38px] w-[38px]"
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          {/* Tipo de Vehículo */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Group align="flex-end" gap="xs" wrap="nowrap" className="w-full">
              <Select
                label="Tipo de Vehículo"
                placeholder="Seleccione"
                searchable
                withAsterisk
                radius="xl"
                className="flex-1"
                disabled={loadingTipos}
                rightSection={loadingTipos ? <Loader size={16} /> : undefined}
                data={getTiposDropdown()}
                value={payload.id_tipo_vehiculo ? String(payload.id_tipo_vehiculo) : null}
                onChange={(val) => handleChange("id_tipo_vehiculo", val ? Number(val) : 0)}
                classNames={{
                  input:
                    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                  label: "text-zinc-400 font-medium text-xs mb-1.5",
                }}
              />
              <Tooltip label="Gestionar Tipos de Vehículo" withArrow>
                <ActionIcon
                  variant="filled"
                  color="zinc"
                  radius="xl"
                  size="lg"
                  onClick={() => setOpenTiposModal(true)}
                  className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-[38px] w-[38px]"
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          {/* Placa (formato XXX-000) y Constancia MTC */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              withAsterisk
              label="Placa"
              placeholder="Ej. ABC-123"
              radius="xl"
              maxLength={7}
              value={payload.placa || ""}
              onChange={(e) =>
                handleChange("placa", formatPlaca(e.target.value))
              }
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all font-mono uppercase tracking-wider",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Constancia MTC"
              placeholder="Opcional"
              radius="xl"
              value={payload.numero_constancia_mtc || ""}
              onChange={(e) => handleChange("numero_constancia_mtc", e.target.value)}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>

          {/* Pesos en Kilos */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              withAsterisk
              label="Capacidad (Kilos)"
              placeholder="Ej. 15000"
              min={0}
              radius="xl"
              value={payload.capacidad || undefined}
              onChange={(val) => handleChange("capacidad", typeof val === "number" ? val : Number(val) || 0)}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              withAsterisk
              label="Tara (Kilos)"
              placeholder="Ej. 8000"
              min={0}
              radius="xl"
              value={payload.tara || undefined}
              onChange={(val) => handleChange("tara", typeof val === "number" ? val : Number(val) || 0)}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>

          {/* Dimensiones en Metros */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Largo (Metros)"
              placeholder="Opcional"
              min={0}
              decimalScale={2}
              radius="xl"
              value={payload.largo || undefined}
              onChange={(val) => handleChange("largo", typeof val === "number" ? val : val === "" ? "" : (Number(val) || null))}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Ancho (Metros)"
              placeholder="Opcional"
              min={0}
              decimalScale={2}
              radius="xl"
              value={payload.ancho || undefined}
              onChange={(val) => handleChange("ancho", typeof val === "number" ? val : val === "" ? "" : (Number(val) || null))}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Alto (Metros)"
              placeholder="Opcional"
              min={0}
              decimalScale={2}
              radius="xl"
              value={payload.alto || undefined}
              onChange={(val) => handleChange("alto", typeof val === "number" ? val : val === "" ? "" : (Number(val) || null))}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
          </Grid.Col>
        </Grid>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={onCancel}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            radius="xl"
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            {vehiculo ? "Actualizar Vehículo" : "Guardar Vehículo"}
          </Button>
        </div>
      </form>

      {/* Modal: Administrar Marcas */}
      <ModalEstandar
        opened={openMarcasModal}
        close={() => {
          setOpenMarcasModal(false);
          setNombreMarca("");
          fetchDropdownData(); // reload marcas dropdown list
        }}
        title="Registrar Marca de Vehículo"
        size="md"
      >
        <FormMarca
          nombre={nombreMarca}
          setNombre={setNombreMarca}
          marcasExistentes={marcas.map((m) => ({ id_marca: m.id, nombre: m.nombre }))}
          onSuccess={(nuevaMarca) => {
            handleChange("id_marca", nuevaMarca.id_marca);
            setOpenMarcasModal(false);
            setNombreMarca("");
            fetchDropdownData();
          }}
        />
      </ModalEstandar>

      {/* Modal: Administrar Tipos de Vehículo */}
      <ModalEstandar
        opened={openTiposModal}
        close={() => {
          setOpenTiposModal(false);
          fetchDropdownData(); // reload tipos de vehículo dropdown list
        }}
        title="Administrar Tipos de Vehículo"
        size="lg"
      >
        <FormTipoVehiculo
          onSelectTipoVehiculo={(id) => {
            handleChange("id_tipo_vehiculo", id);
          }}
        />
      </ModalEstandar>
    </>
  );
};
