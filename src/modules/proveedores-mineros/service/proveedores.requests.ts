import { TipoEntidad } from "../../../shared/enums/_generic/tipo-entidad";
import { z } from "zod";

export const Schema_CrearProveedor = z
  .object({
    tipo_entidad: z.nativeEnum(TipoEntidad),
    dni: z.string().optional().nullable(),
    ruc: z.string().optional().nullable(),
    razon_social: z.string().min(3, "La razón social o nombre es muy corto"),
    direccion: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    correo: z.email("Correo no válido").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_entidad === TipoEntidad.Natural) {
      if (!data.dni || !/^\d{8}$/.test(data.dni)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El DNI debe tener exactamente 8 dígitos",
          path: ["dni"],
        });
      }
    } else {
      if (!data.ruc || !/^(10|20)\d{9}$/.test(data.ruc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "El RUC debe tener 11 dígitos y comenzar con 10 o 20",
          path: ["ruc"],
        });
      }
    }
  });

export type CrearProveedorRequest = z.infer<typeof Schema_CrearProveedor>;

export const Schema_CrearCuentaBancaria = z.object({
  id_proveedor: z.number().min(1, "Seleccione un proveedor"),
  id_banco: z.number().min(1, "Seleccione un banco válido"),
  moneda: z.string().min(1, "Seleccione una moneda"),
  numero_cuenta: z.string().min(1, "El número de cuenta es requerido"),
  cci: z.string().optional().nullable(),
  es_para_detraccion: z.number(), // 1 o 0
});
export type CrearCuentaBancariaRequest = z.infer<
  typeof Schema_CrearCuentaBancaria
>;
