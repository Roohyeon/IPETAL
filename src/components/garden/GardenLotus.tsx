"use client";

import { useMotionValue } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { hasWebGL, useClientValue } from "@/lib/useClientValue";
import styles from "./GardenLotus.module.css";

// WebGL은 서버에 없으므로 클라이언트에서만 불러온다
const LotusScene = dynamic(() => import("@/components/three/LotusScene"), { ssr: false });

/**
 * 정원에 핀 그 달의 꽃: Hero와 같은 3D 연꽃을 활짝 핀 상태로 보여준다.
 * 누르면 달력이 열리므로 돌려보기는 끄고, 화면 밖이면 렌더링을 멈춘다.
 * WebGL 미지원이면 연꽃 이미지로 대체한다.
 */
export function GardenLotus({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const webgl = useClientValue(hasWebGL, true);
  const bloom = useMotionValue(1);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "120px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`${styles.wrap} ${className ?? ""}`} aria-hidden="true">
      {webgl ? (
        <span className={`${styles.scene} ${ready ? styles.ready : ""}`}>
          <LotusScene
            bloom={bloom}
            active={inView}
            interactive={false}
            compact
            onReady={() => setReady(true)}
          />
        </span>
      ) : (
        <Image
          src="/images/hero-lotus.png"
          alt=""
          width={488}
          height={368}
          sizes="150px"
          className={styles.image}
        />
      )}
    </span>
  );
}
