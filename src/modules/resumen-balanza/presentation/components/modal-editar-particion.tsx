import { useState, useEffect } from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Stack,
  Text,
  Group,
  Grid,
  Select,
  Tooltip,
  Input,
  Loader,
  Alert,
  Paper,
} from "@mantine/core";
import { IconDeviceFloppy, IconInfoCircle } from "@tabler/icons-react";
import { z } from "zod";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { AuxService } from "../../../../service/auxiliar.service";
import { RecepcionMineralService } from "../../../recepcion-mineral/service/recepcion-mineral.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_ZonaOrigen } from "../../../../service/responses/zona-origen";
import type { RES_ResumenBalanzaItem } from "../../service/resumen-balanza.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";
import { TipoMineral } from "../../../../shared/enums/_generic/tipo-mineral";

interface Props {
  opened: boolean;
  particion: RES_ResumenBalanzaItem;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z
  .object({
    peso_inicial: z.number(),
    peso_final: z.number(),
  })
  .refine((d) => Number.isFinite(d.peso_inicial) && d.peso_inicial > 0, {
    message: "Ingrese un peso inicial (bruto) mayor a cero.",
    path: ["peso_inicial"],
  })
  .refine((d) => Number.isFinite(d.peso_final) && d.peso_final > 0, {
    message: "Ingrese un peso final (tara) mayor a cero.",
    path: ["peso_final"],
  })
  .refine((d) => d.peso_final < d.peso_inicial, {
    message: "El peso final (tara) no puede ser mayor o igual al peso inicial (bruto).",
    path: ["peso_final"],
  });

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

/**
 * Edición de una partición de un lote pesado en balanza.
 *
 * Dos alcances:
 *  - Datos PROPIOS de la partición: pesos y evidencias.
 *  - Datos NO-PESO del LOTE PADRE (proveedor, zona, contacto, producto, mineral):
 *    se guardan en el padre y el resto de particiones los heredan (cascada).
 *    El modal lo advierte explícitamente.
 *
 * El transporte (vehículo / empresa / conductor) pertenece a la unidad que
 * alojó la partición: no se edita aquí.
 */
export const ModalEditarParticion = ({
  opened,
  particion,
  onClose,
  onSuccess,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  // Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [zonas, setZonas] = useState<RES_ZonaOrigen[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Formulario — datos de la partición
  const [pesoInicial, setPesoInicial] = useState<number | string>(
    particion.peso_inicial ?? ""
  );
  const [pesoFinal, setPesoFinal] = useState<number | string>(
    particion.peso_final ?? ""
  );

  // Formulario — datos no-peso del lote padre (cascada)
  const [idProveedor, setIdProveedor] = useState<string | null>(
    particion.id_proveedor ? String(particion.id_proveedor) : null
  );
  const [idZona, setIdZona] = useState<string | null>(
    particion.id_zona_origen ? String(particion.id_zona_origen) : null
  );
  const [contacto, setContacto] = useState<string>(
    particion.lote_numero_contacto || ""
  );
  const [producto, setProducto] = useState<string>(
    particion.lote_tipo_producto || TipoMineral.Aurifero
  );
  const [material, setMaterial] = useState<string>(
    particion.lote_tipo_mineral || "Mixto"
  );

  // Evidencias
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>(
    particion.particion_evidencias || []
  );

  // Auditoría
  const [motivo, setMotivo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resProv, resZonas] = await Promise.all([
        AuxService.get_proveedores(),
        AuxService.get_zonas_origen(),
      ]);
      setProveedores(resProv.data || []);
      setZonas(resZonas || []);
    } catch (e) {
      console.error("Error al cargar catálogos en edición de partición", e);
      notifyError("Ocurrió un error al cargar la información de los catálogos.");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    if (!opened) return;
    fetchCatalogos();
    setPesoInicial(particion.peso_inicial ?? "");
    setPesoFinal(particion.peso_final ?? "");
    setIdProveedor(
      particion.id_proveedor ? String(particion.id_proveedor) : null
    );
    setIdZona(
      particion.id_zona_origen ? String(particion.id_zona_origen) : null
    );
    setContacto(particion.lote_numero_contacto || "");
    setProducto(particion.lote_tipo_producto || TipoMineral.Aurifero);
    setMaterial(particion.lote_tipo_mineral || "Mixto");
    setEvidenciasExistentes(particion.particion_evidencias || []);
    setEvidencias([]);
    setMotivo("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, particion]);

  const handleRemoveExistente = (path_relativo: string) => {
    setEvidenciasExistentes((prev) =>
      prev.filter((e) => e.path_relativo !== path_relativo)
    );
  };

  const pesoBruto = Number(pesoInicial) || 0;
  const tara = Number(pesoFinal) || 0;
  const pesoNeto = pesoBruto - tara;

  const handleConfirmar = async () => {
    if (particion.id_particion == null) {
      notifyError("Esta fila no corresponde a una partición editable.");
      return;
    }

    const parsed = formSchema.safeParse({
      peso_inicial: pesoBruto,
      peso_final: tara,
    });
    if (!parsed.success) {
      notifyError(
        parsed.error.issues[0]?.message ||
          "Por favor revise los campos ingresados"
      );
      return;
    }

    setSubmitting(true);
    try {
      await RecepcionMineralService.actualizar_particion(particion.id_particion, {
        peso_inicial: parsed.data.peso_inicial,
        peso_final: parsed.data.peso_final,
        evidencias,
        evidencias_existentes: evidenciasExistentes,
        id_proveedor_minero: idProveedor ? Number(idProveedor) : null,
        id_zona_origen: idZona ? Number(idZona) : null,
        numero_contacto: contacto,
        tipo_producto: producto,
        tipo_mineral: material,
        motivo: motivo || undefined,
      });
      notifySuccess("Partición actualizada correctamente");
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      notifyError(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar la partición"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const letra = particion.particion_letra || "?";

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Editar Partición ${letra} · ${particion.lote_correlativo ?? ""}`}
      size="xl"
    >
      <Stack
        gap="md"
        className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Sección 1: Datos propios de la partición */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text
            size="xs"
            fw={800}
            className="text-indigo-400 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900"
          >
            Datos de la Partición
          </Text>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label="Peso Inicial / Bruto (Kg):"
                value={pesoInicial}
                onChange={setPesoInicial}
                min={0}
                decimalScale={3}
                fixedDecimalScale
                hideControls
                size="xs"
                radius="lg"
                required
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label="Peso Final / Tara (Kg):"
                value={pesoFinal}
                onChange={setPesoFinal}
                min={0}
                decimalScale={3}
                fixedDecimalScale
                hideControls
                size="xs"
                radius="lg"
                required
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Input.Wrapper
                label="Peso Neto (Kg):"
                classNames={fieldClasses}
              >
                <Tooltip
                  label="Calculado automáticamente (Peso Inicial − Tara)"
                  withArrow
                >
                  <div className="bg-gradient from-emerald-950/40 to-zinc-950/60 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center h-9.5 shadow-inner shadow-emerald-900/20">
                    <Text
                      size="sm"
                      fw={900}
                      c="emerald.3"
                      className="font-mono leading-none"
                    >
                      {pesoNeto > 0 ? pesoNeto.toLocaleString() : "0"}
                    </Text>
                  </div>
                </Tooltip>
              </Input.Wrapper>
            </Grid.Col>
          </Grid>

          <Text size="xs" c="dimmed" className="mt-3">
            Las fechas de pesaje no se modifican: son el registro histórico del
            pesaje de esta unidad.
          </Text>
        </Paper>

        {/* Sección 2: Datos no-peso del lote padre (cascada) */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text
            size="xs"
            fw={800}
            className="text-amber-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900"
          >
            Datos del Lote Padre (compartidos)
          </Text>

          <Alert
            variant="light"
            color="indigo"
            icon={<IconInfoCircle size={18} />}
            mb="md"
            className="text-xs"
          >
            Estos campos se guardan en el <strong>lote padre</strong>{" "}
            <strong>{particion.lote_correlativo}</strong> y los heredan el resto
            de sus particiones. Al guardar se actualizan todas las filas de la
            partición.
          </Alert>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Proveedor Minero:"
                placeholder={loadingCatalogos ? "Cargando..." : "Seleccione"}
                searchable
                disabled={loadingCatalogos}
                rightSection={
                  loadingCatalogos ? <Loader size={16} /> : undefined
                }
                data={proveedores.map((p) => ({
                  value: String(p.id_proveedor),
                  label: `${p.razon_social} (${p.documento})`,
                }))}
                value={idProveedor}
                onChange={setIdProveedor}
                size="xs"
                radius="lg"
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Zona Origen:"
                placeholder={loadingCatalogos ? "Cargando..." : "Seleccione..."}
                searchable
                disabled={loadingCatalogos}
                rightSection={
                  loadingCatalogos ? <Loader size={16} /> : undefined
                }
                data={zonas.map((z) => ({ value: String(z.id), label: z.nombre }))}
                value={idZona}
                onChange={setIdZona}
                size="xs"
                radius="lg"
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="N° Contacto:"
                value={contacto}
                onChange={(e) => setContacto(e.currentTarget.value)}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Producto:"
                placeholder="Seleccione"
                data={[TipoMineral.Aurifero, TipoMineral.Polimetalico]}
                value={producto}
                onChange={(val) => setProducto(val || TipoMineral.Aurifero)}
                size="xs"
                radius="lg"
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Tipo Material:"
                placeholder="Seleccione"
                data={["Mixto", "Óxido", "Sulfuro"]}
                value={material}
                onChange={(val) => setMaterial(val || "Mixto")}
                size="xs"
                radius="lg"
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Sección 3: Transporte de la unidad (solo lectura) */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text
            size="xs"
            fw={800}
            className="text-cyan-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900"
          >
            Transporte de la Unidad
          </Text>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Text size="11px" className="text-zinc-500 font-medium mb-1">
                Vehículo / Placa
              </Text>
              <Text size="sm" className="text-zinc-200 font-mono">
                {particion.vehiculo_placa || "SIN PLACA"}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Text size="11px" className="text-zinc-500 font-medium mb-1">
                Empresa de Transporte
              </Text>
              <Text size="sm" className="text-zinc-200">
                {particion.empresa_transporte_razon_social || "Particular / Propio"}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Text size="11px" className="text-zinc-500 font-medium mb-1">
                Conductor
              </Text>
              <Text size="sm" className="text-zinc-200">
                {particion.conductor_nombre_completo || "No registrado"}
              </Text>
            </Grid.Col>
          </Grid>

          <Text size="xs" c="dimmed" className="mt-3">
            El transporte pertenece a la unidad que recibió la partición y se
            edita desde <strong>Recepción de Mineral</strong>.
          </Text>
        </Paper>

        {/* Sección 4: Gestor de Evidencias de la partición */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl">
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            existingFiles={evidenciasExistentes}
            onRemoveExisting={handleRemoveExistente}
            label="Evidencias de la Partición"
            description="Archivos existentes de esta partición y nuevos por adjuntar"
          />
        </div>

        {/* Sección 5: Auditoría */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text
            size="xs"
            fw={800}
            className="text-amber-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900"
          >
            Auditoría
          </Text>
          <TextInput
            label="Motivo del Cambio (Opcional):"
            placeholder="Indique el motivo por el cual realiza los cambios (auditoría)..."
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />
        </Paper>

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm" mt="xs" pt="md" className="border-t border-zinc-800">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            size="xs"
            onClick={onClose}
            disabled={submitting}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            radius="lg"
            size="xs"
            loading={submitting}
            onClick={handleConfirmar}
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-900/20 px-8"
          >
            Guardar Cambios
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
