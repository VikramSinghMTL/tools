import { describe, expect, it } from "vitest";
import {
	addGlo,
	addSlo,
	keyOf,
	moveGlo,
	moveSlo,
	removeGlo,
	removeSlo,
	renumber,
} from "./table-ops.js";

/** @typedef {import('./table-ops.js').Glo} Glo */

/**
 * A table with GLOs of the given SLO counts; each description names its starting position.
 * @param {...number} sloCounts
 * @returns {Glo[]}
 */
function make(...sloCounts) {
	const glos = sloCounts.map((count, g) => ({
		id: 0,
		description: `G${g + 1}`,
		slos: Array.from({ length: count }, (_, s) => ({
			id: "",
			description: `S${g + 1}.${s + 1}`,
			knowledge: "",
			cognitive: "",
		})),
	}));
	renumber(glos);
	return glos;
}

/** @param {Glo[]} glos */
const ids = (glos) =>
	glos.flatMap((glo) => [String(glo.id), ...glo.slos.map((slo) => slo.id)]);
/** @param {Glo[]} glos */
const descriptions = (glos) =>
	glos.flatMap((glo) => [
		glo.description,
		...glo.slos.map((slo) => slo.description),
	]);

describe("table operations", () => {
	it("numbers objectives by position", () => {
		expect(ids(make(2, 1))).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
	});

	it("adds a GLO with one blank SLO, and SLOs to a GLO", () => {
		const glos = make(1);
		addGlo(glos);
		addSlo(glos, 0);
		expect(ids(glos)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
		expect(glos[1].slos[0]).toEqual({
			id: "2.1",
			description: "",
			knowledge: "",
			cognitive: "",
		});
	});

	it("moves SLOs within a GLO and renumbers", () => {
		const glos = make(3);
		moveSlo(glos, 0, 2, -1);
		expect(descriptions(glos)).toEqual(["G1", "S1.1", "S1.3", "S1.2"]);
		expect(ids(glos)).toEqual(["1", "1.1", "1.2", "1.3"]);
	});

	it("moves GLOs with their SLOs and renumbers", () => {
		const glos = make(1, 2);
		moveGlo(glos, 0, 1);
		expect(descriptions(glos)).toEqual(["G2", "S2.1", "S2.2", "G1", "S1.1"]);
		expect(ids(glos)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
	});

	it("ignores moves past either end", () => {
		const glos = make(2, 1);
		moveSlo(glos, 0, 0, -1);
		moveSlo(glos, 0, 1, 1);
		moveGlo(glos, 0, -1);
		moveGlo(glos, 1, 1);
		expect(descriptions(glos)).toEqual(descriptions(make(2, 1)));
	});

	it("removes an SLO and renumbers the rest", () => {
		const glos = make(3, 1);
		removeSlo(glos, 0, 0);
		expect(descriptions(glos)).toEqual(["G1", "S1.2", "S1.3", "G2", "S2.1"]);
		expect(ids(glos)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
	});

	it("removes the GLO with its last SLO", () => {
		const glos = make(2, 1, 1);
		removeSlo(glos, 1, 0);
		expect(descriptions(glos)).toEqual(["G1", "S1.1", "S1.2", "G3", "S3.1"]);
		expect(ids(glos)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
	});

	it("removes a GLO and its SLOs", () => {
		const glos = make(1, 2, 1);
		removeGlo(glos, 1);
		expect(descriptions(glos)).toEqual(["G1", "S1.1", "G3", "S3.1"]);
		expect(ids(glos)).toEqual(["1", "1.1", "2", "2.1"]);
	});

	it("can empty the table", () => {
		const glos = make(1);
		removeSlo(glos, 0, 0);
		expect(glos).toEqual([]);
	});

	it("keeps an objective's key when it moves", () => {
		const glos = make(2);
		const key = keyOf(glos[0].slos[0]);
		moveSlo(glos, 0, 0, 1);
		expect(keyOf(glos[0].slos[1])).toBe(key);
		expect(keyOf(glos[0].slos[0])).not.toBe(key);
	});
});
