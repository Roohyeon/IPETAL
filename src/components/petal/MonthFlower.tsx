import { useId } from "react";
import type { Mood } from "@/types/record";
import styles from "./MonthFlower.module.css";

type MonthFlowerProps = {
  /** 꽃잎 자리 수 (한 달의 일수) */
  total: number;
  /** 채워진 꽃잎의 하루 느낌 (기록 순서) */
  filledMoods: Mood[];
  /** 꽃 가운데 아래 배지 (예: "10월") */
  badge?: string;
  /** 바닥선 표시 (장식용 연꽃) */
  groundLine?: boolean;
  /** 빈 꽃잎 자리 표시 여부 */
  showEmpty?: boolean;
  className?: string;
  label?: string;
};

const VIEW_W = 300;
const VIEW_H = 140;
const BASE_X = 150;
const BASE_Y = 128;
const SPREAD = 84;

type Slot = { angle: number; length: number; width: number };

function petalPath(length: number, width: number): string {
  const w = width * 0.62;
  return `M0 0C${w} ${-length * 0.28} ${w} ${-length * 0.68} 0 ${-length}C${-w} ${-length * 0.68} ${-w} ${-length * 0.28} 0 0Z`;
}

function buildSlots(total: number): Slot[] {
  return Array.from({ length: total }, (_, index) => {
    const t = total === 1 ? 0 : index / (total - 1);
    const angle = -SPREAD + t * SPREAD * 2;
    const k = Math.abs(angle) / SPREAD;
    // 가운데는 짧고 곧게, 바깥은 길고 넓게 누운 연꽃 모양
    return { angle, length: 104 + 30 * k * k, width: 30 + 30 * k };
  });
}

/** 가운데부터 왼쪽·오른쪽 번갈아 채운다 */
function fillOrder(slots: Slot[]): number[] {
  return slots
    .map((slot, index) => ({ index, key: Math.abs(slot.angle) + (slot.angle < 0 ? 0 : 0.01) }))
    .sort((a, b) => a.key - b.key)
    .map((item) => item.index);
}

/** 꽃 = 한 달의 기록. 기록한 날만큼 꽃잎이 채워진다. */
export function MonthFlower({
  total,
  filledMoods,
  badge,
  groundLine = false,
  showEmpty = true,
  className,
  label,
}: MonthFlowerProps) {
  const id = useId();
  const slots = buildSlots(total);
  const order = fillOrder(slots);
  const moodBySlot = new Map<number, Mood>();
  filledMoods.slice(0, total).forEach((mood, i) => moodBySlot.set(order[i], mood));

  // 바깥(넓은) 꽃잎부터 그려 가운데가 위에 오도록
  const drawOrder = slots
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => Math.abs(b.slot.angle) - Math.abs(a.slot.angle));
  const moods = Array.from(new Set(filledMoods));

  return (
    <div className={`${styles.flower} ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        focusable="false"
      >
        <defs>
          {moods.map((mood) => (
            <linearGradient key={mood} id={`${id}-${mood}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" style={{ stopColor: "var(--petal-fade)" }} />
              <stop offset="0.55" style={{ stopColor: `var(--mood-${mood})` }} />
              <stop offset="1" style={{ stopColor: `var(--mood-${mood})` }} />
            </linearGradient>
          ))}
        </defs>

        {groundLine ? (
          <line x1="20" x2="280" y1={BASE_Y + 4} y2={BASE_Y + 4} className={styles.ground} />
        ) : null}

        {showEmpty
          ? drawOrder.map(({ slot, index }) =>
              moodBySlot.has(index) ? null : (
                <path
                  key={`e-${index}`}
                  d={petalPath(slot.length, slot.width)}
                  transform={`translate(${BASE_X} ${BASE_Y}) rotate(${slot.angle})`}
                  className={styles.empty}
                />
              ),
            )
          : null}

        {drawOrder.map(({ slot, index }) => {
          const mood = moodBySlot.get(index);
          if (!mood) return null;
          return (
            <path
              key={`f-${index}`}
              d={petalPath(slot.length, slot.width)}
              transform={`translate(${BASE_X} ${BASE_Y}) rotate(${slot.angle})`}
              fill={`url(#${id}-${mood})`}
              className={styles.filled}
            />
          );
        })}
      </svg>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </div>
  );
}
