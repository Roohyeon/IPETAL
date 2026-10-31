import { CheckIcon } from "@/components/common/Icons";
import styles from "./KeywordChip.module.css";

type KeywordChipProps = {
  label: string;
  selected?: boolean;
  /** 최대 개수에 도달해 더 고를 수 없는 상태 */
  disabled?: boolean;
  size?: "sm" | "md";
  onToggle?: (label: string) => void;
  className?: string;
};

/**
 * 키워드 칩.
 * onToggle이 있으면 button + aria-pressed, 없으면 표시용 span.
 */
export function KeywordChip({
  label,
  selected = false,
  disabled = false,
  size = "md",
  onToggle,
  className,
}: KeywordChipProps) {
  const classNames = [
    styles.chip,
    styles[size],
    selected ? styles.selected : "",
    disabled ? styles.disabled : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {selected ? <CheckIcon size={14} className={styles.check} /> : null}
      <span>{label}</span>
    </>
  );

  if (!onToggle) {
    return <span className={classNames}>{content}</span>;
  }

  return (
    <button
      type="button"
      className={classNames}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onToggle(label);
      }}
    >
      {content}
    </button>
  );
}

/** 결과 화면 등에 쓰는 작은 표시용 태그 */
export function KeywordTag({ label, className }: { label: string; className?: string }) {
  return <span className={`${styles.tag} ${className ?? ""}`}>{label}</span>;
}
