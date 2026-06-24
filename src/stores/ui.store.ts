import { create } from "zustand";
import type { RES_Sucursal } from "../service/responses/sucursal";

export interface IMessage {
  type: "success" | "info" | "error" | "";
  content: string;
}

interface UIState {
  title: string;
  setTitle: (title: string) => void;
  message: IMessage;
  notify: (message: IMessage) => void;
  clearMessage: () => void;
  ver_sucursal: boolean;
  set_ver_sucursal: (ver_sucursal: boolean) => void;
  sucursales: RES_Sucursal[];
  set_sucursales: (sucursales: RES_Sucursal[]) => void;
  sucursal_elegida: RES_Sucursal | null;
  set_sucursal_elegida: (sucursal: RES_Sucursal | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  title: "",
  setTitle: (title: string) => {
    set({ title });
    document.title = title ? `${title} | Fabero` : "Fabero";
  },
  message: { type: "", content: "" },
  notify: (message: IMessage) => {
    set({ message });
  },
  clearMessage: () => {
    set({ message: { type: "", content: "" } });
  },
  ver_sucursal: false,
  set_ver_sucursal: (ver_sucursal: boolean) => {
    set({ ver_sucursal });
  },
  sucursales: [],
  set_sucursales: (sucursales: RES_Sucursal[]) => {
    set({ sucursales });
  },
  sucursal_elegida: null,
  set_sucursal_elegida: (sucursal_elegida: RES_Sucursal | null) => {
    set({ sucursal_elegida });
  },
}));
