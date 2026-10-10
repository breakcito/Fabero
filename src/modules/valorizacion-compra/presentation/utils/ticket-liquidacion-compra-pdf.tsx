import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";

/**
 * Ticket / Liquidación de Valorización de Compra de Mineral.
 * Réplica fiel del formato corporativo FABERO S.A.C.:
 *  - Cabecera amarilla con Logo FABERO S.A.C., título fijo:
 *    "VALORIZACIÓN DE MINERAL POR DIRIMENCIA, REINTEGRO O DESCUENTO",
 *    N° DE LIQ. y FECHA
 *  - Bloques a 2 columnas: DATOS DEL PROVEEDOR y DATOS GENERALES
 *  - Tabla detallada de Lotes y Elementos (Au, Ag...) con 16 columnas
 *  - Fila de totales con celdas amarillas
 *  - Resumen Económico: ANTICIPO, SUBTOTAL, IGV 18%, TOTAL, DETRACCIÓN 10%, NETO A PAGAR
 *  - Firmas: Firma del Proveedor y Area Comercial
 */

const COLOR_AMARILLO = "#F6C343";
const COLOR_BORDE = "#9CA3AF";
const COLOR_TEXTO = "#111827";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: COLOR_TEXTO,
  },

  // ========== CABECERA SUPERIOR ==========
  headerBar: {
    backgroundColor: COLOR_AMARILLO,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  logoBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#000000",
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#000000",
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  titleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#000000",
    textAlign: "center",
    textDecoration: "underline",
    letterSpacing: 0.4,
  },
  headerMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 150,
  },
  liqNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  liqNumberLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#000000",
  },
  liqNumberValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#000000",
    marginLeft: 4,
  },
  fechaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fechaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#000000",
  },
  fechaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#000000",
    marginLeft: 4,
  },

  // ========== BLOQUES DE INFORMACIÓN (2 COLUMNAS) ==========
  infoSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  infoColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    color: "#000000",
    textDecoration: "underline",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#000000",
    flexShrink: 0,
  },
  infoValue: {
    fontFamily: "Helvetica",
    fontSize: 6.8,
    color: "#111827",
    flex: 1,
    marginLeft: 3,
  },

  // ========== TABLA DE LOTES ==========
  tableContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLOR_AMARILLO,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.2,
    color: "#000000",
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 1,
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
  },
  tableDataRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tableDataCell: {
    fontFamily: "Helvetica",
    fontSize: 6.2,
    color: "#111827",
    textAlign: "center",
    paddingVertical: 2.5,
    paddingHorizontal: 1,
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
  },
  tableDataCellRight: {
    fontFamily: "Helvetica",
    fontSize: 6.2,
    color: "#111827",
    textAlign: "right",
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
  },

  // Fila de Totales de la Tabla
  tableTotalsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  totalsYellowCell: {
    backgroundColor: COLOR_AMARILLO,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.2,
    color: "#000000",
    textAlign: "right",
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
  },

  // ========== RESUMEN ECONÓMICO ==========
  bottomSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  resumenTable: {
    width: 175,
    borderWidth: 0.8,
    borderColor: COLOR_BORDE,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
  },
  resumenRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    backgroundColor: "#FEF3C7",
  },
  resumenLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#000000",
  },
  resumenValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#000000",
    textAlign: "right",
  },

  // ========== FIRMAS AL PIE ==========
  signaturesSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  signatureBox: {
    alignItems: "center",
    width: 160,
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginBottom: 3,
  },
  signatureText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: "#000000",
    textAlign: "center",
  },
});

// Helper de texto / rayas
const dash = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s === "" ? "—" : s;
};

// Formato de números con comas y decimales
const fmtNum = (n: number | null | undefined, decimals = 2): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export interface TicketLiquidacionCompraPdfProps {
  data: RES_ValorizacionCompra;
}

