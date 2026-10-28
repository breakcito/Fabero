import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/public.layout.tsx";
import { AuthLayout } from "../layouts/auth/auth.layout.tsx";
import { ProtectedRoute } from "./protectedRoute.tsx";
import { PublicRoute } from "./publicRoute.tsx";
// import { PlaceholderPage } from "../pages/placeholder.page.tsx";
// Vistas
import { LoginPage } from "../../modules/login/presentation/login.page.tsx";
import { HomePage } from "../pages/home/home.page.tsx";
import { EmpresasPage } from "../../modules/empresas/presentation/empresas.page.tsx";
import { PersonalPage } from "../../modules/personal/presentation/personal.page.tsx";
import OrganigramaPage from "../../modules/organigrama/presentation/organigrama.page.tsx";
import { RolesPage } from "../../modules/roles/presentation/roles.page.tsx";
import { CuentasPage } from "../../modules/cuentas/presentation/cuentas.page.tsx";
import { PerfilPage } from "../../modules/perfil/presentation/perfil.page.tsx";
import { ProveedoresPage } from "../../modules/proveedores-mineros/presentation/proveedores-page/proveedores.page.tsx";
import { PlantasDestinoPage } from "../../modules/plantas-destino/presentation/plantas-page/plantas.page.tsx";
import { ConductoresPage } from "../../modules/conductores/presentation/conductores-page/conductores.page.tsx";
import { EmpresasTransportePage } from "../../modules/empresas-transporte/presentation/empresas-transporte-page/empresas-transporte.page.tsx";
import { VehiculosPage } from "../../modules/vehiculos/presentation/vehiculos-page/vehiculos.page.tsx";
import { RecepcionUnidadesPage } from "../../modules/recepcion-unidades/presentation/recepcion-unidades.page.tsx";
import { RecepcionVisitasPage } from "../../modules/recepcion-visitas/presentation/recepcion-visitas.page.tsx";
import { RecepcionMineralPage } from "../../modules/recepcion-mineral/presentation/recepcion-mineral.page.tsx";
import { ResumenBalanzaPage } from "../../modules/resumen-balanza/presentation/resumen-balanza.page.tsx";
import { ValidacionDistribucionPage } from "../../modules/validacion-distribucion/presentation/validacion-distribucion.page.tsx";
import { GuiasPrimerTramoPage } from "../../modules/guias-primer-tramo/presentation/guias-primer-tramo.page.tsx";
import { useEffect } from "react";
import { onSocketEvent } from "../../service/_socket.ts";
import { useAuditoriaStore } from "../../stores/auditoria.store.ts";
import ModoAuditoriaPage from "../../modules/modo-auditoria/presentation/ModoAuditoriaPage.tsx";
import { SucursalesPage } from "../../modules/sucursales/presentation/sucursales.page.tsx";
import { CierreLeyesPage } from "../../modules/cierre-leyes/presentation/cierre-leyes.page.tsx";
import CondicionesComercialesProveedorPage from "../../modules/condiciones-comerciales-proveedor/presentation/condiciones-comerciales-proveedor.page.tsx";
import CondicionesComercialesPlantaPage from "../../modules/condiciones-comerciales-planta/presentation/condiciones-comerciales-planta.page.tsx";
import AnticiposProveedorPage from "../../modules/anticipos-proveedor/presentation/anticipos-proveedor.page.tsx";
import AnticiposPlantaPage from "../../modules/anticipos-planta/presentation/anticipos-planta.page.tsx";
import { ValorizacionesCompraPage } from "../../modules/valorizacion-compra/presentation/valorizacion-compra.page.tsx";
import ContabilidadPage from "../../modules/contabilidad/presentation/contabilidad.page.tsx";
import BlendingPage from "../../modules/blending/presentation/blending.page.tsx";
import ProgramacionDespachosPage from "../../modules/programacion-despachos/presentation/programacion-despachos.page.tsx";
import ProgramarRecepcionPage from "../../modules/programar-recepcion/presentation/programar-recepcion.page.tsx";
import { ValorizacionesVentaPage } from "../../modules/valorizacion-venta/presentation/valorizacion-venta.page.tsx";
import SystemPage from "../../modules/system/presentation/system.page.tsx";
import { RUTAS_LEGACY } from "../../shared/variables/rutas-legacy";

