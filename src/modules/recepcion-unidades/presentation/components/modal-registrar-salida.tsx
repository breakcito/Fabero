import { useEffect, useMemo, useState } from "react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  AreaTexto,
  Boton,
  BotonIcono,
  CampoSeleccion,
  CampoTexto,
  Casilla,
  Insignia,
} from "../../../../presentation/utils/ui-tsx";
import { ListaArchivosSimple } from "../../../../presentation/utils/archivo/lista-archivos-simple";
import { SelectorArchivo } from "../../../../presentation/utils/archivo/selector-archivo";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IGuiaRecepcion } from "../../../../shared/interfaces/guia-recepcion";
import { EstadoSalida } from "../../../../shared/enums/_generic/estado-salida";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/**
 * Bloque de guías de salida.
 *
 * Cada bloque es de un proveedor o interno (de la propia empresa). Los
 * internos no llevan proveedor: es lo que marca `es_interno`.
 */
interface BloqueGuiaSalida {
  /** Clave interna del bloque (para React y para quitarlo). */
  clave: string;
  /** La guía la emite la propia empresa: no lleva proveedor. */
  es_interno: boolean;
  id_proveedor: number | null;
  guia_remitente: string;
  guia_transportista: string;
  archivo_remitente: File | null;
  archivo_transportista: File | null;
}

let contadorBloques = 0;

const nuevoBloque = (
  esInterno: boolean,
  idProveedor: number | null = null,
): BloqueGuiaSalida => {
  contadorBloques += 1;
  return {
    clave: `bloque-${contadorBloques}`,
    es_interno: esInterno,
    id_proveedor: idProveedor,
    guia_remitente: "",
    guia_transportista: "",
    archivo_remitente: null,
    archivo_transportista: null,
  };
};

/**
 * Pasos del registro de salida.
 *
 * Se recorre por pasos porque en planta el operador va con el dedo y la
 * pantalla es chica: un solo formulario largo obliga a hacer scroll.
 */
const PASOS_SALIDA = [
  { titulo: "Estado y Observación" },
  { titulo: "Guías" },
  { titulo: "Evidencias" },
] as const;

/**
 * Registro de salida de una unidad.
 *
 * - Paso 1: estado de la unidad (con carga / vacío) y observación.
 * - Paso 2: guías de salida. Cada bloque es de un proveedor o interno (de
 *   la propia empresa); se agregan con el botón "Agregar guías".
 * - Paso 3: evidencias de la salida.
 */
