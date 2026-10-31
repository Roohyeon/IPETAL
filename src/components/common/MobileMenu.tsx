"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { GUEST_SECTIONS, ROUTES } from "@/data/routes";
import { ButtonLink } from "./Button";
import { CloseIcon, MenuIcon } from "./Icons";
import { Logo } from "./Logo";
import styles from "./MobileMenu.module.css";

/** 태블릿 헤더의 햄버거 메뉴 — 오른쪽에서 열리는 드로어 (디자인시안 2-1) */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    document.body.dataset.scrollLock = "true";
    closeRef.current?.focus();

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1200px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      delete document.body.dataset.scrollLock;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // 열린 동안 Tab 포커스를 드로어 안에 가둔다
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll<HTMLElement>("a[href], button");
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={className}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={28} />
        <span className="visually-hidden">메뉴 열기</span>
      </button>

      <div id={panelId} className={styles.panel} data-open={open} inert={!open}>
        <div className={styles.backdrop} aria-hidden="true" onClick={() => close(false)} />
        <div
          ref={sheetRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={trapFocus}
        >
          <div className={styles.sheetHead}>
            <Logo />
            <h2 id={titleId} className="visually-hidden">
              메뉴
            </h2>
            <button ref={closeRef} type="button" className={styles.close} onClick={() => close()}>
              <CloseIcon size={30} />
              <span className="visually-hidden">메뉴 닫기</span>
            </button>
          </div>

          <nav aria-label="페이지 섹션">
            <ul>
              {GUEST_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.link} onClick={() => close(false)}>
                    {section.label}
                    <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.brand} aria-hidden="true">
            <p className={styles.script}>Daily Petal</p>
            <svg className={styles.wave} viewBox="0 0 158 10" focusable="false">
              <path d="M1 5.5C24 9 44 8 79 5S134 1 157 4.5" />
            </svg>
          </div>

          <div className={styles.actions}>
            {/* TODO: 시작하기(회원가입) 경로 연결 */}
            <ButtonLink href={ROUTES.signup} variant="olive" block className={styles.actionButton}>
              시작하기
            </ButtonLink>
            {/* TODO: 로그인 경로 연결 */}
            <Link href={ROUTES.login} className={styles.login}>
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
