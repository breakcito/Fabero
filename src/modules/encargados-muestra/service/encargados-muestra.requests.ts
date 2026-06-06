import { z } from "zod";

export const Schema_CrearEncargadoMuestra = z.object({
  dni: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length === 8, {
      message: "El DNI debe tener 8 dígitos",
    }),
  ruc: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length === 11, {
      message: "El RUC debe tener 11 dígitos",
    }),
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  apellido: z.string().min(1, "El apellido es requerido").max(100, "Máximo 100 caracteres"),
});

export type DTO_CrearEncargadoMuestra = z.infer<typeof Schema_CrearEncargadoMuestra>;
