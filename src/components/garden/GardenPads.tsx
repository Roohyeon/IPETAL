"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { GardenSpot } from "@/components/three/GardenPadsScene";
import styles from "./GardenOverview.module.css";

// WebGL은 서버에 없으므로 클라이언트에서만 불러온다
const GardenPadsScene = dynamic(() => import("@/components/three/GardenPadsScene"), {
  ssr: false,
});

/** 2D 연잎(LilyPad)과 같은 자리: 칸 너비의 82%, 연잎 중심은 칸 높이의 57.5% */
const PAD_WIDTH = 0.82;
const PAD_CENTER_Y = 0.575;

/** 격자 안 각 칸([data-pond])의 위치를 캔버스 기준으로 재서 3D 장면에 넘긴다 */
function measure(grid: HTMLElement, canvas: HTMLElement): GardenSpot[] {
  const base = canvas.getBoundingClientRect();
  return [...grid.querySelectorAll<HTMLElement>("[data-pond]")].map((pond) => {
    const rect = pond.getBoundingClientRect();
    const tilt = pond.dataset.petalTilt;
    return {
      x: rect.left - base.left + rect.width / 2,
      y: rect.top - base.top + rect.height * PAD_CENTER_Y,
      size: rect.width * PAD_WIDTH,
      petalTilt: tilt === undefined ? null : Number(tilt),
      current: pond.dataset.current !== undefined,
    };
  });
}

/**
 * 나의 정원(모바일): 2D 연잎·꽃잎 대신 3D 연잎·꽃잎을 격자 뒤에 깐다.
 * 모델이 준비되면 onReady → 2D 그림을 숨긴다. 화면 밖이면 렌더링을 멈춘다.
 */
export function GardenPads({
  gridRef,
  onReady,
}: {
  gridRef: RefObject<HTMLElement | null>;
  onReady: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<GardenSpot[]>([]);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const grid = gridRef.current;
    const canvas = ref.current;
    if (!grid || !canvas) return;
    const update = () => setSpots(measure(grid, canvas));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.pads3d} aria-hidden="true">
      {spots.length > 0 ? (
        <GardenPadsScene spots={spots} active={inView} onReady={onReady} />
      ) : null}
    </div>
  );
}
