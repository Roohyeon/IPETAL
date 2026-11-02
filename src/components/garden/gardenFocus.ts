/**
 * 달력에서 '정원으로' 돌아갈 때 나의 정원이 이번 달 쪽으로 스크롤되게 하는 표시.
 * (같은 탭에서 한 번만 쓰고 지운다)
 */
const KEY = "ipetal:garden-focus-current";

export function requestGardenFocus() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // 저장소를 못 쓰면 스크롤 없이 이동할 뿐
  }
}

/** 표시가 있으면 지우고 true */
export function takeGardenFocus(): boolean {
  try {
    if (window.sessionStorage.getItem(KEY) !== "1") return false;
    window.sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
