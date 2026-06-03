import { useState, useCallback, useEffect, useMemo } from "react";
import { EmpleadosService } from "../service/empleados.service";
import type { RES_EmpleadoResumen } from "../service/empleados.responses";

export const useEmpleados = () => {
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empleados, setEmpleados] = useState<RES_EmpleadoResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [idActualizandoFoto, setIdActualizandoFoto] = useState<number | null>(
    null,
  );

  const listar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await EmpleadosService.get_empleados();
      if (resp.success) setEmpleados(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listar();
  }, [listar]);

  const filtrados = useMemo(() => {
    let results = empleados;

    // Filtro por Empresa
    if (idEmpresa) {
      results = results.filter((e) => e.id_empresa === idEmpresa);
    }

    // Filtro por Búsqueda Local
    const query = busqueda.toLowerCase().trim();
    if (query) {
      results = results.filter(
        (e) =>
          e.nombre.toLowerCase().includes(query) ||
          e.apellido.toLowerCase().includes(query) ||
          e.dni?.includes(query) ||
          e.cargo.toLowerCase().includes(query),
      );
    }

    return results;
  }, [empleados, idEmpresa, busqueda]);

  const pushNuevoEmpleado = (nuevo: RES_EmpleadoResumen) => {
    setEmpleados((prev) => [nuevo, ...prev]);
  };

  const actualizarEmpleadoEnLista = (editado: RES_EmpleadoResumen) => {
    setEmpleados((prev) =>
      prev.map((e) => (e.id_empleado === editado.id_empleado ? editado : e)),
    );
  };

  const actualizarFoto = async (idEmpleado: number, file: File) => {
    setIdActualizandoFoto(idEmpleado);
    try {
      const resp = await EmpleadosService.actualizar_foto(idEmpleado, file);
      if (resp.success) {
        actualizarEmpleadoEnLista(resp.data);
        return true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIdActualizandoFoto(null);
    }
    return false;
  };

  const groupedByCompany = useMemo(() => {
    const groups: Record<
      number,
      { id: number; nombre: string; empleados: RES_EmpleadoResumen[] }
    > = {};

    filtrados.forEach((emp) => {
      const id = emp.id_empresa || 0;
      const nombre = emp.empresa || "Sin empresa asignada";

      if (!groups[id]) {
        groups[id] = { id, nombre, empleados: [] };
      }
      groups[id].empleados.push(emp);
    });

    return Object.values(groups);
  }, [filtrados]);

  const empresasUnicas = useMemo(() => {
    const map = new Map<number, string>();
    empleados.forEach((emp) => {
      if (emp.id_empresa && emp.empresa) {
        map.set(emp.id_empresa, emp.empresa);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({
      id_empresa: id,
      nombre,
    }));
  }, [empleados]);

  return {
    empresas: empresasUnicas,
    idEmpresa,
    setIdEmpresa,
    empleados: filtrados,
    groupedByCompany,
    loading,
    busqueda,
    setBusqueda,
    recargar: () => listar(),
    pushNuevoEmpleado,
    actualizarFoto,
    actualizarEmpleadoEnLista,
    idActualizandoFoto,
  };
};
