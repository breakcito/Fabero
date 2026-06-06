import { z } from "zod";

export const Schema_CrearConductor = z.object({
  dni: z.string().length(8, "El DNI debe tener exactamente 8 dígitos").regex(/^\d+$/, "El DNI debe contener solo números"),
  ruc: z.string().length(11, "El RUC debe tener exactamente 11 dígitos").regex(/^\d+$/, "El RUC debe contener solo números").optional().nullable().or(z.literal("")),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es muy largo"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100, "El apellido es muy largo"),
  numero_licencia: z.string().min(3, "El número de licencia debe tener al menos 3 caracteres").max(20, "El número de licencia es muy largo"),
});

export type CrearConductorRequest = z.infer<typeof Schema_CrearConductor>;
