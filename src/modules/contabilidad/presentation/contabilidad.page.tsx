import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  SegmentedControl,
  Box,
} from "@mantine/core";
import { IconPlus, IconX, IconReceipt } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { AuxService } from "../../../service/auxiliar.service";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { EstadoComprobanteCompra } from "../../../shared/enums/contabilidad-compra/estado-comprobante-compra";
import { EstadoComprobanteVenta } from "../../../shared/enums/contabilidad-venta/estado-comprobante-venta";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { IArchivo } from "../../../shared/interfaces/archivo";

// Hooks & Services - Compra
import { useComprobantesCompra } from "../hooks/useComprobantesCompra";
import { usePagosComprobante } from "../hooks/usePagosComprobante";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type { RES_ComprobanteCompra } from "../service/contabilidad-compra.responses";

// Hooks & Services - Venta
import { useComprobantesVenta } from "../hooks/useComprobantesVenta";
import { usePagosComprobanteVenta } from "../hooks/usePagosComprobanteVenta";
import { ContabilidadVentaService } from "../service/contabilidad-venta.service";
import type { RES_ComprobanteVenta } from "../service/contabilidad-venta.responses";

// Componentes Reutilizados (Compartidos para Compra y Venta)
import { ComprobanteCard } from "./components/comprobante-card";
import { ModalHistorialPagos } from "./components/modal-historial-pagos";
import { ModalRegistroPago } from "./components/modal-registro-pago";
import { ModalAnularComprobante } from "./components/modal-anular-comprobante";
import { ModalRegistroComprobante } from "./components/modal-registro-comprobante";

// Único componente nuevo exclusivo para Contabilidad Venta
import { ModalRegistroComprobanteVenta } from "./components/modal-registro-comprobante-venta";

// Shared Utils
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { RefreshButton } from "../../../presentation/utils/refresh-button";

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

const ESTADOS_FILTRO_COMPRA = [
  "Todos",
  EstadoComprobanteCompra.EnEspera,
  EstadoComprobanteCompra.EnProceso,
  EstadoComprobanteCompra.Pagado,
  EstadoComprobanteCompra.Anulado,
];

const ESTADOS_FILTRO_VENTA = [
  "Todos",
  EstadoComprobanteVenta.EnEspera,
  EstadoComprobanteVenta.EnProceso,
  EstadoComprobanteVenta.Pagado,
  EstadoComprobanteVenta.Anulado,
];

