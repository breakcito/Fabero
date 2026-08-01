import { Group, Text } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import type { BlendingResponse } from "../../service/blending.responses";

interface ModalHistorialBlendingProps {
  blending: BlendingResponse | null;
  opened: boolean;
  onClose: () => void;
}

/**
 * Etiquetas legibles para los campos del blending en español.
 * Mantener sincronizado con los `campo_bd` enviados en `EditarBlendingPayload.cambios`.
 */
const CAMPOS_LEGIBLES_BLENDING: Record<string, string> = {
  peso_neto: "Peso Neto",
  peso_actual: "Peso Actual",
  ley_oro: "Ley Au (Oro)",
  ley_plata: "Ley Ag (Plata)",
  ley_humedad: "Humedad %",
  fecha_hora_blending: "Fecha y Hora",
  observacion: "Observación",
  evidencias: "Evidencias",
};

/**
 * Traduce el shape nativo `BlendingLogCambioItem[]` al shape genérico
 * `RES_CambiosLog[]` esperado por `CambiosLogViewer`.
 *
 * Estructuras aceptadas (forma flexible):
 *  - `cambios_metadata`: objeto con claves `campo_bd → {valor_anterior, valor_nuevo}`
 *  - `cambios_metadata.cambios`: array con `{ campo_bd, valor_anterior, valor_nuevo }`
 *  - `cambios_metadata.cambios[]`: array directo
 *  - `nuevos_valores`: array de strings con formato "campo: anterior → nuevo"
 *  - `adiciones_peso_kg`: se representa como un campo resumen si no hay otra info
 */
const mapBlendingLogCambioToCambiosLog = (
  items: unknown[] | null | undefined
): RES_CambiosLog[] | null => {
  if (!items || items.length === 0) return null;

  const toCambiosArray = (
    metadata: Record<string, unknown> | undefined
  ): { campo_bd: string; campo: string | null; valor_anterior: unknown; valor_nuevo: unknown }[] => {
    if (!metadata || typeof metadata !== "object") return [];

    if (Array.isArray((metadata as Record<string, unknown>).cambios)) {
      const arr = (metadata as Record<string, unknown>).cambios as Array<Record<string, unknown>>;
      return arr.map((c) => ({
        campo_bd: String(c.campo_bd ?? c.campo ?? ""),
        campo: typeof c.campo === "string" ? c.campo : null,
        valor_anterior: c.valor_anterior,
        valor_nuevo: c.valor_nuevo,
      }));
    }

    const result: ReturnType<typeof toCambiosArray> = [];
    Object.entries(metadata).forEach(([key, val]) => {
      if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        "valor_anterior" in (val as Record<string, unknown>) &&
        "valor_nuevo" in (val as Record<string, unknown>)
      ) {
        const v = val as Record<string, unknown>;
        result.push({
          campo_bd: key,
          campo: null,
          valor_anterior: v.valor_anterior,
          valor_nuevo: v.valor_nuevo,
        });
      }
    });
    return result;
  };

  const parseNuevosValores = (
    nv: unknown
  ): { campo_bd: string; campo: string | null; valor_anterior: unknown; valor_nuevo: unknown }[] => {
    if (!nv) return [];

    if (Array.isArray(nv)) {
      return nv
        .map((item) => {
          if (typeof item === "string") {
            const match = item.match(/^([^:]+):\s*(.*?)\s*→\s*(.*)$/);
            if (match) {
              return {
                campo_bd: match[1].trim(),
                campo: null,
                valor_anterior: match[2],
                valor_nuevo: match[3],
              };
            }
            return {
              campo_bd: item,
              campo: null,
              valor_anterior: null,
              valor_nuevo: item,
            };
          }
          if (item && typeof item === "object") {
            const rec = item as Record<string, unknown>;
            return {
              campo_bd: String(rec.campo_bd ?? rec.campo ?? ""),
              campo: typeof rec.campo === "string" ? rec.campo : null,
              valor_anterior: rec.valor_anterior ?? null,
              valor_nuevo: rec.valor_nuevo ?? null,
            };
          }
          return null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    }

    if (typeof nv === "object") {
      const result: ReturnType<typeof parseNuevosValores> = [];
      Object.entries(nv as Record<string, unknown>).forEach(([key, val]) => {
        result.push({
          campo_bd: key,
          campo: null,
          valor_anterior: null,
          valor_nuevo: val,
        });
      });
      return result;
    }

    return [];
  };

  return items.map((itemAny) => {
    const item = itemAny as Record<string, unknown>;

    // Forma nativa estandarizada RES_CambiosLog
    if (Array.isArray(item.cambios)) {
      return {
        id_empleado: Number(item.id_empleado ?? 0),
        motivo: typeof item.motivo === "string" ? item.motivo : typeof item.accion === "string" ? item.accion : null,
        update_at: String(item.update_at ?? item.fecha_hora ?? ""),
        cambios: (item.cambios as Array<Record<string, unknown>>).map((c) => ({
          campo_bd: c.campo_bd != null ? String(c.campo_bd) : null,
          campo: c.campo != null ? String(c.campo) : null,
          valor_anterior: c.valor_anterior,
          valor_nuevo: c.valor_nuevo,
        })),
      };
    }

    // Compatibilidad con registros legacy
    const cambios = [
      ...toCambiosArray(item.cambios_metadata as Record<string, unknown>),
      ...parseNuevosValores(item.nuevos_valores),
    ];

    if (cambios.length === 0 && typeof item.adiciones_peso_kg === "number") {
      cambios.push({
        campo_bd: "adiciones_peso_kg",
        campo: "Adiciones de peso (kg)",
        valor_anterior: 0,
        valor_nuevo: item.adiciones_peso_kg,
      });
    }

    return {
      id_empleado: Number(item.id_empleado ?? 0),
      motivo: typeof item.motivo === "string" ? item.motivo : typeof item.accion === "string" ? item.accion : null,
      update_at: String(item.update_at ?? item.fecha_hora ?? ""),
      cambios,
    };
  });
};

export const ModalHistorialBlending = ({
  blending,
  opened,
  onClose,
}: ModalHistorialBlendingProps) => {
  let rawLogs = blending?.log_cambios;
  if (typeof rawLogs === "string") {
    try {
      rawLogs = JSON.parse(rawLogs as string);
    } catch {
      rawLogs = [];
    }
  }
  const cambiosLog = mapBlendingLogCambioToCambiosLog(rawLogs);

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <Group gap="xs">
          <IconHistory size={20} className="text-purple-400" />
          <Text fw={700} c="white">
            Historial de Cambios — {blending?.correlativo ?? ""}
          </Text>
        </Group>
      }
      rightSection={
        blending ? (
          <Text fz="xs" c="dimmed" fw={600} className="font-mono">
            BLENDING #{blending.id}
          </Text>
        ) : undefined
      }
      size="lg"
    >
      <CambiosLogViewer
        cambios={cambiosLog}
        camposLegiblesCustom={CAMPOS_LEGIBLES_BLENDING}
      />
    </ModalEstandar>
  );
};

export default ModalHistorialBlending;