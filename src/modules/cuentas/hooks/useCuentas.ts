import { useState, useEffect, useMemo, useCallback } from "react";
import { CuentasService } from "../service/cuentas.service";
import { useDisclosure } from "@mantine/hooks";
import type {
  RES_Cuenta,
  RES_RolDisponible,
} from "../service/cuentas.responses";
import type { RES_Empleado } from "../../../service/responses/empleado";
import { useNotify } from "../../../hooks/useNotify";

export const useCuentas = () => {
  const [cuentas, setCuentas] = useState<RES_Cuenta[]>([]);
  const [roles, setRoles] = useState<RES_RolDisponible[]>([]);
  const [empleadosSinCuenta, setEmpleadosSinCuenta] = useState<RES_Empleado[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const { notify } = useNotify();
  const [updatingPhoto, setUpdatingPhoto] = useState<number | null>(null);

  // Modales
  const [openedCreate, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);

  const [selectedCuenta, setSelectedCuenta] = useState<RES_Cuenta | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resCuentas, resRoles, resEmpleados] = await Promise.all([
        CuentasService.fetchCuentas(),
        CuentasService.fetchRolesDisponibles(),
        CuentasService.fetchEmpleadosSinCuenta(),
      ]);

      if (resCuentas.success) setCuentas(resCuentas.data);
      if (resRoles.success) setRoles(resRoles.data);
      if (resEmpleados.success) setEmpleadosSinCuenta(resEmpleados.data);
    } catch (error) {
      console.error("Error cargando datos de cuentas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter(
      (c) =>
        c.username.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.nombre_empleado.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.apellido_empleado.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.nombre_rol.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [cuentas, busqueda]);

  const handleOpenEdit = (cuenta: RES_Cuenta) => {
    setSelectedCuenta(cuenta);
    openCreate();
  };

  const handleUpdatePhoto = async (idEmpleado: number, file: File) => {
    setUpdatingPhoto(idEmpleado);
    try {
      const res = await CuentasService.actualizarFoto(idEmpleado, file);
      if (res.success) {
        notify({ type: "success", content: "Foto actualizada correctamente" });
        // Actualización local sin recargar todo el listado
        setCuentas((prev) =>
          prev.map((c) =>
            c.id_empleado === idEmpleado
              ? { ...c, path_foto: res.data.url }
              : c,
          ),
        );
      } else {
        notify({ type: "error", content: res.message });
      }
    } catch {
      notify({ type: "error", content: "Error al actualizar la foto" });
    } finally {
      setUpdatingPhoto(null);
    }
  };

  return {
    cuentasFiltradas,
    roles,
    empleadosSinCuenta,
    loading,
    busqueda,
    setBusqueda,
    openedCreate,
    openCreate,
    closeCreate,
    selectedCuenta,
    setSelectedCuenta,
    handleOpenEdit,
    handleUpdatePhoto,
    updatingPhoto,
    refresh: cargarDatos,
  };
};
