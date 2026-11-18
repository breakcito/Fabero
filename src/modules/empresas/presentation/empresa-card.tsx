import { useState } from "react";
import {
  Avatar,
  FileButton,
  Stack,
  Text,
  Badge,
  Loader,
  ActionIcon,
  Tooltip,
  Group,
} from "@mantine/core";
import {
  BuildingOffice2Icon,
  PencilSquareIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import type { RES_Empresa } from "../../../service/responses/empresa";

interface EmpresaCardProps {
  empresa: RES_Empresa;
  onUpdateLogo: (id: number, file: File) => Promise<boolean>;
  onOpenCuentas: (empresa: RES_Empresa) => void;
  onEdit: (empresa: RES_Empresa) => void;
  loadingCuentas?: boolean;
}

/** Estilo base de cada métrica del card (etiqueta micro + recuadro del icono) */
const METRIC = {
  label: "text-[10px] fw-[800] uppercase tracking-[0.16em] leading-none mb-1.5",
  iconBox:
    "flex items-center justify-center w-8 h-8 rounded-xl border shrink-0",
};

export const EmpresaCard = ({
  empresa,
  onUpdateLogo,
  onOpenCuentas,
  onEdit,
  loadingCuentas = false,
}: EmpresaCardProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpdateLogo(empresa.id_empresa, file);
    } finally {
      setIsUploading(false);
    }
  };

  const cantidad = empresa.cantidad_cuentas_bancarias ?? 0;

  const ubicacion =
    [
      empresa.distrito_nombre,
      empresa.provincia_nombre,
      empresa.departamento_nombre,
    ]
      .filter(Boolean)
      .join(" · ") || null;

  const domicilio = empresa.domicilio_fiscal || null;

  return (
    <div className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded-4xl p-5 gap-4 hover:border-indigo-500/40 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-indigo-500/10">
      {/* Decorative Gradient Background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-colors duration-700" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-colors duration-700" />

      {/* Header: RUC + Cuentas badge + Acciones */}
      <div className="flex items-center justify-between relative z-10 gap-2">
        <Badge
          variant="filled"
          color="indigo"
          size="sm"
          radius="md"
          className="font-bold tracking-tight px-3 font-mono"
        >
          RUC: {empresa.ruc}
        </Badge>
        <Group gap="xs" wrap="nowrap">
          <Badge
            color={cantidad > 0 ? "blue" : "cyan"}
            variant="light"
            size="sm"
            radius="xl"
            className="font-bold uppercase tracking-wider"
          >
            {cantidad > 0
              ? `${cantidad} ${cantidad === 1 ? "cuenta" : "cuentas"}`
              : "Sin cuentas"}
          </Badge>
          <Tooltip label="Editar Empresa" withArrow>
            <ActionIcon
              variant="subtle"
              color="yellow"
              radius="xl"
              size="sm"
              onClick={() => onEdit(empresa)}
            >
              <PencilSquareIcon className="w-4 h-4" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Gestionar Cuentas" withArrow position="left">
            <ActionIcon
              variant="subtle"
              color="blue"
              radius="xl"
              size="sm"
              onClick={() => onOpenCuentas(empresa)}
              loading={loadingCuentas}
            >
              <BuildingLibraryIcon className="w-4 h-4" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      {/* Main Info: Logo & Razón Social */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="relative group/logo shrink-0">
          <FileButton
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/jpg"
            disabled={isUploading}
          >
            {(props) => (
              <div {...props} className="cursor-pointer relative">
                <Avatar
                  src={empresa.path_logo}
                  size={72}
                  radius={100}
                  className="border-2 border-zinc-800 group-hover:border-indigo-500/40 transition-all duration-500 shadow-xl"
                >
                  <BuildingOffice2Icon className="w-7 h-7 text-indigo-400/50" />
                </Avatar>

                {/* Overlay Interactivo / Cargador */}
                {isUploading ? (
                  <div className="absolute inset-0 bg-zinc-950/80 rounded-full flex items-center justify-center backdrop-blur-xs border border-indigo-500/30">
                    <Loader size="sm" color="indigo" variant="bars" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-indigo-950/60 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <PencilSquareIcon className="w-5 h-5 text-white mb-1" />
                    <Text
                      size="8px"
                      fw={800}
                      className="text-white uppercase tracking-tighter"
                    >
                      Cambiar
                    </Text>
                  </div>
                )}
              </div>
            )}
          </FileButton>
        </div>

        <div className="min-w-0 flex-1">
          <Text
            size="lg"
            fw={800}
            className="text-white group-hover:text-indigo-200 transition-colors leading-tight tracking-tight line-clamp-2"
          >
            {empresa.razon_social}
          </Text>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px bg-linear-to-r from-indigo-500/40 via-zinc-700/70 to-transparent relative z-10" />

      {/* Detalle: Ubicación y Domicilio Fiscal */}
      <Stack gap="3" className="relative z-10">
        <div className="flex items-start gap-3">
          <div className={`${METRIC.iconBox} bg-cyan-500/10 border-cyan-500/25`}>
            <MapPinIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <Text className={`${METRIC.label} text-cyan-400/90`}>Ubicación</Text>
            {ubicacion ? (
              <Text
                size="sm"
                fw={500}
                className="text-zinc-100 leading-snug line-clamp-2"
              >
                {ubicacion}
              </Text>
            ) : (
              <Text size="sm" className="text-zinc-500 italic leading-snug">
                Sin ubicación registrada
              </Text>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className={`${METRIC.iconBox} bg-violet-500/10 border-violet-500/25`}
          >
            <BuildingOfficeIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <Text className={`${METRIC.label} text-violet-400/90`}>
              Domicilio Fiscal
            </Text>
            {domicilio ? (
              <Text
                size="sm"
                fw={500}
                className="text-zinc-100 leading-snug line-clamp-2"
              >
                {domicilio}
              </Text>
            ) : (
              <Text size="sm" className="text-zinc-500 italic leading-snug">
                Sin domicilio fiscal
              </Text>
            )}
          </div>
        </div>
      </Stack>
    </div>
  );
};
