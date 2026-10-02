import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Loader,
  Box,
  Tooltip,
  ActionIcon,
  Badge,
} from "@mantine/core";
import { IconCheck, IconCoin, IconFileText, IconPlus } from "@tabler/icons-react";
import { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { formatNumber } from "../../../../shared/functions/formatNumber";
import { AuxService } from "../../../../service/auxiliar.service";
import { ModalRegistrarPrecioInter } from "../../../valorizacion-compra/presentation/components/modal-registrar-precio-inter";
import type { REQ_ValorizacionVentaDetalleItem } from "../../service/valorizacion-venta.requests";
import type {
  RES_ValorizacionVentaDetalle,
  RES_DespachoDetalleDisponible,
} from "../../service/valorizacion-venta.responses";
import { ValorizacionVentaAuxService } from "../../service/valorizacion-venta.service";

interface ExistingDetalleItem {
  id_despacho_detalle?: number;
  id_distribucion_detalle?: number;
  elemento_quimico: ElementoQuimicoValorizacion;
}

interface DetalleEditar {
  req: REQ_ValorizacionVentaDetalleItem;
  display: RES_ValorizacionVentaDetalle;
  index: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  idPlanta: number | null;
  idValorizacionEdicion?: number;
  existingDetalles?: ExistingDetalleItem[];
  detalleEditar?: DetalleEditar | null;
  fechaHoraValorizacion?: string | null;
  onAgregarDetalle: (
    det: REQ_ValorizacionVentaDetalleItem,
    display: RES_ValorizacionVentaDetalle,
  ) => void;
  onEditarDetalle?: (
    index: number,
    det: REQ_ValorizacionVentaDetalleItem,
    display: RES_ValorizacionVentaDetalle,
  ) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalAgregarDespachoDetalle = ({
  opened,
  onClose,
  idPlanta,
  idValorizacionEdicion,
  existingDetalles = [],
  detalleEditar = null,
  fechaHoraValorizacion,
  onAgregarDetalle,
  onEditarDetalle,
}: Props) => {
  const { notifyError, notifyWarning } = useNotify();

  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [detalles, setDetalles] = useState<RES_DespachoDetalleDisponible[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [elemento, setElemento] = useState<ElementoQuimicoValorizacion | null>(null);

  const [recuperacion, setRecuperacion] = useState<number | string>(0);
  const [inter, setInter] = useState<number | string>(0);
  const [desInter, setDesInter] = useState<number | string>(0);
  const [maquila, setMaquila] = useState<number | string>(0);
  const [consumo, setConsumo] = useState<number | string>(0);
  const [factor, setFactor] = useState<number | string>(1.1023);

  const [precioEncontrado, setPrecioEncontrado] = useState<{
    id: number;
    inter: number;
    fecha: string;
  } | null>(null);
  const [modalPrecioAbierto, setModalPrecioAbierto] = useState(false);

  const fechaCorta = fechaHoraValorizacion?.split(" ")[0] ?? null;

  useEffect(() => {
    if (!opened) {
      setDetalles([]);
      setSelectedId(null);
      setElemento(null);
      setPrecioEncontrado(null);
      return;
    }

    if (detalleEditar) {
      setDetalles([]);
      setLoadingDetalles(false);
      return;
    }

    if (!idPlanta) {
      setDetalles([]);
      setSelectedId(null);
      return;
    }

    const cargar = async () => {
      setLoadingDetalles(true);
      try {
        const res = await ValorizacionVentaAuxService.getDespachoDetallesDisponibles(
          idPlanta,
          idValorizacionEdicion,
        );
        const data = res.success && res.data ? res.data : [];
        setDetalles(data);
      } catch (err) {
        notifyError(
          err instanceof Error
            ? err.message
            : "Error al cargar items de despacho disponibles",
        );
      } finally {
        setLoadingDetalles(false);
      }
    };

    cargar();
  }, [opened, idPlanta, idValorizacionEdicion, detalleEditar, notifyError]);

  useEffect(() => {
    if (!detalleEditar) return;
    const { req } = detalleEditar;
    setSelectedId(String(req.id_despacho_detalle ?? req.id_distribucion_detalle));
    setElemento(req.elemento_quimico);
    setInter(req.inter ?? 0);
    setDesInter(req.des_inter ?? 0);
    setRecuperacion(req.recuperacion ?? 0);
    setMaquila(req.maquila ?? 0);
    setConsumo(req.consumo ?? 0);
    setFactor(req.factor ?? 1.0);
  }, [detalleEditar]);

  // Lookup INTER (precio_elemento_quimico) por (elemento, fecha de valorización).
  useEffect(() => {
    const lookup = async () => {
      if (!opened || detalleEditar) {
        return;
      }
      if (!elemento || !fechaCorta) {
        setPrecioEncontrado(null);
        return;
      }
      try {
        const res = await AuxService.buscar_precio_elemento({
          elemento,
          fecha: fechaCorta,
        });
        if (res.success && res.data) {
          setPrecioEncontrado({
            id: res.data.id,
            inter: res.data.inter,
            fecha: res.data.fecha,
          });
          setInter(res.data.inter);
        } else {
          setPrecioEncontrado(null);
        }
      } catch {
        setPrecioEncontrado(null);
      }
    };

    lookup();
  }, [opened, elemento, fechaCorta, detalleEditar]);

  // Reset del lookup INTER al cambiar elemento (solo en modo creación, no edición)
  useEffect(() => {
    if (detalleEditar) return;
    setPrecioEncontrado(null);
    setInter(0);
  }, [elemento, detalleEditar]);

  const detalleSeleccionado = useMemo(() => {
    if (detalleEditar) return null;
    if (!selectedId) return null;
    return detalles.find((d) => d.id_despacho_detalle === Number(selectedId)) ?? null;
  }, [selectedId, detalles, detalleEditar]);

  // Opciones de elementos químicos disponibles para el item seleccionado.
  // Solo muestra Oro (Au) y/o Plata (Ag) si están confirmados y no están ya valorizados (ni en DB ni en el formulario).
  const opcionesElemento = useMemo(() => {
    if (detalleEditar) {
      const val = detalleEditar.req.elemento_quimico;
      return [
        {
          value: val,
          label: val === ElementoQuimicoValorizacion.Oro ? "Oro (Au)" : "Plata (Ag)",
        },
      ];
    }
    if (!detalleSeleccionado) {
      return [];
    }

    const idItem = detalleSeleccionado.id_despacho_detalle;
    const enFormOro = existingDetalles.some(
      (e) =>
        (e.id_despacho_detalle ?? e.id_distribucion_detalle) === idItem &&
        e.elemento_quimico === ElementoQuimicoValorizacion.Oro,
    );
    const enFormPlata = existingDetalles.some(
      (e) =>
        (e.id_despacho_detalle ?? e.id_distribucion_detalle) === idItem &&
        e.elemento_quimico === ElementoQuimicoValorizacion.Plata,
    );

    const oroDisponible =
      !detalleSeleccionado.esta_valorizado_oro &&
      !!detalleSeleccionado.ley_oro_final_confirmada &&
      !enFormOro;

    const plataDisponible =
      !detalleSeleccionado.esta_valorizado_plata &&
      !!detalleSeleccionado.ley_plata_final_confirmada &&
      !enFormPlata;

    const opts: { value: ElementoQuimicoValorizacion; label: string }[] = [];
    if (oroDisponible) {
      opts.push({ value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" });
    }
    if (plataDisponible) {
      opts.push({ value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" });
    }
    return opts;
  }, [detalleEditar, detalleSeleccionado, existingDetalles]);

  // Auto-seleccionar primer elemento disponible cuando cambia detalleSeleccionado o cuando el actual no es válido
  useEffect(() => {
    if (detalleEditar) return;
    if (!detalleSeleccionado) {
      setElemento(null);
      return;
    }
    const valoresValidos = opcionesElemento.map((o) => o.value);
    if (!elemento || !valoresValidos.includes(elemento)) {
      setElemento(valoresValidos[0] ?? null);
    }
  }, [detalleSeleccionado, opcionesElemento, elemento, detalleEditar]);

  // Filtro del Select: oculta items que ya no pueden ser valorizados en ningún elemento
  const detallesFiltrados = useMemo(() => {
    if (detalleEditar) return detalles;
    return detalles.filter((d) => {
      const idItem = d.id_despacho_detalle;
      const enFormOro = existingDetalles.some(
        (e) =>
          (e.id_despacho_detalle ?? e.id_distribucion_detalle) === idItem &&
          e.elemento_quimico === ElementoQuimicoValorizacion.Oro,
      );
      const enFormPlata = existingDetalles.some(
        (e) =>
          (e.id_despacho_detalle ?? e.id_distribucion_detalle) === idItem &&
          e.elemento_quimico === ElementoQuimicoValorizacion.Plata,
      );

      const oroAgotado = d.esta_valorizado_oro || !d.ley_oro_final_confirmada || enFormOro;
      const plataAgotada = d.esta_valorizado_plata || !d.ley_plata_final_confirmada || enFormPlata;

      return !(oroAgotado && plataAgotada);
    });
  }, [detalles, existingDetalles, detalleEditar]);

  // Condición comercial auto-encontrada por el backend según la ley final del elemento.
  const condicionEncontrada = useMemo(() => {
    if (detalleEditar) return null;
    if (!detalleSeleccionado || !elemento) return null;
    return elemento === ElementoQuimicoValorizacion.Oro
      ? detalleSeleccionado.condicion_oro
      : detalleSeleccionado.condicion_plata;
  }, [detalleSeleccionado, elemento, detalleEditar]);

  // Aplicar automáticamente las condiciones comerciales encontradas
  useEffect(() => {
    if (detalleEditar) return;
    if (condicionEncontrada) {
      setRecuperacion(condicionEncontrada.recuperacion);
      setMaquila(condicionEncontrada.maquila);
      setConsumo(condicionEncontrada.consumo);
    } else {
      setRecuperacion(0);
      setMaquila(0);
      setConsumo(0);
    }
  }, [condicionEncontrada, detalleEditar]);

  // Ley aplicada: viene de la ley final confirmada de despacho_detalle
  const ley = useMemo(() => {
    if (detalleEditar) {
      return typeof detalleEditar.display.ley === "number" ? detalleEditar.display.ley : 0;
    }
    if (!detalleSeleccionado || !elemento) return 0;
    return elemento === ElementoQuimicoValorizacion.Oro
      ? detalleSeleccionado.ley_oro_final
      : detalleSeleccionado.ley_plata_final;
  }, [detalleSeleccionado, elemento, detalleEditar]);

  // TMS calculado con peso tomado (TMH) y humedad cliente promedio
  const tms = useMemo(() => {
    if (detalleEditar) {
      return typeof detalleEditar.display.tms === "number" ? detalleEditar.display.tms : 0;
    }
    if (!detalleSeleccionado) return 0;
    const pesoNeto = detalleSeleccionado.peso_tomado;
    const leyHumedad = detalleSeleccionado.ley_humedad_cliente;
    return pesoNeto * (1 - leyHumedad / 100);
  }, [detalleSeleccionado, detalleEditar]);

  // PTN y subtotal calculados en vivo
  const ptn = useMemo(() => {
    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numCon = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;
    return ((numInter - numDes) * ley * (numRec / 100) - numMaq - numCon) * numFac;
  }, [inter, desInter, ley, recuperacion, maquila, consumo, factor]);

  const totalItem = useMemo(() => (ptn * tms) / 1000, [ptn, tms]);

  const interBloqueado = true;

  const handleConfirmar = () => {
    if (!detalleEditar && !detalleSeleccionado) {
      notifyError("Debe seleccionar un item de despacho");
      return;
    }
    if (!elemento) {
      notifyError("Debe seleccionar un elemento químico");
      return;
    }
    if (!detalleEditar && !precioEncontrado) {
      notifyWarning(
        `Debe registrar el precio INTER para ${elemento} en la fecha seleccionada antes de valorizar. Use el botón "+" al lado de INTER.`,
      );
      return;
    }

    if (!detalleEditar && detalleSeleccionado) {
      const idItem = detalleSeleccionado.id_despacho_detalle;
      const dupEnForm = existingDetalles.some(
        (e) =>
          (e.id_despacho_detalle ?? e.id_distribucion_detalle) === idItem &&
          e.elemento_quimico === elemento,
      );
      const dupEnDb =
        elemento === ElementoQuimicoValorizacion.Oro
          ? detalleSeleccionado.esta_valorizado_oro
          : detalleSeleccionado.esta_valorizado_plata;

      if (dupEnForm || dupEnDb) {
        notifyError(`Este item ya está valorizado en ${elemento}. No se puede agregar duplicado.`);
        return;
      }

      if (elemento === ElementoQuimicoValorizacion.Oro && !detalleSeleccionado.ley_oro_final_confirmada) {
        notifyError("La ley final de Oro no está confirmada para este item.");
        return;
      }

      if (elemento === ElementoQuimicoValorizacion.Plata && !detalleSeleccionado.ley_plata_final_confirmada) {
        notifyError("La ley final de Plata no está confirmada para este item.");
        return;
      }
    }

    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numCon = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;

    const dataRef = detalleEditar
      ? {
          id_despacho_detalle: detalleEditar.req.id_despacho_detalle ?? detalleEditar.display.id_despacho_detalle,
          id_distribucion_detalle: detalleEditar.req.id_distribucion_detalle ?? detalleEditar.display.id_distribucion_detalle,
          codigo_preliminar: detalleEditar.display.codigo_preliminar,
          despacho_correlativo: detalleEditar.display.despacho_correlativo,
          lote_correlativo: detalleEditar.display.lote_correlativo,
          blending_correlativo: detalleEditar.display.blending_correlativo,
          codigo_cliente: detalleEditar.display.codigo_cliente,
          codigos_cliente: detalleEditar.display.codigos_cliente,
          peso_tomado: detalleEditar.display.tmh,
          ley_humedad: detalleEditar.display.ley_humedad,
        }
      : {
          id_despacho_detalle: detalleSeleccionado!.id_despacho_detalle,
          id_distribucion_detalle: detalleSeleccionado!.id_distribucion_detalle ?? detalleSeleccionado!.id_despacho_detalle,
          codigo_preliminar: detalleSeleccionado!.codigo_preliminar,
          despacho_correlativo: detalleSeleccionado!.despacho_correlativo,
          lote_correlativo: detalleSeleccionado!.lote_correlativo,
          blending_correlativo: detalleSeleccionado!.blending_correlativo,
          codigo_cliente: detalleSeleccionado!.codigo_cliente,
          codigos_cliente: detalleSeleccionado!.codigos_cliente,
          peso_tomado: detalleSeleccionado!.peso_tomado,
          ley_humedad: detalleSeleccionado!.ley_humedad_cliente,
        };

    const idCondicionComercial = detalleEditar
      ? (detalleEditar.req.id_condicion_comercial ?? null)
      : (condicionEncontrada?.id_condicion_comercial ?? null);

    const req: REQ_ValorizacionVentaDetalleItem = {
      id_despacho_detalle: dataRef.id_despacho_detalle ?? undefined,
      id_distribucion_detalle: dataRef.id_distribucion_detalle ?? undefined,
      elemento_quimico: elemento,
      id_condicion_comercial: idCondicionComercial,
      id_valor_elemento_quimico: detalleEditar
        ? (detalleEditar.req.id_valor_elemento_quimico ?? precioEncontrado?.id ?? null)
        : (precioEncontrado?.id ?? null),
      inter: numInter,
      des_inter: numDes,
      recuperacion: numRec,
      maquila: numMaq,
      consumo: numCon,
      factor: numFac,
    };

    const display: RES_ValorizacionVentaDetalle = {
      id: detalleEditar ? detalleEditar.display.id : 0,
      id_valorizacion_venta: detalleEditar ? detalleEditar.display.id_valorizacion_venta : 0,
      id_despacho_detalle: dataRef.id_despacho_detalle,
      id_distribucion_detalle: dataRef.id_distribucion_detalle,
      id_condicion_comercial: idCondicionComercial,
      id_valor_elemento_quimico: detalleEditar
        ? (detalleEditar.req.id_valor_elemento_quimico ?? precioEncontrado?.id ?? null)
        : (precioEncontrado?.id ?? null),
      elemento_quimico: elemento,
      codigo_preliminar: dataRef.codigo_preliminar ?? null,
      despacho_correlativo: dataRef.despacho_correlativo,
      lote_correlativo: dataRef.lote_correlativo,
      blending_correlativo: dataRef.blending_correlativo,
      codigo_cliente: dataRef.codigos_cliente || dataRef.codigo_cliente || null,
      codigos_cliente: dataRef.codigos_cliente || dataRef.codigo_cliente || null,
      tmh: dataRef.peso_tomado,
      ley_humedad: dataRef.ley_humedad,
      tms,
      ley,
      inter: numInter,
      des_inter: numDes,
      recuperacion: numRec,
      maquila: numMaq,
      consumo: numCon,
      factor: numFac,
      precio_por_tonelada: Number(ptn.toFixed(2)),
      subtotal: Number(totalItem.toFixed(2)),
    };

    if (detalleEditar && onEditarDetalle) {
      onEditarDetalle(detalleEditar.index, req, display);
    } else {
      onAgregarDetalle(req, display);
    }
    onClose();
  };

  const titulo = detalleEditar ? "Editar Item de Despacho" : "Agregar Item a Valorización";

  const tmhMostrar = detalleEditar ? detalleEditar.display.tmh : (detalleSeleccionado?.peso_tomado ?? 0);
  const h2oMostrar = detalleEditar ? detalleEditar.display.ley_humedad : (detalleSeleccionado?.ley_humedad_cliente ?? 0);
  const despachoMostrar = detalleEditar ? detalleEditar.display.despacho_correlativo : detalleSeleccionado?.despacho_correlativo;
  const loteMostrar = detalleEditar ? detalleEditar.display.lote_correlativo : detalleSeleccionado?.lote_correlativo;
  const blendMostrar = detalleEditar ? detalleEditar.display.blending_correlativo : detalleSeleccionado?.blending_correlativo;
  const codigosClienteMostrar = detalleEditar
    ? (detalleEditar.display.codigos_cliente || detalleEditar.display.codigo_cliente)
    : (detalleSeleccionado?.codigos_cliente || detalleSeleccionado?.codigo_cliente);

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <Group gap={6}>
          <IconFileText size={18} className="text-amber-400" />
          <Text fw={700} fz="sm" c="white">
            {titulo}
          </Text>
        </Group>
      }
      size="xl"
    >
      <Stack gap="sm" mt="xs">
        <button
          data-autofocus
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only opacity-0 w-0 h-0 p-0 m-0 pointer-events-none absolute -z-50"
        />

        {/* Selección de Item de Despacho y Elemento Químico */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Select
              label="Item de Despacho:"
              placeholder={loadingDetalles ? "Cargando items..." : "[Seleccione Item]"}
              disabled={loadingDetalles || !!detalleEditar || !idPlanta}
              rightSection={loadingDetalles ? <Loader size={16} /> : undefined}
              data={
                detalleEditar
                  ? [
                      {
                        value: String(
                          detalleEditar.display.id_despacho_detalle ??
                            detalleEditar.display.id_distribucion_detalle,
                        ),
                        label: (() => {
                          const loteOBlend =
                            detalleEditar.display.lote_correlativo ||
                            detalleEditar.display.blending_correlativo ||
                            "S/C";
                          const codigos =
                            detalleEditar.display.codigos_cliente ||
                            detalleEditar.display.codigo_cliente;
                          return codigos ? `${loteOBlend}-${codigos}` : loteOBlend;
                        })(),
                      },
                    ]
                  : detallesFiltrados.map((d) => {
                      const loteOBlend =
                        d.lote_correlativo || d.blending_correlativo || "S/C";
                      const codigos = d.codigos_cliente || d.codigo_cliente;
                      return {
                        value: String(d.id_despacho_detalle),
                        label: codigos ? `${loteOBlend}-${codigos}` : loteOBlend,
                      };
                    })
              }
              value={selectedId}
              onChange={(val) => {
                setSelectedId(val);
                setElemento(null);
              }}
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Elemento:"
              placeholder={detalleSeleccionado ? "[Seleccione]" : "[Seleccione Item Primero]"}
              disabled={!!detalleEditar || !detalleSeleccionado || opcionesElemento.length === 0}
              data={opcionesElemento}
              value={elemento}
              onChange={(val) => setElemento((val as ElementoQuimicoValorizacion) || null)}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>
        </Grid>

        {/* Card Informativa del Item Seleccionado */}
        {detalleSeleccionado || detalleEditar ? (
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80 space-y-2">
            <Group justify="space-between" align="center">
              <Group gap={6}>
                <IconFileText size={16} className="text-amber-400" />
                <Text fw={700} fz="xs" c="white">
                  Despacho: {despachoMostrar || "—"}
                </Text>
              </Group>
              <Group gap={6}>
                {loteMostrar && (
                  <Badge variant="outline" color="cyan" size="xs">
                    Lote: {loteMostrar}
                  </Badge>
                )}
                {blendMostrar && (
                  <Badge variant="outline" color="grape" size="xs">
                    Blend: {blendMostrar}
                  </Badge>
                )}
                {codigosClienteMostrar && (
                  <Badge variant="outline" color="indigo" size="xs">
                    Cliente: {codigosClienteMostrar}
                  </Badge>
                )}
              </Group>
            </Group>

            <Grid gutter="xs" pt={4}>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMH (t)
                  </Text>
                  <Text fz="xs" fw={700} c="cyan.3">
                    {formatNumber(tmhMostrar / 1000, 3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    % H2O Prom.
                  </Text>
                  <Text fz="xs" fw={700} c="amber.3">
                    {formatNumber(h2oMostrar, 2)}%
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMS (t)
                  </Text>
                  <Text fz="xs" fw={700} c="emerald.3">
                    {formatNumber(tms / 1000, 3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    Ley Final ({elemento ?? "?"})
                  </Text>
                  <Text fz="xs" fw={700} c="yellow.3">
                    {formatNumber(ley, 3)} oz/tc
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>
        ) : (
          <Box p="sm" bg="#18181b" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5">
              Seleccione un item de despacho para visualizar su información de pesajes y leyes finales.
            </Text>
          </Box>
        )}

        {/* Panel de Condiciones Comerciales y Valorización */}
        <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80">
          <Text fw={600} fz="xs" c="amber.4" mb="xs" className="flex items-center gap-1.5">
            <IconCoin size={14} /> Condiciones Comerciales y Valorización
          </Text>

          <Grid gutter="xs">
            {/* Fila 1: INTER | DES. INTER | RECUPERACIÓN */}
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <div className="flex items-end gap-1.5">
                <NumberInput
                  label="INTER ($/oz):"
                  value={inter}
                  onChange={(val) => {
                    if (typeof val === "number") setInter(val);
                    else setInter(parseFloat(String(val)) || 0);
                  }}
                  min={0}
                  decimalScale={4}
                  hideControls
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                  disabled={interBloqueado || !!detalleEditar}
                  style={{ flex: 1 }}
                />
                <Tooltip
                  label={
                    detalleEditar
                      ? "INTER bloqueado en edición (valor ya registrado)."
                      : !fechaCorta
                        ? "Primero seleccione una fecha de valorización"
                        : precioEncontrado
                          ? "Ya existe un precio INTER registrado para esta fecha y elemento"
                          : "Registrar precio INTER para esta fecha y elemento"
                  }
                  withArrow
                >
                  <ActionIcon
                    size="lg"
                    radius="md"
                    color={precioEncontrado ? "gray" : "indigo"}
                    variant={precioEncontrado ? "subtle" : "light"}
                    onClick={() => {
                      if (!elemento || !fechaCorta) {
                        notifyWarning("Seleccione elemento y fecha de valorización antes de registrar el precio.");
                        return;
                      }
                      setModalPrecioAbierto(true);
                    }}
                    disabled={!!precioEncontrado || !fechaCorta || !elemento || !!detalleEditar}
                    className="mb-1"
                    aria-label="Registrar precio INTER"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="DES. INTER ($/oz):"
                value={desInter}
                onChange={(val) => {
                  if (typeof val === "number") setDesInter(val);
                  else setDesInter(parseFloat(String(val)) || 0);
                }}
                min={0}
                decimalScale={4}
                hideControls
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="RECUPERACIÓN (%):"
                value={recuperacion}
                onChange={(val) => {
                  if (typeof val === "number") setRecuperacion(val);
                  else setRecuperacion(parseFloat(String(val)) || 0);
                }}
                min={0}
                max={100}
                decimalScale={2}
                hideControls
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>

            {/* Fila 2: MAQUILA | CONSUMO | FACTOR */}
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="MAQUILA ($/TMS):"
                value={maquila}
                onChange={(val) => {
                  if (typeof val === "number") setMaquila(val);
                  else setMaquila(parseFloat(String(val)) || 0);
                }}
                min={0}
                decimalScale={3}
                hideControls
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="CONSUMO ($/TMS):"
                value={consumo}
                onChange={(val) => {
                  if (typeof val === "number") setConsumo(val);
                  else setConsumo(parseFloat(String(val)) || 0);
                }}
                min={0}
                decimalScale={3}
                hideControls
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="FACTOR:"
                value={factor}
                onChange={(val) => {
                  if (typeof val === "number") setFactor(val);
                  else setFactor(parseFloat(String(val)) || 1.1023);
                }}
                min={0}
                step={0.0001}
                decimalScale={4}
                hideControls
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Resumen Final Resultante */}
        <Paper p="xs" radius="md" bg="#14532d/20" className="border border-emerald-800/60">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                Precio * Tonelada:
              </Text>
              <Text fz="sm" fw={700} c="white">
                $ {formatNumber(ptn, 2)} / TN
              </Text>
            </Stack>

            <Stack gap={2} align="end">
              <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                Subtotal Detalle:
              </Text>
              <Text fz="md" fw={800} c="emerald.3">
                $ {formatNumber(totalItem, 2)}
              </Text>
            </Stack>
          </Group>
        </Paper>

        {/* Acciones */}
        <Group justify="end" gap="xs" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose} radius="lg" size="xs">
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleConfirmar}
            radius="lg"
            size="xs"
            leftSection={<IconCheck size={16} />}
            disabled={!detalleEditar && !detalleSeleccionado}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {detalleEditar ? "Guardar Cambios" : "Agregar Item"}
          </Button>
        </Group>
      </Stack>

      <ModalRegistrarPrecioInter
        opened={modalPrecioAbierto}
        onClose={() => setModalPrecioAbierto(false)}
        elementoQuimico={elemento ?? ElementoQuimicoValorizacion.Oro}
        fecha={fechaCorta ?? ""}
        onRegistrado={(id, nuevoInter) => {
          setPrecioEncontrado({ id, inter: nuevoInter, fecha: fechaCorta ?? "" });
          setInter(nuevoInter);
          setModalPrecioAbierto(false);
        }}
      />
    </ModalEstandar>
  );
};

export const ModalAgregarDistribucionDetalle = ModalAgregarDespachoDetalle;
