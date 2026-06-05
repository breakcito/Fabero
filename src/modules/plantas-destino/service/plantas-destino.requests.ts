import { Moneda } from "../../../shared/enums/_generic/moneda";
import { z } from "zod";

export const Schema_CrearPlantaDestino = z.object({
  ruc: z
    .string()
    .length(11, "El RUC debe tener exactamente 11 dígitos")
    .regex(/^\d+$/, "El RUC debe contener solo números"),
  razon_social: z.string().min(3, "La razón social es muy corta"),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  correo: z.string().email("Correo no válido").optional().or(z.literal("")).nullable(),
});
export type CrearPlantaDestinoRequest = z.infer<typeof Schema_CrearPlantaDestino>;

export const Schema_CrearCuentaPlanta = z.object({
  id_planta_destino: z.number().min(1, "Seleccione una planta destino"),
  id_banco: z.number().min(1, "Seleccione un banco válido"),
  moneda: z.nativeEnum(Moneda),
  numero_cuenta: z.string().min(1, "El número de cuenta es requerido"),
  cci: z.string().optional().nullable(),
  es_para_detraccion: z.number(), // 1 o 0
});
export type CrearCuentaPlantaRequest = z.infer<typeof Schema_CrearCuentaPlanta>;

export const Schema_EditarCuentaPlanta = z.object({
  id_banco: z.number().min(1, "Seleccione un banco válido"),
  moneda: z.nativeEnum(Moneda),
  numero_cuenta: z.string().min(1, "El número de cuenta es requerido"),
  cci: z.string().optional().nullable(),
  es_para_detraccion: z.number(), // 1 o 0
});
export type EditarCuentaPlantaRequest = z.infer<typeof Schema_EditarCuentaPlanta>;
