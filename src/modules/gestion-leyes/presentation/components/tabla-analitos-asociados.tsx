import { Group, Radio, ActionIcon, Text, Table } from "@mantine/core";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export interface AnalitoAsociado {
  id_analito: number;
  nombre: string;
  es_desplegable: boolean;
  para_valorizacion_oro: boolean;
  para_valorizacion_plata: boolean;
  para_valorizacion_humedad: boolean;
  para_valorizacion_recuperacion: boolean;
}

interface BanderasOcupadas {
  oro: boolean;
  plata: boolean;
  humedad: boolean;
  recuperacion: boolean;
}

interface TablaAnalitosAsociadosProps {
  asociados: AnalitoAsociado[];
  banderasOcupadas: BanderasOcupadas;
  onOptionChange: (idAnalito: number, val: string) => void;
  onStartEditar: (idAnalito: number, nombre: string, esDesplegable: boolean) => void;
  onQuitar: (idAnalito: number) => void;
}

export const TablaAnalitosAsociados = ({
  asociados,
  banderasOcupadas,
  onOptionChange,
  onStartEditar,
  onQuitar,
}: TablaAnalitosAsociadosProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 max-h-[300px]">
      <Table verticalSpacing="sm" className="w-full">
        <thead>
          <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-300 text-xs font-semibold">
            <th className="text-left py-3 pl-3">Analito</th>
            <th className="text-center py-3" style={{ width: 440 }}>
              ¿Para Valorización? (Mutuamente Excluyentes)
            </th>
            <th className="text-center py-3" style={{ width: 120 }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {asociados.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center py-6 text-zinc-500 text-xs">
                No hay analitos asociados a este grupo todavía.
              </td>
            </tr>
          ) : (
            asociados.map((item) => {
              // Determinar cuál opción está seleccionada en la fila
              let currentVal = "ninguno";
              if (item.para_valorizacion_oro) currentVal = "oro";
              else if (item.para_valorizacion_plata) currentVal = "plata";
              else if (item.para_valorizacion_humedad) currentVal = "humedad";
              else if (item.para_valorizacion_recuperacion) currentVal = "recuperacion";

              return (
                <tr
                  key={item.id_analito}
                  className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors"
                >
                  <td className="py-2.5 pl-3">
                    <Text size="sm" fw={600} className="text-zinc-200">
                      {item.nombre}
                    </Text>
                  </td>
                  <td className="py-2.5 text-center">
                    <Group justify="center" gap="md">
                      <Radio
                        label="Ninguno"
                        size="xs"
                        name={`val-${item.id_analito}`}
                        checked={currentVal === "ninguno"}
                        onChange={() => onOptionChange(item.id_analito, "ninguno")}
                        color="red"
                        classNames={{ label: "text-zinc-400 text-xs font-medium" }}
                      />
                      <Radio
                        label="Oro"
                        size="xs"
                        name={`val-${item.id_analito}`}
                        checked={currentVal === "oro"}
                        onChange={() => onOptionChange(item.id_analito, "oro")}
                        color="yellow"
                        disabled={banderasOcupadas.oro && currentVal !== "oro"}
                        classNames={{ label: "text-amber-400 text-xs font-semibold" }}
                      />
                      <Radio
                        label="Plata"
                        size="xs"
                        name={`val-${item.id_analito}`}
                        checked={currentVal === "plata"}
                        onChange={() => onOptionChange(item.id_analito, "plata")}
                        color="gray"
                        disabled={banderasOcupadas.plata && currentVal !== "plata"}
                        classNames={{ label: "text-zinc-300 text-xs font-semibold" }}
                      />
                      <Radio
                        label="Humedad"
                        size="xs"
                        name={`val-${item.id_analito}`}
                        checked={currentVal === "humedad"}
                        onChange={() => onOptionChange(item.id_analito, "humedad")}
                        color="blue"
                        disabled={banderasOcupadas.humedad && currentVal !== "humedad"}
                        classNames={{ label: "text-blue-400 text-xs font-semibold" }}
                      />
                      <Radio
                        label="Recup."
                        size="xs"
                        name={`val-${item.id_analito}`}
                        checked={currentVal === "recuperacion"}
                        onChange={() => onOptionChange(item.id_analito, "recuperacion")}
                        color="teal"
                        disabled={banderasOcupadas.recuperacion && currentVal !== "recuperacion"}
                        classNames={{ label: "text-teal-400 text-xs font-semibold" }}
                      />
                    </Group>
                  </td>
                  <td className="py-2.5 text-center">
                    <Group gap="xs" justify="center">
                      <ActionIcon
                        color="indigo"
                        variant="subtle"
                        onClick={() => onStartEditar(item.id_analito, item.nombre, item.es_desplegable)}
                        className="hover:bg-indigo-950/20"
                        title="Editar Analito"
                      >
                        <PencilIcon className="w-4 h-4 text-indigo-400" />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => onQuitar(item.id_analito)}
                        className="hover:bg-red-950/20"
                        title="Quitar de este grupo"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
};
