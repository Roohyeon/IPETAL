import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/common/MemberShell";
import { MyPage } from "@/components/my/MyPage";
import { ROUTES } from "@/data/routes";
import { toDateKey } from "@/lib/date";
import { DEMO_LOGIN_COOKIE, getDemoRecords, getMockSession } from "@/lib/mockSession";

export const metadata: Metadata = { title: "마이페이지 — IPETAL" };

/** 마이페이지: 내 정보 · 지금까지 모은 꽃잎 · 바로가기 · 로그아웃 (로그인 전이면 로그인 화면으로) */
export default async function MyPageRoute({ searchParams }: PageProps<"/my">) {
  const { view } = await searchParams;
  const session = getMockSession(view, (await cookies()).get(DEMO_LOGIN_COOKIE)?.value);
  if (session.status === "guest") redirect(ROUTES.login);

  const today = toDateKey();
  return (
    <MemberShell today={today}>
      <MyPage userName={session.user.name} records={getDemoRecords(view, today)} today={today} />
    </MemberShell>
  );
}
