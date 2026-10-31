import type { Metadata } from "next";
import { MemberShell } from "@/components/common/MemberShell";
import { GardenOverview } from "@/components/garden/GardenOverview";
import { toDateKey } from "@/lib/date";
import { getDemoRecords } from "@/lib/mockSession";

export const metadata: Metadata = { title: "나의 정원 — IPETAL" };

export default async function GardenPage({ searchParams }: PageProps<"/garden">) {
  const { view } = await searchParams;
  const today = toDateKey();

  return (
    <MemberShell today={today}>
      <GardenOverview records={getDemoRecords(view, today)} today={today} />
    </MemberShell>
  );
}
