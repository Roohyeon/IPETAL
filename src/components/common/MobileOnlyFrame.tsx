"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { MOBILE_ONLY, MOBILE_ONLY_CLASS, MOBILE_ONLY_QUERY } from "@/lib/mobileOnly";
import styles from "./MobileOnlyFrame.module.css";

const MESSAGE = "ipetal:url";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOBILE_ONLY_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** 넓은 화면의 맨 바깥 창일 때만 모바일 창으로 감싼다 (창 안쪽은 폭이 좁아 그대로 모바일) */
function readFramed() {
  return MOBILE_ONLY && window.self === window.top && window.matchMedia(MOBILE_ONLY_QUERY).matches;
}

function currentHref() {
  return window.location.pathname + window.location.search + window.location.hash;
}

/**
 * 임시 모바일 전용 보기 (src/lib/mobileOnly.ts의 MOBILE_ONLY로 끄고 켠다).
 * - 넓은 화면: 사이트 대신 가운데 모바일 폭 창을 보여 주고, 그 안에 같은 주소를 띄운다
 * - 모바일 창 안: 지금 주소를 바깥 창에 알려 주소창·새로고침이 맞게 한다
 */
export function MobileOnlyFrame({ children }: { children: React.ReactNode }) {
  const framed = useSyncExternalStore(subscribe, readFramed, () => false);

  // 개발 모드에서 React가 <html> 클래스를 지워도 다시 맞춘다
  useLayoutEffect(() => {
    if (!MOBILE_ONLY) return;
    document.documentElement.classList.toggle(MOBILE_ONLY_CLASS, framed);
  }, [framed]);

  useEffect(() => {
    if (!MOBILE_ONLY || window.self === window.top) return;
    let last = "";
    const report = () => {
      const href = currentHref();
      if (href === last) return;
      last = href;
      window.parent.postMessage(
        { type: MESSAGE, href, title: document.title },
        window.location.origin,
      );
    };
    report();
    const timer = window.setInterval(report, 300);
    return () => window.clearInterval(timer);
  }, []);

  if (!framed) return children;
  return <FrameShell />;
}

function FrameShell() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [src] = useState(currentHref);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; href?: string; title?: string } | null;
      if (data?.type !== MESSAGE || typeof data.href !== "string") return;
      if (data.href !== currentHref()) window.history.replaceState(null, "", data.href);
      if (data.title) document.title = data.title;
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className={styles.shell} data-mobile-frame="">
      <iframe ref={frameRef} src={src} title="IPETAL" className={styles.frame} />
    </div>
  );
}
