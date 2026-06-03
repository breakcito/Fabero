import { useState, useEffect, useCallback } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { RolesService } from "../service/roles.service";
import { Schema_RegistroRol } from "../service/roles.requests";
import type { RES_Rol, RES_MenuEstructura } from "../service/roles.responses";

interface UseRegistroRolProps {
  onSuccess?: (nuevo: RES_Rol) => void;
  onUpdateSuccess?: () => void;
  onClose: () => void;
  rolEdicion?: RES_Rol | null;
}

export const useRegistroRol = ({
  onSuccess,
  onUpdateSuccess,
  onClose,
  rolEdicion,
}: UseRegistroRolProps) => {
  const { notify } = useNotify();

  // Estructura de permisos (Catálogo)
  const [estructura, setEstructura] = useState<RES_MenuEstructura[]>([]);
  const [loadingEstructura, setLoadingEstructura] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [modulosSeleccionados, setModulosSeleccionados] = useState<number[]>(
    [],
  );

  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargarEstructura = useCallback(async () => {
    setLoadingEstructura(true);
    try {
      const result = await RolesService.get_estructura_permisos();
      if (result.success) {
        setEstructura(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEstructura(false);
    }
  }, []);

  useEffect(() => {
    cargarEstructura();
  }, [cargarEstructura]);

  const cargarPermisosRol = useCallback(async (id: number) => {
    setLoadingPermisos(true);
    try {
      const result = await RolesService.get_permisos_rol(id);
      if (result.success) {
        setModulosSeleccionados(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPermisos(false);
    }
  }, []);

  const reset = useCallback(() => {
    setNombre("");
    setDescripcion("");
    setModulosSeleccionados([]);
  }, []);

  useEffect(() => {
    if (rolEdicion) {
      setNombre(rolEdicion.nombre);
      setDescripcion(rolEdicion.descripcion || "");
      cargarPermisosRol(rolEdicion.id);
    } else {
      reset();
    }
  }, [rolEdicion, cargarPermisosRol, reset]);

  const handleToggleModulo = (idModulo: number) => {
    setModulosSeleccionados((prev) =>
      prev.includes(idModulo)
        ? prev.filter((id) => id !== idModulo)
        : [...prev, idModulo],
    );
  };

  /**
   * Toggle de todos los modulos de un submenu
   */
  const handleToggleSubmenu = (idsModulos: number[], isChecked: boolean) => {
    setModulosSeleccionados((prev) => {
      if (isChecked) {
        // Añadir solo los que no están
        const nuevas = idsModulos.filter((id) => !prev.includes(id));
        return [...prev, ...nuevas];
      } else {
        // Quitar todos los de ese submenu
        return prev.filter((id) => !idsModulos.includes(id));
      }
    });
  };

  const handleGuardar = async () => {
    const data = {
      nombre,
      descripcion,
      modulos: modulosSeleccionados,
    };

    const validation = Schema_RegistroRol.safeParse(data);
    if (!validation.success) {
      notify({
        type: "error",
        content: validation.error.issues[0].message,
      });
      return;
    }

    setSaving(true);
    try {
      if (rolEdicion) {
        // MODO EDICIÓN: Solo actualiza permisos
        const result = await RolesService.actualizar_permisos_rol(
          rolEdicion.id,
          modulosSeleccionados,
        );
        if (result.success) {
          notify({
            type: "success",
            content: "Permisos actualizados correctamente",
          });
          onUpdateSuccess?.();
          onClose();
          reset();
        } else {
          notify({
            type: "error",
            content: result.message,
          });
        }
      } else {
        // MODO CREACIÓN
        const result = await RolesService.crear_rol(validation.data);
        if (result.success) {
          notify({
            type: "success",
            content: "Rol registrado correctamente",
          });
          onSuccess?.(result.data);
          onClose();
          reset();
        } else {
          notify({
            type: "error",
            content: result.message,
          });
        }
      }
    } catch (err) {
      notify({
        type: "error",
        content: "Error inesperado al procesar el rol",
      });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return {
    estructura,
    loadingEstructura,
    loadingPermisos,
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    modulosSeleccionados,
    handleToggleModulo,
    handleToggleSubmenu,
    handleGuardar,
    saving,
    reset,
  };
};
