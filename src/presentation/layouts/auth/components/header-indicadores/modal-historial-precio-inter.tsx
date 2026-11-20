import { useCallback, useEffect, useState } from "react";
import { Badge, Group, Text } from "@mantine/core";
import { IconFlame } from "@tabler/icons-react";
import { type DataTableColumn } from "mantine-datatable";
import dayjs from "dayjs";
import { ModalEstandar } from "../../../../utils/modal-estandar";
import { DataTableEstandar } from "../../../../utils/datatable-estandar";
import { AuxService } from "../../../../../service/auxiliar.service";
import type { RES_ValorElementoQuimico } from "../../../../../service/responses/valor-elemento-quimico";
import { ElementoQuimicoValorizacion } from "../../../../../shared/enums/_generic/elemento-quimico-valorizacion";
import { useNotify } from "../../../../../hooks/useNotify";

interface ModalHistorialPrecioInterProps {
  opened: boolean;
  close: () => void;
}

const columns: DataTableColumn<RES_ValorElementoQuimico>[] = [
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
    accessor: "elemento_quimico",
    title: "Elemento",
    width: 130,
    render: (r) => (
      <Badge
        color={r.elemento_quimico === ElementoQuimicoValorizacion.Oro ? "yellow" : "cyan"}
        variant="light"
        size="xs"
        radius="sm"
        tt="none"
      >
        {r.elemento_quimico}
      </Badge>
    ),
  },
  {
    accessor: "inter",
    title: "INTER ($/OZ TC)",
    textAlign: "right",
    width: 160,
    render: (r) => (
      <Text
        size="sm"
        fw={700}
        className={`font-mono ${
          r.elemento_quimico === ElementoQuimicoValorizacion.Oro
            ? "text-amber-400"
            : "text-cyan-400"
        }`}
      >
        ${r.inter.toFixed(2)}
      </Text>
    ),
  },
];

export const ModalHistorialPrecioInter = ({
  opened,
  close,
}: ModalHistorialPrecioInterProps) => {
  const { notifyError } = useNotify();
  const [registros, setRegistros] = useState<RES_ValorElementoQuimico[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuxService.get_historial_inter();
      if (!res.success) {
        setRegistros([]);
        notifyError(res.message || "No se pudo cargar el historial de precios INTER.");
        return;
      }
      setRegistros(res.data);
    } catch (err) {
      setRegistros([]);
      notifyError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial de precios INTER.",
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
          <IconFlame size={20} className="text-yellow-400" />
          <Text fw={700} c="white">
            Historial de Precios INTER
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
