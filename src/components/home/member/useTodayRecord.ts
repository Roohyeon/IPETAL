"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { KEYWORD_MAX, KEYWORD_MIN } from "@/data/keywords";
import { mergeRecords, saveTodayRecord, useSavedRecords } from "@/lib/recordRepository";
import type { DailyRecord, Mood } from "@/types/record";
import type { RecordDraft } from "./TodayRecordForm";

type Mode = "form" | "done";

/** 저장 후 결과로 넘어가기 전 로딩 장면을 보여주는 최소 시간 */
const SAVING_SCENE_MS = 1400;

const EMPTY_DRAFT: RecordDraft = { keywords: [], customKeywords: [], mood: null, memo: "" };

/**
 * 작성 중인 초안은 화면끼리 함께 쓴다.
 * 나의 정원·나의 패턴의 기록 시트에서 고른 내용이 HOME 폼에도 그대로 이어진다 (새로고침 전까지, 날짜별).
 */
let sharedDraft: { date: string; draft: RecordDraft } | null = null;
const draftListeners = new Set<() => void>();

function subscribeDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => {
    draftListeners.delete(listener);
  };
}

function writeDraft(date: string, draft: RecordDraft) {
  sharedDraft = { date, draft };
  draftListeners.forEach((listener) => listener());
}

function useSharedDraft(today: string) {
  const draft = useSyncExternalStore(
    subscribeDraft,
    () => (sharedDraft?.date === today ? sharedDraft.draft : EMPTY_DRAFT),
    () => EMPTY_DRAFT,
  );
  return [draft, (next: RecordDraft) => writeDraft(today, next)] as const;
}

/** 오늘 기록 상태: 작성 중인 초안, 저장, 저장 후 결과 ↔ 다시 고치기 */
export function useTodayRecord(initialRecords: DailyRecord[], today: string) {
  // 화면 초기 기록 + 이 브라우저에 남긴 기록 (다른 화면을 다녀와도 유지된다)
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(initialRecords, saved), [initialRecords, saved]);
  const todayRecord = records.find((record) => record.date === today) ?? null;
  // 직접 고르기 전에는 오늘 기록이 있으면 결과, 없으면 질문 폼
  const [chosenMode, setMode] = useState<Mode | null>(null);
  const mode: Mode = chosenMode ?? (todayRecord ? "done" : "form");
  const [draft, setDraft] = useSharedDraft(today);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const ready =
    draft.keywords.length >= KEYWORD_MIN &&
    draft.keywords.length <= KEYWORD_MAX &&
    draft.mood !== null;

  const save = async () => {
    if (!ready || saving || !draft.mood) return;
    setSaving(true);
    const memo = draft.memo.trim();
    await Promise.all([
      saveTodayRecord(
        { keywords: draft.keywords, mood: draft.mood as Mood, ...(memo ? { memo } : {}) },
        today,
      ),
      new Promise((resolve) => setTimeout(resolve, SAVING_SCENE_MS)),
    ]);
    setSaving(false);
    setDraft(EMPTY_DRAFT);
    setJustSaved(true);
    setMode("done");
  };

  const edit = () => {
    if (todayRecord) {
      setDraft({
        keywords: todayRecord.keywords,
        customKeywords: [],
        mood: todayRecord.mood,
        memo: todayRecord.memo ?? "",
      });
    }
    setJustSaved(false);
    setMode("form");
  };

  return { records, todayRecord, mode, draft, setDraft, ready, saving, justSaved, save, edit };
}

export type TodayRecordState = ReturnType<typeof useTodayRecord>;
