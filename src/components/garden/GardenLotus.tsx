"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
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
export function GardenLotus({
  className,
  bloomIn = false,
}: {
  className?: string;
  /** true면 처음 화면에 보일 때 봉오리에서 활짝 피어나는 연출 (움직임 줄이기면 처음부터 활짝) */
  bloomIn?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const webgl = useClientValue(hasWebGL, true);
  const reduce = useReducedMotion();
  const playBloom = bloomIn && !reduce;
  const bloom = useMotionValue(playBloom ? 0 : 1);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const bloomed = useRef(false);
  const bloomAnimation = useRef<ReturnType<typeof animate> | null>(null);

  // 첫 렌더 뒤에 모바일로 확인되면(bloomIn이 나중에 true) 아직 피기 전이니 봉오리로 되돌린다.
  // 캔버스는 화면에 들어오기 전까지 그리지 않으므로 활짝 핀 모습이 먼저 보이지 않는다.
  useEffect(() => {
    if (playBloom && !bloomed.current) bloom.set(0);
  }, [playBloom, bloom]);

  // 준비된 꽃이 처음 화면에 들어오면 한 번 피어난다
  useEffect(() => {
    if (bloomed.current || !ready || !inView) return;
    bloomed.current = true;
    if (!playBloom) {
      bloom.set(1);
      return;
    }
    // 도중에 화면 밖으로 나가도 끝까지 핀다 (멈추면 반쯤 핀 채로 남으므로 언마운트 때만 멈춤)
    bloomAnimation.current = animate(bloom, 1, {
      delay: 0.25,
      duration: 2.4,
      ease: [0.33, 0, 0.2, 1],
    });
  }, [ready, inView, playBloom, bloom]);

  useEffect(() => () => bloomAnimation.current?.stop(), []);

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
            ownModel
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
