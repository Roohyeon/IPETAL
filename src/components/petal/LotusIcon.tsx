import { useId } from "react";

const PETALS = [
  { d: "M16 26C10 22 9 13 16 4c7 9 6 18 0 22z", fill: 0 },
  { d: "M15 26C8 25 3 18 4 9c7 3 11 10 11 17z", fill: 1 },
  { d: "M17 26c7-1 12-8 11-17-7 3-11 10-11 17z", fill: 1 },
  { d: "M14 26.5C7 27 1.5 23 0.5 17c6-1 11 3 13.5 9.5z", fill: 2 },
  { d: "M18 26.5c7 .5 12.5-3.5 13.5-9.5-6-1-11 3-13.5 9.5z", fill: 2 },
];

/** 섹션 제목 앞의 작은 연꽃 아이콘 (장식) */
export function LotusIcon({ className }: { className?: string }) {
  const id = useId();
  const tones = ["var(--mood-best)", "var(--mood-good)", "var(--mood-okay)"];
  return (
    <svg
      className={className}
      viewBox="0 0 32 30"
      width="32"
      height="30"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {tones.map((tone, i) => (
          <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: tone }} />
            <stop offset="1" style={{ stopColor: "var(--petal-fade)" }} />
          </linearGradient>
        ))}
      </defs>
      {[...PETALS].reverse().map((petal) => (
        <path
          key={petal.d}
          d={petal.d}
          fill={`url(#${id}-${petal.fill})`}
          stroke="var(--color-petal-border)"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}
      <path d="M3 28.5h26" stroke="#9fb0a8" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
