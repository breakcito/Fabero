import { useState, useCallback, useEffect, useRef } from "react";
import { CierreLeyesService } from "../service/cierre-leyes.service";
import { AuxService } from "../../../service/auxiliar.service";
import type {
  LoteSugeridoResponse,
  LoteCierreResponse,
  MuestraExternaResponse,
  MuestraAsociadaResponse,
  IArchivoDoc,
  GrupoAnalisisLoteResponse,
  AnalisisMineralResponse,
} from "../service/cierre-leyes.responses";
import type { RES_Laboratorio } from "../../../service/responses/laboratorio";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import { useNotify } from "../../../hooks/useNotify";
import type {
  FiltrosLotesSugeridos,
  CrearGrupoPayload,
  AgregarAnalisisGrupoPayload,
  GuardarValoresAnalisisPayload,
  GuardarLeyesCierreGrupoPayload,
  IniciarMuestraPayload,
} from "../service/cierre-leyes.service";

export const useCierreLeyes = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [lotes, setLotes] = useState<LoteCierreResponse[]>([]);
  const [lotesSugeridos, setLotesSugeridos] = useState<LoteSugeridoResponse[]>([]);
  const [laboratorios, setLaboratorios] = useState<RES_Laboratorio[]>([]);
  const [muestras, setMuestras] = useState<MuestraExternaResponse[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSugeridos, setLoadingSugeridos] = useState(false);
  const [loadingLaboratorios, setLoadingLaboratorios] = useState(false);
  const [loadingMuestras, setLoadingMuestras] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const [guardandoValorPorAnalisis, setGuardandoValorPorAnalisis] = useState<Record<number, boolean>>({});
  const [guardandoCierrePorGrupo, setGuardandoCierrePorGrupo] = useState<Record<number, boolean>>({});
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [iniciandoMuestra, setIniciandoMuestra] = useState(false);
  const [agregandoAnalisis, setAgregandoAnalisis] = useState<Record<number, boolean>>({});
  const [eliminandoAnalisis, setEliminandoAnalisis] = useState<Record<number, boolean>>({});
  const [confirmandoLote, setConfirmandoLote] = useState<Record<number, boolean>>({});
  const [asociandoMuestra, setAsociandoMuestra] = useState<Record<number, boolean>>({});
  const [subiendoDocsPorAnalisis, setSubiendoDocsPorAnalisis] = useState<Record<number, boolean>>({});

  const [muestrasAsociadasPorGrupo, setMuestrasAsociadasPorGrupo] = useState<Record<number, MuestraAsociadaResponse[]>>({});

  const lotesRef = useRef(lotes);
  useEffect(() => {
    lotesRef.current = lotes;
  }, [lotes]);

  const cargarLotes = useCallback(async (filtros?: FiltrosLotesSugeridos) => {
    setLoading(true);
    try {
      const data = await CierreLeyesService.getLotesCierre(filtros);
      setLotes(data ?? []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes de cierre");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const cargarLotesSugeridos = useCallback(async () => {
    setLoadingSugeridos(true);
    try {
      const data = await CierreLeyesService.getLotesSugeridos();
      setLotesSugeridos(data ?? []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes sugeridos");
    } finally {
      setLoadingSugeridos(false);
    }
  }, [notifyError]);

  const cargarLaboratorios = useCallback(async () => {
    setLoadingLaboratorios(true);
    try {
      const data = await AuxService.get_laboratorios();
      setLaboratorios(data ?? []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar laboratorios");
    } finally {
      setLoadingLaboratorios(false);
    }
  }, [notifyError]);

  const cargarMuestras = useCallback(async () => {
    setLoadingMuestras(true);
    try {
      const data = await CierreLeyesService.getMuestrasExternas();
      setMuestras(data ?? []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar las muestras externas");
    } finally {
      setLoadingMuestras(false);
    }
  }, [notifyError]);

  const cargarProveedores = useCallback(async () => {
    setLoadingProveedores(true);
    try {
      const res = await AuxService.get_proveedores();
      setProveedores(res.data ?? []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingProveedores(false);
    }
  }, []);

  const crearGrupo = useCallback(async (payload: CrearGrupoPayload): Promise<boolean> => {
    setCreandoGrupo(true);
    try {
      await CierreLeyesService.crearGrupo(payload);
      notifySuccess("Grupo de análisis creado correctamente");
      await Promise.all([cargarLotes(), cargarLotesSugeridos()]);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al crear el grupo de análisis");
      return false;
    } finally {
      setCreandoGrupo(false);
    }
  }, [cargarLotes, cargarLotesSugeridos, notifySuccess, notifyError]);

  const agregarAnalisisGrupo = useCallback(async (idGrupo: number, payload: AgregarAnalisisGrupoPayload): Promise<boolean> => {
    setAgregandoAnalisis((prev) => ({ ...prev, [idGrupo]: true }));
    try {
      await CierreLeyesService.agregarAnalisisGrupo(idGrupo, payload);
      const count = payload.analisis?.length ?? 1;
      notifySuccess(count > 1 ? `${count} análisis agregados al grupo` : "Análisis agregado correctamente al grupo");
      await cargarLotes();
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al agregar análisis al grupo");
      return false;
    } finally {
      setAgregandoAnalisis((prev) => ({ ...prev, [idGrupo]: false }));
    }
  }, [cargarLotes, notifySuccess, notifyError]);

  const agregarAnalisisMuestraExterna = useCallback(
    async (idMuestraExterna: number, payload: AgregarAnalisisGrupoPayload): Promise<boolean> => {
      setAgregandoAnalisis((prev) => ({ ...prev, [idMuestraExterna]: true }));
      try {
        await CierreLeyesService.agregarAnalisisMuestraExterna(idMuestraExterna, payload);
        const count = payload.analisis?.length ?? 1;
        notifySuccess(count > 1 ? `${count} análisis agregados a la muestra` : "Análisis agregado correctamente a la muestra");
        await cargarMuestras();
        return true;
      } catch (err: unknown) {
        console.error(err);
        notifyError("Error al agregar análisis a la muestra");
        return false;
      } finally {
        setAgregandoAnalisis((prev) => ({ ...prev, [idMuestraExterna]: false }));
      }
    },
    [cargarMuestras, notifySuccess, notifyError]
  );

  const guardarValoresAnalisis = useCallback(
    async (idAnalisis: number, payload: GuardarValoresAnalisisPayload): Promise<boolean> => {
      setGuardandoValorPorAnalisis((prev) => ({ ...prev, [idAnalisis]: true }));

      setMuestras((prevMuestras) =>
        prevMuestras.map((muestra) => {
          const tieneEsteAnalisis = muestra.analisis.some((an) => an.id === idAnalisis);
          if (!tieneEsteAnalisis) return muestra;

          const esHumedadORec = "ley_humedad" in payload || "ley_recuperacion" in payload;

          return {
            ...muestra,
            analisis: muestra.analisis.map((an: AnalisisMineralResponse) => {
              if (esHumedadORec) {
                return { ...an, ...payload };
              }
              return an.id === idAnalisis ? { ...an, ...payload } : an;
            }),
          };
        })
      );

      setLotes((prevLotes) =>
        prevLotes.map((lote) => {
          const updateGrupo = (g: GrupoAnalisisLoteResponse): GrupoAnalisisLoteResponse => {
            const tieneEsteAnalisis = g.analisis.some((an) => an.id === idAnalisis);
            if (!tieneEsteAnalisis) return g;

            const esHumedadORec = "ley_humedad" in payload || "ley_recuperacion" in payload;

            return {
              ...g,
              analisis: g.analisis.map((an: AnalisisMineralResponse) => {
                if (esHumedadORec) {
                  return { ...an, ...payload };
                }
                return an.id === idAnalisis ? { ...an, ...payload } : an;
              }),
            };
          };

          return {
            ...lote,
            grupo_analisis: lote.grupo_analisis ? updateGrupo(lote.grupo_analisis) : null,
            grupos_analisis: lote.grupos_analisis ? lote.grupos_analisis.map(updateGrupo) : undefined,
          };
        })
      );

      try {
        await CierreLeyesService.guardarValoresAnalisis(idAnalisis, payload);
        void Promise.all([cargarLotes(), cargarMuestras()]);
        return true;
      } catch (err: unknown) {
        console.error(err);
        notifyError("Error al guardar valores de ley");
        void Promise.all([cargarLotes(), cargarMuestras()]);
        return false;
      } finally {
        setGuardandoValorPorAnalisis((prev) => ({ ...prev, [idAnalisis]: false }));
      }
    },
    [cargarLotes, cargarMuestras, notifyError]
  );

  const guardarLeyesCierreGrupo = useCallback(async (idGrupo: number, payload: GuardarLeyesCierreGrupoPayload): Promise<boolean> => {
    setGuardandoCierrePorGrupo((prev) => ({ ...prev, [idGrupo]: true }));
    try {
      await CierreLeyesService.guardarLeyesCierreGrupo(idGrupo, payload);
      notifySuccess("Leyes de cierre guardadas correctamente");
      await cargarLotes();
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al guardar leyes de cierre");
      return false;
    } finally {
      setGuardandoCierrePorGrupo((prev) => ({ ...prev, [idGrupo]: false }));
    }
  }, [cargarLotes, notifySuccess, notifyError]);

  const subirDocumentos = useCallback(
    async (idAnalisis: number, archivos: File[]): Promise<IArchivoDoc[] | null> => {
      setSubiendoDocsPorAnalisis((prev) => ({ ...prev, [idAnalisis]: true }));
      try {
        const docsActualizados = await CierreLeyesService.subirDocumentosAnalisis(idAnalisis, archivos);
        notifySuccess("Documento adjuntado correctamente");

        setLotes((prevLotes) =>
          prevLotes.map((lote) => {
            const updateGrupo = (g: GrupoAnalisisLoteResponse): GrupoAnalisisLoteResponse => ({
              ...g,
              analisis: g.analisis.map((an: AnalisisMineralResponse) =>
                an.id === idAnalisis ? { ...an, documentos: docsActualizados } : an
              ),
            });

            return {
              ...lote,
              grupo_analisis: lote.grupo_analisis ? updateGrupo(lote.grupo_analisis) : null,
              grupos_analisis: lote.grupos_analisis ? lote.grupos_analisis.map(updateGrupo) : undefined,
            };
          })
        );

        setMuestras((prevMuestras) =>
          prevMuestras.map((muestra) => ({
            ...muestra,
            analisis: muestra.analisis.map((an: AnalisisMineralResponse) =>
              an.id === idAnalisis ? { ...an, documentos: docsActualizados } : an
            ),
          }))
        );

        void Promise.all([cargarLotes(), cargarMuestras()]);

        return docsActualizados;
      } catch (err: unknown) {
        console.error(err);
        notifyError("Error al subir documentos");
        return null;
      } finally {
        setSubiendoDocsPorAnalisis((prev) => ({ ...prev, [idAnalisis]: false }));
      }
    },
    [cargarLotes, cargarMuestras, notifySuccess, notifyError]
  );

  const eliminarAnalisis = useCallback(async (idAnalisis: number): Promise<boolean> => {
    setEliminandoAnalisis((prev) => ({ ...prev, [idAnalisis]: true }));
    try {
      await CierreLeyesService.eliminarAnalisis(idAnalisis);
      notifySuccess("Análisis eliminado");
      await Promise.all([cargarLotes(), cargarMuestras()]);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al eliminar análisis");
      return false;
    } finally {
      setEliminandoAnalisis((prev) => ({ ...prev, [idAnalisis]: false }));
    }
  }, [cargarLotes, cargarMuestras, notifySuccess, notifyError]);

  const confirmarLote = useCallback(async (idLote: number, conValorComercial: boolean): Promise<boolean> => {
    setConfirmandoLote((prev) => ({ ...prev, [idLote]: true }));
    try {
      await CierreLeyesService.confirmarLote(idLote, conValorComercial);
      notifySuccess("Lote cerrado correctamente");
      await cargarLotes();
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al cerrar lote");
      return false;
    } finally {
      setConfirmandoLote((prev) => ({ ...prev, [idLote]: false }));
    }
  }, [cargarLotes, notifySuccess, notifyError]);

  const iniciarMuestraExterna = useCallback(async (payload: IniciarMuestraPayload): Promise<boolean> => {
    setIniciandoMuestra(true);
    try {
      await CierreLeyesService.iniciarMuestraExterna(payload);
      notifySuccess("Muestra externa creada");
      await cargarMuestras();
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al crear muestra externa");
      return false;
    } finally {
      setIniciandoMuestra(false);
    }
  }, [cargarMuestras, notifySuccess, notifyError]);

  const asociarMuestraAGrupo = useCallback(async (idMuestraExterna: number, idGrupo: number): Promise<boolean> => {
    setAsociandoMuestra((prev) => ({ ...prev, [idMuestraExterna]: true }));
    try {
      await CierreLeyesService.asociarMuestraAGrupo(idMuestraExterna, idGrupo);
      notifySuccess("Muestra asociada al grupo correctamente");
      await Promise.all([cargarLotes(), cargarMuestras()]);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al asociar muestra");
      return false;
    } finally {
      setAsociandoMuestra((prev) => ({ ...prev, [idMuestraExterna]: false }));
    }
  }, [cargarLotes, cargarMuestras, notifySuccess, notifyError]);

  const asociarMuestrasMultiplesAGrupo = useCallback(async (idsMuestraExterna: number[], idGrupo: number) => {
    try {
      idsMuestraExterna.forEach((id) => setAsociandoMuestra((prev) => ({ ...prev, [id]: true })));
      await CierreLeyesService.asociarMuestrasMultiplesAGrupo(idsMuestraExterna, idGrupo);
      notifySuccess(`${idsMuestraExterna.length} muestras asociadas al grupo correctamente`);
      await Promise.all([cargarLotes(), cargarMuestras()]);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al asociar muestras");
      return false;
    } finally {
      idsMuestraExterna.forEach((id) => setAsociandoMuestra((prev) => ({ ...prev, [id]: false })));
    }
  }, [cargarLotes, cargarMuestras, notifySuccess, notifyError]);

  const cargarMuestrasAsociadas = useCallback(async (idGrupo: number): Promise<MuestraAsociadaResponse[]> => {
    try {
      const data = await CierreLeyesService.getMuestrasAsociadasPorGrupo(idGrupo);
      setMuestrasAsociadasPorGrupo((prev) => ({ ...prev, [idGrupo]: data }));
      return data;
    } catch (err: unknown) {
      console.error(err);
      return [];
    }
  }, []);

  return {
    lotes,
    lotesSugeridos,
    laboratorios,
    muestras,
    proveedores,
    loading,
    loadingSugeridos,
    loadingLaboratorios,
    loadingMuestras,
    loadingProveedores,
    creandoGrupo,
    iniciandoMuestra,
    agregandoAnalisis,
    eliminandoAnalisis,
    guardandoValorPorAnalisis,
    guardandoCierrePorGrupo,
    confirmandoLote,
    asociandoMuestra,
    subiendoDocsPorAnalisis,
    muestrasAsociadasPorGrupo,
    cargarLotes,
    cargarLotesSugeridos,
    cargarLaboratorios,
    cargarMuestras,
    cargarProveedores,
    crearGrupo,
    agregarAnalisisGrupo,
    agregarAnalisisMuestraExterna,
    guardarValoresAnalisis,
    guardarLeyesCierreGrupo,
    subirDocumentos,
    eliminarAnalisis,
    confirmarLote,
    iniciarMuestraExterna,
    asociarMuestraAGrupo,
    asociarMuestrasMultiplesAGrupo,
    cargarMuestrasAsociadas,
  };
};
