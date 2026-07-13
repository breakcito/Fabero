import { useState, useMemo } from "react";
import {
  TextInput,
  NumberInput,
  Switch,
  Button,
  Group,
  Stack,
  Select,
  Table,
  ActionIcon,
  Radio,
  Text,
} from "@mantine/core";
import { TrashIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { GestionLeyesService } from "../../service/gestion-leyes.service";
import type {
  GrupoAnalisisResponse,
  AnalitoResponse,
  CrearGrupoPayload,
} from "../../service/gestion-leyes.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface RegistroGrupoProps {
  grupo: GrupoAnalisisResponse | null;
  analitosDisponibles: AnalitoResponse[];
  todosLosGrupos: GrupoAnalisisResponse[];
  onSuccess: (id: number | null, payload: CrearGrupoPayload) => Promise<boolean>;
  onCancel: () => void;
  onAnalitoCreado?: (nuevo: AnalitoResponse) => void;
  onAnalitoEditado?: (id: number, nombre: string, esDesplegable: boolean) => Promise<boolean>;
}

interface AnalitoAsociado {
  id_analito: number;
  nombre: string;
  es_desplegable: boolean;
  para_valorizacion_oro: boolean;
  para_valorizacion_plata: boolean;
  para_valorizacion_humedad: boolean;
  para_valorizacion_recuperacion: boolean;
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
  const { notifySuccess, notifyError } = useNotify();

  const [nombre, setNombre] = useState(grupo?.nombre ?? "");
  const [orden, setOrden] = useState<number>(grupo?.orden ?? 0);
  const [indicarOrigen, setIndicarOrigen] = useState(grupo?.indicar_origen ?? false);
  const [asociados, setAsociados] = useState<AnalitoAsociado[]>(
    grupo
      ? grupo.analitos.map((a) => ({
          id_analito: a.id_analito,
          nombre: a.nombre,
          para_valorizacion_oro: a.para_valorizacion_oro,
          para_valorizacion_plata: a.para_valorizacion_plata,
          para_valorizacion_humedad: a.para_valorizacion_humedad,
          para_valorizacion_recuperacion: a.para_valorizacion_recuperacion,
        }))
      : []
  );
  const [analitoSeleccionado, setAnalitoSeleccionado] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para creación de analito mediante sub-modal
  const [openedCrearAnalito, setOpenedCrearAnalito] = useState(false);
  const [nombreNuevoAnalito, setNombreNuevoAnalito] = useState("");
  const [desplegableNuevoAnalito, setDesplegableNuevoAnalito] = useState(false);
  const [asociarNuevoAnalito, setAsociarNuevoAnalito] = useState(true);
  const [creandoAnalito, setCreandoAnalito] = useState(false);

  // Estados para edición de analito mediante sub-modal
  const [analitoEditar, setAnalitoEditar] = useState<AnalitoResponse | null>(null);
  const [nombreEditarAnalito, setNombreEditarAnalito] = useState("");
  const [desplegableEditarAnalito, setDesplegableEditarAnalito] = useState(false);
  const [editandoAnalito, setEditandoAnalito] = useState(false);

  // Calcular banderas ocupadas en OTROS grupos
  const banderasOcupadas = useMemo(() => {
    const ocupadas = {
      oro: false,
      plata: false,
      humedad: false,
      recuperacion: false,
    };

    todosLosGrupos.forEach((g) => {
      // Ignorar el grupo actual que estamos editando
      if (grupo && g.id === grupo.id) return;

      g.analitos.forEach((a) => {
        if (a.para_valorizacion_oro) ocupadas.oro = true;
        if (a.para_valorizacion_plata) ocupadas.plata = true;
        if (a.para_valorizacion_humedad) ocupadas.humedad = true;
        if (a.para_valorizacion_recuperacion) ocupadas.recuperacion = true;
      });
    });

    return ocupadas;
  }, [todosLosGrupos, grupo]);

  const handleStartEditarAnalito = (idAnalito: number, nombre: string, esDesplegable: boolean) => {
    setAnalitoEditar({ id: idAnalito, nombre, es_desplegable: esDesplegable, estado: "Activo" as any });
    setNombreEditarAnalito(nombre);
    setDesplegableEditarAnalito(esDesplegable);
  };

