"use client";

import { useState } from "react";
import { RecordSheet } from "@/components/common/RecordSheet";
import {
  EMPTY_DRAFT,
  draftToRecordInput,
  isDraftReady,
  recordToDraft,
} from "@/components/home/member/recordDraft";
import { TodayRecordForm } from "@/components/home/member/TodayRecordForm";
import { formatLongDate } from "@/lib/date";
import { saveRecord } from "@/lib/recordRepository";
import type { DailyRecord } from "@/types/record";
import { DayRecordContent } from "./DayRecordContent";
import styles from "./DayRecordDialog.module.css";

type DayRecordDialogProps = {
  /** 연 날짜 (null이면 닫힘) */
  date: string | null;
  /** 그날의 기록 (없으면 새로 남기는 질문지) */
  record: DailyRecord | null;
  /** 그 달의 몇 번째 꽃잎인지 */
  order: number;
  onClose: () => void;
  onDelete: (date: string) => void;
  /** 남기거나 고쳐 저장했을 때 */
  onSaved?: (date: string) => void;
};

/**
 * 그날의 기록 질문지 (시트 안).
 * 기록이 있으면 고치고, 없으면(기록 못 한 지난날) 새로 남긴다. 저장하면 기록 보기로 넘어간다
 */
function DayRecordEdit({
  date,
  record,
  onDone,
}: {
  date: string;
  record: DailyRecord | null;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(() => (record ? recordToDraft(record) : EMPTY_DRAFT));
  const [saving, setSaving] = useState(false);
  const ready = isDraftReady(draft);

  const save = async () => {
    const input = draftToRecordInput(draft);
    if (!ready || saving || !input) return;
    setSaving(true);
    // TODO: 실제 저장·수정 API 연결 (데모 기록도 이 브라우저에 고친 내용으로 저장된다)
    await saveRecord(input, date, record?.recordedAt);
    setSaving(false);
    onDone();
  };

  return (
    <>
      <header className={`${styles.head} ${styles.editHead}`} data-sheet-handle="">
        <div>
          <h2 id="day-record-title" className={styles.title}>
            {formatLongDate(date)}
          </h2>
          <p className={styles.meta}>
            {record ? "이 날의 기록을 고쳐요" : "기록하지 못한 날이에요. 지금 남겨 볼까요?"}
          </p>
        </div>
      </header>
      <TodayRecordForm
        draft={draft}
        onChange={setDraft}
        ready={ready}
        saving={saving}
        onSave={() => void save()}
        submitLabel={record ? "수정한 꽃잎 저장하기" : "이 날의 꽃잎 남기기"}
        readyText={
          record
            ? "준비됐어요. 고친 내용을 저장해 보세요."
            : "준비됐어요. 이 날의 꽃잎을 남겨보세요."
        }
      />
    </>
  );
}

/**
 * 그날의 기록: 하단 탭 + 기록 시트와 같은 시트로 아래에서 올라온다.
 * 기록이 있으면 보기(수정하기는 이 시트 안에서 바로), 없으면 바로 질문지
 */
export function DayRecordDialog({
  date,
  record,
  order,
  onClose,
  onDelete,
  onSaved,
}: DayRecordDialogProps) {
  // 기록이 있는 날을 고치는 중인지 (다른 날을 열면 자동으로 보기 화면)
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const showForm = date !== null && (record === null || editingDate === date);

  return (
    <RecordSheet
      open={date !== null}
      onClose={() => {
        setEditingDate(null);
        onClose();
      }}
      today={date ?? ""}
      labelledBy="day-record-title"
    >
      {date && showForm ? (
        <DayRecordEdit
          key={`${date}-${record ? "edit" : "new"}`}
          date={date}
          record={record}
          onDone={() => {
            setEditingDate(null);
            onSaved?.(date);
          }}
        />
      ) : record ? (
        <DayRecordContent
          record={record}
          order={order}
          titleId="day-record-title"
          edit={{ onClick: () => setEditingDate(record.date) }}
          onDelete={onDelete}
        />
      ) : null}
    </RecordSheet>
  );
}
