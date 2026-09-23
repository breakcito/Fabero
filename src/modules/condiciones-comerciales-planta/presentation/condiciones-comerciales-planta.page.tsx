import { useState, useMemo } from "react";
import { Button, Badge, ActionIcon, Group, Tooltip, TextInput } from "@mantine/core";
import { PlusIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCondicionesComercialesPlanta } from "../hooks/useCondicionesComercialesPlanta";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ModalCondicionComercialPlanta } from "./components/modal-condicion-comercial";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_CondicionComercialPlanta } from "../service/condiciones-comerciales-planta.responses";
import type {
  DTO_CrearCondicionComercialPlanta,
  DTO_ActualizarCondicionComercialPlanta,
} from "../service/condiciones-comerciales-planta.requests";

type PlantaItem = { id: number; ruc: string; razon_social: string };

export const CondicionesComercialesPlantaPage = () => {
  useTitlePage("Condiciones Comerciales Planta");

  const {
    plantas,
    idPlantaSeleccionada,
    setIdPlantaSeleccionada,
    condiciones,
    loadingPlantas,
    loadingCondiciones,
    guardando,
    togglingIds,
    crearCondicion,
    actualizarCondicion,
    cambiarEstado,
  } = useCondicionesComercialesPlanta();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [condicionEditar, setCondicionEditar] =
    useState<RES_CondicionComercialPlanta | null>(null);
  const [searchPlanta, setSearchPlanta] = useState("");

  const handleAbrirCrear = () => {
    setCondicionEditar(null);
    setModalAbierto(true);
  };

  const handleAbrirEditar = (condicion: RES_CondicionComercialPlanta) => {
    setCondicionEditar(condicion);
    setModalAbierto(true);
  };

  const handleSubmitModal = async (
    data: DTO_CrearCondicionComercialPlanta | DTO_ActualizarCondicionComercialPlanta,
  ): Promise<boolean> => {
    if (condicionEditar) {
      return await actualizarCondicion(condicionEditar.id, data as DTO_ActualizarCondicionComercialPlanta);
    }
    const crearPayload = data as DTO_CrearCondicionComercialPlanta;
    const ok = await crearCondicion(crearPayload);
    if (ok) {
      setIdPlantaSeleccionada(crearPayload.id_planta);
    }
    return ok;
  };

  const plantasFiltradas = useMemo(() => {
    if (!searchPlanta.trim()) return plantas;
    const term = searchPlanta.toLowerCase().trim();
    return plantas.filter(
      (p) =>
        p.razon_social?.toLowerCase().includes(term) ||
        p.ruc?.toLowerCase().includes(term),
    );
  }, [plantas, searchPlanta]);

  const plantaSeleccionada = useMemo(
    () => plantas.find((p) => p.id === idPlantaSeleccionada),
    [plantas, idPlantaSeleccionada],
  );

  const columnasPlantas = useMemo(
    () => [
      {
        accessor: "index",
        title: "N°",
        textAlign: "center" as const,
        width: 40,
      },
      {
        accessor: "ruc",
        title: "RUC",
        width: 105,
        render: (p: PlantaItem) => (
          <span className="font-mono text-zinc-300 text-[11px]">{p.ruc || "—"}</span>
        ),
      },
      {
        accessor: "razon_social",
        title: "Razón Social",
        render: (p: PlantaItem) => (
          <span className="truncate block text-[11px]" title={p.razon_social}>
            {p.razon_social}
          </span>
        ),
      },
    ],
    [],
  );

  const columnasCondiciones = useMemo(
    () => [
      {
        accessor: "index",
        title: "N°",
        textAlign: "center" as const,
        width: 45,
      },
      {
        accessor: "elemento_quimico",
        title: "Elemento",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <Badge
            variant="light"
            color={r.elemento_quimico === "Oro" ? "yellow" : "gray"}
            size="sm"
            radius="sm"
          >
            {r.elemento_quimico}
          </Badge>
        ),
      },
      {
        accessor: "ley_inicio",
        title: "Ley Inicio",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono text-zinc-300">
            {r.ley_inicio !== null ? r.ley_inicio.toFixed(3) : "—"}
          </span>
        ),
      },
      {
        accessor: "ley_fin",
        title: "Ley Final",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono text-zinc-300">
            {r.ley_fin !== null ? r.ley_fin.toFixed(3) : "—"}
          </span>
        ),
      },
      {
        accessor: "maquila",
        title: "Maquila",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono font-semibold text-emerald-400">
            {r.maquila !== null ? `$${r.maquila.toFixed(3)}` : "—"}
          </span>
        ),
      },
      {
        accessor: "recuperacion",
        title: "Recuperación",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono text-indigo-300">
            {r.recuperacion !== null ? `${r.recuperacion.toFixed(3)}%` : "—"}
          </span>
        ),
      },
      {
        accessor: "consumo",
        title: "Consumo",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono text-zinc-300">
            {r.consumo !== null ? `$${r.consumo.toFixed(3)}` : "—"}
          </span>
        ),
      },
      {
        accessor: "riesgo_comercial",
        title: "Riesgo Comercial",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <span className="font-mono text-amber-400">
            {r.riesgo_comercial !== null ? `$${r.riesgo_comercial.toFixed(3)}` : "—"}
          </span>
        ),
      },
      {
        accessor: "estado",
        title: "Estado",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => (
          <Badge
            variant="light"
            color={r.estado === EstadoBase.Activo ? "teal" : "red"}
            size="sm"
            radius="sm"
          >
            {r.estado}
          </Badge>
        ),
      },
      {
        accessor: "acciones",
        title: "Acción",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialPlanta) => {
          const isToggling = !!togglingIds[r.id];
          return (
            <Group gap="xs" justify="center">
              <Tooltip label="Editar condición" withArrow position="top">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="sm"
                  onClick={() => handleAbrirEditar(r)}
                  disabled={isToggling}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={r.estado === EstadoBase.Activo ? "Inactivar condición" : "Activar condición"}
                withArrow
                position="top"
              >
                <ActionIcon
                  variant="subtle"
                  color={r.estado === EstadoBase.Activo ? "red" : "teal"}
                  size="sm"
                  loading={isToggling}
                  disabled={isToggling}
                  onClick={() => void cambiarEstado(r.id, r.estado)}
                >
                  {r.estado === EstadoBase.Activo ? (
                    <XCircleIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      },
    ],
    [togglingIds, cambiarEstado],
  );

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Tabla de Plantas */}
        <div className="lg:col-span-4 border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <BuildingOffice2Icon className="w-4 h-4 text-indigo-400" />
              Lista de Plantas Destino
            </h2>
            <Badge variant="light" color="indigo" size="xs" radius="md">
              {plantasFiltradas.length}
            </Badge>
          </div>

          <TextInput
            placeholder="Buscar por RUC o Razón Social..."
            value={searchPlanta}
            onChange={(e) => setSearchPlanta(e.target.value)}
            leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-500" />}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-8.5 rounded-xl text-xs",
            }}
          />

          <DataTableEstandar
            idAccessor="id"
            records={plantasFiltradas}
            columns={columnasPlantas}
            loading={loadingPlantas}
            initialPageSize={10}
            noRecordsText="No se encontraron plantas destino."
            onRowClick={({ record }: { record: PlantaItem }) => setIdPlantaSeleccionada(record.id)}
            rowClassName={({ id }: PlantaItem) =>
              id === idPlantaSeleccionada
                ? "!bg-indigo-600/30 !text-indigo-200 font-semibold border-l-4 border-indigo-500 cursor-pointer"
                : "cursor-pointer hover:bg-zinc-800/40 text-zinc-300"
            }
          />
        </div>

        {/* Panel Derecho: Tabla de Condiciones Comerciales */}
        <div className="lg:col-span-8 border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Condiciones Comerciales de:{" "}
              <span className="text-indigo-400 font-semibold">
                {plantaSeleccionada
                  ? plantaSeleccionada.razon_social
                  : "Ninguna planta seleccionada"}
              </span>
            </h2>

            <Button
              leftSection={<PlusIcon className="w-4 h-4" />}
              onClick={handleAbrirCrear}
              disabled={!idPlantaSeleccionada || loadingPlantas}
              radius="lg"
              size="xs"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-8.5 px-4 rounded-xl font-semibold disabled:opacity-50 shrink-0"
            >
              Nueva C.C.
            </Button>
          </div>

          <DataTableEstandar
            idAccessor="id"
            records={condiciones}
            columns={columnasCondiciones}
            loading={loadingCondiciones}
            noRecordsText="No hay condiciones comerciales registradas para la planta seleccionada."
          />
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <ModalCondicionComercialPlanta
        opened={modalAbierto}
        onClose={() => setModalAbierto(false)}
        idPlanta={idPlantaSeleccionada}
        plantas={plantas}
        condicionEditar={condicionEditar}
        onSubmit={handleSubmitModal}
        loading={guardando}
      />
    </div>
  );
};

export default CondicionesComercialesPlantaPage;
