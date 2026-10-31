import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

type LogoProps = {
  /** 링크 없이 표시만 (푸터 등) */
  asLink?: boolean;
  className?: string;
};

export function Logo({ asLink = true, className }: LogoProps) {
  const content = (
    <>
      <Image
        src="/images/logo-mark.png"
        alt=""
        width={216}
        height={256}
        className={styles.mark}
        sizes="40px"
      />
      <span className={styles.word}>IPETAL</span>
    </>
  );

  if (!asLink) {
    return <span className={`${styles.logo} ${className ?? ""}`}>{content}</span>;
  }

  return (
    <Link href="/" className={`${styles.logo} ${className ?? ""}`} aria-label="IPETAL 홈">
      {content}
    </Link>
  );
}
