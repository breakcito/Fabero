import { z } from "zod";

export const Schema_CrearConcesion = z.object({
  id_departamento: z.number().min(1, "El departamento es requerido"),
  id_provincia: z.number().min(1, "La provincia es requerida"),
  id_distrito: z.number().min(1, "El distrito es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  codigo_reinfo: z.string().optional().nullable(),
});

export type DTO_CrearConcesion = z.infer<typeof Schema_CrearConcesion>;

export const Schema_CrearContrato = z.object({
  id_concesion: z.number().int().positive(),
  id_empresa: z.number().int().positive("Seleccione una empresa"),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin: z.string().optional().nullable(),
});

export type DTO_CrearContrato = z.infer<typeof Schema_CrearContrato>;
