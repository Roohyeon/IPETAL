"use client";

import { useRef } from "react";
import { MemberShell } from "@/components/common/MemberShell";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { formatLongDate } from "@/lib/date";
import type { DailyRecord } from "@/types/record";
import { GardenSummary } from "./GardenSummary";
import { RecentPetals } from "./RecentPetals";
import { TodayRecordPanel } from "./TodayRecordPanel";
import { useTodayRecord } from "./useTodayRecord";
import { WeeklyPattern } from "./WeeklyPattern";
import styles from "./MemberHome.module.css";

type MemberHomeProps = {
  userName: string;
  initialRecords: DailyRecord[];
  today: string;
};

export function MemberHome({ userName, initialRecords, today }: MemberHomeProps) {
  const state = useTodayRecord(initialRecords, today);
  const { records } = state;
  const formTopRef = useRef<HTMLDivElement>(null);
  // 기록 완료 화면은 인사 카드 없이 히어로가 화면 위를 채운다 (Opal 홈 구조)
  const done = !state.saving && state.mode === "done" && state.todayRecord !== null;

  const goToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formTopRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  };

  return (
    <MemberShell today={today} sheetContent={<TodayRecordPanel state={state} />}>
      <main id="member-main" className={`${styles.main} ${done ? styles.mainDone : ""}`}>
        {done ? (
          <section id="today" aria-labelledby="today-title" className={styles.todayDone}>
            <h1 id="today-title" className={styles.srOnly}>
              {formatLongDate(today)}, {userName}님의 오늘 기록
            </h1>
            <TodayRecordPanel state={state} />
          </section>
        ) : (
          <section id="today" aria-labelledby="today-title" className={styles.todayCard}>
            <p className={styles.date}>{formatLongDate(today)}</p>
            <h1 id="today-title" className={styles.greeting}>
              {userName}님, 오늘도 수고했어요.
            </h1>

            <TodayRecordPanel state={state} formRef={formTopRef} />
          </section>
        )}

        <div className={styles.desktopOnly}>
          <RecentPetals records={records} today={today} onStart={goToForm} />
          <GardenSummary records={records} today={today} />
          <WeeklyPattern records={records} />
        </div>
      </main>

      <RevealOnScroll selector="#member-main section:not(#today)" />
    </MemberShell>
  );
}