export default function ContabilidadPage() {
  // Estado local para alternar entre Compra y Venta (sin alterar enrutación)
  const [tipoContabilidad, setTipoContabilidad] = useState<"compra" | "venta">("compra");

  useTitlePage(
    tipoContabilidad === "compra" ? "Contabilidad Compra" : "Contabilidad Venta",
    true,
  );

  const handleCambioTipo = (valor: string) => {
    setTipoContabilidad(valor as "compra" | "venta");
  };

  // --- SECCIÓN: CONTABILIDAD COMPRA ---
  const {
    idProveedorFiltro,
    setIdProveedorFiltro,
    estadoFiltro: estadoFiltroCompra,
    setEstadoFiltro: setEstadoFiltroCompra,
    fechaInicio: fechaInicioCompra,
    setFechaInicio: setFechaInicioCompra,
    fechaFin: fechaFinCompra,
    setFechaFin: setFechaFinCompra,
    loading: loadingCompra,
    comprobantes: comprobantesCompra,
    anulandoId: anulandoIdCompra,
    aprobandoId,
    submitting: submittingCompra,
    cargarComprobantes: cargarComprobantesCompra,
    crearComprobante: crearComprobanteCompra,
    aprobarComprobante,
    anularComprobante: anularComprobanteCompra,
  } = useComprobantesCompra();

  const { anularPago: anularPagoCompra } = usePagosComprobante();

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);
  const [modalRegistroCompraOpened, setModalRegistroCompraOpened] = useState(false);

  // --- SECCIÓN: CONTABILIDAD VENTA ---
  const {
    idPlantaFiltro,
    setIdPlantaFiltro,
    estadoFiltro: estadoFiltroVenta,
    setEstadoFiltro: setEstadoFiltroVenta,
    fechaInicio: fechaInicioVenta,
    setFechaInicio: setFechaInicioVenta,
    fechaFin: fechaFinVenta,
    setFechaFin: setFechaFinVenta,
    loading: loadingVenta,
    comprobantes: comprobantesVenta,
    anulandoId: anulandoIdVenta,
    submitting: submittingVenta,
    cargarComprobantes: cargarComprobantesVenta,
    crearComprobante: crearComprobanteVenta,
    anularComprobante: anularComprobanteVenta,
  } = useComprobantesVenta();

  const { anularPago: anularPagoVenta } = usePagosComprobanteVenta();

  const [plantas, setPlantas] = useState<Array<{ id: number; ruc: string; razon_social: string }>>([]);
  const [loadingPlantas, setLoadingPlantas] = useState(true);
  const [modalRegistroVentaOpened, setModalRegistroVentaOpened] = useState(false);

  // Estados de Modales Reutilizados
  const [comprobanteHistorial, setComprobanteHistorial] =
    useState<RES_ComprobanteCompra | RES_ComprobanteVenta | null>(null);
  const [comprobantePago, setComprobantePago] =
    useState<RES_ComprobanteCompra | RES_ComprobanteVenta | null>(null);
  const [submittingPago, setSubmittingPago] = useState(false);
  const [comprobanteAAnular, setComprobanteAAnular] =
    useState<RES_ComprobanteCompra | RES_ComprobanteVenta | null>(null);

  // Modal Evidencias
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);

  // Cargar Catálogos Auxiliares
  useEffect(() => {
    let cancelled = false;
    AuxService.get_proveedores({ estado: EstadoBase.Activo })
      .then((res) => {
        if (!cancelled && res.success && res.data) setProveedores(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingProveedores(false);
      });

    AuxService.get_plantas_despachable()
      .then((res) => {
        if (!cancelled && Array.isArray(res)) setPlantas(res);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingPlantas(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- HANDLERS UNIFICADOS ---
  const handleAprobarCompraInline = async (id: number, tipo: TipoAprobacionComprobante) => {
    await aprobarComprobante(id, { tipo });
  };

  const handleConfirmarAnular = async (motivo: string) => {
    if (!comprobanteAAnular) return;
    const isVenta = "id_planta_destino" in comprobanteAAnular;
    if (isVenta) {
      const ok = await anularComprobanteVenta(comprobanteAAnular.id, { motivo });
      if (ok) setComprobanteAAnular(null);
    } else {
      const ok = await anularComprobanteCompra(comprobanteAAnular.id, { motivo });
      if (ok) setComprobanteAAnular(null);
    }
  };

  const handleAnularPago = async (idPago: number, motivo: string, evidenciasAnulacion?: File[]) => {
    if (!comprobanteHistorial) return;
    const isVenta = "id_planta_destino" in comprobanteHistorial;
    if (isVenta) {
      await anularPagoVenta(idPago, comprobanteHistorial.id, { motivo, evidencias_anulacion: evidenciasAnulacion });
      await cargarComprobantesVenta(false);
      const res = await ContabilidadVentaService.obtenerComprobante(comprobanteHistorial.id);
      if (res.success && res.data) setComprobanteHistorial(res.data);
    } else {
      await anularPagoCompra(idPago, comprobanteHistorial.id, { motivo, evidencias_anulacion: evidenciasAnulacion });
      await cargarComprobantesCompra(false);
      const res = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
      if (res.success && res.data) setComprobanteHistorial(res.data);
    }
  };

  const handleRegistrarPago = async (payload: unknown) => {
    if (!comprobantePago) return null;
    const isVenta = "id_planta_destino" in comprobantePago;
    setSubmittingPago(true);
    try {
      if (isVenta) {
        const res = await ContabilidadVentaService.registrarPago(
          comprobantePago.id,
          payload as Parameters<typeof ContabilidadVentaService.registrarPago>[1],
        );
        if (!res.success) return null;

        const actualizado = await ContabilidadVentaService.obtenerComprobante(comprobantePago.id);
        await cargarComprobantesVenta(false);
        if (comprobanteHistorial) {
          const r2 = await ContabilidadVentaService.obtenerComprobante(comprobanteHistorial.id);
          if (r2.success && r2.data) setComprobanteHistorial(r2.data);
        }
        if (actualizado.success && actualizado.data) {
          setComprobantePago(actualizado.data);
          return actualizado.data;
        }
      } else {
        const res = await ContabilidadCompraService.registrarPago(
          comprobantePago.id,
          payload as Parameters<typeof ContabilidadCompraService.registrarPago>[1],
        );
        if (!res.success) return null;

        const actualizado = await ContabilidadCompraService.obtenerComprobante(comprobantePago.id);
        await cargarComprobantesCompra(false);
        if (comprobanteHistorial) {
          const r2 = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
          if (r2.success && r2.data) setComprobanteHistorial(r2.data);
        }
        if (actualizado.success && actualizado.data) {
          setComprobantePago(actualizado.data);
          return actualizado.data;
        }
      }
      return null;
    } finally {
      setSubmittingPago(false);
    }
  };

  const handleAbrirRegistroPago = async () => {
    if (!comprobanteHistorial) return;
    const isVenta = "id_planta_destino" in comprobanteHistorial;
    if (isVenta) {
      const res = await ContabilidadVentaService.obtenerComprobante(comprobanteHistorial.id);
      if (res.success && res.data) {
        setComprobanteHistorial(res.data);
        setComprobantePago(res.data);
      }
    } else {
      const res = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
      if (res.success && res.data) {
        setComprobanteHistorial(res.data);
        setComprobantePago(res.data);
      }
    }
  };

  const handleVerHistorial = async (id: number, isVenta: boolean) => {
    if (isVenta) {
      const res = await ContabilidadVentaService.obtenerComprobante(id);
      if (res.success && res.data) setComprobanteHistorial(res.data);
    } else {
      const res = await ContabilidadCompraService.obtenerComprobante(id);
      if (res.success && res.data) setComprobanteHistorial(res.data);
    }
  };

  // --- FILTROS ACTIVOS & LIMPIEZA ---
  const hasActiveFiltersCompra = useMemo(() => {
    return (
      idProveedorFiltro !== null ||
      estadoFiltroCompra !== "Todos" ||
      fechaInicioCompra !== defaultFechaInicio() ||
      fechaFinCompra !== defaultFechaFin()
    );
  }, [idProveedorFiltro, estadoFiltroCompra, fechaInicioCompra, fechaFinCompra]);

  const clearFiltersCompra = () => {
    setIdProveedorFiltro(null);
    setEstadoFiltroCompra("Todos");
    setFechaInicioCompra(defaultFechaInicio());
    setFechaFinCompra(defaultFechaFin());
  };

  const hasActiveFiltersVenta = useMemo(() => {
    return (
      idPlantaFiltro !== null ||
      estadoFiltroVenta !== "Todos" ||
      fechaInicioVenta !== defaultFechaInicio() ||
      fechaFinVenta !== defaultFechaFin()
    );
  }, [idPlantaFiltro, estadoFiltroVenta, fechaInicioVenta, fechaFinVenta]);

  const clearFiltersVenta = () => {
    setIdPlantaFiltro(null);
    setEstadoFiltroVenta("Todos");
    setFechaInicioVenta(defaultFechaInicio());
    setFechaFinVenta(defaultFechaFin());
  };

  return (
    <Stack gap="md" className="animate-fadeIn">
      {/* Barra de Filtros y Acciones */}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          {/* Switch Compra / Venta posicionado antes de Fecha Inicio */}
          <Box>
            <Text size="xs" fw={500} className="text-zinc-400 mb-1 ml-1">
              Módulo Contable
            </Text>
            <SegmentedControl
              value={tipoContabilidad}
              onChange={handleCambioTipo}
              data={[
                { label: "Compra", value: "compra" },
                { label: "Venta", value: "venta" },
              ]}
              size="xs"
              radius="lg"
              color="indigo"
              classNames={{
                root: "bg-zinc-900/60 border border-zinc-800 p-0.5 h-9.5 flex items-center",
                label: "font-semibold text-xs py-1 px-3",
              }}
            />
          </Box>

          {/* Rango de Fechas según módulo activo */}
          {tipoContabilidad === "compra" ? (
            <DateRangeFilter
              fechaInicio={fechaInicioCompra}
              fechaFin={fechaFinCompra}
              onFechaInicioChange={setFechaInicioCompra}
              onFechaFinChange={setFechaFinCompra}
            />
          ) : (
            <DateRangeFilter
              fechaInicio={fechaInicioVenta}
              fechaFin={fechaFinVenta}
              onFechaInicioChange={setFechaInicioVenta}
              onFechaFinChange={setFechaFinVenta}
            />
          )}

          {/* Selector de Entidad (Proveedor vs Planta) */}
          {tipoContabilidad === "compra" ? (
            <Select
              label="Proveedor"
              placeholder={loadingProveedores ? "Cargando..." : "Todos los proveedores"}
              data={proveedores.map((p) => ({
                value: String(p.id_proveedor),
                label: p.razon_social,
              }))}
              value={idProveedorFiltro ? String(idProveedorFiltro) : null}
              onChange={(v) => setIdProveedorFiltro(v ? Number(v) : null)}
              disabled={loadingProveedores}
              rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
              clearable
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              w={220}
            />
          ) : (
            <Select
              label="Planta Destino"
              placeholder={loadingPlantas ? "Cargando..." : "Todas las plantas"}
              data={plantas.map((p) => ({
                value: String(p.id),
                label: p.razon_social,
              }))}
              value={idPlantaFiltro ? String(idPlantaFiltro) : null}
              onChange={(v) => setIdPlantaFiltro(v ? Number(v) : null)}
              disabled={loadingPlantas}
              rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
              clearable
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              w={220}
            />
          )}

          {/* Selector de Estado */}
          {tipoContabilidad === "compra" ? (
            <Select
              label="Estado"
              placeholder="Todos"
              data={ESTADOS_FILTRO_COMPRA}
              value={estadoFiltroCompra}
              onChange={(v) => setEstadoFiltroCompra(v || "Todos")}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              w={150}
            />
          ) : (
            <Select
              label="Estado"
              placeholder="Todos"
              data={ESTADOS_FILTRO_VENTA}
              value={estadoFiltroVenta}
              onChange={(v) => setEstadoFiltroVenta(v || "Todos")}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
              w={150}
            />
          )}
        </Group>

        {/* Acciones principales */}
        <Group gap="xs">
          {tipoContabilidad === "compra" ? (
            <>
              {hasActiveFiltersCompra && (
                <Button
                  variant="subtle"
                  color="red"
                  radius="lg"
                  size="sm"
                  leftSection={<IconX size={16} />}
                  onClick={clearFiltersCompra}
                >
                  Limpiar
                </Button>
              )}
              <RefreshButton
                onClick={() => void cargarComprobantesCompra(false)}
                loading={loadingCompra}
                label="Recargar comprobantes"
              />
              <Button
                color="indigo"
                radius="lg"
                size="sm"
                leftSection={<IconPlus size={18} />}
                onClick={() => setModalRegistroCompraOpened(true)}
              >
                Nuevo Comprobante
              </Button>
            </>
          ) : (
            <>
              {hasActiveFiltersVenta && (
                <Button
                  variant="subtle"
                  color="red"
                  radius="lg"
                  size="sm"
                  leftSection={<IconX size={16} />}
                  onClick={clearFiltersVenta}
                >
                  Limpiar
                </Button>
              )}
              <RefreshButton
                onClick={() => void cargarComprobantesVenta(false)}
                loading={loadingVenta}
                label="Recargar comprobantes de venta"
              />
              <Button
                color="indigo"
                radius="lg"
                size="sm"
                leftSection={<IconPlus size={18} />}
                onClick={() => setModalRegistroVentaOpened(true)}
              >
                Nuevo Comprobante
              </Button>
            </>
          )}
        </Group>
      </Group>

      {/* Grid de Contenido Principal Reutilizando ComprobanteCard */}
      {tipoContabilidad === "compra" ? (
        loadingCompra ? (
          <Group justify="center" py="xl">
            <Loader size="md" />
          </Group>
        ) : comprobantesCompra.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-12 text-center">
            <IconReceipt size={48} className="text-zinc-700 mx-auto mb-2" />
            <Text fz="sm" c="dimmed">
              No se encontraron comprobantes de compra con los filtros aplicados.
            </Text>
          </div>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {comprobantesCompra.map((c) => (
              <ComprobanteCard
                key={c.id}
                comprobante={c}
                anulando={anulandoIdCompra === c.id}
                aprobandoTipo={aprobandoId[c.id] ?? null}
                onAprobar={(tipo) => void handleAprobarCompraInline(c.id, tipo)}
                onAnular={() => setComprobanteAAnular(c)}
                onVerPagos={() => void handleVerHistorial(c.id, false)}
                onVerEvidencias={() => {
                  setSelectedEvidencias(c.evidencias ?? []);
                  setEvidenceModalOpen(true);
                }}
              />
            ))}
          </SimpleGrid>
        )
      ) : (
        loadingVenta ? (
          <Group justify="center" py="xl">
            <Loader size="md" />
          </Group>
        ) : comprobantesVenta.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-12 text-center">
            <IconReceipt size={48} className="text-zinc-700 mx-auto mb-2" />
            <Text fz="sm" c="dimmed">
              No se encontraron comprobantes de venta con los filtros aplicados.
            </Text>
          </div>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {comprobantesVenta.map((c) => (
              <ComprobanteCard
                key={c.id}
                comprobante={c}
                anulando={anulandoIdVenta === c.id}
                onAnular={() => setComprobanteAAnular(c)}
                onVerPagos={() => void handleVerHistorial(c.id, true)}
                onVerEvidencias={() => {
                  setSelectedEvidencias(c.evidencias ?? []);
                  setEvidenceModalOpen(true);
                }}
              />
            ))}
          </SimpleGrid>
        )
      )}

      {/* --- MODAL REGISTRO COMPROBANTE COMPRA (EXISTENTE) --- */}
      <ModalRegistroComprobante
        opened={modalRegistroCompraOpened}
        onClose={() => setModalRegistroCompraOpened(false)}
        proveedores={proveedores}
        loadingProveedores={loadingProveedores}
        submitting={submittingCompra}
        onSubmit={crearComprobanteCompra}
      />

      {/* --- ÚNICO COMPONENTE NUEVO: REGISTRO COMPROBANTE VENTA --- */}
      <ModalRegistroComprobanteVenta
        opened={modalRegistroVentaOpened}
        onClose={() => setModalRegistroVentaOpened(false)}
        plantas={plantas}
        loadingPlantas={loadingPlantas}
        submitting={submittingVenta}
        onSubmit={crearComprobanteVenta}
      />

      {/* --- MODAL REUTILIZADO: HISTORIAL DE PAGOS (COMPRA Y VENTA) --- */}
      <ModalHistorialPagos
        opened={comprobanteHistorial !== null}
        onClose={() => setComprobanteHistorial(null)}
        comprobante={comprobanteHistorial}
        onAnularPago={handleAnularPago}
        onRegistrarPago={handleAbrirRegistroPago}
      />

      {/* --- MODAL REUTILIZADO: REGISTRAR PAGO (COMPRA Y VENTA) --- */}
      {comprobantePago && (
        <ModalRegistroPago
          opened={comprobantePago !== null}
          onClose={() => setComprobantePago(null)}
          comprobante={comprobantePago}
          submitting={submittingPago}
          onSubmit={handleRegistrarPago}
        />
      )}

      {/* --- MODAL REUTILIZADO: ANULAR COMPROBANTE (COMPRA Y VENTA) --- */}
      <ModalAnularComprobante
        opened={comprobanteAAnular !== null}
        onClose={() => setComprobanteAAnular(null)}
        comprobante={comprobanteAAnular}
        onConfirm={handleConfirmarAnular}
        loading={anulandoIdCompra !== null || anulandoIdVenta !== null}
      />

      {/* Modal Evidencias Compartido */}
      <ModalEstandar
        opened={evidenceModalOpen}
        close={() => {
          setEvidenceModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Evidencias del Comprobante"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>
    </Stack>
  );
}
