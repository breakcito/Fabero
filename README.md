# Contexto de Negocio y Procesos Operativos

Este sistema es un ERP diseñado específicamente para resolver los desafíos de compra y venta de mineral de una planta de beneficio.

A continuación, se detalla **qué hace el sistema por los usuarios** y la lógica de negocio que resuelve.

---

## 1. Estructura Organizativa y Operativa

El sistema necesita mapear quién opera, dónde está el inventario y dónde se consumen los recursos:

- **Empresas y Empleados**: Gestiona las entidades corporativas. El personal administrativo y logístico que usa el software (usuarios con cuentas de acceso y roles) se vincula a una **Empresa** matriz.

---

## 📦 Módulos del Sistema

### Configuración

- `empresas`
- `proveedores-mineros`

### Personal y Accesos

- `organigrama`
- `personal`
- `roles`
- `cuentas`
- `login`
- `perfil`

---

## 🚀 Stack Tecnológico

### Core & Framework

- **React 19** (con Babel React Compiler) y **Vite 7**.
- **Zustand v5**: Gestión de estado global atómica.
- **React Router v7**: Enrutamiento jerárquico.
- **Zod**: Validación de esquemas y contratos de datos.
- **Axios**: Comunicación con la API mediante instancia centralizada e interceptores.

### Interfaz de Usuario (Mantine v8)

- **Componentes**: Core, Dates, Notifications, Modals, Charts, Carousel, Spotlight, Dropzone, Tiptap, NProgress.
- **Iconografía**: Tabler Icons, Lucide, Heroicons.
- **Estilos**: Tailwind CSS v4.

### Visuales & Multimedia

- **Animaciones**: Motion v12, GSAP, Anime.js.
- **Multimedia**: Lottie (JSON animations), Howler y use-sound (Feedback sonoro operativo).

### Herramientas de Reporte y Búsqueda

- **Documentos y Exportación**: `@react-pdf/renderer` (Generación de PDF en cliente), `exceljs` (Generación asíncrona de reportes Excel estilizados), `react-to-print`, `html-to-image`.
- **Motores de Búsqueda**: FlexSearch (Tokenización) y Fuse.js (Fuzzy search).
- **Utilidades**: Dayjs (Fechas), QRCode, Pluralize.

---

## 📂 Estructura del Proyecto

### `/src` - Directorios Globales

#### 1. Hooks Globales (`/src/hooks`)

Ganchos personalizados que proveen estado y lógica de comportamiento transversal en todo el ERP.

- **`useAuthUser.ts`**: Gestión de estado de sesión, inicio/cierre de sesión, y comprobación reactiva de permisos del usuario.
- **`useNotify.ts`**: Envoltorio de notificaciones nativas Mantine v8 unificado. Ofrece `notifySuccess` y `notifyError` asegurando la estética visual consistente.
- **`usePrint.ts` / `useDownloadFile.ts`**: Utilidades para descarga asíncrona de reportes y cola de impresión local.
- **`useExcel.ts`**: Manejo asíncrono y en segundo plano de generación de archivos de cálculo Excel.
- **`useJsonScanner.tsx`**: Hook integrado para el procesamiento e interpretación de datos capturados por hardware externo (lectores de código de barras).
- **`useMenuNav.ts`**: Administra la carga y filtrado de enlaces de navegación en base al rol autenticado.
- **`useTitlePage.ts`**: Mantiene sincronizado el título de la pestaña del navegador con el módulo activo.
- **`useBlackcito.ts`**: Gancho dinámico para el asistente animado del ERP (Blackcito).

#### 2. Componentes de UI Reutilizables (`/src/presentation/utils`)

Componentes visuales puros y layouts genéricos de alta calidad Mantine v8.

