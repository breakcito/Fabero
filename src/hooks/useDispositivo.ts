import { useCallback, useEffect, useState } from "react";

/**
 * Información del dispositivo y del viewport.
 *
 * Se usa para adaptar la UI a los tablets/celulares Android e iOS que
 * operan en planta (vigilantes de recepción) y para decidir el layout
 * responsive de los listados.
 */
export interface InfoDispositivo {
  /** Android / iOS / iPadOS (teléfono o tablet). */
  esMovil: boolean;
  esAndroid: boolean;
  esIOS: boolean;
  /** Negación de `esMovil`. */
  esEscritorio: boolean;
  /** El dispositivo reporta soporte táctil. */
  esTactil: boolean;
  ancho: number;
  alto: number;
  /** < 640px. */
  esPantallaPequena: boolean;
  /** 640px <= ancho < 1024px. */
  esTablet: boolean;
  /** >= 1024px. */
  esEscritorioGrande: boolean;
}

/**
 * `navigator.userAgentData` todavía no está en las librerías de DOM de
 * TypeScript, así que se declara el subconjunto que se usa.
 */
interface NavigatorUADataLike {
  readonly platform: string;
  getHighEntropyValues: (
    hints: string[],
  ) => Promise<{ platform: string } | undefined>;
}

type NavigatorConUAData = Navigator & {
  readonly userAgentData?: NavigatorUADataLike;
};

const ANCHO_TABLET_MIN = 640;
const ANCHO_ESCRITORIO_GRANDE_MIN = 1024;

const ANCHO_ESCRITORIO_POR_DEFECTO = 1280;
const ALTO_ESCRITORIO_POR_DEFECTO = 800;

const hayVentana = (): boolean => typeof window !== "undefined";

const detectarTactil = (): boolean => {
  if (!hayVentana()) return false;
  return navigator.maxTouchPoints > 0 || "ontouchstart" in window;
};

/**
 * Detección síncrona por `userAgent`.
 *
 * Es el camino que resuelve en el primer render (Android e iOS se anuncian
 * en el UA), y sirve de respaldo cuando la API moderna no existe (Safari de
 * iOS, por ejemplo).
 */
const detectarPlataformaPorUserAgent = (): {
  esAndroid: boolean;
  esIOS: boolean;
} => {
  if (!hayVentana()) return { esAndroid: false, esIOS: false };

  const userAgent = navigator.userAgent ?? "";
  const esAndroid = /android/i.test(userAgent);
  const esAppleMovil = /iphone|ipad|ipod/i.test(userAgent);

  // iPadOS 13+ se reporta como "Macintosh": se delata por táctil + MacIntel.
  const esIPadOS =
    !esAppleMovil &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return { esAndroid, esIOS: esAppleMovil || esIPadOS };
};

const construirInfo = (
  esAndroid: boolean,
  esIOS: boolean,
  esTactil: boolean,
  ancho: number,
  alto: number,
): InfoDispositivo => {
  const esMovil = esAndroid || esIOS;

  return {
    esMovil,
    esAndroid,
    esIOS,
    esEscritorio: !esMovil,
    esTactil,
    ancho,
    alto,
    esPantallaPequena: ancho < ANCHO_TABLET_MIN,
    esTablet: ancho >= ANCHO_TABLET_MIN && ancho < ANCHO_ESCRITORIO_GRANDE_MIN,
    esEscritorioGrande: ancho >= ANCHO_ESCRITORIO_GRANDE_MIN,
  };
};

const estadoInicial = (): InfoDispositivo => {
  if (!hayVentana()) {
    return construirInfo(
      false,
      false,
      false,
      ANCHO_ESCRITORIO_POR_DEFECTO,
      ALTO_ESCRITORIO_POR_DEFECTO,
    );
  }

  const { esAndroid, esIOS } = detectarPlataformaPorUserAgent();

  return construirInfo(
    esAndroid,
    esIOS,
    detectarTactil(),
    window.innerWidth,
    window.innerHeight,
  );
};

/**
 * Hook global de detección de dispositivo.
 *
 * - La plataforma se resuelve de forma **no bloqueante**: se usa el
 *   `userAgent` de forma síncrona para el primer render y, si existe,
 *   `navigator.userAgentData.getHighEntropyValues(['platform'])` refina
 *   el resultado cuando resuelve (sin bloquear el render).
 * - Reacciona a `resize` y `orientationchange` (rotación de tablets).
 * - SSR-safe: sin `window` devuelve los valores de escritorio por defecto.
 */
export const useDispositivo = (): InfoDispositivo => {
  const [info, setInfo] = useState<InfoDispositivo>(estadoInicial);

  const sincronizarViewport = useCallback(() => {
    if (!hayVentana()) return;

    setInfo((prev) => {
      const ancho = window.innerWidth;
      const alto = window.innerHeight;
      if (prev.ancho === ancho && prev.alto === alto) return prev;
      return construirInfo(prev.esAndroid, prev.esIOS, prev.esTactil, ancho, alto);
    });
  }, []);

  useEffect(() => {
    if (!hayVentana()) return;

    // El estado inicial ya se calculó con `window.innerWidth/innerHeight`,
    // por lo que aquí sólo hace falta suscribirse a los cambios.
    window.addEventListener("resize", sincronizarViewport);
    window.addEventListener("orientationchange", sincronizarViewport);

    return () => {
      window.removeEventListener("resize", sincronizarViewport);
      window.removeEventListener("orientationchange", sincronizarViewport);
    };
  }, [sincronizarViewport]);

  useEffect(() => {
    if (!hayVentana()) return;

    const uaData = (navigator as NavigatorConUAData).userAgentData;
    if (!uaData || typeof uaData.getHighEntropyValues !== "function") return;

    let cancelado = false;

    uaData
      .getHighEntropyValues(["platform"])
      .then((valores) => {
        if (cancelado) return;

        const plataforma = (valores?.platform ?? "").toLowerCase();
        const esAndroidApi = plataforma.includes("android");
        const esIOSApi = /iphone|ipad|ipod/.test(plataforma);

        setInfo((prev) => {
          // La API moderna sólo puede confirmar la plataforma; nunca se
          // descarta la detección heurística (iPadOS se anuncia como macOS).
          const esAndroid = esAndroidApi ? true : prev.esAndroid;
          const esIOS = esAndroidApi ? false : esIOSApi ? true : prev.esIOS;

          if (esAndroid === prev.esAndroid && esIOS === prev.esIOS) return prev;

          return construirInfo(
            esAndroid,
            esIOS,
            prev.esTactil,
            prev.ancho,
            prev.alto,
          );
        });
      })
      .catch(() => {
        // La API puede fallar en navegadores parciales: se conserva la
        // detección heurística ya resuelta.
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return info;
};
