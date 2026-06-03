import { z } from "zod";

export const Schema_RegistroArea = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
});

export type DTO_RegistroArea = z.infer<typeof Schema_RegistroArea>;

export const Schema_RegistroCargo = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  id_area: z.number().int().positive("Seleccione un área"),
});

export type DTO_RegistroCargo = z.infer<typeof Schema_RegistroCargo>;
