import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";
import type { RES_ValorizacionCompra } from "../../../valorizacion-compra/service/valorizacion-compra.responses";

interface Props {
  comprobante?: Partial<RES_ComprobanteCompra> | null;
  valorizacion?: RES_ValorizacionCompra | null;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#000000",
    lineHeight: 1.35,
  },
  headerDate: {
    textAlign: "right",
    fontSize: 8.5,
    marginBottom: 20,
    fontFamily: "Helvetica",
  },
  mainTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 12,
    fontSize: 8.2,
    lineHeight: 1.4,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 14,
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textAlign: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#9CA3AF",
    minHeight: 16,
    alignItems: "center",
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 16,
    alignItems: "center",
  },
  labelCell: {
    width: "42%",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingLeft: 6,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    textTransform: "uppercase",
  },
  valueCell: {
    width: "58%",
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingLeft: 6,
    paddingRight: 4,
    paddingVertical: 2,
    textAlign: "center",
  },
  closingParagraph: {
    textAlign: "justify",
    fontSize: 8.2,
    lineHeight: 1.35,
    marginBottom: 10,
  },
  signaturesArea: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  signatureColumn: {
    width: "60%",
    alignItems: "center",
  },
  signatureLine: {
    width: "85%",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 6,
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textAlign: "center",
  },
  signatureRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  signatureCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  signatureRuc: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  thumbprintBox: {
    width: 75,
    height: 85,
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 4,
  },
});

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];

const formatFechaLarga = (fechaIso?: string): string => {
  if (!fechaIso) {
    const ahora = new Date();
    return `La Libertad, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  }
  try {
    const datePart = fechaIso.split("T")[0].split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const anio = parseInt(parts[0], 10);
      const mesIdx = parseInt(parts[1], 10) - 1;
      const dia = parseInt(parts[2], 10);
      if (!Number.isNaN(dia) && mesIdx >= 0 && mesIdx < 12 && !Number.isNaN(anio)) {
        return `La Libertad, ${dia} de ${MESES[mesIdx]} de ${anio}`;
      }
    }
    const d = new Date(fechaIso);
    return `La Libertad, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return `La Libertad, —`;
  }
};

const formatFechaCorta = (fechaIso?: string): string => {
  if (!fechaIso) return "—";
  try {
    const datePart = fechaIso.split("T")[0].split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const anio = parts[0];
      const mes = parts[1].padStart(2, "0");
      const dia = parts[2].padStart(2, "0");
      return `${dia}/${mes}/${anio}`;
    }
    const d = new Date(fechaIso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fechaIso;
  }
};

