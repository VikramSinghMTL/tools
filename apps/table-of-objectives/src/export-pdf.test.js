import { describe, expect, it } from "vitest";
import { exportToPdf } from "./export-pdf.js";
import { STEM } from "./export-shared.js";

describe("PDF export", () => {
	it("produces a PDF with the title, stem and objectives", async () => {
		const blob = exportToPdf("Biology", "Cells and systems.", [
			{
				id: 1,
				description: "Explain how cells work.",
				slos: [
					{
						id: "1.1",
						description: "Label the parts of a cell.",
						knowledge: "factual",
						cognitive: "remember",
					},
					{
						id: "1.2",
						description: "Compare plant and animal cells.",
						knowledge: "conceptual",
						cognitive: "understand",
					},
				],
			},
		]);
		const text = new TextDecoder("latin1").decode(await blob.arrayBuffer());
		expect(text.startsWith("%PDF-")).toBe(true);
		for (const expected of [
			"Biology",
			STEM,
			"Label the parts of a cell.",
			"Conceptual",
			"Understand",
		]) {
			expect(text).toContain(`(${expected})`);
		}
	});
});
