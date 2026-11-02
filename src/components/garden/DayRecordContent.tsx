"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/common/Button";
import { ImageIcon, PencilIcon, TrashIcon } from "@/components/common/Icons";
import doneStyles from "@/components/home/member/TodayDone.module.css";
import { getRecommendations } from "@/data/recommendations";
import { formatLongDate, formatTime, monthOf } from "@/lib/date";
import { useOverscrollPull } from "@/lib/useOverscrollPull";
import type { DailyRecord } from "@/types/record";
import styles from "./DayRecordDialog.module.css";

type DayRecordContentProps = {
  record: DailyRecord;
  /** 그 달의 몇 번째 꽃잎인지 */
  order: number;
  /** 감싸는 dialog의 aria-labelledby와 맞출 제목 id */
  titleId: string;
  /** 수정하기: 이동할 주소 또는 누르면 할 일 */
  edit: { href: string } | { onClick: () => void };
  onDelete: (date: string) => void;
  /** 방금 저장했으면 제목으로 포커스 이동 */
  play?: boolean;
};

/** 마음 채우기 카드 항목: 시트가 올라온 뒤 시간차를 두고 하나씩 나타난다 */
const recoList: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: 0.25, staggerChildren: 0.12 } },
};

const recoItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * 그날의 기록 모달 내용 (달력 날짜 모달 · 하단 탭 + 기록 시트 공통)
 * 헤더(날짜 · 기록 시각 · 몇 번째 꽃잎) → [사진 · 메모 · 마음 채우기 카드 · 수정하기 / 삭제]
 * 헤더는 고정되고, [ ]만 스크롤된다
 */
export function DayRecordContent({
  record,
  order,
  titleId,
  edit,
  onDelete,
  play = false,
}: DayRecordContentProps) {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pull = useOverscrollPull(scrollRef, !reduce);
  const recommendations = getRecommendations(record.mood, record.keywords);

  // 저장 직후: 스크롤을 맨 위로 올리고 제목으로 포커스 (스크린리더에 결과 전달)
  useEffect(() => {
    if (!play) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, [play]);

  const remove = () => {
    if (window.confirm("이 날의 꽃잎을 지울까요? 지운 꽃잎은 되돌릴 수 없어요.")) {
      onDelete(record.date);
    }
  };

  return (
    <>
      {/* 시트 손잡이: 잡고 아래로 끌면 닫힌다 (RecordSheet) */}
      <header className={styles.head} data-sheet-handle="">
        <div>
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.title}>
            {formatLongDate(record.date)}
          </h2>
          <p className={styles.meta}>
            {record.recordedAt ? `${formatTime(record.recordedAt)}에 기록 · ` : ""}
            {monthOf(record.date)}월의 꽃 {order}번째 꽃잎
          </p>
        </div>
      </header>

      <div ref={scrollRef} className={styles.scroll} data-day-record-scroll="">
        <motion.div style={{ y: pull }}>
          {/* TODO: 사진 기록이 생기면 실제 사진으로 교체 */}
          <div className={styles.photo}>
            <ImageIcon size={30} />
            <span>사진 영역</span>
          </div>

          {record.memo ? <p className={styles.memo}>“{record.memo}”</p> : null}

          <div className={styles.card}>
            {/* 움직임 줄이기 설정이면 처음부터 다 보인다 */}
            <motion.ul
              className={doneStyles.recos}
              aria-label={recommendations.title}
              variants={recoList}
              initial={reduce ? "shown" : "hidden"}
              animate="shown"
            >
              {recommendations.items.map((item) => (
                <motion.li key={item.title} variants={recoItem} className={doneStyles.reco}>
                  <span className={doneStyles.recoTag}>{item.tag}</span>
                  <h3 className={doneStyles.recoTitle}>{item.title}</h3>
                  <p className={doneStyles.recoBody}>{item.description}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div className={styles.actions}>
            {"href" in edit ? (
              <ButtonLink href={edit.href} variant="outline" className={styles.edit}>
                <PencilIcon size={20} />
                수정하기
              </ButtonLink>
            ) : (
              <Button variant="outline" className={styles.edit} onClick={edit.onClick}>
                <PencilIcon size={20} />
                수정하기
              </Button>
            )}
            <button type="button" className={styles.delete} onClick={remove}>
              <TrashIcon size={20} />
              삭제
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
