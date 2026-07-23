import { useState, useMemo } from "react";
import { Button, Badge, ActionIcon, Group, Tooltip, TextInput } from "@mantine/core";
import { PlusIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCondicionesComercialesProveedor } from "../hooks/useCondicionesComercialesProveedor";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ModalCondicionComercial } from "./components/modal-condicion-comercial";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_CondicionComercialProveedor } from "../service/condiciones-comerciales-proveedor.responses";
import type { DTO_CrearCondicionComercial, DTO_ActualizarCondicionComercial } from "../service/condiciones-comerciales-proveedor.requests";

export const CondicionesComercialesProveedorPage = () => {
  useTitlePage("Condiciones Comerciales Proveedor");

  const {
    proveedores,
    idProveedorSeleccionado,
    setIdProveedorSeleccionado,
    condiciones,
    loadingProveedores,
    loadingCondiciones,
    guardando,
    togglingIds,
    crearCondicion,
    actualizarCondicion,
    cambiarEstado,
  } = useCondicionesComercialesProveedor();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [condicionEditar, setCondicionEditar] = useState<RES_CondicionComercialProveedor | null>(null);
  const [searchProveedor, setSearchProveedor] = useState("");

  const handleAbrirCrear = () => {
    setCondicionEditar(null);
    setModalAbierto(true);
  };

  const handleAbrirEditar = (condicion: RES_CondicionComercialProveedor) => {
    setCondicionEditar(condicion);
    setModalAbierto(true);
  };

  const handleSubmitModal = async (
    data: DTO_CrearCondicionComercial | DTO_ActualizarCondicionComercial,
  ): Promise<boolean> => {
    if (condicionEditar) {
      return await actualizarCondicion(condicionEditar.id, data as DTO_ActualizarCondicionComercial);
    }
    const crearPayload = data as DTO_CrearCondicionComercial;
    const ok = await crearCondicion(crearPayload);
    if (ok) {
      setIdProveedorSeleccionado(crearPayload.id_proveedor_minero);
    }
    return ok;
  };

  const proveedoresFiltrados = useMemo(() => {
    if (!searchProveedor.trim()) return proveedores;
    const term = searchProveedor.toLowerCase().trim();
    return proveedores.filter(
      (p) =>
        p.razon_social?.toLowerCase().includes(term) ||
        p.documento?.toLowerCase().includes(term),
    );
  }, [proveedores, searchProveedor]);

  const proveedorSeleccionado = useMemo(
    () => proveedores.find((p) => p.id_proveedor === idProveedorSeleccionado),
    [proveedores, idProveedorSeleccionado],
  );

  const columnasProveedores = useMemo(
    () => [
      {
        accessor: "index",
        title: "N°",
        textAlign: "center" as const,
        width: 40,
      },
      {
        accessor: "documento",
        title: "RUC",
        width: 105,
        render: (p: RES_Proveedor) => (
          <span className="font-mono text-zinc-300 text-[11px]">{p.documento || "—"}</span>
        ),
      },
      {
        accessor: "razon_social",
        title: "Razón Social",
        render: (p: RES_Proveedor) => (
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
        accessor: "ley_auoz_inicio",
        title: "Ley Auoz Inicio",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">{r.ley_auoz_inicio.toFixed(3)}</span>
        ),
      },
      {
        accessor: "ley_auoz_fin",
        title: "Ley Auoz Fin",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">{r.ley_auoz_fin.toFixed(3)}</span>
        ),
      },
      {
        accessor: "maquila",
        title: "Maquila",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono font-semibold text-emerald-400">${r.maquila.toFixed(3)}</span>
        ),
      },
      {
        accessor: "recuperacion",
        title: "Recuperación",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-indigo-300">{r.recuperacion.toFixed(3)}%</span>
        ),
      },
      {
        accessor: "consumo",
        title: "Consumo",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">${r.consumo.toFixed(3)}</span>
        ),
      },
      {
        accessor: "riesgo_comercial",
        title: "Riesgo Comercial",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-amber-400">${r.riesgo_comercial.toFixed(3)}</span>
        ),
      },
      {
        accessor: "estado",
        title: "Estado",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
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
        render: (r: RES_CondicionComercialProveedor) => {
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
        {/* Panel Izquierdo: Tabla Estándar de Proveedores */}
        <div className="lg:col-span-4 border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <BuildingOffice2Icon className="w-4 h-4 text-indigo-400" />
              Lista de Proveedores
            </h2>
            <Badge variant="light" color="indigo" size="xs" radius="md">
              {proveedoresFiltrados.length}
            </Badge>
          </div>

          <TextInput
            placeholder="Buscar por RUC o Razón Social..."
            value={searchProveedor}
            onChange={(e) => setSearchProveedor(e.target.value)}
            leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-500" />}
            size="xs"
            radius="lg"
            classNames={{
              input: "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-8.5 rounded-xl text-xs",
            }}
          />

          <DataTableEstandar
            idAccessor="id_proveedor"
            records={proveedoresFiltrados}
            columns={columnasProveedores}
            loading={loadingProveedores}
            initialPageSize={10}
            noRecordsText="No se encontraron proveedores."
            onRowClick={({ record }: { record: RES_Proveedor }) => setIdProveedorSeleccionado(record.id_proveedor)}
            rowClassName={({ id_proveedor }: RES_Proveedor) =>
              id_proveedor === idProveedorSeleccionado
                ? "!bg-indigo-600/30 !text-indigo-200 font-semibold border-l-4 border-indigo-500 cursor-pointer"
                : "cursor-pointer hover:bg-zinc-800/40 text-zinc-300"
            }
          />
        </div>

        {/* Panel Derecho: Tabla Estándar de Condiciones Comerciales */}
        <div className="lg:col-span-8 border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Condiciones Comerciales de:{" "}
              <span className="text-indigo-400 font-semibold">
                {proveedorSeleccionado ? proveedorSeleccionado.razon_social : "Ningún proveedor seleccionado"}
              </span>
            </h2>

            <Button
              leftSection={<PlusIcon className="w-4 h-4" />}
              onClick={handleAbrirCrear}
              disabled={!idProveedorSeleccionado || loadingProveedores}
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
            noRecordsText="No hay condiciones comerciales registradas para el proveedor seleccionado."
          />
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <ModalCondicionComercial
        opened={modalAbierto}
        onClose={() => setModalAbierto(false)}
        idProveedor={idProveedorSeleccionado}
        proveedores={proveedores}
        condicionEditar={condicionEditar}
        onSubmit={handleSubmitModal}
        loading={guardando}
      />
    </div>
  );
};

export default CondicionesComercialesProveedorPage;
