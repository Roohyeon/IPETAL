"use client";

import { useId, useRef, useState } from "react";
import { Button, TextAction } from "@/components/common/Button";
import { ImageIcon } from "@/components/common/Icons";
import { AddKeywordChip } from "@/components/petal/AddKeywordChip";
import { KeywordChip } from "@/components/petal/KeywordChip";
import { MoodSelector } from "@/components/petal/MoodSelector";
import { KEYWORD_MAX, MEMO_MAX_LENGTH, SUGGESTED_KEYWORDS } from "@/data/keywords";
import { compressPhoto } from "@/lib/photo";
import type { Keyword, Mood } from "@/types/record";
import styles from "./TodayRecordForm.module.css";

export type RecordDraft = {
  keywords: Keyword[];
  /** '키워드 직접 추가'로 만든 키워드 (칩 목록에 이어서 표시) */
  customKeywords: Keyword[];
  mood: Mood | null;
  memo: string;
  /** 그날의 사진 (선택, 줄인 data URL) */
  photo: string | null;
};

type TodayRecordFormProps = {
  draft: RecordDraft;
  onChange: (draft: RecordDraft) => void;
  ready: boolean;
  saving: boolean;
  onSave: () => void;
  /** 저장 버튼 문구 (기본: 오늘의 꽃잎 남기기) — 지난 기록 수정 때 바꾼다 */
  submitLabel?: string;
  /** 다 골랐을 때 안내 문구 */
  readyText?: string;
};

