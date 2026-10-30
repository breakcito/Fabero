import { ActionIcon, Badge, Button, Tooltip } from "@mantine/core";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconFileDescription,
  IconTestPipe,
} from "@tabler/icons-react";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { AnalisisDraftItem } from "../../service/cierre-leyes.requests";

interface ListaAnalisisBorradorProps {
  items: AnalisisDraftItem[];
  onAgregarClick: () => void;
  onEditarItem: (item: AnalisisDraftItem) => void;
  onEliminarItem: (localId: string) => void;
  disabled?: boolean;
}

export const ListaAnalisisBorrador = ({
  items,
  onAgregarClick,
  onEditarItem,
  onEliminarItem,
  disabled,
}: ListaAnalisisBorradorProps) => {
  return (
    <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconTestPipe size={15} className="text-cyan-400" />
          <span className="text-xs font-semibold text-zinc-200">
            Análisis a registrar
          </span>
          <Badge size="xs" color={items.length > 0 ? "cyan" : "gray"} variant="light">
            {items.length}
          </Badge>
        </div>

        <Button
          size="compact-xs"
          radius="lg"
          variant="light"
          color="cyan"
          leftSection={<IconPlus size={13} />}
          disabled={disabled}
          onClick={onAgregarClick}
        >
          Añadir Análisis
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center space-y-1">
          <p className="text-xs text-zinc-400 font-medium">
            No se han añadido análisis todavía.
          </p>
          <p className="text-[11px] text-zinc-500">
            Usa el botón <strong className="text-cyan-400">Añadir Análisis</strong> para agregar uno o varios ensayos antes de guardar.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
          {items.map((item) => {
            const cantDocs = item.documentos.length;
            const esExterno = item.tipo_origen === TipoOrigen.Externo;

            return (
              <div
                key={item.localId}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                      #{item.numero_ensayo}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {item.laboratorio_nombre}
                    </span>
                    <Badge
                      size="xs"
                      color={esExterno ? "yellow" : "indigo"}
                      variant="light"
                    >
                      {item.tipo_origen}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>
                      Asumido por: <strong className="text-zinc-300">{item.asumido_por}</strong>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        cantDocs > 0 ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      <IconFileDescription size={12} />
                      {cantDocs} {cantDocs === 1 ? "archivo" : "archivos"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip label="Editar análisis" withArrow>
                    <ActionIcon
                      size="sm"
                      radius="md"
                      variant="subtle"
                      color="indigo"
                      disabled={disabled}
                      onClick={() => onEditarItem(item)}
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Quitar de la lista" withArrow>
                    <ActionIcon
                      size="sm"
                      radius="md"
                      variant="subtle"
                      color="red"
                      disabled={disabled}
                      onClick={() => onEliminarItem(item.localId)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

