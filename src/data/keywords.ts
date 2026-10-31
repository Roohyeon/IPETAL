import type { Keyword } from "@/types/record";

/** 하루 기록 규칙: 키워드 1~5개 (3개 추천) */
export const KEYWORD_MIN = 1;
export const KEYWORD_MAX = 5;
export const MEMO_MAX_LENGTH = 50;

/** 로그인 후 HOME의 대표 키워드 (시안 순서) */
export const SUGGESTED_KEYWORDS: Keyword[] = [
  "산책",
  "카페",
  "운동",
  "야근",
  "친구와 저녁",
  "늦잠",
  "집콕",
  "공부",
];

/** 로그인 전 HOME '이용 안내' 예시 화면의 키워드 (시안 순서) */
export const GUIDE_EXAMPLE_KEYWORDS: {
  label: Keyword;
  selected: boolean;
  desktopOnly?: boolean;
}[] = [
  { label: "산책", selected: true },
  { label: "카페", selected: true },
  { label: "야근", selected: false },
  { label: "운동", selected: false },
  { label: "친구와 저녁", selected: false },
  { label: "늦잠", selected: false },
  { label: "집콕", selected: false, desktopOnly: true },
];
