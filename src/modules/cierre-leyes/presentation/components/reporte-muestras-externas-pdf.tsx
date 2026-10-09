import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { MuestraExternaResponse } from "../../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse } from "../../../gestion-leyes/service/gestion-leyes.responses";

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

export interface ReporteMuestrasExternasPdfProps {
  muestras: MuestraExternaResponse[];
  grupos?: GrupoAnalisisResponse[];
}

export const ReporteMuestrasExternasPdf = ({
  muestras,
  grupos = [],
}: ReporteMuestrasExternasPdfProps) => {
  // Encontrar detalles configurados para valorización en los grupos
  const detalleOro = grupos.flatMap((g) => g.analitos).find((a) => a.para_valorizacion_oro);
  const detallePlata = grupos.flatMap((g) => g.analitos).find((a) => a.para_valorizacion_plata);
  const detalleHumedad = grupos.flatMap((g) => g.analitos).find((a) => a.para_valorizacion_humedad);
  const detalleRecuperacion = grupos.flatMap((g) => g.analitos).find((a) => a.para_valorizacion_recuperacion);

  const getLeyesMuestra = (m: MuestraExternaResponse) => {
    const calcularLeyAnalito = (detalleId?: number, esDesplegable?: boolean): number => {
      if (!detalleId) return 0;
      const registros = m.analisis.filter((a) => a.id_grupo_analisis_detalle === detalleId);
      if (registros.length === 0) return 0;

      if (esDesplegable) {
        const conValor = registros.filter((r) => r.esta_confirmada || r.ley > 0);
        if (conValor.length > 0) {
          return conValor.reduce((acc, cur) => acc + cur.ley, 0) / conValor.length;
        }
        return registros.reduce((acc, cur) => acc + cur.ley, 0) / registros.length;
      }

      return registros[0]?.ley ?? 0;
    };

    const leyOro = calcularLeyAnalito(detalleOro?.detalle_id, detalleOro?.es_desplegable);
    const leyPlata = calcularLeyAnalito(detallePlata?.detalle_id, detallePlata?.es_desplegable);
    const leyHumedad = calcularLeyAnalito(detalleHumedad?.detalle_id, false);
    const leyRecuperacion = calcularLeyAnalito(detalleRecuperacion?.detalle_id, false);

    return { leyOro, leyPlata, leyHumedad, leyRecuperacion };
  };

  const cols: { key: string; flex: number; label: string; alt: boolean }[] = [
    { key: "item", flex: 5, label: "Item", alt: false },
    { key: "codigo", flex: 15, label: "Código Cliente", alt: false },
    { key: "fecha", flex: 12, label: "Fecha de Ingreso", alt: false },
    { key: "h2o", flex: 9, label: "% H₂O aprox", alt: false },
    { key: "au", flex: 11, label: "Ley Au aprox", alt: true },
    { key: "auGr", flex: 12, label: "Ley Au (gramos)", alt: false },
    { key: "ag", flex: 12, label: "Ley Ag (Onz/TC)", alt: true },
    { key: "agGr", flex: 12, label: "Ley Ag (gramos)", alt: false },
    { key: "recAu", flex: 11, label: "% REC. Au", alt: true },
  ];

  const renderCell = (colKey: string, idx: number, isAlt: boolean) => {
    const m = muestras[idx];
    const baseStyle = isAlt ? styles.dataCellAlt : styles.dataCell;
    const { leyOro, leyPlata, leyHumedad, leyRecuperacion } = getLeyesMuestra(m);

    // Si tiene codigo_cliente, se muestra (o combinado con su correlativo si se desea)
    const codigoTexto = m?.codigo_cliente
      ? `${m.codigo_cliente} (${m.correlativo})`
      : m?.correlativo ?? "";

    const fechaTexto = formatFecha(m?.fecha_hora_ingreso || m?.created_at);

    const text =
      colKey === "item"
        ? numInt(idx + 1)
        : colKey === "codigo"
        ? codigoTexto
        : colKey === "fecha"
        ? fechaTexto
        : colKey === "h2o"
        ? num(leyHumedad, 3)
        : colKey === "au"
        ? num(leyOro, 3)
        : colKey === "auGr"
        ? num((leyOro ?? 0) * OZT_TO_GRAMS, 3)
        : colKey === "ag"
        ? num(leyPlata, 3)
        : colKey === "agGr"
        ? num((leyPlata ?? 0) * OZT_TO_GRAMS, 3)
        : colKey === "recAu"
        ? num(leyRecuperacion, 2)
        : "";
    return <Text style={baseStyle}>{text}</Text>;
  };

  const totalRows = muestras.length;

  return (
    <Document title="Reporte Muestras Externas - Leyes">
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>REPORTE DE MUESTRAS</Text>
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
            const m = muestras[rowIdx];
            return (
              <View key={rowIdx} style={styles.dataRow}>
                {cols.map((c) => (
                  <Text
                    key={c.key}
                    style={{
                      ...(c.alt ? styles.dataCellAlt : styles.dataCell),
                      flex: c.flex,
                    }}
                  >
                    {m ? renderCell(c.key, rowIdx, c.alt) : ""}
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
