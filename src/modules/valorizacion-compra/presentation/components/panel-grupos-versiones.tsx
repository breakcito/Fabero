import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBan,
  IconCheck,
  IconCopy,
  IconEdit,
  IconFileDescription,
  IconFiles,
  IconHistory,
  IconPrinter,
  IconShoppingCart,
} from "@tabler/icons-react";
import { EstadoValorizacionCompra } from "../../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";
import { BadgeEstadoValorizacion } from "./badge-estado-valorizacion";
import {
  fmtMonedaUsd,
  obtenerCorrelativoDisplay,
  type GrupoValorizacionCompra,
} from "../utils/valorizacion-grupo.utils";

interface Props {
  grupos: GrupoValorizacionCompra[];
  selectedGrupoUuid: string | null;
  selectedVersionId: number | null;
  loading: boolean;
  printingId: number | null;
  solicitandoOcId: number | null;
  togglingIds: Record<number, boolean>;
  clonandoIds: Record<number, boolean>;
  onSelectGrupo: (uuidGrupo: string) => void;
  onSelectVersion: (idVersion: number, uuidGrupo: string) => void;
  onDeclaracionJurada: (v: RES_ValorizacionCompra) => void;
  onSolicitarOc: (v: RES_ValorizacionCompra) => void;
  onClonarVersion: (v: RES_ValorizacionCompra) => void;
  onImprimirValorizacion: (v: RES_ValorizacionCompra) => void;
  onEditarVersion: (v: RES_ValorizacionCompra) => void;
  onAprobarVersion: (v: RES_ValorizacionCompra) => void;
  onAnularVersion: (v: RES_ValorizacionCompra) => void;
  onVerHistorial: (v: RES_ValorizacionCompra) => void;
  onVerEvidencias: (title: string, files: (IArchivo | string)[]) => void;
}

