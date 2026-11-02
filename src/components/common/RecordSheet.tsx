"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { formatLongDate } from "@/lib/date";
import { CloseIcon } from "./Icons";
import styles from "./RecordSheet.module.css";

/** 로그인 후 화면 어디서든 오늘 기록 시트를 여는 함수 */
export const RecordSheetContext = createContext<(() => void) | null>(null);

export function useOpenRecordSheet() {
  return useContext(RecordSheetContext);
}

/** 시트 제목 id (dialog의 aria-labelledby) */
export const RECORD_SHEET_TITLE_ID = "record-sheet-title";

/** 이 속성이 붙은 곳(손잡이·헤더)을 잡고 아래로 끌면 시트가 내려가며 닫힌다 */
export const SHEET_HANDLE_ATTR = "data-sheet-handle";

/** 이만큼(px) 끌어내리거나, 빠르게(px/ms) 튕겨 내리면 닫는다 */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;

/** 시트 안에서 닫기 버튼에 쓰는 오늘 날짜와 닫기 함수 */
const SheetHeadContext = createContext<{ today: string; close: () => void } | null>(null);

/** 작성 폼·저장 중일 때의 시트 머리 (기록을 남긴 뒤에는 DayRecordContent 헤더가 대신한다) */
export function RecordSheetHead() {
  const sheet = useContext(SheetHeadContext);
  if (!sheet) return null;
  return (
    <header className={styles.head} data-sheet-handle="">
      <div>
        <p className={styles.date}>{formatLongDate(sheet.today)}</p>
        <h2 id={RECORD_SHEET_TITLE_ID} className={styles.title}>
          오늘의 꽃잎 남기기
        </h2>
      </div>
      <button type="button" className={styles.close} onClick={sheet.close}>
        <CloseIcon size={22} />
        <span className="visually-hidden">닫기</span>
      </button>
    </header>
  );
}

type RecordSheetProps = {
  open: boolean;
  onClose: () => void;
  today: string;
  children: ReactNode;
  /** 시트 제목 id (기본: 오늘 기록 시트 제목) */
  labelledBy?: string;
};

/** 오늘 기록 시트: 아래에서 위로 서서히 올라오고, 닫을 때는 내려가며 사라진다 */
export function RecordSheet({
  open,
  onClose,
  today,
  children,
  labelledBy = RECORD_SHEET_TITLE_ID,
}: RecordSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  // 방금 끌었으면 손을 뗄 때 생기는 click으로 닫히지 않게
  const draggedRef = useRef(false);

  /** 끌던 위치(인라인 translate)를 지운다 */
  const resetDrag = () => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.style.translate = "";
    dialog.style.transition = "";
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    // 밖에서 닫으면 (예: 달력에서 기록을 지움) 바로 닫는다
    if (!open && dialog.open) {
      setClosing(false);
      resetDrag();
      dialog.close();
    }
  }, [open]);

  const finish = () => {
    setClosing(false);
    resetDrag();
    ref.current?.close();
    onClose();
  };

  const requestClose = () => {
    if (closing) return;
    // 움직임 줄이기 설정이면 바로 닫는다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else setClosing(true);
  };

  /**
   * 손잡이·헤더를 잡고 아래로 끌기: 손가락을 따라 시트가 내려오고,
   * 충분히 끌었거나 빠르게 내리면 그 자리에서 이어서 내려가며 닫힌다. 아니면 제자리로.
   */
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dialog = ref.current;
    if (!dialog || closing || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as Element;
    if (!target.closest(`[${SHEET_HANDLE_ATTR}]`)) return;
    if (target.closest("a, button, input, textarea, select, label")) return;
    // 마우스로 끌 때 글자가 선택되거나 브라우저 기본 끌기가 시작되지 않게
    if (event.pointerType === "mouse") event.preventDefault();

    const startY = event.clientY;
    let dy = 0;
    let lastY = startY;
    let lastT = event.timeStamp;
    let velocity = 0;
    draggedRef.current = false;
    dialog.style.transition = "none";

    const move = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      // 위로는 따라오지 않는다
      dy = Math.max(0, e.clientY - startY);
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = (e.clientY - lastY) / dt;
      lastY = e.clientY;
      lastT = e.timeStamp;
      if (dy > 3) draggedRef.current = true;
      dialog.style.translate = `0 ${dy}px`;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (e.type !== "pointercancel" && (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY)) {
        requestClose();
        return;
      }
      // 제자리로 (튕기지 않게)
      dialog.style.transition = "translate 0.3s cubic-bezier(0.22, 1, 0.36, 1)";
      dialog.style.translate = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={labelledBy}
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        if (event.target === event.currentTarget) requestClose();
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) finish();
      }}
    >
      {open ? (
        <div className={styles.body} onPointerDown={startDrag}>
          <span className={styles.grabber} aria-hidden="true" data-sheet-handle="" />
          <SheetHeadContext value={{ today, close: requestClose }}>{children}</SheetHeadContext>
        </div>
      ) : null}
    </dialog>
  );
}
