import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { TicketIngresoVehiculoData } from "../../service/recepcion-unidades.responses";

/**
 * Ticket de Ingreso de Vehículos con Carga (Mitad de hoja / réplica fiel).
 * Réplica exacta de la plantilla corporativa FABERO S.A.C.:
 *  - Barra superior amarilla: "TICKET DE INGRESO DE VEHÍCULOS CON CARGA"
 *  - Marco con esquinas en L doradas a la derecha: "FABERO S.A.C"
 *  - Sub-header: Datos fiscales de Fabero y badge "T.I.V. Nº :" con correlativo
 *  - 4 cuadrantes con esquinas en L doradas:
 *      1. DATOS DEL REMITENTE
 *      2. DATOS DEL VEHÍCULO
 *      3. DATOS DEL TRANSPORTISTA
 *      4. DATOS GENERALES
 *  - Barra inferior amarilla: "OBSERVACIONES:"
 */

// Paleta de colores exacta de la imagen de referencia
const COLOR_AMARILLO = "#F6C343";      // Amarillo mostaza de barras y badge
const COLOR_CORNER = "#F59E0B";        // Ámbar/dorado de los bordes angulares en L
const COLOR_DORADO_TEXT = "#D97706";   // Dorado de los datos fiscales de Fabero
const COLOR_TEXTO = "#111827";         // Texto principal oscuro
const COLOR_MUTED = "#374151";         // Texto secundario

const PRODUCTO_DEFECTO = "MINERAL AURIFERO EN BRUTO SIN PROCESAR";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: "Helvetica",
    fontSize: 7.8,
    color: COLOR_TEXTO,
  },

  // ========== ENCABEZADO SUPERIOR ==========
  topRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleBar: {
    flex: 1,
    backgroundColor: COLOR_AMARILLO,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 20,
  },
  titleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#000000",
    letterSpacing: 0.5,
  },
  logoBox: {
    width: 170,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  logoCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 18,
    height: 18,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: COLOR_CORNER,
  },
  logoCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: COLOR_CORNER,
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: "#000000",
    letterSpacing: 0.8,
  },

  // ========== SUB-HEADER: DATOS FABERO & TIV ==========
  subHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  faberoInfo: {
    flex: 1,
    paddingRight: 16,
  },
  faberoTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: COLOR_DORADO_TEXT,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  faberoRuc: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    color: COLOR_DORADO_TEXT,
    marginBottom: 1.5,
  },
  faberoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: COLOR_DORADO_TEXT,
    lineHeight: 1.25,
  },
  tivContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tivLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLOR_DORADO_TEXT,
  },
  tivBox: {
    backgroundColor: COLOR_AMARILLO,
    paddingVertical: 4.5,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  tivText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#000000",
  },

  // ========== GRILLA 2x2 DE CUADRANTES ==========
  gridContainer: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    position: "relative",
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 10,
    minHeight: 118,
  },
  cardCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderTopWidth: 2.8,
    borderLeftWidth: 2.8,
    borderColor: COLOR_CORNER,
  },
  cardCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 2.8,
    borderRightWidth: 2.8,
    borderColor: COLOR_CORNER,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.8,
    color: "#000000",
    marginBottom: 5,
    letterSpacing: 0.3,
  },

  // Campos dentro de cada cuadrante
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2.5,
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: COLOR_TEXTO,
    flexShrink: 0,
  },
  fieldValue: {
    fontFamily: "Helvetica",
    fontSize: 7.2,
    color: COLOR_MUTED,
    flex: 1,
    marginLeft: 3,
  },
  fieldValueBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: "#000000",
    flex: 1,
    marginLeft: 3,
  },

  // ========== PIE / OBSERVACIONES ==========
  obsBar: {
    backgroundColor: COLOR_AMARILLO,
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  obsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#000000",
  },
  obsText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000000",
    marginLeft: 6,
  },
});

// Helper para strings nulos/vacíos
const dash = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s === "" ? "—" : s;
};

// Formato TM con 2 decimales
const fmtTm = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n) || n <= 0) return "—";
  return `${n.toFixed(2)} TM`;
};

export interface TicketIngresoVehiculoPdfProps {
  data: TicketIngresoVehiculoData;
}

