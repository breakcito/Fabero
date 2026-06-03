import { useBlackcitoStore } from "../stores/blackcito.store";
import type { BlackcitoEmotion } from "../presentation/assets/blackcito/blackcito-assets";

export const useBlackcito = () => {
  const { visible, emotion, message, show, hide } = useBlackcitoStore();

  const say = (emotion: BlackcitoEmotion, text: string) => {
    show(emotion, text);
  };

  const happy = (text: string) => say("feliz", text);
  const angry = (text: string) => say("enojado", text);

  return {
    visible,
    emotion,
    message,
    say,
    happy,
    angry,
    close: hide,
  };
};
