import { create } from "zustand";
import { AuxService } from "../service/auxiliar.service";
import type { RES_TipoCambio } from "../service/responses/tipo-cambio";

interface TipoCambioState {
  tipoCambioHoy: RES_TipoCambio | null;
  ultimoHistorico: RES_TipoCambio | null;
  registradoHoy: boolean;
  fechaConsultada: string;
  loading: boolean;
  fetchTipoCambioVigente: (fecha?: string) => Promise<void>;
  setTipoCambioHoy: (tc: RES_TipoCambio | null) => void;
}

export const useTipoCambioStore = create<TipoCambioState>((set) => ({
  tipoCambioHoy: null,
  ultimoHistorico: null,
  registradoHoy: false,
  fechaConsultada: "",
  loading: false,

  fetchTipoCambioVigente: async (fecha?: string) => {
    set({ loading: true });
    try {
      const res = await AuxService.get_tipo_cambio_vigente(fecha);
      if (res.success && res.data) {
        set({
          tipoCambioHoy: res.data.tipo_cambio_hoy,
          ultimoHistorico: res.data.ultimo_historico,
          registradoHoy: !!res.data.registrado_hoy,
          fechaConsultada: res.data.fecha_consultada,
        });
      } else {
        set({
          tipoCambioHoy: null,
          ultimoHistorico: null,
          registradoHoy: false,
          fechaConsultada: "",
        });
      }
    } catch (err) {
      console.error("Error al obtener tipo de cambio vigente:", err);
      set({
        tipoCambioHoy: null,
        ultimoHistorico: null,
        registradoHoy: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  setTipoCambioHoy: (tc) =>
    set({
      tipoCambioHoy: tc,
      registradoHoy: tc !== null,
    }),
}));
