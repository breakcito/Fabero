import { useState, useEffect } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  Text,
  Grid,
  Select,
  Tooltip,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { IconPlus, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { FormZonaOrigen } from "../../../../presentation/utils/form-zona-origen";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroEncargadoMuestra } from "../../../encargados-muestra/presentation/registro-encargado-muestra/registro-encargado-muestra";
import { AuxService } from "../../../../service/auxiliar.service";
import { RecepcionMineralService } from "../../../recepcion-mineral/service/recepcion-mineral.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_EncargadoMuestraGlobal } from "../../../../service/responses/encargado-muestra-global";
import type { RES_ZonaOrigen } from "../../../../service/responses/zona-origen";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_ResumenBalanzaItem } from "../../service/resumen-balanza.responses";
import type { DTO_PesoFinal } from "../../../recepcion-mineral/service/recepcion-mineral.requests";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  lote: RES_ResumenBalanzaItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarResumenLote = ({ opened, lote, onClose, onSuccess }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  // Estados Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [encargados, setEncargados] = useState<RES_EncargadoMuestraGlobal[]>([]);
  const [zonas, setZonas] = useState<RES_ZonaOrigen[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<RES_EmpresaTransporte[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Estados Sub-Modals
  const [openZonaModal, setOpenZonaModal] = useState(false);
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState("");
  const [openEncargadoModal, setOpenEncargadoModal] = useState(false);

  // Estados Formulario
  const [tipoCarga, setTipoCarga] = useState<string>(lote.lote_tipo_carga || "Granel");
  const [idProveedor, setIdProveedor] = useState<string | null>(lote.id_proveedor ? String(lote.id_proveedor) : null);
  const [idEncargado, setIdEncargado] = useState<string | null>(lote.id_encargado_muestra ? String(lote.id_encargado_muestra) : null);
  const [idZona, setIdZona] = useState<string | null>(lote.id_zona_origen ? String(lote.id_zona_origen) : null);
  const [contacto, setContacto] = useState<string>(lote.lote_numero_contacto || "");
  const [producto, setProducto] = useState<string>(lote.lote_tipo_producto || "Aurífero");
  const [material, setMaterial] = useState<string>(lote.lote_tipo_mineral || "Mixto");
  const [observacionInicial, setObservacionInicial] = useState<string>(lote.observacion_peso_inicial || "");
  const [pesoInicial, setPesoInicial] = useState<string>(lote.peso_inicial ? String(lote.peso_inicial) : "");
  
  const [pesoFinal, setPesoFinal] = useState<string>(lote.peso_final ? String(lote.peso_final) : "");
  const [observacionFinal, setObservacionFinal] = useState<string>(lote.observacion_peso_final || "");

  // Transporte
  const [idVehiculo, setIdVehiculo] = useState<string | null>(lote.id_vehiculo ? String(lote.id_vehiculo) : null);
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(
    lote.id_empresa_transporte ? String(lote.id_empresa_transporte) : null
  );
  const [idConductor, setIdConductor] = useState<string | null>(lote.id_conductor ? String(lote.id_conductor) : null);

  // Evidencias
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>(lote.lote_evidencias || []);
  const [submitting, setSubmitting] = useState(false);

  const handleRemoveExistente = (path_relativo: string) => {
    setEvidenciasExistentes((prev) => prev.filter((e) => e.path_relativo !== path_relativo));
  };

  // Carga de catálogos
  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resProv, resEnc, resZonas, resCond, resVeh, resEmp] = await Promise.all([
        AuxService.get_proveedores(),
        AuxService.get_encargados_muestra(),
        AuxService.get_zonas_origen(),
        AuxService.get_conductores(),
        AuxService.get_vehiculos(),
        AuxService.get_empresas_transporte(),
      ]);

      setProveedores(resProv.data || []);
      setEncargados(resEnc || []);
      setZonas(resZonas || []);
      setConductores(resCond || []);
      setVehiculos(resVeh || []);
      setEmpresasTransporte(resEmp || []);
    } catch (e) {
      console.error("Error al cargar catálogos en edición de lote", e);
      notifyError("Ocurrió un error al cargar la información de los catálogos.");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchCatalogos();
      // Reiniciar estados del formulario con el lote seleccionado
      setTipoCarga(lote.lote_tipo_carga || "Granel");
      setIdProveedor(lote.id_proveedor ? String(lote.id_proveedor) : null);
      setIdEncargado(lote.id_encargado_muestra ? String(lote.id_encargado_muestra) : null);
      setIdZona(lote.id_zona_origen ? String(lote.id_zona_origen) : null);
      setContacto(lote.lote_numero_contacto || "");
      setProducto(lote.lote_tipo_producto || "Aurífero");
      setMaterial(lote.lote_tipo_mineral || "Mixto");
      setObservacionInicial(lote.observacion_peso_inicial || "");
      setPesoInicial(lote.peso_inicial ? String(lote.peso_inicial) : "");
      setPesoFinal(lote.peso_final ? String(lote.peso_final) : "");
      setObservacionFinal(lote.observacion_peso_final || "");
      setIdVehiculo(lote.id_vehiculo ? String(lote.id_vehiculo) : null);
      setIdEmpresaTransporte(lote.id_empresa_transporte ? String(lote.id_empresa_transporte) : null);
      setIdConductor(lote.id_conductor ? String(lote.id_conductor) : null);
      setEvidenciasExistentes(lote.lote_evidencias || []);
      setEvidencias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, lote]);

  const handleProveedorChange = (val: string | null) => {
    setIdProveedor(val);
    if (val) {
      const p = proveedores.find((x) => String(x.id_proveedor) === val);
      if (p && p.telefono) {
        setContacto(p.telefono);
      }
    }
  };

  // Valores calculados
  const pesoBruto = pesoInicial ? Number(pesoInicial) : 0;
  const tara = pesoFinal ? Number(pesoFinal) : 0;
  const pesoNeto = pesoBruto - tara;

  const handleConfirmar = async () => {
    if (!pesoBruto || pesoBruto <= 0) {
      notifyError("Debe ingresar un peso inicial válido y mayor a cero.");
      return;
    }

    if (pesoFinal && (isNaN(Number(pesoFinal)) || Number(pesoFinal) <= 0)) {
      notifyError("Debe ingresar un peso final (tara) válido.");
      return;
    }

    if (pesoFinal && Number(pesoFinal) >= pesoBruto) {
      notifyError("El peso final (tara) no puede ser mayor o igual al peso inicial (bruto).");
      return;
    }

    setSubmitting(true);
    try {
      const dto: DTO_PesoFinal = {
        peso_inicial: pesoBruto,
        observacion_peso_inicial: observacionInicial,
        peso_final: pesoFinal ? Number(pesoFinal) : 0,
        observacion_peso_final: observacionFinal,
        evidencias: evidencias,
        evidencias_existentes: evidenciasExistentes,
        id_proveedor_minero: idProveedor ? Number(idProveedor) : null,
        id_encargado_muestra: idEncargado ? Number(idEncargado) : null,
        id_zona_origen: idZona ? Number(idZona) : null,
        numero_contacto: contacto,
        tipo_carga: tipoCarga,
        tipo_producto: producto,
        tipo_mineral: material,
        id_vehiculo: idVehiculo ? Number(idVehiculo) : null,
        id_empresa_transporte: idEmpresaTransporte ? Number(idEmpresaTransporte) : null,
        id_conductor: idConductor ? Number(idConductor) : null,
      };

      await RecepcionMineralService.actualizar_lote(lote.id_lote, dto);
      notifySuccess("Lote actualizado correctamente");
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-semibold text-xs mb-1.5",
  };

  const selectComboboxProps = {
    transitionProps: { transition: "pop-top-left" as const, duration: 150 },
    dropdownPadding: 6,
    shadow: "md",
    withinPortal: true,
  };

  const selectClassNames = {
    ...fieldClasses,
    dropdown: "bg-zinc-950 border-zinc-800 text-white rounded-lg shadow-2xl",
    option:
      "hover:bg-zinc-900 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors py-2 px-3 data-[selected]:bg-indigo-600 data-[selected]:text-white",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Editar Información del Lote: ${lote.lote_correlativo}`}
      size="xl"
    >
      <Stack gap="md" className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <Grid gutter="md">
          {/* Columna Izquierda: Información de Pesaje y Lote */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
              <Text size="xs" fw={800} className="text-indigo-400 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
                Detalles del Lote y Mineral
              </Text>

              <Grid gutter="sm">
                <Grid.Col span={6}>
                  <Select
                    label="Tipo Carga:"
                    placeholder="Seleccione"
                    data={["Granel", "Sacos", "Mixto"]}
                    value={tipoCarga}
                    onChange={(val) => setTipoCarga(val || "Granel")}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Proveedor Minero:"
                    placeholder="Seleccione"
                    searchable
                    disabled={loadingCatalogos}
                    data={proveedores.map((p) => ({ value: String(p.id_proveedor), label: `${p.razon_social} (${p.documento})` }))}
                    value={idProveedor}
                    onChange={handleProveedorChange}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label="Producto:"
                    placeholder="Seleccione"
                    data={["Aurífero", "Polimetálico"]}
                    value={producto}
                    onChange={(val) => setProducto(val || "Aurífero")}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Tipo Material:"
                    placeholder="Seleccione"
                    data={["Mixto", "Óxido", "Sulfuro"]}
                    value={material}
                    onChange={(val) => setMaterial(val || "Mixto")}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <div className="flex gap-1.5 items-end">
                    <Select
                      label="Zona Origen:"
                      placeholder="Seleccione..."
                      searchable
                      disabled={loadingCatalogos}
                      data={zonas.map((z) => ({ value: String(z.id), label: z.nombre }))}
                      value={idZona}
                      onChange={setIdZona}
                      classNames={selectClassNames}
                      radius="lg"
                      comboboxProps={selectComboboxProps}
                      className="flex-1"
                    />
                    <Tooltip label="Agregar Zona" withArrow>
                      <ActionIcon
                        type="button"
                        variant="filled"
                        color="zinc"
                        radius="lg"
                        onClick={() => setOpenZonaModal(true)}
                        className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-[36px] w-[36px] mb-0.5"
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </Grid.Col>
                <Grid.Col span={6}>
                  <div className="flex gap-1.5 items-end">
                    <Select
                      label="Encargado Muestra:"
                      placeholder="Seleccione..."
                      searchable
                      disabled={loadingCatalogos}
                      data={encargados.map((e) => ({ value: String(e.id_encargado_muestra), label: e.nombre }))}
                      value={idEncargado}
                      onChange={setIdEncargado}
                      classNames={selectClassNames}
                      radius="lg"
                      comboboxProps={selectComboboxProps}
                      className="flex-1"
                    />
                    <Tooltip label="Agregar Encargado" withArrow>
                      <ActionIcon
                        type="button"
                        variant="filled"
                        color="zinc"
                        radius="lg"
                        onClick={() => setOpenEncargadoModal(true)}
                        className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-[36px] w-[36px] mb-0.5"
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    label="N° Contacto:"
                    value={contacto}
                    onChange={(e) => setContacto(e.currentTarget.value)}
                    classNames={fieldClasses}
                    radius="lg"
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Peso Inicial (Kg):"
                    value={pesoInicial}
                    onChange={(e) => setPesoInicial(e.currentTarget.value.replace(/\D/g, ""))}
                    classNames={fieldClasses}
                    radius="lg"
                    required
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    label="Peso Final / Tara (Kg):"
                    value={pesoFinal}
                    onChange={(e) => setPesoFinal(e.currentTarget.value.replace(/\D/g, ""))}
                    classNames={fieldClasses}
                    radius="lg"
                  />
                </Grid.Col>
                <Grid.Col span={6} className="flex items-end">
                  <div className="bg-zinc-950/60 border border-zinc-900/80 p-2 rounded-xl flex justify-between items-center gap-3 w-full h-[40px]">
                    <div className="flex-1 text-center border-r border-zinc-900">
                      <Text size="8px" fw={700} c="dimmed">NETO CALCULADO</Text>
                      <Text size="xs" fw={900} c="emerald.4" className="font-mono">{pesoNeto >= 0 ? pesoNeto.toLocaleString() : "0"} Kg</Text>
                    </div>
                  </div>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Textarea
                    label="Observación Peso Inicial:"
                    placeholder="Observaciones de ingreso..."
                    value={observacionInicial}
                    onChange={(e) => setObservacionInicial(e.currentTarget.value)}
                    classNames={fieldClasses}
                    radius="lg"
                    minRows={1}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Textarea
                    label="Observación Peso Final (Tara):"
                    placeholder="Observaciones de salida..."
                    value={observacionFinal}
                    onChange={(e) => setObservacionFinal(e.currentTarget.value)}
                    classNames={fieldClasses}
                    radius="lg"
                    minRows={1}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </Grid.Col>

          {/* Columna Derecha: Transporte e Imágenes */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
                <Text size="xs" fw={800} className="text-amber-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
                  Datos de Transporte
                </Text>

                <Stack gap="md">
                  <Select
                    label="Vehículo / Placa:"
                    placeholder="Seleccione placa"
                    searchable
                    disabled={loadingCatalogos}
                    data={vehiculos.map((v) => ({
                      value: String(v.id_vehiculo),
                      label: v.serie_placa ? `${v.serie_placa}-${v.numero_placa}` : v.numero_placa,
                    }))}
                    value={idVehiculo}
                    onChange={setIdVehiculo}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                  />

                  <Select
                    label="Empresa de Transporte:"
                    placeholder="Particular / Propio"
                    searchable
                    clearable
                    disabled={loadingCatalogos}
                    data={empresasTransporte.map((et) => ({
                      value: String(et.id_empresa_transporte),
                      label: et.razon_social,
                    }))}
                    value={idEmpresaTransporte}
                    onChange={setIdEmpresaTransporte}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                  />

                  <Select
                    label="Conductor:"
                    placeholder="Seleccione conductor"
                    searchable
                    disabled={loadingCatalogos}
                    data={conductores.map((c) => ({
                      value: String(c.id_conductor),
                      label: `${c.nombre_completo} (${c.numero_licencia || "Sin Licencia"})`,
                    }))}
                    value={idConductor}
                    onChange={setIdConductor}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                  />
                </Stack>
              </Paper>

              {/* Evidencias Existentes */}
              {evidenciasExistentes.length > 0 && (
                <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
                  <Text size="xs" fw={800} className="text-zinc-400 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
                    Evidencias Existentes
                  </Text>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evidenciasExistentes.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-900 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                          {file.extension?.match(/(jpg|jpeg|png|webp|gif)/i) ? (
                            <img src={file.url} className="w-8 h-8 object-cover rounded-md shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center text-[10px] text-zinc-500 font-bold uppercase shrink-0">
                              {file.extension || "FILE"}
                            </div>
                          )}
                          <Text size="xs" className="text-zinc-300 truncate" title={file.nombre_original || undefined}>
                            {file.nombre_original}
                          </Text>
                        </div>
                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleRemoveExistente(file.path_relativo)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </div>
                    ))}
                  </div>
                </Paper>
              )}

              {/* Evidencias adicionales */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl">
                <MultiFilePicker
                  files={evidencias}
                  onFilesChange={setEvidencias}
                  label="Anexar Nuevas Evidencias"
                  description="Adjunte imágenes adicionales"
                />
              </div>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-zinc-800">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onClose}
            disabled={submitting}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            radius="lg"
            loading={submitting}
            onClick={handleConfirmar}
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-900/20 px-8"
          >
            Guardar Cambios
          </Button>
        </div>
      </Stack>

      {/* Sub-Modal: Registro de Nueva Zona de Origen */}
      <ModalEstandar
        opened={openZonaModal}
        close={() => setOpenZonaModal(false)}
        title="Registrar Nueva Zona de Origen"
        size="sm"
      >
        <FormZonaOrigen
          nombre={nuevaZonaNombre}
          setNombre={setNuevaZonaNombre}
          zonasExistentes={zonas}
          onSuccess={(nueva) => {
            setZonas((prev) => [...prev, nueva]);
            setIdZona(String(nueva.id));
            setNuevaZonaNombre("");
            setOpenZonaModal(false);
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro de Nuevo Encargado de Muestra */}
      <ModalEstandar
        opened={openEncargadoModal}
        close={() => setOpenEncargadoModal(false)}
        title="Registrar Nuevo Encargado de Muestra"
        size="md"
      >
        <RegistroEncargadoMuestra
          onCancel={() => setOpenEncargadoModal(false)}
          onSuccess={(nuevo) => {
            const formatted: RES_EncargadoMuestraGlobal = {
              id_encargado_muestra: nuevo.id_encargado_muestra,
              nombre: `${nuevo.nombre} ${nuevo.apellido}`.trim(),
            };
            setEncargados((prev) => [...prev, formatted]);
            setIdEncargado(String(nuevo.id_encargado_muestra));
            setOpenEncargadoModal(false);
          }}
        />
      </ModalEstandar>
    </ModalEstandar>
  );
};
