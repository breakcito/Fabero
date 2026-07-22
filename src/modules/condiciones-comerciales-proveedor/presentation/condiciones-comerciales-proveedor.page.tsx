import { useState, useMemo } from "react";
import { Button, Select, Badge, ActionIcon, Loader, Group, Tooltip } from "@mantine/core";
import { PlusIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

import { useTitlePage } from "../../../hooks/useTitlePage";
import { useCondicionesComercialesProveedor } from "../hooks/useCondicionesComercialesProveedor";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ModalCondicionComercial } from "./components/modal-condicion-comercial";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_CondicionComercialProveedor } from "../service/condiciones-comerciales-proveedor.responses";
import type { DTO_CrearCondicionComercial, DTO_ActualizarCondicionComercial } from "../service/condiciones-comerciales-proveedor.requests";

const fieldInputClass =
  "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-9.5 rounded-xl";
const fieldLabelClass = "text-zinc-300 mb-1 font-medium text-xs";

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

  const opcionesProveedores = useMemo(
    () =>
      proveedores.map((p) => ({
        value: String(p.id_proveedor),
        label: p.razon_social || `Proveedor #${p.id_proveedor}`,
      })),
    [proveedores],
  );

  const columnas = useMemo(
    () => [
      {
        accessor: "index",
        title: "#",
        textAlign: "center" as const,
        width: 50,
      },
      {
        accessor: "ley_auoz_inicio",
        title: "Ley Au (oz/TC) Inicio",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">{r.ley_auoz_inicio.toFixed(4)}</span>
        ),
      },
      {
        accessor: "ley_auoz_fin",
        title: "Ley Au (oz/TC) Fin",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">{r.ley_auoz_fin.toFixed(4)}</span>
        ),
      },
      {
        accessor: "maquila",
        title: "Maquila ($/TC)",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono font-semibold text-emerald-400">${r.maquila.toFixed(3)}</span>
        ),
      },
      {
        accessor: "recuperacion",
        title: "Recuperación (%)",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-indigo-300">{r.recuperacion.toFixed(3)}%</span>
        ),
      },
      {
        accessor: "consumo",
        title: "Consumo ($/TC)",
        textAlign: "center" as const,
        render: (r: RES_CondicionComercialProveedor) => (
          <span className="font-mono text-zinc-300">${r.consumo.toFixed(3)}</span>
        ),
      },
      {
        accessor: "riesgo_comercial",
        title: "Riesgo Comercial ($/TC)",
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
        title: "Acciones",
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
      {/* Header section with Supplier Filter & Add Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Selector de Proveedor */}
        <div className="md:col-span-6 lg:col-span-5">
          <Select
            label="Proveedor"
            placeholder={loadingProveedores ? "Cargando proveedores..." : "Seleccione un proveedor..."}
            disabled={loadingProveedores}
            rightSection={loadingProveedores ? <Loader size={16} color="indigo" /> : <BuildingOffice2Icon className="w-4 h-4 text-zinc-500" />}
            data={opcionesProveedores}
            value={idProveedorSeleccionado ? String(idProveedorSeleccionado) : null}
            onChange={(val) => setIdProveedorSeleccionado(val ? Number(val) : null)}
            searchable
            allowDeselect={false}
            size="xs"
            radius="lg"
            comboboxProps={{ withinPortal: true }}
            classNames={{
              input: fieldInputClass,
              label: fieldLabelClass,
              option: "hover:bg-zinc-800 focus:bg-zinc-800",
            }}
          />
        </div>

        {/* Botón Agregar condición */}
        <div className="md:col-span-6 lg:col-span-7 flex justify-end">
          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={handleAbrirCrear}
            disabled={!idProveedorSeleccionado || loadingProveedores}
            radius="lg"
            size="xs"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-9.5 px-5 rounded-xl font-semibold disabled:opacity-50"
          >
            Agregar condición
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTableEstandar
        idAccessor="id"
        records={condiciones}
        columns={columnas}
        loading={loadingCondiciones}
        noRecordsText="No hay condiciones comerciales registradas para el proveedor seleccionado."
      />

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
