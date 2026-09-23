import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ActaSalidaVehiculoData } from "../../service/programacion-despachos.responses";

/**
 * Acta de Salida de Vehículos con Carga (Ticket A5 horizontal 210×148 mm).
 * Réplica del formato "FABERO S.A.C.":
 *  - Fondo de página BLANCO
 *  - Franjas amarillas (yellow-300) en headers de sección + caja T.S.V.
 *  - Bordes negros finos en la grilla 2x2 y caja T.S.V.
 *  - Tipografía Courier monoespaciada (label bold, valor regular)
 *
 * Sin marca de agua "Pagina 1" — se usa `<Page>` sin `watermark`.
 * Los campos nulos se renderizan como "—".
 */

// A5 horizontal apaisado: 210 mm × 148 mm.
// 1 mm = 2.834645669 pt → 595.28 × 419.53 pt.
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 420;

// Paleta
const AMARILLO = "#FCD34D"; // yellow-300 (Tailwind)
const NEGRO = "#000000";

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: "#FFFFFF", // ← FONDO BLANCO según la imagen
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: "Courier",
    fontSize: 8,
    color: NEGRO,
    lineHeight: 1.2,
  },

  // ========== HEADER ==========
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 6,
  },
  headerRight: {
    width: 120,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Courier-Bold",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 3,
  },
  brand: {
    fontFamily: "Courier-Bold",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 1,
  },
  rucRow: {
    flexDirection: "row",
    fontSize: 8,
    marginBottom: 1,
  },
  domicilio: {
    fontSize: 7.5,
    marginBottom: 0.5,
  },
  sede: {
    fontSize: 7.5,
    marginBottom: 0,
  },
  // Caja del T.S.V. N°: amarillo con borde negro
  tsvBox: {
    backgroundColor: AMARILLO,
    borderWidth: 1,
    borderColor: NEGRO,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 105,
  },
  tsvLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 8,
    color: NEGRO,
    marginBottom: 1,
  },
  tsvValue: {
    fontFamily: "Courier-Bold",
    fontSize: 11,
    color: NEGRO,
  },

  // ========== GRILLA 2x2 CON FRANJAS AMARILLAS EN HEADERS ==========
  grid: {
    flexDirection: "column",
    // Borde exterior de la grilla (negro, 1pt)
    borderWidth: 1,
    borderColor: NEGRO,
  },
  gridRow: {
    flexDirection: "row",
  },
  // Cada celda: divider interno entre filas (borderTop a partir de la 2da fila)
  cell: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 4,
    // Divisor vertical entre celdas izquierda/derecha (la mitad derecha)
    borderLeftWidth: 1,
    borderLeftColor: NEGRO,
  },
  // Franja amarilla del header de sección (mismo ancho que la celda)
  cellTitleBar: {
    backgroundColor: AMARILLO,
    paddingHorizontal: 6,
    paddingVertical: 4,
    // Que ocupe todo el ancho interno de la celda
    marginHorizontal: -6,
    marginTop: -4,
    paddingTop: 5,
    paddingBottom: 5,
  },
  cellTitle: {
    fontFamily: "Courier-Bold",
    fontSize: 10,
    color: NEGRO,
    letterSpacing: 0.4,
  },
  field: {
    flexDirection: "row",
    marginVertical: 1.5,
    alignItems: "flex-start",
  },
  fieldLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 8,
    width: 130,
    flexShrink: 0,
  },
  fieldValue: {
    fontFamily: "Courier",
    fontSize: 8,
    flex: 1,
  },

  // ========== OBSERVACIONES (franja amarilla al pie) ==========
  observacionesWrap: {
    borderTopWidth: 1,
    borderTopColor: NEGRO,
    marginTop: 0,
  },
  obsBar: {
    backgroundColor: AMARILLO,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  obsLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 10,
    color: NEGRO,
    letterSpacing: 0.4,
  },
  obsBody: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 8,
  },
});

// Helper para nulos: cualquier valor vacío o null cae a "—".
const dash = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s === "" ? "—" : s;
};

// Formato TM (3 decimales) si > 0; caso contrario "—".
const fmtTm = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n) || n <= 0) return "—";
  return `${n.toFixed(3)} TM`;
};

export interface ActaSalidaPdfProps {
  data: ActaSalidaVehiculoData;
}

