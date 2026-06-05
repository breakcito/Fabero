import { useCuentasBancarias } from "../../hooks/useCuentasBancarias";
import type { ProveedorResponse } from "../../service/proveedores.responses";
import type { CuentaBancariaResponse } from "../../service/proveedores.responses";
import { RegistroCuenta } from "./components/registro-cuenta";
import { CuentaBancaria } from "./components/cuenta-bancaria";
import { useState, useMemo } from "react";
import { Loader, Text, TextInput, Button, Group } from "@mantine/core";
import { IconCreditCard, IconSearch, IconPlus } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";

interface Props {
  proveedor: ProveedorResponse;
  onCuentasCountChange?: (count: number) => void;
}

export const CuentasBancarias = ({ proveedor, onCuentasCountChange }: Props) => {
  const {
    cuentas,
    bancos,
    setBancos,
    loadingCuentas,
    loadingBancos,
    insertCuenta,
    toggleEstadoCuenta,
  } = useCuentasBancarias(proveedor.id_proveedor, onCuentasCountChange);

  const [searchQuery, setSearchQuery] = useState("");
  const [openAgregar, setOpenAgregar] = useState(false);
  const [cuentaAEditar, setCuentaAEditar] = useState<CuentaBancariaResponse | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null);

  // Filtrar cuentas
  const cuentasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return cuentas;
    return cuentas.filter(
      (c) =>
        c.banco.toLowerCase().includes(query) ||
        (c.banco_abv && c.banco_abv.toLowerCase().includes(query)) ||
        c.numero_cuenta.toLowerCase().includes(query) ||
        (c.cci && c.cci.toLowerCase().includes(query))
    );
  }, [cuentas, searchQuery]);

  const handleToggleStatus = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    if (!confirm(`¿Está seguro de cambiar el estado de esta cuenta bancaria a ${nuevoEstado}?`)) return;
    setLoadingDelete(id);
    try {
      await toggleEstadoCuenta(id, currentEstado);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controles de Búsqueda y Añadir */}
      <Group justify="space-between" align="center" gap="md" wrap="nowrap">
        <TextInput
          placeholder="Buscar cuenta por banco, número o CCI..."
          radius="lg"
          size="xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={14} className="text-zinc-500" />}
          className="flex-1 max-w-md"
          classNames={{
            input: "bg-zinc-900/50 border-zinc-800 text-white focus:border-zinc-300 transition-all w-full",
          }}
        />

        <Button
          onClick={() => setOpenAgregar(true)}
          radius="lg"
          size="xs"
          leftSection={<IconPlus size={16} />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-950/30 shrink-0"
        >
          Agregar Cuenta
        </Button>
      </Group>

      {/* Lista de Cuentas */}
      <div className="flex flex-col gap-3">
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
        ) : cuentasFiltradas.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {cuentasFiltradas.map((cuenta) => (
              <CuentaBancaria
                key={cuenta.id_cuenta_bancaria}
                cuenta={cuenta}
                onEdit={() => setCuentaAEditar(cuenta)}
                onToggleStatus={() => handleToggleStatus(cuenta.id_cuenta_bancaria, cuenta.estado as EstadoBase)}
                loadingStatus={loadingDelete === cuenta.id_cuenta_bancaria}
              />
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
              No se encontraron cuentas bancarias registradas.
            </Text>
          </div>
        )}
      </div>

      {/* Sub-Modal: Agregar Cuenta Bancaria */}
      <ModalEstandar
        opened={openAgregar}
        close={() => setOpenAgregar(false)}
        title="Agregar Cuenta Bancaria"
        size="lg"
      >
        <RegistroCuenta
          idProveedor={proveedor.id_proveedor}
          bancos={bancos}
          loadingBancos={loadingBancos}
          onCuentaAdded={(newAccount) => {
            insertCuenta(newAccount);
            setOpenAgregar(false);
          }}
          onBancoAdded={(newBanco) => {
            setBancos((prev) => [...prev, newBanco]);
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Editar Cuenta Bancaria */}
      <ModalEstandar
        opened={!!cuentaAEditar}
        close={() => setCuentaAEditar(null)}
        title={cuentaAEditar ? "Editar Cuenta Bancaria" : ""}
        size="lg"
      >
        {cuentaAEditar && (
          <RegistroCuenta
            idProveedor={proveedor.id_proveedor}
            bancos={bancos}
            loadingBancos={loadingBancos}
            cuenta={cuentaAEditar}
            onCuentaAdded={(updatedAccount) => {
              insertCuenta(updatedAccount);
              setCuentaAEditar(null);
            }}
            onBancoAdded={(newBanco) => {
              setBancos((prev) => [...prev, newBanco]);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
