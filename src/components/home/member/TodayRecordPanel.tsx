"use client";

import type { Ref } from "react";
import { TodayDone } from "./TodayDone";
import { TodayRecordForm } from "./TodayRecordForm";
import { TodaySaving } from "./TodaySaving";
import type { TodayRecordState } from "./useTodayRecord";
import styles from "./MemberHome.module.css";

type TodayRecordPanelProps = {
  state: TodayRecordState;
  /** 작성 폼 영역 (HOME에서 폼으로 스크롤할 때 사용) */
  formRef?: Ref<HTMLDivElement>;
  /** 기록 시트(하단 탭 +) 안에서 보여줄 때: 기록 완료 화면은 카드만 */
  inSheet?: boolean;
};

/** 오늘 기록: 아직이면 질문 폼, 저장 중이면 로딩 장면, 남겼으면 꽃잎 결과 + 마음 채우기 */
export function TodayRecordPanel({ state, formRef, inSheet = false }: TodayRecordPanelProps) {
  const { mode, todayRecord } = state;

  if (state.saving) return <TodaySaving />;

  if (mode === "form" || !todayRecord) {
    return (
      <div ref={formRef} className={styles.formWrap}>
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

  return (
    <TodayDone
      record={todayRecord}
      records={state.records}
      play={state.justSaved}
      onEdit={state.edit}
      cardsOnly={inSheet}
    />
  );
}
