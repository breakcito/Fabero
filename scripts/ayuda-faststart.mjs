#!/usr/bin/env node
/**
 * Reorganiza los MP4 del Centro de Ayuda para que se reproduzcan en streaming:
 * mueve el atom `moov` (los metadatos: duracion, indice de muestras) al
 * principio del archivo.
 *
 * Por que: con el `moov` al final, el navegador tiene que bajar el archivo
 * completo (o casi) antes de poder reproducirlo o incluso antes de poder leer
 * los metadatos. Con el `moov` al frente, el video arranca a reproducirse en
 * streaming y las miniaturas de la grilla solo piden los primeros bytes.
 *
 * Es el equivalente de `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4`,
 * pero sin depender de ffmpeg: solo reordena las cajas y corrige las tablas de
 * offsets (`stco` / `co64`).
 *
 * Uso:
 *   node scripts/ayuda-faststart.mjs            # procesa videos/ayuda/**
 *   node scripts/ayuda-faststart.mjs <carpeta>  # procesa otra carpeta
 *
 * Es idempotente: los archivos que ya estan optimizados se saltan.
 */

import { readFileSync, writeFileSync, renameSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizFront = resolve(aqui, "..");
const carpetaObjetivo = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : join(raizFront, "public", "videos", "ayuda");

/** Cajas cuyo contenido es a su vez una lista de cajas. */
const CAJAS_CONTENEDOR = new Set([
  "moov",
  "trak",
  "mdia",
  "minf",
  "stbl",
  "edts",
  "dinf",
  "udta",
  "mvex",
]);

/** Cajas FullBox: 4 bytes de version/flags antes de sus hijas. */
const CAJAS_FULLBOX = new Set(["meta"]);

/**
 * Lee las cajas de nivel superior dentro del rango [inicio, fin).
 * @returns {{tipo:string,inicio:number,fin:number,header:number,size:number}[]}
 */
function leerCajas(buf, inicio, fin) {
  const cajas = [];
  let i = inicio;
  while (i + 8 <= fin) {
    let size = buf.readUInt32BE(i);
    const tipo = buf.toString("latin1", i + 4, i + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(i + 8));
      header = 16;
    } else if (size === 0) {
      size = fin - i;
    }
    if (size < header || i + size > fin) break;
    cajas.push({ tipo, inicio: i, fin: i + size, header, size });
    i += size;
  }
  return cajas;
}

/**
 * Recorre el arbol de cajas buscando `stco` (offsets de 32 bits) y `co64`
 * (offsets de 64 bits) para corregir los offsets absolutos de las muestras.
 */
function corregirOffsets(buf, inicio, fin, delta, encontradas) {
  for (const caja of leerCajas(buf, inicio, fin)) {
    if (caja.tipo === "stco") {
      const base = caja.inicio + caja.header;
      const versionFlags = buf.readUInt32BE(base);
      const entryCount = buf.readUInt32BE(base + 4);
      for (let i = 0; i < entryCount; i++) {
        const pos = base + 8 + i * 4;
        buf.writeUInt32BE((buf.readUInt32BE(pos) + delta) >>> 0, pos);
      }
      encontradas.push({ tipo: "stco", muestras: entryCount, versionFlags });
    } else if (caja.tipo === "co64") {
      const base = caja.inicio + caja.header;
      const versionFlags = buf.readUInt32BE(base);
      const entryCount = buf.readUInt32BE(base + 4);
      for (let i = 0; i < entryCount; i++) {
        const pos = base + 8 + i * 8;
        buf.writeBigUInt64BE(BigInt(buf.readBigUInt64BE(pos)) + BigInt(delta), pos);
      }
      encontradas.push({ tipo: "co64", muestras: entryCount, versionFlags });
    } else if (CAJAS_CONTENEDOR.has(caja.tipo)) {
      corregirOffsets(buf, caja.inicio + caja.header, caja.fin, delta, encontradas);
    } else if (CAJAS_FULLBOX.has(caja.tipo)) {
      corregirOffsets(buf, caja.inicio + caja.header + 4, caja.fin, delta, encontradas);
    }
  }
}

/** ¿El archivo tiene la caja `mvex` (MP4 fragmentado)? No aplica faststart. */
function esFragmentado(buf, moov) {
  let encontrado = false;
  const buscar = (inicio, fin) => {
    for (const caja of leerCajas(buf, inicio, fin)) {
      if (caja.tipo === "mvex") {
        encontrado = true;
        return;
      }
      if (CAJAS_CONTENEDOR.has(caja.tipo)) buscar(caja.inicio + caja.header, caja.fin);
      else if (CAJAS_FULLBOX.has(caja.tipo)) buscar(caja.inicio + caja.header + 4, caja.fin);
    }
  };
  buscar(moov.inicio + moov.header, moov.fin);
  return encontrado;
}

