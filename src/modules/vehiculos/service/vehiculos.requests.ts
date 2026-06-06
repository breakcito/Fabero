import { z } from "zod";

export const Schema_CrearVehiculo = z.object({
  id_marca: z.number({ required_error: "Seleccione una marca" }).min(1, "Seleccione una marca"),
  id_empresa_transporte: z.number({ required_error: "Seleccione una empresa de transporte" }).min(1, "Seleccione una empresa de transporte"),
  id_tipo_vehiculo: z.number({ required_error: "Seleccione un tipo de vehículo" }).min(1, "Seleccione un tipo de vehículo"),
  serie_placa: z.string().optional().nullable().or(z.literal("")),
  numero_placa: z.string().min(5, "La placa debe tener al menos 5 caracteres").max(15, "La placa es muy larga"),
  numero_constancia_mtc: z.string().optional().nullable().or(z.literal("")),
  capacidad: z.coerce.number().min(0.01, "La capacidad debe ser un número positivo"),
  tara: z.coerce.number().min(0.01, "La tara debe ser un número positivo"),
  largo: z.coerce.number().positive("El largo debe ser un número positivo").optional().nullable().or(z.literal("")),
  ancho: z.coerce.number().positive("El ancho debe ser un número positivo").optional().nullable().or(z.literal("")),
  alto: z.coerce.number().positive("El alto debe ser un número positivo").optional().nullable().or(z.literal("")),
});

export type CrearVehiculoRequest = z.infer<typeof Schema_CrearVehiculo>;