  const handleEditarAnalitoGuardar = async () => {
    if (!analitoEditar) return;
    const trimmed = nombreEditarAnalito.trim();
    if (!trimmed) return;

    setEditandoAnalito(true);
    try {
      if (onAnalitoEditado) {
        const success = await onAnalitoEditado(analitoEditar.id, trimmed, desplegableEditarAnalito);
        if (success) {
          // Actualizar localmente en asociados
          setAsociados((prev) =>
            prev.map((a) => (a.id_analito === analitoEditar.id ? { ...a, nombre: trimmed } : a))
          );
          setAnalitoEditar(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditandoAnalito(false);
    }
  };

  const handleCrearAnalitoRapido = async () => {
    const trimmed = nombreNuevoAnalito.trim();
    if (!trimmed) return;

    setCreandoAnalito(true);
    try {
      const nuevo = await GestionLeyesService.crearAnalito(trimmed, desplegableNuevoAnalito);
      
      // Asociar al grupo solo si está marcado
      if (asociarNuevoAnalito) {
        setAsociados((prev) => [
          ...prev,
          {
            id_analito: nuevo.id,
            nombre: nuevo.nombre,
            es_desplegable: nuevo.es_desplegable,
            para_valorizacion_oro: false,
            para_valorizacion_plata: false,
            para_valorizacion_humedad: false,
            para_valorizacion_recuperacion: false,
          },
        ]);
      }

      // Notificar al padre para actualizar su catálogo general
      if (onAnalitoCreado) {
        onAnalitoCreado(nuevo);
      }

      if (asociarNuevoAnalito) {
        notifySuccess("Analito creado y asociado correctamente");
      } else {
        notifySuccess("Analito creado correctamente");
      }

      // Resetear campos y cerrar sub-modal
      setNombreNuevoAnalito("");
      setDesplegableNuevoAnalito(false);
      setAsociarNuevoAnalito(true);
      setOpenedCrearAnalito(false);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error al crear el analito";
      notifyError(msg);
    } finally {
      setCreandoAnalito(false);
    }
  };

  // Filtrar analitos que ya están asociados
  const analitosFiltrados = analitosDisponibles.filter(
    (a) => !asociados.some((asoc) => asoc.id_analito === a.id)
  );

  const handleAgregarAnalito = () => {
    if (!analitoSeleccionado) return;
    const id = Number(analitoSeleccionado);
    const analito = analitosDisponibles.find((a) => a.id === id);

    if (analito) {
      setAsociados((prev) => [
        ...prev,
        {
          id_analito: analito.id,
          nombre: analito.nombre,
          es_desplegable: analito.es_desplegable,
          para_valorizacion_oro: false,
          para_valorizacion_plata: false,
          para_valorizacion_humedad: false,
          para_valorizacion_recuperacion: false,
        },
      ]);
      setAnalitoSeleccionado(null);
    }
  };

  const handleQuitarAnalito = (idAnalito: number) => {
    setAsociados((prev) => prev.filter((a) => a.id_analito !== idAnalito));
  };

  const handleOptionChange = (idAnalito: number, val: string) => {
    setAsociados((prev) => {
      return prev.map((item) => {
        if (item.id_analito === idAnalito) {
          // Asigna la opción seleccionada y apaga las demás en la misma fila
          return {
            ...item,
            para_valorizacion_oro: val === "oro",
            para_valorizacion_plata: val === "plata",
            para_valorizacion_humedad: val === "humedad",
            para_valorizacion_recuperacion: val === "recuperacion",
          };
        } else {
          // Apaga la bandera correspondiente en las otras filas (Exclusividad a nivel de grupo)
          return {
            ...item,
            para_valorizacion_oro: val === "oro" ? false : item.para_valorizacion_oro,
            para_valorizacion_plata: val === "plata" ? false : item.para_valorizacion_plata,
            para_valorizacion_humedad: val === "humedad" ? false : item.para_valorizacion_humedad,
            para_valorizacion_recuperacion: val === "recuperacion" ? false : item.para_valorizacion_recuperacion,
          };
        }
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload: CrearGrupoPayload = {
      nombre,
      orden,
      indicar_origen: indicarOrigen,
      analitos: asociados.map((a) => ({
        id_analito: a.id_analito,
        para_valorizacion_oro: a.para_valorizacion_oro,
        para_valorizacion_plata: a.para_valorizacion_plata,
        para_valorizacion_humedad: a.para_valorizacion_humedad,
        para_valorizacion_recuperacion: a.para_valorizacion_recuperacion,
      })),
    };

    setSaving(true);
    const idGrupo = grupo ? grupo.id : null;
    const success = await onSuccess(idGrupo, payload);
    setSaving(false);
    if (success) {
      onCancel();
    }
  };

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
                              onChange={() => handleOptionChange(item.id_analito, "ninguno")}
                              color="red"
                              classNames={{ label: "text-zinc-400 text-xs font-medium" }}
                            />
                            <Radio
                              label="Oro"
                              size="xs"
                              name={`val-${item.id_analito}`}
                              checked={currentVal === "oro"}
                              onChange={() => handleOptionChange(item.id_analito, "oro")}
                              color="yellow"
                              disabled={banderasOcupadas.oro && currentVal !== "oro"}
                              classNames={{ label: "text-amber-400 text-xs font-semibold" }}
                            />
                            <Radio
                              label="Plata"
                              size="xs"
                              name={`val-${item.id_analito}`}
                              checked={currentVal === "plata"}
                              onChange={() => handleOptionChange(item.id_analito, "plata")}
                              color="gray"
                              disabled={banderasOcupadas.plata && currentVal !== "plata"}
                              classNames={{ label: "text-zinc-300 text-xs font-semibold" }}
                            />
                            <Radio
                              label="Humedad"
                              size="xs"
                              name={`val-${item.id_analito}`}
                              checked={currentVal === "humedad"}
                              onChange={() => handleOptionChange(item.id_analito, "humedad")}
                              color="blue"
                              disabled={banderasOcupadas.humedad && currentVal !== "humedad"}
                              classNames={{ label: "text-blue-400 text-xs font-semibold" }}
                            />
                            <Radio
                              label="Recup."
                              size="xs"
                              name={`val-${item.id_analito}`}
                              checked={currentVal === "recuperacion"}
                              onChange={() => handleOptionChange(item.id_analito, "recuperacion")}
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
                              onClick={() => handleStartEditarAnalito(item.id_analito, item.nombre, item.es_desplegable)}
                              className="hover:bg-indigo-950/20"
                              title="Editar Analito"
                            >
                              <PencilIcon className="w-4 h-4 text-indigo-400" />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => handleQuitarAnalito(item.id_analito)}
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

    <ModalEstandar
      opened={openedCrearAnalito}
      close={() => setOpenedCrearAnalito(false)}
      title="Crear Nuevo Analito"
      size="sm"
    >
      <Stack gap="md" className="p-1">
        <TextInput
          label="Nombre del Analito"
          placeholder="Ej. Cu, Zn..."
          value={nombreNuevoAnalito}
          onChange={(e) => setNombreNuevoAnalito(e.currentTarget.value)}
          required
          radius="lg"
          classNames={{
            label: "text-zinc-400 mb-1.5 font-medium text-sm",
            input:
              "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[42px] rounded-xl",
          }}
        />
        <Switch
          label="¿Es Desplegable?"
          checked={desplegableNuevoAnalito}
          onChange={(e) => setDesplegableNuevoAnalito(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            body: "items-center",
          }}
        />
        <Switch
          label="Asociar automáticamente a este grupo"
          checked={asociarNuevoAnalito}
          onChange={(e) => setAsociarNuevoAnalito(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            body: "items-center",
          }}
        />
        <Group justify="flex-end" gap="sm" className="mt-4">
          <Button
            variant="subtle"
            onClick={() => {
              setOpenedCrearAnalito(false);
              setNombreNuevoAnalito("");
              setDesplegableNuevoAnalito(false);
            }}
            radius="lg"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrearAnalitoRapido}
            loading={creandoAnalito}
            radius="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Crear Analito
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>

    <ModalEstandar
      opened={!!analitoEditar}
      close={() => setAnalitoEditar(null)}
      title="Editar Analito"
      size="sm"
    >
      <Stack gap="md" className="p-1">
        <TextInput
          label="Nombre del Analito"
          placeholder="Ej. Cu, Zn..."
          value={nombreEditarAnalito}
          onChange={(e) => setNombreEditarAnalito(e.currentTarget.value)}
          required
          radius="lg"
          classNames={{
            label: "text-zinc-400 mb-1.5 font-medium text-sm",
            input:
              "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[42px] rounded-xl",
          }}
        />
        <Switch
          label="¿Es Desplegable?"
          checked={desplegableEditarAnalito}
          onChange={(e) => setDesplegableEditarAnalito(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            body: "items-center",
          }}
        />
        <Group justify="flex-end" gap="sm" className="mt-4">
          <Button
            variant="subtle"
            onClick={() => setAnalitoEditar(null)}
            radius="lg"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditarAnalitoGuardar}
            loading={editandoAnalito}
            radius="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  </>
  );
};
