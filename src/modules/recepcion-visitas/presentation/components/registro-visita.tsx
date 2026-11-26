import { useEffect, useState } from "react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceFloppy,
  IconExclamationCircle,
  IconTrash,
  IconEdit,
  IconUserPlus,
  IconTruck,
  IconUserCheck,
  IconPhoto,
  IconPlus,
} from "@tabler/icons-react";
import { useRegistroVisita, type VisitanteFormItem } from "../../hooks/useRegistroVisita";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  AreaTexto,
  Aviso,
  Boton,
  BotonIcono,
  CampoNumero,
  CampoSeleccion,
  CampoTexto,
  Cargador,
  Insignia,
} from "../../../../presentation/utils/ui-tsx";
import { SelectVisitante } from "../../../../presentation/utils/select-visitante";
import { RegistroMotivoIngreso } from "../../../../presentation/utils/registro-motivo-ingreso";
import { ListaArchivosSimple } from "../../../../presentation/utils/archivo/lista-archivos-simple";
import { useNotify } from "../../../../hooks/useNotify";
import { useDispositivo } from "../../../../hooks/useDispositivo";
import { useRecepcionVisitasContextStore } from "../../stores/recepcion-visitas-context.store";
import type { RecepcionVisitaResponse } from "../../service/recepcion-visitas.responses";

interface Props {
  /** El modal (con todo su contenido) se monta solo cuando está abierto. */
  opened: boolean;
  onCancel: () => void;
  onSuccess: (r: RecepcionVisitaResponse) => void;
}

/** El botón de enviar vive en el `footer` del modal (fuera del <form>), por eso
 *  se asocia al formulario por id en vez de anidarse dentro de él. */
const ID_FORMULARIO = "form-registro-visita";

/**
 * Pasos del formulario en vista compacta (móvil o pantalla < 640px).
 *
 * El escritorio mantiene el layout de una sola página; en planta el vigilante
 * registra la visita desde el celular, donde el formulario completo satura la
 * pantalla y obliga a hacer scroll infinito.
 */
const PASOS_VISITA = [
  { titulo: "Motivo y Personal", descripcion: "Motivo de ingreso y persona que autoriza" },
  { titulo: "Observación y Evidencias", descripcion: "Observación y fotografías de respaldo" },
  { titulo: "Acompañantes y Vehículos", descripcion: "Visitantes y vehículos acompañantes" },
] as const;

