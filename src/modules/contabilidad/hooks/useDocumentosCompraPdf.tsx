import { useCallback, useRef, useState } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { useNotify } from "../../../hooks/useNotify";
import { ValorizacionCompraService } from "../../valorizacion-compra/service/valorizacion-compra.service";
import type { RES_ValorizacionCompra } from "../../valorizacion-compra/service/valorizacion-compra.responses";
import type { RES_ComprobanteCompra } from "../service/contabilidad-compra.responses";
import { DeclaracionJuradaPdf } from "../presentation/components/declaracion-jurada-pdf";
import { NotaIngresoAlmacenPdf } from "../presentation/components/nota-ingreso-almacen-pdf";
import { OrdenCompraPdf } from "../presentation/components/orden-compra-pdf";

export type TipoDocumentoCompra = "dj" | "nia" | "oc";

export const useDocumentosCompraPdf = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();

  // Estados de carga por comprobante y tipo de documento (ej: "12-dj": true)
  const [loadingDoc, setLoadingDoc] = useState<Record<string, boolean>>({});

  // Cache local en memoria para no repetir peticiones si el usuario abre varios documentos del mismo comprobante
  const cacheValorizaciones = useRef<Record<number, RES_ValorizacionCompra>>({});

  const obtenerValorizacionConCache = async (
    idValorizacion: number
  ): Promise<RES_ValorizacionCompra | null> => {
    if (cacheValorizaciones.current[idValorizacion]) {
      return cacheValorizaciones.current[idValorizacion];
    }
    const res = await ValorizacionCompraService.obtenerValorizacion(idValorizacion);
    if (res.data) {
      cacheValorizaciones.current[idValorizacion] = res.data;
      return res.data;
    }
    return null;
  };

  const imprimirDocumento = useCallback(
    async (comprobante: RES_ComprobanteCompra, tipo: TipoDocumentoCompra) => {
      const key = `${comprobante.id}-${tipo}`;
      setLoadingDoc((prev) => ({ ...prev, [key]: true }));

      const target = `doc-compra-${comprobante.id}-${tipo}`;
      prepare(target);

      try {
        let valorizacion: RES_ValorizacionCompra | null = null;
        if (comprobante.id_valorizacion_compra) {
          try {
            valorizacion = await obtenerValorizacionConCache(
              comprobante.id_valorizacion_compra
            );
          } catch (e) {
            console.warn(
              "[useDocumentosCompraPdf] No se pudo cargar valorización vinculada, generando con datos básicos",
              e
            );
          }
        }

        if (tipo === "dj") {
          print(
            <DeclaracionJuradaPdf
              comprobante={comprobante}
              valorizacion={valorizacion}
            />,
            {
              documentTitle: `Declaracion Jurada ${comprobante.codigo_completo}`,
              target,
            }
          );
          notifySuccess("Declaración Jurada generada exitosamente.");
        } else if (tipo === "nia") {
          print(
            <NotaIngresoAlmacenPdf
              comprobante={comprobante}
              valorizacion={valorizacion}
            />,
            {
              documentTitle: `Nota de Ingreso Almacen ${comprobante.codigo_completo}`,
              target,
            }
          );
          notifySuccess("Nota de Ingreso al Almacén generada exitosamente.");
        } else if (tipo === "oc") {
          print(
            <OrdenCompraPdf
              comprobante={comprobante}
              valorizacion={valorizacion}
            />,
            {
              documentTitle: `Orden de Compra ${comprobante.codigo_completo}`,
              target,
            }
          );
          notifySuccess("Orden de Compra generada exitosamente.");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al generar documento: ${msg}`);
        console.error("[useDocumentosCompraPdf] Error:", err);
      } finally {
        setLoadingDoc((prev) => ({ ...prev, [key]: false }));
      }
    },
    [notifyError, notifySuccess, prepare, print]
  );

  return {
    imprimirDocumento,
    loadingDoc,
  };
};
