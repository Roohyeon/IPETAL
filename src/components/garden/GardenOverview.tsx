"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TapIcon } from "@/components/common/Icons";
import { Petal } from "@/components/petal/Petal";
import { gardenMonthRoute } from "@/data/routes";
import { monthKeyOf } from "@/lib/date";
import { mergeRecords, useSavedRecords } from "@/lib/recordRepository";
import type { DailyRecord } from "@/types/record";
import { GardenLotus } from "./GardenLotus";
import { LilyPad } from "./LilyPad";
import layout from "./layout.module.css";
import styles from "./GardenOverview.module.css";

/** 연잎 위 꽃잎의 기울기 (달마다 조금씩 다르게) */
const PETAL_TILT = [-12, 48, 8, -40, -18, 62, 4, -34, 22, -46, 10, 58];

type GardenOverviewProps = {
  records: DailyRecord[];
  today: string;
};

/** 나의 정원: 올해 1~12월. 꽃잎이 모인 달에는 연꽃이 피고, 누르면 그 달의 달력이 열린다. */
export function GardenOverview({ records: baseRecords, today }: GardenOverviewProps) {
  // 데모 기록 + 이 브라우저에서 남긴 기록
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(baseRecords, saved), [baseRecords, saved]);
  const year = today.slice(0, 4);
  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const petals = records.filter((record) => monthKeyOf(record.date) === key).length;
    return { key, month: index + 1, petals };
  });
  const flowers = months.filter((month) => month.petals > 0).length;

  return (
    <main className={layout.main}>
      <section aria-labelledby="garden-title" className={styles.board}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>My Garden</p>
          <h1 id="garden-title" className={styles.title}>
            나의 정원
          </h1>
          <p className={styles.summary}>
            정원에 꽃 {flowers}송이 · 꽃잎 {records.length}장
          </p>
        </div>

        <ul className={styles.grid}>
          {months.map(({ key, month, petals }) => {
            const bloomed = petals > 0;
            const visual = (
              <>
                <span className={styles.pond} aria-hidden="true">
                  <LilyPad className={styles.pad} />
                  {bloomed ? (
                    <GardenLotus className={styles.lotus} />
                  ) : (
                    <span
                      className={styles.petal}
                      style={{ rotate: `${PETAL_TILT[month - 1]}deg` }}
                    >
                      <Petal mood="best" width={34} />
                    </span>
                  )}
                </span>
                <span className={styles.label}>{month}월</span>
              </>
            );

            return (
              <li key={key}>
                {bloomed ? (
                  <Link
                    href={gardenMonthRoute(key)}
                    className={`${styles.month} ${styles.bloomed}`}
                    aria-label={`${month}월의 꽃, 꽃잎 ${petals}장. 달력 열기`}
                  >
                    {visual}
                  </Link>
                ) : (
                  <div className={styles.month}>
                    {visual}
                    <span className="visually-hidden">: 아직 피어난 꽃이 없어요</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className={styles.hint}>
          <TapIcon size={20} />
          꽃을 누르면 그 달의 달력이 열려요.
        </p>
      </section>
    </main>
  );
}
