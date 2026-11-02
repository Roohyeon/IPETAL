"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type RefObject } from "react";
import { ArrowDownIcon } from "@/components/common/Icons";
import styles from "./GardenOverview.module.css";

type Direction = "up" | "down";

/**
 * 이번 달 연잎이 화면 밖으로 나가면 오른쪽 아래에 화살표가 떠서, 누르면 이번 달로 이동한다.
 * 이번 달이 위에 있으면 ↑, 아래에 있으면 ↓.
 */
export function CurrentMonthJump({
  targetRef,
  month,
}: {
  targetRef: RefObject<HTMLElement | null>;
  month: number;
}) {
  const [direction, setDirection] = useState<Direction | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDirection(null);
        else setDirection(entry.boundingClientRect.top < 0 ? "up" : "down");
      },
      // 헤더·하단 탭에 가려진 부분은 안 보이는 것으로 본다
      { rootMargin: "-72px 0px -80px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  const jump = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targetRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {direction ? (
        <motion.button
          key="jump"
          type="button"
          className={styles.jump}
          onClick={jump}
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ArrowDownIcon size={22} className={direction === "up" ? styles.jumpUp : undefined} />
          <span className="visually-hidden">이번 달({month}월)로 이동</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