export const ActaSalidaPdf = ({ data }: ActaSalidaPdfProps) => {
  return (
    <Document title={`Acta de Salida ${data.correlativo}`}>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} orientation="landscape" style={styles.page}>
        {/* ========== HEADER ========== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>TICKET DE SALIDA DE VEHÍCULOS CON CARGA</Text>
            <Text style={styles.brand}>FABRICACIONES FABERO S.A.C</Text>
            <View style={styles.rucRow}>
              <Text style={styles.fieldLabel}>RUC:</Text>
              <Text style={styles.fieldValue}>{`\u00A0${dash(data.empresa_remitente.ruc)}`}</Text>
            </View>
            <Text style={styles.domicilio}>
              DOMICILIO FISCAL: {dash(data.empresa_remitente.domicilio_fiscal)}
            </Text>
            <Text style={styles.sede}>
              SEDE PRODUCTIVA: {dash(data.empresa_remitente.sede_productiva)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.tsvBox}>
              <Text style={styles.tsvLabel}>T.S.V. N°:</Text>
              <Text style={styles.tsvValue}>{dash(data.tsv)}</Text>
            </View>
          </View>
        </View>

        {/* ========== GRILLA 2x2 ========== */}
        <View style={styles.grid}>
          {/* ---- FILA 1: REMITENTE | VEHÍCULO ---- */}
          <View style={styles.gridRow}>
            {/* Celda 1: DATOS DEL REMITENTE */}
            <View style={styles.cell}>
              <View style={styles.cellTitleBar}>
                <Text style={styles.cellTitle}>DATOS DEL REMITENTE</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>RAZÓN SOCIAL:</Text>
                <Text style={styles.fieldValue}>{dash(data.proveedor.razon_social)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{dash(data.proveedor.ruc)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PARTIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.proveedor.direccion_partida)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DESTINO:</Text>
                <Text style={styles.fieldValue}>{dash(data.destino.direccion)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>GUÍA DE REMISIÓN REMITENTE:</Text>
                <Text style={styles.fieldValue}>{dash(data.guia_remitente)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PRODUCTO:</Text>
                <Text style={styles.fieldValue}>{dash(data.producto)}</Text>
              </View>
            </View>

            {/* Celda 2: DATOS DEL VEHÍCULO */}
            <View style={styles.cell}>
              <View style={styles.cellTitleBar}>
                <Text style={styles.cellTitle}>DATOS DEL VEHÍCULO</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PLACA VEHÍCULO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo.placa)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>MARCA TRACTO:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo.marca_trabajo)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PLACA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.carreta?.placa ?? null)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>MARCA CARRETA:</Text>
                <Text style={styles.fieldValue}>{dash(data.carreta?.marca_trabajo ?? null)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CONFIG. VEHICULAR:</Text>
                <Text style={styles.fieldValue}>{dash(data.vehiculo.configuracion_vehicular ?? null)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PLATAFORMA CONTRATISTA:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista.plataforma_contratista ?? null)}</Text>
              </View>
            </View>
          </View>

          {/* ---- FILA 2: TRANSPORTE | GENERALES ---- */}
          <View style={styles.gridRow}>
            {/* Celda 3: DATOS TRANSPORTE */}
            <View style={[styles.cell, { borderTopWidth: 1, borderTopColor: NEGRO }]}>
              <View style={styles.cellTitleBar}>
                <Text style={styles.cellTitle}>DATOS TRANSPORTE</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>RAZÓN SOCIAL:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista.razon_social)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>R.U.C.:</Text>
                <Text style={styles.fieldValue}>{dash(data.transportista.ruc)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>GUÍA DE REMISIÓN TRANSPORTISTA:</Text>
                <Text style={styles.fieldValue}>{dash(data.guia_transportista)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>NOMBRE DEL CONDUCTOR:</Text>
                <Text style={styles.fieldValue}>{dash(data.conductor.nombre_completo)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>LICENCIA:</Text>
                <Text style={styles.fieldValue}>{dash(data.conductor.licencia)}</Text>
              </View>
            </View>

            {/* Celda 4: DATOS GENERALES */}
            <View style={[styles.cell, { borderTopWidth: 1, borderTopColor: NEGRO }]}>
              <View style={styles.cellTitleBar}>
                <Text style={styles.cellTitle}>DATOS GENERALES</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>FECHA DE INGRESO:</Text>
                <Text style={styles.fieldValue}>{dash(data.fecha_ingreso)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>HORA DE SALIDA:</Text>
                <Text style={styles.fieldValue}>{dash(data.hora_salida)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PESO DE GUÍA DE REMISIÓN:</Text>
                <Text style={styles.fieldValue}>{fmtTm(data.peso_guia_tm)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PESO VEHICULAR TOTAL:</Text>
                <Text style={styles.fieldValue}>{fmtTm(data.peso_vehicular_total_tm)}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>COD. DE LOTE:</Text>
                <Text style={styles.fieldValue}>{dash(data.cod_lote)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========== OBSERVACIONES (franja amarilla al pie) ========== */}
        <View style={styles.observacionesWrap}>
          <View style={styles.obsBar}>
            <Text style={styles.obsLabel}>OBSERVACIONES:</Text>
          </View>
          <View style={styles.obsBody}>
            <Text>—</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
