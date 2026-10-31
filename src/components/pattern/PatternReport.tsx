"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink, TextLink } from "@/components/common/Button";
import { useOpenRecordSheet } from "@/components/common/RecordSheet";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  LeafIcon,
  LockIcon,
  StarIcon,
} from "@/components/common/Icons";
import layout from "@/components/garden/layout.module.css";
import { LotusIcon } from "@/components/petal/LotusIcon";
import { MonthFlower } from "@/components/petal/MonthFlower";
import { MoodIcon } from "@/components/petal/MoodIcon";
import { Petal } from "@/components/petal/Petal";
import { MOOD_OPTIONS } from "@/data/moods";
import { ROUTES } from "@/data/routes";
import { daysInMonth, monthOf } from "@/lib/date";
import { mergeRecords, useSavedRecords } from "@/lib/recordRepository";
import { particle } from "@/lib/text";
import {
  buildInsights,
  countKeywords,
  countMoods,
  getPeriod,
  keywordTotal,
  PATTERN_UNLOCK_COUNT,
  recordsIn,
  topMood,
  type KeywordCount,
  type PeriodMode,
} from "@/lib/recordStats";
import type { DailyRecord } from "@/types/record";
import styles from "./PatternReport.module.css";

/** 상위 몇 개 키워드를 막대·표로 보여줄지 */
const TOP_KEYWORDS = 5;

type PatternReportProps = {
  records: DailyRecord[];
  today: string;
};

/** 나의 패턴: 주간·월간 기간을 골라 키워드·기분·함께 남은 활동을 본다. 꽃잎 7장부터 열린다. */
export function PatternReport({ records: baseRecords, today }: PatternReportProps) {
  // 데모 기록 + 이 브라우저에서 남긴 기록
  const saved = useSavedRecords();
  const records = useMemo(() => mergeRecords(baseRecords, saved), [baseRecords, saved]);
  const [mode, setMode] = useState<PeriodMode>("month");
  const [offset, setOffset] = useState(0);

  const period = getPeriod(mode, offset, today);
  const inPeriod = recordsIn(records, period);
  const earliest = records.length > 0 ? records[records.length - 1].date : today;
  const hasPrev = getPeriod(mode, offset + 1, today).end >= earliest;
  const locked = records.length < PATTERN_UNLOCK_COUNT;
  const total = keywordTotal(inPeriod);
  const nextMonth = (monthOf(today) % 12) + 1;

  const changeMode = (next: PeriodMode) => {
    setMode(next);
    setOffset(0);
  };

  return (
    <main className={layout.main}>
      <header>
        <p className={styles.eyebrow}>My Patterns</p>
        <h1 className={styles.title}>나의 패턴</h1>
        <p className={styles.lead}>꽃잎이 쌓이면 나의 하루가 보이기 시작해요.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="기간 단위">
          {(["week", "month"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={styles.tab}
              aria-pressed={mode === value}
              onClick={() => changeMode(value)}
            >
              {value === "week" ? "주간" : "월간"}
            </button>
          ))}
        </div>
        <div className={styles.period}>
          <button
            type="button"
            className={styles.periodNav}
            onClick={() => setOffset(offset + 1)}
            disabled={!hasPrev}
          >
            <ChevronLeftIcon size={18} />
            <span className="visually-hidden">이전 기간</span>
          </button>
          <p className={styles.periodLabel} aria-live="polite">
            {period.label}
          </p>
          <button
            type="button"
            className={styles.periodNav}
            onClick={() => setOffset(offset - 1)}
            disabled={offset === 0}
          >
            <ChevronRightIcon size={18} />
            <span className="visually-hidden">다음 기간</span>
          </button>
        </div>
      </div>

      <ul className={styles.stats}>
        <li>
          모인 꽃잎 <strong>{inPeriod.length}장</strong>
        </li>
        <li>
          남긴 키워드 <strong>{total}개</strong>
        </li>
        {!locked && inPeriod.length > 0 ? (
          <li>
            하루 평균 키워드 <strong>{(total / inPeriod.length).toFixed(1)}개</strong>
          </li>
        ) : null}
      </ul>

      {locked ? (
        <LockedReport records={records} today={today} scope={period.scope} nextMonth={nextMonth} />
      ) : (
        <Report records={inPeriod} all={records} scope={period.scope} nextMonth={nextMonth} />
      )}
    </main>
  );
}

function SectionHead({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <>
      <h2 id={id} className={styles.cardTitle}>
        <LotusIcon className={styles.lotus} />
        {title}
      </h2>
      <p className={styles.cardSub}>{sub}</p>
    </>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className={styles.track} aria-hidden="true">
      <span className={styles.fillBar} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </span>
  );
}

