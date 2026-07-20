/**
 * Smoke test del sistema de notificaciones.
 *
 * Verifica que al disparar notifyWarning, el componente GlobalNotification
 * llama a `notifications.show` de Mantine con titulo "Advertencia".
 *
 * Requiere: vitest + @testing-library/react + @testing-library/jest-dom + zustand.
 * Habilitar cuando se instale el framework de tests del frontend.
 */

import { render } from "@testing-library/react";
import { useUIStore } from "../../../../stores/ui.store";
import { GlobalNotification } from "./global-notification";
import { notifications } from "@mantine/notifications";

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

vi.mock("react-sounds", () => ({
  useSound: () => ({
    play: vi.fn(),
  }),
}));

describe("GlobalNotification", () => {
  beforeEach(() => {
    useUIStore.setState({ message: { type: "", content: "" } });
    vi.clearAllMocks();
  });

  it("muestra notificacion tipo warning con titulo 'Advertencia'", () => {
    useUIStore.getState().notify({ type: "warning", content: "Cuidado con esto" });

    render(<GlobalNotification />);

    expect(notifications.show).toHaveBeenCalledTimes(1);
    const call = vi.mocked(notifications.show).mock.calls[0][0] as { title: string; message: string };
    expect(call.title).toBe("Advertencia");
    expect(call.message).toBe("Cuidado con esto");
  });

  it("no dispara notificacion con type vacio", () => {
    useUIStore.setState({ message: { type: "", content: "" } });
    render(<GlobalNotification />);

    expect(notifications.show).not.toHaveBeenCalled();
  });

  it("muestra notificacion success con titulo 'Operacion Exitosa'", () => {
    useUIStore.getState().notify({ type: "success", content: "Hecho" });

    render(<GlobalNotification />);

    expect(notifications.show).toHaveBeenCalledTimes(1);
    const call = vi.mocked(notifications.show).mock.calls[0][0] as { title: string };
    expect(call.title).toBe("Operacion Exitosa");
  });
});
