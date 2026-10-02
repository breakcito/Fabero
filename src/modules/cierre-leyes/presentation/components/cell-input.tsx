import React, { useEffect, useState } from "react";
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
}: CellInputProps) => {
  const { notifyWarning } = useNotify();
  const [val, setVal] = useState<string>(initialValue > 0 ? initialValue.toString() : "");
  const [checked, setChecked] = useState(initialChecked);

  const hasLog = Boolean(logCambios && logCambios.length > 0);

  useEffect(() => {
    setVal(initialValue > 0 ? initialValue.toString() : "");
  }, [initialValue]);

  useEffect(() => {
    setChecked(initialChecked);
  }, [initialChecked]);

  const handleBlur = () => {
    if (saving) return;
    const numericVal = parseFloat(val);
    if (!isNaN(numericVal)) {
      if (numericVal !== initialValue) {
        let newChecked = checked;
        if (numericVal <= 0 && checked) {
          newChecked = false;
          setChecked(false);
          notifyWarning("El análisis se desmarcó como confirmado porque el valor no es mayor a cero.");
        }
        onSave(numericVal, newChecked);
      }
    } else if (val === "") {
      if (initialValue !== 0) {
        let newChecked = checked;
        if (checked) {
          newChecked = false;
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
    <div className="flex items-center gap-0.5 min-w-22 justify-center py-0.5">
      <button
        type="button"
        disabled={disabled || saving}
        onClick={handleCheckboxToggle}
        className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${
          checked
            ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-900/30"
            : "border-zinc-700 bg-zinc-900/50 text-transparent hover:border-zinc-500"
        }`}
      >
        <IconCheck size={9} stroke={3} />
      </button>
      <input
        type="number"
        step="any"
        disabled={disabled || saving}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0.00"
        className="w-14 h-6 text-center text-[11px] leading-none px-1.5 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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