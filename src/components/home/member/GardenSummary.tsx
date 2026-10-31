import { ButtonLink } from "@/components/common/Button";
import { MonthFlower } from "@/components/petal/MonthFlower";
import { ROUTES } from "@/data/routes";
import { daysInMonth, isSameMonth, monthOf, streakDays } from "@/lib/date";
import type { DailyRecord } from "@/types/record";
import panel from "./panel.module.css";
import styles from "./GardenSummary.module.css";

type GardenSummaryProps = {
  records: DailyRecord[];
  today: string;
};

/** 나의 정원 요약 (데스크톱) */
export function GardenSummary({ records, today }: GardenSummaryProps) {
  const month = monthOf(today);
  const total = daysInMonth(today);
  const thisMonth = records
    .filter((record) => isSameMonth(record.date, today))
    .sort((a, b) => a.date.localeCompare(b.date));
  const petalCount = records.length;
  const flowerCount = new Set(records.map((record) => record.date.slice(0, 7))).size;
  const streak = streakDays(
    records.map((record) => record.date),
    today,
  );
  const empty = petalCount === 0;

  const stats = [
    { label: "모인 꽃잎", value: `${petalCount}장` },
    { label: "정원의 꽃", value: `${flowerCount}송이` },
    { label: "연속 기록", value: streak > 0 ? `${streak}일째` : "0일" },
  ];

  return (
    <section aria-labelledby="garden-title" className={panel.panel}>
      <h2 id="garden-title" className={panel.title}>
        나의 정원
      </h2>
      <p className={panel.sub}>
        {empty
          ? `아직 정원이 비어 있어요. 첫 꽃잎을 남기면 ${month}월의 꽃이 피기 시작해요.`
          : `첫 꽃잎이 모였어요. ${month}월의 꽃이 피어나기 시작했어요.`}
      </p>

      <div className={`${panel.inner} ${styles.inner}`}>
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.flowerArea}>
          <MonthFlower
            total={total}
            filledMoods={thisMonth.map((record) => record.mood)}
            badge={`${month}월`}
            className={styles.flower}
            label={`${month}월의 꽃, 꽃잎 ${thisMonth.length}장`}
          />
          <p className={styles.flowerName}>{month}월의 꽃</p>
          <p className={styles.flowerCount}>
            꽃잎 {thisMonth.length} / {total}
            <span className={styles.state}>{empty ? "피기 전" : "피어나는 중"}</span>
          </p>
        </div>

        <div className={styles.more}>
          <ButtonLink href={ROUTES.garden} variant="outline" className={styles.moreButton}>
            나의 정원 보러 가기
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
