import React, { useState } from "react";
import { Loader, Tooltip } from "@mantine/core";
import { IconCheck, IconHistory, IconTrash } from "@tabler/icons-react";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";

interface CellInputProps {
  initialValue: number;
  initialChecked: boolean;
  onSave: (val: number, checked: boolean) => void;
  onDelete?: () => void;
  disabled?: boolean;
  saving?: boolean;
  logCambios?: RES_CambiosLog[] | null;
  onViewLog?: () => void;
  /** Oculta el botón de confirmar. Usado en la tabla de muestras externas y columnas de humedad/recuperación. */
  hideCheckbox?: boolean;
}

export const CellInput = ({
  initialValue,
  initialChecked,
  onSave,
  onDelete,
  disabled,
  saving,
  logCambios,
  onViewLog,
  hideCheckbox,
}: CellInputProps) => {
  const { notifyWarning } = useNotify();

  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [val, setVal] = useState<string>(initialValue > 0 ? initialValue.toString() : "");

  const [prevInitialChecked, setPrevInitialChecked] = useState(initialChecked);
  const [checked, setChecked] = useState(initialChecked);

  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setVal(initialValue > 0 ? initialValue.toString() : "");
  }

  if (initialChecked !== prevInitialChecked) {
    setPrevInitialChecked(initialChecked);
    setChecked(initialChecked);
  }

  const hasLog = Boolean(logCambios && logCambios.length > 0);

  const handleBlur = () => {
    if (saving) return;
    const numericVal = parseFloat(val);
    if (!isNaN(numericVal)) {
      if (numericVal !== initialValue) {
        const newChecked = hideCheckbox ? false : checked;
        if (!hideCheckbox && numericVal <= 0 && checked) {
          setChecked(false);
          notifyWarning("El análisis se desmarcó como confirmado porque el valor no es mayor a cero.");
        }
        onSave(numericVal, newChecked);
      }
    } else if (val === "") {
      if (initialValue !== 0) {
        const newChecked = hideCheckbox ? false : checked;
        if (!hideCheckbox && checked) {
          setChecked(false);
          notifyWarning("El análisis se desmarcó como confirmado porque el valor está vacío.");
        }
        onSave(0, newChecked);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleCheckboxToggle = () => {
    if (saving) return;
    if (hideCheckbox) return;
    const numericVal = parseFloat(val) || 0;
    if (!checked && numericVal <= 0) {
      notifyWarning("No se puede confirmar un análisis sin un valor mayor a cero.");
      return;
    }
    const newChecked = !checked;
    setChecked(newChecked);
    onSave(numericVal, newChecked);
  };

  return (
    <div
      className={`flex items-center gap-0.5 ${
        hideCheckbox ? "min-w-15" : "min-w-20"
      } justify-center py-0.5`}
    >
      {!hideCheckbox && (
        <button
          type="button"
          disabled={disabled || saving}
          onClick={handleCheckboxToggle}
          className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
            checked
              ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-900/30"
              : "border-zinc-700 bg-zinc-900/50 text-transparent hover:border-zinc-500"
          }`}
        >
          <IconCheck size={9} stroke={3} />
        </button>
      )}
      <input
        type="number"
        step="any"
        disabled={disabled || saving}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0.00"
        className="w-14 h-6 text-center text-[11px] leading-none px-1 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hasLog && (
        <Tooltip label="Ver historial de cambios" withArrow position="top">
          <button
            type="button"
            onClick={onViewLog}
            className="p-0.5 text-amber-400 hover:text-amber-300 rounded-md hover:bg-amber-500/10 transition-all flex items-center justify-center"
          >
            <IconHistory size={11} />
          </button>
        </Tooltip>
      )}
      {saving && <Loader size={7} color="indigo" />}
      {onDelete && !disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-850 transition-all"
        >
          <IconTrash size={11} />
        </button>
      )}
    </div>
  );
};
