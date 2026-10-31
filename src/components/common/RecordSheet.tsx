"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { formatLongDate } from "@/lib/date";
import { CloseIcon } from "./Icons";
import styles from "./RecordSheet.module.css";

/** 로그인 후 화면 어디서든 오늘 기록 시트를 여는 함수 */
export const RecordSheetContext = createContext<(() => void) | null>(null);

export function useOpenRecordSheet() {
  return useContext(RecordSheetContext);
}

type RecordSheetProps = {
  open: boolean;
  onClose: () => void;
  today: string;
  children: ReactNode;
};

/** 오늘 기록 시트: 아래에서 위로 서서히 올라오고, 닫을 때는 내려가며 사라진다 */
export function RecordSheet({ open, onClose, today, children }: RecordSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const finish = () => {
    setClosing(false);
    ref.current?.close();
    onClose();
  };

  const requestClose = () => {
    if (closing) return;
    // 움직임 줄이기 설정이면 바로 닫는다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else setClosing(true);
  };

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="record-sheet-title"
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) finish();
      }}
    >
      {open ? (
        <div className={styles.body}>
          <span className={styles.grabber} aria-hidden="true" />
          <header className={styles.head}>
            <div>
              <p className={styles.date}>{formatLongDate(today)}</p>
              <h2 id="record-sheet-title" className={styles.title}>
                오늘의 꽃잎 남기기
              </h2>
            </div>
            <button type="button" className={styles.close} onClick={requestClose}>
              <CloseIcon size={22} />
              <span className="visually-hidden">닫기</span>
            </button>
          </header>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
