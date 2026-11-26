import { useCallback, useEffect, useRef, useState } from "react";
import { InterfacesPesosBalanzasService } from "../service/interfaces-pesosbalanzas.service";

/** Frecuencia de lectura del peso desde la balanza (milisegundos). */
const INTERVALO_MS = 300;

interface UsePesoBalanzaParams {
  /**
   * Si el peso automático está activo. Mientras sea `true` se lee la balanza
   * de forma continua; al desactivarlo, el último valor se congela y el
   * operador escribe a mano.
   */
  activo: boolean;
  /** Código de balanza. Si no se envía, se usa el configurado en el backend. */
  codBalanza?: number | null;
  /**
   * Se invoca cada vez que la balanza publica un peso válido. El valor llega
   * en Kg como texto.
   */
  onPeso: (peso: string) => void;
}

interface UsePesoBalanzaResultado {
  /** Último peso leído de la balanza (`null` si aún no leyó ninguno). */
  pesoActual: number | null;
  /** `true` mientras hay una lectura pendiente en la balanza. */
  hayLectura: boolean;
}

/**
 * Lectura del peso publicado por una balanza física.
 *
 * La computadora de la balanza escribe el peso en la tabla
 * `interfaces_pesosbalanzas`; este hook lo consulta cada 300 ms mientras está
 * activo y entrega el valor al consumidor.
 *
 * El valor centinela `-1` significa "no hay lectura pendiente": en ese caso
 * no se entrega nada y el input del operador no se toca.
 */
export const usePesoBalanza = ({
  activo,
  codBalanza,
  onPeso,
}: UsePesoBalanzaParams): UsePesoBalanzaResultado => {
  const [pesoActual, setPesoActual] = useState<number | null>(null);
  const [hayLectura, setHayLectura] = useState(false);

  // El callback se guarda en un ref para no reiniciar el polling en cada
  // render del consumidor (el closure cambiaría en cada render).
  const onPesoRef = useRef(onPeso);
  useEffect(() => {
    onPesoRef.current = onPeso;
  }, [onPeso]);

  const leer = useCallback(async () => {
    try {
      const respuesta = await InterfacesPesosBalanzasService.get_peso(
        codBalanza ?? undefined,
      );
      const peso = respuesta?.peso ?? null;

      if (peso === null || peso <= 0) {
        setHayLectura(false);
        return;
      }

      setHayLectura(true);
      setPesoActual(peso);
      onPesoRef.current(String(peso));
    } catch (error) {
      // Una lectura fallida no debe romper el formulario: se reintenta en el
      // siguiente tick.
      console.error("[Balanza] Error al leer el peso:", error);
    }
  }, [codBalanza]);

  useEffect(() => {
    if (!activo) return;

    // La primera lectura se programa en un timeout para no disparar el
    // `setState` de forma síncrona dentro del efecto.
    const temporizadorInicial = window.setTimeout(() => {
      void leer();
    }, 0);

    const temporizador = window.setInterval(() => {
      void leer();
    }, INTERVALO_MS);

    return () => {
      window.clearTimeout(temporizadorInicial);
      window.clearInterval(temporizador);
    };
  }, [activo, leer]);

  return { pesoActual, hayLectura };
};
