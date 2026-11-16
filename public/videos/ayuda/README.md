# Videos del Centro de Ayuda

Esta carpeta alimenta el módulo **Centro de Ayuda** (`/centro-ayuda`).

## Estructura

Una **carpeta por módulo**. Dentro, los videos del módulo y (opcionalmente) su
thumbnail con **el mismo nombre base**:

```
public/videos/ayuda/
├── programacion de recepcion/
│   ├── programacion de unidad - registro.mp4
│   └── programacion de unidad - registro.jpg   <- thumbnail (opcional)
├── recepcion de unidades/
├── balanza pesaje recepcion de mineral/
├── validacion y distribucion/
├── primer tramo gestion de guias/
├── cierre de leyes/
├── valorizacion de compra/
├── contabilidad compra de mineral/
├── blending/
├── programacion de despacho/
├── pesaje despacho de mineral/
├── segundo tramo gestion de guias/
├── valorizacion de venta/
└── contabilidad venta de mineral/
```

> La carpeta está en `public/` a propósito: los videos se sirven como archivos
> estáticos (`/videos/ayuda/...`), no entran al bundle de JavaScript y no se
> re-procesan en cada build.

## Cómo agregar un tutorial

1. Copia el video en la carpeta de su módulo (extensión `.mp4`).
2. Opcionalmente, copia una imagen con **el mismo nombre base** y extensión
   `.jpg` / `.png` / `.webp`: se usa como thumbnail de la tarjeta. Si no existe,
   se usa el primer frame del propio video.
3. Reinicia `npm run dev` (el listado de archivos se resuelve al arrancar Vite;
   el plugin `fabero:ayuda-videos` de `vite.config.ts` arma el manifiesto).

## Reproducción fluida: `npm run ayuda:faststart`

**Este paso es obligatorio para los videos nuevos.**

Un MP4 grabado por el celular o por un capturador de pantalla trae la caja
`moov` (los metadatos: duración, índice de muestras) **al final** del archivo.
Con esa estructura el navegador tiene que bajarse el archivo casi entero antes
de poder reproducirlo, y la grilla (que pide los metadatos de cada miniatura)
descarga el video completo de cada módulo. Eso satura la conexión y el video se
frena a mitad de reproducción.

`npm run ayuda:faststart` reordena cada MP4 moviendo el `moov` al principio
(equivalente a `ffmpeg -movflags +faststart`, pero sin depender de ffmpeg).
Es idempotente: los que ya están optimizados se saltan.

Se ejecuta solo, porque `predev` y `prebuild` lo invocan:

```bash
npm run dev     # optimiza los videos y levanta Vite
npm run build   # optimiza los videos y compila
```

Si preferes hacerlo a mano: `npm run ayuda:faststart`.

## Títulos

El título de cada video sale de `src/modules/centro-ayuda/service/ayuda.catalogo.ts`:

1. Si el archivo se llama **exactamente** como el `archivo` del catálogo, se usa
   ese título.
2. Si no, se empareja **por posición**: el 1.er archivo de la carpeta con el
   1.er título del catálogo, el 2.º con el 2.º, etc.
3. Si la carpeta tiene más archivos que títulos, a los que sobren se les deduce
   el título del nombre del archivo (se limpia el sufijo de cámara `- IMG_0159`).

Los archivos se ordenan de forma natural (`2` antes que `10`).

## Orden de los videos

El orden lo define el catálogo, no el nombre de los archivos. Se agrega el
parámetro `numero`:

```ts
videos: [
  { numero: 1, archivo: "guias primer tramo registro", titulo: "Registrar la guía" },
  { numero: 2, archivo: "guias primer tramo edicion", titulo: "Editar la guía" },
]
```

- `numero` es la posición en que se muestra el video dentro del módulo.
- `archivo` identifica el archivo: si existe uno con ese nombre se usa; si no,
  el video toma el siguiente archivo de la carpeta que esté libre.
- Sin `numero`, el orden es el de declaración.

Ejemplo: si en la carpeta tienes `b-video.mp4` y `a-video.mp4` pero quieres
mostrar primero `b-video`, basta con numerarlo `01` en el catálogo.

## Carpetas anidadas

Solo se leen los archivos que están **directamente** en la carpeta del módulo.
Una subcarpeta (por ejemplo `assets/`) queda fuera del listado.

## Nota sobre el tamaño

Los videos se empaquetan en el bundle. Si crecen mucho, conviene moverlos a
`public/` y referenciarlos por ruta (el `README.md` del front lo detalla).
