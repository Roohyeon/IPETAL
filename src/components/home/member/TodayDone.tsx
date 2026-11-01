"use client";

import {
  AnimatePresence,
  animate as animateValue,
  motion,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink, TextAction } from "@/components/common/Button";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { moodLabel } from "@/data/moods";
import { getRecommendations } from "@/data/recommendations";
import { ROUTES } from "@/data/routes";
import { isSameMonth, monthOf } from "@/lib/date";
import { useClientValue } from "@/lib/useClientValue";
import type { DailyRecord } from "@/types/record";
import styles from "./TodayDone.module.css";

const PetalFallScene = dynamic(() => import("@/components/three/PetalFallScene"), { ssr: false });

type TodayDoneProps = {
  record: DailyRecord;
  records: DailyRecord[];
  /** 방금 저장했으면 꽃잎 받기 연출 재생 */
  play: boolean;
  onEdit: () => void;
  /** 기록 시트(하단 탭 +) 안: 카드(마음 채우기 + 나의 정원 버튼)만 보여준다 */
  cardsOnly?: boolean;
};

/** 반딧불: 꽃잎 둘레를 둥둥 떠다니는 작은 빛 (위치 %, 크기 px, 주기·지연 초) */
const FIREFLIES = [
  { x: 14, y: 30, size: 8, duration: 7.5, delay: 0 },
  { x: 82, y: 22, size: 7, duration: 9, delay: 1.2 },
  { x: 24, y: 62, size: 6, duration: 8, delay: 2.4 },
  { x: 74, y: 56, size: 8, duration: 10, delay: 0.6 },
  { x: 50, y: 14, size: 6, duration: 8.5, delay: 3.1 },
  { x: 90, y: 70, size: 6, duration: 7, delay: 1.8 },
  { x: 8, y: 78, size: 7, duration: 9.5, delay: 2.9 },
  { x: 62, y: 36, size: 5, duration: 6.5, delay: 4 },
];

/**
 * 꽃잎이 절반쯤 떨어지면 → '꽃잎을 얻었어요!'가 반짝 나타났다 사라지고,
 * 토스트가 사라지기 시작할 때 → 이번 달 꽃잎 수가 차례로 나타나 그대로 남는다
 */
const TOAST_SECONDS = 2.4;
/** 토스트 키프레임 시점 (나타남 끝, 사라지기 시작) */
const TOAST_TIMES = [0, 0.18, 0.84, 1];
const SCORE_DELAY = TOAST_SECONDS * TOAST_TIMES[2];

const scoreGroup: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.32 } },
};

const scoreItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** ▲: 숫자가 늘어난 뒤에 */
const scoreUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0, transition: { delay: 1.4, duration: 0.45 } },
};

/**
 * 이번 달 꽃잎 수: 오늘 받기 전 수(from)가 슬롯머신 릴처럼 천천히 위로 굴러 올라가며 to가 된다.
 * instant면 (움직임 줄이기) 처음부터 to
 */
function SlotNumber({
  from,
  to,
  run,
  instant,
}: {
  from: number;
  to: number;
  run: boolean;
  instant: boolean;
}) {
  if (instant) return <span className={styles.scoreNumber}>{to}</span>;
  return (
    <span className={`${styles.scoreNumber} ${styles.slot}`}>
      <motion.span
        className={styles.slotReel}
        initial={{ y: "0%" }}
        animate={
          run ? { y: "-50%", filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] } : { y: "0%" }
        }
        transition={{ delay: 0.75, duration: 1.3, ease: [0.45, 0, 0.2, 1] }}
      >
        <span className={styles.slotItem}>{from}</span>
        <span className={styles.slotItem}>{to}</span>
      </motion.span>
    </span>
  );
}

/**
 * 스크롤에 따라 (시트 안이면 시트, 아니면 창의 스크롤)
 * - 바위 배경: 조금만 내려도 바로 차오른다 (fadeDistance px에서 다 참)
 * - 연못 그림: 화면에 고정된 채(움직이지 않고) 살짝 흐려지기만 한다 (--pond-shift, 최대 4px --pond-blur)
 * - 3D 연잎·꽃잎: 내용보다 느리게 올라간다 (parallax: 0이면 그대로 따라 올라감, 1이면 제자리)
 */
