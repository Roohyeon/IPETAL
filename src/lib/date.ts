const TIME_ZONE = "Asia/Seoul";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type DateParts = { year: number; month: number; day: number; weekday: number };

function partsOf(date: Date): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

/** YYYY-MM-DD */
export function toDateKey(date: Date = new Date()): string {
  const { year, month, day } = partsOf(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromKey(key: string): DateParts {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

/** 10월 28일 수요일 */
export function formatLongDate(key: string): string {
  const { month, day, weekday } = fromKey(key);
  return `${month}월 ${day}일 ${WEEKDAYS[weekday]}요일`;
}

/** 10월 28일 (수) */
export function formatShortDate(key: string): string {
  const { month, day, weekday } = fromKey(key);
  return `${month}월 ${day}일 (${WEEKDAYS[weekday]})`;
}

export function monthOf(key: string): number {
  return fromKey(key).month;
}

export function daysInMonth(key: string): number {
  const { year, month } = fromKey(key);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** 오늘을 포함해 끊기지 않고 이어진 기록 일수 */
export function streakDays(dateKeys: string[], today: string): number {
  const set = new Set(dateKeys);
  let count = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}

/** key에서 n일 뒤(음수면 앞)의 YYYY-MM-DD */
export function addDays(key: string, n: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → YYYY-MM */
export function monthKeyOf(key: string): string {
  return key.slice(0, 7);
}

/** YYYY-MM 형식이 맞으면 { year, month } */
export function parseMonthKey(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** YYYY-MM에서 n달 뒤(음수면 앞)의 YYYY-MM */
export function shiftMonth(monthKey: string, n: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + n, 1));
  return date.toISOString().slice(0, 7);
}

/** 그 달 1일의 요일 (0 = 일요일) */
export function firstWeekdayOf(monthKey: string): number {
  return fromKey(`${monthKey}-01`).weekday;
}

/** 10월 21일 */
export function formatMonthDay(key: string): string {
  const { month, day } = fromKey(key);
  return `${month}월 ${day}일`;
}

/** 2026년 10월 1일 */
export function formatFullDate(key: string): string {
  const { year, month, day } = fromKey(key);
  return `${year}년 ${month}월 ${day}일`;
}

/** "22:30" → "오후 10:30" */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "오전" : "오후";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${h}:${String(minute).padStart(2, "0")}`;
}

/** 지금 시각 HH:mm (Asia/Seoul) */
export function toTimeKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
