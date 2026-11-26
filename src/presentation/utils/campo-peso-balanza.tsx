import { useState } from "react";
import { Switch, Text, TextInput } from "@mantine/core";
import { usePesoBalanza } from "../../hooks/usePesoBalanza";

interface CampoPesoBalanzaProps {
  /** Etiqueta del campo (ej. "Peso Inicial (Kg):"). */
  label: string;
  /** Valor actual del campo. */
  valor: string;
  /** Se invoca con el peso escrito o el leído de la balanza. */
  onChange: (valor: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Código de balanza. Si no se envía, se usa el configurado en el backend. */
  codBalanza?: number | null;
  /** Si el peso automático arranca activo. Por defecto `true`. */
  automaticoInicial?: boolean;
  /** Notifica el cambio de modo (para persistir la preferencia). */
  onAutomaticoChange?: (activo: boolean) => void;
}

/**
 * Campo de peso conectado a una balanza física.
 *
 * La computadora de la balanza publica el peso en la tabla
 * `interfaces_pesosbalanzas`; con el interruptor "Peso automático" activo el
 * valor se rellena solo. Al desactivarlo, el último valor se congela y el
 * operador escribe a mano.
 */
export const CampoPesoBalanza = ({
  label,
  valor,
  onChange,
  error,
  disabled,
  placeholder = "Ingrese peso en Kilos",
  codBalanza,
  automaticoInicial = true,
  onAutomaticoChange,
}: CampoPesoBalanzaProps) => {
  const [automatico, setAutomatico] = useState(automaticoInicial);

  const { hayLectura } = usePesoBalanza({
    activo: automatico && !disabled,
    codBalanza,
    onPeso: (peso) => onChange(peso),
  });

  const handleChange = (texto: string) => {
    // Solo dígitos y un separador decimal: el segundo punto se descarta.
    const soloDigitos = texto.replace(/[^\d.]/g, "");
    const primerPunto = soloDigitos.indexOf(".");

    if (primerPunto < 0) {
      onChange(soloDigitos);
      return;
    }

    const entero = soloDigitos.slice(0, primerPunto);
    const decimales = soloDigitos.slice(primerPunto + 1).replace(/\./g, "");
    onChange(decimales ? `${entero}.${decimales}` : entero);
  };

  const handleToggle = (activo: boolean) => {
    setAutomatico(activo);
    onAutomaticoChange?.(activo);
  };

  return (
    <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <Text className="text-zinc-300 font-bold text-sm">{label}</Text>
        <Switch
          label="Peso automático"
          checked={automatico}
          onChange={(e) => handleToggle(e.currentTarget.checked)}
          color="indigo"
          size="sm"
          disabled={disabled}
          classNames={{
            label: "text-xs text-zinc-300 font-medium",
          }}
        />
      </div>

      <TextInput
        placeholder={placeholder}
        value={valor}
        onChange={(e) => handleChange(e.currentTarget.value)}
        disabled={disabled}
        classNames={{
          input:
            "bg-zinc-900/60 border-zinc-800 text-center font-bold text-white focus:border-zinc-300 transition-all",
        }}
        radius="lg"
        autoFocus
        required
        error={error}
      />

      {automatico ? (
        <Text size="xs" c="dimmed" mt={6}>
          {hayLectura
            ? "Peso recibido de la balanza."
            : "Esperando el peso de la balanza…"}
        </Text>
      ) : null}
    </div>
  );
};
