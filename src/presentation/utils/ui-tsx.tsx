/**
 * Primitivas de UI en TSX puro (sin Mantine).
 *
 * Existe una versión propia porque los modales de registro y confirmación se
 * usan en tablets y celulares dentro de planta, donde el `Modal` de Mantine
 * (Portal + tamaño fijo) da problemas de alto y de scroll. Estas primitivas
 * usan `dvh` (altura dinámica de viewport), tipografía de 16px en los inputs
 * (para que iOS no haga zoom al enfocar) y `env(safe-area-inset-*)`.
 *
 * Todos los componentes aceptan `className` para poder ajustar el layout.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

/* ────────────────────────────── Estilos base ────────────────────────────── */

const CONTROL_BASE =
  "w-full bg-zinc-900/60 border border-zinc-800 text-white text-base sm:text-sm rounded-lg px-3 py-2.5 sm:py-2 outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";

const ETIQUETA_BASE = "block text-xs font-semibold text-zinc-300 mb-1.5";

/* ──────────────────────────────── Botón ────────────────────────────────── */

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "fantasma" | "peligro";
  tamano?: "sm" | "md";
  cargando?: boolean;
  children?: ReactNode;
}

const VARIANTES: Record<string, string> = {
  primario:
    "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/40",
  secundario:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
  fantasma: "bg-transparent hover:bg-zinc-800 text-zinc-300",
  peligro: "bg-rose-600 hover:bg-rose-700 text-white",
};

export const Boton = ({
  variante = "primario",
  tamano = "md",
  cargando = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: BotonProps) => (
  <button
    type={type}
    disabled={disabled || cargando}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      tamano === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
    } ${VARIANTES[variante]} ${className}`}
    {...props}
  >
    {cargando ? <Cargador tamano={tamano === "sm" ? 12 : 14} /> : null}
    {children}
  </button>
);

/* ──────────────────────────────── Cargador ──────────────────────────────── */

export const Cargador = ({
  tamano = 16,
  className = "",
}: {
  tamano?: number;
  className?: string;
}) => (
  <span
    role="status"
    aria-label="Cargando"
    className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em] ${className}`}
    style={{ width: tamano, height: tamano }}
  />
);

/* ──────────────────────────────── Insignia ─────────────────────────────── */

export const Insignia = ({
  children,
  color = "indigo",
  className = "",
}: {
  children: ReactNode;
  color?: "indigo" | "zinc" | "verde" | "ambar" | "rojo";
  className?: string;
}) => {
  const colores: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    zinc: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
    verde: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    ambar: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rojo: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colores[color]} ${className}`}
    >
      {children}
    </span>
  );
};

/* ──────────────────────────────── Aviso ────────────────────────────────── */

export const Aviso = ({
  children,
  tono = "rojo",
  className = "",
}: {
  children: ReactNode;
  tono?: "rojo" | "ambar" | "indigo";
  className?: string;
}) => {
  const tonos: Record<string, string> = {
    rojo: "bg-rose-500/10 border-rose-500/30 text-rose-200",
    ambar: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-200",
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${tonos[tono]} ${className}`}
    >
      {children}
    </div>
  );
};

/* ───────────────────────────── Separador ───────────────────────────────── */

export const Separador = ({ className = "" }: { className?: string }) => (
  <div className={`h-px w-full bg-zinc-800 ${className}`} />
);

/* ────────────────────────────── Campo texto ────────────────────────────── */

interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  requerido?: boolean;
}

export const CampoTexto = ({
  label,
  error,
  hint,
  requerido,
  className = "",
  id,
  ...props
}: CampoTextoProps) => {
  const generado = useId();
  const inputId = id ?? generado;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className={ETIQUETA_BASE}>
          {label}
          {requerido ? <span className="text-rose-400"> *</span> : null}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`${CONTROL_BASE} ${error ? "border-rose-500/60" : ""} ${className}`}
        {...props}
      />
      {hint && !error ? (
        <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
};

/* ────────────────────────────── Área de texto ──────────────────────────── */

interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  requerido?: boolean;
}

