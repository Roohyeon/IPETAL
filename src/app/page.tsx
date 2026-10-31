import { cookies } from "next/headers";
import { GuestHome } from "@/components/home/guest/GuestHome";
import { MemberHome } from "@/components/home/member/MemberHome";
import { toDateKey } from "@/lib/date";
import { DEMO_LOGIN_COOKIE, getMockSession } from "@/lib/mockSession";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const { view } = await searchParams;
  const demoLogin = (await cookies()).get(DEMO_LOGIN_COOKIE)?.value;
  const session = getMockSession(view, demoLogin);

  if (session.status === "guest") {
    return <GuestHome />;
  }

  return (
    <MemberHome
      // 시나리오가 바뀌면 화면 상태를 새로 시작
      key={typeof view === "string" ? view : "member"}
      userName={session.user.name}
      initialRecords={session.initialRecords}
      today={toDateKey()}
    />
  );
}
