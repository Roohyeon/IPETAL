import type { ReactNode } from "react";
import { Highlight } from "@/components/common/Highlight";
import { CheckIcon } from "@/components/common/Icons";
import { ExampleBadge, SectionHeading } from "@/components/common/SectionHeading";
import { AddKeywordChip } from "@/components/petal/AddKeywordChip";
import { KeywordChip, KeywordTag } from "@/components/petal/KeywordChip";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { PetalBurst } from "@/components/petal/PetalBurst";
import { GUIDE_EXAMPLE_KEYWORDS } from "@/data/keywords";
import { MOOD_OPTIONS } from "@/data/moods";
import { TIRED_DAY } from "@/data/recommendations";
import { GuideCarousel } from "./GuideCarousel";
import layout from "./section.module.css";
import styles from "./DailyGuideSection.module.css";

type GuideStep = { title: string; body: ReactNode; example: ReactNode };

const STEPS: GuideStep[] = [
  {
    title: "오늘 한 일 고르기",
    body: (
      <>
        산책, 야근, 친구와 저녁처럼 오늘 한 일을 키워드로 골라요.{" "}
        <Highlight>3개 정도면 충분하고</Highlight>, 목록에 없는 활동은 직접 적을 수 있어요.
      </>
    ),
    example: (
      <>
        <p className={styles.exampleQuestion}>
          오늘은 무엇을 하며 보냈나요? <span className={styles.exampleCount}>2 / 5</span>
        </p>
        <div className={styles.chips}>
          {GUIDE_EXAMPLE_KEYWORDS.map((keyword) => (
            <KeywordChip
              key={keyword.label}
              label={keyword.label}
              selected={keyword.selected}
              size="sm"
              className={keyword.desktopOnly ? styles.desktopOnly : undefined}
            />
          ))}
          <AddKeywordChip static size="sm" />
        </div>
      </>
    ),
  },
  {
    title: "하루 느낌 고르기",
    body: (
      <>
        다섯 가지 표정 중 오늘과 <Highlight>가장 가까운 하나를 골라요</Highlight>. 고른 기분에 따라
        꽃잎의 명도가 달라져요.
      </>
    ),
    example: (
      <>
        <p className={`${styles.exampleQuestion} ${styles.desktopOnlyBlock}`}>
          오늘은 어떤 하루였나요?
        </p>
        <div className={styles.moods}>
          {MOOD_OPTIONS.map((option) => {
            const selected = option.value === "good";
            return (
              <span
                key={option.value}
                className={`${styles.mood} ${selected ? styles.moodSelected : ""}`}
              >
                {selected ? (
                  <span className={styles.moodCheck}>
                    <CheckIcon size={11} />
                  </span>
                ) : null}
                <MoodIcon mood={option.value} tinted className={styles.moodIcon} />
                <span className={styles.moodLabel}>{option.label}</span>
              </span>
            );
          })}
        </div>
      </>
    ),
  },
  {
    title: "꽃잎 받기",
    body: (
      <>
        &apos;오늘의 꽃잎 남기기&apos;를 누르면 <Highlight>꽃잎 한 장이 피어나</Highlight> 이번 달의
        꽃에 붙어요.
      </>
    ),
    example: (
      <div className={styles.receive}>
        <PetalBurst mood="good" variant="sparkles" className={styles.burst} />
        <p className={styles.receiveTitle}>꽃잎을 얻었어요!</p>
        <div className={styles.receiveTags}>
          <KeywordTag label="산책" />
          <KeywordTag label="카페" />
          <span className={styles.receiveMood}>좋았어요</span>
        </div>
      </div>
    ),
  },
  {
    title: "마음 채우기 추천 보기",
    body: (
      <>
        고른 활동과 기분을 보고, <Highlight>오늘 마음을 채워줄 작은 일을 추천해드려요</Highlight>.
        친구 만나기, 드라이브, 백색소음, 힐링 게임처럼요.
      </>
    ),
    example: (
      <>
        <p className={styles.fillLabel}>오늘의 마음 채우기</p>
        <p className={styles.fillTitle}>{TIRED_DAY.title}</p>
        <p className={styles.fillMeta}>고른 내용 · 야근 · 지쳤어요</p>
        <ul className={styles.recos}>
          {TIRED_DAY.items.map((item) => (
            <li key={item.title} className={styles.reco}>
              <span className={styles.recoTag}>{item.tag}</span>
              <p className={styles.recoTitle}>{item.title}</p>
              <p className={styles.recoBody}>{item.description}</p>
            </li>
          ))}
        </ul>
      </>
    ),
  },
];

/** 이용 안내 (예시 화면) */
export function DailyGuideSection() {
  return (
    <section id="guide" aria-labelledby="guide-title" className={styles.section}>
      <div className={layout.container}>
        <SectionHeading
          lotus
          id="guide-title"
          eyebrow="Daily Guide"
          label="이용 안내"
          title="하루 1분, 이렇게 기록해요"
          description={
            <>
              가입하면 매일 홈 화면에서 <Highlight>바로 오늘의 꽃잎을 남길 수 있어요</Highlight>.
            </>
          }
        />

        <GuideCarousel
          slides={STEPS.map((step, index) => ({
            key: step.title,
            label: step.title,
            content: (
              <>
                <div className={styles.text}>
                  <span className={styles.number} aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className={styles.stepTitle}>
                    <span className="visually-hidden">{`${index + 1}단계. `}</span>
                    {step.title}
                  </h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
                <figure className={styles.example}>
                  <figcaption className={styles.badge}>
                    <ExampleBadge />
                  </figcaption>
                  <div className={styles.exampleBody}>{step.example}</div>
                </figure>
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
