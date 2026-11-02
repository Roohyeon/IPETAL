"use client";

import Link from "next/link";
import { useMemo } from "react";
import { logout } from "@/app/login/actions";
import { ChartIcon, ChevronRightIcon, GardenIcon, UserIcon } from "@/components/common/Icons";
import layout from "@/components/garden/layout.module.css";
import { ROUTES } from "@/data/routes";
import { formatLongDate, monthKeyOf, streakDays } from "@/lib/date";
import { mergeRecords, useSavedRecords } from "@/lib/recordRepository";
import type { DailyRecord } from "@/types/record";
import styles from "./MyPage.module.css";

type MyPageProps = {
  userName: string;
  records: DailyRecord[];
  today: string;
};

const LINKS = [
  {
    href: ROUTES.garden,
    label: "나의 정원",
    sub: "꽃잎이 모여 피어난 연꽃 보기",
    Icon: GardenIcon,
  },
  {
    href: ROUTES.pattern,
    label: "패턴 리포트",
    sub: "자주 남긴 활동과 기분 보기",
    Icon: ChartIcon,
  },
];

/** 마이페이지: 프로필 · 지금까지 모은 꽃잎 · 바로가기 · 로그아웃 */
export function MyPage({ userName, records: baseRecords, today }: MyPageProps) {
  // 데모 기록 + 이 브라우저에서 남긴 기록
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(baseRecords, saved), [baseRecords, saved]);
  const flowers = new Set(records.map((record) => monthKeyOf(record.date))).size;
  const streak = streakDays(
    records.map((record) => record.date),
    today,
  );
  // 기록은 최신 날짜 순이라 마지막이 첫 기록
  const first = records.at(-1)?.date;

  const stats = [
    { label: "모은 꽃잎", value: `${records.length}장` },
    { label: "피운 연꽃", value: `${flowers}송이` },
    { label: "연속 기록", value: `${streak}일` },
  ];

  return (
    <main className={layout.main}>
      <header>
        <p className={styles.eyebrow}>My Page</p>
        <h1 className={styles.title}>마이페이지</h1>
      </header>

      <section aria-label="내 정보" className={`${layout.glass} ${styles.card} ${styles.profile}`}>
        <span className={styles.avatar} aria-hidden="true">
          <UserIcon size={30} />
        </span>
        <div>
          <p className={styles.name}>{userName}님</p>
          <p className={styles.since}>
            {first
              ? `${formatLongDate(first)}부터 꽃잎을 모으고 있어요`
              : "첫 꽃잎을 기다리고 있어요"}
          </p>
        </div>
      </section>

      <section aria-label="지금까지 모은 꽃잎" className={`${layout.glass} ${styles.card}`}>
        <ul className={styles.stats}>
          {stats.map((stat) => (
            <li key={stat.label} className={styles.stat}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="바로가기" className={`${layout.glass} ${styles.card} ${styles.menu}`}>
        <ul>
          {LINKS.map(({ href, label, sub, Icon }) => (
            <li key={href}>
              <Link href={href} className={styles.menuItem}>
                <Icon size={22} />
                <span className={styles.menuText}>
                  <span className={styles.menuLabel}>{label}</span>
                  <span className={styles.menuSub}>{sub}</span>
                </span>
                <ChevronRightIcon size={18} className={styles.menuArrow} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* TODO: 실제 로그아웃 연결 (지금은 체험 로그인 쿠키를 지운다) */}
      <form action={logout} className={styles.logoutForm}>
        <button type="submit" className={styles.logout}>
          로그아웃
        </button>
      </form>
    </main>
  );
}
