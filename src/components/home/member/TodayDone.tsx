"use client";

import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, type ReactNode } from "react";
import { ButtonLink, TextAction } from "@/components/common/Button";
import { ChevronRightIcon, LeafIcon, TapIcon } from "@/components/common/Icons";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { KEYWORD_MAX } from "@/data/keywords";
import { MOOD_OPTIONS, moodLabel } from "@/data/moods";
import { getRecommendations } from "@/data/recommendations";
import { ROUTES } from "@/data/routes";
import { isSameMonth, monthOf, streakDays } from "@/lib/date";
import { keywordTotal } from "@/lib/recordStats";
import type { DailyRecord } from "@/types/record";
import styles from "./TodayDone.module.css";

const PetalFallScene = dynamic(() => import("@/components/three/PetalFallScene"), { ssr: false });

type TodayDoneProps = {
  record: DailyRecord;
  records: DailyRecord[];
  /** 방금 저장했으면 꽃잎 받기 연출 재생 */
  play: boolean;
  onEdit: () => void;
};

/** 연속 기록 링이 가득 차는 기준 (일주일) */
const STREAK_GOAL = 7;

type Stat = {
  key: string;
  label: string;
  icon: ReactNode;
  value?: string;
  /** 0~1, 링이 채워진 정도 */
  progress: number;
  /** 강조 링 (오늘의 하루 느낌) */
  active?: boolean;
  srText: string;
};

/** 링 버튼 테두리: 위쪽 가운데에서 시계 방향으로 progress 만큼 */
function StatRing({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <svg className={styles.ring} viewBox="0 0 104 64" preserveAspectRatio="none" aria-hidden="true">
      {p > 0 ? (
        <rect
          className={styles.ringFill}
          x="1.5"
          y="1.5"
          width="101"
          height="61"
          rx="30.5"
          pathLength={100}
          strokeDasharray={`${p * 100} 100`}
        />
      ) : null}
    </svg>
  );
}

/**
 * B-2 기록 완료 (Opal 홈 구조)
 * 히어로(받침대 위 꽃잎) → 점수(이번 달 꽃잎) → 괄호 → 지표 링 3개
 * → 카드(라벨·큰 값·기준, 구분선, 막대 목록) → 떠 있는 실행 버튼
 */
