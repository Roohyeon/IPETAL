import { ButtonLink, TextLink } from "@/components/common/Button";
import { Highlight } from "@/components/common/Highlight";
import { ROUTES } from "@/data/routes";
import styles from "./FinalCta.module.css";

/** 마지막 CTA */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className={styles.section}>
      <svg
        className={styles.wave}
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 35C250 18 470 33 700 30S1000 2 1100 2S1330 12 1440 30" />
      </svg>
      <div className={styles.inner}>
        <p className={styles.en}>Begin your garden</p>
        <h2 id="cta-title" className={styles.title}>
          오늘 하루, 꽃잎 한 장으로 남겨볼까요?
        </h2>
        <p className={styles.body}>
          지나가버린 하루들이 모여 <Highlight>나를 알려줄 거예요</Highlight>.
        </p>
        {/* TODO: 시작하기(회원가입) 경로 연결 */}
        <ButtonLink href={ROUTES.signup} variant="olive" size="lg" className={styles.button}>
          시작하기
        </ButtonLink>
        <p className={styles.login}>
          이미 계정이 있나요? {/* TODO: 로그인 경로 연결 */}
          <TextLink href={ROUTES.login}>로그인</TextLink>
        </p>
      </div>
    </section>
  );
}
