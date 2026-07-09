# Walkthrough - Ciclo de Vida y Mejoras en Guías de Primer Tramo

Se han realizado mejoras de usabilidad, diseño responsivo, lógica matemática de pesaje y administración de ciclo de vida (edición, visor de evidencias y anulación) en las Guías de Primer Tramo.

## Cambios Realizados

### 1. Ciclo de Vida en Guías de Primer Tramo (Backend)
- **Archivos Modificados**:
  - [GuiasPrimerTramoEndpoints.php](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/FaberoAPI/app/Modules/GuiasPrimerTramo/GuiasPrimerTramoEndpoints.php): Registro de rutas POST `/guias-primer-tramo/{id}/update` (para evadir la limitación de Laravel parseando multipart/form-data con PUT) y PATCH `/guias-primer-tramo/{id}/anular`.
  - [GuiasPrimerTramoController.php](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/FaberoAPI/app/Modules/GuiasPrimerTramo/Controllers/GuiasPrimerTramoController.php): Métodos `actualizar_guia` y `anular_guia` para validar solicitudes y llamar a los servicios.
  - [GuiasPrimerTramoService.php](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/FaberoAPI/app/Modules/GuiasPrimerTramo/Services/GuiasPrimerTramoService.php): 
    - Lógica de sincronización de evidencias (conserva previas no eliminadas, sube nuevas) y sincronización inteligente de lotes en la tabla `lote_guia` manteniendo correlativos.
    - Lógica de anulación estableciendo el estado a `Inactivo`.
  - [GuiasPrimerTramoData.php](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/FaberoAPI/app/Modules/GuiasPrimerTramo/Data/GuiasPrimerTramoData.php): Selección del campo `gpt.estado` en las consultas.

### 2. Frontend de Guías de Primer Tramo (React / TypeScript)
- **Archivos Modificados**:
  - [guias-primer-tramo.responses.ts](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/service/guias-primer-tramo.responses.ts): Agregado campo `estado` (de tipo `EstadoBase`).
  - [guias-primer-tramo.requests.ts](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/service/guias-primer-tramo.requests.ts): Definida interfaz `DTO_ActualizarGuiaPrimerTramo`.
  - [guias-primer-tramo.service.ts](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/service/guias-primer-tramo.service.ts): Métodos `actualizar_guia` (multipart con archivos y JSON de lotes) y `anular_guia`.
  - [useGuiasPrimerTramo.ts](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/hooks/useGuiasPrimerTramo.ts): Métodos `actualizarGuia` y `anularGuia` expuestos con notificaciones.
  - [modal-guia-primer-tramo.tsx](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/presentation/components/modal-guia-primer-tramo.tsx):
    - Soporte para inicializar los estados del formulario en base a la prop `guia` cuando se abre en modo edición.
    - Envío automático al endpoint correspondiente (creación o actualización) con mapeo de lotes y archivos.
    - Soporte para evidencias previas en `MultiFilePicker` para removerlas interactivamente.
  - [guias-primer-tramo.page.tsx](file:///c:/Users/bruce/OneDrive/Documentos/GitHub/Fabero/Fabero/src/modules/guias-primer-tramo/presentation/guias-primer-tramo.page.tsx):
    - Columna **Evidencias**: Botón para abrir un visor estándar con tarjetas de archivo (`ArchivoCard`) si existen evidencias registradas.
    - Columna **Estado**: Badge activo/anulada usando el enum `EstadoBase`.
    - Columna **Acciones**: Botones de Editar y Anular (deshabilitados si la guía ya fue anulada). Confirmación de anulación vinculada a nuestro modal global de confirmación.

### 3. Ajustes Previos
- **Lógica de Cascada de Pesos**: Ajustes bidireccionales en el reordenamiento/edición de lotes de guías de primer tramo.
- **Selectores de Recepción Mineral**: Removida autoselección inicial en modal de peso inicial.
- **Ajuste de Cabecera**: Alineado el botón "+" en la sección de unidades planta sin deformar la cabecera.

---

## Verificación Realizada
- La sincronización de lotes y archivos persistidos se ejecuta en base de datos.
- Las validaciones y notificaciones de éxito/error se presentan en pantalla.
- Las guías anuladas se bloquean de posteriores modificaciones en la interfaz.
