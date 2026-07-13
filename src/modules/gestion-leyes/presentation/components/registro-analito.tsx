import { useState } from "react";
import { TextInput, Switch, Button, Group, Stack } from "@mantine/core";

interface RegistroAnalitoProps {
  onSuccess: (nombre: string, esDesplegable: boolean) => Promise<boolean>;
  onCancel: () => void;
}

export const RegistroAnalito = ({ onSuccess, onCancel }: RegistroAnalitoProps) => {
  const [nombre, setNombre] = useState("");
  const [esDesplegable, setEsDesplegable] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSaving(true);
    const success = await onSuccess(nombre, esDesplegable);
    setSaving(false);
    if (success) {
      setNombre("");
      setEsDesplegable(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <Stack gap="md">
        <TextInput
          label="Nombre del Analito"
          placeholder="Ej. Oro, Plata, Humedad, Cobre..."
          value={nombre}
          onChange={(e) => setNombre(e.currentTarget.value)}
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
          description="Indica si este analito se mostrará de forma desplegable en otros formularios."
          checked={esDesplegable}
          onChange={(e) => setEsDesplegable(e.currentTarget.checked)}
          radius="md"
          color="indigo"
          classNames={{
            label: "text-zinc-200 font-medium text-sm",
            description: "text-zinc-500 text-xs",
            body: "items-center",
          }}
        />

        <Group justify="flex-end" gap="sm" className="mt-4">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Guardar Analito
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
