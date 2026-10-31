"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  animate as animateValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/common/Button";
import { ArrowDownIcon } from "@/components/common/Icons";
import { ROUTES } from "@/data/routes";
import { hasWebGL, useClientValue } from "@/lib/useClientValue";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./Hero.module.css";

// WebGL은 서버에 없으므로 클라이언트에서만 불러온다
const LotusScene = dynamic(() => import("@/components/three/LotusScene"), { ssr: false });

/** 태블릿·모바일 자동 재생 길이 (초) */
const AUTO_DURATION = 6.4;
/** 3D 모델이 늦게 오면 이미지로 먼저 재생 시작 (ms) */
const AUTO_START_TIMEOUT = 2500;
/** 대체 이미지 없이 3D를 기다릴 때는 더 오래 기다린다 (ms) */
const AUTO_START_TIMEOUT_NO_FALLBACK = 8000;
/** IPETAL이 연꽃 위에 떠 있을 때의 위치 (px) */
const WORD_SHIFT = { desktop: -134, tablet: -132, mobile: -136 };
/** IPETAL이 떠오르기 시작하는 연꽃 속 위치 (머무는 위치 기준, px) */
const WORD_RISE = { desktop: 250, tablet: 240, mobile: 170 };

/**
 * section#top — 디자인시안 1-1 → 1-2 → 1-3 → 1-4 → 1 순서의 연출.
 * 봉오리가 3D로 피어나고(lotus_real.glb) → 위쪽에 IPETAL 등장 → 연꽃이 사라지며 IPETAL이 가운데로 → 문구 등장
 * - 데스크톱: 스크롤에 맞춰 진행
 * - 태블릿·모바일: 같은 흐름이 자동으로 재생
 * - 3D 로딩 전·WebGL 미지원: 같은 자리에서 봉오리/연꽃 이미지로 대체
 *   (WebGL 미지원일 때만 이미지, 그 외에는 3D가 준비되면 바로 나타난다)
 * - 움직임 줄이기: 연출 없이 최종 화면
 * 배경은 모든 화면에서 물결처럼 일렁인다.
 */
