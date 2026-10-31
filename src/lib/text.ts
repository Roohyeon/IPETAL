const ORDINALS = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

/** 1 → "첫 번째", 2 → "두 번째", 11 → "11번째" */
export function koreanOrdinal(n: number): string {
  if (n >= 1 && n <= ORDINALS.length) return `${ORDINALS[n - 1]} 번째`;
  return `${n}번째`;
}

type ParticlePair = "을/를" | "이/가" | "은/는" | "와/과";

/** 앞 글자의 받침에 맞는 조사. particle("산책", "을/를") → "을" */
export function particle(word: string, pair: ParticlePair): string {
  const [withFinal, withoutFinal] = pair.split("/");
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return hasFinal ? withFinal : withoutFinal;
}
