import { useId } from "react";
import type { Mood } from "@/types/record";

export const PETAL_PATH = "M30 2C52 26 52 70 30 98C8 70 8 26 30 2Z";

type PetalProps = {
  /** 하루 느낌 → 꽃잎 명도 */
  mood?: Mood;
  width?: number;
  className?: string;
  /** 반짝이는 점 표시 */
  sparkle?: boolean;
  /** 장식용이면 true (기본). 의미가 있으면 label 전달 */
  label?: string;
};

/** 꽃잎 = 하루의 기록. 하루 느낌에 따라 위쪽 색의 명도가 달라진다. */
export function Petal({ mood = "good", width = 60, className, sparkle = true, label }: PetalProps) {
  const id = useId();
  const gradientId = `petal-${id}`;
  return (
    <svg
      className={className}
      width={width}
      height={(width * 100) / 60}
      viewBox="0 0 60 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: `var(--mood-${mood})` }} />
          <stop offset="0.45" style={{ stopColor: `var(--mood-${mood})` }} />
          <stop offset="1" style={{ stopColor: "var(--petal-fade)" }} />
        </linearGradient>
      </defs>
      <path
        d={PETAL_PATH}
        fill={`url(#${gradientId})`}
        stroke="var(--color-petal-border)"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      {sparkle ? (
        <>
          <circle cx="23.5" cy="34" r="2.6" fill="#fff" opacity="0.95" />
          <circle cx="26.5" cy="41" r="1.3" fill="#fff" opacity="0.9" />
        </>
      ) : null}
    </svg>
  );
}