export function Hero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<SVGSVGElement>(null);
  const wordShiftRef = useRef(WORD_SHIFT.desktop);
  const wordRiseRef = useRef(WORD_RISE.desktop);

  const hydrated = useClientValue(() => true, false);
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const webgl = useClientValue(hasWebGL, false);
  const animate = hydrated && !reduce;
  const use3D = animate && webgl;
  // 3D를 쓸 수 있으면 봉오리/연꽃 이미지 없이 3D만 보인다
  const noFallback = use3D;

  const [load3D, setLoad3D] = useState(false);
  const [threeReady, setThreeReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [flowerVisible, setFlowerVisible] = useState(true);

  // 진행도 p: 데스크톱은 스크롤, 태블릿·모바일은 시간
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const p = useMotionValue(0);

  useEffect(() => {
    const size = isDesktop ? "desktop" : isMobile ? "mobile" : "tablet";
    wordShiftRef.current = WORD_SHIFT[size];
    wordRiseRef.current = WORD_RISE[size];
  }, [isDesktop, isMobile]);

  useEffect(() => {
    if (!animate) return;
    if (isDesktop) {
      p.set(scrollYProgress.get());
      return scrollYProgress.on("change", (value) => p.set(value));
    }
    // 태블릿·모바일: 3D가 준비되면(또는 늦으면 이미지로) 자동 재생
    let controls: ReturnType<typeof animateValue> | undefined;
    const start = () => {
      if (controls) return;
      controls = animateValue(p, 1, { duration: AUTO_DURATION, ease: "linear" });
    };
    if (!use3D || threeReady) start();
    const timer = setTimeout(
      start,
      noFallback ? AUTO_START_TIMEOUT_NO_FALLBACK : AUTO_START_TIMEOUT,
    );
    return () => {
      clearTimeout(timer);
      controls?.stop();
    };
  }, [animate, isDesktop, use3D, noFallback, threeReady, p, scrollYProgress]);

  // 3D는 첫 화면이 다 그려지고 브라우저가 한가할 때 불러온다 (그동안은 이미지로 진행)
  useEffect(() => {
    if (!use3D) return;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // 대체 이미지 없이 3D를 기다리므로 바로 불러온다 (아래 show3D)
    if (noFallback) return;
    const schedule = () => {
      timer = setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(() => setLoad3D(true), { timeout: 1500 });
        } else {
          setLoad3D(true);
        }
      }, 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (timer) clearTimeout(timer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, [use3D, noFallback]);

  const show3D = use3D && (load3D || noFallback);

  // 연꽃이 사라진 뒤에는 3D 렌더링을 멈춘다
  useMotionValueEvent(p, "change", (value) => setFlowerVisible(value < 0.72));

  const bloom = useTransform(p, [0.08, 0.34], [0, 1]);
  const budOpacity = useTransform(p, [0, 0.14, 0.26], [1, 1, 0]);
  const budScale = useTransform(p, [0, 0.26], [1, 1.12]);
  const lotusOpacity = useTransform(p, [0.12, 0.26, 0.56, 0.7], [0, 1, 1, 0]);
  const lotusScale = useTransform(p, [0.12, 0.3, 0.42, 0.56, 0.7], [0.82, 1, 1.02, 1.02, 0.94]);
  const sceneOpacity = useTransform(p, [0.56, 0.7], [1, 0]);
  // 활짝 피면 scale(1.07)
  const sceneScale = useTransform(p, [0, 0.34, 0.56, 0.7], [1, 1.07, 1.07, 1]);
  // 활짝 핀 연꽃 뒤로 비치는 햇살
  const sunGlow = useTransform(p, [0.22, 0.36, 0.56, 0.7], [0, 1, 1, 0]);
  // 개화 후 IPETAL이 연꽃 속에서 위로 떠오른다 → 연꽃 위에 머문 뒤 → 가운데로 (이후 그대로)
  const wordOpacity = useTransform(p, [0.36, 0.43], [0, 1]);
  const wordY = useTransform(p, (v) => {
    const shift = wordShiftRef.current;
    const rise = wordRiseRef.current;
    if (v <= 0.36) return shift + rise;
    if (v <= 0.48) {
      const k = (v - 0.36) / 0.12;
      return shift + rise * Math.pow(1 - k, 3);
    }
    if (v <= 0.56) return shift;
    if (v <= 0.72) return shift * (1 - (v - 0.56) / 0.16);
    return 0;
  });
  const wordScale = useTransform(p, [0.36, 0.48], [0.88, 1]);
  // 문구: 태그라인·제목 → (화살표·버튼) → 본문이 마지막
  const titleOpacity = useTransform(p, [0.74, 0.84], [0, 1]);
  const titleY = useTransform(p, [0.74, 0.84], [18, 0]);
  const ctaOpacity = useTransform(p, [0.8, 0.88], [0, 1]);
  const ctaY = useTransform(p, [0.8, 0.88], [18, 0]);
  const bodyOpacity = useTransform(p, [0.88, 0.98], [0, 1]);
  const bodyY = useTransform(p, [0.88, 0.98], [16, 0]);

  // 화면 밖이면 물결·3D 모두 멈춘다
  useEffect(() => {
    const stage = stageRef.current;
    const svg = rippleRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) svg?.unpauseAnimations();
      else svg?.pauseAnimations();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className={styles.hero}
      data-flower-interactive={(threeReady && flowerVisible) || undefined}
    >
      <svg ref={rippleRef} className={styles.rippleDefs} aria-hidden="true" focusable="false">
        <filter id="hero-ripple" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.02" numOctaves="2" seed="7">
            <animate
              attributeName="baseFrequency"
              dur="7s"
              values="0.007 0.02; 0.0095 0.028; 0.006 0.023; 0.007 0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            scale="24"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.bgWrap}>
            <Image
              src="/images/hero-bg.jpg"
              alt=""
              fill
              preload
              sizes="100vw"
              className={styles.bg}
            />
          </div>

          {/* 3D 준비 전·WebGL 미지원 시 같은 자리의 정적 이미지 */}
          <div
            className={`${styles.fallback} ${threeReady ? styles.fallbackHidden : ""} ${
              hydrated && !use3D ? styles.fallbackOn : ""
            }`}
          >
            <motion.div
              className={`${styles.flower} ${styles.bud}`}
              style={animate ? { opacity: budOpacity, scale: budScale } : undefined}
              aria-hidden="true"
            >
              <Image src="/images/hero-bud.png" alt="" width={239} height={338} />
            </motion.div>
            <motion.div
              className={`${styles.flower} ${styles.lotus}`}
              style={animate ? { opacity: lotusOpacity, scale: lotusScale } : undefined}
              aria-hidden="true"
            >
              <Image src="/images/hero-lotus.png" alt="" width={488} height={368} />
            </motion.div>
          </div>

          {/* 3D 연꽃 (영역 크기를 미리 고정해 레이아웃이 밀리지 않게) */}
          {show3D ? (
            <div className={`${styles.scene} ${threeReady ? styles.sceneReady : ""}`}>
              <motion.div
                className={styles.sunGlow}
                style={{ opacity: sunGlow }}
                aria-hidden="true"
              />
              <motion.div
                className={styles.sceneInner}
                style={{ opacity: sceneOpacity, scale: sceneScale }}
              >
                <LotusScene
                  bloom={bloom}
                  interactive={threeReady && flowerVisible}
                  active={inView && flowerVisible}
                  compact={isMobile}
                  onReady={() => setThreeReady(true)}
                />
              </motion.div>
            </div>
          ) : null}

          <div className={styles.content}>
            <motion.p
              className={styles.wordmark}
              style={animate ? { opacity: wordOpacity, y: wordY, scale: wordScale } : undefined}
            >
              IPETAL
            </motion.p>
            <div className={styles.copy}>
              <motion.p
                className={styles.tagline}
                style={animate ? { opacity: titleOpacity, y: titleY } : undefined}
              >
                하루 1분 라이프로그
              </motion.p>
              <motion.h1
                id="hero-title"
                className={styles.title}
                style={animate ? { opacity: titleOpacity, y: titleY } : undefined}
              >
                긴 일기 대신,
                <br />
                오늘의 꽃잎 한 장
              </motion.h1>
              <motion.p
                className={styles.body}
                style={animate ? { opacity: bodyOpacity, y: bodyY } : undefined}
              >
                오늘 한 일과 기분만 고르면 하루가 꽃잎이 돼요. 꽃잎이 모여 한 달의 꽃이 피고, 꽃이
                모인 정원이 나의 생활을 알려줘요.
              </motion.p>
            </div>
          </div>

          <motion.a
            href="#about"
            className={styles.scrollCue}
            style={animate ? { opacity: ctaOpacity } : undefined}
          >
            <ArrowDownIcon size={30} strokeWidth={2.4} />
            <span className="visually-hidden">소개로 이동</span>
          </motion.a>

          {/* 모바일: 바로 시작하기 (TODO: 시작하기 경로 연결) */}
          <motion.div
            className={styles.mobileCta}
            style={animate ? { opacity: ctaOpacity, y: ctaY } : undefined}
          >
            <div className={styles.float}>
              <ButtonLink href={ROUTES.signup} variant="glass" size="lg" block>
                시작하기
              </ButtonLink>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
