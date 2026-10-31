import { Highlight } from "@/components/common/Highlight";
import { ExampleBadge, SectionHeading } from "@/components/common/SectionHeading";
import { KeywordBars } from "./KeywordBars";
import layout from "./section.module.css";
import styles from "./PatternPreviewSection.module.css";

const TOP_KEYWORDS = [
  { label: "산책", days: 9 },
  { label: "카페", days: 7 },
  { label: "야근", days: 6 },
];
const MAX_DAYS = 9;

/** 패턴 리포트 미리보기 */
export function PatternPreviewSection() {
  return (
    <section aria-labelledby="pattern-title" className={styles.section}>
      <div className={layout.container}>
        <SectionHeading
          lotus
          id="pattern-title"
          eyebrow="My Patterns"
          label="패턴 리포트"
          title="쌓인 꽃잎이 이런 이야기를 들려줘요"
        />

        <div className={styles.cards}>
          <article className={styles.card} aria-labelledby="pattern-keywords">
            <span className={styles.badge}>
              <ExampleBadge />
            </span>
            <h3 id="pattern-keywords" className={styles.cardTitle}>
              자주 남긴 키워드
            </h3>
            <KeywordBars items={TOP_KEYWORDS} max={MAX_DAYS} />
          </article>

          <article className={styles.card} aria-labelledby="pattern-month">
            <span className={styles.badge}>
              <ExampleBadge />
            </span>
            <h3 id="pattern-month" className={styles.cardTitle}>
              이번 달 돌아보기
            </h3>
            <div className={styles.link} aria-hidden="true">
              <span className={styles.linkKeyword}>산책</span>
              <svg className={styles.linkLine} viewBox="0 0 70 16" focusable="false">
                <path d="M1 9C12 15 22 12 34 8S56 1 69 10" />
                <circle cx="34" cy="8.3" r="2.4" />
              </svg>
              <span className={styles.linkMood}>좋았어요</span>
            </div>
            <p className={styles.insight}>
              &apos;산책&apos;을 남긴 날은 대부분 기분 좋은 하루였어요.
            </p>
            <p className={styles.evidence}>
              <span className={styles.evidenceTag}>근거</span>
              <span>
                산책을 기록한 9일 중 7일이 &apos;최고였어요&apos; 또는 &apos;좋았어요&apos;
              </span>
            </p>
          </article>
        </div>

        <p className={styles.note}>
          <Highlight>꽃잎 7장이 모이면</Highlight> 패턴 리포트가 열려요. 보여드리는 내용은 모두{" "}
          <Highlight>내 기록에서 계산한 사실</Highlight>이에요.
        </p>
      </div>
    </section>
  );
}
