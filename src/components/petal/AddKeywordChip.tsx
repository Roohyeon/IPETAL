"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@/components/common/Icons";
import styles from "./AddKeywordChip.module.css";

type AddKeywordChipProps = {
  onAdd?: (keyword: string) => void;
  /** 표시용(로그인 전 예시 화면) */
  static?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
};

const MAX_KEYWORD_LENGTH = 12;

/** "+ 키워드 직접 추가" — 누르면 같은 모양 안에서 바로 입력한다. */
export function AddKeywordChip({
  onAdd,
  static: isStatic = false,
  disabled = false,
  size = "md",
}: AddKeywordChipProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const className = `${styles.chip} ${styles[size]}`;
  const label = (
    <>
      <PlusIcon size={size === "sm" ? 14 : 18} className={styles.icon} />
      <span>키워드 직접 추가</span>
    </>
  );

  if (isStatic) {
    return <span className={className}>{label}</span>;
  }

  if (editing) {
    const close = () => {
      setEditing(false);
      setValue("");
      requestAnimationFrame(() => buttonRef.current?.focus());
    };
    const submit = () => {
      const keyword = value.trim();
      if (keyword) onAdd?.(keyword);
      close();
    };
    return (
      <span className={`${className} ${styles.editing}`}>
        <PlusIcon size={18} className={styles.icon} />
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          maxLength={MAX_KEYWORD_LENGTH}
          aria-label="추가할 키워드"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") close();
          }}
          onBlur={submit}
        />
      </span>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) setEditing(true);
      }}
    >
      {label}
    </button>
  );
}
