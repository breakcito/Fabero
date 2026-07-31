import type {
  CuentasBancariasAdapter,
  CrearCuentaBancariaPayload,
} from "../../../shared/interfaces/cuenta-bancaria";
import { PlantasDestinoService } from "./plantas-destino.service";
import type {
  CuentaBancariaPlantaResponse,
  PlantaDestinoResponse,
} from "./plantas-destino.responses";

export const plantaCuentasAdapter: CuentasBancariasAdapter<
  CuentaBancariaPlantaResponse,
  PlantaDestinoResponse
> = {
  parentIdField: "id_planta_destino",
  getParentId: (p) => p.id,
  getEntityLabel: (p) => p.razon_social,
  fetchCuentas: (id) => PlantasDestinoService.getCuentasBancarias(id),
  crearCuenta: (id: number, payload: CrearCuentaBancariaPayload) =>
    PlantasDestinoService.crearCuentaBancaria({
      ...payload,
      id_planta_destino: id,
    }),
  editarCuenta: (id, payload) =>
    PlantasDestinoService.editarCuentaBancaria(id, payload),
  cambiarEstado: (id, estado) =>
    PlantasDestinoService.cambiarEstadoCuentaBancaria(id, estado),
};
