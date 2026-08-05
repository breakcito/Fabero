# Fabero — Frontend

Frontend del ERP para una planta de beneficio de mineral de oro y plata. Maneja compra, recepción, análisis, blending, valorización, contabilidad y despacho de mineral. La lógica de negocio vive en la API (ver `../FaberoAPI/README.md`).

## Módulos

Empresas, Sucursales, Bancos, Marcas, Organigrama, Personal, Roles, Cuentas, Perfil, Login, Modo Auditoría, Proveedores Mineros, Concesiones, Condiciones Comerciales Proveedor, Anticipos Proveedor, Cuentas Bancarias (Proveedor / Empresa / Planta Destino), Empresas Transporte, Vehículos, Conductores, Encargados de Muestra, Recepción Visitas, Guías Primer Tramo, Recepción Mineral, Recepción Unidades, Resumen Balanza, Gestión de Leyes, Cierre de Leyes, Blending, Valorización Compra, Contabilidad Compra, Plantas Destino, Tipo de Cambio, Ubigeo.

## Stack

- React 19 (con Babel React Compiler) + Vite 7
- Mantine v8 (Core, Dates, Charts, Notifications, Modals, Tiptap, etc.)
- Zustand v5 para estado global
- React Router v7
- Axios con interceptor JWT (auto-logout en 401)
- Zod para validación
- Tailwind CSS v4
- Animaciones: Motion, GSAP, Anime.js
- PDF/Excel: `@react-pdf/renderer`, `exceljs`
- WebSockets: Laravel Echo + Pusher

## Estructura

Igual que el resto de proyectos del workspace:

```
src/
├── hooks/                 # transversales (useAuthUser, useNotify, useExcel, useJsonScanner...)
├── modules/<dominio>/     # cada módulo: hooks/ + presentation/ + service/
│   └── service/
│       ├── requests.ts    # DTOs de envío
│       ├── responses.ts   # DTOs de respuesta
│       └── service.ts     # métodos API
├── presentation/
│   ├── layouts/           # public, auth, generic
│   ├── pages/             # home, placeholder
│   ├── root/              # App, main, ProtectedRoute, PublicRoute
│   └── utils/             # DataTableEstandar, ModalEstandar, JsonScanner, forms, PDF, Excel, Printer, CambiosLogViewer
├── service/               # _api, _socket, auxiliar, archivo, menu-nav, responses/
├── shared/
│   ├── enums/             # mapeo 1:1 de PHP Backed Enums
│   ├── functions/         # cn (tw-merge), formatNumber, get-coincidencias, en-plural
│   ├── interfaces/        # _response y contratos
│   └── variables/         # meses, monedas, íconos
└── stores/                # auth, menu, ui, auditoria, excel, printer, blackcito
```

## Componentes base (`src/presentation/utils`)

- **`DataTableEstandar`**: grilla maestra (envuelve `mantine-datatable`). Props: `columns`, `records`, `loading`, `idAccessor?`, `initialPageSize=25`, `columnGroups?`. Estilo dark consistente. **Única excepción al uso de `any` por diseño genérico.** Indexado automático con `{accessor: "index", title: "#"}`. Genera UUIDs estables para `id`/`accessor` omitidos.
- **`ModalEstandar`**: wrapper de `Modal` con layout premium. Props: `opened`, `close`, `title`, `children`, `rightSection?`, `validateClose?` (abre confirmación al cerrar), `closeConfirmationTitle?`, `closeConfirmationMessage?`. Si `validateClose`, Enter se mantiene en "Cancelar".
- **`JsonScanner`**: input compacto para códigos de barras.
- **`date-picker-input`**: selector de fechas unificado.
- **`form-{marca,tipo-vehiculo,zona-origen,...}.tsx`**: formularios auto-contenidos para crear catálogos en procesos concurrentes.
- **`archivo/`**: `archivo-card.tsx` (visualización + descarga) y `multifile-picker.tsx` (drag & drop con `File[]` nuevos + `IArchivo[]` existentes).
- **`excel/GlobalExcelPortal`**: portal flotante para colas de exportación pesadas.
- **`printer/GlobalPrinterPortal`**: cola de impresión de vales físicos.
- **`cambios-log-viewer.tsx`**: visualizador unificado de `RES_CambiosLog[]` para historiales de auditoría.
- **`modal-confirmacion.tsx`**: diálogo de confirmación para acciones destructivas.
- **Plantillas PDF** (varias): generadores con `@react-pdf/renderer`.

