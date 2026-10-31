import type { DailyRecord, Keyword, Mood } from "@/types/record";
import { addDays, monthKeyOf, shiftMonth } from "@/lib/date";

/**
 * 나의 정원·나의 패턴 시안용 더미 기록.
 * 두 달 전 1일부터 어제까지, 매번 같은 결과가 나오도록 고정 시드로 만든다.
 * 키워드와 기분은 패턴 리포트의 문장이 자연스럽게 나오도록 묶어 두었다.
 * - 산책·카페·운동·친구와 저녁 → 기분 좋은 날
 * - 야근·공부·시험 → 지친 날, 야근 다음 날에는 늦잠
 */
const SEED = 20261028;

/** 0 이상 1 미만의 고정 난수열 (mulberry32) */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOOD_WEIGHTS: [Mood, number][] = [
  ["best", 0.17],
  ["good", 0.38],
  ["okay", 0.22],
  ["tired", 0.16],
  ["hard", 0.07],
];

/** 하루 느낌별로 함께 남기기 쉬운 키워드와 그 확률 */
const KEYWORD_POOLS: Record<"bright" | "plain" | "heavy", [Keyword, number][]> = {
  bright: [
    ["산책", 0.62],
    ["카페", 0.45],
    ["운동", 0.32],
    ["친구와 저녁", 0.26],
    ["붕어빵", 0.1],
  ],
  plain: [
    ["집콕", 0.4],
    ["카페", 0.35],
    ["공부", 0.3],
    ["산책", 0.28],
    ["야근", 0.22],
  ],
  heavy: [
    ["야근", 0.7],
    ["공부", 0.35],
    ["집콕", 0.3],
    ["시험", 0.15],
  ],
};

function pickMood(r: number): Mood {
  let acc = 0;
  for (const [mood, weight] of MOOD_WEIGHTS) {
    acc += weight;
    if (r < acc) return mood;
  }
  return "good";
}

function poolOf(mood: Mood) {
  if (mood === "best" || mood === "good") return KEYWORD_POOLS.bright;
  if (mood === "okay") return KEYWORD_POOLS.plain;
  return KEYWORD_POOLS.heavy;
}

/** 두 달 전 1일 ~ 어제의 기록 (하루에 꽃잎 하나, 기록하지 않은 날도 있다) */
export function buildSampleRecords(today: string): DailyRecord[] {
  const next = random(SEED);
  const records: DailyRecord[] = [];
  let previous: DailyRecord | null = null;

  for (
    let date = `${shiftMonth(monthKeyOf(today), -2)}-01`;
    date < today;
    date = addDays(date, 1)
  ) {
    if (next() < 0.2) {
      previous = null;
      continue;
    }
    const mood = pickMood(next());
    const pool = poolOf(mood);
    const keywords = pool.filter(([, chance]) => next() < chance).map(([keyword]) => keyword);
    if (keywords.length === 0) keywords.push(pool[0][0]);
    if (previous?.keywords.includes("야근") && next() < 0.7) keywords.push("늦잠");

    const minutes = 20 * 60 + Math.floor(next() * 239);
    const record: DailyRecord = {
      date,
      keywords: keywords.slice(0, 5),
      mood,
      recordedAt: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`,
    };
    records.push(record);
    previous = record;
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

/** 꽃잎이 아직 7장이 안 된 상태 (패턴 리포트 잠금 시안) */
export function buildFewRecords(today: string): DailyRecord[] {
  return [
    { date: addDays(today, -1), keywords: ["산책", "카페"], mood: "good", recordedAt: "21:40" },
    {
      date: addDays(today, -3),
      keywords: ["야근", "카페", "공부"],
      mood: "tired",
      recordedAt: "23:12",
    },
    {
      date: addDays(today, -4),
      keywords: ["산책", "야근", "집콕"],
      mood: "okay",
      recordedAt: "22:05",
    },
  ];
}
