import { useEffect, useState } from "react";
import {
  Stack,
  Text,
  Loader,
  Group,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconHistory,
  IconUser,
  IconCalendar,
  IconArrowsExchange,
  IconMessage2,
} from "@tabler/icons-react";
import type { RES_CambiosLog } from "../../service/responses/_generic/cambios-log";
import { AuxService } from "../../service/auxiliar.service";

interface CambiosLogViewerProps {
  cambios: RES_CambiosLog[] | null | undefined;
  camposLegiblesCustom?: Record<string, string>;
}

const formatearFechaHora = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
};

const formatearValor = (valor: unknown): string => {
  if (valor === null || valor === undefined) {
    return "—";
  }
  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }
  if (typeof valor === "number") {
    return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
  }
  if (Array.isArray(valor)) {
    return valor.length === 0 ? "— (vacío)" : `(${valor.length}) ${valor.join(", ")}`;
  }
  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }
  return String(valor);
};

const camposLegiblesGlobales: Record<string, string> = {
  id_sucursal: "Sucursal",
  id_proveedor: "Proveedor",
  id_concesion: "Concesión",
  id_conductor: "Conductor",
  id_vehiculo: "Vehículo tractor",
  id_empresa_transporte: "Empresa transporte",
  id_vehiculo_carreta: "Carreta",
  id_empresa_transporte_carreta: "Empresa transp. carreta",
  motivo_traslado: "Motivo de traslado",
  fecha_inicio_traslado: "Fecha inicio traslado",
  fecha_emision: "Fecha de emisión",
  fecha_en_planta: "Fecha en planta",
  serie_guia_remitente: "Serie GR",
  numero_guia_remitente: "Número GR",
  serie_guia_transportista: "Serie GT",
  numero_guia_transportista: "Número GT",
  sin_guia_transportista: "Sin guía transportista",
  estado: "Estado",
  peso_bruto: "Peso bruto",
  tara: "Tara",
  peso_neto: "Peso neto",
  condicion_ingreso: "Condición de ingreso",
  evidencias: "Evidencias",
};

const etiquetaCampo = (campo: string | null, campoBd: string | null, customLabels?: Record<string, string>): string => {
  if (campo) return campo;
  if (campoBd) {
    if (customLabels && customLabels[campoBd]) return customLabels[campoBd];
    if (camposLegiblesGlobales[campoBd]) return camposLegiblesGlobales[campoBd];
    return campoBd.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Campo desconocido";
};

const renderValoresEvidencias = (valor: unknown, type: "anterior" | "nuevo") => {
  const str = String(valor || "");
  if (str === "—" || str.startsWith("— (") || !str.includes(",")) {
    return (
      <div
        className={
          type === "anterior"
            ? "rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300 line-through opacity-80 text-center select-all"
            : "rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 font-semibold text-center select-all"
        }
      >
        {str}
      </div>
    );
  }

  const files = str.split(",").map((f) => f.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-1 w-full">
      {files.map((file, fIdx) => (
        <div
          key={fIdx}
          className={
            type === "anterior"
              ? "rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300 line-through opacity-80 select-all truncate"
              : "rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 font-semibold select-all truncate"
          }
          title={file}
        >
          {file}
        </div>
      ))}
    </div>
  );
};

export const CambiosLogViewer = ({ cambios, camposLegiblesCustom }: CambiosLogViewerProps) => {
  const [empleadosMap, setEmpleadosMap] = useState<Record<number, string>>({});
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  useEffect(() => {
    if (!cambios || cambios.length === 0) return;

    // Obtener los IDs de los empleados únicos
    const ids = Array.from(new Set(cambios.map((c) => c.id_empleado))).filter(
      (id) => typeof id === "number" && id > 0
    );

    if (ids.length === 0) return;

    // Verificar si ya tenemos todos los nombres en el mapa para no repetir la llamada
    const idsFaltantes = ids.filter((id) => !empleadosMap[id]);
    if (idsFaltantes.length === 0) return;

    let isCancelled = false;

    // Defer the set state to avoid synchronous effect execution warning
    Promise.resolve().then(() => {
      if (!isCancelled) setLoadingEmpleados(true);
    });

    AuxService.get_empleados({ id_empleado: idsFaltantes })
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setEmpleadosMap((prev) => {
            const nuevos = { ...prev };
            for (const emp of res.data) {
              nuevos[emp.id_empleado] = emp.nombre_completo;
            }
            return nuevos;
          });
        }
      })
      .catch((err) => {
        console.error("Error al obtener nombres de empleados para historial:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingEmpleados(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cambios, empleadosMap]);

  if (!cambios || cambios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
        <IconHistory size={32} className="text-zinc-600" />
        <Text size="sm" fw={500}>No se registran cambios en este elemento.</Text>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      <Stack gap="md">
        {cambios.map((log, index) => {
          const key = `${log.update_at}-${log.id_empleado}-${index}`;
          const nombreEmpleado = empleadosMap[log.id_empleado] || `Empleado #${log.id_empleado}`;

          return (
            <div key={key} className="relative pl-7">
              {/* Linea de tiempo */}
              <div className="absolute left-2 top-3 bottom-0 w-px bg-zinc-800" />
              <div className="absolute left-1 top-2 w-3 h-3 rounded-full border-2 bg-amber-500/20 border-amber-500" />

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
                <Group justify="space-between" wrap="wrap">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="amber" radius="md">
                      <IconUser size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} className="text-zinc-200">
                      {nombreEmpleado}
                    </Text>
                    {loadingEmpleados && !empleadosMap[log.id_empleado] && (
                      <Loader size="xs" color="amber" />
                    )}
                  </Group>
                  <Group gap={4}>
                    <IconCalendar size={12} className="text-zinc-500" />
                    <Text size="11px" c="dimmed" className="font-mono">
                      {formatearFechaHora(log.update_at)}
                    </Text>
                  </Group>
                </Group>

                {log.motivo && (
                  <Group gap={4} className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
                    <IconMessage2 size={12} className="text-zinc-400" />
                    <Text size="xs" className="text-zinc-300 italic">
                      Motivo: &quot;{log.motivo}&quot;
                    </Text>
                  </Group>
                )}

                {log.cambios && log.cambios.length > 0 ? (
                  <Stack gap={6} className="mt-2">
                    {log.cambios.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-zinc-800/70 bg-zinc-900/40 px-3 py-2 text-xs"
                      >
                        <Text size="xs" fw={700} className="text-zinc-300">
                          {etiquetaCampo(c.campo, c.campo_bd, camposLegiblesCustom)}
                        </Text>
                        <Tooltip label="Cambió a">
                          <IconArrowsExchange size={14} className="text-amber-400 shrink-0" />
                        </Tooltip>
                        <div className="flex flex-col gap-1.5 w-full overflow-hidden">
                          {c.campo_bd === "evidencias" || c.campo === "Evidencias" ? (
                            <>
                              {renderValoresEvidencias(c.valor_anterior, "anterior")}
                              {renderValoresEvidencias(c.valor_nuevo, "nuevo")}
                            </>
                          ) : (
                            <>
                              <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300 line-through opacity-80 text-center select-all">
                                {formatearValor(c.valor_anterior)}
                              </div>
                              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 font-semibold text-center select-all">
                                {formatearValor(c.valor_nuevo)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </Stack>
                ) : (
                  <Text size="xs" c="dimmed" fs="italic">
                    Sin cambios campo-a-campo.
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </Stack>
    </div>
  );
};
