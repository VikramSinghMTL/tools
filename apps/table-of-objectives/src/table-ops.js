// Editing operations on a table's objectives. They change `glos` in place (so Vue sees the change)
// and then renumber, so an objective's number always comes from its position: GLO 2's third SLO is "2.3".

/**
 * Saved ids are "1.2"-style strings; files from older versions may hold them as numbers (1.2).
 * @typedef {{ id: string | number, description: string, knowledge: string, cognitive: string }} Slo
 */
/** @typedef {{ id: number, description: string, slos: Slo[] }} Glo */

/** @returns {Slo} */
function newSlo() {
	return { id: "", description: "", knowledge: "", cognitive: "" };
}

/**
 * Sets every id from its position.
 * @param {Glo[]} glos
 */
export function renumber(glos) {
	glos.forEach((glo, g) => {
		glo.id = g + 1;
		glo.slos.forEach((slo, s) => {
			slo.id = `${g + 1}.${s + 1}`;
		});
	});
}

/** @param {Glo[]} glos */
export function addGlo(glos) {
	glos.push({ id: 0, description: "", slos: [newSlo()] });
	renumber(glos);
}

/**
 * @param {Glo[]} glos
 * @param {number} g GLO index
 */
export function addSlo(glos, g) {
	glos[g].slos.push(newSlo());
	renumber(glos);
}

/**
 * Removes an SLO. Removing a GLO's last SLO removes the GLO too.
 * @param {Glo[]} glos
 * @param {number} g GLO index
 * @param {number} s SLO index
 */
export function removeSlo(glos, g, s) {
	if (glos[g].slos.length === 1) {
		glos.splice(g, 1);
	} else {
		glos[g].slos.splice(s, 1);
	}
	renumber(glos);
}

/**
 * @param {Glo[]} glos
 * @param {number} g GLO index
 */
export function removeGlo(glos, g) {
	glos.splice(g, 1);
	renumber(glos);
}

/**
 * Swaps the item at `index` with its neighbour `delta` places away, if there is one.
 * @template T
 * @param {T[]} items
 * @param {number} index
 * @param {number} delta
 */
function swap(items, index, delta) {
	const other = index + delta;
	if (other < 0 || other >= items.length) return;
	[items[index], items[other]] = [items[other], items[index]];
}

/**
 * @param {Glo[]} glos
 * @param {number} g GLO index
 * @param {number} s SLO index
 * @param {-1 | 1} delta -1 moves up, 1 moves down
 */
export function moveSlo(glos, g, s, delta) {
	swap(glos[g].slos, s, delta);
	renumber(glos);
}

/**
 * @param {Glo[]} glos
 * @param {number} g GLO index
 * @param {-1 | 1} delta -1 moves up, 1 moves down
 */
export function moveGlo(glos, g, delta) {
	swap(glos, g, delta);
	renumber(glos);
}

/** @type {WeakMap<object, number>} */
const keys = new WeakMap();
let nextKey = 0;

/**
 * A stable key for an objective, for Vue's v-for. Unlike its number, it doesn't change when the
 * objective moves, so moving a row moves its DOM instead of re-creating it (and keeps focus).
 * @param {object} objective
 * @returns {number}
 */
export function keyOf(objective) {
	let key = keys.get(objective);
	if (key === undefined) {
		key = ++nextKey;
		keys.set(objective, key);
	}
	return key;
}