export const DeclaracionJuradaPdf = ({ comprobante, valorizacion }: Props) => {
  const proveedorNombre =
    comprobante?.proveedor_nombre || valorizacion?.proveedor_nombre || "—";
  const proveedorRuc =
    comprobante?.proveedor_ruc || valorizacion?.proveedor_ruc || "—";
  const proveedorDireccion =
    valorizacion?.proveedor_direccion && valorizacion.proveedor_direccion !== "—"
      ? valorizacion.proveedor_direccion
      : "________________________________________";

  const concesionNombre =
    comprobante?.concesion_nombre || valorizacion?.concesion_nombre || "—";
  const concesionCodigo = valorizacion?.concesion_codigo_reinfo || "—";

  const numeroFactura =
    comprobante?.codigo_completo ||
    (comprobante?.serie && comprobante?.numero ? `${comprobante.serie}-${comprobante.numero}` : null) ||
    (valorizacion?.factura_asociada && valorizacion.factura_asociada !== "—" ? valorizacion.factura_asociada : null);

  const fechaFactura =
    comprobante?.fecha_emision ||
    valorizacion?.fecha_factura ||
    null;

  const fechaDocumento =
    comprobante?.fecha_emision ||
    valorizacion?.fecha_factura ||
    valorizacion?.fecha_hora_valorizacion ||
    valorizacion?.created_at;

  // Ubicación: distrito, provincia, departamento
  let distrito = "—";
  let provincia = "—";
  let departamento = "—";
  if (valorizacion?.concesion_ubicacion) {
    const partes = valorizacion.concesion_ubicacion.split(" - ");
    if (partes.length >= 3) {
      distrito = partes[0] || "—";
      provincia = partes[1] || "—";
      departamento = partes[2] || "—";
    } else if (partes.length === 2) {
      provincia = partes[0] || "—";
      departamento = partes[1] || "—";
    } else if (partes.length === 1) {
      departamento = partes[0] || "—";
    }
  }

  // Guías de remisión
  const guias =
    valorizacion?.guia_remitente ||
    valorizacion?.guia_transportista ||
    "—";

  // TMH Total
  const tmhTotal =
    valorizacion?.tmh_total_balanza != null
      ? valorizacion.tmh_total_balanza.toFixed(3)
      : valorizacion?.detalles && valorizacion.detalles.length > 0
        ? valorizacion.detalles
            .reduce((acc, d) => acc + (d.tmh || 0), 0)
            .toFixed(3)
        : "—";

  return (
    <Document title={`Declaración Jurada - ${numeroFactura || valorizacion?.correlativo || "Doc"}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* FECHA SUPERIOR */}
        <Text style={styles.headerDate}>
          {formatFechaLarga(fechaDocumento)}
        </Text>

        {/* TÍTULO PRINCIPAL */}
        <Text style={styles.mainTitle}>
          DECLARACION JURADA DE PROCEDENCIA DE MINERAL AURIFERO
        </Text>

        {/* PÁRRAFO DECLARATORIO */}
        <Text style={styles.paragraph}>
          La empresa {proveedorNombre} con RUC N° {proveedorRuc}, con domicilio
          fiscal en {proveedorDireccion}, debidamente representado por su
          Gerente General ________________________________________, identificado con
          D.N.I. N° ____________________, que de acuerdo a lo dispuesto por el
          capitulo II de la Ley General de Minería D.S. 014-92-EM sobre la libre
          comercialización de oro; asi como los Decretos Legislativos N°
          1100,1105,1107, y los D.S. N° 06-2012-EM y D.S. 012-2012-EM,
          relacionado a la interdicción a la minería ilegal, proceso de
          formalización de las actividades de pequeña minería y minería
          artesanal, medidas para el control y fiscalización del producto
          minero, obtenidas en dichas actividades; DECLARA BAJO JURAMENTO que el
          mineral bruto que ofrecemos comercializar a FABRICACIONES FABERO S.A.C.
          son de procedencia legal, y provienen exclusivamente de mi concesión
          minera, según detalle:
        </Text>

        {/* TABLA: DATOS DE LA FACTURA */}
        <View style={styles.tableWrapper}>
          <Text style={styles.tableHeader}>DATOS DE LA FACTURA</Text>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>N° DE FACTURA</Text>
            <Text style={styles.valueCell}>{numeroFactura || "—"}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>FECHA DE FACTURA</Text>
            <Text style={styles.valueCell}>
              {fechaFactura ? formatFechaCorta(fechaFactura) : "—"}
            </Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.labelCell}>GUIAS DE REMISIÓN</Text>
            <Text style={styles.valueCell}>{guias}</Text>
          </View>
        </View>

        {/* TABLA: DATOS DE LA LABOR MINERA */}
        <View style={styles.tableWrapper}>
          <Text style={styles.tableHeader}>DATOS DE LA LABOR MINERA</Text>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>NOMBRE DE LA CONCESIÓN</Text>
            <Text style={styles.valueCell}>{concesionNombre}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>DISTRITO</Text>
            <Text style={styles.valueCell}>{distrito}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>PROVINCIA</Text>
            <Text style={styles.valueCell}>{provincia}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>DEPARTAMENTO</Text>
            <Text style={styles.valueCell}>{departamento}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>CÓDIGO INGEMMET</Text>
            <Text style={styles.valueCell}>{concesionCodigo}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.labelCell}>DREM QUE OTORGA</Text>
            <Text style={styles.valueCell}>LA LIBERTAD</Text>
          </View>
        </View>

        {/* TABLA: TONELADAS MÉTRICAS HÚMEDAS */}
        <View style={styles.tableWrapper}>
          <Text style={styles.tableHeader}>TONELADAS MÉTRICAS HÚMEDAS</Text>
          <View style={styles.tableRow}>
            <Text style={styles.labelCell}>TMH</Text>
            <Text style={styles.valueCell}>{tmhTotal}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.labelCell}>TMH TOTAL</Text>
            <Text style={styles.valueCell}>{tmhTotal}</Text>
          </View>
        </View>

        {/* PÁRRAFOS DE CIERRE */}
        <Text style={styles.closingParagraph}>
          Por lo tanto exoneramos a la empresa{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            FABRICACIONES FABERO S.A.C.
          </Text>
          , con RUC N°{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>20604623007</Text> de
          cualquier responsabilidad que pudiera surgir de la aplicación de las
          normas legales señaladas en la introducción de este documento.
        </Text>

        <Text style={styles.closingParagraph}>
          Tengo conocimiento que de haber incurrido en alguna falsedad al hacer la
          presente declaración, seré responsable de la comisión del delito
          contra la fe pública tipificado en el artículo 438° del Código Penal.
        </Text>

        {/* SECCIÓN FIRMAS */}
        <View style={styles.signaturesArea}>
          <View style={styles.signatureColumn}>
            {/* Espacio en blanco para la firma física */}
            <View style={{ height: 50 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureRole}>GERENTE GENERAL</Text>
            <Text style={styles.signatureCompany}>{proveedorNombre}</Text>
            <Text style={styles.signatureRuc}>R.U.C.: {proveedorRuc}</Text>
          </View>

          <View style={styles.thumbprintBox} />
        </View>
      </Page>
    </Document>
  );
};
