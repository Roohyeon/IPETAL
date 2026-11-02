"use client";

import { useSyncExternalStore } from "react";
import type { DailyRecord } from "@/types/record";
import { toDateKey, toTimeKey } from "@/lib/date";

/**
 * 기록 저장소.
 * 지금은 브라우저(localStorage)에 저장하는 가짜 구현이다. 페이지를 옮겨 다니거나 새로고침해도 남는다.
 * 화면 컴포넌트는 이 함수들만 쓰므로 나중에 API 호출로 바꿔도 화면 코드는 바뀌지 않는다.
 */
const STORAGE_KEY = "ipetal:records";
const EMPTY: DailyRecord[] = [];

let cache: DailyRecord[] | null = null;
const listeners = new Set<() => void>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function read(): DailyRecord[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(records: DailyRecord[]) {
  cache = records;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 이 탭에서만 유지된다
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서 바뀐 기록도 반영
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 사용자가 남긴 기록 (서버 렌더링·첫 하이드레이션에서는 빈 목록) */
export function useSavedRecords(): DailyRecord[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 화면 초기 기록 + 사용자가 남긴 기록 (같은 날이면 남긴 기록이 우선), 최신 날짜 순 */
export function mergeRecords(base: DailyRecord[], saved: DailyRecord[]): DailyRecord[] {
  const byDate = new Map(base.map((record) => [record.date, record]));
  for (const record of saved) byDate.set(record.date, record);
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveTodayRecord(
  input: Omit<DailyRecord, "date" | "recordedAt">,
  today: string = toDateKey(),
): Promise<DailyRecord> {
  await delay(250);
  const record: DailyRecord = { ...input, date: today, recordedAt: toTimeKey() };
  write([record, ...read().filter((item) => item.date !== today)]);
  return record;
}

/** 지난 날짜의 기록 수정 (기록한 시각은 그대로 둔다) */
export async function saveRecord(
  input: Omit<DailyRecord, "date" | "recordedAt">,
  date: string,
  recordedAt?: string,
): Promise<DailyRecord> {
  await delay(250);
  const record: DailyRecord = {
    ...input,
    date,
    ...(recordedAt ? { recordedAt } : {}),
  };
  write([record, ...read().filter((item) => item.date !== date)]);
  return record;
}

export async function deleteRecord(date: string): Promise<void> {
  write(read().filter((item) => item.date !== date));
}
