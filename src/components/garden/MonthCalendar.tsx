"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/common/Icons";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { MOOD_OPTIONS, moodLabel } from "@/data/moods";
import { gardenMonthRoute, ROUTES } from "@/data/routes";
import { daysInMonth, firstWeekdayOf, monthKeyOf, shiftMonth } from "@/lib/date";
import { deleteRecord, mergeRecords, useSavedRecords } from "@/lib/recordRepository";
import type { DailyRecord } from "@/types/record";
import { useOpenRecordSheet } from "@/components/common/RecordSheet";
import { DayRecordDialog } from "./DayRecordDialog";
import { requestGardenFocus } from "./gardenFocus";
import layout from "./layout.module.css";
import styles from "./MonthCalendar.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type MonthCalendarProps = {
  /** YYYY-MM */
  monthKey: string;
  initialRecords: DailyRecord[];
  today: string;
  /** 기록이 처음 있는 달 (이전 달로 갈 수 있는 끝) */
  firstMonth: string;
};

export function MonthCalendar({ monthKey, initialRecords, today, firstMonth }: MonthCalendarProps) {
  // 데모 기록 + 이 브라우저에서 남긴 기록 (지운 날은 뺀다)
  const saved = useSavedRecords();
  const [deleted, setDeleted] = useState<string[]>([]);
  const records = useMemo(
    () =>
      mergeRecords(
        initialRecords,
        saved.filter((record) => monthKeyOf(record.date) === monthKey),
      ).filter((record) => !deleted.includes(record.date)),
    [initialRecords, saved, monthKey, deleted],
  );
  const [openDate, setOpenDate] = useState<string | null>(null);

  const [year, month] = monthKey.split("-").map(Number);
  const byDate = new Map(records.map((record) => [record.date, record]));
  const total = daysInMonth(`${monthKey}-01`);
  const leading = firstWeekdayOf(monthKey);
  const prev = shiftMonth(monthKey, -1);
  const next = shiftMonth(monthKey, 1);
  const hasPrev = prev >= firstMonth;
  const hasNext = next <= monthKeyOf(today);
  const openRecord = openDate ? (byDate.get(openDate) ?? null) : null;
  const openOrder = openDate ? records.filter((record) => record.date <= openDate).length : 0;

  const remove = (date: string) => {
    // 남긴 기록은 저장소에서 지우고, 데모 기록은 이 화면에서만 지운다
    // TODO: 실제 삭제 API 연결
    void deleteRecord(date);
    setDeleted((list) => [...list, date]);
    setOpenDate(null);
  };

  return (
    <main className={layout.main}>
      {/* 정원으로 돌아가면 이번 달 쪽으로 스크롤된다 */}
      <Link href={ROUTES.garden} className={styles.back} onClick={requestGardenFocus}>
        <ChevronLeftIcon size={18} />
        정원으로
      </Link>
      <h1 className={styles.title}>{month}월</h1>

      <section
        aria-label={`${year}년 ${month}월 달력`}
        className={`${layout.glass} ${styles.card}`}
      >
        <div className={styles.toolbar}>
          <MonthNav href={hasPrev ? gardenMonthRoute(prev) : null} direction="prev" />
          <h2 className={styles.monthTitle} aria-live="polite">
            {year}년 {month}월
          </h2>
          <MonthNav href={hasNext ? gardenMonthRoute(next) : null} direction="next" />
          <Link href={gardenMonthRoute(monthKeyOf(today))} className={styles.todayLink}>
            오늘
          </Link>
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <ol className={styles.days}>
          {Array.from({ length: leading }, (_, i) => (
            <li key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: total }, (_, i) => {
            const day = i + 1;
            const date = `${monthKey}-${String(day).padStart(2, "0")}`;
            const record = byDate.get(date);
            const isToday = date === today;

            if (record) {
              return (
                <li key={date}>
                  <button
                    type="button"
                    className={`${styles.day} ${styles.recorded} ${isToday ? styles.today : ""}`}
                    onClick={() => setOpenDate(date)}
                    aria-label={`${month}월 ${day}일, ${moodLabel(record.mood)}. 기록 보기`}
                  >
                    <span className={styles.num}>{day}</span>
                    <MoodIcon mood={record.mood} size={30} className={styles.face} />
                    <span className={`${styles.dot} ${styles[record.mood]}`} />
                  </button>
                </li>
              );
            }

            if (isToday) {
              return (
                <li key={date}>
                  <TodayCell
                    className={`${styles.day} ${styles.today}`}
                    label={`오늘 ${month}월 ${day}일, 오늘의 꽃잎 남기기`}
                  >
                    <span className={styles.num}>{day}</span>
                    <PlusIcon size={20} strokeWidth={2} className={styles.plus} />
                    <span className={styles.todayText}>오늘</span>
                  </TodayCell>
                </li>
              );
            }

            const future = date > today;
            return (
              <li key={date}>
                {future ? (
                  <span className={`${styles.day} ${styles.future}`}>
                    <span className={styles.num}>{day}</span>
                  </span>
                ) : (
                  // 기록 없는 지난날: 눌러서 그날의 기록을 남긴다
                  <button
                    type="button"
                    className={`${styles.day} ${styles.empty}`}
                    onClick={() => setOpenDate(date)}
                    aria-haspopup="dialog"
                    aria-label={`${month}월 ${day}일, 기록 없음. 기록 남기기`}
                  >
                    <span className={styles.num}>{day}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <ul className={styles.legend} aria-label="표시 안내">
          {MOOD_OPTIONS.map((option) => (
            <li key={option.value}>
              <MoodIcon mood={option.value} size={20} className={styles.face} />
              <span className={`${styles.dot} ${styles[option.value]}`} />
              {option.label}
            </li>
          ))}
          <li>
            <span className={styles.dashed} />
            점선 칸 = 기록 없음
          </li>
        </ul>
      </section>

      <DayRecordDialog
        date={openDate}
        record={openRecord}
        order={openOrder}
        onClose={() => setOpenDate(null)}
        onDelete={remove}
        // 지웠던 날에 다시 남기면 다시 보이게
        onSaved={(date) => setDeleted((list) => list.filter((item) => item !== date))}
      />
    </main>
  );
}

/** 오늘 칸: 기록 시트를 열고, 시트가 없는 화면이면 오늘 기록으로 이동 */
function TodayCell({
  className,
  label,
  children,
}: {
  className: string;
  label: string;
  children: ReactNode;
}) {
  const openSheet = useOpenRecordSheet();
  if (openSheet) {
    return (
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-haspopup="dialog"
        onClick={openSheet}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={ROUTES.todayRecord} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

function MonthNav({ href, direction }: { href: string | null; direction: "prev" | "next" }) {
  const label = direction === "prev" ? "이전 달" : "다음 달";
  const content = (
    <>
      {direction === "prev" ? <ChevronLeftIcon size={18} /> : null}
      <span className={styles.navText}>{label}</span>
      {direction === "next" ? <ChevronRightIcon size={18} /> : null}
    </>
  );

  if (!href) {
    return (
      <span
        className={`${styles.nav} ${styles.navDisabled}`}
        aria-disabled="true"
        aria-label={label}
      >
        {content}
      </span>
    );
  }
  return (
    <Link href={href} className={styles.nav} aria-label={label}>
      {content}
    </Link>
  );
}
