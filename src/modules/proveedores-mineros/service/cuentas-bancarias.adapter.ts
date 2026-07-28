import type {
  CuentasBancariasAdapter,
  CuentaBancariaItem,
  CrearCuentaBancariaPayload,
} from "../../../shared/interfaces/cuenta-bancaria";
import { ProveedoresService } from "./proveedores.service";
import type {
  ProveedorResponse,
  CuentaBancariaResponse,
} from "./proveedores.responses";

export const proveedorCuentasAdapter: CuentasBancariasAdapter<
  CuentaBancariaResponse,
  ProveedorResponse
> = {
  parentIdField: "id_proveedor",
  getParentId: (p) => p.id_proveedor,
  getEntityLabel: (p) => p.razon_social,
  fetchCuentas: (id) => ProveedoresService.getCuentasBancarias(id),
  crearCuenta: (id: number, payload: CrearCuentaBancariaPayload) =>
    ProveedoresService.crearCuentaBancaria({
      ...payload,
      id_proveedor: id,
    }),
  editarCuenta: (id, payload) =>
    ProveedoresService.editarCuentaBancaria(id, payload),
  cambiarEstado: (id, estado) =>
    ProveedoresService.cambiarEstadoCuentaBancaria(id, estado),
  eliminar: (id) => ProveedoresService.eliminarCuentaBancaria(id),
};

// Tipado auxiliar para que el componente genérico acepte CuentaBancariaItem.
export type ProveedorCuentaBancariaItem = CuentaBancariaItem;