export const AreaTexto = ({
  label,
  error,
  requerido,
  className = "",
  id,
  ...props
}: AreaTextoProps) => {
  const generado = useId();
  const inputId = id ?? generado;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className={ETIQUETA_BASE}>
          {label}
          {requerido ? <span className="text-rose-400"> *</span> : null}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className={`${CONTROL_BASE} min-h-[80px] resize-y ${error ? "border-rose-500/60" : ""} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
};

/* ────────────────────────────── Campo número ───────────────────────────── */

interface CampoNumeroProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  requerido?: boolean;
  min?: number;
  max?: number;
}

export const CampoNumero = ({
  label,
  error,
  requerido,
  className = "",
  id,
  min,
  max,
  ...props
}: CampoNumeroProps) => {
  const generado = useId();
  const inputId = id ?? generado;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className={ETIQUETA_BASE}>
          {label}
          {requerido ? <span className="text-rose-400"> *</span> : null}
        </label>
      ) : null}
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        className={`${CONTROL_BASE} ${error ? "border-rose-500/60" : ""} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
};

/* ────────────────────────────── Opción de select ────────────────────────── */

export interface OpcionSeleccion {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CampoSeleccionProps {
  label?: string;
  valor: string | null;
  onChange: (valor: string | null) => void;
  opciones: OpcionSeleccion[];
  placeholder?: string;
  error?: string;
  requerido?: boolean;
  deshabilitado?: boolean;
  buscable?: boolean;
  className?: string;
  /** Texto cuando no hay ninguna opción seleccionada. */
  textoVacio?: string;
}

/**
 * Selector de opciones.
 *
 * Sin `buscable` usa el `<select>` nativo del sistema: en móvil abre el
 * picker del propio dispositivo, que es mucho más usable que un desplegable
 * web. Con `buscable` muestra un input de filtro con una lista propia.
 */
export const CampoSeleccion = ({
  label,
  valor,
  onChange,
  opciones,
  placeholder = "Seleccione",
  error,
  requerido,
  deshabilitado,
  buscable = false,
  className = "",
  textoVacio = "Sin resultados",
}: CampoSeleccionProps) => {
  const generado = useId();

  if (!buscable) {
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={generado} className={ETIQUETA_BASE}>
            {label}
            {requerido ? <span className="text-rose-400"> *</span> : null}
          </label>
        ) : null}
        <select
          id={generado}
          value={valor ?? ""}
          disabled={deshabilitado}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          className={`${CONTROL_BASE} appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${error ? "border-rose-500/60" : ""} ${className}`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="">{placeholder}</option>
          {opciones.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return <CampoSeleccionBuscable
    label={label}
    valor={valor}
    onChange={onChange}
    opciones={opciones}
    placeholder={placeholder}
    error={error}
    requerido={requerido}
    deshabilitado={deshabilitado}
    className={className}
    textoVacio={textoVacio}
  />;
};

const CampoSeleccionBuscable = ({
  label,
  valor,
  onChange,
  opciones,
  placeholder,
  error,
  requerido,
  deshabilitado,
  className = "",
  textoVacio,
}: CampoSeleccionProps) => {
  const generado = useId();
  const [filtro, setFiltro] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement | null>(null);

  const filtradas = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    if (!texto) return opciones;
    return opciones.filter((o) => o.label.toLowerCase().includes(texto));
  }, [opciones, filtro]);

  const seleccionada = opciones.find((o) => o.value === valor) ?? null;

  useEffect(() => {
    if (!abierto) return;

    const alClicFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  return (
    <div className="w-full" ref={contenedor}>
      {label ? (
        <label htmlFor={generado} className={ETIQUETA_BASE}>
          {label}
          {requerido ? <span className="text-rose-400"> *</span> : null}
        </label>
      ) : null}
      <input
        id={generado}
        value={abierto ? filtro : (seleccionada?.label ?? "")}
        placeholder={placeholder}
        disabled={deshabilitado}
        onFocus={() => {
          setFiltro("");
          setAbierto(true);
        }}
        onBlur={() => setAbierto(false)}
        onChange={(e) => {
          setFiltro(e.target.value);
          setAbierto(true);
        }}
        className={`${CONTROL_BASE} ${error ? "border-rose-500/60" : ""} ${className}`}
      />
      {abierto ? (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50">
          {filtradas.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">{textoVacio}</p>
          ) : (
            filtradas.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={o.disabled}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setAbierto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-indigo-600/30 hover:text-white disabled:opacity-40"
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      ) : null}
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
};

/* ──────────────────────────────── Casilla ──────────────────────────────── */

interface CasillaProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: ReactNode;
}

export const Casilla = ({ label, className = "", ...props }: CasillaProps) => (
  <label
    className={`flex cursor-pointer items-start gap-2.5 select-none ${className}`}
  >
    <input
      type="checkbox"
      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-zinc-600 bg-zinc-900 checked:border-indigo-500 checked:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      {...props}
    />
    <span className="text-sm text-zinc-200">{label}</span>
  </label>
);

/* ───────────────────────── Botón de icono (ActionIcon) ───────────────────── */

interface BotonIconoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  etiqueta?: string;
  color?: "indigo" | "zinc" | "rojo";
}

export const BotonIcono = ({
  children,
  etiqueta,
  color = "zinc",
  className = "",
  type = "button",
  ...props
}: BotonIconoProps) => {
  const colores: Record<string, string> = {
    indigo: "text-indigo-300 hover:bg-indigo-500/10",
    zinc: "text-zinc-400 hover:bg-zinc-700/20",
    rojo: "text-rose-400 hover:bg-rose-500/10",
  };

  return (
    <button
      type={type}
      title={etiqueta}
      aria-label={etiqueta}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${colores[color]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
