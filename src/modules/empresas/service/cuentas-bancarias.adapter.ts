import type { CuentasBancariasAdapter } from "../../../shared/interfaces/cuenta-bancaria";
import type { CrearCuentaBancariaPayload } from "../../../shared/interfaces/cuenta-bancaria";
import { EmpresasService } from "./empresas.service";
import type {
  CuentaBancariaEmpresaResponse,
  RES_Empresa,
} from "./empresas.responses";

export const empresaCuentasAdapter: CuentasBancariasAdapter<
  CuentaBancariaEmpresaResponse,
  RES_Empresa
> = {
  parentIdField: "id_empresa",
  getParentId: (e) => e.id_empresa,
  getEntityLabel: (e) => e.razon_social,
  fetchCuentas: (id) => EmpresasService.getCuentasBancarias(id),
  crearCuenta: (id: number, payload: CrearCuentaBancariaPayload) =>
    EmpresasService.crearCuentaBancaria({ ...payload, id_empresa: id }),
  editarCuenta: (id, payload) =>
    EmpresasService.editarCuentaBancaria(id, payload),
  cambiarEstado: (id, estado) =>
    EmpresasService.cambiarEstadoCuentaBancaria(id, estado),
  eliminar: (id) => EmpresasService.eliminarCuentaBancaria(id),
};