/** B-1 오늘의 기록: 키워드 1~5개(필수) + 하루 느낌 1개(필수) + 사진(선택) + 한 줄 메모(선택) */
export function TodayRecordForm({
  draft,
  onChange,
  ready,
  saving,
  onSave,
  submitLabel = "오늘의 꽃잎 남기기",
  readyText = "준비됐어요. 오늘의 꽃잎을 남겨보세요.",
}: TodayRecordFormProps) {
  const ids = useId();
  const keywordTitleId = `${ids}-kw`;
  const moodTitleId = `${ids}-mood`;
  const memoInputId = `${ids}-memo`;
  const [memoToggled, setMemoOpen] = useState(false);
  // 다른 화면(기록 시트)에서 적은 메모가 있으면 펼쳐서 보여준다
  const memoOpen = memoToggled || draft.memo.length > 0;
  const memoInputRef = useRef<HTMLInputElement>(null);
  const memoToggleRef = useRef<HTMLButtonElement>(null);
  const photoTitleId = `${ids}-photo`;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // 사진 고르기: 줄여서 초안에 담는다
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      onChange({ ...draft, photo: await compressPhoto(file) });
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "사진을 올리지 못했어요.");
    } finally {
      setPhotoBusy(false);
      // 같은 사진을 다시 골라도 바뀌도록
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removePhoto = () => {
    onChange({ ...draft, photo: null });
    setPhotoError(null);
  };

  const count = draft.keywords.length;
  const full = count >= KEYWORD_MAX;
  const chipLabels = [
    ...SUGGESTED_KEYWORDS,
    ...draft.customKeywords.filter((k) => !SUGGESTED_KEYWORDS.includes(k)),
    // 수정하기로 돌아왔을 때 목록에 없는 기존 키워드
    ...draft.keywords.filter(
      (k) => !SUGGESTED_KEYWORDS.includes(k) && !draft.customKeywords.includes(k),
    ),
  ];

  const toggleKeyword = (keyword: Keyword) => {
    const selected = draft.keywords.includes(keyword);
    if (!selected && full) return;
    onChange({
      ...draft,
      keywords: selected
        ? draft.keywords.filter((k) => k !== keyword)
        : [...draft.keywords, keyword],
    });
  };

  const addKeyword = (keyword: Keyword) => {
    const exists = chipLabels.includes(keyword);
    const keywords =
      draft.keywords.includes(keyword) || full ? draft.keywords : [...draft.keywords, keyword];
    onChange({
      ...draft,
      customKeywords: exists ? draft.customKeywords : [...draft.customKeywords, keyword],
      keywords,
    });
  };

  const openMemo = () => {
    setMemoOpen(true);
    requestAnimationFrame(() => memoInputRef.current?.focus());
  };

  const closeMemo = () => {
    onChange({ ...draft, memo: "" });
    setMemoOpen(false);
    requestAnimationFrame(() => memoToggleRef.current?.focus());
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {/* 질문 1 */}
      <div className={styles.block}>
        <div className={styles.qHead}>
          <p className={styles.qLabel} aria-hidden="true">
            질문 1
          </p>
          <h2 id={keywordTitleId} className={styles.qTitle}>
            오늘은 무엇을 하며 보냈나요?
          </h2>
          <p className={styles.helper}>해당하는 것을 골라주세요. 최대 5개, 3개 정도를 추천해요.</p>
          <p className={styles.counter} aria-live="polite">
            <strong>{count}</strong> / {KEYWORD_MAX}
            <span className="visually-hidden">개 선택됨</span>
          </p>
        </div>

        <div className={styles.chips} role="group" aria-labelledby={keywordTitleId}>
          {chipLabels.map((label) => {
            const selected = draft.keywords.includes(label);
            return (
              <KeywordChip
                key={label}
                label={label}
                selected={selected}
                disabled={full && !selected}
                onToggle={toggleKeyword}
              />
            );
          })}
          <AddKeywordChip onAdd={addKeyword} />
        </div>
        <p className={styles.hint}>많이 쓰는 키워드를 먼저 보여드려요.</p>
      </div>

      <hr className={styles.divider} />

      {/* 질문 2 */}
      <div className={styles.block}>
        <p className={styles.qLabel} aria-hidden="true">
          질문 2
        </p>
        <h2 id={moodTitleId} className={styles.qTitle}>
          오늘은 어떤 하루였나요?
        </h2>
        <div className={styles.moods}>
          <MoodSelector
            value={draft.mood}
            labelledBy={moodTitleId}
            onChange={(mood) => onChange({ ...draft, mood })}
          />
        </div>
        <p className={`${styles.hint} ${styles.moodHint}`}>
          고른 기분에 따라 꽃잎의 명도가 달라져요.
        </p>
      </div>

      {/* 사진 (선택): 질문 다음에. 사진 없이 남기면 기록에 사진 영역이 나오지 않는다 */}
      <div className={styles.photo} role="group" aria-labelledby={photoTitleId}>
        <div className={styles.memoHead}>
          <h2 id={photoTitleId} className={styles.memoTitle}>
            오늘을 담은 사진이 있나요?
          </h2>
          <span className={styles.optional}>선택</span>
        </div>
        {draft.photo ? (
          <div className={styles.photoPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 사용자가 고른 사진(data URL) */}
            <img src={draft.photo} alt="고른 사진 미리보기" className={styles.photoImage} />
            <div className={styles.photoActions}>
              <TextAction onClick={() => photoInputRef.current?.click()}>사진 바꾸기</TextAction>
              <TextAction onClick={removePhoto}>사진 빼기</TextAction>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.photoPick}
            onClick={() => photoInputRef.current?.click()}
            aria-busy={photoBusy || undefined}
          >
            <ImageIcon size={26} />
            <span>{photoBusy ? "사진을 준비하고 있어요…" : "사진 추가하기"}</span>
          </button>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void pickPhoto(event.target.files?.[0])}
        />
        {photoError ? (
          <p className={styles.photoError} role="alert">
            {photoError}
          </p>
        ) : null}
      </div>

      {/* 한 줄 메모 (선택) */}
      {memoOpen ? (
        <div className={styles.memo}>
          <div className={styles.memoHead}>
            <h2 className={styles.memoTitle}>한 줄로 남기고 싶은 순간이 있나요?</h2>
            <span className={styles.optional}>선택</span>
          </div>
          <label htmlFor={memoInputId} className={styles.memoLabel}>
            한 줄 메모
          </label>
          <input
            ref={memoInputRef}
            id={memoInputId}
            className={styles.memoInput}
            value={draft.memo}
            maxLength={MEMO_MAX_LENGTH}
            placeholder="오늘을 한 문장으로 남긴다면? 비워둬도 괜찮아요."
            aria-describedby={`${memoInputId}-count`}
            onChange={(event) => onChange({ ...draft, memo: event.target.value })}
          />
          <div className={styles.memoFoot}>
            <TextAction onClick={closeMemo} className={styles.memoClose}>
              메모 지우고 닫기
            </TextAction>
            <span id={`${memoInputId}-count`} className={styles.memoCount}>
              {draft.memo.length} / {MEMO_MAX_LENGTH}
            </span>
          </div>
        </div>
      ) : null}

      <div className={styles.submit}>
        <p className={styles.status} aria-live="polite">
          {ready ? readyText : "오늘 한 일과 하루 느낌을 고르면 꽃잎을 남길 수 있어요."}
        </p>
        <div className={styles.actions}>
          <Button
            type="submit"
            variant="olive"
            className={styles.saveButton}
            aria-disabled={!ready || saving || photoBusy}
            aria-busy={saving || undefined}
          >
            {submitLabel}
          </Button>
          {memoOpen ? null : (
            <TextAction ref={memoToggleRef} onClick={openMemo} className={styles.memoOpen}>
              + 한 줄 메모도 남기기
            </TextAction>
          )}
        </div>
      </div>
    </form>
  );
}
