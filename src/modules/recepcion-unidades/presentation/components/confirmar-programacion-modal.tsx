import {
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MultiSelect, Loader } from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconLock,

  IconPlus,
} from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  AreaTexto,
  Boton,
  BotonIcono,
  CampoSeleccion,
  CampoTexto,
  Cargador,
  Insignia,
} from "../../../../presentation/utils/ui-tsx";import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useConfirmarProgramacion } from "../../hooks/useConfirmarProgramacion";
import { useNotify } from "../../../../hooks/useNotify";
import { useDispositivo } from "../../../../hooks/useDispositivo";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { AgregarAcompananteModal, type DatosAcompananteForm } from "./agregar-acompanante-modal";
import { AgregarVehiculoModal, type DatosVehiculoForm } from "./agregar-vehiculo-modal";
import { RegistrarOcupanteModal, type DatosOcupanteSlot } from "./registrar-ocupante-modal";
import { VerFotosModal } from "./ver-fotos-modal";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";
import { ListaArchivosSimple } from "../../../../presentation/utils/archivo/lista-archivos-simple";
import { SelectorArchivo } from "../../../../presentation/utils/archivo/selector-archivo";
import { EstadoSalida } from "../../../../shared/enums/_generic/estado-salida";

interface Props {
  opened: boolean;
  programacion?: RecepcionUnidadResponse | null;
  onClose: () => void;
  onConfirmada: (actualizada: RecepcionUnidadResponse) => void;
}

/**
 * Letra que identifica una posición (A, B, C...).
 *
 * Los puestos de ocupante se identifican con letras para no exponer
 * numerales de base de datos en la interfaz.
 */
// const letraPosicion = (indice: number): string =>
//   String.fromCharCode(65 + Math.max(0, indice));

/**
 * Pasos del formulario en móvil. El escritorio mantiene el layout de una
 * sola página; el móvil lo recorre paso a paso para no saturar la pantalla
 * con la pantalla de un celular en planta.
 */
const PASOS_WIZARD = [
  { titulo: "Transporte", descripcion: "Empresa de transporte y conductor" },
  { titulo: "Vehículo", descripcion: "Vehículo, tipo de vehículo y carreta" },
  { titulo: "Guías", descripcion: "Guías de remisión y de transporte" },
  { titulo: "Cierre", descripcion: "Evidencias, observación y acompañantes" },
] as const;

interface CampoCatalogoProps {
  etiqueta: string;
  placeholder: string;
  opciones: { value: string; label: string }[];
  valor: string | null;
  onChange: (valor: string | null) => void;
  deshabilitado: boolean;
  bloqueado: boolean;
  cargando: boolean;
  buscable: boolean;
  requerido?: boolean;
  onNuevo?: () => void;
  etiquetaNuevo?: string;
}

/**
 * Campo de catálogo con botón de registro rápido.
 *
 * El candado y el spinner van en una columna propia (y no dentro del input)
 * para no depender de la posición del chevron del select nativo.
 */
const CampoCatalogo = ({
  etiqueta,
  placeholder,
  opciones,
  valor,
  onChange,
  deshabilitado,
  bloqueado,
  cargando,
  buscable,
  requerido,
  onNuevo,
  etiquetaNuevo,
}: CampoCatalogoProps) => {
  const indicador = bloqueado ? (
    <IconLock size={14} className="text-zinc-500" />
  ) : cargando ? (
    <Cargador tamano={14} className="text-zinc-400" />
  ) : null;

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <CampoSeleccion
          label={etiqueta}
          placeholder={placeholder}
          opciones={opciones}
          valor={valor}
          onChange={onChange}
          deshabilitado={deshabilitado}
          buscable={buscable}
          requerido={requerido}
        />
      </div>

      {indicador ? (
        <div className="flex h-11 items-center sm:h-10">{indicador}</div>
      ) : null}

      {onNuevo ? (
        <BotonIcono
          etiqueta={etiquetaNuevo}
          onClick={onNuevo}
          disabled={deshabilitado}
          className="h-11 w-11 border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 sm:h-10 sm:w-10"
        >
          <IconPlus size={18} />
        </BotonIcono>
      ) : null}
    </div>
  );
};

