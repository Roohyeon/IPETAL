import type { DailyRecord } from "@/types/record";
import { DONE_TODAY_SAMPLE } from "@/data/records";
import { buildFewRecords, buildSampleRecords } from "@/data/sampleRecords";
import { toDateKey } from "@/lib/date";

export type View = "guest" | "member" | "member-done";

export type Session =
  { status: "guest" } | { status: "member"; user: { name: string }; initialRecords: DailyRecord[] };

const DEMO_USER = { name: "지민" };

/** 로그인 화면에서 체험 로그인하면 남는 쿠키 (값: "member") */
export const DEMO_LOGIN_COOKIE = "ipetal_demo";

/**
 * 가짜 세션. 실제 로그인 기능이 아니다.
 * 개발 환경에서만 ?view=guest | member | member-done 으로 화면을 바꿔 볼 수 있다.
 * 그 밖에는 로그인 화면의 체험 로그인 쿠키(DEMO_LOGIN_COOKIE)가 있으면 로그인 후, 없으면 로그인 전 화면.
 */
export function getMockSession(view: string | string[] | undefined, demoLogin?: string): Session {
  const requested = typeof view === "string" ? view : undefined;
  const effective: View =
    process.env.NODE_ENV === "development" && isView(requested)
      ? requested
      : demoLogin === "member"
        ? "member"
        : "guest";

  if (effective === "guest") return { status: "guest" };

  const today = toDateKey();
  const initialRecords: DailyRecord[] =
    effective === "member-done" ? [{ ...DONE_TODAY_SAMPLE, date: today }] : [];

  return { status: "member", user: DEMO_USER, initialRecords };
}

/**
 * 나의 정원·나의 패턴 화면의 가짜 기록.
 * 기본은 두 달치 기록이 쌓인 상태이고,
 * 개발 환경에서만 ?view=member-few 로 꽃잎 3장(패턴 리포트 잠금) 상태를 볼 수 있다.
 */
export function getDemoRecords(view: string | string[] | undefined, today: string): DailyRecord[] {
  const few = process.env.NODE_ENV === "development" && view === "member-few";
  return few ? buildFewRecords(today) : buildSampleRecords(today);
}

function isView(value: string | undefined): value is View {
  return value === "guest" || value === "member" || value === "member-done";
}
