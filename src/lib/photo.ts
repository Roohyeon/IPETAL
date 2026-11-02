"use client";

/** 사진은 긴 변 기준 이 크기로 줄여 저장한다 (저장 공간을 아끼려고) */
const MAX_SIZE = 1080;
const QUALITY = 0.8;

/**
 * 고른 사진 파일을 줄인 JPEG data URL로 바꾼다.
 * 지금은 기록과 함께 브라우저에 저장한다. TODO: 실제 업로드 API로 교체
 */
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("사진 파일만 올릴 수 있어요.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("사진을 열 수 없어요. 다른 사진을 골라 주세요.");
  });
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 처리할 수 없어요.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}
