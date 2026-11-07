import { beforeEach, describe, expect, it } from "vitest";
import {
	createTable,
	deleteTable,
	migrateLegacyTable,
	parseBackup,
	readAcceptedVerbs,
	readCurrentId,
	readTables,
	readTheme,
	readVerifyMode,
	toBackup,
	writeAcceptedVerbs,
	writeTable,
	writeTheme,
	writeVerifyMode,
} from "./library.js";

/** An in-memory stand-in for the browser's localStorage. */
class MemoryStorage {
	/** @type {Map<string, string>} */
	items = new Map();
	get length() {
		return this.items.size;
	}
	/** @param {number} i */
	key(i) {
		return [...this.items.keys()][i] ?? null;
	}
	/** @param {string} key */
	getItem(key) {
		return this.items.get(key) ?? null;
	}
	/** @param {string} key @param {string} value */
	setItem(key, value) {
		this.items.set(key, String(value));
	}
	/** @param {string} key */
	removeItem(key) {
		this.items.delete(key);
	}
	clear() {
		this.items.clear();
	}
}

const sampleGlos = [
	{
		id: 1,
		description: "Explain X.",
		slos: [
			{
				id: "1.1",
				description: "List X.",
				knowledge: "factual",
				cognitive: "remember",
			},
		],
	},
];

beforeEach(() => {
	globalThis.localStorage = /** @type {Storage} */ (
		/** @type {unknown} */ (new MemoryStorage())
	);
});

describe("tables", () => {
	it("saves and reads tables", () => {
		const table = createTable({ title: "Biology", glos: sampleGlos });
		writeTable(table);
		expect(readTables()).toEqual([table]);
	});

	it("does not keep a table nobody has typed into", () => {
		const table = createTable({ title: "Biology" });
		writeTable(table);
		table.title = "";
		writeTable(table);
		expect(readTables()).toEqual([]);
	});

	it("deletes a table", () => {
		const table = createTable({ title: "Biology" });
		writeTable(table);
		deleteTable(table.id);
		expect(readTables()).toEqual([]);
	});

	it("gives tables saved before dismissals existed an empty list", () => {
		localStorage.setItem(
			"table-of-objectives:table:old",
			JSON.stringify({ id: "old", title: "Old", description: "", glos: [] }),
		);
		expect(readTables()[0].dismissed).toEqual([]);
	});
});

describe("migrating the pre-v2 auto-save", () => {
	it("moves it into the library and makes it current", () => {
		localStorage.setItem(
			"table-of-objectives",
			JSON.stringify({ title: "Legacy", description: "d", glos: sampleGlos }),
		);
		migrateLegacyTable();
		const [table] = readTables();
		expect(table.title).toBe("Legacy");
		expect(table.glos).toEqual(sampleGlos);
		expect(readCurrentId()).toBe(table.id);
		expect(localStorage.getItem("table-of-objectives")).toBeNull();
	});

	it("leaves an unreadable auto-save where it is", () => {
		localStorage.setItem("table-of-objectives", "not json");
		migrateLegacyTable();
		expect(readTables()).toEqual([]);
		expect(localStorage.getItem("table-of-objectives")).toBe("not json");
	});
});

describe("backups", () => {
	it("round-trips a table, including dismissals", () => {
		const table = createTable({
			title: "Biology",
			description: "Cells",
			glos: sampleGlos,
			dismissed: ["vague:abc"],
		});
		const restored = parseBackup(toBackup(table));
		expect(restored).toEqual({
			title: "Biology",
			description: "Cells",
			glos: sampleGlos,
			dismissed: ["vague:abc"],
		});
	});

	it("imports files from before v2, which held only the objectives", () => {
		expect(parseBackup(JSON.stringify(sampleGlos))).toEqual({
			title: "",
			description: "",
			glos: sampleGlos,
		});
	});

	it("rejects files that are not backups", () => {
		expect(() => parseBackup(JSON.stringify({ hello: "world" }))).toThrow(
			"not a Table of Objectives backup",
		);
		expect(() => parseBackup("not json")).toThrow();
	});
});

describe("settings", () => {
	it("remembers verify mode, accepted verbs and theme", () => {
		expect(readVerifyMode()).toBe(false);
		writeVerifyMode(true);
		expect(readVerifyMode()).toBe(true);

		expect(readAcceptedVerbs()).toEqual([]);
		writeAcceptedVerbs(["debug"]);
		expect(readAcceptedVerbs()).toEqual(["debug"]);

		expect(readTheme()).toBeNull();
		writeTheme("dark");
		expect(readTheme()).toBe("dark");
		writeTheme(null);
		expect(readTheme()).toBeNull();
	});
});
