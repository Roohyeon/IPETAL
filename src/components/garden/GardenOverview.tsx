"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TapIcon } from "@/components/common/Icons";
import { Petal } from "@/components/petal/Petal";
import { gardenMonthRoute } from "@/data/routes";
import { monthKeyOf } from "@/lib/date";
import { mergeRecords, useSavedRecords } from "@/lib/recordRepository";
import { hasWebGL, useClientValue } from "@/lib/useClientValue";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useOverscrollPull } from "@/lib/useOverscrollPull";
import type { DailyRecord } from "@/types/record";
import { CurrentMonthJump } from "./CurrentMonthJump";
import { useTimeOfDayStyle } from "./timeOfDay";
import { GardenLotus } from "./GardenLotus";
import { GardenPads } from "./GardenPads";
import { LilyPad } from "./LilyPad";
import layout from "./layout.module.css";
import styles from "./GardenOverview.module.css";

/** 모바일 배경 그림 */
const POND_BACKDROP = "/images/garden-stylized-pond.webp";
/** 배경이 스크롤을 따라 움직이는 정도 (스크롤 1px당), 최대 이동(px), 끝에서 당길 때 따라오는 비율 */
const BACKDROP_PARALLAX = 0.06;
const BACKDROP_PARALLAX_MAX = 70;
const BACKDROP_PULL = 0.5;

/** 반딧불: 정원 위를 둥둥 떠다니는 작은 빛 (화면 기준 위치 %, 크기 px, 주기·지연 초) */
const FIREFLIES = [
  { x: 10, y: 22, size: 7, duration: 8, delay: 0 },
  { x: 86, y: 16, size: 6, duration: 9.5, delay: 1.4 },
  { x: 72, y: 38, size: 8, duration: 10, delay: 0.6 },
  { x: 18, y: 50, size: 6, duration: 8.5, delay: 2.6 },
  { x: 92, y: 58, size: 7, duration: 9, delay: 3.2 },
  { x: 40, y: 68, size: 5, duration: 7, delay: 1.9 },
  { x: 8, y: 80, size: 7, duration: 10.5, delay: 0.9 },
  { x: 64, y: 84, size: 6, duration: 8, delay: 2.2 },
  { x: 52, y: 30, size: 5, duration: 7.5, delay: 4 },
  { x: 30, y: 8, size: 6, duration: 9, delay: 1.1 },
  { x: 78, y: 72, size: 7, duration: 8.5, delay: 3.6 },
  { x: 24, y: 92, size: 6, duration: 9.5, delay: 2.9 },
  { x: 88, y: 94, size: 5, duration: 7.5, delay: 0.4 },
];

/** 연잎 위 꽃잎의 기울기 (달마다 조금씩 다르게) */
const PETAL_TILT = [-12, 48, 8, -40, -18, 62, 4, -34, 22, -46, 10, 58];

type GardenOverviewProps = {
  records: DailyRecord[];
  today: string;
};