function useScrollEffects(
  rockBgRef: React.RefObject<HTMLElement | null>,
  heroRef: React.RefObject<HTMLElement | null>,
  { fadeDistance = 60, blurDistance = 240, parallax = 0.6 } = {},
) {
  const lift = useMotionValue(0);

  useEffect(() => {
    const rockBg = rockBgRef.current;
    const hero = heroRef.current;
    if (!rockBg || !hero) return;
    const sheet = hero.closest("dialog");
    const scroller: HTMLElement | Window = sheet ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = Math.max(0, sheet ? sheet.scrollTop : window.scrollY);
      rockBg.style.setProperty("--scroll-fade", String(Math.min(1, top / fadeDistance)));
      hero.style.setProperty("--pond-blur", `${Math.min(1, top / blurDistance) * 4}px`);
      // 스크롤한 만큼 그림을 도로 내려 화면에서는 제자리에 있게 한다
      hero.style.setProperty("--pond-shift", `${top}px`);
      // 히어로가 화면에 보이는 동안만 (그 뒤로는 더 내려갈 필요 없음)
      lift.set(Math.min(top, hero.offsetHeight) * parallax);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rockBgRef, heroRef, fadeDistance, blurDistance, parallax, lift]);

  return lift;
}

/**
 * 바위를 잡고 끌면 고무줄처럼 미세하게 늘어난다 (튕기지 않음).
 * - 아래로: 페이지 맨 위에서 손가락으로 아래로 끌거나 휠을 위로 더 굴릴 때 → 아래로 늘어남
 * - 위로: 페이지 맨 아래에서 손가락으로 위로 끌거나 휠을 아래로 더 굴릴 때 → 위로 늘어남
 * - 마우스로 바위를 눌러 끌면 스크롤 위치와 상관없이 끈 방향으로
 * 당긴 거리(px, 아래 +, 위 -)를 돌려준다. 바위만 살짝 따라오고, 배경(rockBg)은 그대로다.
 */
function useLeverPull(rockRef: React.RefObject<HTMLElement | null>, enabled: boolean, max = 20) {
  const pull = useMotionValue(0);

  useEffect(() => {
    const rock = rockRef.current;
    if (!rock || !enabled) return;
    const sheet = rock.closest("dialog");
    const scroller: HTMLElement | Window = sheet ?? window;
    const scrollTop = () => (sheet ? sheet.scrollTop : window.scrollY);
    const atTop = () => scrollTop() <= 0;
    const atBottom = () => {
      const height = sheet ? sheet.scrollHeight : document.documentElement.scrollHeight;
      const view = sheet ? sheet.clientHeight : window.innerHeight;
      return scrollTop() + view >= height - 1;
    };

    let raw = 0;
    let idle = 0;
    let startY: number | null = null;
    let mouseDragging = false;
    let settle: ReturnType<typeof animateValue> | null = null;

    // 당길수록 뻑뻑해진다 (±max에 가까워질 뿐 넘지 않음)
    const setRaw = (value: number) => {
      raw = value;
      settle?.stop();
      pull.set(Math.sign(raw) * max * (1 - Math.exp(-Math.abs(raw) / max)));
    };
    // 놓으면 튕기지 않고 부드럽게 제자리로
    const release = () => {
      raw = 0;
      settle = animateValue(pull, 0, { type: "spring", bounce: 0, duration: 0.45 });
    };

    // 휠: 맨 위에서 위로 / 맨 아래에서 아래로 더 굴리면
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0 && atTop() && raw >= 0) setRaw(raw - event.deltaY * 0.4);
      else if (event.deltaY > 0 && atBottom() && raw <= 0) setRaw(raw - event.deltaY * 0.4);
      else if (raw !== 0) setRaw(0);
      else return;
      window.clearTimeout(idle);
      idle = window.setTimeout(release, 140);
    };

    // 손가락: 바위를 잡고 (맨 위에서 아래로 / 맨 아래에서 위로)
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (startY === null) return;
      const dy = event.touches[0].clientY - startY;
      if ((dy > 0 && atTop()) || (dy < 0 && atBottom())) setRaw(dy * 0.5);
      else if (raw !== 0) setRaw(0);
    };
    const onTouchEnd = () => {
      startY = null;
      if (raw !== 0) release();
    };

    // 마우스: 바위를 눌러 잡고 위아래로 (버튼·링크 위에서는 시작하지 않음)
    const onMouseDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if ((event.target as Element).closest("a, button, input, textarea, select")) return;
      startY = event.clientY;
      mouseDragging = false;
    };
    const onMouseMove = (event: PointerEvent) => {
      if (startY === null || event.pointerType !== "mouse") return;
      const dy = event.clientY - startY;
      if (!mouseDragging && Math.abs(dy) > 4) {
        mouseDragging = true;
        document.body.style.userSelect = "none";
      }
      if (mouseDragging) setRaw(dy * 0.5);
    };
    const onMouseUp = () => {
      if (startY === null) return;
      startY = null;
      if (mouseDragging) {
        mouseDragging = false;
        document.body.style.userSelect = "";
        release();
      }
    };

    scroller.addEventListener("wheel", onWheel as EventListener, { passive: true });
    rock.addEventListener("touchstart", onTouchStart, { passive: true });
    rock.addEventListener("touchmove", onTouchMove, { passive: true });
    rock.addEventListener("touchend", onTouchEnd);
    rock.addEventListener("touchcancel", onTouchEnd);
    rock.addEventListener("pointerdown", onMouseDown);
    window.addEventListener("pointermove", onMouseMove);
    window.addEventListener("pointerup", onMouseUp);
    return () => {
      scroller.removeEventListener("wheel", onWheel as EventListener);
      rock.removeEventListener("touchstart", onTouchStart);
      rock.removeEventListener("touchmove", onTouchMove);
      rock.removeEventListener("touchend", onTouchEnd);
      rock.removeEventListener("touchcancel", onTouchEnd);
      rock.removeEventListener("pointerdown", onMouseDown);
      window.removeEventListener("pointermove", onMouseMove);
      window.removeEventListener("pointerup", onMouseUp);
      window.clearTimeout(idle);
      document.body.style.userSelect = "";
      settle?.stop();
      pull.set(0);
    };
  }, [rockRef, enabled, max, pull]);

  return pull;
}

