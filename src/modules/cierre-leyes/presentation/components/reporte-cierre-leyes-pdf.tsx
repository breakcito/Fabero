import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { LoteCierreResponse } from "../../service/cierre-leyes.responses";

const OZT_TO_GRAMS = 34.2856;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 16,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  titleBar: {
    backgroundColor: "#facc15",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 0,
    marginBottom: 0,
  },
  titleText: {
    fontSize: 22,
    fontStyle: "italic",
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
  },
  headerCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: "#f3f4f6",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#0f172a",
  },
  dataRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
  },
  dataRowAlt: {
    flexDirection: "row",
    backgroundColor: "#dcfce7",
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
  },
  dataCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
    color: "#111827",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#475569",
  },
  dataCellAlt: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
    color: "#111827",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#475569",
    backgroundColor: "#dcfce7",
  },
  emptyRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
  },
  tableWrapper: {
    borderRightWidth: 1,
    borderRightColor: "#475569",
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
  },
});

const formatFecha = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const num = (v: number | null | undefined, decimals: number = 3): string => {
  if (v === null || v === undefined || isNaN(v)) return "0.000";
  return v.toFixed(decimals);
};

const numInt = (v: number | null | undefined): string => {
  if (v === null || v === undefined || isNaN(v)) return "0";
  return String(Math.round(v));
};

export interface ReporteCierreLeyesPdfProps {
  lotes: LoteCierreResponse[];
}

export const ReporteCierreLeyesPdf = ({ lotes }: ReporteCierreLeyesPdfProps) => {
  // Definición de columnas y anchos proporcionales (deben sumar ~100%).
  const cols: { key: string; flex: number; label: string; alt: boolean }[] = [
    { key: "item", flex: 4, label: "Item", alt: false },
    { key: "codigo", flex: 9, label: "Código Cliente", alt: false },
    { key: "fecha", flex: 9, label: "Fecha de Ingreso", alt: false },
    { key: "tmh", flex: 7, label: "TMH aprox", alt: true },
    { key: "h2o", flex: 7, label: "% H₂O aprox", alt: false },
    { key: "au", flex: 9, label: "Ley Au aprox", alt: true },
    { key: "auGr", flex: 9, label: "Ley Au (gramos)", alt: false },
    { key: "ag", flex: 9, label: "Ley Ag (Onz/TC)", alt: true },
    { key: "agGr", flex: 9, label: "Ley Ag (gramos)", alt: false },
    { key: "recAu", flex: 8, label: "% REC. Au", alt: true },
  ];

  const renderCell = (colKey: string, idx: number, isAlt: boolean) => {
    const lote = lotes[idx];
    const baseStyle = isAlt ? styles.dataCellAlt : styles.dataCell;
    const text =
      colKey === "item"
        ? numInt(idx + 1)
        : colKey === "codigo"
        ? lote?.correlativo ?? ""
        : colKey === "fecha"
        ? formatFecha(lote?.created_at)
        : colKey === "tmh"
        ? num(lote?.peso_neto, 3)
        : colKey === "h2o"
        ? num(lote?.ley_humedad, 3)
        : colKey === "au"
        ? num(lote?.ley_oro, 3)
        : colKey === "auGr"
        ? num((lote?.ley_oro ?? 0) * OZT_TO_GRAMS, 3)
        : colKey === "ag"
        ? num(lote?.ley_plata, 3)
        : colKey === "agGr"
        ? num((lote?.ley_plata ?? 0) * OZT_TO_GRAMS, 3)
        : colKey === "recAu"
        ? num(lote?.ley_recuperacion, 2)
        : "";
    return <Text style={baseStyle}>{text}</Text>;
  };

  // Una fila por lote seleccionado. Sin límite: la dependencia maneja el wrap a varias páginas
  // si el contenido excede la hoja.
  const totalRows = lotes.length;

  return (
    <Document title="Reporte Cierre de Leyes">
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>REPORTE</Text>
        </View>

        <View style={styles.tableWrapper}>
          <View style={styles.headerRow}>
            {cols.map((c) => (
              <Text key={c.key} style={{ ...styles.headerCell, flex: c.flex }}>
                {c.label}
              </Text>
            ))}
          </View>

          {Array.from({ length: totalRows }).map((_, rowIdx) => {
            const lote = lotes[rowIdx];
            const isAlt = cols.some((c) => c.alt);
            return (
              <View key={rowIdx} style={isAlt ? styles.dataRowAlt : styles.dataRow}>
                {cols.map((c) => (
                  <Text
                    key={c.key}
                    style={{
                      ...(c.alt ? styles.dataCellAlt : styles.dataCell),
                      flex: c.flex,
                    }}
                  >
                    {lote ? renderCell(c.key, rowIdx, c.alt) : ""}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};
