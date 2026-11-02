/**
 * 연잎이 물 위에서 아주 미세하게 위아래로 둥둥 (3D 연잎·꽃잎과 그 위 연꽃이 같은 박자로).
 * 시간은 performance.now() 기준이라 캔버스가 달라도 박자가 맞는다.
 */
export const PAD_BOB_PERIOD = 3.8;
/** 칸마다 박자를 어긋나게 (라디안) */
export const PAD_BOB_PHASE_STEP = 1.7;
/** 위아래 폭 (연잎 모델 단위, 연잎 반지름 0.1 기준 약 4%) */
export const PAD_BOB_HEIGHT = 0.004;

/** index번째 칸의 지금 높이 비율 (-1 ~ 1) */
export function padBob(index: number, nowSeconds: number) {
  return Math.sin((nowSeconds / PAD_BOB_PERIOD) * Math.PI * 2 + index * PAD_BOB_PHASE_STEP);
}

/** 연꽃(DOM)을 연잎과 같이 움직일 때의 폭: 연꽃 높이 대비 % (연잎 둥둥 높이를 환산) */
export const LOTUS_BOB_PERCENT = 1.8;
