"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GUEST_SECTIONS, ROUTES } from "@/data/routes";
import { UserIcon } from "./Icons";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ProfileMenu } from "./ProfileMenu";
import styles from "./Header.module.css";

const MEMBER_NAV = [
  { href: ROUTES.home, label: "홈", match: (path: string) => path === "/" },
  { href: ROUTES.todayRecord, label: "오늘 기록", match: () => false },
  { href: ROUTES.garden, label: "나의 정원", match: (path: string) => path.startsWith("/garden") },
  {
    href: ROUTES.pattern,
    label: "패턴 리포트",
    match: (path: string) => path.startsWith("/pattern"),
  },
];

/** Hero(#top)가 헤더 아래에 보이는 동안 true */
function useOverHero() {
  const [overHero, setOverHero] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const observer = new IntersectionObserver(([entry]) => setOverHero(entry.isIntersecting), {
      rootMargin: `-${headerH}px 0px 0px 0px`,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return overHero;
}

/** 화면 위쪽 기준선(헤더 아래 30%)이 걸쳐 있는 섹션의 id */
function useCurrentSection(ids: readonly string[]) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
      const line = headerH + (window.innerHeight - headerH) * 0.3;
      const found = ids.find((id) => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return rect && rect.top <= line && rect.bottom > line;
      });
      setCurrent(found ?? null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);

  return current;
}

const GUEST_SECTION_IDS = GUEST_SECTIONS.map((section) => section.id);
const NO_SECTIONS: readonly string[] = [];

export function Header({ variant }: { variant: "guest" | "member" }) {
  const overHero = useOverHero();
  const pathname = usePathname();
  const currentSection = useCurrentSection(variant === "guest" ? GUEST_SECTION_IDS : NO_SECTIONS);

  return (
    <>
      {/* 모바일에서는 헤더가 fixed라, 흐름에서 빠진 헤더 높이만큼 자리를 채운다 */}
      <div className={styles.spacer} aria-hidden="true" />
      <header className={styles.header} data-over-hero={overHero || undefined}>
        <div className={styles.inner}>
          <Logo />

          {variant === "guest" ? (
            <>
              <nav className={styles.nav} aria-label="페이지 섹션">
                <ul className={styles.navList}>
                  {GUEST_SECTIONS.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`${styles.navLink} ${styles.guestLink}`}
                        aria-current={currentSection === section.id ? "location" : undefined}
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className={styles.actions}>
                {/* TODO: 로그인 경로 연결 */}
                <Link href={ROUTES.login} className={`${styles.login} ${styles.hideOnMobile}`}>
                  로그인
                </Link>
                <MobileMenu className={styles.tabletOnly} />
                <Link href={ROUTES.login} className={`${styles.profile} ${styles.mobileOnly}`}>
                  <UserIcon size={26} />
                  <span className="visually-hidden">로그인</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <nav className={styles.nav} aria-label="주요 메뉴">
                <ul className={styles.navList}>
                  {MEMBER_NAV.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`${styles.navLink} ${styles.memberLink}`}
                        aria-current={item.match(pathname) ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className={styles.actions}>
                <ProfileMenu className={styles.profile} />
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
