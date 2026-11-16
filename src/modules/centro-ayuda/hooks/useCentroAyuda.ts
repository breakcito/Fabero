import { useMemo, useState } from "react";
import { CATALOGO_AYUDA, TOTAL_VIDEOS_DISPONIBLES } from "../service/ayuda.catalogo";
import type { IModuloAyuda, IVideoAyuda } from "../service/ayuda.responses";

/** Slug reservado para la vista que agrupa los videos de todos los módulos. */
export const SLUG_TODOS = "todos";

/** Video abierto en el reproductor, con el módulo al que pertenece. */
export interface IVideoEnReproduccion {
  video: IVideoAyuda;
  modulo: IModuloAyuda;
}

export const useCentroAyuda = () => {
  const [busqueda, setBusqueda] = useState("");
  const [slugActivo, setSlugActivo] = useState<string>(SLUG_TODOS);
  const [enReproduccion, setEnReproduccion] = useState<IVideoEnReproduccion | null>(null);

  /**
   * Módulos filtrados por la búsqueda. Si el texto coincide con el nombre del
   * módulo se muestran todos sus videos; si coincide con un título, solo ese.
   */
  const modulos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return CATALOGO_AYUDA;

    return CATALOGO_AYUDA.map((modulo) => ({
      ...modulo,
      videos: modulo.videos.filter(
        (video) =>
          video.titulo.toLowerCase().includes(q) ||
          modulo.nombre.toLowerCase().includes(q) ||
          (video.descripcion ?? "").toLowerCase().includes(q),
      ),
    })).filter((modulo) => modulo.videos.length > 0);
  }, [busqueda]);

  const moduloActivo = useMemo(
    () => modulos.find((modulo) => modulo.slug === slugActivo) ?? null,
    [modulos, slugActivo],
  );

  /** Si el módulo activo desaparece al filtrar, se cae a la vista de todos. */
  const mostrarTodos = slugActivo === SLUG_TODOS || moduloActivo === null;

  /** Lista de videos a mostrar en el panel derecho. */
  const videosDelPanel = useMemo(() => {
    if (mostrarTodos) {
      return modulos.flatMap((modulo) =>
        modulo.videos.map((video) => ({ video, modulo })),
      );
    }
    return (moduloActivo?.videos ?? []).map((video) => ({
      video,
      modulo: moduloActivo as IModuloAyuda,
    }));
  }, [modulos, moduloActivo, mostrarTodos]);

  /** Videos por módulo (para los contadores del sidebar). */
  const conteoPorModulo = useMemo(() => {
    const conteo = new Map<string, number>();
    modulos.forEach((modulo) => {
      conteo.set(modulo.slug, modulo.videos.length);
    });
    return conteo;
  }, [modulos]);

  const totalVideos = useMemo(
    () => modulos.reduce((total, modulo) => total + (conteoPorModulo.get(modulo.slug) ?? 0), 0),
    [modulos, conteoPorModulo],
  );

  const abrirVideo = (item: IVideoEnReproduccion) => {
    setEnReproduccion(item);
  };

  const cerrarVideo = () => setEnReproduccion(null);

  return {
    busqueda,
    setBusqueda,
    slugActivo,
    setSlugActivo,
    modulos,
    moduloActivo,
    mostrarTodos,
    videosDelPanel,
    conteoPorModulo,
    totalVideos,
    totalVideosDisponibles: TOTAL_VIDEOS_DISPONIBLES,
    totalModulos: CATALOGO_AYUDA.length,
    enReproduccion,
    abrirVideo,
    cerrarVideo,
  };
};
