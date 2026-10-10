import { Badge, Text, Group, Tooltip, ActionIcon, Button } from "@mantine/core";
import { IconScale, IconPaperclip, IconLayersLinked } from "@tabler/icons-react";
import type { RES_ResumenBalanzaItem, RES_ParticionResumenItem } from "../../service/resumen-balanza.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";

interface Props {
  lote: RES_ResumenBalanzaItem;
  particiones: RES_ParticionResumenItem[];
  onPrintTicketParticion: (idParticion: number) => void;
  onVerEvidencias: (evidencias: IArchivo[]) => void;
  formatFecha: (fechaStr: string | null | undefined) => string;
  formatTonelada: (valor: number | null | undefined) => string;
}

export const DesplegableParticionesLote = ({
  lote,
  particiones,
  onPrintTicketParticion,
  onVerEvidencias,
  formatFecha,
  formatTonelada,
}: Props) => {
  return (
    <div className="p-4 bg-zinc-950/80 border-y border-zinc-800/80 animate-fadeIn space-y-3">
      {/* Cabecera del desplegable */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
        <Group gap="xs">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IconLayersLinked size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Text size="sm" fw={700} className="text-zinc-100">
                Particiones del Lote {lote.lote_correlativo}
              </Text>
              <Badge variant="filled" color="indigo" size="sm" radius="md">
                {particiones.length} {particiones.length === 1 ? "Partición" : "Particiones"}
              </Badge>
            </div>
            <Text size="xs" className="text-zinc-400">
              Desglose de ingresos y pesajes por unidad receptora
            </Text>
          </div>
        </Group>

        <Group gap="sm">
          {lote.proveedor_razon_social && (
            <div className="text-right">
              <Text size="11px" className="text-zinc-500 font-medium">Proveedor:</Text>
              <Text size="xs" fw={600} className="text-zinc-300 font-mono">
                {lote.proveedor_razon_social}
              </Text>
            </div>
          )}
          <div className="text-right pl-3 border-l border-zinc-800">
            <Text size="11px" className="text-emerald-400 font-bold">Total Neto Acumulado:</Text>
            <Badge
              variant="gradient"
              gradient={{ from: "teal", to: "green", deg: 45 }}
              size="md"
              radius="md"
              className="font-extrabold text-zinc-950 px-2.5 py-1"
            >
              {formatTonelada(lote.peso_neto)}
            </Badge>
          </div>
        </Group>
      </div>

      {/* Tabla de particiones */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center">Partición</th>
              <th className="py-2.5 px-3 text-center">Ticket Balanza</th>
              <th className="py-2.5 px-3 text-center">Fechas Pesaje</th>
              <th className="py-2.5 px-3 text-right">Pesos</th>
              <th className="py-2.5 px-3 text-center">Vehículo / Placa</th>
              <th className="py-2.5 px-3 text-center">Transporte y Conductor</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-center">Evidencias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {particiones.map((p, idx) => {
              const letraParticion = String.fromCharCode(65 + idx);
              const tieneEvidencias = Array.isArray(p.evidencias) && p.evidencias.length > 0;

              return (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  {/* Partición */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <Badge variant="light" color="indigo" size="sm" radius="md" className="font-bold">
                        Partición {letraParticion}
                      </Badge>
                      <Text size="11px" className="text-zinc-400 font-mono mt-0.5">
                        {p.correlativo || `P-${p.particion || idx + 1}`}
                      </Text>
                    </div>
                  </td>

                  {/* Ticket Balanza */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Tooltip label="Imprimir Ticket de Balanza de la Partición" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          radius="md"
                          onClick={() => onPrintTicketParticion(p.id)}
                          className="text-teal-400 hover:bg-white/5"
                        >
                          <IconScale size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Text size="10px" className="text-zinc-500 font-mono">
                        {p.ticket_correlativo || (p.id_ticket_balanza ? `TB-${p.id_ticket_balanza}` : "—")}
                      </Text>
                    </div>
                  </td>

                  {/* Fechas Pesaje */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col gap-1 text-[11px] max-w-52.5 mx-auto">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500 font-medium">Bruto (Inicial):</span>
                        <span className="text-zinc-300 font-mono">
                          {formatFecha(p.fecha_hora_peso_inicial)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500 font-medium">Tara (Final):</span>
                        <span className="text-zinc-300 font-mono">
                          {formatFecha(p.fecha_hora_peso_final)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Pesos */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 items-end min-w-32.5">
                      <div className="flex items-center justify-between gap-2 w-full text-[11px]">
                        <span className="text-zinc-500">Bruto:</span>
                        <span className="font-mono text-zinc-400">{formatTonelada(p.peso_inicial)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 w-full text-[11px]">
                        <span className="text-zinc-500">Tara:</span>
                        <span className="font-mono text-zinc-400">{formatTonelada(p.peso_final)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 w-full pt-0.5 border-t border-zinc-800">
                        <span className="text-emerald-400 font-bold text-[11px]">Neto:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatTonelada(p.peso_neto)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Vehículo / Placa */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col gap-0.5 items-center">
                      <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                        {p.vehiculo_placa || "SIN PLACA"}
                      </div>
                      {p.vehiculo_carreta_placa && (
                        <Text size="10px" className="text-zinc-500">
                          Acople: {p.vehiculo_carreta_placa}
                        </Text>
                      )}
                    </div>
                  </td>

                  {/* Transporte y Conductor */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col gap-0.5 items-center max-w-50 mx-auto">
                      <Text size="xs" fw={500} className="text-zinc-300 truncate w-full" title={p.empresa_transporte_razon_social || ""}>
                        {p.empresa_transporte_razon_social || (
                          <span className="text-zinc-600 italic">Particular / Propio</span>
                        )}
                      </Text>
                      <Text size="11px" className="text-zinc-400 truncate w-full" title={p.conductor_nombre_completo || ""}>
                        {p.conductor_nombre_completo || "—"}
                      </Text>
                      {p.conductor_licencia && (
                        <Text size="10px" className="text-zinc-500 font-mono">
                          Lic: {p.conductor_licencia}
                        </Text>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant="light"
                      color={p.recepcion_estado_pesaje === "Pesado" ? "teal" : "amber"}
                      size="sm"
                      radius="md"
                    >
                      {p.recepcion_estado_pesaje || "Pesado"}
                    </Badge>
                  </td>

                  {/* Evidencias */}
                  <td className="py-3 px-3 text-center">
                    {tieneEvidencias ? (
                      <Button
                        size="compact-xs"
                        variant="light"
                        color="indigo"
                        radius="xl"
                        leftSection={<IconPaperclip size={12} />}
                        onClick={() => onVerEvidencias(p.evidencias || [])}
                        className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10"
                      >
                        Ver ({p.evidencias?.length})
                      </Button>
                    ) : (
                      <span className="text-zinc-600 text-xs italic">Sin archivos</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
