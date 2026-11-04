import type { EstadoValorizacionCompra } from "../../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";

export interface GrupoValorizacionCompra {
  uuidGrupo: string;
  correlativo: string;
  proveedorNombre: string;
  proveedorRuc: string;
  concesionNombre: string;
  versiones: RES_ValorizacionCompra[];
  versionAprobada: RES_ValorizacionCompra | null;
  versionActiva: RES_ValorizacionCompra;
  estadoGrupo: EstadoValorizacionCompra;
  fechaReciente: string;
}

export const obtenerCorrelativoDisplay = (r: RES_ValorizacionCompra): string => {
  if (r.correlativo) return r.correlativo;
  if (r.numero_correlativo) return `VAL-${r.numero_correlativo}`;
  return `#${r.id}`;
};

export const fmtMonedaUsd = (val: number | null | undefined): string => {
  const num = Number(val ?? 0);
  return `$ ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

