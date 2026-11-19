/**
 * Ruta de la SPA protegida por cada permiso específico de usuario.
 *
 * Se usa en `useAuthUser` para bloquear la navegación cuando el permiso
 * está explícitamente denegado (`decision: false`). Los códigos que no
 * aparecen aquí no restringen la navegación.
 */
export const PERMISO_POR_RUTA: Record<string, string> = {
  "/home": "ver_dashboard",
};
