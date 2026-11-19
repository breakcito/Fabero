import { useState, useEffect, useCallback } from "react";
import { CuentasService } from "../service/cuentas.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_Cuenta } from "../service/cuentas.responses";
import type {
  RES_Permiso,
  RES_PermisoCatalogo,
} from "../../../shared/interfaces/permiso";

export const useRegistroCuenta = (
  cuentaEdit: RES_Cuenta | null,
  onClose: () => void,
  refresh: () => void,
) => {
  const [form, setForm] = useState({
    id_empleado: 0,
    id_rol: 0,
    username: "",
    password: "",
    sucursales: [] as number[],
    permisos: [] as RES_Permiso[],
  });
  const [catalogo, setCatalogo] = useState<RES_PermisoCatalogo[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotify();

  const cargarCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const res = await CuentasService.fetchCatalogoPermisos();
      if (res.success) setCatalogo(res.data ?? []);
    } catch (error) {
      console.error(error);
      notify({
        type: "error",
        content: "No se pudo cargar el catálogo de permisos",
      });
    } finally {
      setLoadingCatalogo(false);
    }
  }, [notify]);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  /**
   * Construye la lista de permisos a partir del catálogo.
   * Por defecto todos están en `decision: false`.
   */
  const construirPermisos = useCallback(
    (base: RES_Permiso[]): RES_Permiso[] =>
      catalogo.map((item) => {
        const previo = base.find((p) => p.codigo === item.codigo);
        return {
          codigo: item.codigo,
          nombre: item.nombre,
          decision: previo?.decision ?? false,
        };
      }),
    [catalogo],
  );

  useEffect(() => {
    if (cuentaEdit) {
      setForm({
        id_empleado: cuentaEdit.id_empleado,
        id_rol: cuentaEdit.id_rol,
        username: cuentaEdit.username,
        password: "", // Vacío por defecto al editar
        sucursales: cuentaEdit.sucursales || [],
        permisos: construirPermisos(cuentaEdit.permisos || []),
      });
    } else {
      setForm({
        id_empleado: 0,
        id_rol: 0,
        username: "",
        password: "",
        sucursales: [],
        permisos: construirPermisos([]),
      });
    }
  }, [cuentaEdit, construirPermisos]);

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const togglePermiso = (codigo: string, decision: boolean) => {
    setForm((prev) => ({
      ...prev,
      permisos: prev.permisos.map((p) =>
        p.codigo === codigo ? { ...p, decision } : p,
      ),
    }));
  };

  const handleGuardar = async () => {
    // Validaciones básicas
    if (
      !form.username ||
      !form.id_rol ||
      (!cuentaEdit && !form.password) ||
      (!cuentaEdit && !form.id_empleado)
    ) {
      notify({
        type: "info",
        content: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }

    setLoading(true);
    try {
      let res;
      if (cuentaEdit) {
        res = await CuentasService.actualizarCuenta(cuentaEdit.id_usuario, {
          id_rol: form.id_rol,
          username: form.username,
          password: form.password,
          sucursales: form.sucursales,
          permisos: form.permisos,
        });
      } else {
        res = await CuentasService.crearCuenta({
          id_rol: form.id_rol,
          id_empleado: form.id_empleado,
          username: form.username,
          password: form.password as string,
          sucursales: form.sucursales,
          permisos: form.permisos,
        });
      }

      if (res.success) {
        notify({
          type: "success",
          content: res.message,
        });
        refresh();
        onClose();
      } else {
        notify({
          type: "error",
          content: res.message,
        });
      }
    } catch {
      notify({
        type: "error",
        content: "No se pudo comunicar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    updateForm,
    togglePermiso,
    catalogo,
    loadingCatalogo,
    loading,
    handleGuardar,
    isEdit: !!cuentaEdit,
  };
};
