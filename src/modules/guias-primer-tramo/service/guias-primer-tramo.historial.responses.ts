import type { GuiaPrimerTramoHistorialAccion } from "../../../shared/enums/_generic/guia-primer-tramo-historial-accion";
import type { LoteGuiaHistorialAccion } from "../../../shared/enums/_generic/lote-guia-historial-accion";

/**
 * Tipos auxiliares para diffs.
 */
export type CambioCampo<T = unknown> = {
  anterior: T | null;
  nuevo: T | null;
};

export type DiffCabecera = Record<string, CambioCampo> & {
  evidencias?: CambioCampo<{
    total: number;
    nombres: string[];
  }>;
};

export type DiffLote = Record<string, CambioCampo>;

/**
 * Item de historial. Soporta CABECERA (accion GuiaPrimerTramoHistorialAccion)
 * y LOTE (accion LoteGuiaHistorialAccion).
 */
export interface RES_HistorialItem {
  id: number;
  id_guia_primer_tramo: number;
  id_lote_guia: number | null;
  id_lote_mineral: number | null;
  lote_correlativo: string | null;
  origen: "CABECERA" | "LOTE";
  accion: GuiaPrimerTramoHistorialAccion | LoteGuiaHistorialAccion;
  id_usuario: number;
  usuario_nombre: string | null;
  cambios: DiffCabecera | DiffLote | Record<string, CambioCampo> | null;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  created_at: string;
}
