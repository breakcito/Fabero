import {
  Button,
  TextInput,
  Skeleton,
  Text,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { RegistroSucursal } from "./registro-sucursal";
import { useSucursales } from "../hooks/useSucursales";
import { useRegistrarSucursal } from "../hooks/useRegistrarSucursal";
import { SucursalCard } from "./sucursal-card";

export const SucursalesPage = () => {
  useTitlePage("Sucursales");

  const {
    loading,
    busqueda,
    setBusqueda,
    sucursalesFiltradas,
    openedCreate,
    openCreate,
    closeCreate,
    onSucursalCreada,
  } = useSucursales();

  const registro = useRegistrarSucursal({
    onSuccess: onSucursalCreada,
    onClose: closeCreate,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <TextInput
            label="Buscar Sucursal"
            placeholder="Buscar sucursales por nombre, departamento, provincia o distrito..."
            leftSection={
              <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            className="flex-1 min-w-64"
            radius="lg"
            size="sm"
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500",
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
            }}
          />
        </div>
        <Button
          leftSection={<PlusIcon className="w-5 h-5" />}
          onClick={openCreate}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/20 shrink-0 px-6 font-semibold h-[38px]"
        >
          Nueva Sucursal
        </Button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-[32px] p-6 space-y-4"
            >
              {/* Header Skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton height={40} width={40} radius="xl" />
                  <Skeleton height={16} width="60%" radius="md" />
                </div>
                <Skeleton height={18} width={60} radius="md" />
              </div>
              
              {/* Content Skeleton */}
              <div className="space-y-3 pt-2">
                <Skeleton height={12} width="85%" radius="md" />
                <Skeleton height={12} width="70%" radius="md" />
                <Skeleton height={12} width="40%" radius="md" />
              </div>
            </div>
          ))}
        </div>
      ) : sucursalesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/10 rounded-[40px] border border-dashed border-zinc-800/50">
          <div className="bg-zinc-900/50 p-6 rounded-full mb-4 border border-zinc-800">
            <Squares2X2Icon className="w-10 h-10 text-zinc-700" />
          </div>
          <Text size="sm" fw={600} className="text-zinc-500">
            No se encontraron sucursales registradas
          </Text>
          <Text size="xs" className="text-zinc-600 mt-1">
            Intenta con otro término de búsqueda o registra una nueva sucursal
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursalesFiltradas.map((sucursal) => (
            <SucursalCard 
              key={sucursal.id_sucursal} 
              sucursal={sucursal} 
            />
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <ModalEstandar
        opened={openedCreate}
        close={closeCreate}
        title="Registrar Sucursal"
        size="md"
      >
        <RegistroSucursal
          nombre={registro.nombre}
          setNombre={registro.setNombre}
          idDepartamento={registro.idDepartamento}
          setIdDepartamento={registro.setIdDepartamento}
          idProvincia={registro.idProvincia}
          setIdProvincia={registro.setIdProvincia}
          idDistrito={registro.idDistrito}
          setIdDistrito={registro.setIdDistrito}
          direccion={registro.direccion}
          setDireccion={registro.setDireccion}
          telefono={registro.telefono}
          setTelefono={registro.setTelefono}
          departamentos={registro.departamentos}
          provincias={registro.provincias}
          distritos={registro.distritos}
          loading={registro.loading}
          loadingProvincias={registro.loadingProvincias}
          loadingDistritos={registro.loadingDistritos}
          error={registro.error}
          onSave={registro.handleGuardar}
          onCancel={() => {
            closeCreate();
            registro.reset();
          }}
        />
      </ModalEstandar>
    </div>
  );
};

export default SucursalesPage;
