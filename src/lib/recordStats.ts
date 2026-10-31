import type { DailyRecord, Keyword, Mood } from "@/types/record";
import { MOOD_OPTIONS, moodLabel } from "@/data/moods";
import {
  addDays,
  daysInMonth,
  formatFullDate,
  formatMonthDay,
  monthKeyOf,
  shiftMonth,
} from "@/lib/date";
import { particle } from "@/lib/text";

/** 꽃잎 7장이 모이면 패턴 리포트가 열린다 */
export const PATTERN_UNLOCK_COUNT = 7;

export type PeriodMode = "week" | "month";

export type Period = {
  start: string;
  end: string;
  /** 10월 21일 ~ 10월 27일 */
  label: string;
  /** 이번 주 / 지난 달 / 그 주 … */
  scope: string;
};

/** offset 0 = 오늘이 들어 있는 기간, 1 = 바로 전 기간 */
export function getPeriod(mode: PeriodMode, offset: number, today: string): Period {
  const scope = `${offset === 0 ? "이번" : offset === 1 ? "지난" : "그"} ${mode === "week" ? "주" : "달"}`;

  if (mode === "week") {
    const end = addDays(today, -7 * offset);
    const start = addDays(end, -6);
    return { start, end, scope, label: `${formatMonthDay(start)} ~ ${formatMonthDay(end)}` };
  }

  const month = shiftMonth(monthKeyOf(today), -offset);
  const start = `${month}-01`;
  const end = offset === 0 ? today : `${month}-${String(daysInMonth(start)).padStart(2, "0")}`;
  return { start, end, scope, label: `${formatFullDate(start)} ~ ${formatMonthDay(end)}` };
}

export function recordsIn(records: DailyRecord[], period: Pick<Period, "start" | "end">) {
  return records.filter((record) => record.date >= period.start && record.date <= period.end);
}

export type KeywordCount = { keyword: Keyword; days: number };

/** 키워드별로 남긴 날 수 (많은 순) */
export function countKeywords(records: DailyRecord[]): KeywordCount[] {
  const counts = new Map<Keyword, number>();
  for (const record of records) {
    for (const keyword of record.keywords) counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
  }
  return [...counts].map(([keyword, days]) => ({ keyword, days })).sort((a, b) => b.days - a.days);
}

/** 하루 느낌별 날 수 (MOOD_OPTIONS 순서) */
export function countMoods(records: DailyRecord[]): Record<Mood, number> {
  const counts = Object.fromEntries(MOOD_OPTIONS.map((option) => [option.value, 0])) as Record<
    Mood,
    number
  >;
  for (const record of records) counts[record.mood] += 1;
  return counts;
}

export function keywordTotal(records: DailyRecord[]): number {
  return records.reduce((sum, record) => sum + record.keywords.length, 0);
}

const BRIGHT: Mood[] = ["best", "good"];
const HEAVY: Mood[] = ["tired", "hard"];

export type Insight = { title: string; basis: string };

/** quoted("산책", "을/를") → "'산책'을" */
function quoted(word: string, pair: Parameters<typeof particle>[1]) {
  return `'${word}'${particle(word, pair)}`;
}

/**
 * 돌아보기 문장. 함께 기록된 횟수만 말하고 원인·결과로 해석하지 않는다.
 * @param all 다음 날 패턴을 볼 때 기간 밖 다음 날까지 보기 위한 전체 기록
 */
export function buildInsights(records: DailyRecord[], all: DailyRecord[]): Insight[] {
  const insights: Insight[] = [];
  const stats = countKeywords(records).map(({ keyword, days }) => {
    const withKeyword = records.filter((record) => record.keywords.includes(keyword));
    return {
      keyword,
      days,
      bright: withKeyword.filter((record) => BRIGHT.includes(record.mood)).length,
      heavy: withKeyword.filter((record) => HEAVY.includes(record.mood)).length,
    };
  });
  const used = new Set<Keyword>();

  const mostly = stats.find((s) => s.days >= 3 && s.bright / s.days >= 0.6 && s.bright < s.days);
  if (mostly) {
    used.add(mostly.keyword);
    insights.push({
      title: `${quoted(mostly.keyword, "을/를")} 남긴 날은 대부분 기분 좋은 하루였어요.`,
      basis: `${mostly.keyword}${particle(mostly.keyword, "을/를")} 기록한 ${mostly.days}일 중 ${mostly.bright}일이 '최고였어요' 또는 '좋았어요'`,
    });
  }

  const always = stats.find((s) => !used.has(s.keyword) && s.days >= 2 && s.bright === s.days);
  if (always) {
    used.add(always.keyword);
    insights.push({
      title: `${quoted(always.keyword, "이/가")} 있던 날은 모두 좋은 하루로 남았어요.`,
      basis: `${always.days}일 중 ${always.days}일이 '최고였어요' 또는 '좋았어요'`,
    });
  }

  const tired = stats.find((s) => !used.has(s.keyword) && s.days >= 2 && s.heavy / s.days >= 0.5);
  if (tired) {
    insights.push({
      title: `${quoted(tired.keyword, "이/가")} 있던 날은 지친 기분이 자주 함께했어요.`,
      basis: `${tired.keyword}${particle(tired.keyword, "을/를")} 기록한 ${tired.days}일 중 ${tired.heavy}일이 '지쳤어요' 또는 '힘들었어요'`,
    });
  }

  const nextDay = findNextDayPattern(records, all);
  if (nextDay) insights.push(nextDay);

  return insights;
}

/** 'A' 다음 날에 'B'가 자주 함께 남은 경우 (다음 날 꽃잎의 절반 이상) */
function findNextDayPattern(records: DailyRecord[], all: DailyRecord[]): Insight | null {
  const byDate = new Map(all.map((record) => [record.date, record]));
  let best: { from: Keyword; to: Keyword; hit: number; total: number } | null = null;

  for (const { keyword: from } of countKeywords(records)) {
    const nextDays = records
      .filter((record) => record.keywords.includes(from))
      .map((record) => byDate.get(addDays(record.date, 1)))
      .filter((record): record is DailyRecord => Boolean(record));
    if (nextDays.length < 2) continue;

    for (const { keyword: to, days: hit } of countKeywords(nextDays)) {
      if (to === from || hit < 2 || hit / nextDays.length < 0.5) continue;
      if (!best || hit > best.hit) best = { from, to, hit, total: nextDays.length };
    }
  }

  if (!best) return null;
  return {
    title: `'${best.from}' 다음 날에는 ${quoted(best.to, "이/가")} 자주 함께 남았어요.`,
    basis: `${best.from} 다음 날 꽃잎 ${best.total}장 중 ${best.hit}장에 '${best.to}' 포함`,
  };
}

/** 가장 많이 남긴 하루 느낌 (같으면 앞 순서) */
export function topMood(records: DailyRecord[]): string | null {
  if (records.length === 0) return null;
  const counts = countMoods(records);
  const [mood] = MOOD_OPTIONS.map((o) => o.value).sort((a, b) => counts[b] - counts[a]);
  return moodLabel(mood);
}
