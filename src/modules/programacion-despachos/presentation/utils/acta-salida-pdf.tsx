import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ActaSalidaVehiculoData } from "../../service/programacion-despachos.responses";

/**
 * Ticket de Salida de Vehículos con Carga (A5 horizontal 210 × 148 mm).
 * Réplica exacta del formato corporativo FABERO S.A.C.:
 *  - Barra superior amarilla: "TICKET DE SALIDA DE VEHÍCULOS CON CARGA"
 *  - Marco con esquinas en L doradas a la derecha: "FABERO S.A.C"
 *  - Datos de Fabricaciones Fabero S.A.C. en tono mostaza/dorado a la izquierda
 *  - Caja T.S.V. N° en amarillo a la derecha con el correlativo
 *  - 4 cuadrantes con esquinas en L doradas/ámbar:
 *      1. DATOS DEL REMITENTE (Empresa o Planta Destino seleccionada en Guía de 2do tramo)
 *      2. DATOS DEL VEHÍCULO
 *      3. DATOS DEL TRANSPORTISTA
 *      4. DATOS GENERALES
 *  - Barra inferior amarilla: "OBSERVACIONES:"
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 419.53;

// Paleta de colores fiel a la imagen de referencia
const COLOR_AMARILLO = "#F6C343";      // Amarillo dorado de barras y cajas
const COLOR_CORNER = "#F59E0B";        // Ámbar/dorado de los bordes angulares en L
const COLOR_DORADO_TEXT = "#D97706";   // Dorado de los datos fiscales de Fabero
const COLOR_TEXTO = "#111827";         // Texto principal oscuro
const COLOR_MUTED = "#374151";         // Texto secundario

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLOR_TEXTO,
  },

  // ========== ENCABEZADO SUPERIOR ==========
  topRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  titleBar: {
    flex: 1,
    backgroundColor: COLOR_AMARILLO,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 14,
  },
  titleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#000000",
    letterSpacing: 0.5,
  },
  logoBox: {
    width: 140,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  logoCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLOR_CORNER,
  },
  logoCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLOR_CORNER,
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#000000",
    letterSpacing: 0.8,
  },

  // ========== SUB-HEADER: DATOS FABERO & TSV ==========
  subHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  faberoInfo: {
    flex: 1,
    paddingRight: 10,
  },
  faberoTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLOR_DORADO_TEXT,
    marginBottom: 1.5,
    letterSpacing: 0.3,
  },
  faberoRuc: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: COLOR_DORADO_TEXT,
    marginBottom: 1,
  },
  faberoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: COLOR_DORADO_TEXT,
    lineHeight: 1.2,
  },
  tsvContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tsvLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLOR_DORADO_TEXT,
  },
  tsvBox: {
    backgroundColor: COLOR_AMARILLO,
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 85,
  },
  tsvText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#000000",
  },

  // ========== GRILLA 2x2 DE CUADRANTES ==========
  gridContainer: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    position: "relative",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 8,
    minHeight: 110,
  },
  cardCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: COLOR_CORNER,
  },
  cardCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: COLOR_CORNER,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#000000",
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  // Campos dentro de cada cuadrante
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: COLOR_TEXTO,
    flexShrink: 0,
  },
  fieldValue: {
    fontFamily: "Helvetica",
    fontSize: 6.8,
    color: COLOR_MUTED,
    flex: 1,
    marginLeft: 3,
  },
  fieldValueBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#000000",
    flex: 1,
    marginLeft: 3,
  },

  // ========== PIE / OBSERVACIONES ==========
  obsBar: {
    backgroundColor: COLOR_AMARILLO,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  obsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#000000",
  },
  obsText: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
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

// Formato TM con 3 decimales
const fmtTm = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n) || n <= 0) return "—";
  return `${n.toFixed(3)} TM`;
};

export interface ActaSalidaPdfProps {
  data: ActaSalidaVehiculoData;
}

export const ActaSalidaPdf = ({ data }: ActaSalidaPdfProps) => {
  // El remitente proviene de la Empresa o Planta de Destino seleccionada en la Guía de Segundo Tramo
  const remitenteRazonSocial = dash(
    data.remitente?.razon_social || data.proveedor?.razon_social
  );
  const remitenteRuc = dash(data.remitente?.ruc || data.proveedor?.ruc);
  const remitentePartida = dash(
    data.remitente?.direccion_partida || data.proveedor?.direccion_partida
  );
  const remitenteDestino = dash(
    data.remitente?.direccion_destino || data.destino?.direccion
  );

  return (
    <Document title={`Ticket de Salida ${data.tsv || data.correlativo}`}>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} orientation="landscape" style={styles.page}>
        {/* ========== ENCABEZADO SUPERIOR ========== */}
        <View style={styles.topRow}>
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>TICKET DE SALIDA DE VEHÍCULOS CON CARGA</Text>
          </View>
          <View style={styles.logoBox}>
            <View style={styles.logoCornerTL} />
            <View style={styles.logoCornerBR} />
            <Text style={styles.logoText}>FABERO S.A.C</Text>
          </View>
        </View>

        {/* ========== SUB-HEADER (EMPRESA EMISORA & TSV) ========== */}
        <View style={styles.subHeaderRow}>
          <View style={styles.faberoInfo}>
            <Text style={styles.faberoTitle}>
              {data.empresa_remitente?.razon_social || "FABRICACIONES FABERO S.A.C."}
            </Text>
            <Text style={styles.faberoRuc}>
              RUC: {data.empresa_remitente?.ruc || "20604623007"}
            </Text>
            <Text style={styles.faberoText}>
              DOMICILIO FISCAL: {dash(data.empresa_remitente?.domicilio_fiscal)}
            </Text>
            <Text style={styles.faberoText}>
              SEDE PRODUCTIVA: {dash(data.empresa_remitente?.sede_productiva)}
            </Text>
          </View>

          <View style={styles.tsvContainer}>
            <Text style={styles.tsvLabel}>T.S.V. Nº</Text>
            <View style={styles.tsvBox}>
              <Text style={styles.tsvText}>{dash(data.tsv || data.correlativo)}</Text>
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
                <Text style={styles.fieldValue}>{remitenteRazonSocial}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{remitenteRuc}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>PARTIDA:</Text>
                <Text style={styles.fieldValue}>{remitentePartida}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>DESTINO:</Text>
                <Text style={styles.fieldValue}>{remitenteDestino}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 125 }]}>
                  GUÍA DE REMISIÓN REMITENTE:
                </Text>
                <Text style={styles.fieldValue}>{dash(data.guia_remitente)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 60 }]}>PRODUCTO:</Text>
                <Text style={styles.fieldValue}>{dash(data.producto)}</Text>
              </View>
            </View>

            {/* Cuadrante 2: DATOS DEL VEHÍCULO */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS DEL VEHÍCULO</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>PLACA VEHÍCULO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo.placa)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>MARCA TRACTO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo.marca_trabajo)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>PLACA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.carreta?.placa)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 85 }]}>MARCA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.carreta?.marca_trabajo)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 155 }]}>
                  INFORMACIÓN DEL SUB CONTRATISTA:
                </Text>
                <Text style={styles.fieldValue}>—</Text>
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
                <Text style={styles.fieldValue}>{dash(data.transportista.razon_social)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista.ruc)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 145 }]}>
                  GUÍA DE REMISIÓN TRANSPORTISTA:
                </Text>
                <Text style={styles.fieldValue}>{dash(data.guia_transportista)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 120 }]}>NOMBRE DEL CONDUCTOR:</Text>
                <Text style={styles.fieldValue}>{dash(data.conductor.nombre_completo)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 55 }]}>LICENCIA:</Text>
                <Text style={styles.fieldValue}>{dash(data.conductor.licencia)}</Text>
              </View>
            </View>

            {/* Cuadrante 4: DATOS GENERALES */}
            <View style={styles.card}>
              <View style={styles.cardCornerTL} />
              <View style={styles.cardCornerBR} />

              <Text style={styles.cardTitle}>DATOS GENERALES</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 95 }]}>FECHA DE INGRESO:</Text>
                <Text style={styles.fieldValue}>{dash(data.fecha_ingreso)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 95 }]}>HORA DE INGRESO:</Text>
                <Text style={styles.fieldValue}>{dash(data.hora_ingreso)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 95 }]}>FECHA DE SALIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.fecha_salida)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 95 }]}>HORA DE SALIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.hora_salida)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>
                  PESO DE GUÍAS DE REMISIÓN:
                </Text>
                <Text style={styles.fieldValue}>{fmtTm(data.peso_guia_tm)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 130 }]}>
                  PESO VEHICULAR TOTAL:
                </Text>
                <Text style={styles.fieldValueBold}>{fmtTm(data.peso_vehicular_total_tm)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { width: 75 }]}>COD. DE LOTE:</Text>
                <Text style={styles.fieldValueBold}>{dash(data.cod_lote)}</Text>
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
