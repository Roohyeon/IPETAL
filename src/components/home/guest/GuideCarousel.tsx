"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, TransitionEvent } from "react";
import { ArrowRightIcon } from "@/components/common/Icons";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./DailyGuideSection.module.css";

/** 자동으로 다음 단계로 넘어가는 간격 */
const AUTO_INTERVAL_MS = 4500;
/** 슬라이드 사이 간격 (CSS .steps gap과 같게) */
const SLIDE_GAP_PX = 64;
/** 이만큼 끌면 다음/이전으로 넘어간다 */
const SWIPE_THRESHOLD_PX = 60;

type GuideSlide = { key: string; label: string; content: ReactNode };

/**
 * 이용 안내 1~4단계.
 * PC: 한 단계씩 자동으로 넘어가는 무한 슬라이드
 *   - 4단계에서 다음으로 넘기면 같은 방향으로 1단계가 이어서 나온다 (앞뒤에 복제 슬라이드)
 *   - 양 끝 화살표·끌어서 넘기기·점 버튼으로 이동, 마우스를 올리거나 포커스하면 잠시 멈춤
 * 태블릿·모바일: 기존 세로 타임라인 그대로
 */
export function GuideCarousel({ slides }: { slides: GuideSlide[] }) {
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const count = slides.length;
  // 트랙 위치: 0 = 마지막 복제, 1..count = 실제 1~4단계, count+1 = 첫 번째 복제
  const [pos, setPos] = useState(1);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const index = (((pos - 1) % count) + count) % count;
  const moving = pos === 0 || pos === count + 1;

  const next = () => setPos((p) => (p >= count + 1 ? p : p + 1));
  const prev = () => setPos((p) => (p <= 0 ? p : p - 1));
  const goTo = (i: number) => setPos(i + 1);

  // 복제 슬라이드에 도착하면 애니메이션 없이 같은 모습의 실제 슬라이드로 옮긴다
  const onTransitionEnd = (event: TransitionEvent<HTMLOListElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    if (pos === count + 1) {
      setInstant(true);
      setPos(1);
    } else if (pos === 0) {
      setInstant(true);
      setPos(count);
    }
  };

  // 순간 이동이 그려진 다음 프레임에 애니메이션을 다시 켠다
  useEffect(() => {
    if (!instant) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    return () => cancelAnimationFrame(frame);
  }, [instant]);

  // 움직임 줄이기: 애니메이션이 없으니 복제 슬라이드에서 바로 실제 슬라이드로
  useEffect(() => {
    if (!reduce || !moving) return;
    const timer = setTimeout(() => setPos(pos === 0 ? count : 1), 0);
    return () => clearTimeout(timer);
  }, [reduce, moving, pos, count]);

  // 화면에 보일 때만 자동으로 넘긴다
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isDesktop || reduce || paused || !inView || dragging || moving) return;
    const timer = setTimeout(() => setPos((p) => p + 1), AUTO_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isDesktop, reduce, paused, inView, dragging, moving, pos]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop || event.button > 0) return;
    dragStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (!dragging) {
      // 세로로 움직이면 페이지 스크롤로 둔다
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - start.y)) return;
      event.currentTarget.setPointerCapture(start.id);
      setDragging(true);
    }
    setDrag(dx);
  };
  const endDrag = () => {
    if (dragging) {
      if (drag <= -SWIPE_THRESHOLD_PX) next();
      else if (drag >= SWIPE_THRESHOLD_PX) prev();
    }
    dragStart.current = null;
    setDragging(false);
    setDrag(0);
  };

  // PC에서만 앞뒤 복제 슬라이드를 둔다 (태블릿·모바일 타임라인에는 없음)
  const track = isDesktop
    ? [
        { slide: slides[count - 1], real: count - 1, clone: "head" },
        ...slides.map((slide, real) => ({ slide, real, clone: "" })),
        { slide: slides[0], real: 0, clone: "tail" },
      ]
    : slides.map((slide, real) => ({ slide, real, clone: "" }));

  return (
    <div
      ref={rootRef}
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="이용 안내 4단계"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <button
        type="button"
        className={`${styles.carouselArrow} ${styles.carouselPrev}`}
        onClick={prev}
      >
        <ArrowRightIcon size={28} strokeWidth={1.8} />
        <span className="visually-hidden">이전 단계</span>
      </button>

      <div
        className={styles.viewport}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <ol
          className={styles.steps}
          data-instant={instant || undefined}
          style={
            isDesktop
              ? {
                  transform: `translateX(calc(${-pos} * (100% + ${SLIDE_GAP_PX}px) + ${drag}px))`,
                }
              : undefined
          }
          onTransitionEnd={onTransitionEnd}
        >
          {track.map(({ slide, real, clone }, i) => {
            const active = isDesktop && !clone && i === pos;
            const hidden = isDesktop && !active;
            return (
              <li
                key={`${slide.key}${clone}`}
                className={styles.step}
                data-side="text-left"
                aria-roledescription={isDesktop && !clone ? "slide" : undefined}
                aria-label={
                  isDesktop && !clone ? `${real + 1} / ${count} ${slide.label}` : undefined
                }
                aria-hidden={hidden || undefined}
                inert={hidden}
              >
                {slide.content}
              </li>
            );
          })}
        </ol>
      </div>

      <button
        type="button"
        className={`${styles.carouselArrow} ${styles.carouselNext}`}
        onClick={next}
      >
        <ArrowRightIcon size={28} strokeWidth={1.8} />
        <span className="visually-hidden">다음 단계</span>
      </button>

      <div className={styles.carouselDots}>
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            className={styles.carouselDot}
            aria-current={i === index ? "step" : undefined}
            onClick={() => goTo(i)}
          >
            <span className="visually-hidden">{`${i + 1}단계 보기: ${slide.label}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
