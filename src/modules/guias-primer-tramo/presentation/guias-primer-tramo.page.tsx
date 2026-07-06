import { useEffect, useState } from "react";
import {
  Text,
  Button,
  Stack,
  TextInput,
  Table,
  Badge,
} from "@mantine/core";
import { IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useUIStore } from "../../../stores/ui.store";
import { useGuiasPrimerTramo } from "../hooks/useGuiasPrimerTramo";
import { ModalGuiaPrimerTramo } from "./components/modal-guia-primer-tramo";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import type { DTO_CrearGuiaPrimerTramo } from "../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../service/guias-primer-tramo.responses";
import { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";

export const GuiasPrimerTramoPage = () => {
  useTitlePage("Guías Primer Tramo", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal ?? null;

  const {
    guias,
    loading,
    crearGuia,
    fetchGuias,
    fetchFiltrosMetadata,
  } = useGuiasPrimerTramo();

  const todayIso = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Filtros
  const [fechaInicio, setFechaInicio] = useState<string>(todayIso());
  const [fechaFin, setFechaFin] = useState<string>(todayIso());

  // Modal
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (idSucursal) {
      fetchGuias({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      fetchFiltrosMetadata(idSucursal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal, fechaInicio, fechaFin]);

  const handleLimpiar = () => {
    const today = todayIso();
    setFechaInicio(today);
    setFechaFin(today);
    if (idSucursal) {
      fetchGuias({ id_sucursal: idSucursal, fecha_inicio: today, fecha_fin: today });
    }
  };

  const handleSubmit = async (dto: DTO_CrearGuiaPrimerTramo) => {
    await crearGuia(dto);
    setOpenModal(false);
    if (idSucursal) {
      fetchGuias({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      fetchFiltrosMetadata(idSucursal);
    }
  };



  const motivoColor = (m: string | null): string => {
    switch (m) {
      case MotivoTraslado.Venta:
        return "indigo";
      case MotivoTraslado.Chancado:
        return "orange";
      default:
        return "zinc";
    }
  };



  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filtros + Acciones (estilo compacto) */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <TextInput
            type="date"
            label="Fecha Inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.currentTarget.value)}
            leftSection={<IconCalendar size={14} className="text-zinc-500" />}
            radius="lg"
            size="xs"
            w={200}
            classNames={{
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
            }}
          />
          <TextInput
            type="date"
            label="Fecha Fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.currentTarget.value)}
            leftSection={<IconCalendar size={14} className="text-zinc-500" />}
            radius="lg"
            size="xs"
            w={200}
            classNames={{
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
            }}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            leftSection={<IconX size={16} />}
            variant="subtle"
            color="red"
            radius="lg"
            size="sm"
            onClick={handleLimpiar}
          >
            Limpiar
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            radius="lg"
            size="sm"
            onClick={() => setOpenModal(true)}
            disabled={!idSucursal}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20 font-bold"
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* Tabla Estandar de guías */}
      <DataTableEstandar
        idAccessor="id"
        records={guias}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
          },
          {
            accessor: "fechas",
            title: "Fechas Clave",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1}>
                {g.fecha_emision && (
                  <Text size="10px" c="dimmed" className="font-mono">
                    Emis: {g.fecha_emision}
                  </Text>
                )}
                {g.fecha_inicio_traslado && (
                  <Text size="10px" c="dimmed" className="font-mono">
                    Tras: {g.fecha_inicio_traslado}
                  </Text>
                )}
                {g.fecha_en_planta && (
                  <Text size="10px" c="dimmed" className="font-mono">
                    Plan: {g.fecha_en_planta}
                  </Text>
                )}
              </Stack>
            ),
          },
          {
            accessor: "guia_remitente",
            title: "Guía Remitente",
            render: (g: RES_GuiaPrimerTramo) => (
              <Text size="xs" fw={500} className="text-zinc-200 font-mono">
                {g.serie_guia_remitente || g.numero_guia_remitente
                  ? `${g.serie_guia_remitente ?? ""}-${g.numero_guia_remitente ?? ""}`
                  : "—"}
              </Text>
            ),
          },
          {
            accessor: "guia_transportista",
            title: "Guía Transportista",
            render: (g: RES_GuiaPrimerTramo) => {
              if (g.sin_guia_transportista) {
                return (
                  <Badge color="yellow" variant="outline" size="xs" radius="md">
                    Sin Guía Transp.
                  </Badge>
                );
              }
              return (
                <Text size="xs" className="text-zinc-300 font-mono">
                  {g.serie_guia_transportista || g.numero_guia_transportista
                    ? `${g.serie_guia_transportista ?? ""}-${g.numero_guia_transportista ?? ""}`
                    : "—"}
                </Text>
              );
            },
          },
          {
            accessor: "proveedor",
            title: "Proveedor / Concesión",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1}>
                <Text size="xs" fw={600} className="text-zinc-100">
                  {g.proveedor_razon_social ?? `ID ${g.id_proveedor}`}
                </Text>
                <Text size="10px" c="emerald.4" fw={500}>
                  Concesión: {g.concesion_nombre ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "conductor",
            title: "Conductor",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1}>
                <Text size="xs" fw={600} className="text-zinc-200">
                  {g.conductor_nombre ?? "—"}
                </Text>
                <Text size="10px" c="dimmed" className="font-mono">
                  Lic: {g.conductor_licencia ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "empresa_transporte",
            title: "Empresa Transporte",
            render: (g: RES_GuiaPrimerTramo) => (
              <Text size="xs" className="text-zinc-300 font-semibold truncate max-w-[200px]" title={g.empresa_transporte_razon_social ?? ""}>
                {g.empresa_transporte_razon_social || "—"}
              </Text>
            ),
          },
          {
            accessor: "vehiculo_tractor",
            title: "Vehículo",
            render: (g: RES_GuiaPrimerTramo) => {
              const tractor = g.vehiculo_placa
                ? g.vehiculo_serie
                  ? `${g.vehiculo_serie}-${g.vehiculo_placa}`
                  : g.vehiculo_placa
                : "—";
              return (
                <Text size="xs" className="text-zinc-200 font-mono">
                  {tractor}
                </Text>
              );
            },
          },
          {
            accessor: "vehiculo_carreta",
            title: "Carreta",
            render: (g: RES_GuiaPrimerTramo) => {
              const carreta = g.vehiculo_carreta_placa
                ? g.vehiculo_carreta_serie
                  ? `${g.vehiculo_carreta_serie}-${g.vehiculo_carreta_placa}`
                  : g.vehiculo_carreta_placa
                : null;
              return (
                <Text size="xs" className="text-zinc-300 font-mono">
                  {carreta ?? "—"}
                </Text>
              );
            },
          },
          {
            accessor: "motivo",
            title: "Motivo",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Badge color={motivoColor(g.motivo_traslado)} variant="light" size="xs" radius="md">
                {g.motivo_traslado ?? "—"}
              </Badge>
            ),
          },
          {
            accessor: "lotes_count",
            title: "Lotes",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Badge color={g.lotes && g.lotes.length > 0 ? "emerald" : "zinc"} variant="light" size="sm" radius="md">
                {g.lotes?.length ?? 0} Lote(s)
              </Badge>
            ),
          },
        ]}
        rowExpansion={{
          content: ({ record: g }: { record: RES_GuiaPrimerTramo }) => (
            <div className="p-4 bg-zinc-950/40 border-l-2 border-blue-500/50">
              {/* Lotes asociados */}
              <div>
                <Text size="xs" fw={700} c="blue.4" tt="uppercase" lts="0.1em" mb="xs">
                  Lotes asociados
                </Text>
                {g.lotes && g.lotes.length > 0 ? (
                  <div className="rounded-lg border border-zinc-800/85 overflow-hidden">
                    <Table verticalSpacing="xs" className="w-full">
                      <thead className="bg-zinc-900/50">
                        <tr className="text-zinc-400 text-[10px] uppercase tracking-wider">
                          <th style={{ width: 50 }} className="text-center py-2 pl-4">#</th>
                          <th className="text-left py-2">Lote Mineral</th>
                          <th className="text-left py-2">Correlativo</th>
                          <th className="text-left py-2">Producto</th>
                          <th className="text-left py-2">Mineral</th>
                          <th className="text-right py-2">P. Bruto</th>
                          <th className="text-right py-2">Tara</th>
                          <th className="text-right py-2 pr-4">P. Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.lotes.map((l, idx) => (
                          <tr key={l.id} className="border-b border-zinc-900/40 ">
                            <td className="text-zinc-400 font-mono text-xs text-center py-2 pl-4">{idx + 1}</td>
                            <td className="font-mono text-zinc-100 text-xs py-2 fw-semibold">{l.lote_correlativo ?? "—"}</td>
                            <td className="font-mono text-zinc-400 text-xs py-2">{l.correlativo}</td>
                            <td className="text-zinc-300 text-xs py-2">{l.tipo_producto ?? "—"}</td>
                            <td className="text-zinc-300 text-xs py-2">{l.tipo_mineral ?? "—"}</td>
                            <td className="text-right font-mono text-zinc-200 text-xs py-2">{l.peso_bruto?.toFixed(2) ?? "—"}</td>
                            <td className="text-right font-mono text-zinc-200 text-xs py-2">{l.tara?.toFixed(2) ?? "—"}</td>
                            <td className="text-right font-mono text-emerald-400 text-xs py-2 pr-4 fw-semibold">{l.peso_neto?.toFixed(2) ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Text size="xs" c="dimmed">Esta guía no tiene lotes asociados.</Text>
                )}
              </div>
            </div>
          ),
        }}
      />

      {/* Modal de creación */}
      {idSucursal && (
        <ModalGuiaPrimerTramo
          opened={openModal}
          idSucursal={idSucursal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};