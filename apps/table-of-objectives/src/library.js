// Every table lives in this browser's localStorage, one key per table, so two tabs editing
// different tables never overwrite each other.
const TABLE_PREFIX = "table-of-objectives:table:";
const CURRENT_KEY = "table-of-objectives:current";
// Before v2 the app kept a single auto-saved table under this key.
const LEGACY_KEY = "table-of-objectives";
const VERIFY_MODE_KEY = "table-of-objectives:verify-mode";
const ACCEPTED_VERBS_KEY = "table-of-objectives:accepted-verbs";
// Also read by the inline script in index.html.
const THEME_KEY = "table-of-objectives:theme";

/** @typedef {import('./table-ops.js').Glo} Glo */
/**
 * What a backup file holds.
 * @typedef {{ title: string, description: string, glos: Glo[], dismissed?: string[] }} TableContent
 */
/**
 * A saved table.
 * @typedef {{ id: string, title: string, description: string, glos: Glo[], dismissed: string[], updatedAt: number }} Table
 */

/**
 * @param {Partial<TableContent>} [content]
 * @returns {Table}
 */
export function createTable(content = {}) {
	return {
		id: crypto.randomUUID(),
		title: content.title ?? "",
		description: content.description ?? "",
		glos: content.glos ?? [],
		// Keys of Verify notes the user has dismissed (see verify.js).
		dismissed: content.dismissed ?? [],
		updatedAt: Date.now(),
	};
}

/** @param {Table} table */
export const isEmptyTable = (table) =>
	!table.title && !table.description && table.glos.length === 0;

/** @param {string | null} key */
export const isTableKey = (key) =>
	key?.startsWith(TABLE_PREFIX) || key === CURRENT_KEY;

/**
 * Parses a backup file: { title, description, glos }, or a bare array of GLOs from before v2.
 * @param {string} json
 * @returns {TableContent}
 */
export function parseBackup(json) {
	const data = JSON.parse(json);

	if (Array.isArray(data)) {
		return { title: "", description: "", glos: data };
	}

	if (!data || !Array.isArray(data.glos)) {
		throw new Error("this is not a Table of Objectives backup file.");
	}

	return {
		title: String(data.title ?? ""),
		description: String(data.description ?? ""),
		glos: data.glos,
		dismissed: Array.isArray(data.dismissed)
			? data.dismissed.filter(
					/** @param {unknown} key */ (key) => typeof key === "string",
				)
			: [],
	};
}

/** @param {Table} table */
export function toBackup(table) {
	return JSON.stringify(
		{
			title: table.title,
			description: table.description,
			glos: table.glos,
			dismissed: table.dismissed ?? [],
		},
		null,
		2,
	);
}

/** @returns {Table[]} */
export function readTables() {
	/** @type {Table[]} */
	const tables = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key?.startsWith(TABLE_PREFIX)) continue;

		try {
			const table = JSON.parse(localStorage.getItem(key) ?? "null");
			table.dismissed ??= [];
			tables.push(table);
		} catch {
			// Leave an unreadable entry in place rather than deleting someone's data.
		}
	}

	return tables;
}

export function readCurrentId() {
	return localStorage.getItem(CURRENT_KEY);
}

/** @param {string} id */
export function writeCurrentId(id) {
	localStorage.setItem(CURRENT_KEY, id);
}

/**
 * Saves a table. Tables nobody has typed into are not kept.
 * @param {Table} table
 */
export function writeTable(table) {
	if (isEmptyTable(table)) {
		localStorage.removeItem(TABLE_PREFIX + table.id);
	} else {
		localStorage.setItem(TABLE_PREFIX + table.id, JSON.stringify(table));
	}
}

/** @param {string} id */
export function deleteTable(id) {
	localStorage.removeItem(TABLE_PREFIX + id);
}

// Moves the pre-v2 single auto-saved table into the library, once.
export function migrateLegacyTable() {
	const legacy = localStorage.getItem(LEGACY_KEY);
	if (legacy === null) return;

	try {
		const table = createTable(parseBackup(legacy));
		writeTable(table);
		writeCurrentId(table.id);
		localStorage.removeItem(LEGACY_KEY);
	} catch {
		// Unreadable: leave it where it is.
	}
}

export function readVerifyMode() {
	return localStorage.getItem(VERIFY_MODE_KEY) === "on";
}

/** @param {boolean} on */
export function writeVerifyMode(on) {
	localStorage.setItem(VERIFY_MODE_KEY, on ? "on" : "off");
}

/**
 * Words the user has told Verify to treat as verbs. Shared by every table in this browser.
 * @returns {string[]}
 */
export function readAcceptedVerbs() {
	try {
		const verbs = JSON.parse(localStorage.getItem(ACCEPTED_VERBS_KEY) ?? "[]");
		return Array.isArray(verbs) ? verbs : [];
	} catch {
		return [];
	}
}

/** @param {string[]} verbs */
export function writeAcceptedVerbs(verbs) {
	localStorage.setItem(ACCEPTED_VERBS_KEY, JSON.stringify(verbs));
}

/**
 * The user's light/dark choice; null means follow the system setting.
 * @returns {"light" | "dark" | null}
 */
export function readTheme() {
	const theme = localStorage.getItem(THEME_KEY);
	return theme === "light" || theme === "dark" ? theme : null;
}

/** @param {"light" | "dark" | null} theme */
export function writeTheme(theme) {
	if (theme) localStorage.setItem(THEME_KEY, theme);
	else localStorage.removeItem(THEME_KEY);
}
