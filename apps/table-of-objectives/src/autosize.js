// Grows a <textarea> to fit its content (replaces the old vue-textarea-autosize plugin).
const MIN_HEIGHT = 0;
const MAX_HEIGHT = 350;

/** @param {HTMLTextAreaElement} el */
function resize(el) {
	el.style.height = "auto";
	const height = Math.min(
		Math.max(el.scrollHeight + el.offsetHeight - el.clientHeight, MIN_HEIGHT),
		MAX_HEIGHT,
	);
	el.style.height = `${height}px`;
	el.style.overflowY = el.scrollHeight > height ? "auto" : "hidden";
}

/** Last width each textarea was sized at. @type {WeakMap<Element, number>} */
const sizedWidths = new WeakMap();
/** Each textarea's input listener, so it can be removed. @type {WeakMap<Element, () => void>} */
const listeners = new WeakMap();

// Text re-wraps when a textarea's width changes (window resize, layout settling, web font loading).
const widthObserver = new ResizeObserver((entries) => {
	for (const { target } of entries) {
		if (
			target instanceof HTMLTextAreaElement &&
			sizedWidths.get(target) !== target.clientWidth
		) {
			sizedWidths.set(target, target.clientWidth);
			resize(target);
		}
	}
});

export const autosize = {
	/** @param {HTMLTextAreaElement} el */
	mounted(el) {
		el.rows = 1;
		el.style.resize = "none";
		el.style.minHeight = `${MIN_HEIGHT}px`;
		const listener = () => resize(el);
		listeners.set(el, listener);
		el.addEventListener("input", listener);
		widthObserver.observe(el);
		resize(el);
	},
	/** Covers programmatic changes, e.g. switching tables. @param {HTMLTextAreaElement} el */
	updated(el) {
		resize(el);
	},
	/** @param {HTMLTextAreaElement} el */
	unmounted(el) {
		const listener = listeners.get(el);
		if (listener) el.removeEventListener("input", listener);
		widthObserver.unobserve(el);
	},
};
