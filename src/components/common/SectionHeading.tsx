import type { ReactNode } from "react";
import { LotusIcon } from "@/components/petal/LotusIcon";
import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  label: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** 제목 앞 작은 연꽃 아이콘 */
  lotus?: boolean;
  /** PC에서 한글 라벨 숨김 */
  hideLabelOnDesktop?: boolean;
};

/** 영문 이탤릭 + 한글 라벨 + 제목 */
export function SectionHeading({
  id,
  eyebrow,
  label,
  title,
  description,
  align = "left",
  lotus = false,
  hideLabelOnDesktop = false,
}: SectionHeadingProps) {
  return (
    <div className={`${styles.heading} ${align === "center" ? styles.center : ""}`}>
      <p className={styles.eyebrow}>
        <span className={styles.en}>{eyebrow}</span>
        <span className={`${styles.ko} ${hideLabelOnDesktop ? styles.koDesktopHidden : ""}`}>
          {label}
        </span>
      </p>
      <h2 id={id} className={styles.title}>
        {lotus ? <LotusIcon className={styles.lotus} /> : null}
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}

export function ExampleBadge() {
  return <span className={styles.badge}>예시 화면</span>;
}
