/**
 * Canales y eventos de WebSocket (Laravel Reverb).
 *
 * Los nombres deben coincidir EXACTAMENTE con los del backend:
 *
 * | Frontend                     | Backend                                              |
 * |------------------------------|------------------------------------------------------|
 * | `SOCKET_UNIDADES_PESAR.canal` | `App\Events\UnidadesParaPesarActualizadas::CANAL`   |
 * | `SOCKET_UNIDADES_PESAR.evento`| `App\Events\UnidadesParaPesarActualizadas::EVENTO`  |
 *
 * El canal es público: el backend no registra `Broadcast::routes()`, asi que
 * no hay paso de autenticacion del socket (igual que `global-audit-mode`).
 */
export const SOCKET_UNIDADES_PESAR = {
  canal: "balanza-unidades",
  evento: "unidades.para.pesar.actualizadas",
} as const;
