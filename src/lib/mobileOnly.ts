/**
 * 임시: 모든 화면을 모바일 화면으로만 보여 준다.
 *
 * 켜 두면 태블릿·PC(768px 이상)에서는 가운데 모바일 폭 창(iframe) 안에 사이트를 띄운다.
 * 창 안의 폭이 모바일이므로 CSS·JS가 전부 모바일 화면으로 동작한다.
 * 태블릿·PC 화면 코드는 그대로 남아 있으니, 되돌릴 때는 false로만 바꾸면 된다.
 */
export const MOBILE_ONLY = true;

/** 이 폭 이상이면 모바일 창으로 감싼다 (태블릿 시작 지점과 같음) */
export const MOBILE_ONLY_QUERY = "(min-width: 768px)";

/** 모바일 창으로 감쌀 때 <html>에 붙는 클래스 */
export const MOBILE_ONLY_CLASS = "mobile-only-framed";

/** 그리기 전에 <head>에서 바로 실행: 넓은 화면의 맨 바깥 창이면 클래스부터 붙여 PC 화면이 번쩍이지 않게 한다 */
export const MOBILE_ONLY_SCRIPT = `(function(){try{if(window.self===window.top&&window.matchMedia(${JSON.stringify(
  MOBILE_ONLY_QUERY,
)}).matches)document.documentElement.classList.add(${JSON.stringify(MOBILE_ONLY_CLASS)})}catch(e){}})()`;
