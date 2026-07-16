import { DatePickerInput, type DatePickerInputProps } from "@mantine/dates";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import "@mantine/dates/styles.css";
import "dayjs/locale/es";

interface CustomDatePickerProps extends Omit<
  DatePickerInputProps,
  "leftSection"
> {
  error?: string;
}

export const CustomDatePicker = ({
  error,
  label,
  value,
  onChange,
  radius = "lg",
  size = "sm",
  placeholder,
  ...props
}: CustomDatePickerProps) => {
  // Common Styles for dark theme integration
  const inputStyles = {
    input: `bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 
    focus:ring-zinc-300 text-white placeholder:text-zinc-500`,
    label: "text-zinc-300 mb-1 font-medium",
    calendarHeader: "text-white font-bold",
    calendarHeaderControl: `text-zinc-400 hover:text-white hover:bg-zinc-800 
    rounded-md transition-colors w-8 h-8`,
    calendarHeaderLevel: `hover:bg-zinc-800 rounded-md px-2 py-1 transition-colors`,
    day: `text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-md 
    data-[selected]:bg-zinc-100 data-[selected]:text-zinc-900 
    data-[today]:text-amber-400 font-medium`,
    month: "text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md",
    year: "text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md",
    weekday: "text-zinc-500 font-semibold text-xs uppercase tracking-wide",
  };

  return (
    <DatePickerInput
      locale="es"
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      error={error}
      radius={radius}
      size={size}
      leftSection={<CalendarDaysIcon className="w-5 h-5 text-zinc-500" />}
      previousIcon={<ChevronLeftIcon className="w-4 h-4" />}
      nextIcon={<ChevronRightIcon className="w-4 h-4" />}
      popoverProps={{
        withinPortal: true,
        transitionProps: { transition: "pop", duration: 200 },
        position: "bottom-start",
        offset: 5,
        classNames: {
          dropdown:
            "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl p-4",
        },
      }}
      classNames={{
        ...inputStyles,
        ...props.classNames,
      }}
      {...props}
    />
  );
};
