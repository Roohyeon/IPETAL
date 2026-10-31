import type { Mood } from "@/types/record";
import { SparkleIcon } from "@/components/common/Icons";
import { Petal } from "./Petal";
import styles from "./PetalBurst.module.css";

type PetalBurstProps = {
  mood: Mood;
  /** ticks: 로그인 후 결과 카드 / sparkles: 로그인 전 예시 화면 */
  variant?: "ticks" | "sparkles";
  className?: string;
};

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const DIAMONDS = [
  { x: 9, y: 16 },
  { x: 90, y: 11 },
  { x: 95, y: 77 },
  { x: 14, y: 90 },
];

/** 꽃잎을 얻었을 때의 꽃잎 + 둘레 장식 */
export function PetalBurst({ mood, variant = "ticks", className }: PetalBurstProps) {
  return (
    <div className={`${styles.burst} ${styles[variant]} ${className ?? ""}`} aria-hidden="true">
      <span className={styles.ring} />
      {variant === "ticks" ? (
        <>
          {TICKS.map((deg) => (
            <span key={deg} className={styles.tick} style={{ transform: `rotate(${deg}deg)` }} />
          ))}
          {DIAMONDS.map((d, i) => (
            <span
              key={i}
              className={styles.diamond}
              style={{ left: `${d.x}%`, top: `${d.y}%`, opacity: i === 2 ? 0.45 : 1 }}
            />
          ))}
        </>
      ) : (
        <>
          <SparkleIcon className={`${styles.sparkle} ${styles.s1}`} />
          <SparkleIcon className={`${styles.sparkle} ${styles.s2}`} />
          <SparkleIcon className={`${styles.sparkle} ${styles.s3}`} />
          <SparkleIcon className={`${styles.sparkle} ${styles.s4}`} />
        </>
      )}
      <Petal mood={mood} sparkle={variant === "sparkles"} className={styles.petal} />
    </div>
  );
}
