"use client";

import { useEffect, useRef } from "react";
import { Petal } from "@/components/petal/Petal";
import styles from "./TodaySaving.module.css";

/** '오늘의 꽃잎 남기기'를 누른 뒤 결과로 넘어가기 전 잠깐 보여주는 로딩 장면 */
export function TodaySaving() {
  const ref = useRef<HTMLDivElement>(null);

  // 누르자마자 화면(시트 안이면 시트)을 맨 위로
  useEffect(() => {
    const sheet = ref.current?.closest("dialog");
    if (sheet) sheet.scrollTo({ top: 0, behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div ref={ref} className={styles.saving} role="status">
      <div className={styles.petals} aria-hidden="true">
        <Petal mood="best" width={22} sparkle={false} className={styles.petal} />
        <Petal mood="good" width={22} sparkle={false} className={styles.petal} />
        <Petal mood="okay" width={22} sparkle={false} className={styles.petal} />
      </div>
      <p className={styles.text}>오늘의 꽃잎을 피우는 중이에요</p>
      <p className={styles.sub}>잠시만 기다려 주세요.</p>
    </div>
  );
}
