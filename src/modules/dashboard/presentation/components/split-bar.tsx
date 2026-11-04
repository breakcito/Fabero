export interface SplitPart {
  nombre: string;
  valor: number;
  color: string;
}

export interface SplitBarProps {
  parts: SplitPart[];
  format: (v: number) => string;
}

/**
 * Barra segmentada con su leyenda (`.split` + `.legend` de `dash.html`).
 */
export const SplitBar = ({ parts, format }: SplitBarProps) => (
  <>
    <div className="flex h-3 gap-[3px]">
      {parts.map((p) => (
        <span
          key={p.nombre}
          className="h-full rounded-full"
          style={{ flex: Math.max(p.valor, 0), background: p.color }}
        />
      ))}
    </div>
    <div className="flex flex-col gap-1.5">
      {parts.map((p) => (
        <div
          key={p.nombre}
          className="flex items-center justify-between gap-2 text-[12.5px] text-zinc-500"
        >
          <span className="inline-flex min-w-0 items-center">
            <i
              className="mr-2 inline-block size-2 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <span className="truncate">{p.nombre}</span>
          </span>
          <b className="shrink-0 font-semibold tabular-nums text-zinc-100">
            {format(p.valor)}
          </b>
        </div>
      ))}
    </div>
  </>
);