const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const RegistroVisita = ({ opened, onCancel, onSuccess }: Props) => {
  const {
    payload,
    handleChange,
    vehiculos,
    visitantes,
    setVisitantes,
    evidencias,
    setEvidencias,
    loadingVehiculo,
    agregarVehiculoConSlots,
    editarVehiculoConSlots,
    eliminarVehiculo,
    marcarConductorVehiculo,
    handleAgregarVisitanteIndividual,
    handleActualizarVisitante,
    handleRemoverVisitante,
    submit,
    loading,
    error,
    empleados,
    motivos,
    loadingCatalogos,
    handleMotivoCreado,
  } = useRegistroVisita(onSuccess);

  // Sub-modales
  const [openModalMotivo, setOpenModalMotivo] = useState(false);
  const [openModalVehiculo, setOpenModalVehiculo] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<{
    id: number;
    datos: { placa: string; fotos?: File[]; cantidadPersonas: number };
  } | null>(null);

  const [openModalAcompanante, setOpenModalAcompanante] = useState(false);
  const [editingAcompanante, setEditingAcompanante] = useState<{
    index: number;
    datos: {
      nombre: string;
      apellido: string;
      dni: string;
      telefono: string;
      foto_documento: File[];
    };
  } | null>(null);

  const [visualizarFotos, setVisualizarFotos] = useState<{
    title: string;
    fotosNuevas?: File[];
    fotosExistentes?: string[];
  } | null>(null);

  // Form local para nuevo vehículo
  const [formVehiculo, setFormVehiculo] = useState<{
    placa: string;
    cantidadPersonas: number;
    fotos: File[];
  }>({
    placa: "",
    cantidadPersonas: 1,
    fotos: [],
  });

  // Form local para visitante / acompañante
  const [visitorForm, setVisitorForm] = useState<{
    id_visitante?: number;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    fotos_documento: File[];
  }>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    fotos_documento: [],
  });

  const [visitorError, setVisitorError] = useState<string | null>(null);

  const { notifyError } = useNotify();
  const { esCompacto } = useDispositivo();

  // Wizard de vista compacta: el formulario largo se recorre por pasos.
  const [paso, setPaso] = useState(0);
  const [abiertoAnterior, setAbiertoAnterior] = useState(opened);

  // Cada apertura del modal arranca en el primer paso del wizard.
  // Se ajusta durante el render (no en un efecto) para evitar renders
  // en cascada: sólo cambia cuando el estado de `opened` cambia.
  if (opened !== abiertoAnterior) {
    setAbiertoAnterior(opened);
    if (opened) setPaso(0);
  }

  const setFormEnCurso = useRecepcionVisitasContextStore(
    (s) => s.setFormEnCurso,
  );

  useEffect(() => {
    const motivo =
      motivos.find((m) => m.id_motivo_ingreso === payload.id_motivo_ingreso)
        ?.nombre ?? null;
    const empleado =
      empleados.find((e) => e.id_empleado === payload.id_empleado_contacto)
        ?.nombre_completo ?? null;

    setFormEnCurso({
      motivo_ingreso: motivo,
      empleado_contacto: empleado,
      observacion: payload.observacion ?? "",
      total_visitantes_en_formulario: visitantes.length,
      visitante_en_edicion: openModalAcompanante
        ? {
            dni: visitorForm.dni,
            nombre: visitorForm.nombre,
            apellido: visitorForm.apellido,
            telefono: visitorForm.telefono,
            total_fotos: visitorForm.fotos_documento.length,
          }
        : null,
      vehiculo_en_edicion: openModalVehiculo
        ? {
            placa: formVehiculo.placa,
            cantidad_personas: formVehiculo.cantidadPersonas,
            total_fotos: formVehiculo.fotos.length,
          }
        : null,
    });
  }, [
    payload.id_motivo_ingreso,
    payload.id_empleado_contacto,
    payload.observacion,
    visitantes.length,
    openModalAcompanante,
    visitorForm,
    openModalVehiculo,
    formVehiculo,
    motivos,
    empleados,
    setFormEnCurso,
  ]);

  const getEmpleadosDropdown = () =>
    empleados.map((e) => ({
      value: String(e.id_empleado),
      label: e.nombre_completo,
    }));

  const getMotivosDropdown = () =>
    motivos.map((m) => ({
      value: String(m.id_motivo_ingreso),
      label: m.nombre,
    }));

  // Guardar vehículo acompañante (crear o editar)
  const handleSaveVehiculo = async () => {
    if (!formVehiculo.placa.trim()) {
      setVisitorError("Debe ingresar la placa del vehículo.");
      return;
    }
    if (editingVehiculo) {
      const ok = await editarVehiculoConSlots(
        editingVehiculo.id,
        formVehiculo.placa,
        formVehiculo.fotos,
        formVehiculo.cantidadPersonas,
      );
      if (ok) {
        setEditingVehiculo(null);
        setOpenModalVehiculo(false);
      }
    } else {
      const ok = await agregarVehiculoConSlots(
        formVehiculo.placa,
        formVehiculo.fotos,
        formVehiculo.cantidadPersonas,
      );
      if (ok) {
        setFormVehiculo({ placa: "", cantidadPersonas: 1, fotos: [] });
        setOpenModalVehiculo(false);
      }
    }
  };

  // Guardar visitante individual o slot de vehículo
  const handleSaveVisitor = () => {
    setVisitorError(null);

    const nombreFinal = visitorForm.nombre.trim() || "VISITANTE";
    const apellidoFinal = visitorForm.apellido.trim();

    if (editingAcompanante !== null) {
      const actual = visitantes[editingAcompanante.index];
      const actualizado: VisitanteFormItem = {
        ...actual,
        id_visitante: visitorForm.id_visitante,
        nombre: nombreFinal,
        apellido: apellidoFinal,
        dni: visitorForm.dni,
        telefono: visitorForm.telefono,
        foto_documento: visitorForm.fotos_documento,
      };
      const ok = handleActualizarVisitante(editingAcompanante.index, actualizado);
      if (ok) {
        setEditingAcompanante(null);
        setOpenModalAcompanante(false);
      }
    } else {
      const nuevo: VisitanteFormItem = {
        id_visitante: visitorForm.id_visitante,
        nombre: nombreFinal,
        apellido: apellidoFinal,
        dni: visitorForm.dni,
        telefono: visitorForm.telefono,
        foto_documento: visitorForm.fotos_documento,
        es_conductor: false,
      };
      const ok = handleAgregarVisitanteIndividual(nuevo);
      if (ok) {
        setVisitorForm({ dni: "", nombre: "", apellido: "", telefono: "", fotos_documento: [] });
        setOpenModalAcompanante(false);
      }
    }
  };

  const visitantesPeatonales = visitantes.filter((v) => !v.id_visita_vehiculo);

  /**
   * El operador puede moverse libremente entre pasos: los campos se
   * validan al confirmar, no al avanzar.
   */
  const avanzarPaso = () => {
    if (paso < PASOS_VISITA.length - 1) setPaso(paso + 1);
  };

  const retrocederPaso = () => {
    if (paso > 0) setPaso(paso - 1);
  };

  const irAPaso = (destino: number) => {
    if (destino === paso) return;
    setPaso(destino);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // En vista compacta el botón "Siguiente" es un submit de este mismo
    // formulario: el submit avanza de paso en vez de registrar la visita.
    if (esCompacto && paso < PASOS_VISITA.length - 1) {
      avanzarPaso();
      return;
    }
    if (visitantes.length === 0 && vehiculos.length === 0) {
      notifyError("Debes agregar al menos un visitante o un vehículo acompañante.");
      return;
    }
    submit(e);
  };

  const cargarPlaca = (valor: string) => {
    setFormVehiculo((prev) => ({ ...prev, placa: formatPlaca(valor) }));
  };

  const cargarCantidadPersonas = (valor: string) => {
    const parsed = Number.parseInt(valor, 10);
    const cantidad = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setFormVehiculo((prev) => ({ ...prev, cantidadPersonas: cantidad }));
  };

  /* --------------------------------------------------------------------- */
  /* Bloques del formulario (compartidos por escritorio y vista compacta)   */
  /* --------------------------------------------------------------------- */

  const bloqueMotivo = (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <CampoSeleccion
          label="Motivo Visita"
          placeholder={
            loadingCatalogos ? "Cargando..." : "Elija una opción..."
          }
          requerido
          deshabilitado={loadingCatalogos}
          valor={
            payload.id_motivo_ingreso ? String(payload.id_motivo_ingreso) : null
          }
          onChange={(valor) =>
            handleChange("id_motivo_ingreso", valor ? Number(valor) : 0)
          }
          opciones={getMotivosDropdown()}
        />
      </div>
      {loadingCatalogos ? (
        <span className="pb-2.5 text-zinc-400">
          <Cargador tamano={16} />
        </span>
      ) : null}
      <BotonIcono
        color="zinc"
        etiqueta="Registrar nuevo motivo de ingreso"
        onClick={() => setOpenModalMotivo(true)}
        className="mb-0.5 h-10! w-10! shrink-0 bg-zinc-800! text-zinc-300! border! border-zinc-700! hover:bg-zinc-700!"
      >
        <IconPlus size={18} />
      </BotonIcono>
    </div>
  );

  const bloquePersonal = (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <CampoSeleccion
          label="Personal Contacto (Persona que Autoriza)"
          placeholder={
            loadingCatalogos ? "Cargando..." : "Elija una opción..."
          }
          requerido
          deshabilitado={loadingCatalogos}
          valor={
            payload.id_empleado_contacto
              ? String(payload.id_empleado_contacto)
              : null
          }
          onChange={(valor) =>
            handleChange("id_empleado_contacto", valor ? Number(valor) : 0)
          }
          opciones={getEmpleadosDropdown()}
        />
      </div>
      {loadingCatalogos ? (
        <span className="pb-2.5 text-zinc-400">
          <Cargador tamano={16} />
        </span>
      ) : null}
    </div>
  );

  const bloqueObservacion = (
    <AreaTexto
      label="Observación"
      placeholder="Escriba alguna observación adicional sobre el ingreso..."
      rows={3}
      value={payload.observacion || ""}
      onChange={(e) => handleChange("observacion", e.target.value)}
    />
  );

  const bloqueEvidencias = (
    <ListaArchivosSimple
      archivos={evidencias}
      onFilesChange={setEvidencias}
      label="Evidencias de Ingreso"
    />
  );

  const bloqueAcompanantes = (
    <div className="flex flex-col gap-4 pt-2">
      {/* Sección: Acompañantes y Vehículos de la Visita */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative bg-zinc-950 px-4 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
          ACOMPAÑANTES Y VEHÍCULOS DE LA VISITA
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Boton
          variante="secundario"
          onClick={() => {
            setVisitorForm({
              dni: "",
              nombre: "",
              apellido: "",
              telefono: "",
              fotos_documento: [],
            });
            setEditingAcompanante(null);
            setVisitorError(null);
            setOpenModalAcompanante(true);
          }}
          disabled={loading}
          className="w-full shadow-sm sm:w-auto"
        >
          <IconUserPlus size={18} className="text-indigo-400" />
          Agregar Visitante
        </Boton>

        <Boton
          variante="secundario"
          onClick={() => {
            setFormVehiculo({ placa: "", cantidadPersonas: 1, fotos: [] });
            setEditingVehiculo(null);
            setVisitorError(null);
            setOpenModalVehiculo(true);
          }}
          disabled={loading}
          className="w-full shadow-sm sm:w-auto"
        >
          <IconTruck size={18} className="text-indigo-400" />
          Agregar Vehículo Acompañante
        </Boton>
      </div>

      {/* Lista de Visitantes Peatonales */}
      {visitantesPeatonales.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Visitantes Peatonales / Individuales (
            {visitantesPeatonales.length})
          </p>
          <div className="flex flex-col gap-2">
            {visitantes.map((v, index) => {
              if (v.id_visita_vehiculo) return null;
              return (
                <div
                  key={`peatonal-${index}`}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <IconUserCheck className="w-5 h-5 shrink-0 text-indigo-400" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-100">
                          {v.nombre} {v.apellido ?? ""}
                        </span>
                        <Insignia color="indigo">Peatonal</Insignia>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {v.dni ? `DNI: ${v.dni}` : "Sin DNI"}{" "}
                        {v.telefono ? `• Tel: ${v.telefono}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                    {(v.foto_documento?.length ?? 0) > 0 ? (
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        onClick={() =>
                          setVisualizarFotos({
                            title: `Fotos de ${v.nombre}`,
                            fotosNuevas: v.foto_documento,
                          })
                        }
                        className="text-sky-300! hover:bg-sky-500/10! py-2.5! sm:py-1.5!"
                      >
                        <IconPhoto size={12} />
                        Ver {v.foto_documento.length} foto(s)
                      </Boton>
                    ) : (
                      <span className="text-xs italic text-zinc-600">
                        Sin fotos
                      </span>
                    )}
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      onClick={() => {
                        setEditingAcompanante({
                          index,
                          datos: {
                            nombre: v.nombre,
                            apellido: v.apellido,
                            dni: v.dni,
                            telefono: v.telefono,
                            foto_documento: v.foto_documento,
                          },
                        });
                        setVisitorForm({
                          id_visitante: v.id_visitante,
                          nombre: v.nombre,
                          apellido: v.apellido,
                          dni: v.dni,
                          telefono: v.telefono,
                          fotos_documento: v.foto_documento,
                        });
                        setOpenModalAcompanante(true);
                      }}
                      className="text-indigo-300! hover:bg-indigo-500/10! py-2.5! sm:py-1.5!"
                    >
                      <IconEdit size={12} />
                      Editar
                    </Boton>
                    <BotonIcono
                      color="rojo"
                      etiqueta="Eliminar visitante"
                      onClick={() => handleRemoverVisitante(index)}
                      disabled={loading}
                    >
                      <IconTrash size={16} />
                    </BotonIcono>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Lista de Vehículos Acompañantes y sus Ocupantes */}
      {vehiculos.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Vehículos Acompañantes ({vehiculos.length})
          </p>
          <div className="flex flex-col gap-2">
            {vehiculos.map((v) => {
              const ocupantesDeVeh = visitantes.filter(
                (vis) => vis.id_visita_vehiculo === v.id,
              );
              const fotosLocalesVeh = v.archivos ?? [];
              const totalFotosVeh = fotosLocalesVeh.length;
              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-2 border-b border-zinc-800/80 pb-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <IconTruck className="w-5 h-5 text-indigo-400" />
                      <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-100">
                        Placa: {v.placa}
                      </span>
                      <Insignia color="indigo">
                        {ocupantesDeVeh.length} ocupante(s)
                      </Insignia>
                      {totalFotosVeh > 0 ? (
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          onClick={() =>
                            setVisualizarFotos({
                              title: `Fotos del Vehículo ${v.placa}`,
                              fotosNuevas: fotosLocalesVeh,
                            })
                          }
                          className="text-sky-300! hover:bg-sky-500/10! py-2.5! sm:py-1.5!"
                        >
                          <IconPhoto size={12} />
                          Ver {totalFotosVeh} foto(s) vehículo
                        </Boton>
                      ) : (
                        <span className="text-xs italic text-zinc-600">
                          Sin fotos
                        </span>
                      )}
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => {
                          setEditingVehiculo({
                            id: v.id,
                            datos: {
                              placa: v.placa,
                              fotos: v.archivos,
                              cantidadPersonas:
                                v.cantidad_personas ??
                                ocupantesDeVeh.length,
                            },
                          });
                          setFormVehiculo({
                            placa: v.placa,
                            cantidadPersonas:
                              v.cantidad_personas ??
                              ocupantesDeVeh.length,
                            fotos: v.archivos ?? [],
                          });
                          setOpenModalVehiculo(true);
                        }}
                        className="text-indigo-300! hover:bg-indigo-500/10! py-2.5! sm:py-1.5!"
                      >
                        <IconEdit size={12} />
                        Editar
                      </Boton>
                    </div>
                    <BotonIcono
                      color="rojo"
                      etiqueta="Eliminar vehículo"
                      onClick={() => eliminarVehiculo(v.id)}
                      disabled={loadingVehiculo || loading}
                    >
                      <IconTrash size={16} />
                    </BotonIcono>
                  </div>

                  {ocupantesDeVeh.length > 0 ? (
                    <div className="flex flex-col gap-2 pl-2">
                      {ocupantesDeVeh.map((oc, slotIdx) => {
                        const idxOriginal = visitantes.findIndex(
                          (vis) => vis === oc,
                        );
                        const tieneDatos = Boolean(
                          oc.nombre && oc.nombre.trim(),
                        );
                        return (
                          <div
                            key={`veh-${v.id}-${idxOriginal}`}
                            className="flex flex-col gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/60 p-2 px-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            {tieneDatos ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-semibold text-zinc-100">
                                  {oc.nombre} {oc.apellido ?? ""}
                                </span>
                                {oc.dni ? (
                                  <span className="text-xs text-zinc-500">
                                    ({oc.dni})
                                  </span>
                                ) : null}
                                {oc.es_conductor ? (
                                  <Insignia color="indigo">
                                    Conductor Vehículo
                                  </Insignia>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      marcarConductorVehiculo(
                                        v.id,
                                        idxOriginal,
                                      )
                                    }
                                    className="inline-flex items-center rounded-md border border-zinc-600/40 bg-zinc-700/40 px-1.5 text-xs font-bold uppercase tracking-wide text-zinc-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-300 py-2.5! sm:py-0.5!"
                                  >
                                    Hacer Conductor
                                  </button>
                                )}
                                {(oc.foto_documento?.length ?? 0) > 0 ? (
                                  <Boton
                                    variante="fantasma"
                                    tamano="sm"
                                    onClick={() =>
                                      setVisualizarFotos({
                                        title: `Fotos de ${oc.nombre}`,
                                        fotosNuevas: oc.foto_documento,
                                      })
                                    }
                                    className="text-sky-300! hover:bg-sky-500/10! py-2.5! sm:py-1.5!"
                                  >
                                    <IconPhoto size={12} />
                                    Ver {oc.foto_documento.length} foto(s)
                                  </Boton>
                                ) : (
                                  <span className="text-xs italic text-zinc-600">
                                    Sin foto
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Insignia color="zinc">
                                  Slot #{slotIdx + 1}
                                </Insignia>
                                <span className="text-xs italic text-zinc-500">
                                  {oc.es_conductor
                                    ? "Conductor (Sin registrar datos)"
                                    : "Acompañante sin registrar datos (no se guardará)"}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                              <Boton
                                variante="fantasma"
                                tamano="sm"
                                onClick={() => {
                                  setEditingAcompanante({
                                    index: idxOriginal,
                                    datos: {
                                      nombre: oc.nombre,
                                      apellido: oc.apellido,
                                      dni: oc.dni,
                                      telefono: oc.telefono,
                                      foto_documento: oc.foto_documento,
                                    },
                                  });
                                  setVisitorForm({
                                    id_visitante: oc.id_visitante,
                                    nombre: oc.nombre,
                                    apellido: oc.apellido,
                                    dni: oc.dni,
                                    telefono: oc.telefono,
                                    fotos_documento: oc.foto_documento,
                                  });
                                  setOpenModalAcompanante(true);
                                }}
                                className="text-indigo-300! hover:bg-indigo-500/10! py-2.5! sm:py-1.5!"
                              >
                                <IconEdit size={12} />
                                {tieneDatos ? "Editar" : "Llenar Datos"}
                              </Boton>
                              {tieneDatos ? (
                                <BotonIcono
                                  color="zinc"
                                  etiqueta="Limpiar datos del ocupante"
                                  onClick={() => {
                                    setVisitantes((prev) =>
                                      prev.map((vis, i) =>
                                        i === idxOriginal
                                          ? {
                                              ...vis,
                                              nombre: "",
                                              apellido: "",
                                              dni: "",
                                              telefono: "",
                                              foto_documento: [],
                                            }
                                          : vis,
                                      ),
                                    );
                                  }}
                                >
                                  <IconTrash size={14} />
                                </BotonIcono>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  /* --------------------------------------------------------------------- */
  /* Wizard de vista compacta                                               */
  /* --------------------------------------------------------------------- */

  const headerWizard = (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PASOS_VISITA.length}
        aria-valuenow={paso + 1}
        aria-label="Avance del formulario"
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${((paso + 1) / PASOS_VISITA.length) * 100}%` }}
        />
      </div>

      <div className="flex gap-1">
        {PASOS_VISITA.map((p, indice) => {
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
      {paso === 0 ? (
        <div className="flex flex-col gap-4">
          {bloqueMotivo}
          {bloquePersonal}
        </div>
      ) : null}

      {paso === 1 ? (
        <div className="flex flex-col gap-4">
          {bloqueObservacion}
          {bloqueEvidencias}
        </div>
      ) : null}

      {paso === 2 ? (
        <div className="flex flex-col gap-4">
          {bloqueAcompanantes}
        </div>
      ) : null}
    </>
  );

  /**
   * Pie fijo del modal.
   *
   * En vista compacta los botones de navegación viven fuera del `<form>` (el
   * panel tiene su propia zona de scroll): el atributo `form` los enlaza al
   * formulario para que "Siguiente" y "Confirmar" disparen el mismo submit.
   */
  const pieModal = esCompacto ? (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Boton
          variante="fantasma"
          onClick={onCancel}
          disabled={loading}
          className="px-2 text-zinc-400! hover:text-zinc-100!"
        >
          Cancelar
        </Boton>
        <Boton
          variante="secundario"
          onClick={retrocederPaso}
          disabled={paso === 0 || loading}
          className="px-3"
        >
          <IconChevronLeft size={16} />
          Anterior
        </Boton>
      </div>

      {paso < PASOS_VISITA.length - 1 ? (
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          variante="primario"
          className="px-5"
        >
          Siguiente
          <IconChevronRight size={16} />
        </Boton>
      ) : (
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          variante="primario"
          cargando={loading}
          disabled={visitantes.length === 0 && vehiculos.length === 0}
          className="px-5"
        >
          <IconDeviceFloppy size={18} />
          Confirmar y Registrar Visita
        </Boton>
      )}
    </div>
  ) : (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Boton
        variante="fantasma"
        onClick={onCancel}
        className="w-full text-zinc-400! hover:text-zinc-100! sm:w-auto"
      >
        Cancelar
      </Boton>
      <Boton
        type="submit"
        form={ID_FORMULARIO}
        variante="primario"
        cargando={loading}
        disabled={visitantes.length === 0 && vehiculos.length === 0}
        className="w-full sm:w-auto"
      >
        <IconDeviceFloppy size={18} />
        Confirmar y Registrar Visita
      </Boton>
    </div>
  );

  return (
    <>
      {/* Modal principal: Nuevo Registro de Visita */}
      <ModalTsx
        opened={opened}
        onClose={onCancel}
        title="Nuevo Registro de Visita"
        ancho="lg"
        validateClose
        compacto
        footer={pieModal}
      >
        <form
          id={ID_FORMULARIO}
          onSubmit={handleFormSubmit}
          className="flex flex-col gap-5"
        >
          {error ? (
            <Aviso tono="rojo">
              <span className="flex items-start gap-2">
                <IconExclamationCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </span>
            </Aviso>
          ) : null}

          {esCompacto ? (
            <>
              {headerWizard}
              {contenidoPaso}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {bloqueMotivo}
                {bloquePersonal}
                <div className="md:col-span-2">{bloqueObservacion}</div>
                <div className="md:col-span-2">{bloqueEvidencias}</div>
              </div>
              {bloqueAcompanantes}
            </>
          )}
        </form>
      </ModalTsx>

      {/* Sub-modal: Agregar / Editar Vehículo Acompañante */}
      <ModalTsx
        opened={openModalVehiculo}
        onClose={() => setOpenModalVehiculo(false)}
        title={
          editingVehiculo ? "Editar Vehículo Acompañante" : "Agregar Vehículo Acompañante"
        }
        ancho="md"
        validateClose
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Boton
              variante="fantasma"
              onClick={() => setOpenModalVehiculo(false)}
              className="w-full text-zinc-400! hover:text-zinc-100! sm:w-auto"
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              cargando={loadingVehiculo}
              onClick={handleSaveVehiculo}
              className="w-full sm:w-auto"
            >
              Guardar Vehículo
            </Boton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {visitorError ? (
            <Aviso tono="rojo">
              <span className="flex items-start gap-2">
                <IconExclamationCircle size={16} className="mt-0.5 shrink-0" />
                <span>{visitorError}</span>
              </span>
            </Aviso>
          ) : null}

          <CampoTexto
            label="Placa del Vehículo"
            placeholder="Ej. F1B-890"
            requerido
            maxLength={7}
            value={formVehiculo.placa}
            onChange={(e) => cargarPlaca(e.target.value)}
          />

          <CampoNumero
            label="Cantidad de Personas (Ocupantes)"
            placeholder="1"
            min={1}
            requerido
            value={formVehiculo.cantidadPersonas}
            onChange={(e) => cargarCantidadPersonas(e.target.value)}
          />

          <ListaArchivosSimple
            archivos={formVehiculo.fotos}
            onFilesChange={(files) =>
              setFormVehiculo((prev) => ({ ...prev, fotos: files }))
            }
            label="Fotografía del Vehículo (Opcional)"
          />
        </div>
      </ModalTsx>

      {/* Sub-modal: Agregar / Editar Visitante */}
      <ModalTsx
        opened={openModalAcompanante}
        onClose={() => setOpenModalAcompanante(false)}
        title={
          editingAcompanante !== null
            ? "Editar Datos del Visitante"
            : "Agregar Visitante"
        }
        ancho="md"
        validateClose
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Boton
              variante="fantasma"
              onClick={() => setOpenModalAcompanante(false)}
              className="w-full text-zinc-400! hover:text-zinc-100! sm:w-auto"
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={handleSaveVisitor}
              className="w-full sm:w-auto"
            >
              Guardar Datos
            </Boton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {visitorError ? (
            <Aviso tono="rojo">
              <span className="flex items-start gap-2">
                <IconExclamationCircle size={16} className="mt-0.5 shrink-0" />
                <span>{visitorError}</span>
              </span>
            </Aviso>
          ) : null}

          <SelectVisitante
            label="Visitante"
            placeholder="Buscar por nombre o DNI..."
            value={visitorForm.id_visitante ?? null}
            onChange={(v) => {
              setVisitorForm((prev) => ({
                ...prev,
                id_visitante: v.id_visitante,
                nombre: v.nombre,
                apellido: v.apellido,
                dni: v.dni,
                telefono: v.telefono ?? "",
              }));
            }}
          />

          <ListaArchivosSimple
            archivos={visitorForm.fotos_documento}
            onFilesChange={(files) =>
              setVisitorForm((prev) => ({ ...prev, fotos_documento: files }))
            }
            label="Foto del Documento de Identidad"
          />
        </div>
      </ModalTsx>

      {/* Modal: Visualizar Fotografías */}
      <ModalTsx
        opened={!!visualizarFotos}
        onClose={() => setVisualizarFotos(null)}
        title={visualizarFotos?.title || "Fotografías Adjuntas"}
        ancho="md"
        footer={
          <div className="flex justify-end">
            <Boton
              variante="fantasma"
              onClick={() => setVisualizarFotos(null)}
              className="w-full text-zinc-400! hover:text-zinc-100! sm:w-auto"
            >
              Cerrar
            </Boton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {visualizarFotos?.fotosNuevas && visualizarFotos.fotosNuevas.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">
                Archivos Locales Cargados:
              </p>
              <div className="flex flex-col gap-2">
                {visualizarFotos.fotosNuevas.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl"
                  >
                    <IconPhoto size={16} className="text-indigo-400 shrink-0" />
                    <span className="truncate font-mono text-xs text-zinc-300">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {visualizarFotos?.fotosExistentes &&
          visualizarFotos.fotosExistentes.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">
                Archivos en Servidor:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {visualizarFotos.fotosExistentes.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 hover:border-indigo-500 transition-all"
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ModalTsx>

      {/* Modal: Registrar Nuevo Motivo de Ingreso */}
      <ModalTsx
        opened={openModalMotivo}
        onClose={() => setOpenModalMotivo(false)}
        title="Registrar Nuevo Motivo de Ingreso"
        ancho="md"
        validateClose
      >
        <RegistroMotivoIngreso
          onCancel={() => setOpenModalMotivo(false)}
          onSuccess={(nuevoMotivo) => {
            handleMotivoCreado(nuevoMotivo);
            setOpenModalMotivo(false);
          }}
        />
      </ModalTsx>
    </>
  );
};