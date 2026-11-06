// Grows a <textarea> to fit its content (replaces the old vue-textarea-autosize plugin).
const MIN_HEIGHT = 0;
const MAX_HEIGHT = 350;

function resize(el) {
  el.style.height = 'auto';
  const height = Math.min(Math.max(el.scrollHeight + el.offsetHeight - el.clientHeight, MIN_HEIGHT), MAX_HEIGHT);
  el.style.height = height + 'px';
  el.style.overflowY = el.scrollHeight > height ? 'auto' : 'hidden';
}

// Text re-wraps when a textarea's width changes (window resize, layout settling, web font loading).
const widthObserver = new ResizeObserver((entries) => {
  for (const { target } of entries) {
    if (target._autosizeWidth !== target.clientWidth) {
      target._autosizeWidth = target.clientWidth;
      resize(target);
    }
  }
});

export const autosize = {
  mounted(el) {
    el.rows = 1;
    el.style.resize = 'none';
    el.style.minHeight = MIN_HEIGHT + 'px';
    el._autosize = () => resize(el);
    el.addEventListener('input', el._autosize);
    widthObserver.observe(el);
    resize(el);
  },
  // Covers programmatic changes, e.g. loading a saved file.
  updated(el) {
    resize(el);
  },
  unmounted(el) {
    el.removeEventListener('input', el._autosize);
    widthObserver.unobserve(el);
  },
};
