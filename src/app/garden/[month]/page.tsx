import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberShell } from "@/components/common/MemberShell";
import { MonthCalendar } from "@/components/garden/MonthCalendar";
import { monthKeyOf, parseMonthKey, toDateKey } from "@/lib/date";
import { getDemoRecords } from "@/lib/mockSession";

export async function generateMetadata({
  params,
}: PageProps<"/garden/[month]">): Promise<Metadata> {
  const parsed = parseMonthKey((await params).month);
  return { title: `${parsed ? `${parsed.month}월의 달력` : "나의 정원"} — IPETAL` };
}

/** 나의 정원 > 한 달 달력. 기록이 처음 있는 달부터 이번 달까지만 열 수 있다. */
export default async function GardenMonthPage({
  params,
  searchParams,
}: PageProps<"/garden/[month]">) {
  const { month } = await params;
  const { view } = await searchParams;
  const today = toDateKey();
  const records = getDemoRecords(view, today);

  const current = monthKeyOf(today);
  const first = records.length > 0 ? monthKeyOf(records[records.length - 1].date) : current;
  if (!parseMonthKey(month) || month < first || month > current) notFound();

  return (
    <MemberShell today={today}>
      <MonthCalendar
        key={month}
        monthKey={month}
        initialRecords={records.filter((record) => monthKeyOf(record.date) === month)}
        today={today}
        firstMonth={first}
      />
    </MemberShell>
  );
}
