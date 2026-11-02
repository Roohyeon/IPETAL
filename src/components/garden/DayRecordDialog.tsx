"use client";

import { RecordSheet } from "@/components/common/RecordSheet";
import { ROUTES } from "@/data/routes";
import type { DailyRecord } from "@/types/record";
import { DayRecordContent } from "./DayRecordContent";

type DayRecordDialogProps = {
  /** 열 기록 (null이면 닫힘) */
  record: DailyRecord | null;
  /** 그 달의 몇 번째 꽃잎인지 */
  order: number;
  onClose: () => void;
  onDelete: (date: string) => void;
};

/** 그날의 기록: 하단 탭 + 기록 시트와 같은 시트로 아래에서 올라온다 */
export function DayRecordDialog({ record, order, onClose, onDelete }: DayRecordDialogProps) {
  return (
    <RecordSheet
      open={record !== null}
      onClose={onClose}
      today={record?.date ?? ""}
      labelledBy="day-record-title"
    >
      {record ? (
        <DayRecordContent
          record={record}
          order={order}
          titleId="day-record-title"
          // TODO: 지난 기록 수정 화면이 생기면 연결 (지금은 오늘 기록 카드로)
          edit={{ href: ROUTES.todayRecord }}
          onDelete={onDelete}
        />
      ) : null}
    </RecordSheet>
  );
}
