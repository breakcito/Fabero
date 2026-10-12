/**
 * Convierte un número a su representación textual en mayúsculas en español
 * (Ejemplo: 21760.63 -> "VEINTIUNO MIL SETECIENTOS SESENTA Y 63/100")
 */

const UNIDADES = [
  "",
  "UN",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
];

const DECENAS = [
  "",
  "DIEZ",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const DIEZ_Y = [
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];

const VEINTE_Y = [
  "VEINTE",
  "VEINTIUNO",
  "VEINTIDOS",
  "VEINTITRES",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISEIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];

const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

const convertirGrupo = (n: number): string => {
  let salida = "";

  if (n === 100) {
    return "CIEN";
  }

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (c > 0) {
    salida += `${CENTENAS[c]} `;
  }

  if (d === 1) {
    salida += `${DIEZ_Y[u]} `;
  } else if (d === 2) {
    salida += `${VEINTE_Y[u]} `;
  } else {
    if (d > 2) {
      salida += DECENAS[d];
      if (u > 0) {
        salida += ` Y ${UNIDADES[u]} `;
      } else {
        salida += " ";
      }
    } else if (u > 0) {
      salida += `${UNIDADES[u]} `;
    }
  }

  return salida.trim();
};

export const numeroALetras = (monto: number): string => {
  if (isNaN(monto) || monto === 0) {
    return "CERO Y 00/100";
  }

  const valorAbsoluto = Math.abs(monto);
  const entero = Math.floor(valorAbsoluto);
  const centavos = Math.round((valorAbsoluto - entero) * 100);
  const centavosStr = String(centavos).padStart(2, "0");

  if (entero === 0) {
    return `CERO Y ${centavosStr}/100`;
  }

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push("UN MILLON");
    } else {
      partes.push(`${convertirGrupo(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push("MIL");
    } else {
      partes.push(`${convertirGrupo(miles)} MIL`);
    }
  }

  if (resto > 0) {
    partes.push(convertirGrupo(resto));
  }

  return `${partes.join(" ").trim()} Y ${centavosStr}/100`;
};
