import { useState, useCallback, useEffect } from "react";
import { Text, Group, Badge, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { LimpiarFiltrosButton } from "../../../presentation/utils/limpiar-filtros-button";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { useMuestreo } from "../hooks/useMuestreo";
import { ModalConfirmarMuestreo } from "./components/modal-confirmar-muestreo";
import type { DTO_ConfirmarMuestreo } from "../service/muestreo.requests";
import type { RES_LoteMuestreo } from "../service/muestreo.responses";

/** Rango inicial del filtro: el último mes. */
const DIAS_POR_DEFECTO = 30;

const formatFecha = (fechaStr: string | null | undefined): string => {
  if (!fechaStr) return "—";
  const d = new Date(fechaStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return fechaStr;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatPeso = (peso: number | null): string => {
  if (peso === null || peso === undefined) return "—";
  return peso.toLocaleString("es-PE", { maximumFractionDigits: 2 });
};

export const MuestreoPage = () => {
  // El muestreo no depende de la sucursal: el listado es global.
  useTitlePage("Muestreo", false);

  const { lotes, loading, confirmando, loadLotes, confirmarMuestreo } =
    useMuestreo();

  // Filtro de rango de fechas (por defecto, el último mes).
  const [fechaInicio, setFechaInicio] = useState<string | null>(
    defaultFechaInicio(DIAS_POR_DEFECTO),
  );
  const [fechaFin, setFechaFin] = useState<string | null>(defaultFechaFin());

  const [loteSeleccionado, setLoteSeleccionado] =
    useState<RES_LoteMuestreo | null>(null);

  const aplicarFiltros = useCallback(() => {
    void loadLotes({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  }, [fechaInicio, fechaFin, loadLotes]);

  // Recarga el listado cuando cambia el rango de fechas.
  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const limpiarFiltros = useCallback(() => {
    setFechaInicio(defaultFechaInicio(DIAS_POR_DEFECTO));
    setFechaFin(defaultFechaFin());
  }, []);

  const handleConfirmar = async (dto: DTO_ConfirmarMuestreo) => {
    if (!loteSeleccionado) return;
    const ok = await confirmarMuestreo(loteSeleccionado.id, dto);
    if (ok) {
      setLoteSeleccionado(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Barra de filtros: rango de fechas a la izquierda, acciones a la derecha */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="w-full sm:w-auto">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
            defaultDaysBack={DIAS_POR_DEFECTO}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LimpiarFiltrosButton
            onClick={limpiarFiltros}
            label="Limpiar todos los filtros"
          />

          <RefreshButton
            onClick={aplicarFiltros}
            loading={loading}
            label="Recargar lotes"
          />
        </div>
      </div>

      {/* Listado */}
      <div>
        <DataTableEstandar
          idAccessor="id"
          records={lotes}
          loading={loading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlign: "center",
              width: 50,
            },
            {
              accessor: "correlativo",
              title: "Correlativo",
              width: 180,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Text size="sm" fw={800} className="text-white font-mono">
                  {r.correlativo}
                </Text>
              ),
            },
            {
              accessor: "vehiculo_placa",
              title: "Vehículo",
              width: 140,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) =>
                r.vehiculo_placa ? (
                  <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                    {r.vehiculo_placa}
                  </div>
                ) : (
                  <Text size="xs" className="text-zinc-500 italic">
                    (sin placa)
                  </Text>
                ),
            },
            {
              accessor: "proveedor_razon_social",
              title: "Proveedor",
              width: 220,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Text
                  size="sm"
                  className="text-zinc-200"
                  truncate
                  title={r.proveedor_razon_social ?? ""}
                >
                  {r.proveedor_razon_social ?? "—"}
                </Text>
              ),
            },
            {
              accessor: "zona_origen_nombre",
              title: "Zona Origen",
              width: 160,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Text size="sm" className="text-zinc-300">
                  {r.zona_origen_nombre ?? "—"}
                </Text>
              ),
            },
            {
              accessor: "particiones",
              title: "Particiones",
              width: 170,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) =>
                r.total_particiones > 0 ? (
                  <Group gap={4} wrap="nowrap" justify="center">
                    {r.particiones.map((p) => (
                      <Badge
                        key={p.id}
                        size="md"
                        variant="light"
                        radius="sm"
                        color={p.muestreo_confirmado ? "teal" : "indigo"}
                        className="font-mono font-bold"
                      >
                        {p.particion}
                      </Badge>
                    ))}
                  </Group>
                ) : (
                  <Text size="sm" className="text-white">
                    —
                  </Text>
                ),
            },
            {
              accessor: "peso_neto",
              title: "Peso Neto (Kg)",
              width: 140,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Text size="sm" fw={700} className="text-white font-mono">
                  {formatPeso(r.peso_neto)}
                </Text>
              ),
            },
            {
              accessor: "created_at",
              title: "Fecha Lote",
              width: 160,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Text size="sm" className="text-zinc-300 font-mono">
                  {formatFecha(r.created_at)}
                </Text>
              ),
            },
            {
              accessor: "estado",
              title: "Estado",
              width: 170,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) =>
                r.con_codigo_temporal ? (
                  <Badge size="sm" radius="sm" variant="light" color="orange">
                    Pendiente de muestreo
                  </Badge>
                ) : (
                  <Badge size="sm" radius="sm" variant="light" color="teal">
                    Muestreado
                  </Badge>
                ),
            },
            {
              accessor: "acciones",
              title: "Acción",
              width: 140,
              textAlign: "center",
              render: (r: RES_LoteMuestreo) => (
                <Button
                  size="xs"
                  radius="sm"
                  color="teal"
                  leftSection={<IconCheck size={14} />}
                  onClick={() => setLoteSeleccionado(r)}
                >
                  Confirmar
                </Button>
              ),
            },
          ]}
        />
      </div>

      <ModalConfirmarMuestreo
        lote={loteSeleccionado}
        opened={!!loteSeleccionado}
        submitting={confirmando}
        onCancel={() => setLoteSeleccionado(null)}
        onConfirm={handleConfirmar}
      />
    </div>
  );
};
