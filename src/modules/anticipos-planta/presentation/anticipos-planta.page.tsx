import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Select,
  Loader,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconHistory,
  IconBan,
  IconFiles,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../presentation/utils/cambios-log-viewer";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import { EstadoAnticipoProveedor } from "../../../shared/enums/_generic/estado-anticipo-proveedor";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

import { useAnticiposPlanta } from "../hooks/useAnticiposPlanta";
import { ModalCrearAnticipoPlanta } from "./components/modal-crear-anticipo";
import { ModalAnularAnticipoPlanta } from "./components/modal-anular-anticipo";
import type { RES_AnticipoPlanta } from "../service/anticipos-planta.responses";

const formatearFechaHora = (fechaIso: string): string => {
  try {
    const d = new Date(fechaIso);
    if (Number.isNaN(d.getTime())) return fechaIso;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fechaIso;
  }
};

const getArchivoObj = (item: unknown): IArchivo => {
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    const nombreOriginal = String(obj.nombre_original || obj.nombre || "archivo");
    const extension = String(obj.extension || nombreOriginal.split(".").pop() || "");
    const pathRelativo = String(obj.path_relativo || obj.path || "");
    let url = String(obj.url || "");
    if (!url && pathRelativo) {
      const backendUrl = import.meta.env.VITE_API_URL || "";
      const baseUrl = backendUrl.replace(/\/api\/?$/, "");
      url = `${baseUrl}/storage/${pathRelativo}`;
    }
    return {
      nombre_original: nombreOriginal,
      extension: extension,
      path_relativo: pathRelativo,
      url: url,
    };
  }

  const pathStr = String(item || "");
  const filename = pathStr.split("/").pop() || pathStr;
  const ext = filename.includes(".") ? filename.split(".").pop() || "" : "";
  const backendUrl = import.meta.env.VITE_API_URL || "";
  const baseUrl = backendUrl.replace(/\/api\/?$/, "");
  return {
    nombre_original: filename,
    extension: ext,
    path_relativo: pathStr,
    url: `${baseUrl}/storage/${pathStr}`,
  };
};

const getBadgeEstado = (estado: string) => {
  switch (estado) {
    case EstadoAnticipoProveedor.ConSaldo:
      return (
        <Badge variant="light" color="teal" size="sm" radius="md">
          {EstadoAnticipoProveedor.ConSaldo}
        </Badge>
      );
    case EstadoAnticipoProveedor.SinSaldo:
      return (
        <Badge variant="light" color="blue" size="sm" radius="md">
          {EstadoAnticipoProveedor.SinSaldo}
        </Badge>
      );
    case EstadoAnticipoProveedor.Anulado:
      return (
        <Badge variant="light" color="red" size="sm" radius="md">
          {EstadoAnticipoProveedor.Anulado}
        </Badge>
      );
    default:
      return (
        <Badge variant="light" color="gray" size="sm" radius="md">
          {estado}
        </Badge>
      );
  }
};

