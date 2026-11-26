import { useState, useEffect } from "react";
import { MultiSelect } from "@mantine/core";
import { IconDeviceFloppy, IconPlus, IconLock } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  Boton,
  BotonIcono,
  CampoSeleccion,
} from "../../../../presentation/utils/ui-tsx";
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
  const [idsProveedor, setIdsProveedor] = useState<string[]>([]);

  const [subModal, setSubModal] = useState<
    "vehiculo" | "conductor" | "empresa" | "tipo" | "proveedor" | null
  >(null);
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
      setIdsProveedor(
        (recepcion.proveedores ?? []).map((p) => String(p.id_proveedor)),
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
      if (grupo === "proveedor") {
        // El proveedor de la carga ya no es una columna de `recepcion_unidad`:
        // se edita por su propio endpoint (tabla `proveedor_recepcion`).
        const nuevos = await RecepcionUnidadesService.setProveedores(
          recepcion.id,
          idsProveedor.map((id) => Number(id)),
        );

        // Las guías de los proveedores que se quitaron dejan de corresponder
        // a la carga: el backend las retira del contrato y aquí se refleja
        // en la fila para que no queden guías huérfanas.
        const idsRestantes = new Set(nuevos.map((p) => p.id_proveedor));
        const guias = (recepcion.guias ?? []).filter(
          (g) => g.id_proveedor === 0 || idsRestantes.has(g.id_proveedor),
        );
        const principal = guias.find(
          (g) => g.id_proveedor === nuevos[0]?.id_proveedor,
        );

        notifySuccess("Proveedores actualizados correctamente");
        onGuardada({
          ...recepcion,
          proveedores: nuevos,
          guias,
          id_proveedor_minero: nuevos[0]?.id_proveedor ?? null,
          proveedor_razon_social: nuevos[0]?.razon_social ?? null,
          guia_remitente: principal?.guia_remitente ?? null,
          guia_transportista: principal?.guia_transportista ?? null,
        });
        onClose();
        return;
      }

      const campos: Record<string, number | null> = {};

      if (grupo === "vehiculo") {
        campos.id_vehiculo = idVehiculo ? Number(idVehiculo) : null;
        campos.id_tipo_vehiculo = idTipoVehiculo ? Number(idTipoVehiculo) : null;
        campos.id_vehiculo_carreta = idVehiculoCarreta
          ? Number(idVehiculoCarreta)
          : null;
      } else if (grupo === "transportista") {
        campos.id_empresa_transporte = idEmpresa ? Number(idEmpresa) : null;
      } else {
        campos.id_conductor = idConductor ? Number(idConductor) : null;
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

  /**
   * Campo de catálogo con botón de registro rápido.
   *
   * El botón va en una columna propia (y no dentro del input) para no
   * depender de la posición del chevron del desplegable.
   */
  const CampoConRegistro = ({
    label,
    opciones,
    valor,
    onChange,
    onPlus,
    deshabilitado,
  }: {
    label: string;
    opciones: Array<{ value: string; label: string }>;
    valor: string | null;
    onChange: (v: string | null) => void;
    onPlus?: () => void;
    deshabilitado?: boolean;
  }) => (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <CampoSeleccion
          label={label}
          placeholder="Seleccione"
          opciones={opciones}
          valor={valor}
          onChange={onChange}
          deshabilitado={deshabilitado}
          buscable
        />
      </div>
      {onPlus ? (
        <BotonIcono
          etiqueta={`Registrar ${label.toLowerCase()}`}
          color="indigo"
          onClick={onPlus}
          disabled={deshabilitado}
          className="h-11 w-11 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          <IconPlus size={18} />
        </BotonIcono>
      ) : null}
    </div>
  );

  const AvisoBloqueado = ({ campo }: { campo: string }) => {
    if (!bloqueado(campo)) return null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        <IconLock size={16} className="shrink-0 text-amber-400" />
        Registrado en la programación: no se puede editar.
      </div>
    );
  };

  return (
    <>
      <ModalTsx
        opened={opened}
        onClose={onClose}
        title={TITULOS[grupo]}
        ancho="lg"
        validateClose
        compacto
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
            <Boton
              variante="fantasma"
              onClick={onClose}
              disabled={submitting}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={() => void handleGuardar()}
              cargando={submitting}
            >
              <IconDeviceFloppy size={18} />
              Guardar
            </Boton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {grupo === "vehiculo" && (
            <>
              <AvisoBloqueado campo="id_vehiculo" />
              <CampoConRegistro
                label="Vehículo"
                opciones={vehiculosData}
                valor={idVehiculo}
                onChange={setIdVehiculo}
                onPlus={() => setSubModal("vehiculo")}
                deshabilitado={bloqueado("id_vehiculo")}
              />
              <CampoConRegistro
                label="Tipo de Vehículo"
                opciones={tiposVehiculo.map((t) => ({
                  value: String(t.id_tipo_vehiculo),
                  label: t.nombre,
                }))}
                valor={idTipoVehiculo}
                onChange={setIdTipoVehiculo}
                onPlus={() => setSubModal("tipo")}
                deshabilitado={bloqueado("id_tipo_vehiculo")}
              />
              <CampoConRegistro
                label="Vehículo Carreta (opcional)"
                opciones={carretasData}
                valor={idVehiculoCarreta}
                onChange={setIdVehiculoCarreta}
                onPlus={() => setSubModal("vehiculo")}
                deshabilitado={bloqueado("id_vehiculo_carreta")}
              />
            </>
          )}

          {grupo === "transportista" && (
            <>
              <AvisoBloqueado campo="id_empresa_transporte" />
              <CampoConRegistro
                label="Empresa de Transporte"
                opciones={empresas.map((e) => ({
                  value: String(e.id_empresa_transporte),
                  label: `${e.razon_social}${e.ruc ? ` (${e.ruc})` : ""}`,
                }))}
                valor={idEmpresa}
                onChange={setIdEmpresa}
                onPlus={() => setSubModal("empresa")}
                deshabilitado={bloqueado("id_empresa_transporte")}
              />
            </>
          )}

          {grupo === "conductor" && (
            <>
              <AvisoBloqueado campo="id_conductor" />
              <CampoConRegistro
                label="Conductor"
                opciones={conductores.map((c) => ({
                  value: String(c.id_conductor),
                  label: `${c.nombre_completo} (${c.dni})`,
                }))}
                valor={idConductor}
                onChange={setIdConductor}
                onPlus={() => setSubModal("conductor")}
                deshabilitado={bloqueado("id_conductor")}
              />
            </>
          )}

          {grupo === "proveedor" && (
            <div className="flex items-end gap-2">
              <MultiSelect
                label="Proveedores"
                placeholder="Seleccione los proveedores"
                data={proveedores.map((p) => ({
                  value: String(p.id_proveedor),
                  label: `${p.razon_social}${p.documento ? ` (${p.documento})` : ""}`,
                }))}
                value={idsProveedor}
                onChange={setIdsProveedor}
                searchable
                clearable
                hidePickedOptions
                size="md"
                radius="lg"
                className="min-w-0 flex-1"
                classNames={{
                  input:
                    "bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
                  label: "text-zinc-300 mb-1.5 font-semibold text-sm",
                }}
                comboboxProps={{ withinPortal: true }}
              />
              <BotonIcono
                etiqueta="Registrar proveedor minero"
                color="indigo"
                onClick={() => setSubModal("proveedor")}
                className="h-11 w-11 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <IconPlus size={18} />
              </BotonIcono>
            </div>
          )}
        </div>
      </ModalTsx>

      {subModal === "vehiculo" && (
        <ModalTsx
          opened
          onClose={() => setSubModal(null)}
          title="Registrar vehículo"
          ancho="sm"
          validateClose
          compacto
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
        </ModalTsx>
      )}

      {subModal === "conductor" && (
        <ModalTsx
          opened
          onClose={() => setSubModal(null)}
          title="Registrar conductor"
          ancho="sm"
          validateClose
          compacto
        >
          <RegistroConductor
            onCancel={() => setSubModal(null)}
            onSuccess={(c) => {
              setIdConductor(String(c.id_conductor));
              setSubModal(null);
            }}
          />
        </ModalTsx>
      )}

      {subModal === "empresa" && (
        <ModalTsx
          opened
          onClose={() => setSubModal(null)}
          title="Registrar empresa de transporte"
          ancho="md"
          validateClose
          compacto
        >
          <RegistroEmpresaTransporte
            onCancel={() => setSubModal(null)}
            onSuccess={(e) => {
              setIdEmpresa(String(e.id));
              setSubModal(null);
            }}
          />
        </ModalTsx>
      )}

      {subModal === "tipo" && (
        <ModalTsx
          opened
          onClose={() => setSubModal(null)}
          title="Registrar tipo de vehículo"
          ancho="sm"
          validateClose
          compacto
        >
          <RegistroTipoVehiculoSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(t) => {
              setIdTipoVehiculo(String(t.id_tipo_vehiculo));
              setSubModal(null);
            }}
          />
        </ModalTsx>
      )}

      {subModal === "proveedor" && (
        <ModalTsx
          opened
          onClose={() => setSubModal(null)}
          title="Registrar proveedor minero"
          ancho="sm"
          validateClose
          compacto
        >
          <RegistroProveedorMineroSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(p) => {
              setIdsProveedor((prev) =>
                prev.includes(String(p.id_proveedor))
                  ? prev
                  : [...prev, String(p.id_proveedor)],
              );
              setSubModal(null);
            }}
          />
        </ModalTsx>
      )}
    </>
  );
};
