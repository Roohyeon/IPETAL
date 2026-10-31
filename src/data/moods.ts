import type { Mood, MoodOption } from "@/types/record";

export const MOOD_OPTIONS: MoodOption[] = [
  { value: "best", label: "최고였어요" },
  { value: "good", label: "좋았어요" },
  { value: "okay", label: "그저 그랬어요" },
  { value: "tired", label: "지쳤어요" },
  { value: "hard", label: "힘들었어요" },
];

export function moodLabel(mood: Mood): string {
  return MOOD_OPTIONS.find((option) => option.value === mood)?.label ?? "";
}
