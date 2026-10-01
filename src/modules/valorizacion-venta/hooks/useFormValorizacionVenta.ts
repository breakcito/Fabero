import { useState, useEffect, useMemo } from "react";
import { ValorizacionVentaService } from "../service/valorizacion-venta.service";
import { useNotify } from "../../../hooks/useNotify";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import type {
  REQ_ValorizacionVentaDetalleItem,
} from "../service/valorizacion-venta.requests";
import type {
  RES_ValorizacionVenta,
  RES_ValorizacionVentaDetalle,
  RES_DistribucionDetalleDisponible,
} from "../service/valorizacion-venta.responses";

interface PlantaDisponible {
  id: number;
  ruc: string;
  razon_social: string;
}

interface Props {
  opened?: boolean;
  valorizacionEditar?: RES_ValorizacionVenta | null;
  onSuccess: () => void;
}

const nowIsoDateTime = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const basename = (path: string): string => {
  const normalized = path.replace(/\\/g, "/");
  return normalized.substring(normalized.lastIndexOf("/") + 1) || path;
};

const extractExtension = (name: string): string | null => {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.substring(idx + 1) : null;
};

const mapEvidenciasToArchivos = (evidencias: unknown): IArchivo[] => {
  if (!evidencias) return [];

  let rawList: unknown[] = [];
  if (Array.isArray(evidencias)) {
    rawList = evidencias;
  } else if (typeof evidencias === "string") {
    try {
      const parsed = JSON.parse(evidencias);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === "string") {
        rawList = [parsed];
      }
    } catch {
      if (evidencias.trim().length > 0) {
        rawList = [evidencias];
      }
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL || "";
  const baseUrl = backendUrl.replace(/\/api\/?$/, "");

  const result: IArchivo[] = [];
  for (const item of rawList) {
    if (!item) continue;

    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const pathRelativo = String(obj.path_relativo || obj.path || obj.url || "");
      const nombreOriginal = String(
        obj.nombre_original || obj.nombre || basename(pathRelativo) || "archivo",
      );
      const extension = String(
        obj.extension || extractExtension(nombreOriginal) || "",
      );
      let url = String(obj.url || "");
      if (!url && pathRelativo) {
        url = `${baseUrl}/storage/${pathRelativo}`;
      } else if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:")) {
        url = `${baseUrl}/storage/${url}`;
      }
      if (pathRelativo || url) {
        result.push({
          nombre_original: nombreOriginal,
          extension: extension,
          path_relativo: pathRelativo || url,
          url: url || pathRelativo,
        });
      }
    } else if (typeof item === "string" && item.trim().length > 0) {
      const pathStr = item.trim();
      const name = basename(pathStr);
      let url = pathStr;
      if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("blob:")
      ) {
        url = `${baseUrl}/storage/${pathStr}`;
      }
      result.push({
        nombre_original: name,
        extension: extractExtension(name) || "",
        path_relativo: pathStr,
        url: url,
      });
    }
  }

  return result;
};

