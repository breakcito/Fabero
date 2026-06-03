import { Link } from "react-router-dom";
import { Skeleton } from "@mantine/core";
import {
  XMarkIcon,
  ChevronRightIcon,
  HomeIcon,
  CubeIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { iconos_menu_navegacion } from "../../../../shared/variables/iconos-menu-navegacion";
import type { RES_Submenu } from "../../../../service/responses/menu-navegacion";
import { useNavbar } from "../hooks/useNavbar";
import { motion, AnimatePresence } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
} as const;

interface NavbarProps {
  onClose: () => void;
}

export const Navbar = ({ onClose }: NavbarProps) => {
  const {
    location,
    expanded,
    setExpanded,
    expandedSub,
    setExpandedSub,
    isClosing,
    menu,
    loading,
    handleClose,
  } = useNavbar(onClose);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm 
        transition-opacity duration-300 ${isClosing ? "opacity-0 pointer-events-none" : "animate-fadeIn"}`}
      onClick={handleClose}
    >
      <nav
        className={`absolute left-4 top-4 bottom-4 w-[350px] max-w-[85vw] 
          bg-zinc-950/80 backdrop-blur-3xl rounded-4xl border border-white/10 
          shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden 
          ring-1 ring-white/5 flex flex-col transition-all duration-300 ${
            isClosing ? "opacity-0 -translate-x-[110%]" : "animate-slideInLeft"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente sutil */}
        <div
          className="relative flex items-center justify-between p-6 border-b 
            border-white/5 bg-linear-to-b from-white/5 to-transparent shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full bg-blue-500 
              shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"
            />
            <span className="font-bold text-white text-[15px] tracking-wide">
              NAVEGACIÓN
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 
              rounded-xl transition-all duration-300 group"
            aria-label="Cerrar menú"
          >
            <XMarkIcon
              className="w-5 h-5 group-hover:rotate-90 transition-transform 
              duration-300"
            />
          </button>
        </div>

        {/* Menu Items */}
        <div
          className="p-4 space-y-2 overflow-y-auto h-[calc(100%-72px)] 
            custom-scrollbar"
        >
          {/* Home */}
          <Link
            to="/home"
            onClick={handleClose}
            className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl 
              transition-all duration-300 relative ${
                location.pathname === "/home"
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
          >
            <HomeIcon
              className={`w-4 h-4 transition-colors ${
                location.pathname === "/home"
                  ? "text-blue-400"
                  : "group-hover:text-blue-400"
              }`}
            />
            <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              Inicio
            </span>
          </Link>

          <div className="h-px bg-white/5 mx-2 my-4" />

          {/* Renderizar menu de navegacion o esqueletos de carga */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 px-2"
              >
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    height={40}
                    radius="xl"
                    animate
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {Array.isArray(menu) &&
                  menu.map((menuItem) => {
                    const menuIconData = iconos_menu_navegacion.find(
                      (i) => i.menu_path === menuItem.path,
                    );
                    const MenuIcon = menuIconData?.icono || CubeIcon;
                    const isMenuExpanded = expanded === menuItem.nombre;

                    return (
                      // Menú (Nivel 1)
                      <motion.div
                        variants={itemVariants}
                        key={menuItem.id_menu || menuItem.nombre}
                        className="space-y-1"
                      >
                        <button
                          onClick={() => {
                            setExpanded(
                              isMenuExpanded ? null : menuItem.nombre,
                            );
                            setExpandedSub(null);
                          }}
                          className={`group w-full flex items-center justify-between px-4 py-3.5 
                            rounded-2xl transition-all duration-300 ${
                              isMenuExpanded
                                ? "bg-white/5 text-white ring-1 ring-white/10"
                                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <MenuIcon
                              className={`w-4 h-4 transition-colors ${
                                isMenuExpanded
                                  ? "text-blue-400"
                                  : "group-hover:text-blue-400"
                              }`}
                            />
                            <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                              {menuItem.nombre || "Sin nombre"}
                            </span>
                          </div>
                          <ChevronRightIcon
                            className={`w-4 h-4 transition-all duration-300 ${
                              isMenuExpanded
                                ? "rotate-90 text-blue-400"
                                : "text-zinc-500"
                            }`}
                          />
                        </button>

                        {/* Submenus (Nivel 2) */}
                        <div
                          className={`grid transition-all duration-200 ease-in-out ${
                            isMenuExpanded &&
                            Array.isArray(menuItem.submenus) &&
                            menuItem.submenus.length > 0
                              ? "grid-rows-[1fr] opacity-100 mt-1"
                              : "grid-rows-[0fr] opacity-0 mt-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="ml-4 pl-3 border-l border-white/5 space-y-1">
                              {Array.isArray(menuItem.submenus) &&
                                menuItem.submenus.map(
                                  (submenu: RES_Submenu) => {
                                    const submenuIconData = Array.isArray(
                                      menuIconData?.submenus,
                                    )
                                      ? menuIconData?.submenus.find(
                                          (s) =>
                                            s.submenu_path === submenu.path,
                                        )
                                      : null;
                                    const SubmenuIcon =
                                      submenuIconData?.icono || CubeIcon;
                                    const isSubmenuExpanded =
                                      expandedSub === submenu.nombre;

                                    return (
                                      <div
                                        key={
                                          submenu.id_submenu || submenu.nombre
                                        }
                                        className="space-y-1"
                                      >
                                        {/* Submenu header clickable */}
                                        <button
                                          onClick={() =>
                                            setExpandedSub(
                                              isSubmenuExpanded
                                                ? null
                                                : submenu.nombre,
                                            )
                                          }
                                          className={`w-full flex items-center justify-between group px-3 py-2 rounded-xl transition-all duration-300 ${
                                            isSubmenuExpanded
                                              ? "text-zinc-200 bg-white/5"
                                              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/2"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 overflow-hidden">
                                            <SubmenuIcon
                                              className={`w-3.5 h-3.5 shrink-0 ${
                                                isSubmenuExpanded
                                                  ? "text-blue-400/70"
                                                  : "group-hover:text-blue-400/70"
                                              }`}
                                            />
                                            <span className="text-[13px] font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                                              {submenu.nombre || "Sin nombre"}
                                            </span>
                                          </div>
                                          <ChevronRightIcon
                                            className={`w-3.5 h-3.5 transition-all duration-300 ${
                                              isSubmenuExpanded
                                                ? "rotate-90 text-blue-400/70"
                                                : "text-zinc-500"
                                            }`}
                                          />
                                        </button>

                                        {/* Módulos (Nivel 3 - Final) */}
                                        <div
                                          className={`grid transition-all duration-300 ease-in-out ${
                                            isSubmenuExpanded &&
                                            Array.isArray(submenu.modulos) &&
                                            submenu.modulos.length > 0
                                              ? "grid-rows-[1fr] opacity-100 py-1"
                                              : "grid-rows-[0fr] opacity-0 py-0"
                                          }`}
                                        >
                                          <div className="overflow-hidden">
                                            <div className="ml-2 pl-4 border-l border-white/5 space-y-1">
                                              {Array.isArray(submenu.modulos) &&
                                                submenu.modulos.map(
                                                  (modulo) => (
                                                    <Link
                                                      key={
                                                        modulo.id_modulo ||
                                                        modulo.nombre
                                                      }
                                                      to={modulo.url || "#"}
                                                      onClick={handleClose}
                                                      className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                                                        location.pathname ===
                                                        modulo.url
                                                          ? "text-blue-400 bg-blue-400/10 font-medium"
                                                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                                      }`}
                                                    >
                                                      <ArrowRightEndOnRectangleIcon
                                                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                                          location.pathname ===
                                                          modulo.url
                                                            ? "text-blue-400"
                                                            : "text-zinc-500"
                                                        }`}
                                                      />
                                                      <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis block">
                                                        {modulo.nombre ||
                                                          "Sin nombre"}
                                                      </span>
                                                    </Link>
                                                  ),
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </div>
  );
};
