// Checks a table of objectives and returns notes about it. Pure functions: no DOM, no storage.
import bloomsByLevel from "./blooms.js";
import verbList from "./verbs-en.js";

/** @typedef {import('./table-ops.js').Glo} Glo */
/** @typedef {"error" | "warning" | "hint"} Severity */
/** @typedef {"description" | "knowledge" | "cognitive"} Field */
/**
 * Where a note applies. `glo`/`slo` are indexes; a course-wide note has neither.
 * @typedef {{ glo: number | null, slo: number | null, field: Field | null, label: string }} Where
 */
/**
 * @typedef {Where & {
 *   key: string,
 *   code: string,
 *   severity: Severity,
 *   message: string,
 *   word?: string,
 *   dismissible: boolean,
 *   dismissed: boolean,
 * }} Note
 */
/**
 * @typedef {{
 *   notes: Note[],
 *   grid: number[][],
 *   counts: { error: number, warning: number, hint: number, dismissed: number },
 * }} Verification
 */

export const KNOWLEDGE = [
	"factual",
	"conceptual",
	"procedural",
	"metacognitive",
];
// Lower-order to higher-order. Matches the key order of blooms.js.
export const COGNITIVE = Object.keys(bloomsByLevel).map((level) =>
	level.toLowerCase(),
);

const VERBS = new Set(verbList.split(" "));

// Example verb -> the levels (indexes into COGNITIVE) it is listed under. Any verb may start an objective;
// these only tell the level checks which level a verb usually signals.
/** @type {Map<string, number[]>} */
const BLOOMS_LEVELS = new Map();
Object.values(bloomsByLevel).forEach((verbs, level) => {
	for (const verb of verbs) {
		const word = verb.toLowerCase();
		BLOOMS_LEVELS.set(word, [...(BLOOMS_LEVELS.get(word) ?? []), level]);
	}
});

// Verbs that name an internal state rather than something students can be observed doing.
export const VAGUE_VERBS = new Set([
	"understand",
	"know",
	"learn",
	"appreciate",
	"be",
	"become",
	"realize",
	"comprehend",
	"grasp",
	"internalize",
	"believe",
]);

/** @param {string} s */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** @param {string} word */
const quote = (word) => `“${capitalize(word)}”`;

/**
 * British spellings: analyse -> analyze, summarise -> summarize.
 * @param {string} word
 */
