import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { mmToPt } from "../../../../shared/functions/mm-to-pt";

const WIDTH_MM = 103;
const HEIGHT_MM = 27;

const styles = StyleSheet.create({
  page: {
    width: mmToPt(WIDTH_MM),
    height: mmToPt(HEIGHT_MM),
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  ticketRow: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  ticket: {
    flex: 1,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  divider: {
    width: 0.5,
    backgroundColor: "#9ca3af",
    borderStyle: "dashed",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  codeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 0.3,
  },
  dateBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 5,
    color: "#000000",
    fontFamily: "Helvetica",
    lineHeight: 1.1,
  },
  barcodeWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0.5,
  },
  barcodeImage: {
    width: "100%",
    height: 18,
    objectFit: "contain",
  },
  footerText: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    letterSpacing: 0.4,
  },
});

export interface TicketLotePdfProps {
  correlativo: string;
  fechaHoraRegistro: string;
  barcodeAUrl: string;
  barcodeBUrl: string;
}

export const TicketLotePdf = ({
  correlativo,
  fechaHoraRegistro,
  barcodeAUrl,
  barcodeBUrl,
}: TicketLotePdfProps) => {
  const codeWithSuffix = (suffix: "A" | "B") => `${correlativo}.${suffix}`;

  return (
    <Document title={`Ticket ${correlativo}`}>
      <Page size={[mmToPt(WIDTH_MM), mmToPt(HEIGHT_MM)]} style={styles.page}>
        <View style={styles.ticketRow}>
          <View style={styles.ticket}>
            <View style={styles.header}>
              <Text style={styles.codeText}>{codeWithSuffix("A")}</Text>
              <View style={styles.dateBlock}>
                <Text style={styles.dateText}>{fechaHoraRegistro.split(" ")[0]}</Text>
                <Text style={styles.dateText}>{fechaHoraRegistro.split(" ")[1] ?? ""}</Text>
              </View>
            </View>

            <View style={styles.barcodeWrapper}>
              <Image src={barcodeAUrl} style={styles.barcodeImage} />
            </View>

            <Text style={styles.footerText}>ANALISIS DE HUMEDAD - FABERO SAC</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.ticket}>
            <View style={styles.header}>
              <Text style={styles.codeText}>{codeWithSuffix("B")}</Text>
              <View style={styles.dateBlock}>
                <Text style={styles.dateText}>{fechaHoraRegistro.split(" ")[0]}</Text>
                <Text style={styles.dateText}>{fechaHoraRegistro.split(" ")[1] ?? ""}</Text>
              </View>
            </View>

            <View style={styles.barcodeWrapper}>
              <Image src={barcodeBUrl} style={styles.barcodeImage} />
            </View>

            <Text style={styles.footerText}>ANALISIS DE HUMEDAD - FABERO SAC</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
