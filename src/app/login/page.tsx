import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { ChevronLeftIcon } from "@/components/common/Icons";
import { Logo } from "@/components/common/Logo";
import { ROUTES } from "@/data/routes";
import { demoLogin } from "./actions";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인 — IPETAL" };

/** 로그인 (시안 없음, 체험 로그인). 버튼을 누르면 로그인 후 HOME으로 간다. */
export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.decor} aria-hidden="true">
        <Image
          src="/images/decor-lotus.png"
          alt=""
          width={360}
          height={245}
          className={styles.d1}
        />
        <Image src="/images/decor-leaf.png" alt="" width={360} height={234} className={styles.d2} />
      </div>

      <header className={styles.top}>
        <Link href={ROUTES.home} className={styles.back}>
          <ChevronLeftIcon size={20} />
          <span className="visually-hidden">홈으로</span>
        </Link>
        <Logo />
      </header>

      <main className={styles.main}>
        <section aria-labelledby="login-title" className={styles.card}>
          <h1 id="login-title" className={styles.title}>
            다시 만나서 반가워요
          </h1>
          <p className={styles.lead}>로그인하고 오늘의 꽃잎을 남겨보세요.</p>

          <form action={demoLogin} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>이메일</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="petal@example.com"
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>비밀번호</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="비밀번호"
                className={styles.input}
              />
            </label>
            <Button type="submit" variant="olive" size="lg" block className={styles.submit}>
              로그인
            </Button>
          </form>

          <p className={styles.note}>
            아직 실제 로그인은 준비 중이에요. 버튼을 누르면 체험 계정 &apos;지민&apos;으로 둘러볼 수
            있어요.
          </p>
        </section>
      </main>
    </div>
  );
}
