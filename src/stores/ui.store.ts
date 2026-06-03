import { create } from "zustand";

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
}));
