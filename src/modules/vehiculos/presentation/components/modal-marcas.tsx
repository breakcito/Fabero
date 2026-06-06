import { useState } from "react";
import {
  Table,
  Button,
  TextInput,
  Group,
  ActionIcon,
  Tooltip,
  Badge,
  Loader,
  Text,
  Stack,
  Card,
} from "@mantine/core";
import { IconPencil, IconPower, IconDeviceFloppy, IconPlus, IconX } from "@tabler/icons-react";
import { useMarcas } from "../../../marcas/hooks/useMarcas";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import type { MarcaResponse } from "../../../marcas/service/marcas.service";

interface Props {
  onSelectMarca?: (id: number) => void;
}

export const ModalMarcas = ({ onSelectMarca }: Props) => {
  const { marcas, loading, addMarca, updateMarca, toggleEstadoMarca } = useMarcas();
  const [nombre, setNombre] = useState("");
  const [editingMarca, setEditingMarca] = useState<MarcaResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSaving(true);
    try {
      if (editingMarca) {
        await updateMarca(editingMarca.id, nombre.trim());
        setEditingMarca(null);
      } else {
        const created = await addMarca(nombre.trim());
        if (onSelectMarca && created) {
          onSelectMarca(created.id);
        }
      }
      setNombre("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (marca: MarcaResponse) => {
    setEditingMarca(marca);
    setNombre(marca.nombre);
  };

  const handleCancelEdit = () => {
    setEditingMarca(null);
    setNombre("");
  };

  return (
    <Stack gap="md" className="p-1">
      <Card withBorder padding="md" radius="lg" className="bg-zinc-900/30 border-zinc-800">
        <form onSubmit={handleSubmit}>
          <Group align="flex-end" gap="sm">
            <TextInput
              label={editingMarca ? "Editar Nombre de Marca" : "Nueva Marca de Vehículo"}
              placeholder="Ej. Volvo, Toyota, Scania"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              radius="xl"
              className="flex-1"
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
            <Group gap="xs">
              {editingMarca && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="xl"
                  onClick={handleCancelEdit}
                  className="hover:bg-zinc-800"
                >
                  <IconX size={18} />
                </ActionIcon>
              )}
              <Button
                type="submit"
                loading={saving}
                radius="xl"
                leftSection={editingMarca ? <IconDeviceFloppy size={16} /> : <IconPlus size={16} />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
              >
                {editingMarca ? "Actualizar" : "Agregar"}
              </Button>
            </Group>
          </Group>
        </form>
      </Card>

      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" color="indigo" />
        </Group>
      ) : marcas.length === 0 ? (
        <Text size="sm" color="dimmed" textAlign="center" py="lg">
          No hay marcas registradas.
        </Text>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 max-h-[300px] custom-scrollbar">
          <Table verticalSpacing="sm" className="min-w-full text-zinc-300">
            <Table.Thead className="bg-zinc-900/40 border-b border-zinc-800">
              <Table.Tr>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4">#</Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4">Nombre</Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">Estado</Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {marcas.map((marca, idx) => (
                <Table.Tr key={marca.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/10">
                  <Table.Td className="py-2.5 px-4 text-sm text-zinc-500">{idx + 1}</Table.Td>
                  <Table.Td className="py-2.5 px-4 text-sm font-medium text-white">{marca.nombre}</Table.Td>
                  <Table.Td className="py-2.5 px-4 text-center">
                    <Badge
                      color={marca.estado === EstadoBase.Activo ? "green" : "gray"}
                      variant="light"
                      size="sm"
                      radius="lg"
                    >
                      {marca.estado}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4">
                    <Group gap="xs" justify="center" wrap="nowrap">
                      <Tooltip label="Editar Nombre" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          radius="xl"
                          size="sm"
                          onClick={() => handleEdit(marca)}
                          disabled={marca.estado === EstadoBase.Inactivo}
                        >
                          <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={marca.estado === EstadoBase.Activo ? "Inactivar" : "Activar"} withArrow>
                        <ActionIcon
                          variant="subtle"
                          color={marca.estado === EstadoBase.Activo ? "orange" : "green"}
                          radius="xl"
                          size="sm"
                          onClick={() => toggleEstadoMarca(marca.id, marca.estado)}
                        >
                          <IconPower size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Stack>
  );
};
