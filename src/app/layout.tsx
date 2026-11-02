import type { Metadata, Viewport } from "next";
import { Caladea, Carlito, Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import { MobileOnlyFrame } from "@/components/common/MobileOnlyFrame";
import { MOBILE_ONLY, MOBILE_ONLY_SCRIPT } from "@/lib/mobileOnly";
import "@/styles/globals.css";

// 영문 본문 (Calibri와 같은 메트릭)
const carlito = Carlito({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-carlito",
});

// 한글 본문: Noto Sans KR (한글 글리프는 unicode-range로 나눠 필요한 조각만 받는다)
const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-noto-kr",
});

// 영문 장식 세리프 (Cambria와 같은 메트릭)
const caladea = Caladea({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caladea",
});

// 한글 제목 세리프: Gowun Batang Bold에서 KS X 1001 한글 2,350자 + 영문만 남긴 파일
// (OFL, src/styles/fonts/GowunBatang-OFL.txt). 목록 밖 글자는 바탕체로 대체된다.
const gowunBatang = localFont({
  src: "../styles/fonts/gowun-batang-bold-ksx.woff2",
  weight: "700",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  variable: "--font-gowun",
});

// IPETAL 워드마크: ZCOOL XiaoWei에서 영문 대문자만 남긴 파일 (OFL, src/styles/fonts/ZCOOL-OFL.txt)
const zcool = localFont({
  src: "../styles/fonts/zcool-xiaowei-caps.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-zcool",
});

// 태블릿 메뉴의 "Daily Petal" 장식 글씨: Pinyon Script에서 해당 글자만 남긴 파일 (OFL)
const pinyon = localFont({
  src: "../styles/fonts/pinyon-script-daily-petal.woff2",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "IPETAL — 하루 1분 라이프로그",
  description:
    "오늘 한 일과 기분만 고르면 하루가 꽃잎이 돼요. 꽃잎이 모여 한 달의 꽃이 피고, 꽃이 모인 정원이 나의 생활을 알려줘요.",
};

export const viewport: Viewport = {
  themeColor: "#fdfbfa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${carlito.variable} ${notoSansKr.variable} ${caladea.variable} ${gowunBatang.variable} ${zcool.variable} ${pinyon.variable}`}
      suppressHydrationWarning
    >
      {MOBILE_ONLY ? (
        <head>
          <script dangerouslySetInnerHTML={{ __html: MOBILE_ONLY_SCRIPT }} />
        </head>
      ) : null}
      <body>
        <MobileOnlyFrame>{children}</MobileOnlyFrame>
      </body>
    </html>
  );
}
