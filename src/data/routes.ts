/**
 * 아직 만들지 않은 화면의 연결 경로.
 * TODO: 각 페이지가 생기면 실제 경로로 교체
 */
export const ROUTES = {
  home: "/",
  signup: "/login", // TODO: 회원가입 화면이 생기면 교체 (지금은 로그인 화면)
  login: "/login",
  todayRecord: "/#today", // TODO: 오늘 기록 페이지가 생기면 교체 (지금은 HOME의 오늘 기록 카드)
  garden: "/garden",
  pattern: "/pattern",
  my: "#", // TODO: 마이 페이지
  about: "#", // TODO: 서비스 소개 페이지
  terms: "#", // TODO: 이용약관
  privacy: "#", // TODO: 개인정보처리방침
  contact: "#", // TODO: 문의하기
} as const;

/** 나의 정원의 한 달 달력 (YYYY-MM) */
export const gardenMonthRoute = (monthKey: string) => `/garden/${monthKey}`;

/** 로그인 전 HOME 섹션 앵커 */
export const GUEST_SECTIONS = [
  { id: "about", label: "소개" },
  { id: "guide", label: "이용 안내" },
  { id: "faq", label: "자주 묻는 질문" },
] as const;
