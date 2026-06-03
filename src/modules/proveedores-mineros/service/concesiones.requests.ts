import { z } from "zod";

export const Schema_CrearConcesion = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  codigo_concesion: z.string().min(1, "El código es requerido"),
  codigo_reinfo: z.string().optional().nullable(),
  ubigeo: z.string().optional().nullable(),
  tipo_mineral: z.string().min(1, "El tipo de mineral es requerido"),
});

export type DTO_CrearConcesion = z.infer<typeof Schema_CrearConcesion>;

export const Schema_CrearContrato = z.object({
  id_concesion: z.number().int().positive(),
  id_empresa: z.number().int().positive("Seleccione una empresa"),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin: z.string().optional().nullable(),
});

export type DTO_CrearContrato = z.infer<typeof Schema_CrearContrato>;
