import { z } from "zod";

/**
 * Campos comunes del alta y la edición de un empleado.
 *
 * Área y cargo son opcionales: el área se coloca cuando se registra un cargo
 * (el cargo determina su área) y puede informarse sola cuando no hay cargo.
 */
const BaseSchema_Empleado = z.object({
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
  id_area: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val && val > 0 ? val : null)),
  id_cargo: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val && val > 0 ? val : null)),
});

export const Schema_CrearEmpleado = BaseSchema_Empleado;
export const Schema_EditarEmpleado = BaseSchema_Empleado;

export type DTO_CrearEmpleado = z.infer<typeof Schema_CrearEmpleado>;
export type DTO_EditarEmpleado = z.infer<typeof Schema_EditarEmpleado>;
