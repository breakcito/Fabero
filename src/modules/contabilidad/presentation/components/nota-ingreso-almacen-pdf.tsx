import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { RES_ValorizacionCompra } from "../../../valorizacion-compra/service/valorizacion-compra.responses";

interface Props {
  comprobante: RES_ComprobanteCompra;
  valorizacion?: RES_ValorizacionCompra | null;
}

const COLOR_AMARILLO = "#F6C343";
const COLOR_BORDE = "#9CA3AF";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000000",
  },
  // Encabezado superior
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companyInfo: {
    width: "60%",
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#EAB308",
    marginBottom: 2,
  },
  companyRuc: {
    fontSize: 7.5,
    color: "#4B5563",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 7,
    color: "#4B5563",
    lineHeight: 1.2,
  },
  logoBox: {
    borderWidth: 2,
    borderColor: "#EAB308",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#000000",
    letterSpacing: 0.5,
  },
  // Título y Correlativo
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
  },
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  docNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  // Bloque datos a 2 columnas
  fieldsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 20,
  },
  fieldsColLeft: {
    width: "55%",
  },
  fieldsColRight: {
    width: "42%",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    minHeight: 14,
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#1F2937",
    width: "35%",
  },
  fieldValueWrapper: {
    width: "65%",
    borderBottomWidth: 0.8,
    borderBottomColor: "#9CA3AF",
    paddingBottom: 1,
  },
  fieldValue: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#111827",
  },
  fieldLabelRight: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#1F2937",
    width: "42%",
  },
  fieldValueWrapperRight: {
    width: "58%",
    borderBottomWidth: 0.8,
    borderBottomColor: "#9CA3AF",
    paddingBottom: 1,
  },
  // Tabla de Productos
  tableContainer: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLOR_AMARILLO,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
    minHeight: 18,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: "#000000",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
    paddingVertical: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
    minHeight: 16,
  },
  tableRowEven: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    minHeight: 16,
  },
  tableCell: {
    fontFamily: "Helvetica",
    fontSize: 7,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: COLOR_BORDE,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  // Observaciones
  obsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: 4,
  },
  obsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    marginRight: 6,
  },
  obsLine: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#9CA3AF",
  },
  // Bloque de Firmas (3 cajas)
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000000",
    height: 70,
    justifyContent: "space-between",
  },
  signatureBoxHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#F3F4F6",
    paddingVertical: 2,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  signatureBoxFooter: {
    borderTopWidth: 0.5,
    borderTopColor: "#9CA3AF",
    paddingVertical: 2,
    textAlign: "center",
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#374151",
  },
});

