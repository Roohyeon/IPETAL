import { useId } from "react";

const CX = 120;
const CY = 92;
const RX = 98;
const RY = 50;

const point = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return `${(CX + RX * Math.cos(rad)).toFixed(1)} ${(CY + RY * Math.sin(rad)).toFixed(1)}`;
};

/** 오른쪽 아래로 갈라진 틈이 있는 연잎 */
const PAD_PATH = `M${CX} ${CY}L${point(30)}A${RX} ${RY} 0 1 1 ${point(14)}Z`;
const VEINS = [-150, -115, -80, -45, 60, 95, 130, 165, 200].map(
  (deg) => `M${CX} ${CY}L${point(deg)}`,
);

/** 정원의 연잎 (장식). 물결 위에 떠 있다. */
export function LilyPad({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 240 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-pad`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#9fb6a7" />
          <stop offset="1" stopColor="#7f9a8b" />
        </radialGradient>
      </defs>
      {/* 물결 */}
      <ellipse cx={CX} cy={CY + 10} rx="118" ry="44" fill="rgba(255,255,255,0.55)" />
      <ellipse
        cx={CX}
        cy={CY + 10}
        rx="112"
        ry="40"
        fill="none"
        stroke="#efe4df"
        strokeWidth="1.2"
      />
      <ellipse cx={CX} cy={CY + 12} rx="104" ry="35" fill="none" stroke="#f3ebe7" strokeWidth="1" />
      {/* 연잎 */}
      <path d={PAD_PATH} fill={`url(#${id}-pad)`} />
      <g stroke="#b9cbbf" strokeWidth="0.8" opacity="0.6">
        {VEINS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx="152" cy="118" r="2.2" fill="#fff" opacity="0.85" />
      <circle cx="160" cy="121" r="1.4" fill="#fff" opacity="0.8" />
    </svg>
  );
}
