import { useState } from "react";
import { Text, Button, Textarea, ActionIcon } from "@mantine/core";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import { IconPaperclip, IconCar } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { RecepcionVisitaResponse } from "../../service/recepcion-visitas.responses";
import { RecepcionVisitasService } from "../../service/recepcion-visitas.service";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  recepciones: RecepcionVisitaResponse[];
  loading: boolean;
  onUpdateRecepcion: (r: RecepcionVisitaResponse) => void;
}

export const TablaVisitas = ({ recepciones, loading, onUpdateRecepcion }: Props) => {
  const [exitRecord, setExitRecord] = useState<RecepcionVisitaResponse | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [savingExit, setSavingExit] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const formatFecha = (fechaStr: string) => {
    try {
      const date = new Date(fechaStr.replace(" ", "T"));
      if (isNaN(date.getTime())) return fechaStr;

      const pad = (num: number) => num.toString().padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  const handleSaveExit = async () => {
    if (!exitRecord) return;

    setSavingExit(true);
    try {
      const updated = await RecepcionVisitasService.registrarSalida(exitRecord.id, {
        observacion_salida: observacionSalida,
      });
      notifySuccess("Salida de visita registrada correctamente");
      onUpdateRecepcion(updated);
      setExitRecord(null);
      setObservacionSalida("");
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al registrar la salida");
    } finally {
      setSavingExit(false);
    }
  };

  return (
    <>
      <DataTableEstandar
        idAccessor="id"
        records={recepciones}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
            render: (_: RecepcionVisitaResponse, index: number) => index + 1,
          },
          {
            accessor: "fecha_hora_ingreso",
            title: "Ingreso / Registrado Por",
            width: 170,
            render: (r: RecepcionVisitaResponse) => (
              <div>
                <Text size="xs" className="text-zinc-200" fw={700}>
                  {formatFecha(r.fecha_hora_ingreso)}
                </Text>
                <Text size="10px" className="text-zinc-500">
                  {r.empleado_registro_nombre}
                </Text>
              </div>
            ),
          },
          {
            accessor: "empleado_contacto_nombre",
            title: "Personal Contacto",
            width: 180,
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-200" fw={600}>
                {r.empleado_contacto_nombre}
              </Text>
            ),
          },
          {
            accessor: "motivo_ingreso_nombre",
            title: "Motivo Visita",
            width: 150,
            render: (r: RecepcionVisitaResponse) => (
              <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs">
                {r.motivo_ingreso_nombre}
              </span>
            ),
          },
          {
            accessor: "visitantes",
            title: "Visitantes / Documento",
            width: 280,
            render: (r: RecepcionVisitaResponse) => (
              <div className="flex flex-col gap-1.5">
                {r.visitantes.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-zinc-900/30 border border-zinc-800/40 p-1.5 px-2.5 rounded-lg">
                    <div>
                      <Text size="xs" className="text-zinc-200" fw={700}>
                        {v.visitante_nombre} {v.visitante_apellido}
                      </Text>
                      <Text size="10px" className="text-zinc-500">
                        DNI: {v.visitante_dni} {v.visitante_telefono ? `| Tel: ${v.visitante_telefono}` : ""}
                      </Text>
                    </div>
                    {v.url_foto_documento && (
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="indigo"
                        onClick={() => window.open(v.url_foto_documento!, "_blank")}
                        title="Ver Documento"
                        className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400"
                      >
                        <IconPaperclip size={14} />
                      </ActionIcon>
                    )}
                  </div>
                ))}
              </div>
            ),
          },
          {
            accessor: "vehiculo",
            title: "Vehículo Particular",
            width: 150,
            render: (r: RecepcionVisitaResponse) => {
              if (r.con_vehiculo) {
                return (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <IconCar size={16} className="text-indigo-400" />
                    <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                      {r.serie_placa}-{r.numero_placa}
                    </span>
                  </div>
                );
              }
              return <Text size="xs" className="text-zinc-500 italic">No</Text>;
            },
          },
          {
            accessor: "observacion",
            title: "Observación",
            width: 180,
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-400 italic max-w-[160px]" truncate title={r.observacion || ""}>
                {r.observacion || "—"}
              </Text>
            ),
          },
          {
            accessor: "fecha_hora_salida",
            title: "Salida",
            width: 170,
            render: (r: RecepcionVisitaResponse) => {
              if (r.fecha_hora_salida) {
                return (
                  <Text size="xs" className="text-zinc-200" fw={700}>
                    {formatFecha(r.fecha_hora_salida)}
                  </Text>
                );
              }
              return (
                <Button
                  size="xs"
                  color="red"
                  radius="lg"
                  onClick={() => {
                    setExitRecord(r);
                    setObservacionSalida("");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 h-[28px] px-3.5"
                >
                  Registrar Salida
                </Button>
              );
            },
          },
          {
            accessor: "observacion_salida",
            title: "Observación Salida",
            width: 180,
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-400 italic max-w-[160px]" truncate title={r.observacion_salida || ""}>
                {r.observacion_salida || "—"}
              </Text>
            ),
          },
        ]}
      />

      {/* Modal: Registro de Salida */}
      <ModalEstandar
        opened={!!exitRecord}
        close={() => setExitRecord(null)}
        title="Registro de Salida de Visita"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Text size="xs" className="text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
            Confirmación de Salida
          </Text>
          <Textarea
            label="Observación de Salida"
            placeholder="Escriba alguna observación de salida..."
            value={observacionSalida}
            onChange={(e) => setObservacionSalida(e.target.value)}
            minRows={3}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => setExitRecord(null)}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExit}
              loading={savingExit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
            >
              Confirmar Salida
            </Button>
          </div>
        </div>
      </ModalEstandar>
    </>
  );
};
