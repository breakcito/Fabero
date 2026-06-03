import { Stack } from "@mantine/core";

import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useProveedores } from "../../hooks/useProveedores";
import { RegistroProveedor } from "../registro-proveedor/registro-proveedor";
import { CuentasBancarias } from "../cuentas-bancarias/cuentas-bancarias";
import { useState } from "react";
import type { ProveedorResponse } from "../../service/proveedores.responses";
import { Filtros } from "./components/filtros";
import { Proveedor } from "./components/proveedor";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export const ProveedoresPage = () => {
  useTitlePage("Proveedores");
  const { proveedores, loading, insertProveedor } = useProveedores();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorResponse | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros onOpenRegistro={() => setOpenRegistro(true)} />

        <Proveedor
          proveedores={proveedores}
          loading={loading}
          onOpenCuentas={(p) => setSelectedProveedor(p)}
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
          <CuentasBancarias proveedor={selectedProveedor} />
        )}
      </ModalEstandar>
    </div>
  );
};
