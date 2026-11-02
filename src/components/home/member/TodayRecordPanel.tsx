"use client";

import type { Ref } from "react";
import { RECORD_SHEET_TITLE_ID, RecordSheetHead } from "@/components/common/RecordSheet";
import { DayRecordContent } from "@/components/garden/DayRecordContent";
import { isSameMonth } from "@/lib/date";
import { deleteRecord } from "@/lib/recordRepository";
import { TodayDone } from "./TodayDone";
import { TodayRecordForm } from "./TodayRecordForm";
import { TodaySaving } from "./TodaySaving";
import type { TodayRecordState } from "./useTodayRecord";
import styles from "./MemberHome.module.css";

type TodayRecordPanelProps = {
  state: TodayRecordState;
  /** 작성 폼 영역 (HOME에서 폼으로 스크롤할 때 사용) */
  formRef?: Ref<HTMLDivElement>;
  /** 기록 시트(하단 탭 +) 안에서 보여줄 때: 기록 완료 화면은 달력 날짜 모달과 같은 내용 */
  inSheet?: boolean;
};

/** 오늘 기록: 아직이면 질문 폼, 저장 중이면 로딩 장면, 남겼으면 꽃잎 결과 + 마음 채우기 */
export function TodayRecordPanel({ state, formRef, inSheet = false }: TodayRecordPanelProps) {
  const { mode, todayRecord } = state;

  // 시트 안: 작성 폼·저장 중에는 '오늘의 꽃잎 남기기' 머리를 붙인다
  const sheetHead = inSheet ? <RecordSheetHead /> : null;

  if (state.saving) {
    return (
      <>
        {sheetHead}
        <TodaySaving />
      </>
    );
  }

  if (mode === "form" || !todayRecord) {
    return (
      <div ref={formRef} className={styles.formWrap}>
        {sheetHead}
        <TodayRecordForm
          draft={state.draft}
          onChange={state.setDraft}
          ready={state.ready}
          saving={state.saving}
          onSave={state.save}
        />
      </div>
    );
  }

  if (inSheet) {
    const order = state.records.filter(
      (r) => isSameMonth(r.date, todayRecord.date) && r.date <= todayRecord.date,
    ).length;
    return (
      <DayRecordContent
        record={todayRecord}
        order={order}
        titleId={RECORD_SHEET_TITLE_ID}
        edit={{ onClick: state.edit }}
        // TODO: 실제 삭제 API 연결
        onDelete={(date) => void deleteRecord(date)}
        play={state.justSaved}
      />
    );
  }

  return (
    <TodayDone
      record={todayRecord}
      records={state.records}
      play={state.justSaved}
      onEdit={state.edit}
    />
  );
}
