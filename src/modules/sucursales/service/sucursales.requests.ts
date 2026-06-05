import { z } from "zod";

export const Schema_RegistroSucursal = z.object({
  nombre: z.string().min(3, "El nombre de la sucursal debe tener al menos 3 caracteres"),
  id_departamento: z.number().nullable().optional(),
  id_provincia: z.number().nullable().optional(),
  id_distrito: z.number().nullable().optional(),
  direccion: z.string().max(512, "La dirección no puede exceder los 512 caracteres").nullable().optional(),
  telefono: z.string().max(64, "El teléfono no puede exceder los 64 caracteres").nullable().optional(),
});

export type DTO_RegistroSucursal = z.infer<typeof Schema_RegistroSucursal>;