- **`DataTableEstandar.tsx`**: Grilla maestra unificada para visualización de registros con ordenamiento, paginación reactiva, filtros y modo auditoría integrado.
- **`ModalEstandar.tsx`**: Componente contenedor para modales de edición o registro dinámico de formularios.
- **`JsonScanner.tsx`**: Interfaz de escaneo de códigos de barra para ingreso masivo de ítems.
- **`date-picker-input.tsx`**: Selector de fechas unificado (`CustomDatePicker`) alineado al diseño de inputs ERP.
- **`form-marca.tsx`**: Formulario modular auto-contenido para creación rápida de marcas de unidades vehiculares en procesos concurrentes.
- **`archivo/` (`archivo-card.tsx`, `multifile-picker.tsx`)**: Utilidades visuales para visualización, carga drag & drop y borrado de documentos adjuntos.
- **`excel/` (`GlobalExcelPortal.tsx`)**: Portal flotante global que gestiona colas de exportación pesadas sin congelar el hilo principal.
- **`printer/` (`GlobalPrinterPortal.tsx`)**: Servicio global que administra la cola de impresión de documentos y vales físicos.

#### 3. Capa de Servicios de Red (`/src/service`)

Instancia de comunicación REST y servicios auxiliares con el backend.

- **`_api.ts`**: Interceptor maestro de Axios. Inyecta tokens Bearer JWT de forma automática y normaliza las respuestas en base a la interfaz de éxito o fallo corporativo.
- **`_socket.ts`**: Cliente WebSocket unificado (Laravel Echo + Pusher) para canalizar eventos en tiempo real como el cambio global del Modo Auditoría.
- **`auxiliar.service.ts`**: **Hub de Datos Maestros.** Cachea y provee catálogos compartidos de marcas, personal, proveedores, entre otros, evitando llamadas repetitivas.
- **`archivo.service.ts` / `menu-nav.service.ts`**: Gestión física de adjuntos y descarga de árbol de menús estructurados.
- **Subcarpeta `responses/`**: Contratos e interfaces TypeScript (`.ts`) que mapean al 100% de tipado estricto las respuestas HTTP devueltas por la API de Laravel módulo por módulo.

#### 4. Recursos Compartidos (`/src/shared`)

Estructura fundacional, tipos globales, constantes y algoritmos lógicos puros del ERP.

- **`enums/`**: Mapeo completo de Backed Enums de PHP a enums TypeScript, divididos de forma estricta.
- **`enums/_generic/`**: Enums base y transversales (`tipo-bien.ts`, `moneda.ts`, `periodo.ts`).
- **`interfaces/`**: Interfaces genéricas de formato de API (`_response.ts`) e información de archivos.
- **`variables/`**: Mapeadores y arrays estáticos de soporte visual (`meses.ts`, `monedas.ts`, `iconos-menu-navegacion.ts`).
- **`functions/` (Algoritmos Genéricos)**:
  - **`cn.ts`**: Combinador inteligente de clases Tailwind CSS (`tailwind-merge`).
  - **`en-plural.ts`**: Algoritmo avanzado de pluralización en español (excepciones de tildes y terminaciones).
  - **`formatNumber.ts`**: Formateador decimal de precisión financiera.
  - **`get-coincidencias.ts`**: Buscador difuso (Fuzzy Search con Fuse.js) y tokenizado por palabras (FlexSearch).
  - **`get-duracion-periodo.ts` / `get-nombre-periodo.ts`**: Estandarización y visualización matemática de lapsos temporales.
  - **`mm-to-pt.ts`**: Conversión estricta milímetros a puntos PDF.
  - **`get-url-barcode.ts`**: Genera la representación del código de barras en base64 para reportes PDF.

---

## 🛠️ Reglas de Desarrollo y Calidad de Código

Para mantener la salud del proyecto a largo plazo, se deben seguir estas reglas estrictas:

### 1. Tipado Estricto (Prohibido el uso de `any`)

