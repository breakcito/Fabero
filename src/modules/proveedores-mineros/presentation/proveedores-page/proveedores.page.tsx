import { Stack } from "@mantine/core";

import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useProveedores } from "../../hooks/useProveedores";
import { RegistroProveedor } from "../registro-proveedor/registro-proveedor";
import { CuentasBancarias } from "../cuentas-bancarias/cuentas-bancarias";
import { ModalConcesiones } from "./components/ModalConcesiones";
import { useState } from "react";
import type { ProveedorResponse } from "../../service/proveedores.responses";
import { Filtros } from "./components/filtros";
import { Proveedor } from "./components/proveedor";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export const ProveedoresPage = () => {
  useTitlePage("Proveedores");
  const {
    proveedores,
    loading,
    searchQuery,
    setSearchQuery,
    insertProveedor,
    updateProveedor,
    deleteProveedor,
    toggleEstado,
    actualizarCantidadCuentasProveedor,
  } = useProveedores();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorResponse | null>(null);
  const [proveedorAEditar, setProveedorAEditar] =
    useState<ProveedorResponse | null>(null);
  const [selectedProveedorConcesiones, setSelectedProveedorConcesiones] =
    useState<ProveedorResponse | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros
          onOpenRegistro={() => setOpenRegistro(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Proveedor
          proveedores={proveedores}
          loading={loading}
          onOpenCuentas={(p) => setSelectedProveedor(p)}
          onOpenConcesiones={(p) => setSelectedProveedorConcesiones(p)}
          onEdit={(p) => setProveedorAEditar(p)}
          onDelete={deleteProveedor}
          onToggleEstado={toggleEstado}
        />
      </Stack>

      {/* Modal: Registro de Proveedor */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Proveedor"
        size="lg"
      >
        <RegistroProveedor
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(p) => {
            insertProveedor(p);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Proveedor */}
      <ModalEstandar
        opened={!!proveedorAEditar}
        close={() => setProveedorAEditar(null)}
        title={
          proveedorAEditar
            ? `Editar Proveedor: ${proveedorAEditar.razon_social}`
            : ""
        }
        size="lg"
      >
        {proveedorAEditar && (
          <RegistroProveedor
            proveedor={proveedorAEditar}
            onCancel={() => setProveedorAEditar(null)}
            onSuccess={(p) => {
              updateProveedor(p);
              setProveedorAEditar(null);
            }}
          />
        )}
      </ModalEstandar>

      {/* Modal: Gestión de Cuentas Bancarias */}
      <ModalEstandar
        opened={!!selectedProveedor}
        close={() => setSelectedProveedor(null)}
        title={
          selectedProveedor
            ? `Cuentas Bancarias: ${selectedProveedor.razon_social}`
            : ""
        }
        size="xl"
      >
        {selectedProveedor && (
          <CuentasBancarias
            proveedor={selectedProveedor}
            onCuentasCountChange={(count) => {
              actualizarCantidadCuentasProveedor(selectedProveedor.id_proveedor, count);
            }}
          />
        )}
      </ModalEstandar>

      {/* Modal: Gestión de Concesiones */}
      <ModalEstandar
        opened={!!selectedProveedorConcesiones}
        close={() => setSelectedProveedorConcesiones(null)}
        title={
          selectedProveedorConcesiones
            ? `Concesiones del Proveedor: ${selectedProveedorConcesiones.razon_social}`
            : ""
        }
        size="xl"
      >
        {selectedProveedorConcesiones && (
          <ModalConcesiones proveedor={selectedProveedorConcesiones} />
        )}
      </ModalEstandar>


    </div>
  );
};
