"use client";

import { TodayRecordPanel } from "./TodayRecordPanel";
import { useTodayRecord } from "./useTodayRecord";

const NO_RECORDS: never[] = [];

/** HOME 밖(나의 정원·나의 패턴)에서 여는 오늘 기록 */
export function QuickRecord({ today }: { today: string }) {
  const state = useTodayRecord(NO_RECORDS, today);
  return <TodayRecordPanel state={state} inSheet />;
}