export const ConfirmarProgramacionModal = ({
  opened,
  programacion,
  onClose,
  onConfirmada,
}: Props) => {
  const ctrl = useConfirmarProgramacion({ programacion, opened });
  const { notifyError } = useNotify();
  const { esCompacto } = useDispositivo();

  const [openModalAcompanante, setOpenModalAcompanante] = useState(false);
  const [openModalVehiculo, setOpenModalVehiculo] = useState(false);
  const [openConductorModal, setOpenConductorModal] = useState(false);
  const [openVehiculoSimpleModal, setOpenVehiculoSimpleModal] = useState(false);
  const [openTipoVehiculoModal, setOpenTipoVehiculoModal] = useState(false);
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [openCarretaModal, setOpenCarretaModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);

  const [editingAcompanante, setEditingAcompanante] = useState<{
    index: number;
    datos: DatosAcompananteForm;
  } | null>(null);
  const [editingVehiculo, setEditingVehiculo] = useState<{
    id: number;
    datos: DatosVehiculoForm;
  } | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    index: number;
    vehiculoPlaca: string;
    slotNum: number;
    datos: DatosOcupanteSlot;
  } | null>(null);
  const [visualizarFotos, setVisualizarFotos] = useState<{
    title: string;
    fotosNuevas?: File[];
    fotosExistentes?: string[];
  } | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [abiertoAnterior, setAbiertoAnterior] = useState(opened);

  // Cada apertura del modal arranca en el primer paso del wizard móvil.
  // Se ajusta durante el render (no en un efecto) para evitar renders
  // en cascada: sólo cambia cuando el estado de `opened` cambia.
  if (opened !== abiertoAnterior) {
    setAbiertoAnterior(opened);
    if (opened) setPaso(0);
  }

  const empresasOptions = (ctrl.empresasCatalog ?? []).map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));

  const vehiculosOptions = (ctrl.vehiculosCatalog ?? [])
    .filter((v) => !v.es_carreta || Number(v.es_carreta) === 0)
    .map((v) => ({
      value: String(v.id_vehiculo),
      label: v.placa || "Vehículo sin placa",
    }));

  const conductoresOptions = (ctrl.conductoresCatalog ?? []).map((c) => ({
    value: String(c.id_conductor),
    label: c.dni ? `${c.nombre_completo} (${c.dni})` : c.nombre_completo,
  }));

  const guiasProgramacion = ctrl.guiasConfirmacion;
  const proveedoresProgramacion = ctrl.programacion?.proveedores ?? [];

  /** La programación fija los proveedores: no se pueden cambiar al confirmar. */
  const hayProgramacion = Boolean(ctrl.programacion);

  const proveedoresOptions = (ctrl.proveedoresCatalog ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  /**
   * Nombre del proveedor de una guía.
   *
   * Se busca primero en la programación (que ya trae la razón social) y
   * después en el catálogo, para los proveedores que elige el operador.
   */
  const razonSocialProveedor = (idProveedor: number): string =>
    proveedoresProgramacion.find((p) => p.id_proveedor === idProveedor)
      ?.razon_social ??
    (ctrl.proveedoresCatalog ?? []).find(
      (p) => p.id_proveedor === idProveedor,
    )?.razon_social ??
    (idProveedor === 0 ? "Guías de la unidad" : "Proveedor de la carga");

  /**
   * Estado de ingreso de la unidad: con carga o vacía.
   *
   * No depende del tipo de ingreso (recepción o despacho): lo declara el
   * operador según cómo llega el vehículo.
   */
  const opcionesEstadoIngreso = [
    { value: EstadoSalida.ConCarga, label: "Con carga" },
    { value: EstadoSalida.Vacio, label: "Vacío" },
  ];

  const campoEstadoIngreso = (
    <CampoSeleccion
      label="Estado ingreso"
      placeholder="Seleccione"
      opciones={opcionesEstadoIngreso}
      valor={ctrl.estadoIngreso}
      onChange={(val) =>
        ctrl.setEstadoIngreso(val ? (val as EstadoSalida) : null)
      }
      deshabilitado={confirmando}
      requerido
    />
  );

  const tiposVehiculoOptions = (ctrl.tiposVehiculoCatalog ?? []).map((tv) => ({
    value: String(tv.id_tipo_vehiculo),
    label: tv.nombre,
  }));

  // Vehículos tipo carreta (es_carreta === 1) para el dropdown opcional de "Vehículo Carreta".
  // El backend serializa TINYINT(1) como número 0/1, mismo patrón que guias-primer-tramo.
  const vehiculosCarretaOptions = (ctrl.vehiculosCatalog ?? [])
    .filter((v) => Number(v.es_carreta) === 1)
    .map((v) => ({
      value: String(v.id_vehiculo),
      label: v.placa || "Vehículo sin placa",
    }));

  // id_tipo_vehiculo del TipoVehiculo con es_carreta=1, para pre-asignar al sub-modal de registro.
  const idTipoVehiculoCarreta =
    (ctrl.tiposVehiculoCatalog ?? []).find((t) => Number(t.es_carreta) === 1)?.id_tipo_vehiculo ?? null;

  const handleConfirmar = async () => {
    setConfirmando(true);
    const res = await ctrl.confirmar();
    setConfirmando(false);
    if (!res) return;

    const { visita, updatedRecepcion } = res;
    const finalRecepcion = programacion
      ? {
          ...programacion,
          ...updatedRecepcion,
          estado: "En Planta",
          visita,
        }
      : updatedRecepcion;

    onConfirmada(finalRecepcion);
    onClose();
  };

  // const visitantesPrincipal = ctrl.visitantes.filter((v) => !v.id_visita_vehiculo);

  /**
   * El operador puede moverse libremente entre pasos: la validación de los
   * campos se hace al confirmar, no al avanzar.
   */
  const avanzarPaso = () => {
    if (paso < PASOS_WIZARD.length - 1) setPaso(paso + 1);
  };

  const retrocederPaso = () => {
    if (paso > 0) setPaso(paso - 1);
  };

  const irAPaso = (destino: number) => {
    if (destino === paso) return;
    setPaso(destino);
  };

  const handleSubmitWizard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmando) return;
    if (paso < PASOS_WIZARD.length - 1) {
      avanzarPaso();
      return;
    }
    void handleConfirmar();
  };

  /**
   * Evita el envío implícito del formulario con la tecla Enter (por ejemplo
   * dentro del buscador de un select): en el último paso dispararía el
   * registro sin que el operador haya tocado "Registrar".
   */
  const handleKeyDownWizard = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  };

  /* --------------------------------------------------------------------- */
  /* Fragmentos de formulario (compartidos por escritorio y móvil)          */
  /* --------------------------------------------------------------------- */

  const empresaBloqueada = Boolean(ctrl.programacion?.id_empresa_transporte);
  const vehiculoBloqueado = Boolean(ctrl.programacion?.id_vehiculo);
  const tipoVehiculoBloqueado = Boolean(ctrl.programacion?.id_tipo_vehiculo);
  const carretaBloqueada = Boolean(ctrl.programacion?.id_vehiculo_carreta);

  const campoEmpresaTransporte = (
    <CampoCatalogo
      etiqueta="Empresa de Transporte"
      placeholder={
        ctrl.loadingCatalogos ? "Cargando..." : "Seleccione la empresa"
      }
      opciones={empresasOptions}
      valor={
        ctrl.programacion?.id_empresa_transporte
          ? String(ctrl.programacion.id_empresa_transporte)
          : ctrl.idEmpresaTransporteEditado
            ? String(ctrl.idEmpresaTransporteEditado)
            : null
      }
      onChange={(val) =>
        ctrl.setIdEmpresaTransporteEditado(val ? Number(val) : null)
      }
      deshabilitado={confirmando || empresaBloqueada}
      bloqueado={empresaBloqueada}
      cargando={ctrl.loadingCatalogos}
      buscable
      requerido
      onNuevo={
        empresaBloqueada
          ? undefined
          : () => setOpenEmpresaModal(true)
      }
      etiquetaNuevo="Nueva Empresa de Transporte"
    />
  );

  const campoVehiculo = (
    <CampoCatalogo
      etiqueta="Vehículo"
      placeholder={
        ctrl.loadingCatalogos ? "Cargando..." : "Seleccione vehículo"
      }
      opciones={vehiculosOptions}
      valor={
        ctrl.programacion?.id_vehiculo
          ? String(ctrl.programacion.id_vehiculo)
          : ctrl.idVehiculoEditado
            ? String(ctrl.idVehiculoEditado)
            : null
      }
      onChange={(val) =>
        ctrl.setIdVehiculoEditado(val ? Number(val) : null)
      }
      deshabilitado={confirmando || vehiculoBloqueado}
      bloqueado={vehiculoBloqueado}
      cargando={ctrl.loadingCatalogos}
      buscable
      requerido
      onNuevo={
        vehiculoBloqueado
          ? undefined
          : () => setOpenVehiculoSimpleModal(true)
      }
      etiquetaNuevo="Registrar Nuevo Vehículo"
    />
  );

  const campoConductor = (
    <CampoCatalogo
      etiqueta="Conductor"
      placeholder={
        ctrl.loadingCatalogos ? "Cargando..." : "Seleccione conductor"
      }
      opciones={conductoresOptions}
      valor={ctrl.idConductor ? String(ctrl.idConductor) : null}
      onChange={(val) => ctrl.setIdConductor(val ? Number(val) : null)}
      deshabilitado={ctrl.lockedConductor || ctrl.loadingCatalogos || confirmando}
      bloqueado={ctrl.lockedConductor}
      cargando={ctrl.loadingCatalogos}
      buscable
      requerido
      onNuevo={
        ctrl.lockedConductor
          ? undefined
          : () => setOpenConductorModal(true)
      }
      etiquetaNuevo="Registrar Nuevo Conductor"
    />
  );

  const campoTipoVehiculo = (
    <CampoCatalogo
      etiqueta="Tipo de Vehículo"
      placeholder={
        ctrl.loadingCatalogos
          ? "Cargando..."
          : "Seleccione tipo de vehículo"
      }
      opciones={tiposVehiculoOptions}
      valor={
        ctrl.programacion?.id_tipo_vehiculo
          ? String(ctrl.programacion.id_tipo_vehiculo)
          : ctrl.idTipoVehiculoEditado
            ? String(ctrl.idTipoVehiculoEditado)
            : null
      }
      onChange={(val) =>
        ctrl.setIdTipoVehiculoEditado(val ? Number(val) : null)
      }
      deshabilitado={confirmando || tipoVehiculoBloqueado}
      bloqueado={tipoVehiculoBloqueado}
      cargando={ctrl.loadingCatalogos}
      buscable={false}
      requerido
      onNuevo={
        tipoVehiculoBloqueado
          ? undefined
          : () => setOpenTipoVehiculoModal(true)
      }
      etiquetaNuevo="Registrar Tipo de Vehículo"
    />
  );

  const campoVehiculoCarreta = (
    <CampoCatalogo
      etiqueta="Vehículo Carreta (opcional)"
      placeholder={
        ctrl.loadingCatalogos
          ? "Cargando..."
          : vehiculosCarretaOptions.length === 0
            ? "Sin vehículos carreta registrados"
            : "Seleccione (opcional)"
      }
      opciones={vehiculosCarretaOptions}
      valor={
        ctrl.programacion?.id_vehiculo_carreta
          ? String(ctrl.programacion.id_vehiculo_carreta)
          : ctrl.idVehiculoCarreta
            ? String(ctrl.idVehiculoCarreta)
            : null
      }
      onChange={(val) =>
        ctrl.setIdVehiculoCarreta(val ? Number(val) : null)
      }
      deshabilitado={confirmando || carretaBloqueada}
      bloqueado={carretaBloqueada}
      cargando={ctrl.loadingCatalogos}
      buscable
      onNuevo={
        carretaBloqueada
          ? undefined
          : () => {
              if (idTipoVehiculoCarreta === null) {
                notifyError(
                  "No existe un Tipo de Vehículo marcado como 'Carreta'. Créelo en Gestión de Tipos de Vehículo antes de continuar.",
                );
                return;
              }
              setOpenCarretaModal(true);
            }
      }
      etiquetaNuevo="Registrar Vehículo Carreta"
    />
  );

  /**
   * Guías de la carga.
   *
   * Sigue el mismo esquema que la Programación de Recepción: se eligen los
   * proveedores de la carga y cada uno aporta su propia guía (remitente y
   * transportista) con sus archivos.
   *
   * En una PROGRAMACIÓN los proveedores vienen fijados por el documento
   * autorizado: se muestran pero no se pueden cambiar.
   */
  const bloqueGuias = (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <MultiSelect
            label="Proveedores de la carga"
            placeholder={
              ctrl.loadingCatalogos
                ? "Cargando proveedores..."
                : "Seleccione los proveedores"
            }
            data={proveedoresOptions}
            value={ctrl.proveedoresSeleccionados.map((id) => String(id))}
            onChange={(val) =>
              ctrl.setProveedoresSeleccionados(val.map((v) => Number(v)))
            }
            searchable
            clearable
            hidePickedOptions
            disabled={ctrl.loadingCatalogos || confirmando || hayProgramacion}
            rightSection={
              ctrl.loadingCatalogos ? <Loader size={16} /> : undefined
            }
            classNames={{
              input:
                "bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-300 mb-1.5 font-semibold text-sm",
            }}
            comboboxProps={{ withinPortal: true }}
          />
        </div>
        {hayProgramacion ? (
          <div className="flex h-11 items-center text-zinc-500">
            <IconLock size={16} />
          </div>
        ) : (
          <BotonIcono
            etiqueta="Registrar nuevo proveedor minero"
            color="indigo"
            onClick={() => setOpenProveedorModal(true)}
            disabled={confirmando}
            className="h-11 w-11 shrink-0 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            <IconPlus size={18} />
          </BotonIcono>
        )}
      </div>

      {guiasProgramacion.length === 0 ? (
        <p className="py-4 text-center text-sm italic text-zinc-500">
          Cada proveedor aporta su propia guía de remisión y de transporte.
        </p>
      ) : (
        guiasProgramacion.map((guia, indice) => {
          const remitenteBloqueado = ctrl.guiaBloqueadaDe(
            guia.id_proveedor,
            "guia_remitente",
          );
          const transportistaBloqueado = ctrl.guiaBloqueadaDe(
            guia.id_proveedor,
            "guia_transportista",
          );

          const archivoRemitente = ctrl.guiasArchivos[guia.id_proveedor]
            ?.guia_remitente;
          const archivoTransportista = ctrl.guiasArchivos[guia.id_proveedor]
            ?.guia_transportista;

          return (
            <div
              key={guia.id_proveedor}
              className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
            >
              <div className="flex items-center gap-2">
                <IconFileText className="h-4 w-4 text-indigo-400" />
                <p className="text-sm font-bold text-zinc-100">
                  {razonSocialProveedor(guia.id_proveedor)}
                </p>
                <Insignia color="indigo">Proveedor {indice + 1}</Insignia>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoTexto
                  label="Guía Remitente"
                  placeholder="Ej. 001-123456"
                  value={guia.guia_remitente}
                  onChange={(e) =>
                    ctrl.setGuiaConfirmacion(
                      guia.id_proveedor,
                      "guia_remitente",
                      e.currentTarget.value,
                    )
                  }
                  readOnly={remitenteBloqueado}
                  disabled={confirmando}
                />
                <CampoTexto
                  label="Guía Transportista (opcional)"
                  placeholder="Ej. 001-123456"
                  value={guia.guia_transportista}
                  onChange={(e) =>
                    ctrl.setGuiaConfirmacion(
                      guia.id_proveedor,
                      "guia_transportista",
                      e.currentTarget.value,
                    )
                  }
                  readOnly={transportistaBloqueado}
                  disabled={confirmando}
                />

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-400">
                    Archivo Guía Remitente
                  </p>
                  <SelectorArchivo
                    label="Sin archivo"
                    accept="application/pdf,image/*"
                    archivo={archivoRemitente ?? null}
                    archivoExistente={
                      archivoRemitente ? null : guia.guia_remitente_archivo
                    }
                    onQuitarExistente={() =>
                      ctrl.quitarArchivoGuia(
                        guia.id_proveedor,
                        "guia_remitente_archivo",
                      )
                    }
                    disabled={confirmando}
                    onChange={(archivo) =>
                      ctrl.setGuiaArchivo(
                        guia.id_proveedor,
                        "guia_remitente",
                        archivo,
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-400">
                    Archivo Guía Transportista
                  </p>
                  <SelectorArchivo
                    label="Sin archivo"
                    accept="application/pdf,image/*"
                    archivo={archivoTransportista ?? null}
                    archivoExistente={
                      archivoTransportista
                        ? null
                        : guia.guia_transportista_archivo
                    }
                    onQuitarExistente={() =>
                      ctrl.quitarArchivoGuia(
                        guia.id_proveedor,
                        "guia_transportista_archivo",
                      )
                    }
                    disabled={confirmando}
                    onChange={(archivo) =>
                      ctrl.setGuiaArchivo(
                        guia.id_proveedor,
                        "guia_transportista",
                        archivo,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const bloqueEvidencias = (
    <ListaArchivosSimple
      archivos={ctrl.evidencias}
      onFilesChange={ctrl.setEvidencias}
      label="Adjuntar evidencias"
    />
  );

  const bloqueObservacion = (
    <AreaTexto
      label="Observación"
      placeholder="Opcional"
      rows={3}
      value={ctrl.observacion}
      onChange={(e) => ctrl.setObservacion(e.currentTarget.value)}
      disabled={confirmando}
      className="max-h-40"
    />
  );

  // const separadorAcompanantes = (
  //   <div className="flex items-center gap-3">
  //     <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-zinc-500">
  //       Acompañantes y Vehículos de la Recepción
  //     </span>
  //     <Separador className="flex-1" />
  //   </div>
  // );

  // const botonesAcompanantes = (
  //   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  //     <Boton
  //       variante="secundario"
  //       onClick={() => setOpenModalAcompanante(true)}
  //       disabled={confirmando}
  //       className="w-full border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80"
  //     >
  //       <IconUserPlus size={18} className="text-indigo-400" />
  //       + Agregar Acompañante de Unidad
  //     </Boton>

  //     <Boton
  //       variante="secundario"
  //       onClick={() => setOpenModalVehiculo(true)}
  //       disabled={confirmando}
  //       className="w-full border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80"
  //     >
  //       <IconTruck size={18} className="text-indigo-400" />
  //       + Agregar Vehículo Acompañante
  //     </Boton>
  //   </div>
  // );

  // const listaAcompanantes = (
  //   <>
  //     {/* Sección Acompañantes de la Unidad Principal */}
  //     {visitantesPrincipal.length > 0 && (
  //       <div className="space-y-2">
  //         <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
  //           Acompañantes del Vehículo Principal ({visitantesPrincipal.length})
  //         </p>
  //         <div className="flex flex-col gap-2">
  //           {ctrl.visitantes.map((v, index) => {
  //             if (v.id_visita_vehiculo) return null;
  //             return (
  //               <div
  //                 key={`main-${index}`}
  //                 className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
  //               >
  //                 <div className="flex items-center gap-3">
  //                   <IconUserCheck className="h-5 w-5 shrink-0 text-indigo-400" />
  //                   <div className="min-w-0">
  //                     <div className="flex flex-wrap items-center gap-2">
  //                       <span className="text-sm font-semibold text-zinc-100">
  //                         {v.nombre} {v.apellido ?? ""}
  //                       </span>
  //                       <Insignia color="indigo">Acompañante</Insignia>
  //                     </div>
  //                     <p className="text-xs text-zinc-500">
  //                       {v.dni ? `DNI: ${v.dni}` : "Sin DNI"}{" "}
  //                       {v.telefono ? `• Tel: ${v.telefono}` : ""}
  //                     </p>
  //                   </div>
  //                 </div>

  //                 <div className="flex flex-wrap items-center justify-end gap-1">
  //                   {Boolean(v.foto_documento?.length) ||
  //                   Boolean(v.foto_documento_existente) ? (
  //                     <Boton
  //                       variante="fantasma"
  //                       tamano="sm"
  //                       className="px-2 py-2"
  //                       onClick={() =>
  //                         setVisualizarFotos({
  //                           title: `Fotos de ${v.nombre}`,
  //                           fotosNuevas: v.foto_documento,
  //                           fotosExistentes:
  //                             typeof v.foto_documento_existente === "string"
  //                               ? [v.foto_documento_existente]
  //                               : Array.isArray(v.foto_documento_existente)
  //                                 ? v.foto_documento_existente
  //                                 : [],
  //                         })
  //                       }
  //                     >
  //                       <IconPhoto size={12} />
  //                       Ver{" "}
  //                       {(v.foto_documento?.length ?? 0) +
  //                         (v.foto_documento_existente ? 1 : 0)}{" "}
  //                       foto(s)
  //                     </Boton>
  //                   ) : (
  //                     <span className="text-xs italic text-zinc-600">
  //                       Sin fotos
  //                     </span>
  //                   )}
  //                   <Boton
  //                     variante="fantasma"
  //                     tamano="sm"
  //                     className="px-2 py-2"
  //                     onClick={() =>
  //                       setEditingAcompanante({
  //                         index,
  //                         datos: {
  //                           nombre: v.nombre,
  //                           apellido: v.apellido,
  //                           dni: v.dni,
  //                           telefono: v.telefono,
  //                           foto_documento: v.foto_documento,
  //                           id_visitante: v.id_visitante,
  //                         },
  //                       })
  //                     }
  //                   >
  //                     <IconEdit size={12} />
  //                     Editar
  //                   </Boton>
  //                   <BotonIcono
  //                     etiqueta="Eliminar acompañante"
  //                     color="rojo"
  //                     onClick={() => ctrl.eliminarVisitante(index)}
  //                     disabled={confirmando}
  //                   >
  //                     <IconTrash size={16} />
  //                   </BotonIcono>
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       </div>
  //     )}
  //   </>
  // );

  // const listaVehiculosAcompanantes = (
  //   <>
  //     {/* Sección Vehículos Acompañantes */}
  //     {ctrl.vehiculos.length > 0 && (
  //       <div className="space-y-3">
  //         <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
  //           Vehículos Acompañantes ({ctrl.vehiculos.length})
  //         </p>
  //         <div className="flex flex-col gap-3">
  //           {ctrl.vehiculos.map((v) => {
  //             const ocupantesDeVeh = ctrl.visitantes.filter(
  //               (vis) => vis.id_visita_vehiculo === v.id,
  //             );
  //             const fotosLocalesVeh = v.archivos ?? [];
  //             const fotosExistentesVeh = Array.isArray(v.url_foto)
  //               ? v.url_foto
  //               : v.url_foto
  //                 ? [String(v.url_foto)]
  //                 : [];
  //             const totalFotosVeh =
  //               fotosLocalesVeh.length + fotosExistentesVeh.length;
  //             return (
  //               <div
  //                 key={v.id}
  //                 className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
  //               >
  //                 <div className="flex flex-col gap-2 border-b border-zinc-800/80 pb-2 sm:flex-row sm:items-center sm:justify-between">
  //                   <div className="flex flex-wrap items-center gap-2">
  //                     <IconTruck className="h-5 w-5 shrink-0 text-indigo-400" />
  //                     <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-100">
  //                       Placa: {v.placa}
  //                     </span>
  //                     <Insignia color="indigo">
  //                       {ocupantesDeVeh.length} ocupante(s)
  //                     </Insignia>
  //                     {totalFotosVeh > 0 ? (
  //                       <Boton
  //                         variante="fantasma"
  //                         tamano="sm"
  //                         className="px-2 py-2"
  //                         onClick={() =>
  //                           setVisualizarFotos({
  //                             title: `Fotos del Vehículo ${v.placa}`,
  //                             fotosNuevas: fotosLocalesVeh,
  //                             fotosExistentes: fotosExistentesVeh,
  //                           })
  //                         }
  //                       >
  //                         <IconPhoto size={12} />
  //                         Ver {totalFotosVeh} foto(s) vehículo
  //                       </Boton>
  //                     ) : (
  //                       <span className="text-xs italic text-zinc-600">
  //                         Sin fotos
  //                       </span>
  //                     )}
  //                     <Boton
  //                       variante="fantasma"
  //                       tamano="sm"
  //                       className="px-2 py-2"
  //                       onClick={() =>
  //                         setEditingVehiculo({
  //                           id: v.id,
  //                           datos: {
  //                             placa: v.placa,
  //                             fotos: v.archivos,
  //                             cantidadPersonas:
  //                               v.cantidad_personas ?? ocupantesDeVeh.length,
  //                           },
  //                         })
  //                       }
  //                     >
  //                       <IconEdit size={12} />
  //                       Editar
  //                     </Boton>
  //                   </div>
  //                   <BotonIcono
  //                     etiqueta="Eliminar vehículo acompañante"
  //                     color="rojo"
  //                     onClick={() => ctrl.eliminarVehiculo(v.id)}
  //                     disabled={ctrl.loadingVehiculo || confirmando}
  //                   >
  //                     <IconTrash size={16} />
  //                   </BotonIcono>
  //                 </div>

  //                 {ocupantesDeVeh.length > 0 ? (
  //                   <div className="space-y-2 pl-2">
  //                     {ocupantesDeVeh.map((oc, slotIdx) => {
  //                       const idxOriginal = ctrl.visitantes.findIndex(
  //                         (vis) => vis === oc,
  //                       );
  //                       const tieneDatos = Boolean(
  //                         oc.nombre && oc.nombre.trim(),
  //                       );
  //                       return (
  //                         <div
  //                           key={`veh-${v.id}-${idxOriginal}`}
  //                           className="flex flex-col gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
  //                         >
  //                           {tieneDatos ? (
  //                             <div className="flex flex-wrap items-center gap-2">
  //                               <span className="text-xs font-semibold text-zinc-100">
  //                                 {oc.nombre} {oc.apellido ?? ""}
  //                               </span>
  //                               {oc.dni && (
  //                                 <span className="text-xs text-zinc-500">
  //                                   ({oc.dni})
  //                                 </span>
  //                               )}
  //                               {oc.es_conductor ? (
  //                                 <Insignia color="indigo">
  //                                   Conductor Vehículo
  //                                 </Insignia>
  //                               ) : (
  //                                 <Insignia color="zinc">Acompañante</Insignia>
  //                               )}
  //                               {Boolean(oc.foto_documento?.length) ||
  //                               Boolean(oc.foto_documento_existente) ? (
  //                                 <Boton
  //                                   variante="fantasma"
  //                                   tamano="sm"
  //                                   className="px-2 py-2"
  //                                   onClick={() =>
  //                                     setVisualizarFotos({
  //                                       title: `Fotos de ${oc.nombre}`,
  //                                       fotosNuevas: oc.foto_documento,
  //                                       fotosExistentes:
  //                                         typeof oc.foto_documento_existente ===
  //                                         "string"
  //                                           ? [oc.foto_documento_existente]
  //                                           : Array.isArray(
  //                                               oc.foto_documento_existente,
  //                                             )
  //                                             ? oc.foto_documento_existente
  //                                             : [],
  //                                     })
  //                                   }
  //                                 >
  //                                   <IconPhoto size={12} />
  //                                   {(oc.foto_documento?.length ?? 0) +
  //                                     (oc.foto_documento_existente ? 1 : 0)}{" "}
  //                                   foto(s)
  //                                 </Boton>
  //                               ) : null}
  //                             </div>
  //                           ) : (
  //                             <div className="flex flex-wrap items-center gap-2">
  //                               <Insignia color="ambar">
  //                                 Ocupante {letraPosicion(slotIdx)}
  //                               </Insignia>
  //                               <span className="text-xs text-zinc-500">
  //                                 Sin datos completados
  //                               </span>
  //                             </div>
  //                           )}

  //                           <div className="flex items-center justify-end gap-1">
  //                             <Boton
  //                               variante="fantasma"
  //                               tamano="sm"
  //                               className="px-2 py-2"
  //                               onClick={() =>
  //                                 setEditingSlot({
  //                                   index: idxOriginal,
  //                                   vehiculoPlaca: v.placa,
  //                                   slotNum: slotIdx + 1,
  //                                   datos: {
  //                                     nombre: oc.nombre,
  //                                     apellido: oc.apellido,
  //                                     dni: oc.dni,
  //                                     telefono: oc.telefono,
  //                                     es_conductor: oc.es_conductor,
  //                                     foto_documento: oc.foto_documento,
  //                                   },
  //                                 })
  //                               }
  //                             >
  //                               {tieneDatos ? (
  //                                 <IconEdit size={12} />
  //                               ) : (
  //                                 <IconUserPlus size={12} />
  //                               )}
  //                               {tieneDatos ? "Editar" : "Completar Datos"}
  //                             </Boton>
  //                             <BotonIcono
  //                               etiqueta="Eliminar ocupante"
  //                               color="rojo"
  //                               onClick={() => ctrl.eliminarVisitante(idxOriginal)}
  //                               disabled={confirmando}
  //                             >
  //                               <IconX size={14} />
  //                             </BotonIcono>
  //                           </div>
  //                         </div>
  //                       );
  //                     })}
  //                   </div>
  //                 ) : (
  //                   <p className="text-xs italic text-zinc-500">
  //                     Sin ocupantes registrados para este vehículo.
  //                   </p>
  //                 )}
  //               </div>
  //             );
  //           })}
  //         </div>
  //       </div>
  //     )}
  //   </>
  // );

  /* --------------------------------------------------------------------- */
  /* Wizard móvil                                                          */
  /* --------------------------------------------------------------------- */

  const headerWizard = (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PASOS_WIZARD.length}
        aria-valuenow={paso + 1}
        aria-label="Avance del formulario"
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${((paso + 1) / PASOS_WIZARD.length) * 100}%` }}
        />
      </div>

      <div className="flex gap-1">
        {PASOS_WIZARD.map((p, indice) => {
          const activo = indice === paso;
          const completado = indice < paso;
          return (
            <button
              key={p.titulo}
              type="button"
              onClick={() => irAPaso(indice)}
              className="min-w-0 flex-1"
              aria-current={activo ? "step" : undefined}
            >
              <div
                className={`flex items-center justify-center gap-1 rounded-md border px-1 py-1.5 transition-colors ${
                  activo
                    ? "border-indigo-500/60 bg-indigo-500/10"
                    : "border-zinc-800 bg-zinc-950/40"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    completado
                      ? "bg-emerald-500/20 text-emerald-300"
                      : activo
                        ? "bg-indigo-500 text-white"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {completado ? <IconCheck size={10} /> : indice + 1}
                </span>
                <span
                  className={`truncate text-xs font-bold ${
                    activo ? "text-indigo-200" : "text-zinc-400"
                  }`}
                >
                  {p.titulo}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const contenidoPaso = (
    <>
      {paso === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campoEmpresaTransporte}
          {campoConductor}
        </div>
      )}

      {paso === 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campoVehiculo}
          {campoTipoVehiculo}
          {campoVehiculoCarreta}
          {campoEstadoIngreso}
        </div>
      )}

      {paso === 2 && <div className="space-y-4">{bloqueGuias}</div>}

      {paso === 3 && (
        <div className="space-y-4">
          {bloqueObservacion}
          {bloqueEvidencias}
          {/* {separadorAcompanantes} */}
          {/* {botonesAcompanantes} */}
          {/* {listaAcompanantes} */}
          {/* {listaVehiculosAcompanantes} */}
        </div>
      )}
    </>
  );

  /**
   * Pie fijo del modal.
   *
   * En móvil los botones de navegación viven fuera del `<form>` (el panel
   * tiene su propia zona de scroll): el atributo `form` los enlaza al
   * formulario para conservar el envío por Enter y la validación del wizard.
   */
  const pieModal = esCompacto ? (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Boton
          variante="fantasma"
          onClick={onClose}
          disabled={confirmando}
          className="px-2 text-zinc-400 hover:text-white"
        >
          Cancelar
        </Boton>
        <Boton
          variante="secundario"
          onClick={retrocederPaso}
          disabled={paso === 0 || confirmando}
          className="px-3"
        >
          <IconChevronLeft size={16} />
          Anterior
        </Boton>
      </div>

      {paso < PASOS_WIZARD.length - 1 ? (
        <Boton
          type="submit"
          form="wizard-confirmacion"
          variante="primario"
          className="px-5"
        >
          Siguiente
          <IconChevronRight size={16} />
        </Boton>
      ) : (
        <Boton
          type="submit"
          form="wizard-confirmacion"
          variante="primario"
          cargando={confirmando}
          className="px-5"
        >
          <IconCheck size={16} />
          {programacion ? "Confirmar" : "Registrar"}
        </Boton>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-end gap-2">
      <Boton
        variante="fantasma"
        onClick={onClose}
        disabled={confirmando}
        className="px-3 text-zinc-400 hover:text-white"
      >
        Cancelar
      </Boton>
      <Boton
        variante="primario"
        cargando={confirmando}
        onClick={() => void handleConfirmar()}
        className="px-6"
      >
        <IconCheck size={16} />
        {programacion ? "Confirmar Programación" : "Registrar Recepción"}
      </Boton>
    </div>
  );

  return (
    <ModalTsx
      opened={opened}
      onClose={onClose}
      title={
        programacion
          ? "Confirmar Programación"
          : "Registrar Recepción de Unidad"
      }
      ancho="xl"
      validateClose
      compacto
      footer={pieModal}
    >
      {esCompacto ? (
        <form
          id="wizard-confirmacion"
          onSubmit={handleSubmitWizard}
          onKeyDown={handleKeyDownWizard}
          className="flex flex-col gap-4"
        >
          {headerWizard}
          {contenidoPaso}
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Datos de la unidad y el transporte */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campoEmpresaTransporte}
            {campoConductor}
            {campoVehiculo}
            {campoTipoVehiculo}
            {campoVehiculoCarreta}
            {campoEstadoIngreso}
          </div>

          {/* Guías de la carga */}
          {bloqueGuias}

          {/* Observación */}
          {bloqueObservacion}

          {/* Evidencias */}
          {bloqueEvidencias}

          {/* {separadorAcompanantes} */}

          {/* {botonesAcompanantes} */}

          {/* {listaAcompanantes} */}

          {/* {listaVehiculosAcompanantes} */}
        </div>
      )}

      {/* Modales secundarios */}
      <AgregarAcompananteModal
        opened={openModalAcompanante || Boolean(editingAcompanante)}
        datosIniciales={editingAcompanante?.datos}
        onClose={() => {
          setOpenModalAcompanante(false);
          setEditingAcompanante(null);
        }}
        onGuardar={(datos) => {
          if (editingAcompanante !== null) {
            ctrl.setVisitante(editingAcompanante.index, datos);
            setEditingAcompanante(null);
          } else {
            ctrl.agregarAcompananteUnidad(datos);
          }
        }}
      />

      <AgregarVehiculoModal
        opened={openModalVehiculo || Boolean(editingVehiculo)}
        datosIniciales={editingVehiculo?.datos}
        onClose={() => {
          setOpenModalVehiculo(false);
          setEditingVehiculo(null);
        }}
        onGuardar={(placa, fotos, cantidadPersonas) => {
          if (editingVehiculo !== null) {
            ctrl.editarVehiculoConSlots(
              editingVehiculo.id,
              placa,
              fotos,
              cantidadPersonas,
            );
            setEditingVehiculo(null);
          } else {
            ctrl.agregarVehiculoConSlots(placa, fotos, cantidadPersonas);
          }
        }}
      />

      <RegistrarOcupanteModal
        opened={Boolean(editingSlot)}
        placaVehiculo={editingSlot?.vehiculoPlaca}
        numeroSlot={editingSlot?.slotNum}
        datosIniciales={editingSlot?.datos}
        onClose={() => setEditingSlot(null)}
        onGuardar={(datos) => {
          if (editingSlot !== null) {
            ctrl.setVisitante(editingSlot.index, datos);
          }
        }}
      />

      <VerFotosModal
        opened={Boolean(visualizarFotos)}
        title={visualizarFotos?.title}
        fotosNuevas={visualizarFotos?.fotosNuevas}
        fotosExistentes={visualizarFotos?.fotosExistentes}
        onClose={() => setVisualizarFotos(null)}
      />

      {/* Modal: Registro de Nuevo Conductor */}
      <ModalEstandar
        opened={openConductorModal}
        close={() => setOpenConductorModal(false)}
        title="Registrar Nuevo Conductor"
        size="md"
        validateClose
      >
        <RegistroConductor
          onCancel={() => setOpenConductorModal(false)}
          onSuccess={(c) => {
            ctrl.handleConductorCreado(c);
            setOpenConductorModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Registro Rápido de Vehículo */}
      <ModalEstandar
        opened={openVehiculoSimpleModal}
        close={() => setOpenVehiculoSimpleModal(false)}
        title="Registrar Nuevo Vehículo"
        size="md"
        validateClose
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={
            ctrl.programacion?.id_empresa_transporte ??
            ctrl.idEmpresaTransporteEditado ??
            null
          }
          idTipoVehiculo={
            ctrl.programacion?.id_tipo_vehiculo ??
            ctrl.idTipoVehiculoEditado ??
            null
          }
          onCancel={() => setOpenVehiculoSimpleModal(false)}
          onSuccess={(v) => {
            ctrl.handleVehiculoCreado(v);
            if (!ctrl.programacion?.id_vehiculo) {
              ctrl.setIdVehiculoEditado(v.id_vehiculo);
            }
            setOpenVehiculoSimpleModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Registro Rápido de Tipo de Vehículo */}
      <ModalEstandar
        opened={openTipoVehiculoModal}
        close={() => setOpenTipoVehiculoModal(false)}
        title="Registrar Nuevo Tipo de Vehículo"
        size="md"
        validateClose
      >
        <RegistroTipoVehiculoSimple
          onCancel={() => setOpenTipoVehiculoModal(false)}
          onSuccess={(tv) => {
            ctrl.handleTipoVehiculoCreado(tv.id_tipo_vehiculo);
            setOpenTipoVehiculoModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Registro Rápido de Empresa de Transporte */}
      <ModalEstandar
        opened={openEmpresaModal}
        close={() => setOpenEmpresaModal(false)}
        title="Nueva Empresa de Transporte"
        size="lg"
        validateClose
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenEmpresaModal(false)}
          onSuccess={(e) => {
            ctrl.handleEmpresaCreada(e);
            setOpenEmpresaModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Registro Rápido de Proveedor Minero */}
      <ModalEstandar
        opened={openProveedorModal}
        close={() => setOpenProveedorModal(false)}
        title="Nuevo Proveedor Minero"
        size="md"
        validateClose
      >
        <RegistroProveedorMineroSimple
          onCancel={() => setOpenProveedorModal(false)}
          onSuccess={(p) => {
            ctrl.handleProveedorCreado(p);
            ctrl.setProveedoresSeleccionados([
              ...ctrl.proveedoresSeleccionados,
              p.id_proveedor,
            ]);
            setOpenProveedorModal(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Registro Rápido de Vehículo Carreta */}
      <ModalEstandar
        opened={openCarretaModal}
        close={() => setOpenCarretaModal(false)}
        title="Registrar Vehículo Carreta"
        size="md"
        validateClose
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={
            ctrl.programacion?.id_empresa_transporte ??
            ctrl.idEmpresaTransporteEditado ??
            null
          }
          idTipoVehiculo={idTipoVehiculoCarreta}
          onCancel={() => setOpenCarretaModal(false)}
          onSuccess={(v) => {
            ctrl.handleCarretaCreada(v);
            setOpenCarretaModal(false);
          }}
        />
      </ModalEstandar>
    </ModalTsx>
  );
};
