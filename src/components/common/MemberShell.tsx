"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";
import { RecordSheetProvider } from "./RecordSheetProvider";
import styles from "./MemberShell.module.css";

const DECOR = [
  { src: "/images/decor-lotus.png", height: 245, className: styles.d1 },
  { src: "/images/decor-leaf.png", height: 234, className: styles.d2 },
  { src: "/images/decor-lotus.png", height: 245, className: styles.d3 },
  { src: "/images/decor-leaf.png", height: 234, className: styles.d4 },
  { src: "/images/decor-leaf.png", height: 234, className: styles.d5 },
];

type MemberShellProps = {
  children: ReactNode;
  /** YYYY-MM-DD */
  today: string;
  /** 오늘 기록 시트 안의 내용 (기본: 이 화면 전용 기록 폼) */
  sheetContent?: ReactNode;
};

/**
 * 로그인 후 화면 공통 틀: 흐릿한 연꽃 배경 + 헤더 + (데스크톱) 푸터 + (모바일·태블릿) 하단 탭.
 * 하단 탭의 + 버튼(과 화면 안의 '오늘의 꽃잎 남기기')은 아래에서 올라오는 오늘 기록 시트를 연다.
 */
export function MemberShell({ children, today, sheetContent }: MemberShellProps) {
  return (
    <RecordSheetProvider today={today} content={sheetContent}>
      <div className={styles.page}>
        <div className={styles.decor} aria-hidden="true">
          {DECOR.map((item) => (
            <Image
              key={item.className}
              src={item.src}
              alt=""
              width={360}
              height={item.height}
              className={item.className}
              loading="eager"
            />
          ))}
        </div>

        <Header variant="member" />
        {children}

        <div className={styles.desktopOnly}>
          <Footer variant="simple" />
        </div>
        <MobileTabBar showOnTablet />
      </div>
    </RecordSheetProvider>
  );
}
