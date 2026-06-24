import { useState } from "react";
import { Button, Grid, Select, TextInput, Textarea, Alert, ActionIcon, Checkbox, Text } from "@mantine/core";
import { IconDeviceFloppy, IconExclamationCircle, IconPlus, IconTrash, IconFile, IconSearch, IconPencil } from "@tabler/icons-react";
import { useRegistroVisita } from "../../hooks/useRegistroVisita";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RecepcionVisitaResponse } from "../../service/recepcion-visitas.responses";

interface Props {
  onCancel: () => void;
  onSuccess: (r: RecepcionVisitaResponse) => void;
}

export const RegistroVisita = ({ onCancel, onSuccess }: Props) => {
  const {
    payload,
    handleChange,
    visitantes,
    handleAgregarVisitante,
    handleActualizarVisitante,
    handleRemoverVisitante,
    submit,
    loading,
    error,
    empleados,
    motivos,
    loadingCatalogos,
  } = useRegistroVisita(onSuccess);

  const [openVisitorModal, setOpenVisitorModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form local para nuevo/editar visitante en sub-modal
  const [visitorForm, setVisitorForm] = useState<{
    id_visitante?: number;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    fotos_documento: File[];
  }>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    fotos_documento: [],
  });

  const [searchingDni, setSearchingDni] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  const getEmpleadosDropdown = () => {
    return empleados.map((e) => ({
      value: String(e.id_empleado),
      label: e.nombre_completo,
    }));
  };

  const getMotivosDropdown = () => {
    return motivos.map((m) => ({
      value: String(m.id_motivo_ingreso),
      label: m.nombre,
    }));
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-medium text-xs mb-1.5",
  };

  const handleDniChange = async (val: string) => {
    // Limitar a 8 dígitos numéricos
    const cleanVal = val.replace(/\D/g, "").slice(0, 8);
    setVisitorForm((prev) => ({ ...prev, dni: cleanVal }));
    setVisitorError(null);

    if (cleanVal.length === 8) {
      setSearchingDni(true);
      try {
        const res = await AuxService.buscar_visitante_por_dni(cleanVal);
        if (res.success && res.data) {
          setVisitorForm((prev) => ({
            ...prev,
            id_visitante: res.data.id_visitante,
            nombre: res.data.nombre,
            apellido: res.data.apellido,
            telefono: res.data.telefono || "",
          }));
        } else {
          // Si no existe, limpiar campos por si había cargado antes
          setVisitorForm((prev) => ({
            ...prev,
            id_visitante: undefined,
            nombre: "",
            apellido: "",
            telefono: "",
          }));
        }
      } catch (err: unknown) {
        console.error(err);
        setVisitorForm((prev) => ({
          ...prev,
          id_visitante: undefined,
          nombre: "",
          apellido: "",
          telefono: "",
        }));
      } finally {
        setSearchingDni(false);
      }
    } else {
      setVisitorForm((prev) => ({
        ...prev,
        id_visitante: undefined,
        nombre: "",
        apellido: "",
        telefono: "",
      }));
    }
  };

  const handleOpenAddModal = () => {
    setVisitorForm({
      dni: "",
      nombre: "",
      apellido: "",
      telefono: "",
      fotos_documento: [],
    });
    setEditingIndex(null);
    setVisitorError(null);
    setOpenVisitorModal(true);
  };

  const handleOpenEditModal = (index: number) => {
    const v = visitantes[index];
    setVisitorForm({
      id_visitante: v.id_visitante,
      dni: v.dni,
      nombre: v.nombre,
      apellido: v.apellido,
      telefono: v.telefono,
      fotos_documento: v.foto_documento,
    });
    setEditingIndex(index);
    setVisitorError(null);
    setOpenVisitorModal(true);
  };

  const handleSaveVisitor = () => {
    setVisitorError(null);

    if (visitorForm.dni.length !== 8) {
      setVisitorError("El DNI debe tener 8 dígitos.");
      return;
    }
    if (!visitorForm.nombre.trim() || !visitorForm.apellido.trim()) {
      setVisitorError("Debe completar los nombres y apellidos del visitante.");
      return;
    }
    if (visitorForm.fotos_documento.length === 0) {
      setVisitorError("Debe adjuntar la foto del documento de identidad.");
      return;
    }

    const data = {
      id_visitante: visitorForm.id_visitante,
      dni: visitorForm.dni,
      nombre: visitorForm.nombre,
      apellido: visitorForm.apellido,
      telefono: visitorForm.telefono,
      foto_documento: visitorForm.fotos_documento,
    };

    if (editingIndex !== null) {
      const success = handleActualizarVisitante(editingIndex, data);
      if (!success) return;
    } else {
      const success = handleAgregarVisitante(data);
      if (!success) return;
    }

    // Resetear form y cerrar sub-modal
    setVisitorForm({
      dni: "",
      nombre: "",
      apellido: "",
      telefono: "",
      fotos_documento: [],
    });
    setEditingIndex(null);
    setOpenVisitorModal(false);
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-6">
        {error && (
          <Alert
            icon={<IconExclamationCircle size={16} />}
            color="red"
            variant="filled"
            radius="lg"
          >
            {error}
          </Alert>
        )}

        <Grid gutter="md">
          {/* Motivo Visita */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Motivo Visita"
              placeholder="Elija una opción..."
              searchable
              withAsterisk
              radius="lg"
              disabled={loadingCatalogos}
              data={getMotivosDropdown()}
              value={payload.id_motivo_ingreso ? String(payload.id_motivo_ingreso) : null}
              onChange={(val) => handleChange("id_motivo_ingreso", val ? Number(val) : 0)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Personal Contacto */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Personal Contacto"
              placeholder="Elija una opción..."
              searchable
              withAsterisk
              radius="lg"
              disabled={loadingCatalogos}
              data={getEmpleadosDropdown()}
              value={payload.id_empleado_contacto ? String(payload.id_empleado_contacto) : null}
              onChange={(val) => handleChange("id_empleado_contacto", val ? Number(val) : 0)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Observaciones */}
          <Grid.Col span={12}>
            <Textarea
              label="Observación"
              placeholder="Escriba alguna observación adicional sobre el ingreso..."
              radius="lg"
              minRows={3}
              value={payload.observacion || ""}
              onChange={(e) => handleChange("observacion", e.target.value)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Vehículo Checkbox */}
          <Grid.Col span={12}>
            <Checkbox
              label="Ingresa con Vehículo Particular"
              checked={payload.con_vehiculo}
              onChange={(e) => handleChange("con_vehiculo", e.currentTarget.checked)}
              classNames={{
                label: "text-zinc-300 text-sm font-semibold select-none cursor-pointer",
                input: "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 transition-all",
              }}
            />
          </Grid.Col>

          {/* Datos del Vehículo (Condicional) */}
          {payload.con_vehiculo && (
            <Grid.Col span={12} className="animate-slideDown">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <TextInput
                  label="Serie Placa"
                  placeholder="Ej. F1B"
                  radius="lg"
                  className="w-full sm:w-[150px]"
                  value={payload.serie_placa || ""}
                  onChange={(e) => handleChange("serie_placa", e.target.value.toUpperCase())}
                  classNames={fieldClasses}
                />
                <TextInput
                  label="Número Placa"
                  placeholder="Ej. 890"
                  radius="lg"
                  className="flex-1"
                  value={payload.numero_placa || ""}
                  onChange={(e) => handleChange("numero_placa", e.target.value.toUpperCase())}
                  classNames={fieldClasses}
                />
              </div>
            </Grid.Col>
          )}

          {/* Registro de Visitantes (Diseño de Tarjetas Moderno) */}
          <Grid.Col span={12} mt="md">
            <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-xl bg-zinc-950/40 p-4">
              <div className="bg-[#7A604D]/10 border border-[#7A604D]/25 px-4 py-2.5 rounded-2xl flex items-center justify-between mb-4">
                <Text size="xs" fw={800} className="text-amber-400 uppercase tracking-widest">
                  Registro de Visitantes
                </Text>
                <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-400">
                  {visitantes.length} Agregado{visitantes.length !== 1 ? "s" : ""}
                </div>
              </div>

              {visitantes.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                  <Text size="xs" c="zinc.5" fw={600} fs="italic">
                    No se han agregado visitantes a la lista.
                  </Text>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {visitantes.map((v, index) => (
                    <div
                      key={index}
                      className="group/card relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-zinc-900/30 border border-zinc-800/80 hover:border-[#7A604D]/30 transition-all rounded-2xl shadow-sm"
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7A604D]/10 border border-[#7A604D]/20 flex items-center justify-center text-[#7A604D] font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <Text size="sm" fw={800} className="text-zinc-200">
                            {v.nombre} {v.apellido}
                          </Text>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500 mt-0.5 font-mono">
                            <span>DNI: <strong className="text-zinc-400">{v.dni}</strong></span>
                            {v.telefono && (
                              <>
                                <span>•</span>
                                <span>Tel: <strong className="text-zinc-400">{v.telefono}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Doc / Action */}
                      <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-zinc-800/50 pt-2.5 md:pt-0">
                        {v.foto_documento && v.foto_documento.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {v.foto_documento.map((file, fidx) => (
                              <div key={fidx} className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800/50 p-1.5 px-3 rounded-xl max-w-[200px]">
                                <IconFile size={14} className="text-indigo-400 shrink-0" />
                                <Text size="xs" c="zinc.4" className="truncate font-mono leading-none">
                                  {file.name}
                                </Text>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <ActionIcon
                            type="button"
                            variant="light"
                            color="blue"
                            radius="xl"
                            size="md"
                            onClick={() => handleOpenEditModal(index)}
                            className="bg-blue-500/5 hover:bg-blue-500/10 text-blue-400"
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                          <ActionIcon
                            type="button"
                            variant="light"
                            color="red"
                            radius="xl"
                            size="md"
                            onClick={() => handleRemoverVisitante(index)}
                            className="bg-red-500/5 hover:bg-red-500/10 text-red-400"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
 
              {/* Botón agregar visitante */}
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="filled"
                  radius="xl"
                  leftSection={<IconPlus size={16} />}
                  onClick={handleOpenAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Agregar Visita
                </Button>
              </div>
            </div>
          </Grid.Col>
        </Grid>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onCancel}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            type="submit"
            loading={loading}
            radius="lg"
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Confirmar
          </Button>
        </div>
      </form>

      {/* Sub-modal: Agregar/Editar un Visitante */}
      <ModalEstandar
        opened={openVisitorModal}
        close={() => {
          setOpenVisitorModal(false);
          setVisitorError(null);
        }}
        title={editingIndex !== null ? "Editar Visitante" : "Agregar Visitante"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {visitorError && (
            <Alert
              icon={<IconExclamationCircle size={16} />}
              color="red"
              variant="filled"
              radius="lg"
            >
              {visitorError}
            </Alert>
          )}

          {/* DNI Search */}
          <TextInput
            label="Documento de Identidad (DNI)"
            placeholder="Ingrese DNI (8 dígitos)"
            radius="lg"
            value={visitorForm.dni}
            onChange={(e) => handleDniChange(e.target.value)}
            disabled={searchingDni}
            leftSection={
              searchingDni ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400" />
              ) : (
                <IconSearch size={16} className="text-zinc-500" />
              )
            }
            classNames={fieldClasses}
          />

          

          {/* Nombre */}
          <TextInput
            label="Nombres"
            placeholder="Nombres del visitante"
            radius="lg"
            value={visitorForm.nombre}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, nombre: e.target.value }))}
            classNames={fieldClasses}
          />

          {/* Apellido */}
          <TextInput
            label="Apellidos"
            placeholder="Apellidos del visitante"
            radius="lg"
            value={visitorForm.apellido}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, apellido: e.target.value }))}
            classNames={fieldClasses}
          />

          {/* Teléfono */}
          <TextInput
            label="Teléfono (Opcional)"
            placeholder="Ej: 987654321"
            radius="lg"
            value={visitorForm.telefono}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, telefono: e.target.value }))}
            classNames={fieldClasses}
          />

          {/* Foto Documento */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl">
            <MultiFilePicker
              files={visitorForm.fotos_documento}
              onFilesChange={(files) => setVisitorForm((prev) => ({ ...prev, fotos_documento: files }))}
              label="Foto del Documento de Identidad"
              description="Suba una o varias fotografías o capturas claras del documento de identidad del visitante."
              multiple={true}
              maxFiles={10}
              accept="image/*,application/pdf"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => {
                setOpenVisitorModal(false);
                setVisitorError(null);
              }}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveVisitor}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar a la Lista"}
            </Button>
          </div>
        </div>
      </ModalEstandar>
    </>
  );
};
