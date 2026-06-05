import { useState, useEffect, useCallback } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { SucursalesService } from "../service/sucursales.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Sucursal, RES_Departamento, RES_Provincia, RES_Distrito } from "../service/sucursales.responses";

interface UseRegistrarSucursalProps {
  onSuccess?: (nueva: RES_Sucursal) => void;
  onClose: () => void;
}

export const useRegistrarSucursal = ({
  onSuccess,
  onClose,
}: UseRegistrarSucursalProps) => {
  const { notify } = useNotify();

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [idDepartamento, setIdDepartamento] = useState<number | null>(null);
  const [idProvincia, setIdProvincia] = useState<number | null>(null);
  const [idDistrito, setIdDistrito] = useState<number | null>(null);
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");

  // Listas de ubicación
  const [departamentos, setDepartamentos] = useState<RES_Departamento[]>([]);
  const [provincias, setProvincias] = useState<RES_Provincia[]>([]);
  const [distritos, setDistritos] = useState<RES_Distrito[]>([]);

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(false);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);
  const [error, setError] = useState("");

  // Reset del formulario
  const reset = useCallback(() => {
    setNombre("");
    setIdDepartamento(null);
    setIdProvincia(null);
    setIdDistrito(null);
    setDireccion("");
    setTelefono("");
    setProvincias([]);
    setDistritos([]);
    setError("");
  }, []);

  // Cargar departamentos al montar
  useEffect(() => {
    const cargarDepartamentos = async () => {
      try {
        const result = await AuxService.get_departamentos();
        if (result.success) {
          setDepartamentos(result.data);
        } else {
          console.error(result.message);
        }
      } catch (err) {
        console.error("Error al cargar departamentos", err);
      }
    };
    cargarDepartamentos();
  }, []);

  // Cargar provincias cuando cambia el departamento
  useEffect(() => {
    if (!idDepartamento) {
      setProvincias([]);
      setIdProvincia(null);
      setDistritos([]);
      setIdDistrito(null);
      return;
    }

    const cargarProvincias = async () => {
      setLoadingProvincias(true);
      try {
        const result = await AuxService.get_provincias(idDepartamento);
        if (result.success) {
          setProvincias(result.data);
        } else {
          notify({ type: "error", content: result.message });
        }
      } catch (err) {
        console.error(err);
        notify({ type: "error", content: "Error al cargar provincias" });
      } finally {
        setLoadingProvincias(false);
      }
    };

    cargarProvincias();
    setIdProvincia(null);
    setDistritos([]);
    setIdDistrito(null);
  }, [idDepartamento, notify]);

  // Cargar distritos cuando cambia la provincia
  useEffect(() => {
    if (!idProvincia) {
      setDistritos([]);
      setIdDistrito(null);
      return;
    }

    const cargarDistritos = async () => {
      setLoadingDistritos(true);
      try {
        const result = await AuxService.get_distritos(idProvincia);
        if (result.success) {
          setDistritos(result.data);
        } else {
          notify({ type: "error", content: result.message });
        }
      } catch (err) {
        console.error(err);
        notify({ type: "error", content: "Error al cargar distritos" });
      } finally {
        setLoadingDistritos(false);
      }
    };

    cargarDistritos();
    setIdDistrito(null);
  }, [idProvincia, notify]);

  // Guardar sucursal
  const handleGuardar = async () => {
    setError("");

    const payload = {
      nombre,
      id_departamento: idDepartamento,
      id_provincia: idProvincia,
      id_distrito: idDistrito,
      direccion: direccion || null,
      telefono: telefono || null,
    };

    if (!nombre) {
      setError("El nombre de la sucursal es obligatorio");
      return;
    }

    if (nombre.length < 3) {
      setError("El nombre de la sucursal debe tener al menos 3 caracteres");
      return;
    }

    if (direccion && direccion.length > 512) {
      setError("La dirección no puede exceder los 512 caracteres");
      return;
    }

    if (telefono && telefono.length > 64) {
      setError("El teléfono no puede exceder los 64 caracteres");
      return;
    }

    setLoading(true);
    try {
      const result = await SucursalesService.crear_sucursal(payload);
      if (result.success) {
        notify({
          type: "success",
          content: "Sucursal registrada correctamente",
        });
        onSuccess?.(result.data);
        onClose();
        reset();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Error inesperado al registrar la sucursal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    nombre,
    setNombre,
    idDepartamento,
    setIdDepartamento,
    idProvincia,
    setIdProvincia,
    idDistrito,
    setIdDistrito,
    direccion,
    setDireccion,
    telefono,
    setTelefono,

    // Colecciones de Ubicación
    departamentos,
    provincias,
    distritos,

    // Carga & UI
    loading,
    loadingProvincias,
    loadingDistritos,
    error,
    handleGuardar,
    reset,
  };
};
