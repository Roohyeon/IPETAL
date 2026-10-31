"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/common/Button";
import { CloseIcon, ImageIcon, PencilIcon, TrashIcon } from "@/components/common/Icons";
import { KeywordTag } from "@/components/petal/KeywordChip";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { moodLabel } from "@/data/moods";
import { getRecommendations } from "@/data/recommendations";
import { ROUTES } from "@/data/routes";
import { formatLongDate, formatTime, monthOf } from "@/lib/date";
import type { DailyRecord } from "@/types/record";
import styles from "./DayRecordDialog.module.css";

type DayRecordDialogProps = {
  /** 열 기록 (null이면 닫힘) */
  record: DailyRecord | null;
  /** 그 달의 몇 번째 꽃잎인지 */
  order: number;
  onClose: () => void;
  onDelete: (date: string) => void;
};

/** 그날의 기록. 데스크톱·태블릿은 가운데 창, 모바일은 아래에서 올라오는 시트 */
export function DayRecordDialog({ record, order, onClose, onDelete }: DayRecordDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (record && !dialog.open) dialog.showModal();
    if (!record && dialog.open) dialog.close();
  }, [record]);

  const remove = () => {
    if (record && window.confirm("이 날의 꽃잎을 지울까요? 지운 꽃잎은 되돌릴 수 없어요.")) {
      onDelete(record.date);
    }
  };

  const recommendations = record ? getRecommendations(record.mood, record.keywords) : null;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="day-record-title"
      onClose={onClose}
      // 바깥(어두운 배경)을 누르면 닫는다
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {record && recommendations ? (
        <div className={styles.body}>
          <span className={styles.grabber} aria-hidden="true" />
          <header className={styles.head}>
            <div>
              <h2 id="day-record-title" className={styles.title}>
                {formatLongDate(record.date)}
              </h2>
              <p className={styles.meta}>
                {record.recordedAt ? `${formatTime(record.recordedAt)}에 기록 · ` : ""}
                {monthOf(record.date)}월의 꽃 {order}번째 꽃잎
              </p>
            </div>
            <button type="button" className={styles.close} onClick={onClose}>
              <CloseIcon size={22} />
              <span className="visually-hidden">닫기</span>
            </button>
          </header>

          {/* TODO: 사진 기록이 생기면 실제 사진으로 교체 */}
          <div className={styles.photo}>
            <ImageIcon size={30} />
            <span>사진 영역</span>
          </div>

          <h3 className={styles.label}>하루 느낌</h3>
          <p className={styles.mood}>
            <MoodIcon mood={record.mood} size={44} />
            {moodLabel(record.mood)}
          </p>

          <h3 className={styles.label}>오늘 하루의 키워드</h3>
          <ul className={styles.keywords}>
            {record.keywords.map((keyword) => (
              <li key={keyword}>
                <KeywordTag label={keyword} className={styles.keyword} />
              </li>
            ))}
          </ul>

          {record.memo ? <p className={styles.memo}>“{record.memo}”</p> : null}

          <section className={styles.fill} aria-labelledby="day-fill-title">
            <p className={styles.fillLabel}>그날의 마음 채우기</p>
            <h3 id="day-fill-title" className={styles.fillTitle}>
              {recommendations.title}
            </h3>
            <p className={styles.fillMeta}>
              {["고른 내용", ...record.keywords, moodLabel(record.mood)].join(" · ")}
            </p>
            <ul className={styles.recos}>
              {recommendations.items.map((item) => (
                <li key={item.title} className={styles.reco}>
                  <span className={styles.recoTag}>{item.tag}</span>
                  <h4 className={styles.recoTitle}>{item.title}</h4>
                  <p className={styles.recoBody}>{item.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className={styles.actions}>
            {/* TODO: 지난 기록 수정 화면이 생기면 연결 (지금은 오늘 기록 카드로) */}
            <ButtonLink href={ROUTES.todayRecord} variant="outline" className={styles.edit}>
              <PencilIcon size={20} />
              수정하기
            </ButtonLink>
            <button type="button" className={styles.delete} onClick={remove}>
              <TrashIcon size={20} />
              삭제
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