function KeywordRows({
  items,
  start = 0,
  max,
}: {
  items: KeywordCount[];
  start?: number;
  max: number;
}) {
  return (
    <ol className={styles.keywordRows} start={start + 1}>
      {items.map(({ keyword, days }, index) => (
        <li key={keyword} className={styles.keywordRow}>
          <span className={styles.rank}>{start + index + 1}</span>
          <span className={styles.keywordName}>{keyword}</span>
          <Bar value={days} max={max} />
          <span className={styles.days}>{days}일</span>
        </li>
      ))}
    </ol>
  );
}

function MoodRows({ records }: { records: DailyRecord[] }) {
  const counts = countMoods(records);
  const max = Math.max(...Object.values(counts));
  return (
    <ul className={styles.moodRows}>
      {MOOD_OPTIONS.map((option) => (
        <li key={option.value} className={styles.moodRow}>
          <span className={styles.moodName}>
            <Petal mood={option.value} width={12} sparkle={false} />
            {option.label}
          </span>
          <Bar value={counts[option.value]} max={max} />
          <span className={styles.days}>{counts[option.value]}일</span>
        </li>
      ))}
    </ul>
  );
}

/** '오늘의 꽃잎 남기기': 기록 시트를 열고, 시트가 없는 화면이면 오늘 기록으로 이동 */
function RecordButton({
  variant,
  className,
}: {
  variant: "olive" | "outline";
  className?: string;
}) {
  const openSheet = useOpenRecordSheet();
  if (openSheet) {
    return (
      <Button variant={variant} className={className} onClick={openSheet} aria-haspopup="dialog">
        오늘의 꽃잎 남기기
      </Button>
    );
  }
  return (
    <ButtonLink href={ROUTES.todayRecord} variant={variant} className={className}>
      오늘의 꽃잎 남기기
    </ButtonLink>
  );
}

function CtaBox({ nextMonth }: { nextMonth: number }) {
  return (
    <div className={styles.cta}>
      <p className={styles.ctaText}>{nextMonth}월의 꽃에는 어떤 꽃잎을 더 담고 싶나요?</p>
      <RecordButton variant="outline" className={styles.ctaButton} />
    </div>
  );
}

type ReportProps = {
  records: DailyRecord[];
  all: DailyRecord[];
  scope: string;
  nextMonth: number;
};

