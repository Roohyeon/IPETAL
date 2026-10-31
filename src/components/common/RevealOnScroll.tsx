"use client";

import { useEffect } from "react";

/**
 * 스크롤해서 화면에 들어오는 섹션을 페이드인한다.
 * 처음부터 화면 안에 있는 섹션은 그대로 두어 깜빡임이 없고,
 * JS가 없거나 움직임 줄이기를 쓰면 숨기지 않는다 (globals.css의 [data-reveal]).
 */
export function RevealOnScroll({ selector }: { selector: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight * 0.92,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    targets.forEach((el) => {
      el.dataset.reveal = "hidden";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [selector]);

  return null;
}
