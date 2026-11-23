// Seeded randomness for Ember Duel: a tiny mulberry32 generator plus a
// Fisher-Yates shuffle, so a seed always deals the same hands (screenshots
// and tests replay exactly).
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle `items` in place using `rng`, and return the same array. */
export function shuffle(items, rng) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    const temp = items[index];
    items[index] = items[other];
    items[other] = temp;
  }
  return items;
}
