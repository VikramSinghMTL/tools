import { describe, expect, it } from "vitest";
import { exportToDocx } from "./export-docx.js";

describe("Word export", () => {
	it("produces a .docx file", async () => {
		const blob = await exportToDocx("Biology", "Cells and systems.", [
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
		const bytes = new Uint8Array(await blob.arrayBuffer());
		// A .docx is a zip file: it starts with "PK".
		expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
		expect(bytes.length).toBeGreaterThan(2000);
	});
});
