"use client";

import { useEffect, useId, useRef, useState } from "react";
import { logout } from "@/app/login/actions";
import { UserIcon } from "./Icons";
import styles from "./ProfileMenu.module.css";

/** 로그인 후 헤더의 프로필 버튼: 누르면 로그아웃 메뉴가 열린다 (PC·태블릿·모바일 공통) */
export function ProfileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon size={24} />
        <span className="visually-hidden">내 계정 메뉴</span>
      </button>

      {open && (
        <div id={menuId} role="menu" className={styles.menu}>
          <form action={logout}>
            <button type="submit" role="menuitem" className={styles.item}>
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
