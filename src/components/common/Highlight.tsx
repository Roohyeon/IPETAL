import type { ReactNode } from "react";
import styles from "./Highlight.module.css";

/** 금색 밑줄 강조 (시안의 굵은 글씨 + 금색 밑줄) */
export function Highlight({ children }: { children: ReactNode }) {
  return <strong className={styles.highlight}>{children}</strong>;
}
