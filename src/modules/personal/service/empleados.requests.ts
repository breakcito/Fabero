import { z } from "zod";

export const Schema_CrearEmpleado = z.object({
  nombre: z.string().min(1, "Los nombres son obligatorios"),
  apellido: z.string().min(1, "Los apellidos son obligatorios"),
  dni: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine((val) => !val || /^\d{8}$/.test(val), {
      message: "El DNI debe tener exactamente 8 dígitos",
    }),
  ruc: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine((val) => !val || /^\d{11}$/.test(val), {
      message: "El RUC debe tener exactamente 11 dígitos",
    }),
  carnet_extranjeria: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  pasaporte: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  fecha_nacimiento: z
    .any()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString().split("T")[0];
      return val;
    }),
  path_foto: z.any().nullable().optional(),
  id_empresa: z.number().min(1, "Debe seleccionar una empresa"),
  id_cargo: z.number().min(1, "Debe seleccionar un cargo"),
  autoriza_ingreso_unidades: z.boolean().default(false),
});

export type DTO_CrearEmpleado = z.infer<typeof Schema_CrearEmpleado>;
