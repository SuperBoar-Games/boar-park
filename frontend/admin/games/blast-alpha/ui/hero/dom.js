import { state } from "./state.js";

function getPageScrollTop() {
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function preserveScroll() {
  const wrap = state.ui.tableWrapper;
  if (wrap) {
    state.scroll.wrapperLeft = wrap.scrollLeft;
    state.scroll.wrapperTop = wrap.scrollTop;
  }
  state.scroll.pageTop = getPageScrollTop();
}

export function restoreScroll() {
  const wrap = state.ui.tableWrapper;
  if (wrap) {
    wrap.scrollLeft = state.scroll.wrapperLeft;
    wrap.scrollTop = state.scroll.wrapperTop;
  }
  window.scrollTo(0, state.scroll.pageTop);
}

