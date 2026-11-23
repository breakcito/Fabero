export interface DTO_DashboardFiltros {
  /** Sucursal a la que se restringe la recepción de mineral. */
  id_sucursal?: number | null;
  /** Proveedor minero: acota las TN recepcionadas a ese proveedor. */
  id_proveedor_minero?: number | null;
  /** Planta de destino: acota las TN despachadas a esa planta. */
  id_planta_destino?: number | null;
}
