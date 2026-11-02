"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/data/routes";
import { ChartIcon, GardenIcon, HomeIcon, PlusIcon, UserIcon } from "./Icons";
import { useOpenRecordSheet } from "./RecordSheet";
import styles from "./MobileTabBar.module.css";

type MobileTabBarProps = {
  /** 태블릿에서도 보일지 (로그인 후 화면) */
  showOnTablet?: boolean;
  /** 기록 시트가 없는 화면에서 + 버튼의 이동 위치 */
  recordHref?: string;
};

export function MobileTabBar({
  showOnTablet = false,
  recordHref = ROUTES.todayRecord,
}: MobileTabBarProps) {
  // 기록 시트가 있으면 + 버튼은 이동 대신 시트를 연다
  const onRecord = useOpenRecordSheet();
  const pathname = usePathname();
  const current = (match: boolean) => (match ? "page" : undefined);

  return (
    <nav className={`${styles.bar} ${showOnTablet ? styles.tablet : ""}`} aria-label="하단 메뉴">
      <ul className={styles.list}>
        <li>
          <Link href={ROUTES.home} className={styles.item} aria-current={current(pathname === "/")}>
            <HomeIcon size={26} />
            <span>홈</span>
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.garden}
            className={styles.item}
            aria-current={current(pathname.startsWith("/garden"))}
          >
            <GardenIcon size={26} />
            <span>나의 정원</span>
          </Link>
        </li>
        <li className={styles.center}>
          {onRecord ? (
            <button
              type="button"
              className={styles.record}
              onClick={onRecord}
              aria-haspopup="dialog"
            >
              <span className={styles.fab}>
                <PlusIcon size={22} strokeWidth={2.2} />
              </span>
              <span className="visually-hidden">오늘의 꽃잎 남기기</span>
            </button>
          ) : (
            <Link href={recordHref} className={styles.record}>
              <span className={styles.fab}>
                <PlusIcon size={22} strokeWidth={2.2} />
              </span>
              <span className="visually-hidden">기록하기</span>
            </Link>
          )}
        </li>
        <li>
          <Link
            href={ROUTES.pattern}
            className={styles.item}
            aria-current={current(pathname.startsWith("/pattern"))}
          >
            <ChartIcon size={26} />
            <span>패턴 리포트</span>
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.my}
            className={styles.item}
            aria-current={current(pathname.startsWith("/my"))}
          >
            <UserIcon size={26} />
            <span>마이</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