export const ModalRegistrarSalida = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [paso, setPaso] = useState(0);
  const [estadoSalida, setEstadoSalida] = useState<EstadoSalida | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [evidenciasSalida, setEvidenciasSalida] = useState<File[]>([]);
  const [bloques, setBloques] = useState<BloqueGuiaSalida[]>([]);
  const [agregando, setAgregando] = useState(false);
  const [catalogoProveedores, setCatalogoProveedores] = useState<RES_Proveedor[]>(
    [],
  );
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Proveedores con los que ingresó la unidad (se destacan en el selector). */
  const proveedoresIngreso = recepcion?.proveedores ?? [];
  const claveProveedoresIngreso = proveedoresIngreso
    .map((p) => p.id_proveedor)
    .join(",");

  /**
   * Precarga al abrir: el estado arranca vacío (la salida se declara
   * ahora) y se crea un bloque por proveedor con el que ingresó la unidad.
   */
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevRecepcionId, setPrevRecepcionId] = useState(recepcion?.id ?? null);

  if (opened !== prevAbierto || (recepcion?.id ?? null) !== prevRecepcionId) {
    setPrevAbierto(opened);
    setPrevRecepcionId(recepcion?.id ?? null);

    if (opened && recepcion) {
      setPaso(0);
      setEstadoSalida(null);
      setObservacionSalida("");
      setEvidenciasSalida([]);
      setAgregando(false);

      const ids = (recepcion.proveedores ?? []).map((p) => p.id_proveedor);
      setBloques(
        ids.length > 0
          ? ids.map((id) => nuevoBloque(false, id))
          : [nuevoBloque(false, null)],
      );
    }
  }

  // Al cerrar el modal se descarta lo capturado.
  useEffect(() => {
    if (opened) return;
    setPaso(0);
  }, [opened]);

  // Catálogo de proveedores: hace falta el completo para que el operador
  // pueda cambiar quién sale con la unidad.
  useEffect(() => {
    if (!opened) return;

    let cancelado = false;
    setLoadingProveedores(true);

    AuxService.get_proveedores()
      .then((prov) => {
        if (cancelado) return;
        setCatalogoProveedores(
          prov.data ?? (prov as unknown as RES_Proveedor[]),
        );
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        if (!cancelado) setLoadingProveedores(false);
      });

    return () => {
      cancelado = true;
    };
  }, [opened]);

  /**
   * Opciones del selector de proveedor: los proveedores con los que ingresó
   * la unidad van primero y marcados, para que el operador los distinga de
   * un vistazo.
   */
  const proveedoresOptions = useMemo(() => {
    const idsIngreso = new Set(
      claveProveedoresIngreso.split(",").filter(Boolean).map(Number),
    );

    const delIngreso = catalogoProveedores.filter((p) =>
      idsIngreso.has(p.id_proveedor),
    );
    const resto = catalogoProveedores.filter(
      (p) => !idsIngreso.has(p.id_proveedor),
    );

    const aOpcion = (p: RES_Proveedor) => ({
      value: String(p.id_proveedor),
      label: idsIngreso.has(p.id_proveedor)
        ? `✓ ${p.razon_social}`
        : p.razon_social,
    });

    return [...delIngreso.map(aOpcion), ...resto.map(aOpcion)];
  }, [catalogoProveedores, claveProveedoresIngreso]);

  if (!recepcion) return null;

  const razonSocialProveedor = (idProveedor: number | null): string =>
    catalogoProveedores.find((p) => p.id_proveedor === idProveedor)
      ?.razon_social ??
    proveedoresIngreso.find((p) => p.id_proveedor === idProveedor)
      ?.razon_social ??
    "Proveedor de la carga";

  const esProveedorIngreso = (idProveedor: number | null): boolean =>
    proveedoresIngreso.some((p) => p.id_proveedor === idProveedor);

  /** Agrega un bloque de guías (de un proveedor o interno). */
  const agregarBloque = (esInterno: boolean) => {
    setBloques((prev) => [
      ...prev,
      esInterno
        ? nuevoBloque(true, null)
        : nuevoBloque(false, proveedoresIngreso[0]?.id_proveedor ?? null),
    ]);
    setAgregando(false);
  };

  const quitarBloque = (clave: string) => {
    setBloques((prev) => prev.filter((b) => b.clave !== clave));
  };

  const actualizarBloque = (
    clave: string,
    patch: Partial<BloqueGuiaSalida>,
  ) => {
    setBloques((prev) =>
      prev.map((b) => (b.clave === clave ? { ...b, ...patch } : b)),
    );
  };

  const handleSave = async () => {
    if (!estadoSalida) {
      notifyError("Debe seleccionar el estado de la unidad.");
      return;
    }

    setSaving(true);
    try {
      // Las guías vacías no se envían. Los archivos se reindexan por la
      // POSICIÓN dentro del array que viaja, que es como los empareja el
      // backend (`guias_archivos[<posición>][guia_*]`).
      const guias: IGuiaRecepcion[] = [];
      const archivosPorPosicion: Record<
        number,
        { guia_remitente?: File; guia_transportista?: File }
      > = {};

      bloques.forEach((bloque) => {
        const remitente = bloque.guia_remitente.trim().toUpperCase();
        const transportista = bloque.guia_transportista.trim().toUpperCase();
        if (remitente === "" && transportista === "") return;

        const posicion = guias.length;
        guias.push({
          id_proveedor: bloque.es_interno ? 0 : (bloque.id_proveedor ?? 0),
          guia_remitente: remitente,
          guia_transportista: transportista,
          guia_remitente_archivo: null,
          guia_transportista_archivo: null,
          es_interno: bloque.es_interno,
        });

        if (bloque.archivo_remitente || bloque.archivo_transportista) {
          archivosPorPosicion[posicion] = {
            guia_remitente: bloque.archivo_remitente ?? undefined,
            guia_transportista: bloque.archivo_transportista ?? undefined,
          };
        }
      });

      const actualizada = await RecepcionUnidadesService.registrarSalida(
        recepcion.id,
        {
          estado_salida: estadoSalida,
          observacion_salida: observacionSalida,
          guias_salida: guias,
          guias_archivos: archivosPorPosicion,
          evidencias: evidenciasSalida,
        },
      );
      notifySuccess("Salida de unidad registrada correctamente");
      onGuardada(actualizada);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al registrar la salida");
    } finally {
      setSaving(false);
    }
  };

  const headerPasos = (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PASOS_SALIDA.length}
        aria-valuenow={paso + 1}
        aria-label="Avance del formulario"
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${((paso + 1) / PASOS_SALIDA.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex gap-1">
        {PASOS_SALIDA.map((p, indice) => {
          const activo = indice === paso;
          const completado = indice < paso;
          return (
            <button
              key={p.titulo}
              type="button"
              onClick={() => setPaso(indice)}
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
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
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
        <div className="space-y-3">
          <CampoSeleccion
            label="Estado de la unidad"
            placeholder="Seleccione"
            opciones={[
              { value: EstadoSalida.ConCarga, label: "Con carga" },
              { value: EstadoSalida.Vacio, label: "Vacío" },
            ]}
            valor={estadoSalida}
            onChange={(val) =>
              setEstadoSalida(val ? (val as EstadoSalida) : null)
            }
            deshabilitado={saving}
            requerido
          />

          <AreaTexto
            label="Observación"
            placeholder="Opcional"
            rows={3}
            value={observacionSalida}
            onChange={(e) => setObservacionSalida(e.currentTarget.value)}
            disabled={saving}
            className="max-h-40"
          />
        </div>
      )}

      {paso === 1 && (
        <div className="space-y-3">
          {/* Botón para agregar un bloque de guías: por proveedor o interna. */}
          <div>
            <Boton
              variante="secundario"
              onClick={() => setAgregando((v) => !v)}
              disabled={saving}
              className="w-full border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80"
            >
              <IconPlus size={18} />
              Agregar guías
            </Boton>

            {agregando ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Boton
                  variante="secundario"
                  onClick={() => agregarBloque(false)}
                  disabled={saving}
                  className="border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80"
                >
                  Por proveedor
                </Boton>
                <Boton
                  variante="secundario"
                  onClick={() => agregarBloque(true)}
                  disabled={saving}
                  className="border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80"
                >
                  De Fabero
                </Boton>
              </div>
            ) : null}
          </div>

          {bloques.length === 0 ? (
            <p className="py-4 text-center text-sm italic text-zinc-500">
              Agrega un bloque de guías: de un proveedor o interno de la
              empresa.
            </p>
          ) : (
            bloques.map((bloque) => (
              <div
                key={bloque.clave}
                className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <IconFileText className="h-4 w-4 shrink-0 text-indigo-400" />
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-100">
                    {bloque.es_interno
                      ? "Guías internas de la empresa"
                      : razonSocialProveedor(bloque.id_proveedor)}
                  </p>
                  {bloque.es_interno ? (
                    <Insignia color="verde">Interna</Insignia>
                  ) : esProveedorIngreso(bloque.id_proveedor) ? (
                    <Insignia color="verde">Ingreso</Insignia>
                  ) : (
                    <Insignia color="indigo">Guía de salida</Insignia>
                  )}
                  <BotonIcono
                    etiqueta="Quitar bloque de guías"
                    color="rojo"
                    onClick={() => quitarBloque(bloque.clave)}
                    disabled={saving}
                  >
                    <IconTrash size={16} />
                  </BotonIcono>
                </div>

                {bloque.es_interno ? null : (
                  <CampoSeleccion
                    label="Proveedor"
                    placeholder={
                      loadingProveedores ? "Cargando..." : "Seleccione"
                    }
                    opciones={proveedoresOptions}
                    valor={
                      bloque.id_proveedor !== null
                        ? String(bloque.id_proveedor)
                        : null
                    }
                    onChange={(val) =>
                      actualizarBloque(bloque.clave, {
                        id_proveedor: val ? Number(val) : null,
                      })
                    }
                    deshabilitado={loadingProveedores || saving}
                    buscable
                  />
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoTexto
                    label="Guía Remitente"
                    placeholder="Ej. 001-123456"
                    value={bloque.guia_remitente}
                    onChange={(e) =>
                      actualizarBloque(bloque.clave, {
                        guia_remitente: e.currentTarget.value.toUpperCase(),
                      })
                    }
                    disabled={saving}
                  />
                  <CampoTexto
                    label="Guía Transportista (opcional)"
                    placeholder="Ej. 001-123456"
                    value={bloque.guia_transportista}
                    onChange={(e) =>
                      actualizarBloque(bloque.clave, {
                        guia_transportista:
                          e.currentTarget.value.toUpperCase(),
                      })
                    }
                    disabled={saving}
                  />

                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-zinc-400">
                      Archivo Guía Remitente
                    </p>
                    <SelectorArchivo
                      label="Sin archivo"
                      accept="application/pdf,image/*"
                      archivo={bloque.archivo_remitente}
                      disabled={saving}
                      onChange={(archivo) =>
                        actualizarBloque(bloque.clave, {
                          archivo_remitente: archivo,
                        })
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
                      archivo={bloque.archivo_transportista}
                      disabled={saving}
                      onChange={(archivo) =>
                        actualizarBloque(bloque.clave, {
                          archivo_transportista: archivo,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Una guía interna la emite la empresa: no lleva proveedor. */}
                <Casilla
                  label="Guías de Fabero"
                  checked={bloque.es_interno}
                  onChange={(e) =>
                    actualizarBloque(bloque.clave, {
                      es_interno: e.currentTarget.checked,
                      id_proveedor: e.currentTarget.checked
                        ? null
                        : bloque.id_proveedor,
                    })
                  }
                  disabled={saving}
                />
              </div>
            ))
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-zinc-300">
            Evidencias de salida
          </p>
          <ListaArchivosSimple
            archivos={evidenciasSalida}
            onFilesChange={setEvidenciasSalida}
            label="Adjuntar evidencias de salida"
          />
        </div>
      )}
    </>
  );

  const pieModal = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Boton
          variante="fantasma"
          onClick={onClose}
          disabled={saving}
          className="px-2 text-zinc-400 hover:text-white"
        >
          Cancelar
        </Boton>
        {paso > 0 ? (
          <Boton
            variante="secundario"
            onClick={() => setPaso(paso - 1)}
            disabled={saving}
            className="px-3"
          >
            <IconChevronLeft size={16} />
            Anterior
          </Boton>
        ) : null}
      </div>

      {paso < PASOS_SALIDA.length - 1 ? (
        <Boton
          variante="primario"
          onClick={() => setPaso(paso + 1)}
          disabled={saving}
          className="px-5"
        >
          Siguiente
          <IconChevronRight size={16} />
        </Boton>
      ) : (
        <Boton
          variante="primario"
          onClick={() => void handleSave()}
          cargando={saving}
          className="px-5"
        >
          <IconCheck size={16} />
          Marcar salida
        </Boton>
      )}
    </div>
  );

  return (
    <ModalTsx
      opened={opened && recepcion !== null}
      onClose={onClose}
      title="Marcar salida"
      ancho="lg"
      validateClose
      compacto
      footer={pieModal}
    >
      <div className="flex flex-col gap-4">
        {headerPasos}
        {contenidoPaso}
      </div>
    </ModalTsx>
  );
};
