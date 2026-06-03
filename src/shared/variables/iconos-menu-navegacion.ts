import {
  BuildingOffice2Icon,
  UserGroupIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

// Asociacion de iconos a cada nivel de menú mediante
// el campo "path". Visible en el menu de navegacion.
// modulo_path -> menu_path
// submodulo_path -> submenu_path
export const iconos_menu_navegacion = [
  {
    menu_path: "configuracion",
    icono: Cog6ToothIcon,
    submenus: [
      { submenu_path: "empresas", icono: BuildingOffice2Icon },
      { submenu_path: "personal", icono: UserGroupIcon },
      { submenu_path: "usuarios", icono: UsersIcon },
    ],
  },
];
