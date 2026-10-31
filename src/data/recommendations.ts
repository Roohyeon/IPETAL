import type { Keyword, Mood, RecommendationSet } from "@/types/record";

/**
 * '오늘의 마음 채우기' 추천 문구.
 * 시안에 있는 두 묶음만 사용한다.
 * - 기분 좋은 날: 로그인 후 HOME(첫 기록 완료) 시안
 * - 지친 날: 로그인 전 HOME '이용 안내' 예시 화면
 * TODO: '그저 그랬어요' 전용 문구가 정해지면 추가
 */
function brightDay(firstKeyword: Keyword): RecommendationSet {
  return {
    title: "좋은 하루였네요, 이 기분을 이어가요",
    items: [
      {
        tag: "사람",
        title: "오늘 좋았던 일 친구에게 나누기",
        description: "좋은 기분은 나눌수록 오래 남아요.",
      },
      {
        tag: "활동",
        title: `내일도 '${firstKeyword}' 해보기`,
        description: "기분 좋은 날 한 일이 나에게 잘 맞는 활동일 수 있어요.",
      },
      {
        tag: "취미",
        title: "오늘 장면 사진 한 장 남기기",
        description: "나중에 꺼내 보면 오늘 기분이 다시 떠올라요.",
      },
      {
        tag: "게임",
        title: "친구와 함께하는 협동 게임",
        description: "좋은 에너지를 함께 쓰기 좋아요.",
      },
    ],
  };
}

export const TIRED_DAY: RecommendationSet = {
  title: "일에 쏟은 하루, 이제 나를 먼저 챙겨봐요",
  items: [
    {
      tag: "사람",
      title: "친구에게 먼저 연락해보기",
      description: "짧은 통화가 일 생각을 끊어줘요.",
    },
    {
      tag: "백색소음",
      title: "빗소리 틀어두고 10분 쉬기",
      description: "일정한 소리가 생각을 가라앉혀줘요.",
    },
  ],
};

/** 지친 날 전체 묶음: 나의 정원 > 그날의 기록 시안 (위 TIRED_DAY는 로그인 전 예시 화면용 두 개) */
const TIRED_DAY_FULL: RecommendationSet = {
  title: TIRED_DAY.title,
  items: [
    {
      tag: "사람",
      title: "친구에게 먼저 연락해보기",
      description: "짧은 통화나 가벼운 저녁 약속이 일 생각을 끊어줘요.",
    },
    {
      tag: "활동",
      title: "밤 드라이브나 동네 한 바퀴",
      description: "창문을 열고 바람을 쐬면 머리가 한결 가벼워져요.",
    },
    {
      tag: "백색소음",
      title: "빗소리 틀어두고 10분 쉬기",
      description: "일정한 소리가 바쁘던 생각을 잔잔하게 가라앉혀줘요.",
    },
    {
      tag: "게임",
      title: "꾸미기·농장 같은 잔잔한 힐링 게임",
      description: "이기고 지는 게 없어서 부담 없이 쉬기 좋아요.",
    },
  ],
};

export function getRecommendations(mood: Mood, keywords: Keyword[]): RecommendationSet {
  if (mood === "best" || mood === "good") {
    return brightDay(keywords[0] ?? "");
  }
  return TIRED_DAY_FULL;
}
