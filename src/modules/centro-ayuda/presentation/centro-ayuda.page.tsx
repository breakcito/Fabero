import { useMemo } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCentroAyuda } from "../hooks/useCentroAyuda";
import { HeroAyuda } from "./components/hero-ayuda";
import { SidebarModulos } from "./components/sidebar-modulos";
import { SeccionModulo } from "./components/seccion-modulo";
import { EstadoVacio } from "./components/estado-vacio";
import { ModalVideo } from "./components/modal-video";

export const CentroAyudaPage = () => {
  useTitlePage("Centro de Ayuda");

  const {
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
    totalModulos,
    enReproduccion,
    abrirVideo,
    cerrarVideo,
  } = useCentroAyuda();

  /**
   * Vista "Todos los módulos": se agrupa por módulo y dentro de cada uno se
   * listan sus videos disponibles.
   */
  const gruposPorModulo = useMemo(() => {
    if (!mostrarTodos) return [];
    return modulos
      .map((modulo) => ({
        modulo,
        videos: videosDelPanel.filter((item) => item.modulo.slug === modulo.slug),
      }))
      .filter((grupo) => grupo.videos.length > 0);
  }, [mostrarTodos, modulos, videosDelPanel]);

  return (
    <div className="space-y-6 pb-6">
      <HeroAyuda
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        totalVideos={totalVideos}
        totalModulos={totalModulos}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <SidebarModulos
          modulos={modulos}
          slugActivo={slugActivo}
          onSelect={setSlugActivo}
          conteoPorModulo={conteoPorModulo}
          totalVideos={totalVideos}
        />

        <div className="space-y-8">
          {mostrarTodos ? (
            gruposPorModulo.length > 0 ? (
              gruposPorModulo.map((grupo) => (
                <SeccionModulo
                  key={grupo.modulo.slug}
                  titulo={grupo.modulo.nombre}
                  descripcion={grupo.modulo.descripcion}
                  videos={grupo.videos}
                  onPlay={abrirVideo}
                />
              ))
            ) : (
              <EstadoVacio />
            )
          ) : moduloActivo ? (
            <SeccionModulo
              titulo={moduloActivo.nombre}
              descripcion={moduloActivo.descripcion}
              videos={videosDelPanel}
              onPlay={abrirVideo}
            />
          ) : (
            <EstadoVacio />
          )}
        </div>
      </div>

      <ModalVideo
        abierto={enReproduccion !== null}
        enReproduccion={enReproduccion}
        lista={videosDelPanel}
        onClose={cerrarVideo}
        onSeleccionar={abrirVideo}
      />
    </div>
  );
};

export default CentroAyudaPage;
