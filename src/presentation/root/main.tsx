import { Buffer, Buffer as NodeBuffer } from "buffer";
declare global {
  interface Window {
    Buffer: typeof NodeBuffer;
  }
}
window.Buffer = window.Buffer || Buffer;

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.layer.css";
import "./index.css";
import { App } from "./App.tsx";

// Mantine v8 renderiza por defecto `["label", "description", "input", "error"]`
// (la descripción ARRIBA del input). Se invierte para que la descripción quede
// DEBAJO del input, que es lo esperado en los formularios del proyecto.
const theme = createTheme({
  components: {
    InputWrapper: {
      defaultProps: {
        inputWrapperOrder: ["label", "input", "description", "error"],
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <Notifications position="top-right" zIndex={1000} />
    <ModalsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ModalsProvider>
  </MantineProvider>,
);

