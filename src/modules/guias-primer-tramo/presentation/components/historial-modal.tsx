import { useEffect, useState } from "react";
import {
  Stack,
  Text,
  Badge,
  Loader,
  Tooltip,
  Group,
  Divider,
  ThemeIcon,
} from "@mantine/core";
import {
  IconHistory,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUser,
  IconCalendar,
  IconArrowsExchange,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { GuiasPrimerTramoHistorialService } from "../../service/guias-primer-tramo.historial.service";
import type { RES_HistorialItem } from "../../service/guias-primer-tramo.historial.responses";
import { GuiaPrimerTramoHistorialAccion } from "../../../../shared/enums/_generic/guia-primer-tramo-historial-accion";
import { LoteGuiaHistorialAccion } from "../../../../shared/enums/_generic/lote-guia-historial-accion";

interface HistorialModalProps {
  idGuia: number | null;
  opened: boolean;
  onClose: () => void;
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

const camposLegibles: Record<string, string> = {
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
  correlativo: "Correlativo",
  numero_correlativo: "N° correlativo",
  peso_bruto: "Peso bruto",
  tara: "Tara",
  peso_neto: "Peso neto",
  id_lote_mineral: "Lote mineral",
  lote_agregado: "Lote agregado",
  lote_eliminado: "Lote eliminado",
  evidencias: "Evidencias",
};

const etiquetaCampo = (key: string): string =>
  camposLegibles[key] ?? key.replace(/_/g, " ");

type VarianteAccion =
  | { label: string; color: string; icon: React.ReactNode }
  | null;

const varianteCabecera = (
  accion: GuiaPrimerTramoHistorialAccion,
  cambios?: Record<string, unknown> | null,
): VarianteAccion => {
  if (accion === GuiaPrimerTramoHistorialAccion.Creado) {
    return { label: "Creada", color: "emerald", icon: <IconPlus size={12} /> };
  }
  // EDITADO
  if (
    cambios &&
    typeof cambios === "object" &&
    "estado" in (cambios as Record<string, unknown>) &&
    Object.keys(cambios).length === 1
  ) {
    return { label: "Anulada", color: "red", icon: <IconTrash size={12} /> };
  }
  return { label: "Editada", color: "blue", icon: <IconEdit size={12} /> };
};

const varianteLote = (
  accion: LoteGuiaHistorialAccion,
): VarianteAccion => {
  switch (accion) {
    case LoteGuiaHistorialAccion.LoteCreado:
      return { label: "Lote agregado", color: "teal", icon: <IconPlus size={12} /> };
    case LoteGuiaHistorialAccion.LoteEditado:
      return { label: "Lote editado", color: "indigo", icon: <IconEdit size={12} /> };
    case LoteGuiaHistorialAccion.LoteEliminado:
      return { label: "Lote eliminado", color: "red", icon: <IconTrash size={12} /> };
    default:
      return null;
  }
};

interface CambioRowProps {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
}

const CambioRow = ({ campo, anterior, nuevo }: CambioRowProps) => {
  if (campo === "evidencias") {
    const a = anterior as { total: number; nombres: string[] } | null;
    const n = nuevo as { total: number; nombres: string[] } | null;
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
        <Group gap="xs" mb={4}>
          <ThemeIcon size="sm" radius="md" variant="light" color="indigo">
            <IconArrowsExchange size={12} />
          </ThemeIcon>
          <Text size="xs" fw={700} className="text-zinc-200 uppercase tracking-wide">
            {etiquetaCampo(campo)}
          </Text>
        </Group>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
            <Text size="10px" c="dimmed" fw={600} className="mb-1">
              ELIMINADOS
            </Text>
            {a && a.nombres.length > 0 ? (
              <ul className="list-disc pl-4 text-rose-300 space-y-0.5">
                {a.nombres.map((n) => (
                  <li key={n} className="font-mono">{n}</li>
                ))}
              </ul>
            ) : (
              <Text size="xs" c="dimmed" fs="italic">—</Text>
            )}
            <Text size="10px" c="dimmed" mt={4}>
              Total: {a?.total ?? 0}
            </Text>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
            <Text size="10px" c="dimmed" fw={600} className="mb-1">
              AGREGADOS
            </Text>
            {n && n.nombres.length > 0 ? (
              <ul className="list-disc pl-4 text-emerald-300 space-y-0.5">
                {n.nombres.map((n) => (
                  <li key={n} className="font-mono">{n}</li>
                ))}
              </ul>
            ) : (
              <Text size="xs" c="dimmed" fs="italic">—</Text>
            )}
            <Text size="10px" c="dimmed" mt={4}>
              Total: {n?.total ?? 0}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-zinc-800/70 bg-zinc-900/40 px-3 py-2 text-xs">
      <Text size="xs" fw={700} className="text-zinc-300">
        {etiquetaCampo(campo)}
      </Text>
      <Tooltip label="Cambió a">
        <IconArrowsExchange size={14} className="text-amber-400 shrink-0" />
      </Tooltip>
      <div className="flex flex-col gap-0.5">
        <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300 line-through opacity-80">
          {formatearValor(anterior)}
        </div>
        <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 font-semibold">
          {formatearValor(nuevo)}
        </div>
      </div>
    </div>
  );
};

const HistorialItemCard = ({ item }: { item: RES_HistorialItem }) => {
  const esCabecera = item.origen === "CABECERA";
  const variante = esCabecera
    ? varianteCabecera(item.accion as GuiaPrimerTramoHistorialAccion, item.cambios)
    : varianteLote(item.accion as LoteGuiaHistorialAccion);

  const variantesDiff = item.cambios && typeof item.cambios === "object"
    ? (Object.entries(item.cambios) as [string, { anterior: unknown; nuevo: unknown }][])
    : [];

  return (
    <div className="relative pl-7">
      {/* Línea vertical + dot */}
      <div className="absolute left-2 top-3 bottom-0 w-px bg-zinc-800" />
      <div
        className={`absolute left-1 top-2 w-3 h-3 rounded-full border-2 ${
          esCabecera
            ? "bg-emerald-500/20 border-emerald-500"
            : "bg-indigo-500/20 border-indigo-500"
        }`}
      />

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            {variante && (
              <Badge
                size="sm"
                radius="md"
                color={variante.color}
                variant="filled"
                leftSection={variante.icon}
                className="font-bold uppercase"
              >
                {variante.label}
              </Badge>
            )}
            {!esCabecera && (
              <Badge size="sm" radius="md" variant="light" color="zinc">
                Lote
              </Badge>
            )}
            {!esCabecera && item.lote_correlativo && (
              <Badge size="sm" radius="md" variant="outline" color="indigo" className="font-mono">
                {item.lote_correlativo}
              </Badge>
            )}
          </Group>
          <Group gap={4}>
            <IconCalendar size={12} className="text-zinc-500" />
            <Text size="11px" c="dimmed" className="font-mono">
              {formatearFechaHora(item.created_at)}
            </Text>
          </Group>
        </Group>

        {item.usuario_nombre && (
          <Group gap={4}>
            <IconUser size={12} className="text-zinc-500" />
            <Text size="xs" fw={500} className="text-zinc-300">
              {item.usuario_nombre}
            </Text>
          </Group>
        )}

        {variantesDiff.length > 0 ? (
          <Stack gap={6} className="mt-2">
            {variantesDiff.map(([campo, cambio]) => (
              <CambioRow
                key={campo}
                campo={campo}
                anterior={cambio.anterior}
                nuevo={cambio.nuevo}
              />
            ))}
          </Stack>
        ) : (
          esCabecera && (
            <Text size="xs" c="dimmed" fs="italic">
              Sin cambios campo-a-campo (evento de sistema).
            </Text>
          )
        )}
      </div>
    </div>
  );
};

export const HistorialModal = ({ idGuia, opened, onClose }: HistorialModalProps) => {
  const [items, setItems] = useState<RES_HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !idGuia) {
      setItems([]);
      setError(null);
      return;
    }
    let cancelado = false;
    setLoading(true);
    setError(null);
    GuiasPrimerTramoHistorialService.get_historial(idGuia)
      .then((data: RES_HistorialItem[]) => {
        if (cancelado) return;
        setItems(data);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const mensaje =
          err instanceof Error ? err.message : "No se pudo cargar el historial.";
        setError(mensaje);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [opened, idGuia]);

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <Group gap={6}>
          <IconHistory size={20} className="text-amber-400" />
          <span>Historial de cambios</span>
        </Group>
      }
      size="lg"
      rightSection={
        idGuia ? (
          <Text size="xs" c="dimmed" fw={600} className="font-mono">
            GUÍA #{idGuia}
          </Text>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader size="md" color="amber" />
          <Text size="xs" c="dimmed">Cargando historial...</Text>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <Text size="sm" c="red.3" fw={600}>{error}</Text>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <IconHistory size={32} className="text-zinc-700" />
          <Text size="sm" c="dimmed" fw={500}>Esta guía aún no tiene movimientos registrados.</Text>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <Stack gap="md">
            {items.map((item) => (
              <HistorialItemCard key={`${item.origen}-${item.id}`} item={item} />
            ))}
          </Stack>
          <Divider className="mt-4" color="zinc.8" />
          <Group justify="space-between" mt="sm">
            <Text size="xs" c="dimmed">Total: {items.length} movimiento(s)</Text>
            <Text size="10px" c="dimmed" fs="italic">
              Auditoría registrada por Fabero
            </Text>
          </Group>
        </div>
      )}
    </ModalEstandar>
  );
};
