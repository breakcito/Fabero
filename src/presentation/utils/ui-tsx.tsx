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
  useCallback,
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
import { createPortal } from "react-dom";

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Estilos base �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

const CONTROL_BASE =
  "w-full bg-zinc-900/60 border border-zinc-800 text-white text-base sm:text-sm rounded-lg px-3 py-2.5 sm:py-2 outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";

const ETIQUETA_BASE = "block text-sm font-semibold text-zinc-300 mb-1.5";

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Botón �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
      tamano === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-base"
    } ${VARIANTES[variante]} ${className}`}
    {...props}
  >
    {cargando ? <Cargador tamano={tamano === "sm" ? 12 : 14} /> : null}
    {children}
  </button>
);

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Cargador �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Insignia �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${colores[color]} ${className}`}
    >
      {children}
    </span>
  );
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Aviso �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
      className={`rounded-lg border px-3 py-2 text-base ${tonos[tono]} ${className}`}
    >
      {children}
    </div>
  );
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Separador �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

export const Separador = ({ className = "" }: { className?: string }) => (
  <div className={`h-px w-full bg-zinc-800 ${className}`} />
);

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Campo texto �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Área de texto �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Campo número �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
};

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Opción de select �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
  /**
   * Se dispara con el texto que se escribe para filtrar.
   *
   * Permite filtrar contra el servidor: el catálogo se acota en el backend
   * y el control vuelve a filtrar localmente sobre el resultado.
   */
  onBusqueda?: (texto: string) => void;
}

