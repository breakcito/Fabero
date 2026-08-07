import { z } from "zod";

export const Schema_CrearVehiculo = z.object({
  id_marca: z.number().min(1, "Seleccione una marca"),
  id_empresa_transporte: z
    .number()
    .min(1, "Seleccione una empresa de transporte"),
  id_tipo_vehiculo: z.number().min(1, "Seleccione un tipo de vehículo"),
  placa: z
    .string()
    .min(7, "La placa debe tener 7 caracteres (XXX-000)")
    .max(15, "La placa es muy larga")
    .regex(
      /^[A-Z]{3}-\d{3}$/,
      "Formato inválido. Use XXX-000 (3 letras mayúsculas, guion, 3 números)",
    ),
  numero_constancia_mtc: z.string().optional().nullable().or(z.literal("")),
  capacidad: z.coerce
    .number()
    .min(0.01, "La capacidad debe ser un número positivo"),
  tara: z.coerce.number().min(0.01, "La tara debe ser un número positivo"),
  largo: z.coerce
    .number()
    .positive("El largo debe ser un número positivo")
    .optional()
    .nullable()
    .or(z.literal("")),
  ancho: z.coerce
    .number()
    .positive("El ancho debe ser un número positivo")
    .optional()
    .nullable()
    .or(z.literal("")),
  alto: z.coerce
    .number()
    .positive("El alto debe ser un número positivo")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CrearVehiculoRequest = z.infer<typeof Schema_CrearVehiculo>;
