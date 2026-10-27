import { useMemo } from "react";
import { Badge, Group, SegmentedControl, Text } from "@mantine/core";
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
} from "@mantine/charts";
import "@mantine/charts/styles.css";
import {
  IconChartBar,
  IconCoins,
  IconDroplet,
  IconScale,
  IconTruck,
  IconPackage,
  IconRosetteDiscountCheck,
  IconClockHour4,
  IconAlertTriangle,
  IconUsers,
} from "@tabler/icons-react";

import { useDashboard } from "../hooks/useDashboard";
import { ChartPanel } from "./components/chart-panel";
import { KpiCard } from "./components/kpi-card";
import { useAuthUser } from "../../../hooks/useAuthUser";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DateRangeFilter } from "../../../presentation/utils/filtro-rango-fechas";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { formatNumber } from "../../../shared/functions/formatNumber";
import { convertirMoneda, simboloMoneda } from "./utils/moneda";
import type { MonedaDashboard } from "./utils/moneda";
import type { RES_DashboardSerie } from "../service/dashboard.responses";

const COLOR_FUNCION = [
  "indigo.6",
  "cyan.6",
  "teal.6",
  "yellow.6",
  "violet.6",
  "green.6",
  "orange.6",
] as const;

const COLOR_EMBUDO = [
  "indigo",
  "cyan",
  "teal",
  "yellow",
  "violet",
  "green",
  "lime",
  "orange",
] as const;

const COLOR_ESTADO_LOTE: Record<string, string> = {
  Valorizado: "green.6",
  "Con valor comercial": "teal.6",
  "Sin valor comercial": "zinc.6",
};

const COLOR_ESTADO_VALORIZACION: Record<string, string> = {
  Propuesta: "yellow.6",
  Aprobado: "green.6",
  Anulado: "red.6",
  Pendiente: "yellow.6",
};

const EmptyState = ({ texto }: { texto: string }) => (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
    <Text size="xs" className="text-zinc-600">
      {texto}
    </Text>
  </div>
);

