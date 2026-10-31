import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "olive" | "outline" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

function classes({
  variant = "primary",
  size = "md",
  block,
  className,
}: Omit<CommonProps, "children">) {
  return [styles.button, styles[variant], styles[size], block ? styles.block : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  block,
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={classes({ variant, size, block, className })}>
      {children}
    </Link>
  );
}

/** 금색 밑줄 텍스트 링크/버튼 ("+ 한 줄 메모도 남기기", "로그인" 등) */
export function TextAction({
  children,
  className,
  type = "button",
  ref,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button ref={ref} type={type} className={`${styles.textAction} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${styles.textAction} ${className ?? ""}`}>
      {children}
    </Link>
  );
}