export const PanelGruposVersiones = ({
  grupos,
  selectedGrupoUuid,
  selectedVersionId,
  loading,
  printingId,
  solicitandoOcId,
  togglingIds,
  clonandoIds,
  onSelectGrupo,
  onSelectVersion,
  onDeclaracionJurada,
  onSolicitarOc,
  onClonarVersion,
  onImprimirValorizacion,
  onEditarVersion,
  onAprobarVersion,
  onAnularVersion,
  onVerHistorial,
  onVerEvidencias,
}: Props) => {
  /**
   * Resuelve sobre qué propuesta operan los botones superiores del grupo (D. Jurada / Solicitar OC):
   * 1) Si el grupo tiene una propuesta Aprobada -> opera sobre la Aprobada.
   * 2) Si no, si el grupo está seleccionado y la propuesta activa seleccionada no está Anulada/Desestimada -> esa.
   * 3) Si no, la última propuesta activa del grupo.
   */
  const resolverTargetGrupo = (
    grupo: GrupoValorizacionCompra,
  ): RES_ValorizacionCompra | null => {
    if (grupo.versionAprobada) {
      return grupo.versionAprobada;
    }
    if (grupo.uuidGrupo === selectedGrupoUuid && selectedVersionId !== null) {
      const sel = grupo.versiones.find((v) => v.id === selectedVersionId);
      if (
        sel &&
        sel.estado !== EstadoValorizacionCompra.Anulado &&
        sel.estado !== EstadoValorizacionCompra.Desestimada
      ) {
        return sel;
      }
    }
    const propuestas = grupo.versiones.filter(
      (v) => v.estado === EstadoValorizacionCompra.Propuesta,
    );
    return propuestas.length > 0 ? propuestas[propuestas.length - 1] : null;
  };

  if (loading && grupos.length === 0) {
    return (
      <Paper
        p="xl"
        radius="lg"
        className="bg-zinc-950/80 border border-zinc-800/90 shadow-lg flex flex-col items-center justify-center gap-2 min-h-65"
      >
        <Loader size="sm" color="indigo" />
        <Text fz="xs" c="dimmed">
          Cargando valorizaciones...
        </Text>
      </Paper>
    );
  }

  if (grupos.length === 0) {
    return (
      <Paper
        p="xl"
        radius="lg"
        className="bg-zinc-950/80 border border-dashed border-zinc-800 text-center"
      >
        <Text fz="xs" c="dimmed">
          No se encontraron valorizaciones con los filtros aplicados.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="sm" className="max-h-[calc(100vh-175px)] overflow-y-auto pr-1">
      {grupos.map((grupo) => {
        const isGrupoSelected = selectedGrupoUuid === grupo.uuidGrupo;
        const targetAccion = resolverTargetGrupo(grupo);
        const yaSolicitoOc = Boolean(targetAccion?.id_empleado_solicita_oc);
        const busyOc =
          targetAccion !== null && solicitandoOcId === targetAccion.id;
        const grupoYaAprobado = Boolean(grupo.versionAprobada);

        return (
          <Paper
            key={grupo.uuidGrupo}
            p="sm"
            radius="lg"
            className={`transition-all duration-150 border ${
              isGrupoSelected
                ? "bg-zinc-950/95 border-indigo-500/60 shadow-lg shadow-indigo-950/20"
                : "bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700/90 shadow-md"
            }`}
          >
            {/* Parte superior del card: Datos generales + D. Jurada / Solicitar OC */}
            <div
              onClick={() => onSelectGrupo(grupo.uuidGrupo)}
              className="cursor-pointer space-y-1.5"
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text
                  fw={800}
                  fz="sm"
                  c={isGrupoSelected ? "cyan.3" : "cyan.4"}
                  className="font-mono tracking-tight truncate"
                >
                  {grupo.correlativo}
                </Text>

                <BadgeEstadoValorizacion estado={grupo.estadoGrupo} size="xs" />
              </Group>

              <div>
                <Text fw={700} fz="xs" c="white" lineClamp={1}>
                  {grupo.proveedorNombre}
                </Text>
                <Text fz={11} c="dimmed" lineClamp={1}>
                  RUC: {grupo.proveedorRuc} · {grupo.concesionNombre}
                </Text>
              </div>

              <Group
                justify="flex-end"
                gap={6}
                pt={4}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip
                  label={
                    targetAccion
                      ? `Imprimir Declaración Jurada (#${targetAccion.numero_version ?? 1})`
                      : "No hay propuesta activa para Declaración Jurada"
                  }
                  withArrow
                >
                  <Button
                    size="compact-xs"
                    radius="md"
                    variant="light"
                    color="cyan"
                    disabled={!targetAccion}
                    leftSection={<IconFileDescription size={13} />}
                    onClick={() => {
                      if (targetAccion) onDeclaracionJurada(targetAccion);
                    }}
                  >
                    D. Jurada
                  </Button>
                </Tooltip>

                <Tooltip
                  label={
                    !targetAccion
                      ? "No hay propuesta activa para solicitar OC"
                      : yaSolicitoOc
                        ? `OC solicitada (#${targetAccion.numero_version ?? 1}) por ${targetAccion.empleado_solicita_oc || "Empleado"} (${targetAccion.fecha_hora_solicitud_oc || ""})`
                        : `Solicitar Orden de Compra (#${targetAccion.numero_version ?? 1})`
                  }
                  withArrow
                >
                  <Button
                    size="compact-xs"
                    radius="md"
                    variant={yaSolicitoOc ? "filled" : "light"}
                    color="indigo"
                    loading={busyOc}
                    disabled={!targetAccion || busyOc}
                    leftSection={<IconShoppingCart size={13} />}
                    onClick={() => {
                      if (targetAccion) onSolicitarOc(targetAccion);
                    }}
                  >
                    {yaSolicitoOc ? "OC Solicitada" : "Solicitar OC"}
                  </Button>
                </Tooltip>
              </Group>
            </div>

            {/* Parte inferior dentro del mismo card: Lista de propuestas seleccionables */}
            <Box className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-2 max-h-85 overflow-y-auto pr-0.5">
              {grupo.versiones.map((v) => {
                const isSelected = selectedVersionId === v.id;
                const isPropuesta =
                  v.estado === EstadoValorizacionCompra.Propuesta;
                const isAprobado =
                  v.estado === EstadoValorizacionCompra.Aprobado;
                const isAnulado = v.estado === EstadoValorizacionCompra.Anulado;
                const fueAprobada =
                  isAprobado || Boolean(v.fecha_hora_aprobacion);
                const isBusy = Boolean(togglingIds[v.id]);
                const isCloning = Boolean(clonandoIds[v.id]);
                const isPrinting = printingId === v.id;
                const puedeClonar = !grupoYaAprobado && !isAnulado;
                const numProp = v.numero_version ?? 1;
                const corrStr = obtenerCorrelativoDisplay(v);

                const lotesFisicos = new Set(
                  (v.detalles || []).map((d) =>
                    String(d.id_lote_mineral ?? d.id_lote_guia),
                  ),
                ).size;

                return (
                  <Paper
                    key={v.id}
                    p="xs"
                    radius="md"
                    onClick={() => onSelectVersion(v.id, grupo.uuidGrupo)}
                    className={`cursor-pointer transition-all duration-150 border ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/80 shadow-sm shadow-indigo-950/30"
                        : v.estado === EstadoValorizacionCompra.Desestimada
                          ? "bg-zinc-900/35 border-zinc-800/60 opacity-80 hover:opacity-100 hover:border-zinc-700"
                          : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/85"
                    }`}
                  >
                    {/* Fila 1: Identificador compacto + Estado + Lotes + Subtotal */}
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Group gap={6} wrap="nowrap" className="min-w-0">
                        <Badge
                          color={isSelected ? "indigo" : "dark"}
                          variant="filled"
                          size="xs"
                          radius="sm"
                          fw={800}
                        >
                          #{numProp}
                        </Badge>
                        <BadgeEstadoValorizacion estado={v.estado} size="xs" />
                        <Text fz={11} c="dimmed" className="truncate">
                          {lotesFisicos}{" "}
                          {lotesFisicos === 1 ? "lote" : "lotes"}
                        </Text>
                      </Group>

                      <Text
                        fz="xs"
                        fw={800}
                        c={
                          Number(v.total_subtotal || 0) > 0
                            ? "teal.3"
                            : "dimmed"
                        }
                        className="font-mono shrink-0"
                      >
                        {fmtMonedaUsd(v.total_subtotal)}
                      </Text>
                    </Group>

                    {/* Fila 2: Fecha + Badges contextuales + Acciones de la propuesta */}
                    <Group
                      justify="space-between"
                      align="center"
                      gap={6}
                      mt={6}
                      pt={5}
                      className="border-t border-zinc-800/60"
                    >
                      <Group gap={5} wrap="wrap">
                        <Text fz={10.5} c="dimmed" className="font-mono">
                          {v.created_at ? v.created_at.slice(0, 16) : "—"}
                        </Text>
                        {v.id_empleado_solicita_oc && (
                          <Badge color="indigo" variant="light" size="xs">
                            OC
                          </Badge>
                        )}
                        {fueAprobada && v.tipo_pago && (
                          <Badge color="blue" variant="outline" size="xs">
                            {v.tipo_pago.toUpperCase()}
                          </Badge>
                        )}
                      </Group>

                      <Group
                        gap={4}
                        wrap="nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Clonar / Copiar */}
                        <Tooltip
                          label={
                            grupoYaAprobado
                              ? "Este grupo ya cuenta con una propuesta aprobada"
                              : isAnulado
                                ? "No se puede clonar una propuesta anulada"
                                : `Clonar #${numProp} (copia cabecera y lotes)`
                          }
                          withArrow
                        >
                          <ActionIcon
                            size="sm"
                            radius="md"
                            variant="light"
                            color="violet"
                            loading={isCloning}
                            disabled={!puedeClonar || isCloning}
                            onClick={() => onClonarVersion(v)}
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Imprimir Valorización */}
                        <Tooltip
                          label={`Imprimir Valorización (#${numProp})`}
                          withArrow
                        >
                          <ActionIcon
                            size="sm"
                            radius="md"
                            variant="light"
                            color="yellow"
                            loading={isPrinting}
                            disabled={isPrinting}
                            onClick={() => onImprimirValorizacion(v)}
                          >
                            <IconPrinter size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Editar (solo Propuesta) */}
                        {isPropuesta && (
                          <Tooltip
                            label={`Editar Propuesta (#${numProp})`}
                            withArrow
                          >
                            <ActionIcon
                              size="sm"
                              radius="md"
                              variant="light"
                              color="orange"
                              onClick={() => onEditarVersion(v)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Aprobar (solo Propuesta) */}
                        {isPropuesta && (
                          <Tooltip
                            label={`Aprobar Propuesta (#${numProp})`}
                            withArrow
                          >
                            <ActionIcon
                              size="sm"
                              radius="md"
                              variant="filled"
                              color="teal"
                              loading={isBusy}
                              disabled={isBusy}
                              onClick={() => onAprobarVersion(v)}
                            >
                              <IconCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Anular (Propuesta o Aprobado) */}
                        {(isPropuesta || isAprobado) && (
                          <Tooltip
                            label={`Anular / Eliminar (#${numProp})`}
                            withArrow
                          >
                            <ActionIcon
                              size="sm"
                              radius="md"
                              variant="light"
                              color="red"
                              loading={isBusy}
                              disabled={isBusy}
                              onClick={() => onAnularVersion(v)}
                            >
                              <IconBan size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Evidencias de Registro */}
                        {v.evidencias && v.evidencias.length > 0 && (
                          <Tooltip label="Evidencias de Registro" withArrow>
                            <ActionIcon
                              size="sm"
                              radius="md"
                              variant="light"
                              color="indigo"
                              onClick={() =>
                                onVerEvidencias(
                                  `Evidencias de Registro (${corrStr} · #${numProp})`,
                                  v.evidencias || [],
                                )
                              }
                            >
                              <IconFiles size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Evidencias de Anulación */}
                        {v.evidencias_anulacion &&
                          v.evidencias_anulacion.length > 0 && (
                            <Tooltip label="Evidencias de Anulación" withArrow>
                              <ActionIcon
                                size="sm"
                                radius="md"
                                variant="filled"
                                color="red"
                                onClick={() =>
                                  onVerEvidencias(
                                    `Evidencias de Anulación (${corrStr} · #${numProp})`,
                                    v.evidencias_anulacion || [],
                                  )
                                }
                              >
                                <IconFiles size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                        {/* Ver Historial */}
                        <Tooltip
                          label={`Ver Historial (#${numProp})`}
                          withArrow
                        >
                          <ActionIcon
                            size="sm"
                            radius="md"
                            variant="light"
                            color="blue"
                            onClick={() => onVerHistorial(v)}
                          >
                            <IconHistory size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};
