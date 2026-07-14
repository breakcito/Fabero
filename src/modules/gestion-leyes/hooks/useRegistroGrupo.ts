import { useState, useMemo } from "react";
import type { GrupoAnalisisResponse, AnalitoResponse } from "../service/gestion-leyes.responses";
import type { CrearGrupoPayload } from "../service/gestion-leyes.requests";
import type { AnalitoAsociado } from "../presentation/components/tabla-analitos-asociados";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

interface UseRegistroGrupoProps {
  grupo: GrupoAnalisisResponse | null;
  todosLosGrupos: GrupoAnalisisResponse[];
  analitosDisponibles: AnalitoResponse[];
  onSuccess: (id: number | null, payload: CrearGrupoPayload) => Promise<boolean>;
  onCancel: () => void;
}

export const useRegistroGrupo = ({
  grupo,
  todosLosGrupos,
  analitosDisponibles,
  onSuccess,
  onCancel,
}: UseRegistroGrupoProps) => {
  const [nombre, setNombre] = useState(grupo?.nombre ?? "");
  const [orden, setOrden] = useState<number>(grupo?.orden ?? 0);
  const [indicarOrigen, setIndicarOrigen] = useState(grupo?.indicar_origen ?? false);
  const [asociados, setAsociados] = useState<AnalitoAsociado[]>(
    grupo
      ? grupo.analitos.map((a) => ({
          id_analito: a.id_analito,
          nombre: a.nombre,
          es_desplegable: a.es_desplegable,
          para_valorizacion_oro: a.para_valorizacion_oro,
          para_valorizacion_plata: a.para_valorizacion_plata,
          para_valorizacion_humedad: a.para_valorizacion_humedad,
          para_valorizacion_recuperacion: a.para_valorizacion_recuperacion,
        }))
      : []
  );
  const [analitoSeleccionado, setAnalitoSeleccionado] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para controlar diálogos abiertos
  const [openedCrearAnalito, setOpenedCrearAnalito] = useState(false);
  const [analitoEditar, setAnalitoEditar] = useState<AnalitoResponse | null>(null);

  // Calcular banderas ocupadas en OTROS grupos
  const banderasOcupadas = useMemo(() => {
    const ocupadas = {
      oro: false,
      plata: false,
      humedad: false,
      recuperacion: false,
    };

    todosLosGrupos.forEach((g) => {
      // Ignorar el grupo actual que estamos editando
      if (grupo && g.id === grupo.id) return;

      g.analitos.forEach((a) => {
        if (a.para_valorizacion_oro) ocupadas.oro = true;
        if (a.para_valorizacion_plata) ocupadas.plata = true;
        if (a.para_valorizacion_humedad) ocupadas.humedad = true;
        if (a.para_valorizacion_recuperacion) ocupadas.recuperacion = true;
      });
    });

    return ocupadas;
  }, [todosLosGrupos, grupo]);

  // Filtrar analitos que ya están asociados
  const analitosFiltrados = useMemo(() => {
    return analitosDisponibles.filter(
      (a) => !asociados.some((asoc) => asoc.id_analito === a.id)
    );
  }, [analitosDisponibles, asociados]);

  const handleStartEditarAnalito = (idAnalito: number, nombre: string, esDesplegable: boolean) => {
    setAnalitoEditar({
      id: idAnalito,
      nombre,
      es_desplegable: esDesplegable,
      estado: EstadoBase.Activo,
    });
  };

  const handleAgregarAnalito = () => {
    if (!analitoSeleccionado) return;
    const id = Number(analitoSeleccionado);
    const analito = analitosDisponibles.find((a) => a.id === id);

    if (analito) {
      setAsociados((prev) => [
        ...prev,
        {
          id_analito: analito.id,
          nombre: analito.nombre,
          es_desplegable: analito.es_desplegable,
          para_valorizacion_oro: false,
          para_valorizacion_plata: false,
          para_valorizacion_humedad: false,
          para_valorizacion_recuperacion: false,
        },
      ]);
      setAnalitoSeleccionado(null);
    }
  };

  const handleAsociarNuevoAnalito = (nuevo: AnalitoResponse) => {
    setAsociados((prev) => [
      ...prev,
      {
        id_analito: nuevo.id,
        nombre: nuevo.nombre,
        es_desplegable: nuevo.es_desplegable,
        para_valorizacion_oro: false,
        para_valorizacion_plata: false,
        para_valorizacion_humedad: false,
        para_valorizacion_recuperacion: false,
      },
    ]);
  };

  const handleAnalitoEditadoLocalmente = (id: number, nombreEditar: string) => {
    setAsociados((prev) =>
      prev.map((a) => (a.id_analito === id ? { ...a, nombre: nombreEditar } : a))
    );
  };

  const handleQuitarAnalito = (idAnalito: number) => {
    setAsociados((prev) => prev.filter((a) => a.id_analito !== idAnalito));
  };

  const handleOptionChange = (idAnalito: number, val: string) => {
    setAsociados((prev) => {
      return prev.map((item) => {
        if (item.id_analito === idAnalito) {
          // Asigna la opción seleccionada y apaga las demás en la misma fila
          return {
            ...item,
            para_valorizacion_oro: val === "oro",
            para_valorizacion_plata: val === "plata",
            para_valorizacion_humedad: val === "humedad",
            para_valorizacion_recuperacion: val === "recuperacion",
          };
        } else {
          // Apaga la bandera correspondiente en las otras filas (Exclusividad a nivel de grupo)
          return {
            ...item,
            para_valorizacion_oro: val === "oro" ? false : item.para_valorizacion_oro,
            para_valorizacion_plata: val === "plata" ? false : item.para_valorizacion_plata,
            para_valorizacion_humedad: val === "humedad" ? false : item.para_valorizacion_humedad,
            para_valorizacion_recuperacion: val === "recuperacion" ? false : item.para_valorizacion_recuperacion,
          };
        }
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload: CrearGrupoPayload = {
      nombre,
      orden,
      indicar_origen: indicarOrigen,
      analitos: asociados.map((a) => ({
        id_analito: a.id_analito,
        para_valorizacion_oro: a.para_valorizacion_oro,
        para_valorizacion_plata: a.para_valorizacion_plata,
        para_valorizacion_humedad: a.para_valorizacion_humedad,
        para_valorizacion_recuperacion: a.para_valorizacion_recuperacion,
      })),
    };

    setSaving(true);
    const idGrupo = grupo ? grupo.id : null;
    const success = await onSuccess(idGrupo, payload);
    setSaving(false);
    if (success) {
      onCancel();
    }
  };

  return {
    nombre,
    setNombre,
    orden,
    setOrden,
    indicarOrigen,
    setIndicarOrigen,
    asociados,
    analitoSeleccionado,
    setAnalitoSeleccionado,
    saving,
    openedCrearAnalito,
    setOpenedCrearAnalito,
    analitoEditar,
    setAnalitoEditar,
    banderasOcupadas,
    analitosFiltrados,
    handleStartEditarAnalito,
    handleAgregarAnalito,
    handleAsociarNuevoAnalito,
    handleAnalitoEditadoLocalmente,
    handleQuitarAnalito,
    handleOptionChange,
    handleSubmit,
  };
};
