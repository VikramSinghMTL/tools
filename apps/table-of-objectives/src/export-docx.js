// Builds the Word (.docx) version of a table of objectives. It mirrors the app: a serif title and
// headings, sans-serif body text, and the same four ruled columns.
import {
	AlignmentType,
	BorderStyle,
	Document,
	HeadingLevel,
	Packer,
	PageOrientation,
	Paragraph,
	Tab,
	Table,
	TableCell,
	TableRow,
	TabStopType,
	TextRun,
	VerticalAlign,
	WidthType,
} from "docx";
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

const HEADING_FONT = "Georgia";
const BODY_FONT = "Calibri";
const HANGING = 600; // Where numbered text starts, in twips.

// Landscape A4 is 16838 twips wide; minus 1-inch (1440) margins on each side.
const TABLE_WIDTH = 16838 - 2 * 1440;
const COLUMN_WIDTHS = COLUMN_SHARES.map((share) =>
	Math.round(share * TABLE_WIDTH),
);

/**
 * "1.2<tab>Description", with a hanging indent so wrapped lines line up under the text.
 * @param {string | number} id
 * @param {string} text
 */
const numbered = (id, text) =>
	new Paragraph({
		style: "Hanging",
		// An explicit stop at the indent, so every word processor lines the text up the same way.
		tabStops: [{ type: TabStopType.LEFT, position: HANGING }],
		children: [new TextRun({ children: [String(id), new Tab(), text] })],
	});

/** @param {string} text */
const centered = (text) =>
	new Paragraph({ alignment: AlignmentType.CENTER, text });

/**
 * @param {Paragraph} paragraph
 * @param {Omit<import("docx").ITableCellOptions, "children">} [options]
 */
const cell = (paragraph, options = {}) =>
	new TableCell({
		children: [paragraph],
		margins: { top: 80, bottom: 80, left: 110, right: 110 },
		...options,
	});

const rule = { style: BorderStyle.SINGLE, size: 6, color: RULE };

/**
 * @param {string} title
 * @param {string} description
 * @param {Glo[]} glos
 * @returns {Promise<Blob>}
 */
export function exportToDocx(title, description, glos) {
	const header = new TableRow({
		tableHeader: true,
		children: HEADERS.map((text) =>
			cell(new Paragraph({ style: "TableHeader", text })),
		),
	});

	const rows = glos.flatMap((glo) =>
		glo.slos.map(
			(slo, j) =>
				new TableRow({
					children: [
						// The GLO cell spans all of its SLO rows.
						...(j === 0
							? [
									cell(numbered(glo.id, glo.description), {
										rowSpan: glo.slos.length,
									}),
								]
							: []),
						cell(numbered(slo.id, slo.description)),
						cell(centered(capitalize(slo.knowledge)), {
							verticalAlign: VerticalAlign.CENTER,
						}),
						cell(centered(capitalize(slo.cognitive)), {
							verticalAlign: VerticalAlign.CENTER,
						}),
					],
				}),
		),
	);

	const doc = new Document({
		styles: {
			default: {
				document: { run: { font: BODY_FONT, size: 22 } },
				title: {
					run: { font: HEADING_FONT, size: 48, bold: true, color: TEXT },
					paragraph: {
						alignment: AlignmentType.CENTER,
						spacing: { after: 360 },
					},
				},
				heading1: {
					run: { font: HEADING_FONT, size: 28, bold: true, color: INK },
					paragraph: { spacing: { before: 240, after: 80 } },
				},
			},
			paragraphStyles: [
				{
					id: "Hanging",
					name: "Hanging",
					basedOn: "Normal",
					paragraph: { indent: { left: HANGING, hanging: HANGING } },
				},
				{
					id: "TableHeader",
					name: "Table Header",
					basedOn: "Normal",
					run: { bold: true },
					paragraph: { alignment: AlignmentType.CENTER },
				},
			],
		},
		sections: [
			{
				properties: {
					page: { size: { orientation: PageOrientation.LANDSCAPE } },
				},
				children: [
					new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
					new Paragraph({
						text: "Course Description",
						heading: HeadingLevel.HEADING_1,
					}),
					new Paragraph({ text: description, spacing: { after: 240 } }),
					new Paragraph({
						text: "Learning Objectives",
						heading: HeadingLevel.HEADING_1,
					}),
					new Paragraph({ text: STEM, spacing: { after: 160 } }),
					new Table({
						width: { size: TABLE_WIDTH, type: WidthType.DXA },
						columnWidths: COLUMN_WIDTHS,
						borders: {
							top: rule,
							bottom: rule,
							left: rule,
							right: rule,
							insideHorizontal: rule,
							insideVertical: rule,
						},
						rows: [header, ...rows],
					}),
				],
			},
		],
	});

	return Packer.toBlob(doc);
}
