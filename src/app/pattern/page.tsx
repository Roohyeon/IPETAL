import type { Metadata } from "next";
import { MemberShell } from "@/components/common/MemberShell";
import { PatternReport } from "@/components/pattern/PatternReport";
import { toDateKey } from "@/lib/date";
import { getDemoRecords } from "@/lib/mockSession";

export const metadata: Metadata = { title: "나의 패턴 — IPETAL" };

export default async function PatternPage({ searchParams }: PageProps<"/pattern">) {
  const { view } = await searchParams;
  const today = toDateKey();

  return (
    <MemberShell today={today}>
      <PatternReport records={getDemoRecords(view, today)} today={today} />
    </MemberShell>
  );
}
