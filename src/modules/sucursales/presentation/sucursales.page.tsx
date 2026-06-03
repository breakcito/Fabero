import { useTitlePage } from "../../../hooks/useTitlePage";

export const SucursalesPage = () => {
  useTitlePage("Empresas");

  return (
    <div className="space-y-8 animate-fade-in">
      Hola, soy el modulo de Sucursales
    </div>
  );
};
