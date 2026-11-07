// Settings shared by the Word and PDF exports, so the two stay identical.

export const STEM = "By the end of this course, students will be able to:";

export const HEADERS = [
	"General Learning Objective",
	"Specific Learning Objective",
	"Knowledge Dimension",
	"Cognitive Process",
];

/** General, specific, knowledge, cognitive: the same proportions as the table on screen. */
export const COLUMN_SHARES = [0.28, 0.46, 0.13, 0.13];

/** The app's primary colour (headings). */
export const INK = "1F4A68";
/** The app's table rules. */
export const RULE = "7A7A7A";
/** Title text. */
export const TEXT = "1D1F21";

/** @param {string} s */
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
