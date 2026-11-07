// Builds the PDF version of a table of objectives, laid out like the Word export: a serif title and
// headings, sans-serif body text, and the same four ruled columns with hanging-indented numbers.
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
	COLUMN_SHARES,
	capitalize,
	HEADERS,
	INK,
	RULE,
	STEM,
	TEXT,
} from "./export-shared.js";

/** @typedef {import('./table-ops.js').Glo} Glo */
/** @typedef {[number, number, number]} Rgb */

/**
 * @param {string} hex e.g. "1F4A68"
 * @returns {Rgb}
 */
const rgb = (hex) => [
	Number.parseInt(hex.slice(0, 2), 16),
	Number.parseInt(hex.slice(2, 4), 16),
	Number.parseInt(hex.slice(4, 6), 16),
];

// Landscape A4 in points, with 1-inch margins (as in the Word export).
const PAGE = { width: 841.89, height: 595.28 }; // A4 is 297 × 210 mm.
const MARGIN = 72;
const CONTENT_WIDTH = PAGE.width - 2 * MARGIN;
const TABLE_WIDTH = CONTENT_WIDTH;
const RULE_WIDTH = 0.6;

// Each objective's number gets its own narrow column with no rule before its text, so wrapped
// lines hang under the text rather than the number.
const GLO_NUMBER_WIDTH = 22;
const SLO_NUMBER_WIDTH = 30;
const [gloShare, sloShare, knowledgeShare, cognitiveShare] = COLUMN_SHARES;
const COLUMN_WIDTHS = [
	GLO_NUMBER_WIDTH,
	gloShare * TABLE_WIDTH - GLO_NUMBER_WIDTH,
	SLO_NUMBER_WIDTH,
	sloShare * TABLE_WIDTH - SLO_NUMBER_WIDTH,
	knowledgeShare * TABLE_WIDTH,
	cognitiveShare * TABLE_WIDTH,
];
const NUMBER_COLUMNS = new Set([0, 2]);
const TEXT_COLUMNS = new Set([1, 3]);

/**
 * @param {string} title
 * @param {string} description
 * @param {Glo[]} glos
 * @returns {Blob}
 */
export function exportToPdf(title, description, glos) {
	const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
	doc.setProperties({ title: title || "Table of Objectives" });
	let y = MARGIN;

	/**
	 * Writes wrapped text and moves `y` below it.
	 * @param {string} text
	 * @param {{ font: "times" | "helvetica", style: "normal" | "bold", size: number, color: string, align?: "left" | "center", after: number }} options
	 */
	const write = (text, { font, style, size, color, align = "left", after }) => {
		doc.setFont(font, style);
		doc.setFontSize(size);
		doc.setTextColor(...rgb(color));
		const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
		const x = align === "center" ? PAGE.width / 2 : MARGIN;
		doc.text(lines, x, y, { align, baseline: "top", lineHeightFactor: 1.3 });
		y += lines.length * size * 1.3 + after;
	};

	write(title, {
		font: "times",
		style: "bold",
		size: 24,
		color: TEXT,
		align: "center",
		after: 24,
	});
	write("Course Description", {
		font: "times",
		style: "bold",
		size: 14,
		color: INK,
		after: 6,
	});
	if (description)
		write(description, {
			font: "helvetica",
			style: "normal",
			size: 11,
			color: TEXT,
			after: 16,
		});
	write("Learning Objectives", {
		font: "times",
		style: "bold",
		size: 14,
		color: INK,
		after: 6,
	});
	write(STEM, {
		font: "helvetica",
		style: "normal",
		size: 11,
		color: TEXT,
		after: 10,
	});

	const body = glos.flatMap((glo) =>
		glo.slos.map((slo, j) => [
			// The GLO's number and text span all of its SLO rows.
			...(j === 0
				? [
						{
							content: String(glo.id),
							rowSpan: glo.slos.length,
							styles: { fontStyle: /** @type {const} */ ("bold") },
						},
						{ content: glo.description, rowSpan: glo.slos.length },
					]
				: []),
			String(slo.id),
			slo.description,
			capitalize(slo.knowledge),
			capitalize(slo.cognitive),
		]),
	);

	autoTable(doc, {
		startY: y,
		margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
		theme: "grid",
		head: [
			[
				{ content: HEADERS[0], colSpan: 2 },
				{ content: HEADERS[1], colSpan: 2 },
				HEADERS[2],
				HEADERS[3],
			],
		],
		body,
		rowPageBreak: "avoid",
		styles: {
			font: "helvetica",
			fontSize: 10,
			textColor: rgb(TEXT),
			lineColor: rgb(RULE),
			lineWidth: RULE_WIDTH,
			cellPadding: 5,
			valign: "top",
			overflow: "linebreak",
		},
		headStyles: {
			fillColor: false,
			textColor: rgb(TEXT),
			fontStyle: "bold",
			halign: "center",
			valign: "middle",
		},
		columnStyles: Object.fromEntries(
			COLUMN_WIDTHS.map((width, i) => [
				i,
				{
					cellWidth: width,
					// Knowledge Dimension and Cognitive Process are centred both ways, as on screen.
					halign: i >= 4 ? "center" : "left",
					valign: i >= 4 ? "middle" : "top",
				},
			]),
		),
		didParseCell: ({ cell, column, section }) => {
			if (section !== "body") return;
			// No rule between a number and its text.
			if (NUMBER_COLUMNS.has(column.index)) {
				cell.styles.lineWidth = {
					top: RULE_WIDTH,
					bottom: RULE_WIDTH,
					left: RULE_WIDTH,
					right: 0,
				};
				cell.styles.cellPadding = { top: 5, bottom: 5, left: 5, right: 0 };
			} else if (TEXT_COLUMNS.has(column.index)) {
				cell.styles.lineWidth = {
					top: RULE_WIDTH,
					bottom: RULE_WIDTH,
					left: 0,
					right: RULE_WIDTH,
				};
			}
		},
	});

	return doc.output("blob");
}
