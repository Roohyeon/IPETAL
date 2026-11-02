"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

/**
 * 나의 정원 배경의 시간대 분위기 (휴대폰의 현재 시각 기준).
 * 아침 → 낮 → 저녁 → 밤이 1~1.5시간에 걸쳐 서서히 섞인다.
 *
 * 배경 위에 두 겹을 덧입힌다
 * - multiply: 물들이고 어둡게 (저녁 노을빛, 밤의 푸른 어둠)
 * - screen: 빛을 더한다 (아침 햇살, 저녁 금빛)
 * 연잎·연꽃(scene)은 밤에 조금 어둡게, 반딧불은 밤일수록 또렷하게.
 */
type RGB = [number, number, number];

type Grade = {
  multiply: RGB;
  multiplyOpacity: number;
  screen: RGB;
  screenOpacity: number;
  /** 연잎·연꽃 밝기 (1 = 그대로) */
  scene: number;
  /** 반딧불 세기 (0~1) */
  fireflies: number;
};

const MORNING: Grade = {
  multiply: [255, 236, 214],
  multiplyOpacity: 0.3,
  screen: [255, 244, 222],
  screenOpacity: 0.16,
  scene: 1.02,
  fireflies: 0.5,
};

const DAY: Grade = {
  multiply: [255, 255, 255],
  multiplyOpacity: 0,
  screen: [255, 255, 255],
  screenOpacity: 0,
  scene: 1,
  fireflies: 0.65,
};

const EVENING: Grade = {
  multiply: [246, 172, 168],
  multiplyOpacity: 0.42,
  screen: [255, 196, 120],
  screenOpacity: 0.2,
  scene: 0.93,
  fireflies: 0.85,
};

const NIGHT: Grade = {
  multiply: [38, 56, 104],
  multiplyOpacity: 0.62,
  screen: [70, 92, 150],
  screenOpacity: 0.06,
  scene: 0.72,
  fireflies: 1,
};

/** 시각(0~24시) → 분위기. 사이 시간은 앞뒤 분위기를 섞는다 */
const KEYFRAMES: [number, Grade][] = [
  [0, NIGHT],
  [4.5, NIGHT],
  [6, MORNING],
  [9, MORNING],
  [10.5, DAY],
  [16.5, DAY],
  [18, EVENING],
  [19.5, EVENING],
  [21, NIGHT],
  [24, NIGHT],
];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];

function gradeAt(hour: number): Grade {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const [h0, g0] = KEYFRAMES[i];
    const [h1, g1] = KEYFRAMES[i + 1];
    if (h < h0 || h > h1) continue;
    // 부드럽게 넘어가도록 smoothstep
    const linear = h1 === h0 ? 0 : (h - h0) / (h1 - h0);
    const t = linear * linear * (3 - 2 * linear);
    return {
      multiply: mixRgb(g0.multiply, g1.multiply, t),
      multiplyOpacity: mix(g0.multiplyOpacity, g1.multiplyOpacity, t),
      screen: mixRgb(g0.screen, g1.screen, t),
      screenOpacity: mix(g0.screenOpacity, g1.screenOpacity, t),
      scene: mix(g0.scene, g1.scene, t),
      fireflies: mix(g0.fireflies, g1.fireflies, t),
    };
  }
  return DAY;
}

/** 개발 중 미리보기: ?tod=morning | day | evening | night | 0~24 숫자 */
const PREVIEW: Record<string, number> = { morning: 7.5, day: 13, evening: 18.75, night: 23 };

function readHour(): number {
  if (process.env.NODE_ENV === "development") {
    const preview = new URLSearchParams(window.location.search).get("tod");
    if (preview) {
      const value = PREVIEW[preview] ?? Number(preview);
      if (Number.isFinite(value)) return value;
    }
  }
  const now = new Date();
  // 3분 단위로 끊어 같은 값이면 다시 그리지 않는다
  return Math.round((now.getHours() + now.getMinutes() / 60) * 20) / 20;
}

function subscribeMinute(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/** 지금 시각(0~24). 서버·첫 하이드레이션에서는 낮(13시) */
function useHour(): number {
  return useSyncExternalStore(subscribeMinute, readHour, () => 13);
}

const rgb = ([r, g, b]: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

/** 시간대 분위기를 CSS 변수로 (나의 정원 main에 걸어 둔다) */
export function useTimeOfDayStyle(): CSSProperties {
  const grade = gradeAt(useHour());
  return {
    "--tod-multiply": rgb(grade.multiply),
    "--tod-multiply-opacity": grade.multiplyOpacity.toFixed(3),
    "--tod-screen": rgb(grade.screen),
    "--tod-screen-opacity": grade.screenOpacity.toFixed(3),
    "--tod-scene": grade.scene.toFixed(3),
    "--tod-fireflies": grade.fireflies.toFixed(3),
  } as CSSProperties;
}
