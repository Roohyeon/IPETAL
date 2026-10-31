"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ButtonLink, TextAction } from "@/components/common/Button";
import { PetalReceive } from "@/components/petal/PetalReceive";
import { moodLabel } from "@/data/moods";
import { getRecommendations } from "@/data/recommendations";
import { ROUTES } from "@/data/routes";
import { isSameMonth, monthOf } from "@/lib/date";
import { koreanOrdinal } from "@/lib/text";
import type { DailyRecord } from "@/types/record";
import styles from "./TodayDone.module.css";

type TodayDoneProps = {
  record: DailyRecord;
  records: DailyRecord[];
  /** 방금 저장했으면 꽃잎 받기 연출 재생 */
  play: boolean;
  onEdit: () => void;
};

/** B-2 첫 기록 완료: 꽃잎 결과 + 오늘의 마음 채우기 */
export function TodayDone({ record, records, play, onEdit }: TodayDoneProps) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const month = monthOf(record.date);
  const order = records.filter(
    (r) => isSameMonth(r.date, record.date) && r.date <= record.date,
  ).length;
  const recommendations = getRecommendations(record.mood, record.keywords);
  const summary = ["고른 내용", ...record.keywords, moodLabel(record.mood)].join(" · ");

  // 저장 직후 결과로 포커스 이동 (스크린리더에 결과 전달)
  useEffect(() => {
    if (play) headingRef.current?.focus();
  }, [play]);

  const reveal = (delay: number) =>
    animate
      ? {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {};

  return (
    <div className={styles.done}>
      <motion.div className={styles.result} {...reveal(0)}>
        <PetalReceive mood={record.mood} play={animate} className={styles.burst} />
        <motion.h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle} {...reveal(1.3)}>
          꽃잎을 얻었어요!
        </motion.h2>
        <motion.div className={styles.resultMeta} {...reveal(1.45)}>
          <p className={styles.mood}>
            하루 느낌 · <strong>{moodLabel(record.mood)}</strong>
          </p>
          <ul className={styles.keywords} aria-label="고른 키워드">
            {record.keywords.map((keyword) => (
              <li key={keyword}>{keyword}</li>
            ))}
          </ul>
          {record.memo ? <p className={styles.memo}>“{record.memo}”</p> : null}
          <p className={styles.note}>
            {month}월의 꽃 {koreanOrdinal(order)} 꽃잎이 되었어요.
          </p>
        </motion.div>
      </motion.div>

      <motion.div className={styles.fill} {...reveal(1.7)}>
        <div className={styles.fillHead}>
          <p className={styles.fillLabel}>오늘의 마음 채우기</p>
          <h2 className={styles.fillTitle}>{recommendations.title}</h2>
          <p className={styles.fillMeta}>{summary}</p>
        </div>
        <ul className={styles.recos}>
          {recommendations.items.map((item) => (
            <li key={item.title} className={styles.reco}>
              <span className={styles.recoTag}>{item.tag}</span>
              <h3 className={styles.recoTitle}>{item.title}</h3>
              <p className={styles.recoBody}>{item.description}</p>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <ButtonLink href={ROUTES.garden} className={styles.gardenButton}>
            나의 정원 보러 가기
          </ButtonLink>
          <TextAction onClick={onEdit} className={styles.edit}>
            오늘 기록 수정하기
          </TextAction>
        </div>
      </motion.div>
    </div>
  );
}
