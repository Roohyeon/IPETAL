import type { ReactNode } from "react";
import type { Mood } from "@/types/record";

type MoodIconProps = {
  mood: Mood;
  size?: number;
  /** 로그인 전 예시 화면처럼 테두리를 하루 느낌 색으로 표시 */
  tinted?: boolean;
  className?: string;
};

const FACES: Record<Mood, ReactNode> = {
  best: (
    <>
      <path d="M8 10.2q1.4-1.6 2.8 0M13.2 10.2q1.4-1.6 2.8 0" />
      <path d="M7.6 13.2h8.8a4.4 4.4 0 0 1-8.8 0z" />
      <path d="M8.2 14.7h7.6" />
    </>
  ),
  good: (
    <>
      <circle cx="9.2" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.4 14q3.6 3.6 7.2 0" />
    </>
  ),
  okay: (
    <>
      <circle cx="9.2" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M9 15h6" />
    </>
  ),
  tired: (
    <>
      <path d="M7.8 10.2h3M13.2 10.2h3" />
      <path d="M7.8 15.2q1.05-1.2 2.1 0t2.1 0t2.1 0t2.1 0" />
    </>
  ),
  hard: (
    <>
      <path d="M7.8 8.6l2.8 1.5M16.2 8.6l-2.8 1.5" />
      <circle cx="9.4" cy="11.4" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="11.4" r="0.8" fill="currentColor" stroke="none" />
      <path d="M8.6 16.6q3.4-3.2 6.8 0" />
    </>
  ),
};

export function MoodIcon({ mood, size = 36, tinted = false, className }: MoodIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9.6"
        style={tinted ? { stroke: `var(--mood-${mood})`, strokeWidth: 2.2 } : undefined}
        fill={tinted ? "#fff" : "none"}
      />
      {FACES[mood]}
    </svg>
  );
}