## Hooks globales (`src/hooks`)

- `useAuthUser` — sesión, login, logout, permisos reactivos.
- `useNotify` — `notifySuccess` / `notifyError` / `notifyInfo`.
- `useMenuNav` — carga y filtra el menú por rol.
- `useExcel` — generación asíncrona de Excel.
- `usePrint` / `useDownloadFile` — impresión y descarga.
- `useJsonScanner` — parsing de QR/códigos.
- `useTitlePage` — sincroniza `<title>` con módulo activo.
- `useBlackcito` — asistente animado.

## Servicios (`src/service`)

- **`_api.ts`** — Axios con interceptor JWT. Inyecta `Bearer` automático. En 401 limpia auth/menu/perfil y notifica.
- **`_socket.ts`** — Laravel Echo + Pusher para eventos tiempo real (ej. Modo Auditoría).
- **`auxiliar.service.ts`** — hub de catálogos compartidos.
- **`archivo.service.ts`** — gestión de adjuntos.
- **`menu-nav.service.ts`** — árbol de menús por rol.
- **`responses/`** — interfaces TypeScript que mapean al 100% las respuestas HTTP de la API.

## Reglas de código

1. **Sin `any`**. Excepción única: `DataTableEstandar`.
2. **Sin reutilización forzada**. Registrar y Editar son hooks/componentes separados si tienen reglas distintas.
3. **Formularios**: `useState` + helper `setField` + `Schema.safeParse()` con Zod. NO `useForm` de Mantine salvo que el módulo ya lo use.
4. **Notificaciones**: SIEMPRE `useNotify()`. Prohibido `@mantine/notifications` directo.
5. **Style Props de Mantine v8** (`c`, `bg`, `fz`, `fw`, `p`, `m`, `gap`, `justify`, `align`, etc.). NUNCA `sx` ni nombres CSS completos como prop.
6. **Paleta válida Mantine v8**: `dark, gray, red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange` con tinte `.0`–`.9` (default `.6`). `indigo` es primario; `yellow` reemplaza "amber" para advertencias; `teal` para PEN. Otros nombres (`amber`, `gold`, `crimson`, `silver`) se ignoran silenciosamente.
7. **Inputs**: `size="xs"` y `radius="lg"` en `TextInput`, `Select`, `NumberInput`, `Button`. `Select`/`MultiSelect` con `searchable`; dentro de `Modal` añadir `popoverProps={{ withinPortal: true }}`. `NumberInput` con `hideControls` en tablas y `fixedDecimalScale` para montos.
8. **Estilo dark premium**: inputs `bg-zinc-900/50 border-zinc-800`, focus `border-zinc-300 ring-zinc-300`. Sombras suaves (`shadow-lg shadow-indigo-900/20`), `backdrop-blur`. Badges `variant="light"` o `filled"`.
9. **DataTable `#` automático**: `{accessor: "index", title: "#"}`. NUNCA `render` para el número correlativo.
10. **ActionIcon**: `size` controla el botón, NO el ícono. Para íconos visibles usar `size="md"`+ y tamaño manual del ícono (`className="w-4 h-4"` o `size={16}`).

## Loading States en mutaciones asíncronas (regla crítica)

Toda acción que dispare POST/PUT/DELETE **debe** indicar visualmente que está en curso. Aplica a botones, ActionIcons y selects con catálogo asíncrono.

### Botones de mutación

- **Submit de formulario**: `loading={loading}` del hook, sin estado local redundante.
  ```tsx
  const { payload, submit, loading } = useRegistroX(onSuccess);
  <Button type="submit" loading={loading} ...>Guardar</Button>
  ```
