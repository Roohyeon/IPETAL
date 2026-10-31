import { InfoIcon, LockIcon } from "@/components/common/Icons";
import type { DailyRecord } from "@/types/record";
import panel from "./panel.module.css";
import styles from "./WeeklyPattern.module.css";

/** 꽃잎 7장이 모이면 패턴 리포트가 열린다 */
const UNLOCK_COUNT = 7;

/** 이번 주 나의 패턴 (데스크톱) */
export function WeeklyPattern({ records }: { records: DailyRecord[] }) {
  const count = Math.min(records.length, UNLOCK_COUNT);
  const remaining = UNLOCK_COUNT - count;

  return (
    <section aria-labelledby="pattern-week-title" className={panel.panel}>
      <h2 id="pattern-week-title" className={panel.title}>
        이번 주 나의 패턴
      </h2>
      <p className={panel.sub}>꽃잎 7장이 모이면 나만의 패턴을 알려드려요.</p>

      <div className={`${panel.inner} ${styles.inner}`}>
        <div className={styles.lock}>
          <h3 className={styles.lockTitle}>
            <LockIcon size={20} />
            아직 패턴 리포트가 열리지 않았어요
          </h3>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={UNLOCK_COUNT}
            aria-valuenow={count}
            aria-label="패턴 리포트까지 모은 꽃잎"
          >
            <span style={{ width: `${(count / UNLOCK_COUNT) * 100}%` }} />
          </div>
          <p className={styles.progressText}>
            꽃잎 {count} / {UNLOCK_COUNT}장
          </p>
          <p className={styles.remaining}>앞으로 꽃잎 {remaining}장이 더 모이면 리포트가 열려요.</p>
        </div>

        <p className={styles.info}>
          <InfoIcon size={20} className={styles.infoIcon} />
          리포트가 열리면 자주 남긴 키워드와 기분 흐름을 보여드려요.
        </p>
      </div>
    </section>
  );
}
