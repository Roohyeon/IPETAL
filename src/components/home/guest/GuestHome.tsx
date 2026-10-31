import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { MobileTabBar } from "@/components/common/MobileTabBar";
import { RecordSheetProvider } from "@/components/common/RecordSheetProvider";
import { toDateKey } from "@/lib/date";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { AboutSection } from "./AboutSection";
import { DailyGuideSection } from "./DailyGuideSection";
import { FaqSection } from "./FaqSection";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { PatternPreviewSection } from "./PatternPreviewSection";
import styles from "./GuestHome.module.css";

/** 로그인 전 HOME (모바일은 첫 화면만: 바로 시작하기) */
export function GuestHome() {
  return (
    <RecordSheetProvider today={toDateKey()}>
      <div className={styles.page}>
        <a href="#main" className={styles.skip}>
          본문으로 건너뛰기
        </a>
        <Header variant="guest" />
        <main id="main" tabIndex={-1} className={styles.main}>
          <Hero />
          <div className={styles.sections}>
            <AboutSection />
            <DailyGuideSection />
            <PatternPreviewSection />
            <FaqSection />
            <FinalCta />
          </div>
        </main>
        {/* 푸터는 데스크톱에서만. 모바일·태블릿은 하단 탭 */}
        <div className={styles.footer}>
          <Footer variant="full" />
        </div>
        <MobileTabBar showOnTablet />
        <RevealOnScroll selector="#main section:not(#top)" />
      </div>
    </RecordSheetProvider>
  );
}
