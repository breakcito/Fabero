import type { ElementoQuimicoValorizacion } from "../../shared/enums/_generic/elemento-quimico-valorizacion";

export interface RES_ValorElementoQuimico {
  id: number;
  id_empleado_registro: number | null;
  elemento_quimico: ElementoQuimicoValorizacion;
  inter: number;
  fecha: string;
  created_at: string | null;
}

export interface REQ_RegistrarPrecioInter {
  elemento_quimico: ElementoQuimicoValorizacion;
  fecha: string;
  inter: number;
}