/**
 * Selector de opciones con render único para todos los casos.
 *
 * Antes cada campo lo implementaba distinto (select nativo, lista propia,
 * con o sin botón de registro rápido). Ahora todos usan el mismo control:
 *
 *  - El desplegable se renderiza en un PORTAL con posición fija: así no
 *    queda recortado por los bordes del modal (que tiene scroll propio) ni
 *    por el borde de la pantalla.
 *  - Al abrirse NO mueve los demás campos.
 *  - Lleva un botón de limpiar la selección dentro del propio control.
 *  - Siempre se puede deseleccionar (la opción vacía es "Sin selección").
 *  - Al elegir se cierra el desplegable, se cierra el teclado virtual y el
 *    foco pasa al siguiente campo.
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
  onBusqueda,
}: CampoSeleccionProps) => {
  const generado = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const contenedor = useRef<HTMLDivElement | null>(null);
  const listaRef = useRef<HTMLUListElement | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [posicion, setPosicion] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const seleccionada = opciones.find((o) => o.value === valor) ?? null;

  const filtradas = useMemo(() => {
    if (!buscable) return opciones;
    const texto = filtro.trim().toLowerCase();
    if (!texto) return opciones;
    return opciones.filter((o) => o.label.toLowerCase().includes(texto));
  }, [opciones, filtro, buscable]);

  /**
   * Calcula la posición del desplegable en coordenadas de pantalla.
   *
   * Si no hay espacio debajo, se abre hacia arriba.
   */
  const actualizarPosicion = useCallback(() => {
    const el = inputRef.current;
    if (!el || typeof window === "undefined") return;

    const rect = el.getBoundingClientRect();
    const margen = 8;
    const espacioAbajo = window.innerHeight - rect.bottom - margen;
    const espacioArriba = rect.top - margen;
    const alto = Math.min(260, Math.max(espacioAbajo, espacioArriba));

    const abrirArriba = espacioAbajo < 160 && espacioArriba > espacioAbajo;

    setPosicion({
      top: abrirArriba ? rect.top - alto - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: alto,
    });
  }, []);

  // Cierra el desplegable al pulsar fuera (control o lista).
  useEffect(() => {
    if (!abierto) return;

    const alClicFuera = (e: MouseEvent) => {
      const destino = e.target as Node;
      const dentroDelControl = contenedor.current?.contains(destino);
      const dentroDeLaLista = listaRef.current?.contains(destino);
      if (!dentroDelControl && !dentroDeLaLista) {
        setAbierto(false);
        setFiltro("");
      }
    };

    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  // Mantiene el desplegable pegado al control al hacer scroll o redimensionar.
  useEffect(() => {
    if (!abierto) return;

    const alCambiar = () => actualizarPosicion();

    window.addEventListener("scroll", alCambiar, true);
    window.addEventListener("resize", alCambiar);
    return () => {
      window.removeEventListener("scroll", alCambiar, true);
      window.removeEventListener("resize", alCambiar);
    };
  }, [abierto, actualizarPosicion]);

  const cerrar = () => {
    setAbierto(false);
    setFiltro("");
  };

  const seleccionar = (nuevoValor: string | null) => {
    onChange(nuevoValor);
    cerrar();
    // Cierra el teclado virtual. El foco NO avanza al siguiente campo: el
    // operador decide cuándo seguir con el dedo.
    inputRef.current?.blur();
  };

  const limpiar = () => {
    onChange(null);
    cerrar();
    inputRef.current?.blur();
  };

  const lista = (
    <ul
      ref={listaRef}
      role="listbox"
      style={{
        top: posicion?.top ?? 0,
        left: posicion?.left ?? 0,
        width: posicion?.width ?? 0,
        maxHeight: posicion?.maxHeight ?? 260,
      }}
      className="fixed z-[200] overflow-y-auto overscroll-contain rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl shadow-black/80"
    >
      {/* Deselección: siempre disponible */}
      <li>
        <button
          type="button"
          role="option"
          aria-selected={valor === null}
          onMouseDown={(e) => {
            e.preventDefault();
            seleccionar(null);
          }}
          className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
            valor === null
              ? "bg-indigo-600/25 text-white"
              : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
          }`}
        >
          Sin selección
        </button>
      </li>

      {filtradas.length === 0 ? (
        <li>
          <p className="px-3 py-2.5 text-sm text-zinc-500">{textoVacio}</p>
        </li>
      ) : (
        filtradas.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              role="option"
              aria-selected={o.value === valor}
              disabled={o.disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                seleccionar(o.value);
              }}
              className={`block w-full px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40 ${
                o.value === valor
                  ? "bg-indigo-600/30 text-white"
                  : "text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div className="w-full" ref={contenedor}>
      {label ? (
        <label htmlFor={generado} className={ETIQUETA_BASE}>
          {label}
          {requerido ? <span className="text-rose-400"> *</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={generado}
          ref={inputRef}
          value={abierto ? filtro : (seleccionada?.label ?? "")}
          placeholder={placeholder}
          disabled={deshabilitado}
          readOnly={!buscable}
          inputMode={buscable ? "search" : "none"}
          autoComplete="off"
          role="combobox"
          aria-expanded={abierto}
          aria-haspopup="listbox"
          onFocus={() => {
            setFiltro("");
            setAbierto(true);
            actualizarPosicion();
          }}
          onChange={(e) => {
            setFiltro(e.target.value);
            setAbierto(true);
            actualizarPosicion();
            onBusqueda?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cerrar();
              inputRef.current?.blur();
            }
          }}
          className={`${CONTROL_BASE} pr-16 ${error ? "border-rose-500/60" : ""} ${className}`}
        />

        {/* Limpiar selección (dentro del control) */}
        {valor !== null && valor !== "" ? (
          <button
            type="button"
            onClick={limpiar}
            disabled={deshabilitado}
            aria-label="Limpiar selección"
            title="Limpiar selección"
            className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-zinc-600/70 bg-zinc-800 text-zinc-200 shadow-sm transition-colors hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-40"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}

        {/* Chevron */}
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>

      {abierto && posicion && typeof document !== "undefined"
        ? createPortal(lista, document.body)
        : null}

      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
};
/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Casilla �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
    <span className="text-base text-zinc-200">{label}</span>
  </label>
);

/* �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? Botón de icono (ActionIcon) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"? */

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
