"use client";

import { useState, type ReactNode } from "react";
import { QuickRecord } from "@/components/home/member/QuickRecord";
import { RecordSheet, RecordSheetContext } from "./RecordSheet";

type RecordSheetProviderProps = {
  children: ReactNode;
  /** YYYY-MM-DD */
  today: string;
  /** 시트 안의 내용 (기본: 이 화면 전용 오늘 기록 폼) */
  content?: ReactNode;
};

/** 하단 탭 +(와 화면 안의 '오늘의 꽃잎 남기기')가 아래에서 올라오는 오늘 기록 시트를 열 수 있게 한다 */
export function RecordSheetProvider({ children, today, content }: RecordSheetProviderProps) {
  const [open, setOpen] = useState(false);
  const openSheet = () => setOpen(true);

  return (
    <RecordSheetContext value={openSheet}>
      {children}
      <RecordSheet open={open} onClose={() => setOpen(false)} today={today}>
        {content ?? <QuickRecord today={today} />}
      </RecordSheet>
    </RecordSheetContext>
  );
}