function americanize(word) {
	return word.replace(/yse$/, "yze").replace(/ise$/, "ize");
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function firstWord(text) {
	return (
		text
			.trim()
			.match(/^[A-Za-z][A-Za-z'’-]*/)?.[0]
			.toLowerCase() ?? null
	);
}

/**
 * @param {string} word
 * @param {Set<string>} accepted
 */
function isVerb(word, accepted) {
	return accepted.has(word) || VERBS.has(word) || VERBS.has(americanize(word));
}

/**
 * Bloom's levels for a verb. A level name ("Analyze") counts as that level.
 * @param {string} word
 * @returns {number[]}
 */
export function levelsOf(word) {
	const w = americanize(word);
	const named = COGNITIVE.indexOf(w);
	if (named !== -1) return [named];
	return BLOOMS_LEVELS.get(word) ?? BLOOMS_LEVELS.get(w) ?? [];
}

/** @param {number[]} levels */
function levelNames(levels) {
	return levels.map((level) => capitalize(COGNITIVE[level])).join(" / ");
}

/** @param {string} phrase */
const withArticle = (phrase) =>
	/^[AEIOU]/.test(phrase) ? `an ${phrase}` : `a ${phrase}`;

/**
 * "Explain (Understand / Evaluate)", or just "Understand" when the verb is itself a level name.
 * @param {string} verb
 * @param {number[]} levels
 */
function verbWithLevels(verb, levels) {
	const names = levelNames(levels);
	return names === capitalize(americanize(verb))
		? names
		: `${capitalize(verb)}, ${names}`;
}

/** @param {string} text */
function sentenceCount(text) {
	return (text.match(/\w[.?!](\s|$)/g) ?? []).length;
}

/**
 * "Build and explain…", "Identify, compare and contrast…": a leading list of two or more verbs.
 * @param {string} text
 * @param {Set<string>} accepted
 * @returns {string[] | null}
 */
function leadingVerbList(text, accepted) {
	const match = text
		.trim()
		.toLowerCase()
		.match(/^([a-z'-]+)((?:\s*,\s*[a-z'-]+)*)\s*,?\s+(and|or)\s+([a-z'-]+)/);
	if (!match) return null;

	const words = [
		match[1],
		...match[2]
			.split(",")
			.map((w) => w.trim())
			.filter(Boolean),
		match[4],
	];
	return words.every((word) => isVerb(word, accepted)) ? words : null;
}

/** @param {string[]} words */
function joinWords(words) {
	const quoted = words.map(quote);
	return quoted.length === 2
		? quoted.join(" and ")
		: `${quoted.slice(0, -1).join(", ")} and ${quoted.at(-1)}`;
}

/**
 * Short stable hash, so dismissals can be keyed on content without storing it.
 * @param {string} text
 */
function hash(text) {
	let h = 5381;
	for (let i = 0; i < text.length; i++)
		h = ((h << 5) + h + text.charCodeAt(i)) | 0;
	return (h >>> 0).toString(36);
}

/**
 * @param {{ glos: Glo[] }} table
 * @param {{ acceptedVerbs?: string[], dismissed?: string[] }} [options]
 * @returns {Verification}
 */
export function verifyTable(
	table,
	{ acceptedVerbs = [], dismissed = [] } = {},
) {
	const accepted = new Set(acceptedVerbs.map((verb) => verb.toLowerCase()));
	const dismissedKeys = new Set(dismissed);
	/** @type {Note[]} */
	const notes = [];

	/**
	 * @param {Where} where
	 * @param {unknown[]} fingerprint What the note depends on; editing any of it brings a dismissed note back.
	 * @param {string} code
	 * @param {Severity} severity
	 * @param {string} message
	 * @param {{ word?: string }} [extra]
	 */
	const add = (where, fingerprint, code, severity, message, extra = {}) => {
		const key = `${code}:${hash(JSON.stringify(fingerprint))}`;
		const dismissible = severity !== "error";
		notes.push({
			key,
			code,
			severity,
			message,
			dismissible,
			dismissed: dismissible && dismissedKeys.has(key),
			...where,
			...extra,
		});
	};

	/**
	 * Checks shared by general and specific objectives. Returns the leading verb, if there is one.
	 * @param {Where} where
	 * @param {unknown[]} fingerprint
	 * @param {string} text
	 * @returns {string | null}
	 */
	const checkStatement = (where, fingerprint, text) => {
		if (!text.trim()) {
			add(where, fingerprint, "blank", "error", "The description is blank.");
			return null;
		}

		let verb = firstWord(text);
		if (!verb || !isVerb(verb, accepted)) {
			const shown = verb ?? text.trim().split(/\s+/)[0];
			add(
				where,
				fingerprint,
				"not-verb",
				"error",
				`Should start with a verb, but ${quote(shown)} isn't one.`,
				{
					word: verb ?? undefined,
				},
			);
			verb = null;
		}

		if (sentenceCount(text) > 1) {
			add(
				where,
				fingerprint,
				"sentences",
				"warning",
				"Should be one sentence.",
			);
		}

		return verb;
	};

	/** Cognitive levels (indexes) of every SLO that has one. @type {number[]} */
	const sloCognitive = [];

	table.glos.forEach((glo, g) => {
		/** @type {Where} */
		const gloWhere = {
			glo: g,
			slo: null,
			field: "description",
			label: String(glo.id),
		};
		const gloPrint = ["glo", glo.description];

		const gloVerb = checkStatement(gloWhere, gloPrint, glo.description);
		if (glo.slos.length === 1) {
			add(
				{ ...gloWhere, field: null },
				[...gloPrint, glo.slos.length],
				"single-slo",
				"hint",
				"Has only one specific objective. A general objective is usually broken down into two or more.",
			);
		}
		const gloLevels = gloVerb ? levelsOf(gloVerb) : [];

		glo.slos.forEach((slo, s) => {
			/** @param {Field} field @returns {Where} */
			const where = (field) => ({
				glo: g,
				slo: s,
				field,
				label: String(slo.id),
			});
			const print = [
				"slo",
				glo.description,
				slo.description,
				slo.knowledge,
				slo.cognitive,
			];

			const verb = checkStatement(where("description"), print, slo.description);
			if (verb) {
				if (VAGUE_VERBS.has(verb)) {
					add(
						where("description"),
						print,
						"vague",
						"warning",
						`${quote(verb)} can't be observed or measured. Use a verb that shows how students demonstrate it, such as explain, list or apply.`,
					);
				} else if (COGNITIVE.includes(americanize(verb))) {
					add(
						where("description"),
						print,
						"too-general",
						"warning",
						`${quote(verb)} is too general for a SLO. How will one show that one can ${americanize(verb)}?`,
					);
				}

				const verbs = leadingVerbList(slo.description, accepted);
				if (verbs) {
					add(
						where("description"),
						print,
						"compound",
						"warning",
						`${joinWords(verbs)} are separate actions. Consider splitting this into separate objectives.`,
					);
				}
			}

			if (!slo.knowledge) {
				add(
					where("knowledge"),
					print,
					"blank-knowledge",
					"error",
					"Knowledge Dimension is blank.",
				);
			}

			if (!slo.cognitive) {
				add(
					where("cognitive"),
					print,
					"blank-cognitive",
					"error",
					"Cognitive Process is blank.",
				);
				return;
			}

			const cognitive = COGNITIVE.indexOf(slo.cognitive);
			sloCognitive.push(cognitive);

			// A verb listed at several levels counts as its highest one.
			if (gloVerb && gloLevels.length && cognitive > Math.max(...gloLevels)) {
				add(
					where("cognitive"),
					print,
					"above-glo",
					"warning",
					`The Cognitive Process (${capitalize(slo.cognitive)}) is higher than the GLO's verb (${verbWithLevels(gloVerb, gloLevels)}). ` +
						"Sometimes this calls for a new GLO to reorganize your higher-order SLOs. This is context sensitive, so you make the final call.",
				);
			}

			const verbLevels = verb ? levelsOf(verb) : [];
			if (verb && verbLevels.length && !verbLevels.includes(cognitive)) {
				add(
					where("cognitive"),
					print,
					"verb-mismatch",
					"warning",
					`${quote(verb)} is ${withArticle(levelNames(verbLevels))} verb, but the Cognitive Process is ${capitalize(slo.cognitive)}.`,
				);
			}
		});
	});

	if (
		sloCognitive.length &&
		Math.max(...sloCognitive) <= COGNITIVE.indexOf("understand")
	) {
		add(
			{ glo: null, slo: null, field: null, label: "Course" },
			["course", [...sloCognitive].sort()],
			"lower-order",
			"hint",
			"No specific objectives go beyond Understand. Consider adding some at Apply or higher.",
		);
	}

	const grid = KNOWLEDGE.map(() => COGNITIVE.map(() => 0));
	for (const glo of table.glos) {
		for (const slo of glo.slos) {
			const k = KNOWLEDGE.indexOf(slo.knowledge);
			const c = COGNITIVE.indexOf(slo.cognitive);
			if (k !== -1 && c !== -1) grid[k][c]++;
		}
	}

	const counts = { error: 0, warning: 0, hint: 0, dismissed: 0 };
	for (const note of notes) {
		if (note.dismissed) counts.dismissed++;
		else counts[note.severity]++;
	}

	return { notes, grid, counts };
}
