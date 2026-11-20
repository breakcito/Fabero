import { useCallback, useEffect, useState } from "react";
import { Group, Text } from "@mantine/core";
import { IconCurrencyDollar } from "@tabler/icons-react";
import { type DataTableColumn } from "mantine-datatable";
import dayjs from "dayjs";
import { ModalEstandar } from "../../../../utils/modal-estandar";
import { DataTableEstandar } from "../../../../utils/datatable-estandar";
import { AuxService } from "../../../../../service/auxiliar.service";
import type { RES_TipoCambio } from "../../../../../service/responses/tipo-cambio";
import { useNotify } from "../../../../../hooks/useNotify";

interface ModalHistorialTipoCambioProps {
  opened: boolean;
  close: () => void;
}

const columns: DataTableColumn<RES_TipoCambio>[] = [
  {
    accessor: "fecha",
    title: "Fecha",
    width: 140,
    render: (r) => (
      <Text size="sm" fw={600} className="text-zinc-200 font-mono">
        {dayjs(r.fecha).format("DD/MM/YYYY")}
      </Text>
    ),
  },
  {
    accessor: "valor_compra",
    title: "Compra",
    textAlign: "right",
    width: 130,
    render: (r) => (
      <Text size="sm" fw={700} className="text-teal-400 font-mono">
        S/ {r.valor_compra.toFixed(3)}
      </Text>
    ),
  },
  {
    accessor: "valor_venta",
    title: "Venta",
    textAlign: "right",
    width: 130,
    render: (r) => (
      <Text size="sm" fw={700} className="text-indigo-400 font-mono">
        S/ {r.valor_venta.toFixed(3)}
      </Text>
    ),
  },
];

export const ModalHistorialTipoCambio = ({
  opened,
  close,
}: ModalHistorialTipoCambioProps) => {
  const { notifyError } = useNotify();
  const [registros, setRegistros] = useState<RES_TipoCambio[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuxService.get_historial_tipo_cambio();
      if (!res.success) {
        setRegistros([]);
        notifyError(res.message || "No se pudo cargar el historial de tipos de cambio.");
        return;
      }
      setRegistros(res.data);
    } catch (err) {
      setRegistros([]);
      notifyError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial de tipos de cambio.",
      );
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (opened) {
      void cargarHistorial();
    }
  }, [opened, cargarHistorial]);

  return (
    <ModalEstandar
      opened={opened}
      close={close}
      size="lg"
      zIndex={300}
      title={
        <Group gap="xs">
          <IconCurrencyDollar size={20} className="text-amber-400" />
          <Text fw={700} c="white">
            Historial de Tipos de Cambio
          </Text>
        </Group>
      }
      rightSection={
        <Text fz="xs" c="dimmed" fw={600} className="font-mono">
          {registros.length} registros
        </Text>
      }
    >
      <DataTableEstandar
        idAccessor="id"
        columns={columns}
        records={registros}
        loading={loading}
        initialPageSize={10}
        minHeight={220}
        noRecordsText="Sin registros"
      />
    </ModalEstandar>
  );
};
