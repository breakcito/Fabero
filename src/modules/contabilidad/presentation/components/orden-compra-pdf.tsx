import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { RES_ValorizacionCompra } from "../../../valorizacion-compra/service/valorizacion-compra.responses";
import { numeroALetras } from "../../../../shared/functions/numero-a-letras";

interface Props {
  comprobante: RES_ComprobanteCompra;
  valorizacion?: RES_ValorizacionCompra | null;
}

const COLOR_AMARILLO = "#F6C343";
const COLOR_BORDE = "#000000";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    fontFamily: "Helvetica",
    fontSize: 7.2,
    color: "#000000",
  },
  // Encabezado
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  companyInfo: {
    width: "60%",
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginBottom: 1,
  },
  companySub: {
    fontSize: 6.8,
    color: "#374151",
    marginBottom: 1,
  },
  logoBox: {
    borderWidth: 2,
    borderColor: "#EAB308",
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#000000",
    letterSpacing: 0.5,
  },
  // Título
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  // Cuadrícula Formulario
  gridTable: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: COLOR_BORDE,
    minHeight: 14,
    alignItems: "stretch",
  },
  yellowCell: {
    backgroundColor: COLOR_AMARILLO,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 0.8,
    borderRightColor: COLOR_BORDE,
    justifyContent: "center",
  },
  whiteCell: {
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    fontSize: 6.8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 0.8,
    borderRightColor: COLOR_BORDE,
    justifyContent: "center",
  },
  // Tabla de Items
  itemsTable: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    marginBottom: 8,
  },
  itemsHeader: {
    flexDirection: "row",
    backgroundColor: COLOR_AMARILLO,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
    minHeight: 16,
  },
  itemsHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    textAlign: "center",
    borderRightWidth: 0.8,
    borderRightColor: COLOR_BORDE,
    paddingVertical: 2,
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: COLOR_BORDE,
    alignItems: "center",
    minHeight: 16,
  },
  itemCell: {
    fontFamily: "Helvetica",
    fontSize: 6.8,
    textAlign: "center",
    borderRightWidth: 0.8,
    borderRightColor: COLOR_BORDE,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  notaRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomWidth: 0.8,
    borderBottomColor: COLOR_BORDE,
    backgroundColor: "#FFFFFF",
  },
  // Sección Inferior (Son + Totales)
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 2,
  },
  leftBottom: {
    width: "60%",
  },
  sonText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    marginBottom: 16,
  },
  selloBox: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    height: 80,
    width: "100%",
    flexDirection: "row",
  },
  selloHeader: {
    backgroundColor: COLOR_AMARILLO,
    width: "35%",
    borderRightWidth: 1,
    borderRightColor: COLOR_BORDE,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  selloHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    textAlign: "center",
  },
  selloContent: {
    width: "65%",
    backgroundColor: "#FFFFFF",
  },
  // Resumen Totales (Derecha)
  totalsTable: {
    width: "38%",
    borderWidth: 1,
    borderColor: COLOR_BORDE,
  },
  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: COLOR_BORDE,
    minHeight: 14,
    alignItems: "center",
  },
  totalLabelCell: {
    backgroundColor: COLOR_AMARILLO,
    width: "55%",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 0.8,
    borderRightColor: COLOR_BORDE,
  },
  totalValueCell: {
    width: "45%",
    fontFamily: "Helvetica",
    fontSize: 6.8,
    textAlign: "right",
    paddingVertical: 2,
    paddingRight: 6,
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

export const OrdenCompraPdf = ({ comprobante, valorizacion }: Props) => {
  const proveedorNombre =
    comprobante.proveedor_nombre || valorizacion?.proveedor_nombre || "—";
  const proveedorRuc =
    comprobante.proveedor_ruc || valorizacion?.proveedor_ruc || "—";
  const proveedorDireccion = valorizacion?.proveedor_direccion || "—";

  const concesionNombre =
    comprobante.concesion_nombre || valorizacion?.concesion_nombre || "—";
  const concesionUbicacion = valorizacion?.concesion_ubicacion || "—";

  const detalles = valorizacion?.detalles ?? [];

  // Cálculos económicos
  const subtotal =
    valorizacion?.total_subtotal != null
      ? valorizacion.total_subtotal
      : comprobante.total_dolares_antes_descuento || comprobante.total_dolares || 0;

  const anticipo =
    valorizacion?.total_anticipos != null
      ? valorizacion.total_anticipos
      : comprobante.monto_pagado_anticipos || 0;

  const valorVenta = Math.max(0, subtotal - anticipo);
  const igv = valorVenta * 0.18;
  const total = valorVenta + igv;
  const detraccion = total * 0.10;
  const netoAPagar = total - detraccion;

  const sonTexto = numeroALetras(total);

  return (
    <Document title={`Orden de Compra - ${comprobante.codigo_completo}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.headerRow}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>FABRICACIONES FABERO S.A.C.</Text>
            <Text style={styles.companySub}>Ruc: 20604623007</Text>
            <Text style={styles.companySub}>
              Domicilio fiscal: CAL. ESTAMBUL NRO. 178 URB. SANTA ISABEL LA LIBERTAD - TRUJILLO - TRUJILLO
            </Text>
          </View>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FABERO S.A.C</Text>
          </View>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>ORDEN DE COMPRA</Text>

        {/* CUADRÍCULA DE CAMPOS */}
        <View style={styles.gridTable}>
          {/* Fila 1 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>FECHA DE EMISIÓN:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "45%" }]}>
              <Text>{formatFechaCorta(comprobante.fecha_emision)}</Text>
            </View>
            <View style={[styles.yellowCell, { width: "12%" }]}>
              <Text>N° OC:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%", borderRightWidth: 0 }]}>
              <Text>—</Text>
            </View>
          </View>

          {/* Fila 2 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>CONSIGNATARIO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "45%" }]}>
              <Text>FABRICACIONES FABERO S.A.C.</Text>
            </View>
            <View style={[styles.yellowCell, { width: "12%" }]}>
              <Text>ÁREA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%", borderRightWidth: 0 }]}>
              <Text>COMERCIAL</Text>
            </View>
          </View>

          {/* Fila 3 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>RAZÓN SOCIAL PROVEEDOR:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "45%" }]}>
              <Text>{proveedorNombre}</Text>
            </View>
            <View style={[styles.yellowCell, { width: "12%" }]}>
              <Text>R.U.C.:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%", borderRightWidth: 0 }]}>
              <Text>{proveedorRuc}</Text>
            </View>
          </View>

          {/* Fila 4 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>DIRECCIÓN FISCAL:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "77%", borderRightWidth: 0 }]}>
              <Text>{proveedorDireccion}</Text>
            </View>
          </View>

          {/* Fila 5 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>ORIGEN:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "77%", borderRightWidth: 0 }]}>
              <Text>
                CONCESIÓN: {concesionNombre} - UBICACIÓN: {concesionUbicacion}
              </Text>
            </View>
          </View>

          {/* Fila 6 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>NOMBRE DEL CONTACTO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "77%", borderRightWidth: 0 }]}>
              <Text>—</Text>
            </View>
          </View>

          {/* Fila 7 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>TELÉFONO DEL CONTACTO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "20%" }]}>
              <Text>CORREO DEL CONTACTO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "37%", borderRightWidth: 0 }]}>
              <Text>—</Text>
            </View>
          </View>

          {/* Fila 8 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>N° COTIZACIÓN/LIQ:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "20%" }]}>
              <Text>MOTIVO DE LA COMPRA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "37%", borderRightWidth: 0 }]}>
              <Text>COMPRA DE MINERAL EN BRUTO</Text>
            </View>
          </View>

          {/* Fila 9 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>DOC. MODIFICA (FACTURA):</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%" }]}>
              <Text>{comprobante.codigo_completo || "—"}</Text>
            </View>
            <View style={[styles.yellowCell, { width: "20%" }]}>
              <Text>MOTIVO O SUSTENTO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "37%", borderRightWidth: 0 }]}>
              <Text>—</Text>
            </View>
          </View>

          {/* Fila 10 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>SOLICITADO POR:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "37%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "10%" }]}>
              <Text>ÁREA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "30%", borderRightWidth: 0 }]}>
              <Text>ÁREA COMERCIAL</Text>
            </View>
          </View>

          {/* Fila 11 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>AUTORIZADO POR:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "37%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "10%" }]}>
              <Text>ÁREA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "30%", borderRightWidth: 0 }]}>
              <Text>GERENCIA GENERAL</Text>
            </View>
          </View>

          {/* Fila 12 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>BIEN O SERVICIO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "77%", borderRightWidth: 0 }]}>
              <Text>MINERALES DE ORO Y SUS CONCENTRADOS GRAVADOS CON EL IGV</Text>
            </View>
          </View>

          {/* Fila 13 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>LUGAR DE ENTREGA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "77%", borderRightWidth: 0 }]}>
              <Text>
                KM. 573 OTR. PANAMERICANA NORTE (B083464-13-01) LA LIBERTAD - TRUJILLO - HUANCHACO
              </Text>
            </View>
          </View>

          {/* Fila 14 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>MÉTODO DE PAGO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "15%" }]}>
              <Text>AL CONTADO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "10%" }]}>
              <Text> </Text>
            </View>
            <View style={[styles.yellowCell, { width: "15%" }]}>
              <Text>FECHA DE PAGO</Text>
            </View>
            <View style={[styles.whiteCell, { width: "17%", borderRightWidth: 0 }]}>
              <Text> </Text>
            </View>
          </View>

          {/* Fila 15 */}
          <View style={styles.gridRow}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>PLAZO DE CRÉDITO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "20%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "15%" }]}>
              <Text>AL CRÉDITO:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "10%" }]}>
              <Text>—</Text>
            </View>
            <View style={[styles.yellowCell, { width: "15%" }]}>
              <Text>FECHA DE PAGO</Text>
            </View>
            <View style={[styles.whiteCell, { width: "17%", borderRightWidth: 0 }]}>
              <Text>{formatFechaCorta(comprobante.fecha_emision)}</Text>
            </View>
          </View>

          {/* Fila 16 */}
          <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.yellowCell, { width: "23%" }]}>
              <Text>TIPO DE MONEDA:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "40%" }]}>
              <Text>DOLAR AMERICANO</Text>
            </View>
            <View style={[styles.yellowCell, { width: "20%" }]}>
              <Text>TOTAL DE CUOTAS:</Text>
            </View>
            <View style={[styles.whiteCell, { width: "17%", borderRightWidth: 0 }]}>
              <Text>—</Text>
            </View>
          </View>
        </View>

        {/* TABLA DE ÍTEMS */}
        <View style={styles.itemsTable}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemsHeaderCell, { width: "6%" }]}>ITEM</Text>
            <Text style={[styles.itemsHeaderCell, { width: "52%" }]}>
              DESCRIPCION
            </Text>
            <Text style={[styles.itemsHeaderCell, { width: "10%" }]}>CANTIDAD</Text>
            <Text style={[styles.itemsHeaderCell, { width: "10%" }]}>U.M.</Text>
            <Text style={[styles.itemsHeaderCell, { width: "11%" }]}>V.U.</Text>
            <Text style={[styles.itemsHeaderCell, { width: "11%", borderRightWidth: 0 }]}>
              IMPORTE
            </Text>
          </View>

          {detalles.length > 0 ? (
            detalles.map((d, idx) => {
              const elemLabel =
                d.elemento_quimico === "Plata" ? "LEY AG" : "LEY AU";

              return (
                <View key={d.id || idx} style={styles.itemRow}>
                  <Text style={[styles.itemCell, { width: "6%" }]}>{idx + 1}</Text>
                  <Text style={[styles.itemCell, { width: "52%", textAlign: "left", paddingLeft: 4 }]}>
                    MINERAL AURÍFERO BRUTO SIN PROCESAR LOTE {d.lote_correlativo || "—"} PESO HÚMEDO: {(d.tmh ?? 0).toFixed(2)} {elemLabel}: {(d.ley ?? 0).toFixed(3)}
                  </Text>
                  <Text style={[styles.itemCell, { width: "10%" }]}>
                    {(d.tmh ?? 0).toFixed(3)}
                  </Text>
                  <Text style={[styles.itemCell, { width: "10%" }]}>TONELADAS</Text>
                  <Text style={[styles.itemCell, { width: "11%", textAlign: "right" }]}>
                    $ {(d.precio_por_tonelada ?? 0).toFixed(2)}
                  </Text>
                  <Text style={[styles.itemCell, { width: "11%", textAlign: "right", borderRightWidth: 0 }]}>
                    $ {(d.subtotal ?? 0).toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.itemRow}>
              <Text style={[styles.itemCell, { width: "6%" }]}>1</Text>
              <Text style={[styles.itemCell, { width: "52%", textAlign: "left", paddingLeft: 4 }]}>
                MINERAL AURÍFERO BRUTO SIN PROCESAR
              </Text>
              <Text style={[styles.itemCell, { width: "10%" }]}>—</Text>
              <Text style={[styles.itemCell, { width: "10%" }]}>TONELADAS</Text>
              <Text style={[styles.itemCell, { width: "11%", textAlign: "right" }]}>$ —</Text>
              <Text style={[styles.itemCell, { width: "11%", textAlign: "right", borderRightWidth: 0 }]}>
                $ {subtotal.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.notaRow}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>Nota:</Text>
          </View>
        </View>

        {/* SECCIÓN INFERIOR: SON + RESUMEN ECONÓMICO */}
        <View style={styles.bottomSection}>
          {/* IZQUIERDA: SON + SELLO */}
          <View style={styles.leftBottom}>
            <Text style={styles.sonText}>SON: {sonTexto} DÓLAR AMERICANO</Text>

            <View style={styles.selloBox}>
              <View style={styles.selloHeader}>
                <Text style={styles.selloHeaderText}>
                  SELLO Y FIRMA DEL EMISOR
                </Text>
              </View>
              <View style={styles.selloContent} />
            </View>
          </View>

          {/* DERECHA: TOTALES */}
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>SUBTOTAL</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>ANTICIPO</Text>
              </View>
              <Text style={styles.totalValueCell}>
                {anticipo > 0 ? `$ ${anticipo.toFixed(2)}` : "$ -"}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>VALOR VENTA</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {valorVenta.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>IGV 18%</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {igv.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>TOTAL</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {total.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text>DETRACCION 10%</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {detraccion.toFixed(2)}</Text>
            </View>

            <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
              <View style={styles.totalLabelCell}>
                <Text>NETO A PAGAR</Text>
              </View>
              <Text style={styles.totalValueCell}>$ {netoAPagar.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