export default function AnticiposPlantaPage() {
  useTitlePage("Anticipos Planta");

  const {
    anticipos,
    loading,
    plantas,
    loadingPlantas,
    filtroPlanta,
    setFiltroPlanta,
    filtroEstado,
    setFiltroEstado,
    submitting,
    anulandoId,
    crearAnticipo,
    anularAnticipo,
  } = useAnticiposPlanta();

  const [modalCrearOpened, setModalCrearOpened] = useState(false);
  const [modalAnularInfo, setModalAnularInfo] = useState<{
    id: number;
    planta: string;
    saldo: number;
  } | null>(null);
  const [modalLogInfo, setModalLogInfo] = useState<RES_CambiosLog[] | null>(null);
  const [modalEvidenciasInfo, setModalEvidenciasInfo] = useState<(IArchivo | string)[] | null>(null);

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-400 font-medium text-xs mb-1",
  };

  return (
    <Stack gap="md" className="w-full">
      {/* Header & Filtros */}
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Group align="flex-end" gap="md" wrap="wrap">
          {/* Planta Destino */}
          <Select
            label="Planta Destino:"
            placeholder={loadingPlantas ? "Cargando plantas..." : "Todas las plantas"}
            searchable
            clearable
            disabled={loadingPlantas}
            rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
            data={plantas.map((p) => ({
              value: String(p.id),
              label: `${p.razon_social} (${p.ruc})`,
            }))}
            value={filtroPlanta ? String(filtroPlanta) : null}
            onChange={(val) => setFiltroPlanta(val ? Number(val) : null)}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
            comboboxProps={{ withinPortal: true }}
            className="w-72"
          />

          {/* Estado */}
          <Select
            label="Estado:"
            placeholder="Seleccionar estado"
            data={[
              "Todos",
              EstadoAnticipoProveedor.ConSaldo,
              EstadoAnticipoProveedor.SinSaldo,
              EstadoAnticipoProveedor.Anulado,
            ]}
            value={filtroEstado}
            onChange={(val) => setFiltroEstado(val || "Todos")}
            classNames={fieldClasses}
            size="xs"
            radius="lg"
            comboboxProps={{ withinPortal: true }}
            className="w-44"
          />
        </Group>

        <Button
          variant="light"
          color="blue"
          size="xs"
          radius="lg"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalCrearOpened(true)}
          className="bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 font-semibold"
        >
          Nuevo Anticipo
        </Button>
      </Group>

      {/* Tabla Principal */}
      <DataTableEstandar
        idAccessor="id"
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
          },
          {
            accessor: "registro",
            title: "Fecha / Registrado",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) => (
              <div>
                <Text size="11px" c="dimmed">
                  {r.empleado_registro_nombre}
                </Text>
                <Text size="10px" fw={600} className="font-mono text-zinc-200">
                  {formatearFechaHora(r.created_at)}
                </Text>
              </div>
            ),
          },
          {
            accessor: "planta_razon_social",
            title: "Planta Destino",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) => (
              <Text size="xs" fw={600} className="text-zinc-200">
                {r.planta_razon_social}
              </Text>
            ),
          },
          {
            accessor: "codigo_comprobante",
            title: "Cód. Comprobante",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) =>
              r.codigo_comprobante ? (
                <Text size="xs" className="font-mono text-zinc-300">
                  {r.codigo_comprobante}
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  —
                </Text>
              ),
          },
          {
            accessor: "saldo_inicial",
            title: "Monto Inicial",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) => (
              <Text size="xs" fw={600} className="font-mono text-emerald-400">
                ${r.saldo_inicial.toFixed(2)}
              </Text>
            ),
          },
          {
            accessor: "saldo_actual",
            title: "Saldo Actual",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) => (
              <Text size="xs" fw={600} className="font-mono text-cyan-400">
                ${r.saldo_actual.toFixed(2)}
              </Text>
            ),
          },
          {
            accessor: "estado",
            title: "Estado",
            textAlign: "center",
            render: (r: RES_AnticipoPlanta) => getBadgeEstado(r.estado),
          },
          {
            accessor: "acciones",
            title: "Acciones",
            textAlign: "center",
            width: 150,
            render: (r: RES_AnticipoPlanta) => (
              <Group gap={6} justify="center">
                {/* Ver evidencias */}
                {r.evidencias && r.evidencias.length > 0 && (
                  <Tooltip label="Ver Evidencias">
                    <ActionIcon
                      variant="light"
                      color="indigo"
                      size="sm"
                      radius="md"
                      onClick={() => setModalEvidenciasInfo(r.evidencias)}
                    >
                      <IconFiles size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}

                {/* Registro / Historial de cambios (columna log_cambios del anticipo). */}
                {r.log_cambios && r.log_cambios.length > 0 && (
                  <Tooltip label="Historial de Cambios">
                    <ActionIcon
                      variant="light"
                      color="amber"
                      size="sm"
                      radius="md"
                      onClick={() =>
                        setModalLogInfo([...r.log_cambios].reverse())
                      }
                    >
                      <IconHistory size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}

                {/* Anular */}
                {r.estado !== EstadoAnticipoProveedor.Anulado && (
                  <Tooltip label="Anular Anticipo">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      radius="md"
                      loading={anulandoId === r.id}
                      disabled={anulandoId === r.id}
                      onClick={() =>
                        setModalAnularInfo({
                          id: r.id,
                          planta: r.planta_razon_social,
                          saldo: r.saldo_inicial,
                        })
                      }
                    >
                      <IconBan size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            ),
          },
        ]}
        records={anticipos}
        loading={loading}
        noRecordsText="No se encontraron registros de anticipos de planta"
      />

      {/* Modal Crear */}
      <ModalCrearAnticipoPlanta
        opened={modalCrearOpened}
        onClose={() => setModalCrearOpened(false)}
        onSubmit={crearAnticipo}
        plantas={plantas}
        loadingPlantas={loadingPlantas}
        submitting={submitting}
      />

      {/* Modal Anular */}
      <ModalAnularAnticipoPlanta
        opened={modalAnularInfo !== null}
        onClose={() => setModalAnularInfo(null)}
        onConfirm={(motivo) => {
          if (!modalAnularInfo) return Promise.resolve(false);
          return anularAnticipo(modalAnularInfo.id, motivo);
        }}
        loading={anulandoId !== null}
        anticipoInfo={modalAnularInfo}
      />

      {/* Modal Log de Cambios (lee log_cambios del row cacheado). */}
      <ModalEstandar
        opened={modalLogInfo !== null}
        close={() => setModalLogInfo(null)}
        title="Registro de Cambios del Anticipo de Planta"
        size="lg"
      >
        <CambiosLogViewer cambios={modalLogInfo} />
      </ModalEstandar>

      {/* Modal Evidencias */}
      <ModalEstandar
        opened={modalEvidenciasInfo !== null}
        close={() => setModalEvidenciasInfo(null)}
        title="Evidencias / Documentos Adjuntos"
        size="md"
      >
        <Stack gap="xs">
          {modalEvidenciasInfo && modalEvidenciasInfo.length > 0 ? (
            modalEvidenciasInfo.map((filepath, idx) => (
              <ArchivoCard key={idx} archivo={getArchivoObj(filepath)} />
            ))
          ) : (
            <Text size="xs" c="dimmed">
              No se adjuntaron archivos.
            </Text>
          )}
        </Stack>
      </ModalEstandar>
    </Stack>
  );
}
