"use client";

import { useState } from "react";
import { RecordSheet } from "@/components/common/RecordSheet";
import {
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
  /** 열 기록 (null이면 닫힘) */
  record: DailyRecord | null;
  /** 그 달의 몇 번째 꽃잎인지 */
  order: number;
  onClose: () => void;
  onDelete: (date: string) => void;
};

/** 그날의 기록을 그 자리(시트 안)에서 고친다. 저장하면 기록 보기로 돌아간다 */
function DayRecordEdit({ record, onDone }: { record: DailyRecord; onDone: () => void }) {
  const [draft, setDraft] = useState(() => recordToDraft(record));
  const [saving, setSaving] = useState(false);
  const ready = isDraftReady(draft);

  const save = async () => {
    const input = draftToRecordInput(draft);
    if (!ready || saving || !input) return;
    setSaving(true);
    // TODO: 실제 수정 API 연결 (데모 기록도 이 브라우저에 고친 내용으로 저장된다)
    await saveRecord(input, record.date, record.recordedAt);
    setSaving(false);
    onDone();
  };

  return (
    <>
      <header className={`${styles.head} ${styles.editHead}`} data-sheet-handle="">
        <div>
          <h2 id="day-record-title" className={styles.title}>
            {formatLongDate(record.date)}
          </h2>
          <p className={styles.meta}>이 날의 기록을 고쳐요</p>
        </div>
      </header>
      <TodayRecordForm
        draft={draft}
        onChange={setDraft}
        ready={ready}
        saving={saving}
        onSave={() => void save()}
        submitLabel="수정한 꽃잎 저장하기"
        readyText="준비됐어요. 고친 내용을 저장해 보세요."
      />
    </>
  );
}

/** 그날의 기록: 하단 탭 + 기록 시트와 같은 시트로 아래에서 올라온다. 수정하기는 이 시트 안에서 바로 */
export function DayRecordDialog({ record, order, onClose, onDelete }: DayRecordDialogProps) {
  // 수정 중인 날짜 (다른 날을 열면 자동으로 보기 화면)
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const editing = record !== null && editingDate === record.date;

  return (
    <RecordSheet
      open={record !== null}
      onClose={() => {
        setEditingDate(null);
        onClose();
      }}
      today={record?.date ?? ""}
      labelledBy="day-record-title"
    >
      {record && editing ? (
        <DayRecordEdit key={record.date} record={record} onDone={() => setEditingDate(null)} />
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
