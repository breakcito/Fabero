import { useEffect, useMemo, useState } from "react";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import { ModalTsx } from "../../../../presentation/utils/modal-tsx";
import {
  Boton,
  BotonIcono,
  CampoSeleccion,
  CampoTexto,
} from "../../../../presentation/utils/ui-tsx";
import { SelectorArchivo } from "../../../../presentation/utils/archivo/selector-archivo";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IGuiaRecepcion } from "../../../../shared/interfaces/guia-recepcion";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

/** Bloque editable de guías de salida (lleva clave propia para moverlo). */
interface BloqueGuia extends IGuiaRecepcion {
  clave: string;
}

let contadorBloques = 0;

const nuevaClave = (): string => {
  contadorBloques += 1;
  return `guia-salida-${contadorBloques}`;
};

/**
 * Edición de las guías de SALIDA de una recepción de unidad.
 *
 * Un bloque por proveedor: el proveedor, sus guías (remitente y transportista)
 * y sus archivos son editables. Se pueden agregar y quitar bloques.
 *
 * Las guías de salida son un contrato aparte del de ingreso.
 */
export const ModalEditarGuiasSalida = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [bloques, setBloques] = useState<BloqueGuia[]>([]);
  /** Archivos nuevos por clave de bloque. */
  const [archivosNuevos, setArchivosNuevos] = useState<
    Record<string, { guia_remitente?: File; guia_transportista?: File }>
  >({});
  const [catalogoProveedores, setCatalogoProveedores] = useState<RES_Proveedor[]>(
    [],
  );
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Precarga al abrir (ajuste durante el render, igual que el modal de guías).
  const [prevAbierto, setPrevAbierto] = useState(opened);
  const [prevRecepcionId, setPrevRecepcionId] = useState(recepcion?.id ?? null);

  const seAbrio = opened !== prevAbierto;
  const cambioRecepcion = (recepcion?.id ?? null) !== prevRecepcionId;

  if (seAbrio || cambioRecepcion) {
    setPrevAbierto(opened);
    setPrevRecepcionId(recepcion?.id ?? null);

    if (opened && recepcion) {
      setBloques(
        (recepcion.guias_salida ?? []).map((g) => ({
          clave: nuevaClave(),
          id_proveedor: g.id_proveedor,
          guia_remitente: g.guia_remitente ?? "",
          guia_transportista: g.guia_transportista ?? "",
          guia_remitente_archivo: g.guia_remitente_archivo ?? null,
          guia_transportista_archivo: g.guia_transportista_archivo ?? null,
          es_interno: g.es_interno ?? false,
        })),
      );
      setArchivosNuevos({});
    }
  }

  // Catálogo de proveedores: hace falta el completo para poder cambiarlos.
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

  /** Opciones del selector: los proveedores de la carga van marcados. */
  const proveedoresOptions = useMemo(() => {
    const idsCarga = new Set(
      (recepcion?.proveedores ?? []).map((p) => p.id_proveedor),
    );
    return catalogoProveedores.map((p) => ({
      value: String(p.id_proveedor),
      label: idsCarga.has(p.id_proveedor)
        ? `✓ ${p.razon_social}`
        : p.razon_social,
    }));
  }, [catalogoProveedores, recepcion?.proveedores]);

  if (!recepcion) return null;

  /** Actualiza un bloque por su clave. */
  const actualizarGuia = (clave: string, patch: Partial<BloqueGuia>) => {
    setBloques((prev) =>
      prev.map((b) => (b.clave === clave ? { ...b, ...patch } : b)),
    );
  };

  /** Agrega un bloque nuevo (con el primer proveedor disponible). */
  const agregarBloque = () => {
    const proveedorInicial = catalogoProveedores[0]?.id_proveedor ?? 0;
    setBloques((prev) => [
      ...prev,
      {
        clave: nuevaClave(),
        id_proveedor: proveedorInicial,
        guia_remitente: "",
        guia_transportista: "",
        guia_remitente_archivo: null,
        guia_transportista_archivo: null,
        es_interno: false,
      },
    ]);
  };

  /** Quita un bloque y sus archivos nuevos. */
  const quitarBloque = (clave: string) => {
    setBloques((prev) => prev.filter((b) => b.clave !== clave));
    setArchivosNuevos((prev) => {
      const siguiente = { ...prev };
      delete siguiente[clave];
      return siguiente;
    });
  };

  /** Quita el archivo ya guardado de una guía (queda en null). */
  const quitarArchivo = (
    clave: string,
    campo: "guia_remitente_archivo" | "guia_transportista_archivo",
  ) => {
    actualizarGuia(clave, { [campo]: null });
  };

  const setArchivoNuevo = (
    clave: string,
    campo: "guia_remitente" | "guia_transportista",
    archivo: File | null,
  ) => {
    setArchivosNuevos((prev) => {
      const siguiente = { ...prev };
      const delBloque = { ...(prev[clave] ?? {}) };

      if (archivo) {
        delBloque[campo] = archivo;
      } else {
        delete delBloque[campo];
      }

      siguiente[clave] = delBloque;
      return siguiente;
    });
  };

  const handleGuardar = async () => {
    setSubmitting(true);
    try {
      const actualizadas = bloques.map((b) => ({
        id_proveedor: b.id_proveedor,
        guia_remitente: b.guia_remitente.trim().toUpperCase(),
        guia_transportista: b.guia_transportista.trim().toUpperCase(),
        guia_remitente_archivo: b.guia_remitente_archivo,
        guia_transportista_archivo: b.guia_transportista_archivo,
        es_interno: b.es_interno ?? false,
      }));

      // Los archivos nuevos se indexan por la posición de la guía: es como
      // los empareja el backend (`guias_archivos[<índice>][guia_*]`).
      const archivosPorPosicion: Record<
        number,
        { guia_remitente?: File; guia_transportista?: File }
      > = {};
      bloques.forEach((bloque, indice) => {
        const archivos = archivosNuevos[bloque.clave];
        if (archivos?.guia_remitente || archivos?.guia_transportista) {
          archivosPorPosicion[indice] = archivos;
        }
      });

      await RecepcionUnidadesService.setGuiasSalida(
        recepcion.id,
        actualizadas,
        archivosPorPosicion,
      );
      notifySuccess("Guías de salida actualizadas correctamente");
      onGuardada({
        ...recepcion,
        guias_salida: actualizadas,
      });
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        e instanceof Error
          ? e.message
          : "No se pudieron actualizar las guías de salida.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTsx
      opened={opened}
      onClose={onClose}
      title="Editar Guías de Salida"
      ancho="md"
      validateClose
      compacto
      footer={
        <div className="flex items-center justify-end gap-2">
          <Boton
            variante="fantasma"
            onClick={onClose}
            disabled={submitting}
            className="text-zinc-400 hover:text-white"
          >
            Cerrar
          </Boton>
          <Boton
            variante="primario"
            onClick={() => void handleGuardar()}
            cargando={submitting}
            disabled={bloques.length === 0}
          >
            <IconDeviceFloppy size={16} />
            Guardar Guías
          </Boton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {bloques.length === 0 ? (
          <p className="py-6 text-center text-sm italic text-zinc-500">
            La unidad no tiene guías de salida registradas.
          </p>
        ) : (
          bloques.map((bloque) => (
            <div
              key={bloque.clave}
              className="space-y-3 rounded-lg border border-zinc-800 p-3"
            >
              <div className="flex items-end gap-2">
                {/* Proveedor del bloque (las internas no llevan proveedor) */}
                <div className="min-w-0 flex-1">
                  {bloque.es_interno ? (
                    <p className="text-sm font-semibold text-zinc-300">
                      Guías internas de la empresa
                    </p>
                  ) : (
                    <CampoSeleccion
                      label="Proveedor"
                      placeholder={
                        loadingProveedores ? "Cargando..." : "Seleccione"
                      }
                      opciones={proveedoresOptions}
                      valor={
                        bloque.id_proveedor > 0
                          ? String(bloque.id_proveedor)
                          : null
                      }
                      onChange={(val) =>
                        actualizarGuia(bloque.clave, {
                          id_proveedor: val ? Number(val) : 0,
                        })
                      }
                      deshabilitado={loadingProveedores || submitting}
                      buscable
                    />
                  )}
                </div>
                <BotonIcono
                  etiqueta="Quitar bloque de guías"
                  color="rojo"
                  onClick={() => quitarBloque(bloque.clave)}
                  disabled={submitting}
                >
                  <IconTrash size={16} />
                </BotonIcono>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoTexto
                  label="Guía Remitente"
                  placeholder="Ej. 001-123456"
                  value={bloque.guia_remitente}
                  onChange={(e) =>
                    actualizarGuia(bloque.clave, {
                      guia_remitente: e.currentTarget.value.toUpperCase(),
                    })
                  }
                  disabled={submitting}
                />
                <CampoTexto
                  label="Guía Transportista (opcional)"
                  placeholder="Ej. 001-123456"
                  value={bloque.guia_transportista}
                  onChange={(e) =>
                    actualizarGuia(bloque.clave, {
                      guia_transportista: e.currentTarget.value.toUpperCase(),
                    })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-400">
                    Archivo Guía Remitente
                  </p>
                  <SelectorArchivo
                    label="Sin archivo"
                    accept="application/pdf,image/*"
                    archivo={archivosNuevos[bloque.clave]?.guia_remitente ?? null}
                    archivoExistente={
                      archivosNuevos[bloque.clave]?.guia_remitente
                        ? null
                        : bloque.guia_remitente_archivo
                    }
                    onQuitarExistente={() =>
                      quitarArchivo(bloque.clave, "guia_remitente_archivo")
                    }
                    disabled={submitting}
                    onChange={(archivo) =>
                      setArchivoNuevo(bloque.clave, "guia_remitente", archivo)
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
                    archivo={
                      archivosNuevos[bloque.clave]?.guia_transportista ?? null
                    }
                    archivoExistente={
                      archivosNuevos[bloque.clave]?.guia_transportista
                        ? null
                        : bloque.guia_transportista_archivo
                    }
                    onQuitarExistente={() =>
                      quitarArchivo(bloque.clave, "guia_transportista_archivo")
                    }
                    disabled={submitting}
                    onChange={(archivo) =>
                      setArchivoNuevo(
                        bloque.clave,
                        "guia_transportista",
                        archivo,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Agregar otro bloque de guías */}
        <Boton
          variante="secundario"
          onClick={agregarBloque}
          disabled={submitting}
          className="w-full border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80"
        >
          <IconPlus size={18} />
          Agregar guía
        </Boton>
      </div>
    </ModalTsx>
  );
};
