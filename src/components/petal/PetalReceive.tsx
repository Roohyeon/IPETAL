"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Mood } from "@/types/record";
import { Petal } from "./Petal";
import styles from "./PetalBurst.module.css";

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const DIAMONDS = [
  { x: 9, y: 16 },
  { x: 90, y: 11 },
  { x: 95, y: 77 },
  { x: 14, y: 90 },
];

type PetalReceiveProps = {
  mood: Mood;
  /** true면 '꽃잎 받기' 연출 재생, false면 완료 상태 그대로 */
  play: boolean;
  className?: string;
};

/**
 * 꽃잎 받기 연출 (여러 단계가 순서대로 이어짐)
 * 1) 점선 원이 그려지고 → 2) 꽃잎이 피어나며 → 3) 금색 빛줄기와 장식이 차례로 나타남
 */
export function PetalReceive({ mood, play, className }: PetalReceiveProps) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;
  const from = <T,>(initial: T) => (animate ? initial : false);

  return (
    <div className={`${styles.burst} ${styles.ticks} ${className ?? ""}`} aria-hidden="true">
      <motion.span
        className={styles.ring}
        initial={from({ opacity: 0, scale: 0.6, rotate: -40 })}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {TICKS.map((deg, i) => (
        <motion.span
          key={deg}
          className={styles.tick}
          style={{ rotate: deg }}
          initial={from({ opacity: 0, scaleY: 0.4 })}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.75 + i * 0.04, duration: 0.3 }}
        />
      ))}
      {DIAMONDS.map((d, i) => (
        <motion.span
          key={i}
          className={styles.diamond}
          style={{ left: `${d.x}%`, top: `${d.y}%`, rotate: 45 }}
          initial={from({ opacity: 0, scale: 0 })}
          animate={{ opacity: i === 2 ? 0.45 : 1, scale: 1 }}
          transition={{ delay: 1.15 + i * 0.08, type: "spring", stiffness: 380, damping: 18 }}
        />
      ))}
      <motion.div
        className={styles.petalWrap}
        initial={from({ opacity: 0, scale: 0.3, y: 24, rotate: -12 })}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Petal mood={mood} sparkle={false} className={styles.petalFill} />
      </motion.div>
    </div>
  );
}
