import Link from "next/link";
import { ROUTES } from "@/data/routes";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

const LINKS = [
  { href: ROUTES.about, label: "서비스 소개", strong: false },
  { href: ROUTES.terms, label: "이용약관", strong: false },
  { href: ROUTES.privacy, label: "개인정보처리방침", strong: true },
  { href: ROUTES.contact, label: "문의하기", strong: false },
];

/** 로그인 전: 전체 버전 / 로그인 후: 간단 버전 */
export function Footer({ variant }: { variant: "full" | "simple" }) {
  if (variant === "simple") {
    return (
      <footer className={`${styles.footer} ${styles.simple}`}>
        <div className={styles.simpleInner}>
          <ul className={styles.simpleLinks}>
            {LINKS.slice(1).map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={styles.simpleLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.copy}>© 2026 IPETAL</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo asLink={false} className={styles.logo} />
          <p className={styles.tagline}>하루가 꽃잎이 되는 라이프로그</p>
        </div>
        <ul className={styles.links}>
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className={link.strong ? styles.strong : undefined}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.copy}>© 2026 IPETAL</p>
      </div>
    </footer>
  );
}
