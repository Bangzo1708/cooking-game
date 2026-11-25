// Seeded random numbers for Dapur Kilat. A mulberry32 generator so a fixed seed
// always deals the same customers, recipes and spawn gaps — the screenshot scenes
// and the practice runs replay exactly.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from the given generator. */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** One element picked from the array, uniformly. */
export function randomPick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** A fresh array with the elements shuffled (Fisher-Yates). */
export function randomShuffle(rng, list) {
  const out = list.slice();
  for (let index = out.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    const held = out[index];
    out[index] = out[other];
    out[other] = held;
  }
  return out;
}
