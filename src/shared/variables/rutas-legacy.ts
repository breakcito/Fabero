/**
 * Rutas legacy del arbol de navegacion anidado
 * (`/configuracion/...` y `/operaciones/...`).
 *
 * Cuando se aplo el arbol (el `path` de cada nodo paso a ser la ruta
 * completa de la vista), los enlaces guardados con la estructura anterior
 * dejaron de funcionar. Estas rutas se mantienen como alias y redirigen a
 * la ruta plana equivalente.
 *
 * Se exportan desde aqui para que tanto el router (App.tsx) como la
 * validacion de autorizacion (useAuthUser) usen el mismo mapa.
 */
export const RUTAS_LEGACY: Record<string, string> = {
  // Configuracion
  "/configuracion/empresas/empresas": "/empresas",
  "/configuracion/empresas/sucursales": "/sucursales",
  "/configuracion/personal/areas_cargos": "/areas_cargos",
  "/configuracion/personal/trabajadores": "/trabajadores",
  "/configuracion/usuarios/roles": "/roles",
  "/configuracion/usuarios/cuentas": "/cuentas",
  "/configuracion/socios-comerciales/proveedores-mineros": "/proveedores-mineros",
  "/configuracion/socios-comerciales/planta": "/condiciones-comerciales-planta",
  "/configuracion/socios-comerciales/proveedor":
    "/condiciones-comerciales-proveedor",
  "/configuracion/socios-comerciales/plantas-destino": "/plantas-destino",
  "/configuracion/socios-comerciales/empresas-transporte": "/empresas-transporte",
  "/configuracion/empresa-transporte/conductores": "/conductores",
  "/configuracion/empresa-transporte/vehiculos": "/vehiculos",
  // Operaciones
  "/operaciones/vigilancia/recepcion-unidades": "/recepcion-unidades",
  "/operaciones/vigilancia/recepcion-visitas": "/recepcion-visitas",
  "/operaciones/vigilancia/programar-recepcion": "/programar-recepcion",
  "/operaciones/balanza/recepcion-mineral": "/recepcion-mineral",
  "/operaciones/balanza/validacion-distribucion": "/validacion-distribucion",
  "/operaciones/balanza/resumen-balanza": "/resumen-balanza",
  "/operaciones/guias/primer-tramo": "/primer-tramo",
  "/operaciones/leyes/cierre-leyes": "/cierre-leyes",
  "/operaciones/anticipos/proveedor": "/anticipos-proveedor",
  "/operaciones/anticipos/planta": "/anticipos-planta",
  "/operaciones/valorizacion/compra": "/compra",
  "/operaciones/valorizacion/venta": "/venta",
  "/operaciones/contabilidad/contabilidad": "/contabilidad",
  "/operaciones/blending/blending": "/blending",
  "/operaciones/despacho/programacion": "/programacion",
};
