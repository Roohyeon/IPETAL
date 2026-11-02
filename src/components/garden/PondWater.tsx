"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./GardenOverview.module.css";

// WebGL은 서버에 없으므로 클라이언트에서만 불러온다
const PondWaterScene = dynamic(() => import("@/components/three/PondWaterScene"), { ssr: false });

/** 모바일 나의 정원 배경: 연못 그림이 물결처럼 일렁인다. 준비되면 서서히 나타나 정지 그림을 덮는다 */
export function PondWater({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  return (
    <div className={`${styles.water} ${ready ? styles.waterReady : ""}`}>
      <PondWaterScene src={src} onReady={() => setReady(true)} />
    </div>
  );
}
