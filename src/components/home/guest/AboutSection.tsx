import type { ReactNode } from "react";
import { Highlight } from "@/components/common/Highlight";
import { ClockIcon, DocumentIcon, QuestionIcon } from "@/components/common/Icons";
import { SectionHeading } from "@/components/common/SectionHeading";
import layout from "./section.module.css";
import styles from "./AboutSection.module.css";

const PAINS: { icon: ReactNode; title: string; body: ReactNode }[] = [
  {
    icon: <ClockIcon />,
    title: "바빠서 그냥 지나가요",
    body: (
      <>
        정신없이 보낸 하루, <Highlight>무엇을 했는지 떠올릴 새도 없이</Highlight> 잠들어요.
      </>
    ),
  },
  {
    icon: <DocumentIcon />,
    title: "일기는 부담스러워요",
    body: (
      <>
        매일 긴 글을 쓰려니 <Highlight>며칠 만에 멈추게</Highlight> 돼요.
      </>
    ),
  },
  {
    icon: <QuestionIcon />,
    title: "써도 남는 게 없어요",
    body: (
      <>
        기록은 쌓이는데, 그게 나에 대해 <Highlight>무엇을 말해주는지는 모르겠어요</Highlight>.
      </>
    ),
  },
];

/** 문제 공감 */
export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className={styles.section}>
      <div className={layout.container}>
        <SectionHeading
          lotus
          id="about-title"
          eyebrow="About"
          label="소개"
          title="하루를 돌아볼 틈, 있으셨나요?"
        />

        <ul className={styles.cards}>
          {PAINS.map((pain) => (
            <li key={pain.title} className={styles.card}>
              <span className={styles.icon}>{pain.icon}</span>
              <h3 className={styles.cardTitle}>{pain.title}</h3>
              <p className={styles.cardBody}>{pain.body}</p>
            </li>
          ))}
        </ul>

        <div className={styles.closing}>
          <svg className={styles.wave} viewBox="0 0 194 12" aria-hidden="true" focusable="false">
            <path d="M1 6.5C30 12 60 10.5 97 6S165 0.5 193 6" />
          </svg>
          <p className={styles.closingText}>
            그래서 IPETAL은 <Highlight>쓰는 대신 고르게</Highlight> 했어요.
          </p>
        </div>
      </div>
    </section>
  );
}