/** 나의 정원: 올해 1~12월. 꽃잎이 모인 달에는 연꽃이 피고, 누르면 그 달의 달력이 열린다. */
export function GardenOverview({ records: baseRecords, today }: GardenOverviewProps) {
  // 데모 기록 + 이 브라우저에서 남긴 기록
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(baseRecords, saved), [baseRecords, saved]);
  const year = today.slice(0, 4);
  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const petals = records.filter((record) => monthKeyOf(record.date) === key).length;
    return { key, month: index + 1, petals };
  });
  const currentKey = monthKeyOf(today);
  const currentRef = useRef<HTMLLIElement>(null);
  const reduce = useReducedMotion();
  // 모바일 배경: 지금 시각에 따라 아침·낮·저녁·밤 분위기
  const timeOfDay = useTimeOfDayStyle();
  // 모바일: 연잎·꽃잎을 3D로 (준비되기 전·WebGL이 없으면 2D 그림 그대로)
  const gridRef = useRef<HTMLDivElement>(null);
  const mobile = useMediaQuery("(max-width: 767px)");
  const webgl = useClientValue(hasWebGL, false);
  // WebGL이 없다고 확인된 기기만 2D 연잎을 보여준다 (서버·첫 렌더에서는 숨긴 채로)
  const noWebgl = useClientValue(() => !hasWebGL(), false);
  const [padsReady, setPadsReady] = useState(false);
  const use3d = mobile && webgl;

  // 3D가 끝내 준비되지 않아도(느린 기기·로딩 실패) 월 이름은 보이게
  useEffect(() => {
    if (!use3d) return;
    const fallback = window.setTimeout(() => setPadsReady(true), 5000);
    return () => window.clearTimeout(fallback);
  }, [use3d]);
  // 모바일: 페이지 끝에서 더 끌면 연잎들이 살짝 당겨진다
  const pull = useOverscrollPull(null, mobile && !reduce);

  // 배경도 살짝: 스크롤하면 조금 느리게 위로 따라오고, 끝에서 당기면 함께 당겨진다
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop || !mobile || reduce) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const parallax = Math.min(window.scrollY * BACKDROP_PARALLAX, BACKDROP_PARALLAX_MAX);
      backdrop.style.setProperty(
        "--bg-shift",
        `${(-parallax + pull.get() * BACKDROP_PULL).toFixed(2)}px`,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    const unsubscribe = pull.on("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      backdrop.style.removeProperty("--bg-shift");
    };
  }, [mobile, reduce, pull]);

  return (
    <main className={layout.main} style={timeOfDay}>
      {/* 모바일 배경: 연못 그림 (화면에 고정, 스크롤·당김에 살짝 따라 움직인다) */}
      <div ref={backdropRef} className={styles.backdrop} aria-hidden="true">
        <Image
          src={POND_BACKDROP}
          alt=""
          fill
          sizes="100vw"
          priority
          className={styles.backdropImage}
        />
        {/* 흰빛을 고르게 섞어 밝은 파스텔 톤으로 */}
        <div className={styles.whiteWash} />
        {/* 시간대 분위기: 물들이는 겹 + 빛을 더하는 겹 */}
        <div className={styles.todMultiply} />
        <div className={styles.todScreen} />
        <div className={styles.sunlight} />
        <div className={styles.fireflies}>
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
      </div>

      <section aria-labelledby="garden-title" className={styles.board}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>My Garden</p>
          <h1 id="garden-title" className={styles.title}>
            나의 정원
          </h1>
          <p className={styles.summary}>기록이 모여 연꽃을 이루는 정원이에요</p>
        </div>

        <motion.div
          ref={gridRef}
          style={{ y: pull }}
          className={[
            styles.gridWrap,
            use3d && padsReady ? styles.pads3dReady : "",
            noWebgl ? styles.no3d : "",
          ].join(" ")}
        >
          {use3d ? <GardenPads gridRef={gridRef} onReady={() => setPadsReady(true)} /> : null}
          <ul className={styles.grid}>
            {months.map(({ key, month, petals }) => {
              const bloomed = petals > 0;
              const current = key === currentKey;
              const visual = (
                <>
                  <span
                    className={styles.pond}
                    aria-hidden="true"
                    data-pond=""
                    data-petal-tilt={bloomed ? undefined : PETAL_TILT[month - 1]}
                    data-current={current ? "" : undefined}
                  >
                    <LilyPad className={styles.pad} />
                    {bloomed ? (
                      <GardenLotus
                        className={styles.lotus}
                        bloomIn={mobile}
                        bobIndex={mobile ? month - 1 : undefined}
                      />
                    ) : (
                      <span
                        className={styles.petal}
                        style={{ rotate: `${PETAL_TILT[month - 1]}deg` }}
                      >
                        <Petal mood="best" width={34} />
                      </span>
                    )}
                  </span>
                  <span className={styles.label}>{month}월</span>
                </>
              );

              return (
                <li key={key} ref={current ? currentRef : undefined}>
                  {bloomed ? (
                    <Link
                      href={gardenMonthRoute(key)}
                      className={`${styles.month} ${styles.bloomed}`}
                      aria-label={`${month}월의 꽃, 꽃잎 ${petals}장. 달력 열기`}
                    >
                      {visual}
                    </Link>
                  ) : (
                    <div className={styles.month}>
                      {visual}
                      <span className="visually-hidden">: 아직 피어난 꽃이 없어요</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>

        <p className={styles.hint}>
          <TapIcon size={20} />
          꽃을 누르면 그 달의 달력이 열려요.
        </p>
      </section>

      {mobile ? (
        <CurrentMonthJump targetRef={currentRef} month={Number(currentKey.slice(5))} />
      ) : null}
    </main>
  );
}
