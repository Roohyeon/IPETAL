"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PatternPreviewSection.module.css";

type KeywordBar = { label: string; days: number };

/** 섹션 페이드인이 끝난 뒤 시작 */
const START_DELAY_MS = 650;

/**
 * '자주 남긴 키워드' 그래프.
 * 그래프가 화면에 들어오면 (섹션 페이드인이 끝난 뒤) 0에서 오른쪽으로 차례로 늘어난다.
 */
export function KeywordBars({ items, max }: { items: KeywordBar[]; max: number }) {
  const ref = useRef<HTMLDListElement>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = setTimeout(() => setGrown(true), START_DELAY_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <dl ref={ref} className={styles.bars} data-grown={grown || undefined}>
        {items.map((item) => (
          <div key={item.label} className={styles.barRow}>
            <dt className={styles.barLabel}>{item.label}</dt>
            <dd className={styles.barTrack}>
              <span
                className={styles.barFill}
                style={{ "--bar-w": `${(item.days / max) * 100}%` } as React.CSSProperties}
              />
            </dd>
            <dd className={styles.barValue}>{item.days}일</dd>
          </div>
        ))}
      </dl>
      {/* JS가 없으면 처음부터 다 채워서 보여준다 */}
      <noscript>
        <style>{`.${styles.barFill}{width:var(--bar-w)!important}`}</style>
      </noscript>
    </>
  );
}