- **Acciones por fila en tabla** (toggle, eliminar, anular, imprimir): usar `loadingById` / `togglingIds: Record<number, boolean>` en el hook para que múltiples clics no spameen la API.
  ```tsx
  <ActionIcon
    loading={togglingIds[r.id]}
    disabled={togglingIds[r.id]}
    onClick={() => toggleEstado(r.id)}
  />
  ```
- **Botones en sub-modales** (ej. "Agregar a la Lista"): requieren su propio `useState` local si la promesa no la gestiona el hook padre.
- **Modales de confirmación**: `modal-confirmacion.tsx` debe esperar la promesa (`onConfirm: () => void | Promise<void>`) antes de cerrar. Su firma actual es síncrona — está **prohibido** usarla para mutaciones sin refactorizar primero.

### Selects / MultiSelect con catálogo asíncrono

Cualquier `<Select>` cuyo `data` provenga de un fetch asíncrono **debe** mostrar:

1. `disabled={loadingX}` mientras carga.
2. `rightSection={<Loader size={16} />}` cuando `loadingX === true`.
3. `placeholder` dinámico ("Cargando..." vs "Seleccione").

```tsx
<Select
  label="Proveedor"
  placeholder={loadingProveedores ? "Cargando..." : "Seleccione"}
  disabled={loadingProveedores}
  rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
  data={proveedores.map((p) => ({
    value: String(p.id),
    label: p.razon_social,
  }))}
/>
```

**Excepción**: `<Select>` cuyo `data` viene de un enum estático local (ej. `Object.values(TipoIngreso)`) no requiere Loader.

### Referencias de implementación

- Botón submit + loading: `src/modules/login/presentation/login.page.tsx:210`
- Toggle per-row con `togglingIds`: `src/modules/conductores/presentation/conductores-page/components/conductor.tsx:127`
- Select con Loader: `src/modules/vehiculos/presentation/registro-vehiculo/registro-vehiculo.tsx:84-100`
- Hook con varios loading flags: `src/hooks/useExcel.ts:5`

## Componentes transversales obligatorios

- **Trazabilidad (`CambiosLogViewer`)**: todo modal/componente de historial de auditoría **DEBE** usar `src/presentation/utils/cambios-log-viewer.tsx` alimentado por `RES_CambiosLog[]` (estructura: `{id_empleado, motivo, update_at, cambios[{campo_bd, campo, valor_anterior, valor_nuevo}]}`). El contrato viene del backend (`App\Shared\Responses\_Generic\RES_CambiosLog`).
- **Adjuntos**:
  - Formularios (registro/edición) → `MultiFilePicker` (soporta `File[]` nuevos + `IArchivo[]` existentes).
  - Visualización/descarga en modales o listas → `ArchivoCard` (preview de imágenes + descarga).

## Catálogo Mantine v8 (instalado)

Solo se pueden usar estos. Si falta uno, **avisar antes de instalar**.

### Componentes core

- **Layout**: AppShell, AspectRatio, Center, Container, Flex, Grid, Group, SimpleGrid, Space, Stack
- **Inputs**: AngleSlider, Checkbox, Chip, ColorInput, ColorPicker, Fieldset, FileInput, Input, JsonInput, NativeSelect, NumberInput, PasswordInput, PinInput, Radio, RangeSlider, Rating, SegmentedControl, Slider, Switch, Textarea, TextInput
- **Combobox**: Autocomplete, MultiSelect, Pill, PillsInput, Select, TagsInput
- **Buttons**: ActionIcon, Button, CloseButton, CopyButton, FileButton, UnstyledButton
- **Navigation**: Anchor, Breadcrumbs, Burger, NavLink, Pagination, Stepper, TableOfContents, Tabs, Tree
- **Feedback**: Alert, Loader, Notification, Progress, RingProgress, SemiCircleProgress, Skeleton
- **Overlays**: Affix, Dialog, Drawer, FloatingIndicator, HoverCard, LoadingOverlay, Menu, Modal, Overlay, Popover, Tooltip
- **Data display**: Accordion, Avatar, BackgroundImage, Badge, Card, ColorSwatch, Image, Indicator, Kbd, NumberFormatter, Spoiler, ThemeIcon, Timeline
- **Typography**: Blockquote, Code, Highlight, List, Mark, Table, Text, Title
- **Misc**: Box, Collapse, Divider, FocusTrap, Paper, Portal, ScrollArea, Transition, VisuallyHidden

