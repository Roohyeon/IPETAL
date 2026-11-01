"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_LOGIN_COOKIE } from "@/lib/mockSession";

/** 체험 로그인: 실제 인증 없이 로그인 후 HOME을 보여준다. TODO: 실제 로그인 연결 */
export async function demoLogin() {
  (await cookies()).set(DEMO_LOGIN_COOKIE, "member", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

/** 로그아웃: 체험 로그인 쿠키를 지우고 로그인 전 HOME으로. TODO: 실제 로그아웃 연결 */
export async function logout() {
  (await cookies()).delete(DEMO_LOGIN_COOKIE);
  redirect("/");
}
