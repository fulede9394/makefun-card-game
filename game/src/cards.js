// The card catalog for Ember Duel: every card is an original creature or
// spell of the four elements. A card has a mana cost and one effect:
// attack (damage), heal (restore life), shield (absorb damage) or draw.
// `attack` on a heal/shield card is 0; `heal` on an attack card is 0.
import { shuffle } from './random.js';
export const CARD_CATALOG = [
  // Ember — hot, direct damage.
  { id: 'spark-imp', name: 'Spark Imp', element: 'ember', cost: 1, attack: 2, heal: 0, shield: 0, draw: 0, text: 'A mischievous ember that nips at heels.' },
  { id: 'cinder-fox', name: 'Cinder Fox', element: 'ember', cost: 2, attack: 4, heal: 0, shield: 0, draw: 0, text: 'It leaves a trail of bright cinders.' },
  { id: 'ember-drake', name: 'Ember Drake', element: 'ember', cost: 3, attack: 6, heal: 0, shield: 0, draw: 0, text: 'A young drake with a furnace heart.' },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 4, attack: 8, heal: 0, shield: 0, draw: 0, text: 'The whole field catches light at once.' },
  // Tide — deep water, steady and healing.
  { id: 'tide-sprite', name: 'Tide Sprite', element: 'tide', cost: 1, attack: 2, heal: 0, shield: 0, draw: 0, text: 'It rides in on the evening tide.' },
  { id: 'coral-knight', name: 'Coral Knight', element: 'tide', cost: 2, attack: 4, heal: 0, shield: 0, draw: 0, text: 'Armour grown, not forged.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', element: 'tide', cost: 4, attack: 7, heal: 0, shield: 0, draw: 0, text: 'Older than the harbour it guards.' },
  { id: 'mend', name: 'Mend', element: 'tide', cost: 2, attack: 0, heal: 6, shield: 0, draw: 0, text: 'Cool water knits the wound shut.' },
  // Thorn — growing things that bite back and feed.
  { id: 'thorn-sprout', name: 'Thorn Sprout', element: 'thorn', cost: 1, attack: 2, heal: 0, shield: 0, draw: 0, text: 'Small, sharp, and everywhere at once.' },
  { id: 'briar-wolf', name: 'Briar Wolf', element: 'thorn', cost: 2, attack: 4, heal: 0, shield: 0, draw: 0, text: 'It hunts through the hedgerow.' },
  { id: 'ancient-oak', name: 'Ancient Oak', element: 'thorn', cost: 3, attack: 5, heal: 2, shield: 0, draw: 0, text: 'It strikes, and its roots drink deep.' },
  { id: 'siphon-vine', name: 'Siphon Vine', element: 'thorn', cost: 3, attack: 3, heal: 3, shield: 0, draw: 0, text: 'It takes a little and gives it back.' },
  // Gale — quick wind, shields and scouting.
  { id: 'gale-wisp', name: 'Gale Wisp', element: 'gale', cost: 1, attack: 2, heal: 0, shield: 0, draw: 0, text: 'Here and gone before you blink.' },
  { id: 'storm-hawk', name: 'Storm Hawk', element: 'gale', cost: 2, attack: 4, heal: 0, shield: 0, draw: 0, text: 'It dives out of the thunderhead.' },
  { id: 'aegis', name: 'Aegis', element: 'gale', cost: 2, attack: 0, heal: 0, shield: 6, draw: 0, text: 'A wall of wind turns the blow aside.' },
  { id: 'scout-owl', name: 'Scout Owl', element: 'gale', cost: 1, attack: 0, heal: 0, shield: 0, draw: 2, text: 'It sees the next two cards coming.' },
];

export const ELEMENTS_OF_CATALOG = ['ember', 'tide', 'thorn', 'gale'];

/** Two copies of every catalog card, shuffled with `rng`, is one deck. */
export function buildDeck(rng) {
  const deck = [];
  for (const card of CARD_CATALOG) {
    deck.push({ ...card });
    deck.push({ ...card });
  }
  return shuffle(deck, rng);
}

/** Double damage when the attacker's element beats the defender's last element. */
export function elementMultiplier(attackerElement, defenderElement) {
  if (!defenderElement) return 1;
  const beats = { ember: 'thorn', thorn: 'tide', tide: 'gale', gale: 'ember' };
  return beats[attackerElement] === defenderElement ? 2 : 1;
}

/** A short label for what a card does, shown under its art. */
export function cardEffectLabel(card) {
  if (card.attack > 0 && card.heal > 0) return `Strike ${card.attack} · Heal ${card.heal}`;
  if (card.attack > 0) return `Strike ${card.attack}`;
  if (card.heal > 0) return `Heal ${card.heal}`;
  if (card.shield > 0) return `Shield ${card.shield}`;
  if (card.draw > 0) return `Draw ${card.draw}`;
  return '—';
}
