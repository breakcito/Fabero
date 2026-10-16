import type { ElementoQuimicoValorizacion } from "../../shared/enums/_generic/elemento-quimico-valorizacion";

export interface RES_ValorElementoQuimico {
  id: number;
  id_empleado_registro: number | null;
  empleado_registro_nombre?: string | null;
  elemento_quimico: ElementoQuimicoValorizacion;
  inter: number;
  fecha: string;
  created_at: string | null;
}

export interface RES_PreciosInterVigentes {
  fecha_consultada?: string;
  registrado_hoy?: boolean;
  Oro: RES_ValorElementoQuimico | null;
  Plata: RES_ValorElementoQuimico | null;
  ultimo_oro?: RES_ValorElementoQuimico | null;
  ultimo_plata?: RES_ValorElementoQuimico | null;
}

export interface REQ_RegistrarPrecioInter {
  elemento_quimico: ElementoQuimicoValorizacion;
  fecha: string;
  inter: number;
}