/** 꽃잎 받기 연출(떨어짐·토스트·카운트업)은 기록한 날마다 한 번만 */
const introKey = (date: string) => `ipetal_done_intro:${date}`;

function introPlayed(date: string): boolean {
  try {
    return window.localStorage.getItem(introKey(date)) === "1";
  } catch {
    return false;
  }
}

function markIntroPlayed(date: string) {
  try {
    window.localStorage.setItem(introKey(date), "1");
  } catch {
    // 저장소를 못 쓰면 다음에 다시 보일 뿐
  }
}

/**
 * B-2 기록 완료
 * 히어로(연못 + 연잎 위로 떨어지는 3D 꽃잎 + 반딧불) → '꽃잎을 얻었어요!' 반짝
 * → 이번 달 꽃잎 수(나왔다 사라짐) → 바위 안의 카드들 → 나의 정원 버튼
 */
export function TodayDone({ record, records, play, onEdit, cardsOnly = false }: TodayDoneProps) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rockBgRef = useRef<HTMLDivElement>(null);
  const rockRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [toastShown, setToastShown] = useState(false);
  // 이미 본 날이면 연출 없이 끝난 상태로 (움직임 줄이기와 같게)
  const played = useClientValue(() => introPlayed(record.date), false);
  const skipIntro = Boolean(reduce) || played;
  const [scoreShown, setScoreShown] = useState(false);

  const month = monthOf(record.date);
  const monthRecords = records.filter(
    (r) => isSameMonth(r.date, record.date) && r.date <= record.date,
  );
  const order = monthRecords.length;
  const recommendations = getRecommendations(record.mood, record.keywords);
  const lift = useScrollEffects(rockBgRef, heroRef);
  const pull = useLeverPull(rockRef, !reduce);

  // 꽃잎이 절반쯤 떨어지면 토스트, 이어서 점수와 오늘 고른 것들이 차례로 나타나 그대로 남는다
  // (움직임 줄이기면 토스트 없이 처음부터)
  const onHalfway = useCallback(() => setToastShown(true), []);

  useEffect(() => {
    if (!toastShown) return;
    const show = window.setTimeout(() => setScoreShown(true), SCORE_DELAY * 1000);
    // 숫자가 다 굴러간 뒤에 '봤음'으로 기록한다 (도중에 기록하면 바로 끝난 상태로 바뀌어 버림).
    // 그 전에 떠나면 다음에 한 번 더 보인다
    const done = window.setTimeout(() => markIntroPlayed(record.date), (SCORE_DELAY + 3) * 1000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(done);
    };
  }, [toastShown, record.date]);

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

  const cards = (
    <div className={styles.cards}>
      {/* ── 카드: 오늘의 마음 채우기 ── */}
      <motion.div
        role="region"
        className={styles.card}
        aria-labelledby="fill-title"
        {...reveal(cardsOnly ? 0.2 : 1.8)}
      >
        <p className={styles.cardLabel}>오늘의 마음 채우기</p>
        <h2 id="fill-title" className={styles.cardTitle}>
          {recommendations.title}
        </h2>
        <ul className={styles.recos}>
          {recommendations.items.map((item) => (
            <li key={item.title} className={styles.reco}>
              <span className={styles.recoTag}>{item.tag}</span>
              <h3 className={styles.recoTitle}>{item.title}</h3>
              <p className={styles.recoBody}>{item.description}</p>
            </li>
          ))}
        </ul>
        <div className={styles.editRow}>
          <TextAction onClick={onEdit} className={styles.edit}>
            오늘 기록 수정하기
          </TextAction>
        </div>
      </motion.div>

      {/* ── 나의 정원 버튼 ('오늘의 꽃잎 남기기' 버튼과 같은 모양) ── */}
      <div className={styles.ctaRow}>
        <ButtonLink href={ROUTES.garden} variant="olive" className={styles.cta}>
          나의 정원 보러 가기
        </ButtonLink>
      </div>
    </div>
  );

  const resultHeading = (
    <h2 ref={headingRef} tabIndex={-1} className={styles.srOnly}>
      꽃잎을 얻었어요. {month}월의 꽃잎 {order}장. 하루 느낌 {moodLabel(record.mood)}
      {record.keywords.length > 0 ? `, 키워드 ${record.keywords.join(", ")}` : ""}
    </h2>
  );

  // 하단 탭 + 로 여는 기록 시트 안: 연못·점수 없이 카드만
  if (cardsOnly) {
    return (
      <div className={styles.done}>
        {resultHeading}
        {cards}
      </div>
    );
  }

  return (
    <div className={styles.done}>
      {resultHeading}
      <div ref={heroRef} className={styles.hero}>
        {/* ── 꽃잎을 얻었어요! (내려앉으면 반짝 나타났다 사라짐) ── */}
        <AnimatePresence>
          {toastShown && !skipIntro ? (
            <motion.p
              key="toast"
              className={styles.toast}
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.92, 1.04, 1, 1],
                filter: ["blur(6px)", "blur(0px)", "blur(0px)", "blur(4px)"],
              }}
              transition={{ duration: TOAST_SECONDS, times: TOAST_TIMES, ease: "easeOut" }}
            >
              <span className={styles.toastSpark} aria-hidden="true">
                ✦
              </span>
              꽃잎을 얻었어요!
              <span className={styles.toastSpark} aria-hidden="true">
                ✦
              </span>
            </motion.p>
          ) : null}
        </AnimatePresence>

        {/* 스크롤하면 내용보다 천천히 조금 올라가고, 바위가 그 위로 올라온다 */}
        <motion.div className={styles.stage} {...reveal(0)}>
          <motion.div className={styles.stageBody} style={{ y: lift }}>
            {/* 꽃잎이 떨어지는 공간 */}
            <span className={styles.burst} aria-hidden="true" />
            {/* 받침 자리: 연잎. 3D 꽃잎이 헤더에서부터 떨어져 연잎 바로 위에 떠 있는다 */}
            <span className={styles.stand} aria-hidden="true" />
            <div className={styles.scene} aria-hidden="true">
              <PetalFallScene animate={!skipIntro} onHalfway={onHalfway} />
            </div>
            {/* 반딧불 */}
            <div className={styles.fireflies} aria-hidden="true">
              {FIREFLIES.map((f, i) => (
                <span
                  key={i}
                  className={styles.firefly}
                  style={
                    {
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      "--size": `${f.size}px`,
                      "--duration": `${f.duration}s`,
                      "--delay": `-${f.delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── 바위: 처음엔 투명, 스크롤하면 그라데이션 배경이 차오른다 ── */}
        <motion.div ref={rockRef} className={styles.rock} style={{ y: pull }}>
          <div ref={rockBgRef} className={styles.rockBg} aria-hidden="true" />

          {/* 점수 + 오늘 고른 하루 느낌·키워드: 차례로 나타나 그대로 남는다 */}
          <div className={styles.scoreWrap} aria-hidden="true">
            <motion.div
              className={styles.score}
              variants={scoreGroup}
              initial={skipIntro ? "shown" : "hidden"}
              animate={scoreShown || skipIntro ? "shown" : "hidden"}
            >
              <motion.p variants={scoreItem} className={styles.scoreLabel}>
                {month}월의 꽃잎
              </motion.p>
              <motion.p variants={scoreItem} className={styles.scoreValue}>
                <SlotNumber
                  from={Math.max(0, order - 1)}
                  to={order}
                  run={scoreShown}
                  instant={skipIntro}
                />
                <motion.span variants={scoreUp} className={styles.scoreUp}>
                  ▲
                </motion.span>
              </motion.p>
              <motion.ul variants={scoreItem} className={styles.picked}>
                <li className={`${styles.pickedChip} ${styles.pickedMood}`}>
                  <MoodIcon mood={record.mood} size={20} />
                  {moodLabel(record.mood)}
                </li>
                {record.keywords.map((keyword) => (
                  <li key={keyword} className={styles.pickedChip}>
                    {keyword}
                  </li>
                ))}
              </motion.ul>
            </motion.div>
          </div>

          {cards}
        </motion.div>
      </div>
    </div>
  );
}
