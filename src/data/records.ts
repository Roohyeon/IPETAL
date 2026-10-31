import type { DailyRecord } from "@/types/record";

/** 첫 기록 완료 상태(?view=member-done)의 오늘 기록. 시안의 더미 데이터 */
export const DONE_TODAY_SAMPLE: Omit<DailyRecord, "date"> = {
  keywords: ["산책", "카페", "붕어빵"],
  mood: "good",
};
