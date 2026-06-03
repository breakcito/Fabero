import { create } from "zustand";
import type { BlackcitoEmotion } from "../presentation/assets/blackcito/blackcito-assets";

interface BlackcitoState {
  visible: boolean;
  emotion: BlackcitoEmotion;
  message: string;
  show: (emotion: BlackcitoEmotion, message: string) => void;
  hide: () => void;
}

export const useBlackcitoStore = create<BlackcitoState>((set) => ({
  visible: false,
  emotion: "feliz",
  message: "",
  show: (emotion, message) => set({ visible: true, emotion, message }),
  hide: () => set({ visible: false }),
}));