/**
 * Reorganiza un MP4: devuelve el buffer nuevo, o null si ya estaba optimizado
 * o si tiene una estructura que no se puede manejar.
 */
export function optimizarMp4(ruta) {
  const original = readFileSync(ruta);
  const cajas = leerCajas(original, 0, original.length);

  const moov = cajas.find((c) => c.tipo === "moov");
  const mdat = cajas.find((c) => c.tipo === "mdat");
  if (!moov || !mdat) return { estado: "omitido", motivo: "no tiene moov/mdat" };

  // Ya esta optimizado: el moov ya esta antes del mdat.
  if (moov.inicio < mdat.inicio) return { estado: "omitido", motivo: "ya tiene faststart" };

  const otras = cajas.filter((c) => c.tipo !== "moov" && c.tipo !== "mdat");
  const inesperadas = otras.filter((c) => c.tipo !== "ftyp" && c.tipo !== "free");
  if (inesperadas.length > 0) {
    return {
      estado: "omitido",
      motivo: `estructura no soportada (${inesperadas.map((c) => c.tipo).join(", ")})`,
    };
  }
  if (esFragmentado(original, moov)) {
    return { estado: "omitido", motivo: "MP4 fragmentado (mvex)" };
  }

  // Nueva disposicion: ftyp, free, moov, mdat.
  const antes = cajas.filter((c) => c.tipo === "ftyp" || c.tipo === "free");
  const orden = [...antes, moov, mdat];

  const nuevo = Buffer.alloc(original.length);
  let cursor = 0;
  for (const caja of orden) {
    original.copy(nuevo, cursor, caja.inicio, caja.fin);
    cursor += caja.size;
  }

  // El mdat se desplaza: sus offsets absolutos hay que corregirlos.
  const nuevoInicioMdat = antes.reduce((suma, c) => suma + c.size, 0) + moov.size;
  const delta = nuevoInicioMdat - mdat.inicio;

  const correcciones = [];
  corregirOffsets(nuevo, antes.reduce((suma, c) => suma + c.size, 0), nuevoInicioMdat, delta, correcciones);

  return {
    estado: "optimizado",
    delta,
    correcciones,
    buffer: nuevo,
  };
}

/** Lista recursivamente los .mp4 de una carpeta. */
function listarMp4(carpeta) {
  const salida = [];
  let entradas;
  try {
    entradas = readdirSync(carpeta);
  } catch {
    return salida;
  }
  for (const entrada of entradas) {
    const completa = join(carpeta, entrada);
    const info = statSync(completa);
    if (info.isDirectory()) {
      salida.push(...listarMp4(completa));
    } else if (entrada.toLowerCase().endsWith(".mp4")) {
      salida.push(completa);
    }
  }
  return salida;
}

const esEjecucionDirecta = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (esEjecucionDirecta) {
  const archivos = listarMp4(carpetaObjetivo);
  if (archivos.length === 0) {
    console.log(`[ayuda:faststart] No hay videos en ${carpetaObjetivo}`);
  }
  for (const archivo of archivos) {
    const nombre = archivo.replace(/\\/g, "/").split("/").slice(-2).join("/");
    try {
      const resultado = optimizarMp4(archivo);
      if (resultado.estado === "omitido") {
        console.log(`[ayuda:faststart] ${nombre}: sin cambios (${resultado.motivo})`);
        continue;
      }
      const temporal = `${archivo}.faststart.tmp`;
      try {
        writeFileSync(temporal, resultado.buffer);
        renameSync(temporal, archivo);
      } catch (error) {
        // En Windows, OneDrive o un proceso que tiene el archivo abierto pueden
        // impedir el rename. Se reescribe el archivo original directamente.
        try {
          writeFileSync(archivo, resultado.buffer);
        } finally {
          try {
            unlinkSync(temporal);
          } catch {
            /* el temporal ya no esta */
          }
        }
      }
      console.log(
        `[ayuda:faststart] ${nombre}: moov movido al inicio (delta ${resultado.delta} bytes, ` +
          `${resultado.correcciones.length} tabla(s) de offsets corregidas)`,
      );
    } catch (error) {
      console.log(`[ayuda:faststart] ${nombre}: ERROR ${error.message}`);
    }
  }
}