- **NUNCA** se debe usar `any` para tipar hooks, props, componentes o variables.
- **Excepción Única**: Solo se permite cuando un componente o hook está diseñado explícitamente para ser genérico y manejar cualquier tipo de dato, como es el caso de `DataTableEstandar.tsx`. Fuera de estos casos de utilidad base, el tipado debe ser específico.

### 2. Reutilización Inteligente vs. Sobre-ingeniería

- **No reutilizar por obligación**: No intentes forzar la reutilización de un hook, componente o servicio para manejar dos flujos distintos (ej. Registro y Edición) solo por "ahorrar código".
- **Lógica Diferenciada**: Si la edición tiene reglas distintas, validaciones adicionales o flujos que no coinciden al 100% con la creación, **deben ser componentes/hooks separados**. Intentar abarcarlo todo en uno solo genera código "espantoso", difícil de seguir y mantener.
- **Componentes "Dumb"**: Solo se debe priorizar la reutilización en componentes "tontos" (presentacionales) que no contengan lógica de negocio compleja o que solo abarquen una funcionalidad muy específica y bien definida de un caso de uso.
- **Prioridad**: Se debe priorizar la **legibilidad y mantenibilidad** sobre la reutilización forzada. Es mejor tener dos procesos similares pero claros y rápidos de desarrollar, que uno solo sumamente complejo que intente ser "universal". Si eres una IA y el usuario te pide reutilizar, analiza e indicale si realmente es necesario o si es mejor crear algo nuevo y específico.

---

## 🎨 Guía Técnica de Estilos y Mantine v8 (ESTRICTO)

Para evitar que la interfaz se vea inconsistente o "gigante", y asegurar que las IA utilicen la sintaxis correcta de Mantine v8, se deben seguir estas reglas sin excepción:

### 1. Diccionario de Style Props (Mantine v8)

Mantine v8 utiliza **Style Props** (shorthands). NUNCA uses la propiedad `sx` (ya no existe) ni nombres de propiedades CSS completos como props del componente.

| Prop Correcta | Propósito               | Ejemplo                           | Error Común (NO USAR)  |
| :------------ | :---------------------- | :-------------------------------- | :--------------------- |
| `c`           | Color de texto          | `c="indigo.4"` o `c="white"`      | `color="blue"`         |
| `bg`          | Background              | `bg="zinc.9"` o `bg="#000"`       | `backgroundColor`      |
| `fz`          | Font Size               | `fz="sm"` (ideal ERP) o `fz="xs"` | `fontSize="14px"`      |
| `fw`          | Font Weight             | `fw={700}` o `fw="bold"`          | `fontWeight`           |
| `p`, `m`      | Padding / Margin        | `p="md"`, `mt="xl"`, `mx="auto"`  | `padding`, `marginTop` |
| `h`, `w`      | Height / Width          | `h={38}` (altura estándar input)  | `height`, `width`      |
| `gap`         | Espaciado (Group/Stack) | `gap="md"` o `gap={16}`           | `spacing`              |
| `justify`     | Alineación horizontal   | `justify="space-between"`         | `position`             |
| `align`       | Alineación vertical     | `align="center"`                  | `alignItems`           |

### 2. Reglas de Oro para Componentes de Formulario

- **Look Dark & Premium**: Los inputs deben integrarse con el tema oscuro. Usa siempre un objeto de clases (ej. `fieldClasses`) para el prop `classNames`:
  ```tsx
  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };
  ```
- **Tamaño ERP**: Usa **siempre** `size="xs"` y `radius="lg"` para `TextInput`, `Select`, `NumberInput` y `Button`. Esto evita que la UI se vea tosca.
- **Selects / MultiSelect**:
  - Añade siempre `searchable`.
  - Si el componente está dentro de un `Modal`, añade `popoverProps={{ withinPortal: true }}` para evitar que el menú se corte.
- **NumberInput**:
  - Usa `hideControls` cuando el input esté dentro de una tabla o espacio reducido.
  - Para montos, no uses `decimalScale={2}` pero si `fixedDecimalScale`.

