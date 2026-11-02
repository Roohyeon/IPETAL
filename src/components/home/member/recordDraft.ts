import { KEYWORD_MAX, KEYWORD_MIN } from "@/data/keywords";
import type { DailyRecord } from "@/types/record";
import type { RecordDraft } from "./TodayRecordForm";

/**
 * 기록 질문지 초안 ↔ 기록 변환 (오늘 기록 · 지난 기록 수정이 함께 쓴다)
 */
export const EMPTY_DRAFT: RecordDraft = {
  keywords: [],
  customKeywords: [],
  mood: null,
  memo: "",
  photo: null,
};

/** 키워드 1~5개 + 하루 느낌을 골랐으면 남길 수 있다 */
export function isDraftReady(draft: RecordDraft): boolean {
  return (
    draft.keywords.length >= KEYWORD_MIN &&
    draft.keywords.length <= KEYWORD_MAX &&
    draft.mood !== null
  );
}

/** 남긴 기록을 고치려고 질문지에 채운다 */
export function recordToDraft(record: DailyRecord): RecordDraft {
  return {
    keywords: record.keywords,
    customKeywords: [],
    mood: record.mood,
    memo: record.memo ?? "",
    photo: record.photo ?? null,
  };
}

/** 저장할 내용 (비어 있는 메모·사진은 넣지 않는다). 하루 느낌을 안 골랐으면 null */
export function draftToRecordInput(
  draft: RecordDraft,
): Omit<DailyRecord, "date" | "recordedAt"> | null {
  if (!draft.mood) return null;
  const memo = draft.memo.trim();
  return {
    keywords: draft.keywords,
    mood: draft.mood,
    ...(memo ? { memo } : {}),
    ...(draft.photo ? { photo: draft.photo } : {}),
  };
}
