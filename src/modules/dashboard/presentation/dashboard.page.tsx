import { useMemo, useState } from "react";
import { Loader, SegmentedControl, Select } from "@mantine/core";

import { useDashboard } from "../hooks/useDashboard";
import { DashCard } from "./components/dash-card";
import { DeltaPill } from "./components/delta-pill";
import { DaysGauge } from "./components/days-gauge";
import { CostRangeChart } from "./components/cost-range-chart";
import { HeroCompareChart } from "./components/hero-compare-chart";
import { KpiDeltaCard } from "./components/kpi-delta-card";
import { LeyBars } from "./components/ley-bars";
import { Numero, NumeroUnidad } from "./components/numero";
import { SinComprobante } from "./components/sin-comprobante";
import { SplitBar } from "./components/split-bar";
import { StockColumn } from "./components/stock-column";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import {
  COLOR_AMBER,
  COLOR_BLENDING,
  COLOR_COMPRA,
  COLOR_ROJO,
  COLOR_VENTA,
} from "./utils/colores";
import { etiquetaMes, fmt, usd, variacion } from "./utils/format";

type ModoHero = "tn" | "usd";
type ElementoCosto = "Au+Ag" | "Au" | "Ag";
type OrigenLey = "final" | "cliente";
type BaseStock = "TMH" | "TMS";
type SalidaDias = "all" | "b" | "d";
type FlujoSinComprobante = "all" | "C" | "V";

/** Estilo del selector tipo píldora (`.pill-sel` de `dash.html`). */
const selectClasses = {
  input:
    "h-8 rounded-full border-zinc-700 bg-zinc-900/60 pl-3 pr-8 text-[13px] font-semibold text-zinc-100",
  dropdown: "bg-zinc-900 border-zinc-700",
  option: "text-[13px] text-zinc-200",
};

/** Variante compacta para los filtros secundarios de cada tarjeta. */
const selectClassesSm = {
  input:
    "h-8 rounded-full border-zinc-700 bg-zinc-900/60 pl-3 pr-7 text-[12px] font-semibold text-zinc-300",
  dropdown: "bg-zinc-900 border-zinc-700",
  option: "text-[12px] text-zinc-200",
};

