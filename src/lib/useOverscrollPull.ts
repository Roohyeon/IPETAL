"use client";

import { animate, useMotionValue } from "motion/react";
import { useEffect, type RefObject } from "react";

/**
 * 스크롤 끝에서 더 끌면 내용이 고무줄처럼 아주 조금만 따라온다 (슬롯머신처럼 튕기지 않음).
 * - 맨 위에서 아래로 / 맨 아래에서 위로 끌거나 휠을 더 굴릴 때
 * - 놓으면 튀지 않고 부드럽게 제자리로
 * scrollRef가 없으면(null) 창 전체 스크롤을 본다.
 * 당긴 거리(px, 아래 +, 위 -)를 돌려준다 → motion 요소의 style.y에 연결.
 */
export function useOverscrollPull(
  scrollRef: RefObject<HTMLElement | null> | null,
  enabled: boolean,
  max = 14,
) {
  const pull = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;
    const element = scrollRef ? scrollRef.current : null;
    if (scrollRef && !element) return;
    const target: HTMLElement | Window = element ?? window;
    const scrollTop = () => (element ? element.scrollTop : window.scrollY);
    const atTop = () => scrollTop() <= 0;
    const atBottom = () => {
      const height = element ? element.scrollHeight : document.documentElement.scrollHeight;
      const view = element ? element.clientHeight : window.innerHeight;
      return scrollTop() + view >= height - 1;
    };

    let raw = 0;
    let idle = 0;
    let lastY: number | null = null;
    let settle: ReturnType<typeof animate> | null = null;

    // 당길수록 뻑뻑해진다 (±max에 가까워질 뿐 넘지 않음)
    const setRaw = (value: number) => {
      raw = value;
      settle?.stop();
      pull.set(Math.sign(raw) * max * (1 - Math.exp(-Math.abs(raw) / max)));
    };
    const release = () => {
      raw = 0;
      settle = animate(pull, 0, { type: "spring", bounce: 0, duration: 0.4 });
    };

    // 위쪽 끝(raw ≥ 0)에서는 아래로만, 아래쪽 끝(raw ≤ 0)에서는 위로만 늘어난다
    const stretch = (delta: number) => {
      if (raw > 0 || (raw === 0 && delta > 0 && atTop())) setRaw(Math.max(0, raw + delta));
      else if (raw < 0 || (raw === 0 && delta < 0 && atBottom())) setRaw(Math.min(0, raw + delta));
      else return false;
      return true;
    };

    const onWheel = (event: Event) => {
      if (!stretch(-(event as WheelEvent).deltaY * 0.4)) return;
      window.clearTimeout(idle);
      idle = window.setTimeout(release, 140);
    };
    const onTouchStart = (event: Event) => {
      lastY = (event as TouchEvent).touches[0].clientY;
    };
    const onTouchMove = (event: Event) => {
      if (lastY === null) return;
      const y = (event as TouchEvent).touches[0].clientY;
      stretch((y - lastY) * 0.5);
      lastY = y;
    };
    const onTouchEnd = () => {
      lastY = null;
      if (raw !== 0) release();
    };

    target.addEventListener("wheel", onWheel, { passive: true });
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: true });
    target.addEventListener("touchend", onTouchEnd);
    target.addEventListener("touchcancel", onTouchEnd);
    return () => {
      target.removeEventListener("wheel", onWheel);
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
      target.removeEventListener("touchcancel", onTouchEnd);
      window.clearTimeout(idle);
      settle?.stop();
      pull.set(0);
    };
  }, [scrollRef, enabled, max, pull]);

  return pull;
}