export const TicketLiquidacionCompraPdf = ({ data }: TicketLiquidacionCompraPdfProps) => {
  const displayCorrelativo = dash(data.correlativo || (data.numero_correlativo ? `VAL-${data.numero_correlativo}` : null));

  // Fecha legible
  const displayFecha = (() => {
    if (data.fecha_hora_valorizacion) {
      const d = new Date(data.fecha_hora_valorizacion);
      if (!Number.isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const anio = d.getFullYear();
        return `${dia}/${mes}/${anio}`;
      }
    }
    if (data.created_at) {
      const d = new Date(data.created_at);
      if (!Number.isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const anio = d.getFullYear();
        return `${dia}/${mes}/${anio}`;
      }
    }
    return "—";
  })();

  // Lotes / detalles
  const detalles = data.detalles || [];

  // Totales de la tabla
  let sumTmh = 0;
  let sumTms = 0;
  let sumTotalUss = 0;
  let sumLeyX = 0;
  let sumRecupX = 0;

  detalles.forEach((d) => {
    const tmsVal = Number(d.tms) || 0;
    sumTmh += Number(d.tmh) || 0;
    sumTms += tmsVal;
    sumTotalUss += Number(d.subtotal) || 0;
    sumLeyX += (Number(d.ley) || 0) * (tmsVal > 0 ? tmsVal : 1);
    sumRecupX += (Number(d.recuperacion) || 0) * (tmsVal > 0 ? tmsVal : 1);
  });

  const basePond = sumTms > 0 ? sumTms : (detalles.length || 1);
  const leyPonderada = sumLeyX / basePond;
  const recupPonderada = sumRecupX / basePond;
  const precioPorTmsPonderado = sumTms > 0 ? sumTotalUss / sumTms : 0;

  const fmtRecup = (r: number): string => {
    if (r === 0 || Number.isNaN(r)) return "—";
    const v = r > 1 ? r / 100 : r;
    return v.toFixed(2);
  };

  // Cálculos económicos
  const subtotalUss = Number(data.total_subtotal) || sumTotalUss;
  const igv18 = data.igv !== null && data.igv !== undefined ? Number(data.igv) : Math.round(subtotalUss * 0.18 * 100) / 100;
  const totalUss = data.total_con_igv !== null && data.total_con_igv !== undefined ? Number(data.total_con_igv) : subtotalUss + igv18;
  const detraccion10 = data.monto_detraccion !== null && data.monto_detraccion !== undefined ? Number(data.monto_detraccion) : Math.round(totalUss * 0.10 * 100) / 100;
  const anticipos = Number(data.total_anticipos) || 0;
  const netoAPagar = data.neto_a_pagar !== null && data.neto_a_pagar !== undefined ? Number(data.neto_a_pagar) : totalUss - detraccion10 - anticipos;

  // Anchos proporcionales de las 16 columnas (suman 100%)
  const colWidths = {
    lote: "7.5%",
    fecha: "6.5%",
    mineral: "4.5%",
    ley: "6.0%",
    recup: "5.5%",
    inter: "7.0%",
    desInter: "6.0%",
    reac: "5.0%",
    pen: "5.0%",
    maquila: "6.0%",
    factor: "6.0%",
    tmh: "6.5%",
    h2o: "5.0%",
    tms: "6.5%",
    precTms: "8.5%",
    total: "8.5%",
  };

  return (
    <Document title={`Liquidación ${displayCorrelativo}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ========== ENCABEZADO SUPERIOR ========== */}
        <View style={styles.headerBar}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FABERO S.A.C</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              VALORIZACIÓN DE MINERAL POR DIRIMENCIA, REINTEGRO O DESCUENTO
            </Text>
          </View>

          <View style={styles.headerMeta}>
            <View style={styles.liqNumberRow}>
              <Text style={styles.liqNumberLabel}>N°  DE LIQ.:</Text>
              <Text style={styles.liqNumberValue}>{displayCorrelativo}</Text>
            </View>
            <View style={styles.fechaRow}>
              <Text style={styles.fechaLabel}>FECHA:</Text>
              <Text style={styles.fechaValue}>{displayFecha}</Text>
            </View>
          </View>
        </View>

        {/* ========== BLOQUES DE INFORMACIÓN ========== */}
        <View style={styles.infoSection}>
          {/* DATOS DEL PROVEEDOR */}
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>DATOS DEL PROVEEDOR</Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>RAZÓN SOCIAL:</Text>
              <Text style={styles.infoValue}>{dash(data.proveedor_nombre)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>R.U.C.:</Text>
              <Text style={styles.infoValue}>{dash(data.proveedor_ruc)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>DOMICILIO FISCAL:</Text>
              <Text style={styles.infoValue}>{dash(data.proveedor_direccion)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>CONCESIÓN MINERA:</Text>
              <Text style={styles.infoValue}>
                {data.concesion_nombre
                  ? `CONCESIÓN: ${data.concesion_nombre}${data.concesion_ubicacion && data.concesion_ubicacion !== "—" ? ` - UBICACIÓN: ${data.concesion_ubicacion}` : ""}`
                  : "—"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>CODIGO INGEMMET:</Text>
              <Text style={styles.infoValue}>{dash(data.concesion_codigo_reinfo)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>N° DE REGISTRO:</Text>
              <Text style={styles.infoValue}>—</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>ENTIDAD BANCARIA:</Text>
              <Text style={styles.infoValue}>{dash(data.cuenta_bancaria_banco)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 95 }]}>N° DE CUENTA / CCI:</Text>
              <Text style={styles.infoValue}>
                {`CTA: ${dash(data.cuenta_bancaria_numero)}   CCI: ${dash(data.cuenta_bancaria_cci)}`}
              </Text>
            </View>
          </View>

          {/* DATOS GENERALES */}
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>DATOS GENERALES</Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>GUÍA DE REMISIÓN REMITENTE:</Text>
              <Text style={styles.infoValue}>{dash(data.guia_remitente)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>GUÍA DE REMISIÓN TRANSPORTISTA:</Text>
              <Text style={styles.infoValue}>{dash(data.guia_transportista)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>LUGAR DE COMPRA:</Text>
              <Text style={styles.infoValue}>
                {dash(data.lugar_compra || "KM. 573 OTR. PANAMERICANA NORTE (B083464-13-01) LA LIBERTAD - TRUJILLO - HUANCHACO")}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>TMH TOTAL SEGÚN GR:</Text>
              <Text style={styles.infoValue}>{dash(data.tmh_total_gr)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>TMH TOTAL SEGÚN BALANZA:</Text>
              <Text style={styles.infoValue}>
                {data.tmh_total_balanza !== null && data.tmh_total_balanza !== undefined
                  ? fmtNum(Number(data.tmh_total_balanza), 3)
                  : fmtNum(sumTmh, 3)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { width: 145 }]}>FACTURA ASOCIADA:</Text>
              <Text style={styles.infoValue}>{dash(data.factura_asociada)}</Text>
            </View>
          </View>
        </View>

        {/* ========== TABLA DE LOTES ========== */}
        <View style={styles.tableContainer}>
          {/* Cabecera */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: colWidths.lote }]}>N°  DE LOTE</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.fecha }]}>FECHA</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.mineral }]}>MINERAL</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.ley }]}>LEY (oz/tc)</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.recup }]}>RECUP. %</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.inter }]}>INTER ($/oz)</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.desInter }]}>DES. INTER.</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.reac }]}>REAC.</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.pen }]}>PEN.</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.maquila }]}>MAQUILA</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.factor }]}>FACTOR</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.tmh }]}>TMH</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.h2o }]}>%H2O</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.tms }]}>TMS</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.precTms }]}>PREC X TMS</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.total, borderRightWidth: 0 }]}>TOTAL US$</Text>
          </View>

          {/* Filas de datos */}
          {detalles.map((d, index) => {
            const fechaFmt = (() => {
              if (!d.fecha_ingreso) return "—";
              const parts = d.fecha_ingreso.split("-");
              if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
              return d.fecha_ingreso;
            })();

            const mineralCode = (() => {
              const el = String(d.elemento_quimico || "").toLowerCase();
              if (el.includes("oro") || el === "au") return "Au";
              if (el.includes("plata") || el === "ag") return "Ag";
              return dash(d.elemento_quimico);
            })();

            return (
              <View key={`det-${d.id || index}`} style={styles.tableDataRow}>
                <Text style={[styles.tableDataCell, { width: colWidths.lote }]}>
                  {dash(d.lote_correlativo || (d.numero_correlativo ? `#${d.numero_correlativo}` : null))}
                </Text>
                <Text style={[styles.tableDataCell, { width: colWidths.fecha }]}>{fechaFmt}</Text>
                <Text style={[styles.tableDataCell, { width: colWidths.mineral }]}>{mineralCode}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.ley }]}>{fmtNum(d.ley, 3)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.recup }]}>{fmtNum(d.recuperacion, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.inter }]}>{fmtNum(d.inter, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.desInter }]}>{fmtNum(d.des_inter, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.reac }]}>{fmtNum(d.consumo, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.pen }]}>—</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.maquila }]}>{fmtNum(d.maquila, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.factor }]}>{fmtNum(d.factor, 5)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.tmh }]}>{fmtNum(d.tmh, 3)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.h2o }]}>{fmtNum(d.ley_humedad, 3)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.tms }]}>{fmtNum(d.tms, 3)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.precTms }]}>{fmtNum(d.precio_por_tonelada, 2)}</Text>
                <Text style={[styles.tableDataCellRight, { width: colWidths.total, borderRightWidth: 0 }]}>
                  {fmtNum(d.subtotal, 2)}
                </Text>
              </View>
            );
          })}

          {/* Fila de Totales de la Tabla */}
          <View style={styles.tableTotalsRow}>
            {/* Lote, Fecha, Mineral (vacíos con borde) */}
            <View
              style={{
                width: `${parseFloat(colWidths.lote) + parseFloat(colWidths.fecha) + parseFloat(colWidths.mineral)}%`,
                borderRightWidth: 0.5,
                borderRightColor: COLOR_BORDE,
                paddingVertical: 2.5,
              }}
            />
            {/* Celda amarilla LEY */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.ley }]}>
              {fmtNum(leyPonderada, 3)}
            </Text>
            {/* Celda amarilla RECUP. % */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.recup }]}>
              {fmtRecup(recupPonderada)}
            </Text>
            {/* Inter, Des. Inter, Reac, Pen, Maquila, Factor (vacíos con borde) */}
            <View
              style={{
                width: `${
                  parseFloat(colWidths.inter) +
                  parseFloat(colWidths.desInter) +
                  parseFloat(colWidths.reac) +
                  parseFloat(colWidths.pen) +
                  parseFloat(colWidths.maquila) +
                  parseFloat(colWidths.factor)
                }%`,
                borderRightWidth: 0.5,
                borderRightColor: COLOR_BORDE,
                paddingVertical: 2.5,
              }}
            />
            {/* Celda amarilla TMH */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.tmh }]}>{fmtNum(sumTmh, 3)}</Text>
            {/* Celda en blanco %H2O */}
            <View style={{ width: colWidths.h2o, borderRightWidth: 0.5, borderRightColor: COLOR_BORDE }} />
            {/* Celda amarilla TMS */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.tms }]}>{fmtNum(sumTms, 3)}</Text>
            {/* Celda amarilla PREC X TMS */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.precTms }]}>
              {fmtNum(precioPorTmsPonderado, 2)}
            </Text>
            {/* Celda amarilla TOTAL US$ */}
            <Text style={[styles.totalsYellowCell, { width: colWidths.total, borderRightWidth: 0 }]}>
              {fmtNum(sumTotalUss, 2)}
            </Text>
          </View>
        </View>

        {/* ========== RESUMEN ECONÓMICO (TOTALES) ========== */}
        <View style={styles.bottomSection}>
          <View style={styles.resumenTable}>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>SUBTOTAL US$</Text>
              <Text style={styles.resumenValue}>{fmtNum(subtotalUss, 2)}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>IGV 18%</Text>
              <Text style={styles.resumenValue}>{fmtNum(igv18, 2)}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>TOTAL US$</Text>
              <Text style={styles.resumenValue}>{fmtNum(totalUss, 2)}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>DETRACCIÓN 10%</Text>
              <Text style={styles.resumenValue}>{fmtNum(detraccion10, 2)}</Text>
            </View>

            <View style={styles.resumenRowFinal}>
              <Text style={styles.resumenLabel}>NETO A PAGAR US$</Text>
              <Text style={styles.resumenValue}>{fmtNum(netoAPagar, 2)}</Text>
            </View>
          </View>
        </View>

        {/* ========== FIRMAS AL PIE ========== */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Firma del Proveedor</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Area Comercial</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
