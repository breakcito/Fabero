import { COLOR_AMBER, COLOR_VERDE } from "../utils/colores";
import { fmt } from "../utils/format";

export interface DaysGaugeProps {
  /** Valor a representar (días promedio). */
  valor: number;
  /** Escala máxima del medidor. */
  max: number;
  /** Meta a partir de la cual el indicador pasa a ámbar. */
  meta: number;
}

/**
 * Medidor semicircular de días en cancha (`.gauge` de `dash.html`): verde
 * mientras está bajo la meta, ámbar cuando la supera.
 */
export const DaysGauge = ({ valor, max, meta }: DaysGaugeProps) => {
  const r = 72;
  const len = Math.PI * r;
  const p = max > 0 ? Math.min(valor / max, 1) : 0;
  const color = valor <= meta ? COLOR_VERDE : COLOR_AMBER;

  const ang = Math.PI * (1 - Math.min(meta / (max || 1), 1));
  const mx = 100 + (r + 10) * Math.cos(ang);
  const my = 96 - (r + 10) * Math.sin(ang);
  const ix = 100 + (r - 10) * Math.cos(ang);
  const iy = 96 - (r - 10) * Math.sin(ang);

  return (
    <svg
      viewBox="0 0 200 118"
      role="img"
      aria-label="Días promedio en cancha"
      className="mx-auto block h-auto w-full max-w-[230px]"
    >
      <path
        d="M28,96 A72,72 0 0 1 172,96"
        fill="none"
        stroke="#27272a"
        strokeWidth={16}
        strokeLinecap="round"
      />
      <path
        d="M28,96 A72,72 0 0 1 172,96"
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={`${len * p} ${len}`}
      />
      <line
        x1={ix}
        y1={iy}
        x2={mx}
        y2={my}
        stroke="#e4e4e7"
        strokeWidth={2}
      />
      <text
        x={100}
        y={86}
        textAnchor="middle"
        fontSize={34}
        fontWeight={700}
        fill="#fafafa"
      >
        {fmt(valor, 1)}
      </text>
      <text x={100} y={106} textAnchor="middle" fontSize={11} fill="#71717a">
        días · meta ≤ {meta}
      </text>
    </svg>
  );
};