export const useFormValorizacionVenta = ({
  opened,
  valorizacionEditar,
  onSuccess,
}: Props) => {
  const { notifyError } = useNotify();

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form Fields
  const [idPlanta, setIdPlanta] = useState<number | null>(null);
  const [codigo, setCodigo] = useState<string>("");
  const [detalles, setDetalles] = useState<
    { req: REQ_ValorizacionVentaDetalleItem; display: RES_ValorizacionVentaDetalle }[]
  >([]);
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>([]);
  const [fechaHoraValorizacion, setFechaHoraValorizacion] = useState<string | null>(nowIsoDateTime());
  const [montoPenalidad, setMontoPenalidad] = useState<number>(0);
  const [montoFlete, setMontoFlete] = useState<number>(0);

  // Catalogs (la condición comercial se auto-encontrar por backend según rango de ley)

  // Modals state
  const [modalDetalleOpened, setModalDetalleOpened] = useState(false);

  // Cargar datos de edición si existen o reiniciar al abrir en modo creación
  useEffect(() => {
    if (!opened) return;

    if (valorizacionEditar) {
      setIdPlanta(valorizacionEditar.id_planta);
      setCodigo(valorizacionEditar.codigo ?? "");

      setDetalles(
        valorizacionEditar.detalles.map((d) => ({
          req: {
            id_despacho_detalle: (d.id_despacho_detalle ?? d.id_distribucion_detalle) as number | undefined,
            id_distribucion_detalle: d.id_distribucion_detalle as number | undefined,
            elemento_quimico: d.elemento_quimico,
            id_condicion_comercial: d.id_condicion_comercial,
            id_valor_elemento_quimico: d.id_valor_elemento_quimico ?? null,
            inter: d.inter,
            des_inter: d.des_inter,
            recuperacion: d.recuperacion,
            maquila: d.maquila,
            consumo: d.consumo,
            factor: d.factor,
          },
          display: d,
        })),
      );

      setEvidencias([]);
      setEvidenciasExistentes(mapEvidenciasToArchivos(valorizacionEditar.evidencias));

      setFechaHoraValorizacion(
        valorizacionEditar.fecha_hora_valorizacion ?? nowIsoDateTime(),
      );
      setMontoPenalidad(valorizacionEditar.monto_penalidad ?? 0);
      setMontoFlete(valorizacionEditar.monto_flete ?? 0);
    } else {
      setIdPlanta(null);
      setCodigo("");
      setDetalles([]);
      setEvidencias([]);
      setEvidenciasExistentes([]);
      setFechaHoraValorizacion(nowIsoDateTime());
      setMontoPenalidad(0);
      setMontoFlete(0);
    }
  }, [opened, valorizacionEditar]);

  // Totales
  const totalSubtotal = useMemo(() => {
    return detalles.reduce((acc, curr) => acc + curr.display.subtotal, 0);
  }, [detalles]);

  // Handlers para agregar / eliminar / editar detalles
  const handleAgregarDetalle = (
    req: REQ_ValorizacionVentaDetalleItem,
    display: RES_ValorizacionVentaDetalle,
  ) => {
    setDetalles((prev) => [...prev, { req, display }]);
  };

  const handleEliminarDetalle = (index: number) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditarDetalle = (
    index: number,
    req: REQ_ValorizacionVentaDetalleItem,
    display: RES_ValorizacionVentaDetalle,
  ) => {
    setDetalles((prev) =>
      prev.map((d, i) => (i === index ? { req, display } : d)),
    );
  };

  const handleSubmit = async () => {
    if (!idPlanta) {
      notifyError("Debe seleccionar una planta destino");
      return;
    }
    if (detalles.length === 0) {
      notifyError("Debe agregar al menos un item de despacho a la valorización");
      return;
    }
    if (codigo && codigo.length > 20) {
      notifyError("El código no puede tener más de 20 caracteres");
      return;
    }

    setLoadingSubmit(true);

    try {
      if (valorizacionEditar) {
        await ValorizacionVentaService.editarValorizacion(valorizacionEditar.id, {
          id_planta: idPlanta,
          detalles: detalles.map((d) => d.req),
          codigo: codigo.trim() || null,
          evidencias,
          evidencias_existentes: evidenciasExistentes,
          fecha_hora_valorizacion: fechaHoraValorizacion,
          monto_penalidad: montoPenalidad,
          monto_flete: montoFlete,
        });
      } else {
        await ValorizacionVentaService.crearValorizacion({
          id_planta: idPlanta,
          detalles: detalles.map((d) => d.req),
          codigo: codigo.trim() || null,
          evidencias,
          fecha_hora_valorizacion: fechaHoraValorizacion,
          monto_penalidad: montoPenalidad,
          monto_flete: montoFlete,
        });
      }

      onSuccess();
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al guardar la valorización",
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return {
    loadingSubmit,
    idPlanta,
    setIdPlanta,
    codigo,
    setCodigo,
    detalles,
    totalSubtotal,
    evidencias,
    setEvidencias,
    evidenciasExistentes,
    setEvidenciasExistentes,
    fechaHoraValorizacion,
    setFechaHoraValorizacion,
    montoPenalidad,
    setMontoPenalidad,
    montoFlete,
    setMontoFlete,
    modalDetalleOpened,
    setModalDetalleOpened,
    handleAgregarDetalle,
    handleEditarDetalle,
    handleEliminarDetalle,
    handleSubmit,
  };
};

// Re-export del tipo para uso externo
export type { PlantaDisponible, RES_DistribucionDetalleDisponible };
