import { create } from "zustand";
import { AuxService } from "../service/auxiliar.service";
import type {
  RES_PreciosInterVigentes,
  RES_ValorElementoQuimico,
} from "../service/responses/valor-elemento-quimico";

interface PrecioInterState {
  preciosVigentes: RES_PreciosInterVigentes;
  loading: boolean;
  fetchPreciosVigentes: (fecha?: string) => Promise<void>;
  setPrecioElemento: (
    elemento: "Oro" | "Plata",
    data: RES_ValorElementoQuimico | null,
  ) => void;
}

export const usePrecioInterStore = create<PrecioInterState>((set) => ({
  preciosVigentes: {
    Oro: null,
    Plata: null,
    ultimo_oro: null,
    ultimo_plata: null,
    registrado_hoy: false,
  },
  loading: false,

  fetchPreciosVigentes: async (fecha?: string) => {
    set({ loading: true });
    try {
      const res = await AuxService.get_precios_inter_vigentes(fecha);
      if (res.success && res.data) {
        set({ preciosVigentes: res.data });
      }
    } catch (err) {
      console.error("Error al obtener precios INTER vigentes:", err);
    } finally {
      set({ loading: false });
    }
  },

  setPrecioElemento: (elemento, data) =>
    set((state) => ({
      preciosVigentes: {
        ...state.preciosVigentes,
        [elemento]: data,
      },
    })),
}));