const formatFechaCorta = (fechaIso?: string): string => {
  if (!fechaIso) return "—";
  try {
    const d = new Date(fechaIso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fechaIso;
  }
};

export const NotaIngresoAlmacenPdf = ({ comprobante, valorizacion }: Props) => {
  const proveedorNombre =
    comprobante.proveedor_nombre || valorizacion?.proveedor_nombre || "—";
  const proveedorRuc =
    comprobante.proveedor_ruc || valorizacion?.proveedor_ruc || "—";

  const guias =
    valorizacion?.guia_remitente ||
    valorizacion?.guia_transportista ||
    "—";

  // Agrupación por lote único para la tabla:
  // - DESCRIPCIÓN: fija "MINERAL AURIFERO EN BRUTO SIN PROCESAR"
  // - U.M.: fija "TONELADAS"
  // - CANTIDAD: peso neto original del lote (lote_mineral.peso_neto)
  // - CONTABILIZADA: peso modificado en las guías (lote_guia.peso_neto), sumando particiones si aplica
  // - ESTADO: "CONTABILIZADO"
  const mapaLotes = new Map<
    string,
    {
      codigo: string;
      pesoNetoLote: number;
      pesoContabilizado: number;
      guiasMap: Map<number, number>; // id_lote_guia -> peso_neto_guia
      fallbackTms: number;
    }
  >();

  const detalles = valorizacion?.detalles ?? [];
  for (const d of detalles) {
    const cod =
      d.lote_correlativo ||
      (d.id_lote_mineral ? `Lote #${d.id_lote_mineral}` : "—");

    if (!mapaLotes.has(cod)) {
      mapaLotes.set(cod, {
        codigo: cod,
        pesoNetoLote: d.peso_neto_lote ?? d.tmh ?? 0,
        pesoContabilizado: d.peso_contabilizado ?? 0,
        guiasMap: new Map(),
        fallbackTms: 0,
      });
    }

    const itemLote = mapaLotes.get(cod)!;
    if (d.peso_neto_lote != null && d.peso_neto_lote > 0) {
      itemLote.pesoNetoLote = d.peso_neto_lote;
    } else if (d.tmh > 0 && itemLote.pesoNetoLote === 0) {
      itemLote.pesoNetoLote = d.tmh;
    }

    if (d.peso_contabilizado != null && d.peso_contabilizado > 0) {
      itemLote.pesoContabilizado = d.peso_contabilizado;
    }

    if (d.id_lote_guia) {
      const pesoGuia = d.peso_neto_guia ?? 0;
      itemLote.guiasMap.set(d.id_lote_guia, pesoGuia);
    }
    itemLote.fallbackTms = Math.max(itemLote.fallbackTms, d.tms ?? 0);
  }

  const filasLotes = Array.from(mapaLotes.values()).map((lote) => {
    let sumaPesoGuias = 0;
    for (const p of lote.guiasMap.values()) {
      sumaPesoGuias += p;
    }

    const contabilizada =
      lote.pesoContabilizado > 0
        ? lote.pesoContabilizado
        : sumaPesoGuias > 0
          ? sumaPesoGuias
          : lote.fallbackTms > 0
            ? lote.fallbackTms
            : lote.pesoNetoLote;

    return {
      codigo: lote.codigo,
      cantidad: lote.pesoNetoLote,
      contabilizada,
    };
  });

  return (
    <Document title={`Nota de Ingreso al Almacén - ${comprobante.codigo_completo}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ENCABEZADO SUPERIOR */}
        <View style={styles.headerRow}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>FABRICACIONES FABERO S.A.C.</Text>
            <Text style={styles.companyRuc}>RUC: 20604623007</Text>
            <Text style={styles.companyAddress}>
              CAL. ESTAMBUL NRO. 178 URB. SANTA ISABEL
            </Text>
            <Text style={styles.companyAddress}>
              LA LIBERTAD - TRUJILLO - TRUJILLO
            </Text>
          </View>

          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FABERO S.A.C</Text>
          </View>
        </View>

        {/* TÍTULO Y NÚMERO */}
        <View style={styles.titleRow}>
          <Text style={styles.docTitle}>NOTA DE INGRESO AL ALMACEN</Text>
          <Text style={styles.docNumber}>N° —</Text>
        </View>

        {/* FORMULARIO A DOS COLUMNAS */}
        <View style={styles.fieldsContainer}>
          {/* COLUMNA IZQUIERDA */}
          <View style={styles.fieldsColLeft}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tipo de ingreso:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>Compra</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Almacén:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>MP</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Destino de uso:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>Comercial</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Lugar de recepción:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>
                  KM. 573 OTR. PANAMERICANA NORTE (B083464-13-01) LA LIBERTAD - TRUJILLO - HUANCHACO
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Guías de Remisión:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>{guias}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>RUC del Proveedor:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>{proveedorRuc}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Proveedor:</Text>
              <View style={styles.fieldValueWrapper}>
                <Text style={styles.fieldValue}>{proveedorNombre}</Text>
              </View>
            </View>
          </View>

          {/* COLUMNA DERECHA */}
          <View style={styles.fieldsColRight}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabelRight}>Fecha de Ingreso:</Text>
              <View style={styles.fieldValueWrapperRight}>
                <Text style={styles.fieldValue}>
                  {formatFechaCorta(
                    detalles[0]?.fecha_ingreso || comprobante.fecha_emision
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabelRight}>Orden de compra:</Text>
              <View style={styles.fieldValueWrapperRight}>
                <Text style={styles.fieldValue}>—</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabelRight}>Factura:</Text>
              <View style={styles.fieldValueWrapperRight}>
                <Text style={styles.fieldValue}>
                  {comprobante.codigo_completo || "—"}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabelRight}>Tipo de bien:</Text>
              <View style={styles.fieldValueWrapperRight}>
                <Text style={styles.fieldValue}>Mineral en bruto</Text>
              </View>
            </View>
          </View>
        </View>

        {/* TABLA DE PRODUCTOS */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>N°</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>CÓDIGO</Text>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
              DESCRIPCIÓN DEL PRODUCTO
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>U.M.</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
              CANTIDAD
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
              CONTABILIZADA
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "10%", borderRightWidth: 0 },
              ]}
            >
              ESTADO
            </Text>
          </View>

          {filasLotes.length > 0 ? (
            filasLotes.map((fila, idx) => {
              const rowStyle = idx % 2 === 0 ? styles.tableRow : styles.tableRowEven;
              const isLast = idx === filasLotes.length - 1;
              return (
                <View
                  key={fila.codigo || idx}
                  style={[rowStyle, isLast ? { borderBottomWidth: 0 } : {}]}
                >
                  <Text style={[styles.tableCell, { width: "5%" }]}>
                    {idx + 1}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%", fontFamily: "Helvetica-Bold" }]}>
                    {fila.codigo}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "40%", textAlign: "left", paddingLeft: 4 },
                    ]}
                  >
                    MINERAL AURIFERO EN BRUTO SIN PROCESAR
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    TONELADAS
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    {fila.contabilizada.toFixed(3)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    {fila.cantidad.toFixed(3)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "10%", borderRightWidth: 0 },
                    ]}
                  >
                    CONTABILIZADO
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { width: "5%" }]}>1</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>—</Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: "40%", textAlign: "left", paddingLeft: 4 },
                ]}
              >
                MINERAL AURIFERO EN BRUTO SIN PROCESAR
              </Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>TONELADAS</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>—</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>—</Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: "10%", borderRightWidth: 0 },
                ]}
              >
                CONTABILIZADO
              </Text>
            </View>
          )}
        </View>

        {/* OBSERVACIONES */}
        <View style={styles.obsContainer}>
          <Text style={styles.obsLabel}>Observaciones:</Text>
          <View style={styles.obsLine} />
        </View>

        {/* FIRMAS INFERIORES */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureBoxHeader}>ELABORÓ</Text>
            <Text style={styles.signatureBoxFooter}>Área Comercial</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureBoxHeader}>REVISÓ</Text>
            <Text style={styles.signatureBoxFooter}>Área de almacén</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureBoxHeader}>AUTORIZÓ</Text>
            <Text style={styles.signatureBoxFooter}>Gerente General</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