### 3. Estética (Recomendaciones Visuales)

- **Flexibilidad Cromática**: La IA tiene **libertad total** para elegir colores según el contexto (colores vibrantes, gradientes, dark mode). No estás limitado a los colores de ejemplo.
- **Calidad Visual**: Los componentes deben sentirse premium. Usa sombras de Tailwind (ej. `shadow-lg shadow-indigo-900/20`), efectos de cristal (`backdrop-blur`) y bordes sutiles.
- **Badges**: Prefiere `variant="light"` o `variant="filled"`. Evita colores planos aburridos.

### 4. Arquitectura de Estado y Notificaciones

- **Notificaciones**: **PROHIBIDO** usar `@mantine/notifications` directamente. Debes usar el hook personalizado `useNotify()` del proyecto:
  ```tsx
  const { notifySuccess, notifyError } = useNotify();
  notifySuccess("Operación exitosa");
  ```
- **Manejo de Formularios**: El proyecto prefiere `useState` con una función `setField` y validación manual con `Zod` (`Schema.safeParse(form)`) en lugar de `useForm` de Mantine, a menos que el módulo ya use `useForm`.

### 5. Reglas de DataTableEstandar (Índices automáticos de paginación)

- **Índice Automático (#)**: **NUNCA** implementes un método `render` manual para la columna de numeración correlativa (`#`). Si necesitas mostrar el número de fila absoluto (que tiene en cuenta la página y el tamaño de página actual), define el objeto de la columna con el `accessor: "index"` de forma simple:
  ```tsx
  {
    accessor: "index",
    title: "#",
    textAlign: "center",
    width: 50,
  }
  ```
  `DataTableEstandar` intercepta automáticamente esta clave y calcula el índice correspondiente. No ensucies la definición del módulo con funciones de render redundantes.

### 5. Catálogo de Referencia para la IA

Utiliza este catálogo para seleccionar los componentes y hooks más adecuados para cada tarea.

#### Componentes Disponibles

- **Layout**: `AppShell`, `AspectRatio`, `Center`, `Container`, `Flex`, `Grid`, `Group`, `SimpleGrid`, `Space`, `Stack`.
- **Inputs**: `AngleSlider`, `Checkbox`, `Chip`, `ColorInput`, `ColorPicker`, `Fieldset`, `FileInput`, `Input`, `JsonInput`, `NativeSelect`, `NumberInput`, `PasswordInput`, `PinInput`, `Radio`, `RangeSlider`, `Rating`, `SegmentedControl`, `Slider`, `Switch`, `Textarea`, `TextInput`.
- **Combobox**: `Autocomplete`, `MultiSelect`, `Pill`, `PillsInput`, `Select`, `TagsInput`.
- **Buttons**: `ActionIcon`, `Button`, `CloseButton`, `CopyButton`, `FileButton`, `UnstyledButton`.
- **Navigation**: `Anchor`, `Breadcrumbs`, `Burger`, `NavLink`, `Pagination`, `Stepper`, `TableOfContents`, `Tabs`, `Tree`.
- **Feedback**: `Alert`, `Loader`, `Notification`, `Progress`, `RingProgress`, `SemiCircleProgress`, `Skeleton`.
- **Overlays**: `Affix`, `Dialog`, `Drawer`, `FloatingIndicator`, `HoverCard`, `LoadingOverlay`, `Menu`, `Modal`, `Overlay`, `Popover`, `Tooltip`.
- **Data display**: `Accordion`, `Avatar`, `BackgroundImage`, `Badge`, `Card`, `ColorSwatch`, `Image`, `Indicator`, `Kbd`, `NumberFormatter`, `Spoiler`, `ThemeIcon`, `Timeline`.
- **Typography**: `Blockquote`, `Code`, `Highlight`, `List`, `Mark`, `Table`, `Text`, `Title`.
- **Miscellaneous**: `Box`, `Collapse`, `Divider`, `FocusTrap`, `Paper`, `Portal`, `ScrollArea`, `Transition`, `VisuallyHidden`.

#### Extensiones de Mantine (Instaladas)

- **Dates**: `MiniCalendar`, `Calendar`, `DateTimePicker`, `DatePicker`, `DatePickerInput`, `DateInput`, `MonthPicker`, `MonthPickerInput`, `YearPicker`, `YearPickerInput`, `TimeInput`, `TimePicker`, `TimeGrid`, `TimeValue`.
- **Charts**: `AreaChart`, `BarChart`, `LineChart`, `CompositeChart`, `DonutChart`, `PieChart`, `FunnelChart`, `RadarChart`, `ScatterChart`, `BubbleChart`, `RadialBarChart`, `Sparkline`, `Heatmap`.
- **Otras**: `CodeHighlight`, `Notifications`, `Spotlight`, `Carousel`, `Dropzone`, `NavigationProgress`, `Modals manager`, `Rich text editor`.

#### Hooks Disponibles (@mantine/hooks)

- **UI and Dom**: `use-click-outside`, `use-color-scheme`, `use-element-size`, `use-event-listener`, `use-file-dialog`, `use-focus-return`, `use-focus-trap`, `use-focus-within`, `use-fullscreen`, `use-hotkeys`, `use-hover`, `use-in-viewport`, `use-intersection`, `use-long-press`, `use-media-query`, `use-mouse`, `use-move`, `use-mutation-observer`, `use-orientation`, `use-radial-move`, `use-reduced-motion`, `use-resize-observer`, `use-scroll-into-view`, `use-scroll-spy`, `use-viewport-size`, `use-window-event`, `use-window-scroll`.
- **State management**: `use-counter`, `use-debounced-callback`, `use-debounced-state`, `use-debounced-value`, `use-disclosure`, `use-id`, `use-input-state`, `use-list-state`, `use-local-storage`, `use-map`, `use-pagination`, `use-previous`, `use-queue`, `use-selection`, `use-set`, `use-set-state`, `use-state-history`, `use-throttled-callback`, `use-throttled-state`, `use-throttled-value`, `use-toggle`, `use-uncontrolled`, `use-validated-state`.
- **Utilities**: `use-clipboard`, `use-document-title`, `use-document-visibility`, `use-eye-dropper`, `use-favicon`, `use-fetch`, `use-hash`, `use-headroom`, `use-idle`, `use-interval`, `use-merged-ref`, `use-network`, `use-os`, `use-page-leave`, `use-text-selection`, `use-timeout`.
- **Lifecycle**: `use-did-update`, `use-force-update`, `use-is-first-render`, `use-isomorphic-effect`, `use-logger`, `use-mounted`, `use-shallow-effect`.

---

## 🏛️ Arquitectura de Módulos

### Estructura de un Dominio (`/src/modules/`)

```text
module-name/
├── hooks/        # Lógica de estado y validaciones.
├── presentation/ # Página y componentes de vista.
└── service/      # Servicios de API.
    ├── requests.ts  # DTOs de envío a la API.
    ├── responses.ts # DTOs de respuesta de la API.
    └── service.ts   # Métodos para interactuar con la API.
```

---

## ⚙️ Ejecución

1. Configurar el archivo `.env`
2. `npm install`
3. `npm run dev`

---

## 🤖 Comandos Obligatorios para IA

> [!IMPORTANT]
> Después de realizar cualquier cambio en el código del Frontend, es **OBLIGATORIO** ejecutar el siguiente comando para verificar la integridad de los tipos y el empaquetado:
>
> ```bash
> npm run build
> ```
>
> No confíes únicamente en `tsc --noEmit`. El proceso de build completo es la única garantía de que el código es correcto y está listo para producción.
