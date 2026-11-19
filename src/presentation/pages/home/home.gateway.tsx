import { lazy, Suspense } from "react";
import { Loader } from "@mantine/core";
import { useAuthUser } from "../../../hooks/useAuthUser";
import { HomePage } from "./home.page";

// El Dashboard arrastra la librería de gráficos (~500 KB), por eso se carga
// bajo demanda para no penalizar al resto de rutas.
const DashboardPage = lazy(() =>
  import("../../../modules/dashboard/presentation/dashboard.page").then((m) => ({
    default: m.DashboardPage,
  })),
);

const DashboardFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader color="indigo" type="bars" />
  </div>
);

/**
 * Puerta de entrada de "/home".
 *
 * Con el permiso `ver_dashboard` concedido se muestra el Dashboard de
 * indicadores; si está denegado, el usuario ve la pantalla de Inicio con
 * los accesos rápidos en lugar de una pantalla bloqueada.
 */
export const HomeGateway = () => {
  const { tienePermiso } = useAuthUser();

  if (!tienePermiso("ver_dashboard")) {
    return <HomePage />;
  }

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardPage />
    </Suspense>
  );
};