export const DashboardPage = () => {
  useTitlePage("Dashboard");
  const { usuario } = useAuthUser();

  const {
    data,
    loading,
    load,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    moneda,
    setMoneda,
  } = useDashboard();

  const kpis = data?.kpis;
  const tipoCambio = data?.tipo_cambio ?? null;

  // --- Series diarias -------------------------------------------------
  const serieToneladas = useMemo(
    () =>
      (data?.serie ?? []).map((s: RES_DashboardSerie) => ({
        fecha: s.fecha.slice(5),
        toneladas: s.toneladas,
      })),
    [data],
  );

  const serieValorizacion = useMemo(
    () =>
      (data?.serie ?? []).map((s: RES_DashboardSerie) => ({
        fecha: s.fecha.slice(5),
        valor: s.valor_compra_usd,
      })),
    [data],
  );

  const serieLeyes = useMemo(
    () =>
      (data?.serie ?? []).map((s: RES_DashboardSerie) => ({
        fecha: s.fecha.slice(5),
        ley_oro: s.ley_oro,
        ley_plata: s.ley_plata,
      })),
    [data],
  );

  // --- Conversión de moneda -------------------------------------------
  const compra = convertirMoneda(
    kpis?.valorizacion_compra_usd ?? 0,
    "USD",
    moneda,
    tipoCambio,
  );
  const venta = convertirMoneda(
    kpis?.valorizacion_venta_usd ?? 0,
    "USD",
    moneda,
    tipoCambio,
  );
  const valorPorTonelada = convertirMoneda(
    kpis?.valor_por_tonelada_usd ?? 0,
    "USD",
    moneda,
    tipoCambio,
  );
  const anticipos = convertirMoneda(
    data?.financiero?.saldo_anticipos_pen ?? 0,
    "PEN",
    moneda,
    tipoCambio,
  );
  const deuda = convertirMoneda(
    data?.financiero?.deuda_proveedores_pen ?? 0,
    "PEN",
    moneda,
    tipoCambio,
  );

  const notaConversion = (convertido: boolean) =>
    convertido && tipoCambio
      ? `convertido @ TC ${tipoCambio.fecha}`
      : undefined;

  // --- Distribuciones --------------------------------------------------
  const porElemento = useMemo(
    () =>
      (data?.por_elemento ?? []).map((e, i) => ({
        name: e.elemento,
        value: convertirMoneda(e.valor_usd, "USD", moneda, tipoCambio).valor,
        color: COLOR_FUNCION[i % COLOR_FUNCION.length],
      })),
    [data, moneda, tipoCambio],
  );

  const porEstadoLote = useMemo(
    () =>
      (data?.por_estado_lote ?? []).map((e) => ({
        name: e.estado,
        value: e.toneladas,
        color: COLOR_ESTADO_LOTE[e.estado] ?? "zinc.6",
      })),
    [data],
  );

  const estadoValorizaciones = useMemo(
    () =>
      (data?.estado_valorizaciones ?? []).map((e) => ({
        name: e.estado,
        value: e.conteo,
        color: COLOR_ESTADO_VALORIZACION[e.estado] ?? "zinc.6",
      })),
    [data],
  );

  const topProveedores = useMemo(
    () =>
      (data?.por_proveedor ?? []).map((p) => ({
        proveedor: p.razon_social.length > 22 ? `${p.razon_social.slice(0, 22)}…` : p.razon_social,
        valor: convertirMoneda(p.valor_usd, "USD", moneda, tipoCambio).valor,
      })),
    [data, moneda, tipoCambio],
  );

  const merma = useMemo(
    () =>
      (data?.merma ?? []).map((m) => ({
        correlativo: m.correlativo,
        merma_pct: m.merma_pct,
      })),
    [data],
  );

  const formatoMoneda = (valor: number) =>
    `${simboloMoneda(moneda)} ${formatNumber(valor, 2)}`;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5">
      {/* Encabezado + filtros */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent md:text-3xl">
            Hola, {usuario?.nombre || "Usuario"}
          </h1>
          <Text size="sm" className="mt-1 text-zinc-400">
            Indicadores de la planta de beneficio ·{" "}
            {data?.meta
              ? `${data.meta.fecha_inicio} → ${data.meta.fecha_fin}`
              : "cargando período…"}
          </Text>
        </div>

        <Group gap="sm" wrap="wrap" align="flex-end">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />

          <SegmentedControl
            size="xs"
            radius="lg"
            value={moneda}
            onChange={(v) => setMoneda(v as MonedaDashboard)}
            data={[
              { label: "USD", value: "USD" },
              { label: "PEN", value: "PEN" },
            ]}
            classNames={{
              root: "bg-zinc-900/50 border border-zinc-800 rounded-lg",
              label: "px-3 text-zinc-300 data-[active]:text-white",
            }}
          />

          <RefreshButton onClick={load} loading={loading} />
        </Group>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toneladas receptadas"
          value={kpis?.toneladas_receptadas ?? 0}
          unidad="t"
          color="indigo"
          icono={IconScale}
          loading={loading}
          pie={`${formatNumber(kpis?.lotes_receptados ?? 0)} lotes`}
        />
        <KpiCard
          label="Valorización de compra"
          value={compra.valor}
          simbolo={simboloMoneda(compra.moneda)}
          color="teal"
          icono={IconCoins}
          loading={loading}
          pie={notaConversion(compra.convertido)}
        />
        <KpiCard
          label="Valor por tonelada"
          value={valorPorTonelada.valor}
          simbolo={simboloMoneda(valorPorTonelada.moneda)}
          unidad="/t"
          decimales={2}
          color="green"
          icono={IconChartBar}
          loading={loading}
          pie={notaConversion(valorPorTonelada.convertido)}
        />
        <KpiCard
          label="Ley Au promedio"
          value={kpis?.ley_oro_prom ?? 0}
          unidad="g/t"
          decimales={3}
          color="yellow"
          icono={IconRosetteDiscountCheck}
          loading={loading}
          pie={`${formatNumber(kpis?.lotes_aprobados ?? 0)} de ${formatNumber(kpis?.lotes_receptados ?? 0)} lotes con valorización aprobada`}
        />
        <KpiCard
          label="Toneladas despachadas"
          value={kpis?.toneladas_despachadas ?? 0}
          unidad="t"
          color="cyan"
          icono={IconTruck}
          loading={loading}
          pie={`${formatNumber(kpis?.despachos ?? 0)} despachos`}
        />
        <KpiCard
          label="Saldo de anticipos"
          value={anticipos.valor}
          simbolo={simboloMoneda(anticipos.moneda)}
          color="violet"
          icono={IconPackage}
          loading={loading}
          pie={notaConversion(anticipos.convertido)}
        />
        <KpiCard
          label="Deuda con proveedores"
          value={deuda.valor}
          simbolo={simboloMoneda(deuda.moneda)}
          color="orange"
          icono={IconAlertTriangle}
          loading={loading}
          pie={`${formatNumber(data?.financiero?.comprobantes_emitidos ?? 0)} comprobantes`}
        />
        <KpiCard
          label="Valorización de venta"
          value={venta.valor}
          simbolo={simboloMoneda(venta.moneda)}
          color="teal"
          icono={IconCoins}
          loading={loading}
          pie={notaConversion(venta.convertido)}
        />
        <KpiCard
          label="Unidades en planta"
          value={data?.operativo?.unidades_en_planta ?? 0}
          color="green"
          icono={IconTruck}
          loading={loading}
          pie={`${formatNumber(data?.operativo?.visitas_abiertas ?? 0)} visitas abiertas`}
        />
        <KpiCard
          label="Lotes sin validar"
          value={data?.operativo?.lotes_sin_validar ?? 0}
          color="yellow"
          icono={IconUsers}
          loading={loading}
          pie={`${formatNumber(data?.operativo?.valorizaciones_pendientes ?? 0)} valorizaciones por aprobar`}
        />
      </div>

      {/* Series: producción y valorización */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          titulo="Toneladas receptadas por día"
          descripcion="Peso neto mineral pesado en planta"
          loading={loading}
          alto={250}
        >
          {serieToneladas.length ? (
            <AreaChart
              h={250}
              data={serieToneladas}
              dataKey="fecha"
              series={[
                { name: "toneladas", label: "Toneladas", color: "indigo.6" },
              ]}
              curveType="monotone"
              withGradient
              withDots
              strokeWidth={2}
              gridAxis="y"
              tickLine="none"
              valueFormatter={(v) => `${formatNumber(v, 0)} t`}
            />
          ) : (
            <EmptyState texto="Sin recepción en el período seleccionado" />
          )}
        </ChartPanel>

        <ChartPanel
          titulo="Valorización de compra por día"
          descripcion="Subtotal valorizado del mineral (sin anulados)"
          loading={loading}
          alto={250}
        >
          {serieValorizacion.length ? (
            <BarChart
              h={250}
              data={serieValorizacion}
              dataKey="fecha"
              series={[
                { name: "valor", label: "Valorización", color: "teal.6" },
              ]}
              maxBarWidth={56}
              gridAxis="y"
              tickLine="none"
              valueFormatter={(v) => formatoMoneda(v)}
            />
          ) : (
            <EmptyState texto="Sin valorizaciones en el período seleccionado" />
          )}
        </ChartPanel>
      </div>

      {/* Leyes y composición de la valorización */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartPanel
          titulo="Leyes Au / Ag por día"
          descripcion="Promedio ponderado por peso"
          loading={loading}
          alto={250}
          className="xl:col-span-2"
        >
          {serieLeyes.length ? (
            <LineChart
              h={250}
              data={serieLeyes}
              dataKey="fecha"
              series={[
                { name: "ley_oro", label: "Ley Au", color: "yellow.6" },
                { name: "ley_plata", label: "Ley Ag", color: "violet.6" },
              ]}
              curveType="monotone"
              withDots
              withLegend
              legendProps={{ verticalAlign: "bottom" }}
              gridAxis="y"
              tickLine="none"
              unit=" g/t"
              valueFormatter={(v) => `${formatNumber(v, 3)}`}
            />
          ) : (
            <EmptyState texto="Sin leyes registradas en el período" />
          )}
        </ChartPanel>

        <ChartPanel
          titulo="Valorización por elemento"
          descripcion="Distribución Oro / Plata"
          loading={loading}
          alto={250}
        >
          {porElemento.length ? (
            <DonutChart
              data={porElemento}
              size={190}
              thickness={26}
              withLabels
              labelColor="zinc.4"
              tooltipDataSource="segment"
            />
          ) : (
            <EmptyState texto="Sin valorización por elemento" />
          )}
        </ChartPanel>
      </div>

      {/* Proceso y estado */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartPanel
          titulo="Embudo operacional"
          descripcion="Avance del mineral por etapa del proceso"
          loading={loading}
          alto={250}
        >
          {data?.embudo?.length ? (
            <div className="space-y-3">
              {data.embudo.map((e, i) => (
                <div key={e.etapa}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{e.etapa}</span>
                    <span className="font-mono text-zinc-500">
                      {formatNumber(e.conteo)} · {e.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800/70">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, e.porcentaje))}%`,
                        background: `var(--mantine-color-${COLOR_EMBUDO[i % COLOR_EMBUDO.length]}-6)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState texto="Sin lotes para graficar el embudo" />
          )}
        </ChartPanel>

        <ChartPanel
          titulo="Estado de los lotes"
          descripcion="Tonelaje según situación comercial"
          loading={loading}
          alto={250}
        >
          {porEstadoLote.length ? (
            <DonutChart
              data={porEstadoLote}
              size={190}
              thickness={26}
              withLabels
              labelColor="zinc.4"
              tooltipDataSource="segment"
            />
          ) : (
            <EmptyState texto="Sin lotes en el período" />
          )}
        </ChartPanel>

        <ChartPanel
          titulo="Estado de las valorizaciones"
          descripcion="Cantidad de propuestas y aprobaciones"
          loading={loading}
          alto={250}
        >
          {estadoValorizaciones.length ? (
            <DonutChart
              data={estadoValorizaciones}
              size={190}
              thickness={26}
              withLabels
              labelColor="zinc.4"
              tooltipDataSource="segment"
            />
          ) : (
            <EmptyState texto="Sin valorizaciones en el período" />
          )}
        </ChartPanel>
      </div>

      {/* Comercial y calidad */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          titulo="Top proveedores por valorización"
          descripcion="Top 8 del período"
          loading={loading}
          alto={260}
        >
          {topProveedores.length ? (
            <BarChart
              h={260}
              orientation="vertical"
              data={topProveedores}
              dataKey="proveedor"
              series={[
                { name: "valor", label: "Valorización", color: "indigo.6" },
              ]}
              maxBarWidth={28}
              gridAxis="x"
              tickLine="none"
              valueFormatter={(v) => formatoMoneda(v)}
            />
          ) : (
            <EmptyState texto="Sin valorizaciones por proveedor" />
          )}
        </ChartPanel>

        <ChartPanel
          titulo="Merma vs peso declarado en guía"
          descripcion="Diferencia porcentual por lote"
          loading={loading}
          alto={260}
        >
          {merma.length ? (
            <BarChart
              h={260}
              data={merma}
              dataKey="correlativo"
              series={[{ name: "merma_pct", label: "Merma %", color: "orange.6" }]}
              maxBarWidth={48}
              gridAxis="y"
              tickLine="none"
              valueFormatter={(v) => `${formatNumber(v, 2)} %`}
            />
          ) : (
            <EmptyState texto="Sin guías con peso declarado en el período" />
          )}
        </ChartPanel>
      </div>

      {/* Calidad y tiempos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel
          titulo="No conformidad en guías"
          descripcion="Guías marcadas con no conformidad"
          loading={loading}
          alto={130}
        >
          <div className="flex h-full items-center gap-4">
            <div className="flex h-full min-h-[110px] w-full flex-col justify-center">
              <Text size="xs" className="uppercase tracking-wider text-zinc-500">
                Guías con no conformidad
              </Text>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {formatNumber(data?.no_conformidad?.guias_no_conformidad ?? 0)}
                </span>
                <span className="text-sm text-zinc-500">
                  / {formatNumber(data?.no_conformidad?.guias_total ?? 0)} guías
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800/70">
                <div
                  className="h-full rounded-full bg-red-600 transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, data?.no_conformidad?.porcentaje ?? 0))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel
          titulo="Tiempo de permanencia"
          descripcion="Promedio en horas por etapa"
          loading={loading}
          alto={130}
        >
          <div className="grid h-full grid-cols-2 gap-4">
            <div className="flex flex-col justify-center">
              <Group gap={6} mb={2}>
                <IconClockHour4 size={14} className="text-zinc-500" />
                <Text size="xs" className="uppercase tracking-wider text-zinc-500">
                  Ingreso → Pesaje
                </Text>
              </Group>
              <span className="text-2xl font-bold text-white">
                {data?.tiempos?.ingreso_a_pesaje_h !== null &&
                data?.tiempos?.ingreso_a_pesaje_h !== undefined
                  ? formatNumber(data.tiempos.ingreso_a_pesaje_h, 1)
                  : "—"}
                <span className="ml-1 text-sm font-medium text-zinc-500">h</span>
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <Group gap={6} mb={2}>
                <IconDroplet size={14} className="text-zinc-500" />
                <Text size="xs" className="uppercase tracking-wider text-zinc-500">
                  Pesaje → Análisis
                </Text>
              </Group>
              <span className="text-2xl font-bold text-white">
                {data?.tiempos?.pesaje_a_analisis_h !== null &&
                data?.tiempos?.pesaje_a_analisis_h !== undefined
                  ? formatNumber(data.tiempos.pesaje_a_analisis_h, 1)
                  : "—"}
                <span className="ml-1 text-sm font-medium text-zinc-500">h</span>
              </span>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel
          titulo="Operación en planta"
          descripcion="Estado actual de la operación"
          loading={loading}
          alto={130}
          rightSection={
            <Badge variant="light" color="indigo" size="xs">
              en vivo
            </Badge>
          }
        >
          <div className="grid h-full grid-cols-2 gap-x-4 gap-y-3">
            {[
              {
                label: "Unidades en planta",
                value: data?.operativo?.unidades_en_planta ?? 0,
              },
              {
                label: "Visitas abiertas",
                value: data?.operativo?.visitas_abiertas ?? 0,
              },
              {
                label: "Guías activas",
                value: data?.operativo?.guias_activas ?? 0,
              },
              {
                label: "Valorizaciones por aprobar",
                value: data?.operativo?.valorizaciones_pendientes ?? 0,
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col justify-center">
                <Text size="xs" className="truncate text-zinc-500">
                  {item.label}
                </Text>
                <span className="text-xl font-bold text-white">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>

      {data?.meta && (
        <footer className="pt-1 text-center text-xs text-zinc-600">
          Período {data.meta.fecha_inicio} → {data.meta.fecha_fin} ·{" "}
          {data.meta.id_sucursal
            ? `Sucursal #${data.meta.id_sucursal}`
            : "Todas las sucursales"}
          {tipoCambio && (
            <>
              {" "}
              · TC {tipoCambio.fecha}: compra {tipoCambio.valor_compra} / venta{" "}
              {tipoCambio.valor_venta}
            </>
          )}
        </footer>
      )}
    </div>
  );
};
