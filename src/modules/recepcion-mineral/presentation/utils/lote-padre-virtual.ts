import type {
  RecepcionMineralResponse,
  RES_LoteMineral,
  RES_ParticionBalanza,
} from "../../service/recepcion-mineral.responses";

/**
 * Construye un lote padre "virtual" con los campos heredados que el backend
 * hidrata en cada partición.
 *
 * Se usa para pasar a `ModalPesoInicial` / `ModalPesoFinal`, que requieren un
 * `RES_LoteMineral` completo aunque el objetivo real sea una partición.
 *
 * `idProveedorUnidad` es el proveedor de la UNIDAD donde vive la partición
 * (`particion.id_recepcion_unidad`). Permite que el modal autocomplete el
 * proveedor desde la unidad destino, no desde el lote padre original.
 *
 * Cascada de proveedor (`resolverProveedorInicial`):
 *   1. proveedor de la carga del lote
 *   2. proveedor principal de la unidad
 *   3. null
 */
export const buildLotePadreVirtual = (
  idLotePadre: number,
  p: RES_ParticionBalanza,
  idProveedorUnidad: number | null,
  unidad: RecepcionMineralResponse | null,
): RES_LoteMineral => ({
  id: idLotePadre,
  id_recepcion_unidad: null,
  id_empleado_registro: 0,
  correlativo: p.lote_correlativo ?? "",
  numero_correlativo: null,
  id_proveedor_minero: p.id_proveedor_minero ?? idProveedorUnidad ?? null,
  id_proveedor_minero_recepcion:
    idProveedorUnidad ?? unidad?.id_proveedor_minero ?? null,
  // Proveedores de la carga de la unidad: el modal de pesaje los sugiere
  // PRIMERO en el selector de proveedor.
  proveedores_recepcion: unidad?.proveedores ?? [],
  id_zona_origen: p.id_zona_origen ?? null,
  numero_contacto: p.numero_contacto ?? null,
  tipo_producto: p.tipo_producto ?? null,
  tipo_mineral: p.tipo_mineral ?? null,
  condicion_ingreso: null,
  evidencias: null,
  // Pesos reales de LA PARTICIÓN (no del lote virtual) para que ModalPesoFinal
  // los muestre correctamente al reusarse con targetIdOverride.
  peso_inicial: p.peso_inicial ?? null,
  fecha_hora_peso_inicial: p.fecha_hora_peso_inicial ?? null,
  observacion_peso_inicial: null,
  peso_final: p.peso_final ?? null,
  fecha_hora_peso_final: p.fecha_hora_peso_final ?? null,
  observacion_peso_final: null,
  peso_neto: p.peso_neto ?? null,
  peso_actual: null,
  id_vehiculo: null,
  vehiculo_placa: null,
  id_empresa_transporte: null,
  empresa_transporte_razon_social: null,
  id_tipo_vehiculo: null,
  tipo_vehiculo_nombre: null,
  id_conductor: null,
  conductor_nombre_completo: null,
  conductor_dni: null,
  created_at: p.fecha_hora_peso_inicial ?? "",
  particionado_desde_balanza: true,
  particion_finalizada: false,
  id_empleado_fin_particion: null,
  fecha_hora_fin_particion: null,
  tiene_particiones: true,
  observaciones: p.observaciones ?? null,
});
