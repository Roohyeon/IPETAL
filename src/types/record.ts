/** 하루 느낌 5단계. 꽃잎의 명도로 표현된다. */
export type Mood = "best" | "good" | "okay" | "tired" | "hard";

/** 키워드 = 하루 동안 한 활동 (꽃잎 수와 무관) */
export type Keyword = string;

/** 꽃잎 = 하루의 기록 */
export type DailyRecord = {
  /** YYYY-MM-DD (Asia/Seoul) */
  date: string;
  keywords: Keyword[];
  mood: Mood;
  memo?: string;
  /** 그날의 사진 (선택). 지금은 줄인 JPEG data URL — TODO: 실제 업로드 URL로 교체 */
  photo?: string;
  /** 기록한 시각 HH:mm (Asia/Seoul) */
  recordedAt?: string;
};

export type MoodOption = {
  value: Mood;
  label: string;
};

export type Recommendation = {
  tag: string;
  title: string;
  description: string;
};

export type RecommendationSet = {
  title: string;
  items: Recommendation[];
};
