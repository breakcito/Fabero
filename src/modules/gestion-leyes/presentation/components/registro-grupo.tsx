import {
  TextInput,
  NumberInput,
  Switch,
  Button,
  Group,
  Stack,
  Select,
  Text,
} from "@mantine/core";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRegistroGrupo } from "../../hooks/useRegistroGrupo";
import type {
  GrupoAnalisisResponse,
  AnalitoResponse,
} from "../../service/gestion-leyes.responses";
import type { CrearGrupoPayload } from "../../service/gestion-leyes.requests";

import { TablaAnalitosAsociados } from "./tabla-analitos-asociados";
import { ModalCrearAnalito } from "./modal-crear-analito";
import { ModalEditarAnalito } from "./modal-editar-analito";

interface RegistroGrupoProps {
  grupo: GrupoAnalisisResponse | null;
  analitosDisponibles: AnalitoResponse[];
  todosLosGrupos: GrupoAnalisisResponse[];
  onSuccess: (id: number | null, payload: CrearGrupoPayload) => Promise<boolean>;
  onCancel: () => void;
  onAnalitoCreado?: (nuevo: AnalitoResponse) => void;
  onAnalitoEditado?: (id: number, nombre: string, esDesplegable: boolean) => Promise<boolean>;
}

export const RegistroGrupo = ({
  grupo,
  analitosDisponibles,
  todosLosGrupos,
  onSuccess,
  onCancel,
  onAnalitoCreado,
  onAnalitoEditado,
}: RegistroGrupoProps) => {
  const {
    nombre,
    setNombre,
    orden,
    setOrden,
    indicarOrigen,
    setIndicarOrigen,
    asociados,
    analitoSeleccionado,
    setAnalitoSeleccionado,
    saving,
    openedCrearAnalito,
    setOpenedCrearAnalito,
    analitoEditar,
    setAnalitoEditar,
    banderasOcupadas,
    analitosFiltrados,
    handleStartEditarAnalito,
    handleAgregarAnalito,
    handleAsociarNuevoAnalito,
    handleAnalitoEditadoLocalmente,
    handleQuitarAnalito,
    handleOptionChange,
    handleSubmit,
  } = useRegistroGrupo({
    grupo,
    todosLosGrupos,
    analitosDisponibles,
    onSuccess,
    onCancel,
  });

  return (
    <>
      <form onSubmit={handleSubmit} className="p-1">
        <Stack gap="md">
          <TextInput
            label="Nombre del Grupo"
            placeholder="Ej. Leyes Consolidadas, Humedad, Leyes Secundarias..."
            value={nombre}
            onChange={(e) => setNombre(e.currentTarget.value)}
            required
            radius="lg"
            classNames={{
              label: "text-zinc-400 mb-1 font-medium text-sm",
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[40px] rounded-xl",
            }}
          />

          <Group grow gap="md">
            <NumberInput
              label="Orden de Visualización"
              placeholder="Ej. 1, 2, 3..."
              value={orden}
              onChange={(val) => setOrden(typeof val === "number" ? val : Number(val) || 0)}
              min={0}
              radius="lg"
              classNames={{
                label: "text-zinc-400 mb-1 font-medium text-sm",
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[40px] rounded-xl",
              }}
            />

            <div className="flex flex-col justify-end h-[62px]">
              <Switch
                label="Indicar Origen"
                description="Habilita indicar el origen del mineral en el grupo"
                checked={indicarOrigen}
                onChange={(e) => setIndicarOrigen(e.currentTarget.checked)}
                radius="md"
                color="indigo"
                classNames={{
                  label: "text-zinc-200 font-medium text-sm",
                  description: "text-zinc-500 text-xs",
                  body: "items-center",
                }}
              />
            </div>
          </Group>

          {/* Sección de Selección y Asociación de Analitos */}
          <div className="border-t border-zinc-800/80 pt-4 mt-2">
            <Text size="sm" fw={700} className="text-zinc-300 mb-3">
              Asociación de Analitos
            </Text>

            <Group gap="sm" align="flex-end" className="mb-4">
              <Select
                placeholder="Seleccionar analito para agregar..."
                data={analitosFiltrados.map((a) => ({
                  value: a.id.toString(),
                  label: a.nombre,
                }))}
                value={analitoSeleccionado}
                onChange={setAnalitoSeleccionado}
                searchable
                radius="lg"
                className="flex-1"
                classNames={{
                  input:
                    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[40px] rounded-xl",
                }}
              />
              <Button
                onClick={handleAgregarAnalito}
                disabled={!analitoSeleccionado}
                leftSection={<PlusIcon className="w-4 h-4" />}
                radius="lg"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-40 h-[40px]"
              >
                Agregar
              </Button>
              <Button
                onClick={() => setOpenedCrearAnalito(true)}
                radius="lg"
                className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 h-[40px]"
              >
                + Crear Analito
              </Button>
            </Group>

            {/* Tabla de Analitos Asociados */}
            <TablaAnalitosAsociados
              asociados={asociados}
              banderasOcupadas={banderasOcupadas}
              onOptionChange={handleOptionChange}
              onStartEditar={handleStartEditarAnalito}
              onQuitar={handleQuitarAnalito}
            />
          </div>

          <Group justify="flex-end" gap="sm" className="mt-4 border-t border-zinc-800/80 pt-4">
            <Button
              variant="subtle"
              onClick={onCancel}
              radius="lg"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/40"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
              radius="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
            >
              {grupo ? "Actualizar Grupo" : "Crear Grupo"}
            </Button>
          </Group>
        </Stack>
      </form>

      {/* Modal para Crear Analito */}
      <ModalCrearAnalito
        opened={openedCrearAnalito}
        onClose={() => setOpenedCrearAnalito(false)}
        onAnalitoCreado={onAnalitoCreado}
        onAsociar={handleAsociarNuevoAnalito}
      />

      {/* Modal para Editar Analito */}
      <ModalEditarAnalito
        analito={analitoEditar}
        onClose={() => setAnalitoEditar(null)}
        onSuccess={async (id, nombreEditar, desplegableEditar) => {
          if (onAnalitoEditado) {
            const success = await onAnalitoEditado(id, nombreEditar, desplegableEditar);
            if (success) {
              handleAnalitoEditadoLocalmente(id, nombreEditar);
              return true;
            }
          }
          return false;
        }}
      />
    </>
  );
};
