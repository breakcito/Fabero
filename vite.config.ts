import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Modulo virtual con el listado de los videos del Centro de Ayuda.
 *
 * Los videos viven en `public/videos/ayuda/<carpeta-del-modulo>/` para que se
 * sirvan como archivos estaticos (no entran al bundle de JS). Como `public/` no
 * pasa por el grafo de modulos de Vite, no se puede usar `import.meta.glob`
 * sobre el: este plugin lee la carpeta y expone el listado como un modulo
 * virtual (`virtual:ayuda-videos`) que la app importa.
 *
 * Nota: el listado se resuelve al arrancar Vite. Si agregas videos, reinicia
 * `npm run dev` para que se vean.
 */
const AYUDA_DIR = "public/videos/ayuda";
const VIRTUAL_ID = "virtual:ayuda-videos";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/** Normaliza un nombre de carpeta para comparar sin tildes ni espacios. */
const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Lista los videos (y su thumbnail, si existe) de cada carpeta de modulo. */
function listarArchivosAyuda(): Record<string, unknown[]> {
  const porCarpeta: Record<string, unknown[]> = {};
  if (!existsSync(AYUDA_DIR)) return porCarpeta;

  for (const carpeta of readdirSync(AYUDA_DIR)) {
    const rutaCarpeta = join(AYUDA_DIR, carpeta);
    if (!statSync(rutaCarpeta).isDirectory()) continue;

    const archivos = readdirSync(rutaCarpeta);

    // Thumbnails: mismo nombre base que el video, extension de imagen.
    const posters = new Map<string, string>();
    for (const archivo of archivos) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(archivo)) {
        posters.set(archivo.replace(/\.[^.]+$/, "").toLowerCase(), archivo);
      }
    }

    const prefijo = `/videos/ayuda/${encodeURIComponent(carpeta)}/`;

    porCarpeta[normalizar(carpeta)] = archivos
      .filter((archivo) => /\.mp4$/i.test(archivo))
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }))
      .map((archivo) => {
        const base = archivo.replace(/\.[^.]+$/, "");
        const poster = posters.get(base.toLowerCase());
        return {
          base,
          url: `${prefijo}${encodeURIComponent(archivo)}`,
          poster: poster ? `${prefijo}${encodeURIComponent(poster)}` : null,
        };
      });
  }

  return porCarpeta;
}

function ayudaVideosPlugin(): Plugin {
  return {
    name: "fabero:ayuda-videos",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(listarArchivosAyuda())};`;
    },
    /**
     * En desarrollo, cuando se agrega o se borra un video, se invalida el
     * modulo virtual y se recarga la pagina para que el listado se refresque
     * sin reiniciar Vite.
     */
    configureServer(server) {
      const invalidar = (archivo: string) => {
        // En Windows el watcher entrega rutas con "\": se normalizan a "/".
        const ruta = archivo.replace(/\\/g, "/");
        if (!ruta.includes("/videos/ayuda/")) return;
        const modulo = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (modulo) server.moduleGraph.invalidateModule(modulo);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add(AYUDA_DIR);
      server.watcher.on("add", invalidar);
      server.watcher.on("unlink", invalidar);
      server.watcher.on("change", invalidar);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    ayudaVideosPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 5000, // Subir el límite de la advertencia a 5MB
  },
});