function Report({ records, all, scope, nextMonth }: ReportProps) {
  const [showMore, setShowMore] = useState(false);
  const keywords = countKeywords(records);
  const top = keywords.slice(0, TOP_KEYWORDS);
  const rest = keywords.slice(TOP_KEYWORDS);
  const maxDays = top[0]?.days ?? 0;
  const favorite = topMood(records);
  const insights = buildInsights(records, all);

  if (records.length === 0) {
    return (
      <section className={`${layout.glass} ${styles.card} ${styles.emptyCard}`}>
        <p className={styles.emptyTitle}>{scope}에는 남긴 꽃잎이 없어요.</p>
        <p className={styles.cardSub}>다른 기간을 고르거나, 오늘의 꽃잎을 남겨보세요.</p>
        <CtaBox nextMonth={nextMonth} />
      </section>
    );
  }

  return (
    <>
      <div className={styles.pair}>
        <section aria-labelledby="pattern-keywords" className={`${layout.glass} ${styles.card}`}>
          <SectionHead
            id="pattern-keywords"
            title="자주 남긴 키워드"
            sub={`${scope} 가장 많이 기록한 활동이에요.`}
          />
          <KeywordRows items={top} max={maxDays} />
          {rest.length > 0 ? (
            <>
              <button
                type="button"
                className={styles.more}
                aria-expanded={showMore}
                aria-controls="pattern-more-keywords"
                onClick={() => setShowMore(!showMore)}
              >
                그 외 키워드 {rest.length}개
                <ChevronDownIcon size={16} className={showMore ? styles.flip : undefined} />
              </button>
              <div id="pattern-more-keywords" hidden={!showMore}>
                <KeywordRows items={rest} start={TOP_KEYWORDS} max={maxDays} />
              </div>
            </>
          ) : null}
        </section>

        <section aria-labelledby="pattern-moods" className={`${layout.glass} ${styles.card}`}>
          <SectionHead
            id="pattern-moods"
            title={`${scope}의 기분`}
            sub={`꽃잎 ${records.length}장에 담긴 하루 느낌이에요.`}
          />
          <MoodRows records={records} />
          {favorite ? (
            <p className={styles.callout}>
              <StarIcon size={18} />
              가장 많이 남긴 느낌은 &apos;{favorite}&apos;예요.
            </p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="pattern-matrix" className={`${layout.glass} ${styles.card}`}>
        <SectionHead
          id="pattern-matrix"
          title="어떤 활동이 어떤 기분과 함께했을까?"
          sub="각 활동을 남긴 날의 하루 느낌을 모아봤어요."
        />
        <p className={styles.note}>
          <InfoIcon size={16} />
          함께 기록된 횟수를 보여줄 뿐, 원인과 결과를 뜻하지는 않아요.
        </p>
        <MoodMatrix records={records} keywords={top} />
      </section>

      <section aria-labelledby="pattern-review" className={`${layout.glass} ${styles.card}`}>
        <SectionHead
          id="pattern-review"
          title={`${scope} 돌아보기`}
          sub="모인 꽃잎에서 발견한 나의 모습이에요."
        />
        {insights.length > 0 ? (
          <ul className={styles.insights}>
            {insights.map((insight) => (
              <li key={insight.title} className={styles.insight}>
                <span className={styles.insightIcon} aria-hidden="true">
                  <LeafIcon size={18} />
                </span>
                <p className={styles.insightTitle}>{insight.title}</p>
                <p className={styles.insightBasis}>
                  <strong>근거:</strong> {insight.basis}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noInsight}>
            아직 눈에 띄는 모습이 없어요. 꽃잎이 더 모이면 알려드릴게요.
          </p>
        )}
        <CtaBox nextMonth={nextMonth} />
      </section>
    </>
  );
}

/** 표 칸 색: 함께 남은 횟수 0~5+ */
function level(count: number) {
  return styles[`level${Math.min(count, 5)}`];
}

function MoodMatrix({ records, keywords }: { records: DailyRecord[]; keywords: KeywordCount[] }) {
  const [selected, setSelected] = useState(0);
  const countFor = (keyword: string) =>
    countMoods(records.filter((record) => record.keywords.includes(keyword)));
  const current = keywords[Math.min(selected, keywords.length - 1)];

  return (
    <>
      {/* 태블릿·데스크톱: 활동 × 기분 표 */}
      <div className={styles.matrixWrap}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th scope="col" className={styles.matrixCorner}>
                활동
              </th>
              {MOOD_OPTIONS.map((option) => (
                <th key={option.value} scope="col" className={styles.matrixMood}>
                  <MoodIcon mood={option.value} size={24} />
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywords.map(({ keyword, days }) => {
              const counts = countFor(keyword);
              return (
                <tr key={keyword}>
                  <th scope="row" className={styles.matrixKeyword}>
                    <span className={styles.keywordName}>{keyword}</span>
                    <span className={styles.matrixDays}>{days}일</span>
                  </th>
                  {MOOD_OPTIONS.map((option) => (
                    <td key={option.value}>
                      <span className={`${styles.cell} ${level(counts[option.value])}`}>
                        {counts[option.value]}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className={styles.scale} aria-hidden="true">
          적음
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`${styles.swatch} ${level(n)}`} />
          ))}
          많음
        </p>
      </div>

      {/* 모바일: 활동을 하나 골라 기분 막대로 */}
      {current ? (
        <div className={styles.matrixMobile}>
          <div className={styles.keywordTabs} role="tablist" aria-label="활동">
            {keywords.map(({ keyword }, index) => (
              <button
                key={keyword}
                type="button"
                role="tab"
                aria-selected={index === selected}
                className={styles.keywordTab}
                onClick={() => setSelected(index)}
              >
                {keyword}
              </button>
            ))}
          </div>
          <div className={styles.keywordPanel} role="tabpanel">
            <p className={styles.panelTitle}>
              {current.keyword}
              {particle(current.keyword, "을/를")} 남긴 {current.days}일의 기분
            </p>
            <MoodRows
              records={records.filter((record) => record.keywords.includes(current.keyword))}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type LockedReportProps = {
  records: DailyRecord[];
  today: string;
  scope: string;
  nextMonth: number;
};

/** 꽃잎이 7장보다 적을 때: 진행도 + 흐릿한 미리보기 */
function LockedReport({ records, today, scope, nextMonth }: LockedReportProps) {
  const remaining = PATTERN_UNLOCK_COUNT - records.length;
  const keywords = countKeywords(records);
  const month = monthOf(today);
  const thisMonth = records.filter((record) => monthOf(record.date) === month);

  const lockPill = (
    <span className={styles.lockPill}>
      <LockIcon size={16} />
      꽃잎 {PATTERN_UNLOCK_COUNT}장부터 열려요
    </span>
  );

  return (
    <>
      <section
        aria-labelledby="pattern-locked"
        className={`${layout.glass} ${styles.card} ${styles.progressCard}`}
      >
        <MonthFlower
          total={daysInMonth(today)}
          filledMoods={thisMonth.map((record) => record.mood).reverse()}
          badge={`${month}월`}
          className={styles.progressFlower}
        />
        <div className={styles.progressBody}>
          <h2 id="pattern-locked" className={styles.progressTitle}>
            패턴을 찾기엔 아직 꽃잎이 조금 부족해요
          </h2>
          <p className={styles.cardSub}>
            꽃잎 {PATTERN_UNLOCK_COUNT}장이 모이면 나만의 패턴을 알려드려요. 지금처럼 가볍게 이어가
            주세요.
          </p>
          <div className={styles.progressMeta}>
            <span>
              <strong>{records.length}</strong> / {PATTERN_UNLOCK_COUNT}장
            </span>
            <span>{remaining}장 남았어요</span>
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="패턴 리포트까지 모인 꽃잎"
            aria-valuemin={0}
            aria-valuemax={PATTERN_UNLOCK_COUNT}
            aria-valuenow={records.length}
          >
            <span style={{ width: `${(records.length / PATTERN_UNLOCK_COUNT) * 100}%` }} />
          </div>
          <div className={styles.progressActions}>
            <RecordButton variant="olive" />
            <TextLink href={ROUTES.garden}>나의 정원 보러 가기</TextLink>
          </div>
        </div>
      </section>

      <div className={styles.pair}>
        <section aria-labelledby="locked-keywords" className={`${layout.glass} ${styles.card}`}>
          <SectionHead
            id="locked-keywords"
            title="자주 남긴 키워드"
            sub={`${scope} 가장 많이 기록한 활동이에요.`}
          />
          {keywords.length > 0 ? (
            <>
              <p className={styles.soFar}>지금까지 남긴 키워드</p>
              <ul className={styles.soFarList}>
                {keywords.map(({ keyword }) => (
                  <li key={keyword} className={styles.keywordName}>
                    {keyword}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className={styles.skeleton}>
            {[100, 78, 60, 52, 40].map((width) => (
              <span key={width} className={styles.skeletonRow}>
                <span />
                <span />
                <span>
                  <span style={{ width: `${width}%` }} />
                </span>
                <span />
              </span>
            ))}
            {lockPill}
          </div>
        </section>

        <section aria-labelledby="locked-moods" className={`${layout.glass} ${styles.card}`}>
          <SectionHead
            id="locked-moods"
            title={`${scope}의 기분`}
            sub="꽃잎에 담긴 하루 느낌이에요."
          />
          <div className={styles.skeleton}>
            {[40, 100, 46, 40, 20].map((width, index) => (
              <span key={index} className={`${styles.skeletonRow} ${styles.skeletonMood}`}>
                <span />
                <span>
                  <span style={{ width: `${width}%` }} />
                </span>
                <span />
              </span>
            ))}
            {lockPill}
          </div>
        </section>
      </div>

      <section aria-labelledby="locked-matrix" className={`${layout.glass} ${styles.card}`}>
        <SectionHead
          id="locked-matrix"
          title="어떤 활동이 어떤 기분과 함께했을까?"
          sub="각 활동을 남긴 날의 하루 느낌을 모아봤어요."
        />
        <p className={styles.note}>
          <InfoIcon size={16} />
          함께 기록된 횟수를 보여줄 뿐, 원인과 결과를 뜻하지는 않아요.
        </p>
        <div className={`${styles.skeleton} ${styles.skeletonGrid}`}>
          {Array.from({ length: 36 }, (_, i) => (
            <span key={i} className={i % 6 === 0 || i < 6 ? styles.skeletonHead : undefined} />
          ))}
          {lockPill}
        </div>
      </section>

      <section aria-labelledby="locked-review" className={`${layout.glass} ${styles.card}`}>
        <SectionHead
          id="locked-review"
          title={`${scope} 돌아보기`}
          sub="모인 꽃잎에서 발견한 나의 모습이에요."
        />
        <div className={`${styles.skeleton} ${styles.skeletonInsights}`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={styles.skeletonInsight}>
              <span />
              <span />
              <span />
            </span>
          ))}
          {lockPill}
        </div>
        <CtaBox nextMonth={nextMonth} />
      </section>
    </>
  );
}