export const TicketIngresoVehiculoPdf = ({ data }: TicketIngresoVehiculoPdfProps) => {
  const displayCorrelativo = dash(data.tiv || data.correlativo);
  const displayProducto = (data.remitente?.producto && data.remitente.producto.trim() !== "")
    ? data.remitente.producto
    : PRODUCTO_DEFECTO;

  return (
    <Document title={`Ticket de Ingreso ${displayCorrelativo}`}>
      <Page size="A5" orientation="landscape" style={styles.page}>
        {/* ========== ENCABEZADO SUPERIOR ========== */}
        <View style={styles.topRow}>
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>TICKET DE INGRESO DE VEHÍCULOS CON CARGA</Text>
          </View>
          <View style={styles.logoBox}>
            <View style={styles.logoCornerTL} />
            <View style={styles.logoCornerBR} />
            <Text style={styles.logoText}>FABERO S.A.C</Text>
          </View>
        </View>

        {/* ========== SUB-HEADER (DATOS FABERO & TIV) ========== */}
        <View style={styles.subHeaderRow}>
          <View style={styles.faberoInfo}>
            <Text style={styles.faberoTitle}>
              {data.empresa_fabero?.razon_social || "FABRICACIONES FABERO S.A.C."}
            </Text>
            <Text style={styles.faberoRuc}>
              RUC: {data.empresa_fabero?.ruc || "20604623007"}
            </Text>
            <Text style={styles.faberoText}>
              DOMICILIO FISCAL: {dash(data.empresa_fabero?.domicilio_fiscal)}
            </Text>
            <Text style={styles.faberoText}>
              SEDE PRODUCTIVA: {dash(data.empresa_fabero?.sede_productiva)}
            </Text>
          </View>

          <View style={styles.tivContainer}>
            <Text style={styles.tivLabel}>T.I.V. Nº :</Text>
            <View style={styles.tivBox}>
              <Text style={styles.tivText}>{displayCorrelativo}</Text>
            </View>
          </View>
        </View>

        {/* ========== GRILLA 2x2 ========== */}
        <View style={styles.gridContainer}>
          {/* ---- FILA 1: REMITENTE | VEHÍCULO ---- */}
          <View style={styles.gridRow}>
            {/* Cuadrante 1: DATOS DEL REMITENTE */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS DEL REMITENTE</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>RAZÓN SOCIAL:</Text>
                <Text style={styles.fieldValue}>{dash(data.remitente?.razon_social)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{dash(data.remitente?.ruc)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>PROCEDENCIA:</Text>
                <Text style={styles.fieldValue}>{dash(data.remitente?.procedencia)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>DESTINO:</Text>
                <Text style={styles.fieldValue}>{dash(data.remitente?.destino)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 125 }]}>
                  GUÍA DE REMISIÓN REMITENTE:
                </Text>
                <Text style={styles.fieldValue}>{dash(data.remitente?.guia_remitente)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 60 }]}>PRODUCTO:</Text>
                <Text style={styles.fieldValue}>{displayProducto}</Text>
              </View>
            </View>

            {/* Cuadrante 2: DATOS DEL VEHÍCULO */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS DEL VEHÍCULO</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>PLACA VEHÍCULO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo?.placa)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>MARCA TRACTO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo?.marca_tracto)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>PLACA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo?.placa_carreta)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>MARCA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo?.marca_carreta)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 155 }]}>
                  INFORMACIÓN DEL SUB CONTRATISTA:
                </Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo?.subcontratista)}</Text>
              </View>
            </View>
          </View>

          {/* ---- FILA 2: TRANSPORTISTA | GENERALES ---- */}
          <View style={styles.gridRow}>
            {/* Cuadrante 3: DATOS DEL TRANSPORTISTA */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS DEL TRANSPORTISTA</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>RAZÓN SOCIAL:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista?.razon_social)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista?.ruc)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 145 }]}>
                  GUÍA DE REMISIÓN TRANSPORTISTA:
                </Text>
                <Text style={styles.fieldValue}>{dash(data.transportista?.guia_transportista)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 120 }]}>NOMBRE DEL CONDUCTOR:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista?.conductor_nombre)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 55 }]}>LICENCIA:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista?.licencia)}</Text>
              </View>
            </View>

            {/* Cuadrante 4: DATOS GENERALES */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS GENERALES</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>FECHA DE INGRESO:</Text>
                <Text style={styles.fieldValue}>{dash(data.generales?.fecha_ingreso)}</Text>
              </View>

              <View style={[styles.fieldRow, { marginBottom: 6 }]}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>HORA DE INGRESO:</Text>
                <Text style={styles.fieldValue}>{dash(data.generales?.hora_ingreso)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>FECHA DE SALIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.generales?.fecha_salida)}</Text>
              </View>

              <View style={[styles.fieldRow, { marginBottom: 6 }]}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>HORA DE SALIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.generales?.hora_salida)}</Text>
              </View>

              <View style={[styles.fieldRow, { marginBottom: 6 }]}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>
                  PESO DE GUÍAS DE REMISIÓN:
                </Text>
                <Text style={styles.fieldValue}>{fmtTm(data.generales?.peso_guia_tm)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>
                  PESO VEHICULAR TOTAL:
                </Text>
                <Text style={styles.fieldValueBold}>{fmtTm(data.generales?.peso_vehicular_total_tm)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========== OBSERVACIONES AL PIE ========== */}
        <View style={styles.obsBar}>
          <Text style={styles.obsLabel}>OBSERVACIONES:</Text>
          <Text style={styles.obsText}>{data.observaciones && data.observaciones !== "—" ? data.observaciones : ""}</Text>
        </View>
      </Page>
    </Document>
  );
};
