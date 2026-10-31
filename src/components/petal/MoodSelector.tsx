"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { CheckIcon } from "@/components/common/Icons";
import { MOOD_OPTIONS } from "@/data/moods";
import type { Mood } from "@/types/record";
import { MoodIcon } from "./MoodIcon";
import styles from "./MoodSelector.module.css";

type MoodSelectorProps = {
  value: Mood | null;
  onChange: (mood: Mood) => void;
  labelledBy: string;
};

/** 하루 느낌 5단계 중 1개 (필수). radiogroup + 방향키 이동 */
export function MoodSelector({ value, onChange, labelledBy }: MoodSelectorProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = value ? MOOD_OPTIONS.findIndex((o) => o.value === value) : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = MOOD_OPTIONS.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    onChange(MOOD_OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-required="true"
      className={styles.group}
    >
      {MOOD_OPTIONS.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === focusIndex ? 0 : -1}
            className={`${styles.option} ${checked ? styles.checked : ""}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {checked ? (
              <span className={styles.badge} aria-hidden="true">
                <CheckIcon size={13} />
              </span>
            ) : null}
            <MoodIcon mood={option.value} className={styles.icon} />
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
