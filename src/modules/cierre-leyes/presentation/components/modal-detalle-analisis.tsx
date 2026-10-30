import dayjs from "dayjs";
import { Badge } from "@mantine/core";
import {
  IconEye,
  IconFlask,
  IconBuildingFactory2,
  IconCalendarTime,
  IconUser,
  IconHash,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { AnalisisMineralResponse } from "../../service/cierre-leyes.responses";

interface ModalDetalleAnalisisProps {
  opened: boolean;
  onClose: () => void;
  analisis: AnalisisMineralResponse | null;
  contexto?: {
    loteCorrelativo?: string | null;
    loteProveedor?: string | null;
    grupoNombre?: string | null;
  } | null;
}

const formatearFechaHora = (valor?: string | null): string => {
  if (!valor) return "No registrada";
  const parsed = dayjs(valor);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : valor;
};

export const ModalDetalleAnalisis = ({
  opened,
  onClose,
  analisis,
  contexto,
}: ModalDetalleAnalisisProps) => {
  if (!analisis) return null;

  const vieneDeMuestraExterna = Boolean(analisis.id_muestra_externa && analisis.id_muestra_externa > 0);
  const esExterno = analisis.tipo_origen === TipoOrigen.Externo;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <div className="flex items-center gap-2">
          <IconEye size={18} className="text-cyan-400" />
          <span className="font-semibold text-sm">
            Detalle del Análisis — Ensayo #{analisis.numero_ensayo}
          </span>
        </div>
      }
      size="md"
    >
      <div className="space-y-3.5 pt-1">
        {/* Contexto de Lote y Grupo (cuando pertenece a un grupo de lote) */}
        {(contexto?.loteCorrelativo || contexto?.grupoNombre) && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {contexto.loteCorrelativo && (
                <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-[11px]">
                  {contexto.loteCorrelativo}
                </span>
              )}
              {contexto.grupoNombre && (
                <span className="font-semibold text-zinc-200">
                  Grupo: <strong className="text-white">{contexto.grupoNombre}</strong>
                </span>
              )}
            </div>
            {contexto.loteProveedor && (
              <span className="text-[11px] text-zinc-400 truncate max-w-52">
                {contexto.loteProveedor}
              </span>
            )}
          </div>
        )}

        {/* Bloque destacado cuando el análisis proviene de una Muestra Externa */}
        {vieneDeMuestraExterna && (
          <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-800/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <IconFlask size={15} className="text-cyan-400" />
                <span>Muestra Externa Asociada</span>
              </div>
              {analisis.muestra_correlativo && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-cyan-200">
                  {analisis.muestra_correlativo}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                  Código Cliente
                </span>
                <span className="text-white font-bold text-xs">
                  {analisis.muestra_codigo_cliente || analisis.muestra_correlativo || `#${analisis.id_muestra_externa}`}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <IconCalendarTime size={11} className="text-cyan-400" />
                  Ingreso Muestra
                </span>
                <span className="text-cyan-200 font-semibold text-xs">
                  {formatearFechaHora(analisis.muestra_fecha_hora_ingreso)}
                </span>
              </div>

              <div className="sm:col-span-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                  Proveedor Minero
                </span>
                <span className="text-zinc-200 font-medium text-xs">
                  {analisis.muestra_proveedor_nombre || "Sin proveedor registrado"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Información de Identificación del Ensayo */}
        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Identificación del Ensayo
            </span>
            <Badge
              size="xs"
              color={esExterno ? "yellow" : "indigo"}
              variant="light"
            >
              Origen {analisis.tipo_origen || TipoOrigen.Interno}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                <IconBuildingFactory2 size={11} className="text-indigo-400" />
                Laboratorio
              </span>
              <span className="text-white font-semibold block truncate">
                {analisis.laboratorio_nombre || "Sin laboratorio"}
              </span>
              {analisis.laboratorio_ruc && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  RUC: {analisis.laboratorio_ruc}
                </span>
              )}
            </div>

            <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                <IconHash size={11} className="text-indigo-400" />
                N° Ensayo / Asumido Por
              </span>
              <span className="text-white font-semibold block">
                Ensayo #{analisis.numero_ensayo}
              </span>
              <span className="text-[11px] text-zinc-400">
                Asume: <strong className="text-zinc-200">{analisis.asumido_por || "Proveedor"}</strong>
              </span>
            </div>

            <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                <IconUser size={11} className="text-zinc-400" />
                Registrado Por
              </span>
              <span className="text-zinc-200 font-medium block truncate">
                {analisis.empleado_registro_nombre || "Sistema"}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                <IconCalendarTime size={11} className="text-zinc-400" />
                Registro del Análisis
              </span>
              <span className="text-zinc-200 font-medium block">
                {formatearFechaHora(analisis.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModalEstandar>
  );
};