### Extensiones

- **Dates**: MiniCalendar, Calendar, DateTimePicker, DatePicker, DatePickerInput, DateInput, MonthPicker, MonthPickerInput, YearPicker, YearPickerInput, TimeInput, TimePicker, TimeGrid, TimeValue
- **Charts**: AreaChart, BarChart, LineChart, CompositeChart, DonutChart, PieChart, FunnelChart, RadarChart, ScatterChart, BubbleChart, RadialBarChart, Sparkline, Heatmap
- **Otras**: CodeHighlight, Notifications, Spotlight, Carousel, Dropzone, NavigationProgress, Modals manager, Rich text editor (Tiptap)

### Hooks (@mantine/hooks)

- **UI/Dom**: use-click-outside, use-color-scheme, use-element-size, use-event-listener, use-file-dialog, use-focus-return, use-focus-trap, use-focus-within, use-fullscreen, use-hotkeys, use-hover, use-in-viewport, use-intersection, use-long-press, use-media-query, use-mouse, use-move, use-mutation-observer, use-orientation, use-radial-move, use-reduced-motion, use-resize-observer, use-scroll-into-view, use-scroll-spy, use-viewport-size, use-window-event, use-window-scroll
- **State**: use-counter, use-debounced-callback, use-debounced-state, use-debounced-value, use-disclosure, use-id, use-input-state, use-list-state, use-local-storage, use-map, use-pagination, use-previous, use-queue, use-selection, use-set, use-set-state, use-state-history, use-throttled-callback, use-throttled-state, use-throttled-value, use-toggle, use-uncontrolled, use-validated-state
- **Utilities**: use-clipboard, use-document-title, use-document-visibility, use-eye-dropper, use-favicon, use-fetch, use-hash, use-headroom, use-idle, use-interval, use-merged-ref, use-network, use-os, use-page-leave, use-text-selection, use-timeout
- **Lifecycle**: use-did-update, use-force-update, use-is-first-render, use-isomorphic-effect, use-logger, use-mounted, use-shallow-effect

## Ejecución

```bash
npm install
npm run dev
```

## Reglas para IA

1. **Leer este README completo antes de actuar.** Es la fuente de verdad del front. Si el usuario da contexto que contradice esto, avisar antes de cambiar nada.
2. **Verificar versiones en `package.json`** antes de usar APIs de librerías. Si hay duda sobre comportamiento actual, **buscar en internet** — el entrenamiento del modelo puede estar desactualizado o diferir con docs vigentes.
3. **No commitear ni hacer push** sin que el usuario lo pida explícitamente.
4. **No inventar componentes**. Solo usar los del "Catálogo Mantine v8". Si falta uno, preguntar antes de instalar.
5. **Respetar las "Reglas de código"** y la sección "Loading States en mutaciones asíncronas" — esta última es regla del proyecto, no opcional.
6. **Cuestionar reusos forzados**. Si piden "un componente que sirva para X e Y", proponer separar antes.
7. **Aplicar las reglas aunque el código existente las viole** (con autorización del usuario). Si ves un botón sin `loading`, un Select con `data` asíncrono sin Loader, un `useForm` en un módulo nuevo, un historial que no usa `CambiosLogViewer`, un formulario con adjuntos que no usa `MultiFilePicker`, etc.: corregirlo. Si la refactorización es grande, proponer un plan antes.
8. Después de cualquier cambio: `npm run build` (tsc + vite build; no confiar solo en `tsc --noEmit`).
