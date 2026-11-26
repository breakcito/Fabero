import { Stack } from "@mantine/core";

import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useProveedores } from "../../hooks/useProveedores";
import { RegistroProveedor } from "../registro-proveedor/registro-proveedor";
import { CuentasBancariasGenerico } from "../../../../presentation/utils/cuentas-bancarias";
import { ModalConcesiones } from "./components/ModalConcesiones";
import { ModalContactos } from "./components/ModalContactos";
import { useState } from "react";
import type {
  CuentaBancariaResponse,
  ProveedorResponse,
} from "../../service/proveedores.responses";
import { Filtros } from "./components/filtros";
import { Proveedor } from "./components/proveedor";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { proveedorCuentasAdapter } from "../../service/cuentas-bancarias.adapter";

export const ProveedoresPage = () => {
  useTitlePage("Proveedores");
  const {
    proveedores,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    insertProveedor,
    updateProveedor,
    deleteProveedor,
    toggleEstado,
    actualizarCantidadCuentasProveedor,
    actualizarCantidadContactosProveedor,
  } = useProveedores();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorResponse | null>(null);
  const [proveedorAEditar, setProveedorAEditar] =
    useState<ProveedorResponse | null>(null);
  const [selectedProveedorConcesiones, setSelectedProveedorConcesiones] =
    useState<ProveedorResponse | null>(null);
  const [selectedProveedorContactos, setSelectedProveedorContactos] =
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
          togglingIds={togglingIds}
          onOpenCuentas={(p) => setSelectedProveedor(p)}
          onOpenConcesiones={(p) => setSelectedProveedorConcesiones(p)}
          onOpenContactos={(p) => setSelectedProveedorContactos(p)}
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
        validateClose
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
        validateClose
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
          <CuentasBancariasGenerico<
            CuentaBancariaResponse,
            ProveedorResponse
          >
            entity={selectedProveedor}
            adapter={proveedorCuentasAdapter}
            onCuentasCountChange={(count) => {
              actualizarCantidadCuentasProveedor(
                selectedProveedor.id_proveedor,
                count,
              );
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


      {/* Modal: Gestión de Contactos */}
      <ModalEstandar
        opened={!!selectedProveedorContactos}
        close={() => setSelectedProveedorContactos(null)}
        title={
          selectedProveedorContactos
            ? `Contactos del Proveedor: ${selectedProveedorContactos.razon_social}`
            : ""
        }
        size="lg"
      >
        {selectedProveedorContactos && (
          <ModalContactos
            proveedor={selectedProveedorContactos}
            onCantidadChange={(count) =>
              actualizarCantidadContactosProveedor(
                selectedProveedorContactos.id_proveedor,
                count,
              )
            }
          />
        )}
      </ModalEstandar>

    </div>
  );
};