export function TodayDone({ record, records, play, onEdit }: TodayDoneProps) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const month = monthOf(record.date);
  const monthRecords = records.filter(
    (r) => isSameMonth(r.date, record.date) && r.date <= record.date,
  );
  const order = monthRecords.length;
  const streak = streakDays(
    records.map((r) => r.date),
    record.date,
  );
  const moodLevel = MOOD_OPTIONS.length - MOOD_OPTIONS.findIndex((o) => o.value === record.mood);
  const recommendations = getRecommendations(record.mood, record.keywords);
  const keywordRows = record.keywords.map((keyword) => {
    const days = monthRecords.filter((r) => r.keywords.includes(keyword)).length;
    return { keyword, days, ratio: order > 0 ? days / order : 0 };
  });

  const stats: Stat[] = [
    {
      key: "streak",
      label: "연속 기록",
      icon: <LeafIcon size={20} />,
      value: String(streak),
      progress: streak / STREAK_GOAL,
      srText: `연속 기록 ${streak}일`,
    },
    {
      key: "keywords",
      label: "키워드",
      icon: <TapIcon size={20} />,
      value: String(record.keywords.length),
      progress: record.keywords.length / KEYWORD_MAX,
      srText: `고른 키워드 ${record.keywords.length}개`,
    },
    {
      key: "mood",
      label: "하루 느낌",
      icon: <MoodIcon mood={record.mood} size={30} />,
      progress: moodLevel / MOOD_OPTIONS.length,
      active: true,
      srText: `하루 느낌 ${moodLabel(record.mood)}`,
    },
  ];

  // 저장 직후: 화면(시트 안이면 시트)을 맨 위로 올리고, 결과로 포커스 이동 (스크린리더에 결과 전달)
  useEffect(() => {
    if (!play) return;
    const heading = headingRef.current;
    const sheet = heading?.closest("dialog");
    if (sheet) sheet.scrollTo({ top: 0, behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
    heading?.focus({ preventScroll: true });
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
      {/* ── 히어로: 배경 장면 + 받침대 위 꽃잎 + 점수 + 지표 ── */}
      <div className={styles.hero}>
        <motion.div className={styles.stage} {...reveal(0)}>
          {/* 꽃잎이 떨어지는 공간 */}
          <span className={styles.burst} aria-hidden="true" />
          {/* 받침 자리: 연잎. 3D 꽃잎이 헤더에서부터 떨어져 연잎 바로 위에 떠 있는다 */}
          <span className={styles.stand} aria-hidden="true" />
          <div className={styles.scene} aria-hidden="true">
            <PetalFallScene mood={record.mood} animate={!reduce} />
          </div>
        </motion.div>

        <div className={styles.rock}>
          <motion.div className={styles.score} {...reveal(1.3)}>
            <h2 ref={headingRef} tabIndex={-1} className={styles.scoreLabel}>
              <span className={styles.srOnly}>꽃잎을 얻었어요. </span>
              {month}월의 꽃잎
            </h2>
            <p className={styles.scoreValue}>
              <span className={styles.scoreNumber}>{order}</span>
              <span className={styles.scoreUp} aria-hidden="true">
                ▲
              </span>
              <span className={styles.srOnly}>장, 오늘 한 장 늘었어요</span>
            </p>
          </motion.div>

          <motion.div className={styles.breakdown} {...reveal(1.45)}>
            <svg
              className={styles.bracket}
              viewBox="0 0 300 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M150 0v38M4 38v-8q0-10 10-10h272q10 0 10 10v8" />
            </svg>
            <ul className={styles.stats} aria-label="오늘 기록 요약">
              {stats.map((stat) => (
                <li key={stat.key} className={styles.stat}>
                  <span className={`${styles.pill} ${stat.active ? styles.pillActive : ""}`}>
                    <StatRing progress={stat.active ? 1 : stat.progress} />
                    <span className={styles.pillIcon}>{stat.icon}</span>
                    {stat.value ? <span className={styles.pillValue}>{stat.value}</span> : null}
                    <span className={styles.srOnly}>{stat.srText}</span>
                  </span>
                  <span className={styles.statLabel} aria-hidden="true">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* ── 카드: 키워드 기록 (Opal의 Screen time) ── */}
      <motion.div
        role="region"
        className={styles.card}
        aria-labelledby="keyword-card-title"
        {...reveal(1.7)}
      >
        <h2 id="keyword-card-title" className={styles.cardLabel}>
          키워드 기록
        </h2>
        <p className={styles.cardValue}>{keywordTotal(monthRecords)}개</p>
        <p className={styles.cardSub}>{month}월</p>
        <hr className={styles.divider} />
        <ul className={styles.rows}>
          {keywordRows.map((row) => (
            <li key={row.keyword} className={styles.row}>
              <span className={styles.badge} aria-hidden="true">
                {row.keyword.slice(0, 1)}
              </span>
              <div className={styles.rowMain}>
                <p className={styles.rowName}>{row.keyword}</p>
                <span className={styles.bar} aria-hidden="true">
                  <span
                    className={styles.barFill}
                    style={{ width: `${Math.max(row.ratio, 0.06) * 100}%` }}
                  />
                </span>
              </div>
              <span className={styles.rowValue}>{row.days}일</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── 카드: 오늘의 마음 채우기 (같은 카드 구조) ── */}
      <motion.div
        role="region"
        className={styles.card}
        aria-labelledby="fill-title"
        {...reveal(1.8)}
      >
        <p className={styles.cardLabel}>오늘의 마음 채우기</p>
        <h2 id="fill-title" className={styles.cardTitle}>
          {recommendations.title}
        </h2>
        <p className={styles.cardSub}>
          {moodLabel(record.mood)}
          {record.memo ? ` · “${record.memo}”` : ""}
        </p>
        <hr className={styles.divider} />
        <ul className={styles.rows}>
          {recommendations.items.map((item) => (
            <li key={item.title} className={styles.row}>
              <span className={`${styles.badge} ${styles.badgeTag}`} aria-hidden="true">
                {item.tag.slice(0, 2)}
              </span>
              <div className={styles.rowMain}>
                <h3 className={styles.rowName}>
                  <span className={styles.srOnly}>{item.tag} · </span>
                  {item.title}
                </h3>
                <p className={styles.rowBody}>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.editRow}>
          <TextAction onClick={onEdit} className={styles.edit}>
            오늘 기록 수정하기
          </TextAction>
        </div>
      </motion.div>

      {/* ── 떠 있는 실행 버튼 (Opal의 Start to focus) ── */}
      <div className={styles.ctaWrap}>
        <ButtonLink href={ROUTES.garden} className={styles.cta}>
          <span className={styles.ctaPlay} aria-hidden="true">
            ▶
          </span>
          나의 정원 보러 가기
          <ChevronRightIcon size={20} />
        </ButtonLink>
      </div>
    </div>
  );
}
