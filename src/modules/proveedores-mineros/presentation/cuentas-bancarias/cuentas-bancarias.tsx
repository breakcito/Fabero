import { useCuentasBancarias } from "../../hooks/useCuentasBancarias";
import type { ProveedorResponse } from "../../service/proveedores.responses";
import {
  RegistroCuenta,
  type RegistroCuentaRef,
} from "./components/registro-cuenta";
import { CuentaBancaria } from "./components/cuenta-bancaria";
import { useRef } from "react";
import { Loader, Text } from "@mantine/core";
import { IconCreditCard } from "@tabler/icons-react";

interface Props {
  proveedor: ProveedorResponse;
}

export const CuentasBancarias = ({ proveedor }: Props) => {
  const {
    cuentas,
    bancos,
    setBancos,
    loadingCuentas,
    loadingBancos,
    insertCuenta,
  } = useCuentasBancarias(proveedor.id_proveedor);

  const regCuentaRef = useRef<RegistroCuentaRef>(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario arriba según lo solicitado */}
      <RegistroCuenta
        ref={regCuentaRef}
        idProveedor={proveedor.id_proveedor}
        bancos={bancos}
        loadingBancos={loadingBancos}
        onCuentaAdded={insertCuenta}
        onBancoAdded={(b) => {
          setBancos((prev) => [...prev, b]);
          regCuentaRef.current?.autoSelectBanco(b.id_banco);
        }}
      />

      {/* Lista de Cuentas usando items individuales en vez de tabla */}
      <div className="flex flex-col gap-3">
        <h3 className="text-zinc-300 font-medium text-sm uppercase tracking-widest px-1">
          Cuentas Registradas
        </h3>

        {loadingCuentas ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
            <Loader color="indigo" type="bars" size="sm" />
            <Text
              size="xs"
              mt="sm"
              className="text-zinc-500 font-medium uppercase tracking-widest"
            >
              Cargando cuentas...
            </Text>
          </div>
        ) : cuentas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cuentas.map((cuenta) => (
              <CuentaBancaria key={cuenta.id_cuenta_bancaria} cuenta={cuenta} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
            <IconCreditCard
              size={40}
              className="text-zinc-700 mb-3"
              stroke={1}
            />
            <Text size="sm" className="text-zinc-500 font-medium">
              Este proveedor no tiene cuentas bancarias registradas.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