/**
 * Rutas legacy (arbol anidado /configuracion/... y /operaciones/...) que se
 * redirigen a las rutas planas actuales. Se mantienen para no romper los
 * enlaces guardados antes del aplanado del arbol de navegacion.
 */
const RUTAS_LEGACY_ENTRADAS = Object.entries(RUTAS_LEGACY);

export const App = () => {
  const { setModoAuditoria } = useAuditoriaStore();

  useEffect(() => {
    // Escuchar el evento global de modo auditoría
    const channel = onSocketEvent(
      "global-audit-mode",
      "audit.mode.toggled",
      (data: { en_modo_auditable: boolean }) => {
        console.log("[App] Evento de Auditoría recibido:", data);
        setModoAuditoria(data.en_modo_auditable);
      },
    );

    return () => {
      channel.stopListening(".audit.mode.toggled");
    };
  }, [setModoAuditoria]);

  return (
    <Routes>
      {/* Rutas publicas */}
      <Route
        element={
          <PublicRoute>
            <PublicLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Ruta oculta de auditoría (Sin layout) */}
      <Route path="/modo-auditoria" element={<ModoAuditoriaPage />} />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        {/* Inicio */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />

        {/* Perfil */}
        <Route path="/perfil" element={<PerfilPage />} />

        {/* ------------------------------------------------------------
            Rutas planas: el path del nodo (menu/submenu/modulo) ES la ruta.
            Los contenedores (es_desplegable) no tienen ruta propia.
           ------------------------------------------------------------ */}
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/sucursales" element={<SucursalesPage />} />
        <Route path="/areas_cargos" element={<OrganigramaPage />} />
        <Route path="/trabajadores" element={<PersonalPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/cuentas" element={<CuentasPage />} />
        <Route path="/proveedores-mineros" element={<ProveedoresPage />} />
        <Route path="/plantas-destino" element={<PlantasDestinoPage />} />
        <Route
          path="/empresas-transporte"
          element={<EmpresasTransportePage />}
        />
        <Route
          path="/condiciones-comerciales-proveedor"
          element={<CondicionesComercialesProveedorPage />}
        />
        <Route
          path="/condiciones-comerciales-planta"
          element={<CondicionesComercialesPlantaPage />}
        />
        <Route path="/conductores" element={<ConductoresPage />} />
        <Route path="/vehiculos" element={<VehiculosPage />} />
        <Route path="/recepcion-unidades" element={<RecepcionUnidadesPage />} />
        <Route path="/recepcion-visitas" element={<RecepcionVisitasPage />} />
        <Route
          path="/programar-recepcion"
          element={<ProgramarRecepcionPage />}
        />
        <Route path="/recepcion-mineral" element={<RecepcionMineralPage />} />
        <Route
          path="/validacion-distribucion"
          element={<ValidacionDistribucionPage />}
        />
        <Route path="/resumen-balanza" element={<ResumenBalanzaPage />} />
        <Route path="/guias-primer-tramo" element={<GuiasPrimerTramoPage />} />
        <Route path="/cierre-leyes" element={<CierreLeyesPage />} />
        <Route
          path="/anticipos-proveedor"
          element={<AnticiposProveedorPage />}
        />
        <Route path="/anticipos-planta" element={<AnticiposPlantaPage />} />
        <Route
          path="/valorizacion-compra"
          element={<ValorizacionesCompraPage />}
        />
        <Route
          path="/valorizacion-venta"
          element={<ValorizacionesVentaPage />}
        />
        <Route path="/contabilidad" element={<ContabilidadPage />} />
        <Route path="/blending" element={<BlendingPage />} />
        <Route path="/despacho" element={<ProgramacionDespachosPage />} />

        {/* Modulo System: configuracion del arbol de navegacion */}
        <Route path="/system" element={<SystemPage />} />

        {/* Redirecciones de rutas legacy (arbol anidado) */}
        {RUTAS_LEGACY_ENTRADAS.map(([desde, hacia]) => (
          <Route
            key={desde}
            path={desde}
            element={<Navigate to={hacia} replace />}
          />
        ))}

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
};
