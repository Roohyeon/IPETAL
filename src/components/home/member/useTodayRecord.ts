"use client";

import { useMemo, useState } from "react";
import { KEYWORD_MAX, KEYWORD_MIN } from "@/data/keywords";
import { mergeRecords, saveTodayRecord, useSavedRecords } from "@/lib/recordRepository";
import type { DailyRecord, Mood } from "@/types/record";
import type { RecordDraft } from "./TodayRecordForm";

type Mode = "form" | "done";

const EMPTY_DRAFT: RecordDraft = { keywords: [], customKeywords: [], mood: null, memo: "" };

/** 오늘 기록 상태: 작성 중인 초안, 저장, 저장 후 결과 ↔ 다시 고치기 */
export function useTodayRecord(initialRecords: DailyRecord[], today: string) {
  // 화면 초기 기록 + 이 브라우저에 남긴 기록 (다른 화면을 다녀와도 유지된다)
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(initialRecords, saved), [initialRecords, saved]);
  const todayRecord = records.find((record) => record.date === today) ?? null;
  // 직접 고르기 전에는 오늘 기록이 있으면 결과, 없으면 질문 폼
  const [chosenMode, setMode] = useState<Mode | null>(null);
  const mode: Mode = chosenMode ?? (todayRecord ? "done" : "form");
  const [draft, setDraft] = useState<RecordDraft>(EMPTY_DRAFT);
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
    await saveTodayRecord(
      { keywords: draft.keywords, mood: draft.mood as Mood, ...(memo ? { memo } : {}) },
      today,
    );
    setSaving(false);
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
