import { TipoEntidad } from "../../../shared/enums/_generic/tipo-entidad";
import { z } from "zod";

export const Schema_CrearEmpresaTransporte = z
  .object({
    tipo_entidad: z.nativeEnum(TipoEntidad),
    dni: z.string().optional().nullable().or(z.literal("")),
    ruc: z.string().length(11, "El RUC debe tener exactamente 11 dígitos").regex(/^\d+$/, "El RUC debe contener solo números"),
    razon_social: z.string().min(3, "La razón social o nombre comercial es muy corto"),
    direccion: z.string().optional().nullable().or(z.literal("")),
    telefono: z.string().optional().nullable().or(z.literal("")),
    correo: z.string().email("Correo no válido").optional().nullable().or(z.literal("")),
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
    }
  });

export type CrearEmpresaTransporteRequest = z.infer<typeof Schema_CrearEmpresaTransporte>;
