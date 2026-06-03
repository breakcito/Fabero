/* eslint-disable @typescript-eslint/no-explicit-any */
import Fuse from "fuse.js";
import { Document } from "flexsearch";

// --- INTERFACES Y TIPOS ---

export interface SearchOptions<T> {
  /** Claves a evaluar si la lista es de objetos */
  keys?: Extract<keyof T, string>[];
  /** Activar limpieza de tildes y mayúsculas */
  useNormalization?: boolean;
  /** Sensibilidad de Fuse (0.0 exacto, 1.0 permisivo). Por defecto: 0.4 */
  fuseThreshold?: number;
}

export type MatchSource = "fuse" | "flexsearch";

export interface SearchResult<T> {
  item: T;
  index: number;
  sources: MatchSource[];
}

// Interfaz interna para manejar los datos procesados sin alterar el tipo original
interface ProcessedItem extends Record<string, any> {
  _originalIndex: number;
}

// --- FUNCIONES UTILITARIAS ---

const normalizeText = (text: unknown): string => {
  if (typeof text !== "string") return "";
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// --- FUNCIÓN PRINCIPAL ---

/**
 * Búsqueda unificada utilizando distancia de caracteres (Fuse) y tokens (FlexSearch).
 * Soporta listas de strings o listas de objetos mediante Genéricos <T>.
 */
export const getCoincidencias = <T>(
  list: T[],
  query: string,
  options: SearchOptions<T> = {},
): SearchResult<T>[] => {
  if (!query || list.length === 0) return [];

  const { keys = [], useNormalization = true, fuseThreshold = 0.4 } = options;
  const searchQuery = useNormalization ? normalizeText(query) : query;
  const isPlainList = typeof list[0] === "string";

  // 1. Preparar datos internamente (preservamos el índice original para mapear luego)
  const processedList: ProcessedItem[] = list.map((item, index) => {
    const processedItem: ProcessedItem = { _originalIndex: index };

    if (isPlainList) {
      processedItem["val"] = item;
      if (useNormalization) {
        processedItem["val_norm"] = normalizeText(item);
      }
    } else {
      Object.assign(processedItem, item);
      if (useNormalization && keys.length > 0) {
        keys.forEach((k) => {
          processedItem[`${k}_norm`] = normalizeText((item as any)[k]);
        });
      }
    }
    return processedItem;
  });

  // Determinar en qué campos buscarán las librerías
  const searchKeys = isPlainList
    ? useNormalization
      ? ["val_norm"]
      : ["val"]
    : useNormalization
      ? keys.map((k) => `${k}_norm`)
      : (keys as string[]);

  // 2. Ejecutar Fuse.js (Captura errores ortográficos)
  const fuse = new Fuse(processedList, {
    keys: searchKeys,
    threshold: fuseThreshold,
    ignoreLocation: true,
  });

  const fuseResults = fuse
    .search(searchQuery)
    .map((res) => res.item._originalIndex as number);

  // 3. Ejecutar FlexSearch (Captura palabras en desorden)
  const flexIndex = new Document<ProcessedItem>({
    document: {
      id: "_originalIndex",
      index: searchKeys,
    },
    tokenize: "forward",
    context: true,
  });

  processedList.forEach((item) => flexIndex.add(item));

  // FlexSearch devuelve un array por cada "key" buscada, los aplanamos y quitamos duplicados
  const rawFlexResults = flexIndex.search(searchQuery);
  const flexResults = Array.from(
    new Set(rawFlexResults.flatMap((res) => res.result as number[])),
  );

  // 4. Combinar resultados y unificar fuentes (sources)
  const combinedMap = new Map<number, SearchResult<T>>();

  const addResult = (originalIndex: number, source: MatchSource) => {
    if (!combinedMap.has(originalIndex)) {
      combinedMap.set(originalIndex, {
        item: list[originalIndex], // Retorna el objeto estricto original
        index: originalIndex,
        sources: [source],
      });
    } else {
      const existing = combinedMap.get(originalIndex)!;
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    }
  };

  fuseResults.forEach((idx) => addResult(idx, "fuse"));
  flexResults.forEach((idx) => addResult(idx, "flexsearch"));

  return Array.from(combinedMap.values());
};
