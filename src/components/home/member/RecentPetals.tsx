import { Button } from "@/components/common/Button";
import { KeywordTag } from "@/components/petal/KeywordChip";
import { Petal, PETAL_PATH } from "@/components/petal/Petal";
import { moodLabel } from "@/data/moods";
import { formatShortDate } from "@/lib/date";
import type { DailyRecord } from "@/types/record";
import panel from "./panel.module.css";
import styles from "./RecentPetals.module.css";

const SLOTS = 4;

type RecentPetalsProps = {
  records: DailyRecord[];
  today: string;
  onStart: () => void;
};

/** 최근에 남긴 꽃잎 (데스크톱) */
export function RecentPetals({ records, today, onStart }: RecentPetalsProps) {
  const recent = records.slice(0, SLOTS);
  const placeholders = SLOTS - recent.length;

  return (
    <section aria-labelledby="recent-title" className={panel.panel}>
      <h2 id="recent-title" className={panel.title}>
        최근에 남긴 꽃잎
      </h2>
      <p className={panel.sub}>지난 며칠의 하루들이에요.</p>

      {recent.length === 0 ? (
        <div className={styles.empty}>
          <svg
            className={styles.emptyPetal}
            viewBox="0 0 60 100"
            aria-hidden="true"
            focusable="false"
          >
            <path d={PETAL_PATH} />
          </svg>
          <p className={styles.emptyTitle}>아직 피어난 꽃잎이 없어요.</p>
          <p className={styles.emptySub}>오늘의 첫 꽃잎을 남겨볼까요?</p>
          <Button variant="outline" size="sm" className={styles.emptyButton} onClick={onStart}>
            오늘의 꽃잎 남기기
          </Button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {recent.map((record) => (
            <li key={record.date} className={styles.card}>
              <p className={styles.cardDate}>
                {formatShortDate(record.date)}
                {record.date === today ? " · 오늘" : ""}
              </p>
              <div className={styles.cardMood}>
                <Petal mood={record.mood} sparkle={false} width={26} />
                <span>{moodLabel(record.mood)}</span>
              </div>
              <div className={styles.cardTags}>
                {record.keywords.map((keyword) => (
                  <KeywordTag key={keyword} label={keyword} className={styles.tag} />
                ))}
              </div>
            </li>
          ))}
          {Array.from({ length: placeholders }, (_, i) => (
            <li key={`slot-${i}`} className={styles.slot} aria-hidden={i > 0 || undefined}>
              {i === 0 ? "내일의 꽃잎 자리" : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
