import { useState, useEffect } from "react";
import {
  Select,
  Button,
  Stack,
  Text,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { IconDeviceFloppy, IconPlus, IconLock } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { AuxService } from "../../../../service/auxiliar.service";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import { useNotify } from "../../../../hooks/useNotify";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";

/** Grupo de campos editables de la fila. */
export type GrupoEdicion = "vehiculo" | "transportista" | "conductor" | "proveedor";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  grupo: GrupoEdicion;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

const TITULOS: Record<GrupoEdicion, string> = {
  vehiculo: "Editar Vehículo",
  transportista: "Editar Transportista",
  conductor: "Editar Conductor",
  proveedor: "Editar Proveedor Minero",
};

/** Inputs grandes: `size="md"` (16px) con label y hint legibles. */
const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-200 mb-1.5 font-semibold text-sm",
};

export const ModalEditarCampoUnidad = ({
  opened,
  recepcion,
  grupo,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  const [idVehiculo, setIdVehiculo] = useState<string | null>(null);
  const [idTipoVehiculo, setIdTipoVehiculo] = useState<string | null>(null);
  const [idVehiculoCarreta, setIdVehiculoCarreta] = useState<string | null>(null);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idProveedor, setIdProveedor] = useState<string | null>(null);

  const [subModal, setSubModal] = useState<"vehiculo" | "conductor" | "empresa" | "tipo" | "proveedor" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Precarga los valores de la fila al abrir el modal.
   *
   * El ajuste se hace DURANTE el render (comparando con el valor previo) y
   * no dentro de un efecto: depender del objeto `recepcion` en el array de
   * dependencias reiniciaba el formulario en cada render del padre.
   */
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevRecepcionId, setPrevRecepcionId] = useState(recepcion?.id ?? null);

  const seAbrio = opened !== prevAbierto;
  const cambioRecepcion = (recepcion?.id ?? null) !== prevRecepcionId;

  if (seAbrio || cambioRecepcion) {
    setPrevAbierto(opened);
    setPrevRecepcionId(recepcion?.id ?? null);

    if (opened && recepcion) {
      setIdVehiculo(
        recepcion.id_vehiculo != null ? String(recepcion.id_vehiculo) : null,
      );
      setIdTipoVehiculo(
        recepcion.id_tipo_vehiculo != null
          ? String(recepcion.id_tipo_vehiculo)
          : null,
      );
      setIdVehiculoCarreta(
        recepcion.id_vehiculo_carreta != null
          ? String(recepcion.id_vehiculo_carreta)
          : null,
      );
      setIdEmpresa(
        recepcion.id_empresa_transporte != null
          ? String(recepcion.id_empresa_transporte)
          : null,
      );
      setIdConductor(
        recepcion.id_conductor != null ? String(recepcion.id_conductor) : null,
      );
      setIdProveedor(
        recepcion.id_proveedor_minero != null
          ? String(recepcion.id_proveedor_minero)
          : null,
      );
    }
  }

  // Catálogos: se cargan al abrir el modal.
  useEffect(() => {
    if (!opened) return;

    let cancelado = false;

    Promise.all([
      AuxService.get_vehiculos(),
      AuxService.get_tipos_vehiculo(),
      AuxService.get_conductores(),
      AuxService.get_empresas_transporte(),
      AuxService.get_proveedores(),
    ])
      .then(([veh, tipos, cond, emp, prov]) => {
        if (cancelado) return;
        setVehiculos(veh as RES_Vehiculo[]);
        setTiposVehiculo(tipos as RES_TipoVehiculo[]);
        setConductores(cond as RES_Conductor[]);
        setEmpresas(emp as RES_EmpresaTransporte[]);
        setProveedores(prov.data ?? (prov as unknown as RES_Proveedor[]));
      })
      .catch((e) => {
        console.error("Error al cargar catálogos", e);
        if (!cancelado) notifyError("No se pudieron cargar los catálogos.");
      });

    return () => {
      cancelado = true;
    };
  }, [opened, notifyError]);

  if (!recepcion) return null;

  const bloqueado = (campo: string) =>
    (recepcion.campos_bloqueados ?? []).includes(campo);

  const handleGuardar = async () => {
    setSubmitting(true);
    try {
      const campos: Record<string, number | null> = {};

      if (grupo === "vehiculo") {
        campos.id_vehiculo = idVehiculo ? Number(idVehiculo) : null;
        campos.id_tipo_vehiculo = idTipoVehiculo ? Number(idTipoVehiculo) : null;
        campos.id_vehiculo_carreta = idVehiculoCarreta
          ? Number(idVehiculoCarreta)
          : null;
      } else if (grupo === "transportista") {
        campos.id_empresa_transporte = idEmpresa ? Number(idEmpresa) : null;
      } else if (grupo === "conductor") {
        campos.id_conductor = idConductor ? Number(idConductor) : null;
      } else {
        campos.id_proveedor_minero = idProveedor ? Number(idProveedor) : null;
      }

      const actualizada = await RecepcionUnidadesService.actualizarCampos(
        recepcion.id,
        { campos },
      );
      notifySuccess("Recepción actualizada correctamente");
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar la recepción de unidad.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const vehiculosData = vehiculos
    .filter((v) => !v.es_carreta || Number(v.es_carreta) === 0)
    .map((v) => ({ value: String(v.id_vehiculo), label: v.placa }));

  const carretasData = vehiculos
    .filter((v) => Number(v.es_carreta) === 1)
    .map((v) => ({ value: String(v.id_vehiculo), label: v.placa }));

  const SelectGrande = ({
    label,
    data,
    value,
    onChange,
    onPlus,
    disabled,
  }: {
    label: string;
    data: Array<{ value: string; label: string }>;
    value: string | null;
    onChange: (v: string | null) => void;
    onPlus?: () => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-end gap-2">
      <Select
        label={label}
        placeholder="Seleccione"
        data={data}
        value={value}
        onChange={onChange}
        searchable
        clearable
        size="md"
        radius="lg"
        className="flex-1"
        classNames={fieldClasses}
        disabled={disabled}
        comboboxProps={{ withinPortal: true }}
      />
      {onPlus && (
        <Tooltip label={`Registrar ${label.toLowerCase()}`} withArrow>
          <ActionIcon
            variant="filled"
            color="indigo"
            radius="lg"
            size="lg"
            onClick={onPlus}
            disabled={disabled}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  );

  const AvisoBloqueado = ({ campo }: { campo: string }) => {
    if (!bloqueado(campo)) return null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
        <IconLock size={16} className="text-yellow-400" />
        <Text size="sm" className="text-yellow-200">
          Este dato se registró en la programación, por lo que no se puede
          editar.
        </Text>
      </div>
    );
  };

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={TITULOS[grupo]}
        size="md"
        validateClose
      >
        <Stack gap="lg" className="p-1">
          {grupo === "vehiculo" && (
            <>
              <AvisoBloqueado campo="id_vehiculo" />
              <SelectGrande
                label="Vehículo"
                data={vehiculosData}
                value={idVehiculo}
                onChange={setIdVehiculo}
                onPlus={() => setSubModal("vehiculo")}
                disabled={bloqueado("id_vehiculo")}
              />
              <SelectGrande
                label="Tipo de Vehículo"
                data={tiposVehiculo.map((t) => ({
                  value: String(t.id_tipo_vehiculo),
                  label: t.nombre,
                }))}
                value={idTipoVehiculo}
                onChange={setIdTipoVehiculo}
                onPlus={() => setSubModal("tipo")}
                disabled={bloqueado("id_tipo_vehiculo")}
              />
              <SelectGrande
                label="Vehículo Carreta (opcional)"
                data={carretasData}
                value={idVehiculoCarreta}
                onChange={setIdVehiculoCarreta}
                onPlus={() => setSubModal("vehiculo")}
                disabled={bloqueado("id_vehiculo_carreta")}
              />
            </>
          )}

          {grupo === "transportista" && (
            <>
              <AvisoBloqueado campo="id_empresa_transporte" />
              <SelectGrande
                label="Empresa de Transporte"
                data={empresas.map((e) => ({
                  value: String(e.id_empresa_transporte),
                  label: `${e.razon_social}${e.ruc ? ` (${e.ruc})` : ""}`,
                }))}
                value={idEmpresa}
                onChange={setIdEmpresa}
                onPlus={() => setSubModal("empresa")}
                disabled={bloqueado("id_empresa_transporte")}
              />
            </>
          )}

          {grupo === "conductor" && (
            <>
              <AvisoBloqueado campo="id_conductor" />
              <SelectGrande
                label="Conductor"
                data={conductores.map((c) => ({
                  value: String(c.id_conductor),
                  label: `${c.nombre_completo} (${c.dni})`,
                }))}
                value={idConductor}
                onChange={setIdConductor}
                onPlus={() => setSubModal("conductor")}
                disabled={bloqueado("id_conductor")}
              />
            </>
          )}

          {grupo === "proveedor" && (
            <>
              <AvisoBloqueado campo="id_proveedor_minero" />
              <SelectGrande
                label="Proveedor Minero"
                data={proveedores.map((p) => ({
                  value: String(p.id_proveedor),
                  label: `${p.razon_social}${p.documento ? ` (${p.documento})` : ""}`,
                }))}
                value={idProveedor}
                onChange={setIdProveedor}
                onPlus={() => setSubModal("proveedor")}
                disabled={bloqueado("id_proveedor_minero")}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              variant="subtle"
              color="gray"
              radius="lg"
              size="md"
              onClick={onClose}
              disabled={submitting}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              radius="lg"
              size="md"
              loading={submitting}
              onClick={handleGuardar}
              leftSection={<IconDeviceFloppy size={18} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6"
            >
              Guardar
            </Button>
          </div>
        </Stack>
      </ModalEstandar>

      {subModal === "vehiculo" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar vehículo"
          size="sm"
          validateClose
        >
          <RegistroVehiculoSimple
            idEmpresaTransporte={idEmpresa ? Number(idEmpresa) : null}
            idTipoVehiculo={idTipoVehiculo ? Number(idTipoVehiculo) : null}
            onCancel={() => setSubModal(null)}
            onSuccess={(v) => {
              setIdVehiculo(String(v.id_vehiculo));
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "conductor" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar conductor"
          size="sm"
          validateClose
        >
          <RegistroConductor
            onCancel={() => setSubModal(null)}
            onSuccess={(c) => {
              setIdConductor(String(c.id_conductor));
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "empresa" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar empresa de transporte"
          size="md"
          validateClose
        >
          <RegistroEmpresaTransporte
            onCancel={() => setSubModal(null)}
            onSuccess={(e) => {
              setIdEmpresa(String(e.id));
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "tipo" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar tipo de vehículo"
          size="sm"
          validateClose
        >
          <RegistroTipoVehiculoSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(t) => {
              setIdTipoVehiculo(String(t.id_tipo_vehiculo));
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "proveedor" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar proveedor minero"
          size="sm"
          validateClose
        >
          <RegistroProveedorMineroSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(p) => {
              setIdProveedor(String(p.id_proveedor));
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}
    </>
  );
};
