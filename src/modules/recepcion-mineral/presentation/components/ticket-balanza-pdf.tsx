import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { mmToPt } from "../../../../shared/functions/mm-to-pt";

const WIDTH_MM = 67;
const HEIGHT_MM = 247;

const styles = StyleSheet.create({
  page: {
    width: mmToPt(WIDTH_MM),
    height: mmToPt(HEIGHT_MM),
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000",
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loteTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginVertical: 4,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginVertical: 2,
    letterSpacing: 0.5,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderStyle: "dashed",
    marginVertical: 4,
  },
  infoContainer: {
    marginVertical: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 1.5,
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
  },
  fullWidthText: {
    marginVertical: 1,
  },
  rightAlign: {
    textAlign: "right",
  },
  pesajeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 2,
  },
  subRowText: {
    fontSize: 8,
    color: "#000000",
    marginTop: 1,
    marginBottom: 3,
  },
});

const formatFecha = (isoString: string | null): string => {
  if (!isoString) return "—";
  return isoString.split(" ")[0] || isoString.split("T")[0] || isoString;
};

const formatPeso = (peso: number | null): string => {
  if (peso === null) return "—";
  return `${peso.toLocaleString("es-PE")} Kg`;
};

export interface TicketBalanzaPdfProps {
  lote: {
    id: number;
    correlativo: string;
    numero_correlativo: number;
    vehiculo_placa: string | null;
    vehiculo_serie: string | null;
    tipo_carga: string | null;
    empresa_transporte_ruc?: string | null;
    empresa_transporte_razon_social: string | null;
    tipo_vehiculo_nombre: string | null;
    conductor_nombre_completo: string | null;
    proveedor_nombre?: string | null;
    observacion_peso_inicial?: string | null;
    observacion_peso_final?: string | null;
    peso_inicial: number | null;
    fecha_hora_peso_inicial: string | null;
    peso_final: number | null;
    fecha_hora_peso_final: string | null;
    peso_neto: number | null;
  };
}

export const TicketBalanzaPdf = ({ lote }: TicketBalanzaPdfProps) => {
  const fullPlaca = lote.vehiculo_serie
    ? `${lote.vehiculo_serie}-${lote.vehiculo_placa}`
    : lote.vehiculo_placa || "—";

  const RucEmpresa = lote.empresa_transporte_ruc
    ? lote.empresa_transporte_ruc
    : "—";

  const observacionLote = lote.observacion_peso_final || lote.observacion_peso_inicial || "—";

  return (
    <Document title={`Ticket ${lote.correlativo}`}>
      <Page size={[mmToPt(WIDTH_MM), mmToPt(HEIGHT_MM)]} style={styles.page}>
        {/* Título Principal */}
        <Text style={styles.headerTitle}>TICKET DE BALANZA: {lote.numero_correlativo}</Text>
        
        <View style={styles.dashedLine} />

        {/* Lote */}
        <Text style={styles.loteTitle}>LOTE: {lote.correlativo}</Text>

        <View style={styles.dashedLine} />

        {/* Información General */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text><Text style={styles.boldText}>Placa 1:</Text> {fullPlaca}</Text>
            <Text style={styles.boldText}>PRIMER TRAMO</Text>
          </View>

          <Text style={styles.fullWidthText}>
            <Text style={styles.boldText}>Emp. de Transporte:</Text> {RucEmpresa}
          </Text>
          {lote.empresa_transporte_razon_social && (
            <Text style={styles.fullWidthText}>{lote.empresa_transporte_razon_social.toUpperCase()}</Text>
          )}

          <Text style={styles.fullWidthText}>
            <Text style={styles.boldText}>Tipo Vehículo:</Text> {lote.tipo_vehiculo_nombre || "—"}
          </Text>

          <Text style={styles.fullWidthText}>
            <Text style={styles.boldText}>Conductor:</Text> {lote.conductor_nombre_completo || "—"}
          </Text>

          <Text style={styles.fullWidthText}>
            <Text style={styles.boldText}>Proveedor Minero:</Text> {lote.proveedor_nombre || "—"}
          </Text>

          <Text style={styles.fullWidthText}>
            <Text style={styles.boldText}>Observación:</Text> {observacionLote}
          </Text>
        </View>

        <View style={styles.dashedLine} />

        {/* Sección PESAJE */}
        <Text style={styles.sectionTitle}>PESAJE</Text>

        <View style={styles.dashedLine} />

        <View style={styles.infoContainer}>
          <View style={styles.pesajeRow}>
            <Text style={styles.boldText}>PESO INICIAL:</Text>
            <Text style={styles.boldText}>{formatPeso(lote.peso_inicial)}</Text>
          </View>
          <Text style={styles.subRowText}>Fecha: {formatFecha(lote.fecha_hora_peso_inicial)}</Text>

          <View style={styles.pesajeRow}>
            <Text style={styles.boldText}>PESO FINAL:</Text>
            <Text style={styles.boldText}>{formatPeso(lote.peso_final)}</Text>
          </View>
          <Text style={styles.subRowText}>Fecha: {formatFecha(lote.fecha_hora_peso_final)}</Text>
        </View>

        <View style={styles.dashedLine} />

        {/* Sección RESUMEN */}
        <Text style={styles.sectionTitle}>RESUMEN</Text>

        <View style={styles.dashedLine} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.boldText}>PESO BRUTO:</Text>
            <Text style={styles.boldText}>{formatPeso(lote.peso_inicial)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.boldText}>TARA:</Text>
            <Text style={styles.boldText}>{formatPeso(lote.peso_final)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.boldText}>PESO NETO:</Text>
            <Text style={styles.boldText}>{formatPeso(lote.peso_neto)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