export const DashboardPage = () => {
  useTitlePage("Resumen");

  const {
    data,
    loading,
    load,
    meses,
    indice,
    setMesIndex,
    mes,
    mesActual,
    mesAnterior,
    mismoMesAnioAnterior,
  } = useDashboard();

  // --- Controles locales de la vista -----------------------------------
  const [modoHero, setModoHero] = useState<ModoHero>("tn");
  const [elementoCosto, setElementoCosto] = useState<ElementoCosto>("Au+Ag");
  const [origenLey, setOrigenLey] = useState<OrigenLey>("final");
  const [baseStock, setBaseStock] = useState<BaseStock>("TMH");
  const [salidaDias, setSalidaDias] = useState<SalidaDias>("all");
  const [flujoSinComprobante, setFlujoSinComprobante] =
    useState<FlujoSinComprobante>("all");

  // --- Series del gráfico principal -------------------------------------
  const esToneladas = modoHero === "tn";

  const serieCompras = useMemo(
    () =>
      meses.map((m) =>
        esToneladas ? m.tn_compradas : m.monto_compra_usd,
      ),
    [meses, esToneladas],
  );
  const serieVentas = useMemo(
    () => meses.map((m) => (esToneladas ? m.tn_vendidas : m.monto_venta_usd)),
    [meses, esToneladas],
  );
  const etiquetasEje = useMemo(
    () => meses.map((m) => etiquetaMes(m.anio, m.mes)),
    [meses],
  );

  const tnReceptadas = mes?.tn_receptadas ?? 0;
  const tnDespachadas = mes?.tn_despachadas ?? 0;
  const montoCompra = mes?.monto_compra_usd ?? 0;
  const montoVenta = mes?.monto_venta_usd ?? 0;

  // --- Costo promedio por tonelada --------------------------------------
  const costoCompra =
    elementoCosto === "Au+Ag"
      ? (mes?.costo_compra_usd_t ?? 0)
      : elementoCosto === "Au"
        ? (mes?.costos.compra.Oro ?? 0)
        : (mes?.costos.compra.Plata ?? 0);
  const costoVenta =
    elementoCosto === "Au+Ag"
      ? (mes?.costo_venta_usd_t ?? 0)
      : elementoCosto === "Au"
        ? (mes?.costos.venta.Oro ?? 0)
        : (mes?.costos.venta.Plata ?? 0);

  // --- Leyes promedio ----------------------------------------------------
  const leyesVenta =
    origenLey === "final" ? mes?.leyes.venta_final : mes?.leyes.venta_cliente;

  // --- Stock en cancha ---------------------------------------------------
  const stock = data?.cancha.stock;
  const claveStock = baseStock === "TMH" ? "tmh" : "tms";
  const tnLotes = stock?.lotes[claveStock] ?? 0;
  const tnBlendings = stock?.blendings[claveStock] ?? 0;
  const tnPorSalir = stock?.por_salir[claveStock] ?? 0;

  // --- Días en cancha -----------------------------------------------------
  const dias = data?.cancha.dias;
  const diasPromedio =
    salidaDias === "all"
      ? (dias?.todo ?? 0)
      : salidaDias === "b"
        ? (dias?.blending ?? 0)
        : (dias?.directo ?? 0);

  // --- Cuentas por pagar / cobrar ----------------------------------------
  const porPagar = data?.financiero.por_pagar;
  const porCobrar = data?.financiero.por_cobrar;

  // --- Valorizaciones sin comprobante ------------------------------------
  const sinComprobante = data?.sin_comprobante;
  const detalleSinComprobante = useMemo(() => {
    const lista = sinComprobante?.detalle ?? [];
    if (flujoSinComprobante === "all") return lista;
    return lista.filter((d) => d.tipo === flujoSinComprobante);
  }, [sinComprobante, flujoSinComprobante]);

  return (
    <div className="mx-auto w-full max-w-340 space-y-4 px-4">
      {/* Encabezado */}
      <header className="flex flex-wrap items-end justify-between gap-3">
  
        <div className="flex items-center gap-2">
          <Select
            aria-label="Período"
            placeholder={loading ? "Cargando..." : "Seleccione"}
            data={meses.map((m, i) => {
              const clave = `${m.anio}-${String(m.mes).padStart(2, "0")}`;
              const enCurso = clave === mesActual;
              return {
                value: String(i),
                label: enCurso
                  ? `${etiquetaMes(m.anio, m.mes)} (en curso)`
                  : etiquetaMes(m.anio, m.mes),
              };
            })}
            value={String(indice)}
            onChange={(v) => {
              if (v !== null) setMesIndex(Number(v));
            }}
            disabled={loading}
            rightSection={loading ? <Loader size={16} /> : undefined}
            comboboxProps={{ withinPortal: true }}
            size="xs"
            radius="lg"
            classNames={selectClasses}
            w={175}
          />
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </header>

      {/* Grilla de tarjetas */}
      <div className="grid grid-cols-12 gap-3.5">
        {/* Fila 1 — resultados del mes */}
        <KpiDeltaCard
          className="col-span-12 md:col-span-6 xl:col-span-3"
          titulo="TN recepcionadas"
          dot={COLOR_COMPRA}
          valor={tnReceptadas}
          unidad="t"
          loading={loading}
          deltas={[
            {
              pct: variacion(
                tnReceptadas,
                mesAnterior?.tn_receptadas ?? 0,
              ),
              etiqueta: "vs mes ant.",
            },
            {
              pct: variacion(
                tnReceptadas,
                mismoMesAnioAnterior?.tn_receptadas ?? 0,
              ),
              etiqueta: "vs año ant.",
            },
          ]}
        />

        <KpiDeltaCard
          className="col-span-12 md:col-span-6 xl:col-span-3"
          titulo="TN despachadas"
          dot={COLOR_VENTA}
          valor={tnDespachadas}
          unidad="t"
          loading={loading}
          deltas={[
            {
              pct: variacion(
                tnDespachadas,
                mesAnterior?.tn_despachadas ?? 0,
              ),
              etiqueta: "vs mes ant.",
            },
            {
              pct: variacion(
                tnDespachadas,
                mismoMesAnioAnterior?.tn_despachadas ?? 0,
              ),
              etiqueta: "vs año ant.",
            },
          ]}
        />

        <KpiDeltaCard
          className="col-span-12 md:col-span-6 xl:col-span-3"
          titulo="Invertido en compras"
          dot={COLOR_COMPRA}
          valor={montoCompra}
          formato={usd}
          loading={loading}
          deltas={[
            {
              pct: variacion(montoCompra, mesAnterior?.monto_compra_usd ?? 0),
              etiqueta: "vs mes ant.",
            },
          ]}
        />

        <KpiDeltaCard
          className="col-span-12 md:col-span-6 xl:col-span-3"
          titulo="Recaudado en ventas"
          dot={COLOR_VENTA}
          valor={montoVenta}
          formato={usd}
          loading={loading}
          deltas={[
            {
              pct: variacion(montoVenta, mesAnterior?.monto_venta_usd ?? 0),
              etiqueta: "vs mes ant.",
            },
          ]}
          extra={
            <DeltaPill variante="neutral">
              margen{" "}
              {fmt(
                montoVenta > 0
                  ? ((montoVenta - montoCompra) / montoVenta) * 100
                  : 0,
                1,
              )}
              %
            </DeltaPill>
          }
        />

        {/* Fila 2 — comparativo y stock en cancha */}
        <DashCard
          className="col-span-12 xl:col-span-8"
          titulo="Compras vs ventas"
          rightSection={
            <SegmentedControl
              size="xs"
              radius="lg"
              value={modoHero}
              onChange={(v) => setModoHero(v as ModoHero)}
              data={[
                { label: "Toneladas", value: "tn" },
                { label: "Dólares", value: "usd" },
              ]}
              classNames={{
                root: "rounded-full border border-zinc-700 bg-zinc-800/70",
                label:
                  "px-3 text-[12.5px] font-semibold text-zinc-300 data-[active]:bg-zinc-700 data-[active]:text-zinc-50",
              }}
            />
          }
        >
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            <div>
              <Numero color={COLOR_COMPRA}>
                {esToneladas ? fmt(mes?.tn_compradas ?? 0) : usd(montoCompra)}
                {esToneladas && <NumeroUnidad>t</NumeroUnidad>}
              </Numero>
              <div className="text-[13px] text-zinc-400">Comprado</div>
            </div>
            <div>
              <Numero color={COLOR_VENTA}>
                {esToneladas ? fmt(mes?.tn_vendidas ?? 0) : usd(montoVenta)}
                {esToneladas && <NumeroUnidad>t</NumeroUnidad>}
              </Numero>
              <div className="text-[13px] text-zinc-400">Vendido</div>
            </div>
            <div>
              {esToneladas ? (
                <DeltaPill variante="up">
                  {fmt(
                    (mes?.tn_compradas ?? 0) > 0
                      ? ((mes?.tn_vendidas ?? 0) / (mes?.tn_compradas ?? 1)) * 100
                      : 0,
                    1,
                  )}{" "}
                  % rotación
                </DeltaPill>
              ) : (
                <DeltaPill variante="up">
                  +{usd(montoVenta - montoCompra)} margen
                </DeltaPill>
              )}
            </div>
          </div>

          <HeroCompareChart
            a={serieCompras}
            b={serieVentas}
            selected={indice}
            labels={etiquetasEje}
            format={esToneladas ? (v: number) => fmt(v) : usd}
          />
        </DashCard>

        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Stock en cancha"
          dot={COLOR_BLENDING}
          rightSection={
            <Select
              aria-label="Base"
              data={[
                { value: "TMH", label: "TMH" },
                { value: "TMS", label: "TMS" },
              ]}
              value={baseStock}
              onChange={(v) => {
                if (v !== null) setBaseStock(v as BaseStock);
              }}
              comboboxProps={{ withinPortal: true }}
              size="xs"
              radius="lg"
              classNames={selectClassesSm}
              w={90}
            />
          }
        >
          <Numero>
            {fmt(tnLotes + tnBlendings + tnPorSalir, 1)}
            <NumeroUnidad>t</NumeroUnidad>
          </Numero>
          <div className="flex flex-1 items-center">
            <StockColumn
              parts={[
                { nombre: "Lotes", valor: tnLotes, color: COLOR_COMPRA },
                {
                  nombre: "Blendings",
                  valor: tnBlendings,
                  color: COLOR_BLENDING,
                },
                {
                  nombre: "Por salir",
                  valor: tnPorSalir,
                  color: COLOR_AMBER,
                },
              ]}
              format={(v) => `${fmt(v, 1)} t`}
            />
          </div>
        </DashCard>

        {/* Fila 3 — cuentas y costo por tonelada */}
        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Por pagar"
          dot={COLOR_COMPRA}
        >
          <Numero>{usd(porPagar?.total_usd ?? 0)}</Numero>
          <SplitBar
            parts={[
              {
                nombre: "Neto",
                valor: porPagar?.neto_usd ?? 0,
                color: COLOR_COMPRA,
              },
              {
                nombre: "Detracción",
                valor: porPagar?.detraccion_usd ?? 0,
                color: COLOR_AMBER,
              },
            ]}
            format={usd}
          />
          <div className="text-[13px] text-zinc-400">
            Mayor deuda:{" "}
            <b className="font-semibold text-zinc-100">
              {porPagar?.mayor_deudor?.nombre ?? "—"}
              {porPagar?.mayor_deudor
                ? ` · ${usd(porPagar.mayor_deudor.monto_usd)}`
                : ""}
            </b>
          </div>
        </DashCard>

        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Por cobrar"
          dot={COLOR_VENTA}
        >
          <Numero>{usd(porCobrar?.total_usd ?? 0)}</Numero>
          <SplitBar
            parts={[
              {
                nombre: "Neto",
                valor: porCobrar?.neto_usd ?? 0,
                color: COLOR_VENTA,
              },
              {
                nombre: "Detracción",
                valor: porCobrar?.detraccion_usd ?? 0,
                color: COLOR_AMBER,
              },
            ]}
            format={usd}
          />
          <div className="text-[13px] text-zinc-400">
            Mayor saldo:{" "}
            <b className="font-semibold text-zinc-100">
              {porCobrar?.mayor_acreedor?.nombre ?? "—"}
              {porCobrar?.mayor_acreedor
                ? ` · ${usd(porCobrar.mayor_acreedor.monto_usd)}`
                : ""}
            </b>
          </div>
        </DashCard>

        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Costo promedio por tonelada"
          rightSection={
            <Select
              aria-label="Elemento"
              data={[
                { value: "Au+Ag", label: "Au + Ag" },
                { value: "Au", label: "Solo Au" },
                { value: "Ag", label: "Solo Ag" },
              ]}
              value={elementoCosto}
              onChange={(v) => {
                if (v !== null) setElementoCosto(v as ElementoCosto);
              }}
              comboboxProps={{ withinPortal: true }}
              size="xs"
              radius="lg"
              classNames={selectClassesSm}
              w={110}
            />
          }
        >
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            <CostRangeChart
              compra={costoCompra}
              venta={costoVenta}
              format={(v) => usd(v)}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <DeltaPill variante="up">
                +{usd(costoVenta - costoCompra)} por tonelada
              </DeltaPill>
              <DeltaPill variante="up">
                +{fmt(variacion(costoVenta, costoCompra), 1)}%
              </DeltaPill>
            </div>
          </div>
        </DashCard>

        {/* Fila 4 — calidad, permanencia y pendientes */}
        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Ley promedio (g/t)"
          rightSection={
            <Select
              aria-label="Ley de venta"
              data={[
                { value: "final", label: "Ley final" },
                { value: "cliente", label: "Ley cliente" },
              ]}
              value={origenLey}
              onChange={(v) => {
                if (v !== null) setOrigenLey(v as OrigenLey);
              }}
              comboboxProps={{ withinPortal: true }}
              size="xs"
              radius="lg"
              classNames={selectClassesSm}
              w={120}
            />
          }
        >
          <div className="flex flex-1 items-center">
            <div className="w-full">
              <LeyBars
                items={[
                  {
                    nombre: "Oro (Au)",
                    compra: mes?.leyes.compra.Oro ?? 0,
                    venta: leyesVenta?.Oro ?? 0,
                  },
                  {
                    nombre: "Plata (Ag)",
                    compra: mes?.leyes.compra.Plata ?? 0,
                    venta: leyesVenta?.Plata ?? 0,
                  },
                ]}
              />
            </div>
          </div>
        </DashCard>

        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Días promedio en cancha"
          dot={COLOR_BLENDING}
          rightSection={
            <Select
              aria-label="Salida"
              data={[
                { value: "all", label: "Todo" },
                { value: "b", label: "Blending" },
                { value: "d", label: "Despacho directo" },
              ]}
              value={salidaDias}
              onChange={(v) => {
                if (v !== null) setSalidaDias(v as SalidaDias);
              }}
              comboboxProps={{ withinPortal: true }}
              size="xs"
              radius="lg"
              classNames={selectClassesSm}
              w={140}
            />
          }
        >
          <div className="flex flex-1 items-center">
            <DaysGauge valor={diasPromedio} max={12} meta={6} />
          </div>
        </DashCard>

        <DashCard
          className="col-span-12 xl:col-span-4"
          titulo="Valorizaciones sin comprobante"
          dot={COLOR_ROJO}
          rightSection={
            <Select
              aria-label="Flujo"
              data={[
                { value: "all", label: "Todas" },
                { value: "C", label: "Compras" },
                { value: "V", label: "Ventas" },
              ]}
              value={flujoSinComprobante}
              onChange={(v) => {
                if (v !== null)
                  setFlujoSinComprobante(v as FlujoSinComprobante);
              }}
              comboboxProps={{ withinPortal: true }}
              size="xs"
              radius="lg"
              classNames={selectClassesSm}
              w={110}
            />
          }
        >
          <SinComprobante
            compras={sinComprobante?.compras ?? { conteo: 0, monto_usd: 0 }}
            ventas={sinComprobante?.ventas ?? { conteo: 0, monto_usd: 0 }}
            detalle={detalleSinComprobante}
          />
        </DashCard>
      </div>
    </div>
  );
};
