import type { ComponentType } from "react";
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  UsersIcon,
  Cog6ToothIcon,
  BeakerIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  ScaleIcon,
  TruckIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UserIcon,
  MapPinIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

// Normaliza un nombre a slug estable (lowercase, sin acentos, guiones).
// Se usa como clave de mapeo para nodos SIN path (contenedores).
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Mapeo de iconos para el menu de navegacion.
//
// El campo `path` admite DOS tipos de clave:
// - Para nodos cliqueables (menu/submenu/modulo hoja con `path` no nulo en el
//   backend): el segmento de URL real devuelto por la API. Es estable y unico
//   entre niveles (no hay dos registros menu/submenu/modulo con el mismo path).
// - Para contenedores (menu/submenu con `path` null): el slug del `nombre`.
//   Estable mientras no se renombre el contenedor.
//
// Se evita usar `id_menu`/`id_submenu` porque esos IDs cambian entre DEV y PROD.
export interface IconoMenuEntrada {
  path: string;
  icono: ComponentType<{ className?: string }>;
}

export const iconos_menu_navegacion: IconoMenuEntrada[] = [
  // ----- Menus contenedores (slug del nombre) -----
  { path: "configuracion", icono: Cog6ToothIcon },
  { path: "operaciones", icono: PresentationChartBarIcon },
  { path: "sistema", icono: Squares2X2Icon },

  // ----- Submenus contenedores (slug del nombre) -----
  { path: "empresa", icono: BuildingOffice2Icon },
  { path: "personal", icono: UserGroupIcon },
  { path: "usuarios", icono: UsersIcon },
  { path: "socios-comerciales", icono: BriefcaseIcon },
  { path: "transporte", icono: TruckIcon },
  { path: "vigilancia", icono: ShieldCheckIcon },
  { path: "balanza", icono: ScaleIcon },
  { path: "guias", icono: DocumentTextIcon },
  { path: "leyes", icono: BeakerIcon },
  { path: "anticipos", icono: CurrencyDollarIcon },
  { path: "valorizacion", icono: ArrowTrendingUpIcon },
  { path: "contabilidad", icono: CalculatorIcon },
  { path: "blending", icono: ArrowsRightLeftIcon },
  { path: "despacho", icono: ClipboardDocumentListIcon },
  { path: "configuracion-del-sistema", icono: Cog6ToothIcon },

  // ----- Nodos cliqueables (path real devuelto por el backend) -----
  // Configuracion / Empresa
  { path: "empresas", icono: BuildingOffice2Icon },
  { path: "sucursales", icono: MapPinIcon },

  // Configuracion / Personal
  { path: "areas_cargos", icono: UserGroupIcon },
  { path: "trabajadores", icono: UserIcon },
  { path: "encargados-muestra", icono: UserIcon },

  // Configuracion / Usuarios
  { path: "roles", icono: UsersIcon },
  { path: "cuentas", icono: UsersIcon },

  // Configuracion / Socios Comerciales
  { path: "proveedores-mineros", icono: BriefcaseIcon },
  { path: "plantas-destino", icono: BuildingOffice2Icon },
  { path: "empresas-transporte", icono: TruckIcon },
  { path: "condiciones-comerciales-proveedor", icono: BriefcaseIcon },
  { path: "condiciones-comerciales-planta", icono: BuildingOffice2Icon },

  // Configuracion / Transporte
  { path: "conductores", icono: UserIcon },
  { path: "vehiculos", icono: TruckIcon },

  // Operaciones / Vigilancia
  { path: "recepcion-unidades", icono: ClipboardDocumentListIcon },
  { path: "recepcion-visitas", icono: ClipboardDocumentListIcon },
  { path: "programar-recepcion", icono: CalendarDaysIcon },

  // Operaciones / Balanza
  { path: "recepcion-mineral", icono: CubeIcon },
  { path: "validacion-distribucion", icono: CubeIcon },
  { path: "resumen-balanza", icono: ScaleIcon },

  // Operaciones / Guias
  { path: "primer-tramo", icono: DocumentTextIcon },

  // Operaciones / Leyes
  { path: "cierre-leyes", icono: BeakerIcon },

  // Operaciones / Anticipos
  { path: "anticipos-proveedor", icono: CurrencyDollarIcon },
  { path: "anticipos-planta", icono: CurrencyDollarIcon },

  // Operaciones / Valorizacion
  { path: "compra", icono: ArrowTrendingUpIcon },
  { path: "venta", icono: ArrowTrendingUpIcon },

  // Operaciones / Contabilidad
  { path: "contabilidad", icono: CalculatorIcon },

  // Operaciones / Blending
  { path: "blending", icono: ArrowsRightLeftIcon },

  // Operaciones / Despacho
  { path: "programacion", icono: ClipboardDocumentListIcon },

  // Sistema
  { path: "system", icono: Squares2X2Icon },
];

// Lookup hibrido:
// - Si el item tiene `path` no nulo (cliqueable) -> busca por path real.
// - Si `path` es null (contenedor) -> busca por slug del `nombre`.
// Devuelve `null` cuando no hay match; el caller decide el fallback generico.
export const getIconoPorItem = (
  item: { path: string | null; nombre: string },
): IconoMenuEntrada["icono"] | null => {
  if (item.path) {
    const byPath = iconos_menu_navegacion.find((i) => i.path === item.path);
    if (byPath) return byPath.icono;
  }
  const slug = slugify(item.nombre);
  if (!slug) return null;
  return iconos_menu_navegacion.find((i) => i.path === slug)?.icono ?? null;
};
