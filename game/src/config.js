// Table, card and colour constants for Ember Duel. One job: the numbers and
// palette every other module reads, so the look stays consistent.
export const TABLE = {
  width: 1280,
  height: 720,
  felt: '#1d5c3f',
  feltDark: '#15452f',
  feltLight: '#267050',
  rail: '#5a3a1e',
  railLight: '#7a5230',
  gold: '#e8b62f',
  cream: '#f5ecd7',
  ink: '#221a12',
};

export const CARD = {
  width: 150,
  height: 208,
  radius: 12,
  back: '#3b2d5c',
  backPattern: '#5c4a8a',
  face: '#fdf8ea',
};

/** The four elements: colour, shape and what each one beats. */
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e8542f', dark: '#a83214', beats: 'thorn', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f7fe8', dark: '#174f9e', beats: 'gale', glyph: 'drop' },
  thorn: { name: 'Thorn', color: '#3fae5a', dark: '#1f7034', beats: 'tide', glyph: 'leaf' },
  gale: { name: 'Gale', color: '#e8b62f', dark: '#a67c08', beats: 'ember', glyph: 'bolt' },
};

/** Advantage cycle: attacker element -> the element it deals double damage to. */
export const ADVANTAGE = {
  ember: 'thorn',
  thorn: 'tide',
  tide: 'gale',
  gale: 'ember',
};

export const GAME = {
  startLife: 30,
  startHand: 5,
  maxHand: 8,
  maxMana: 8,
  manaPerTurn: 1,
  drawPerTurn: 1,
};
