// The rival's brain for Ember Duel: a greedy, readable opponent. It heals
// when hurt, shields when the player just hit hard, and otherwise plays its
// biggest affordable attack — preferring an element that beats the player's
// last played element, so its choices can be read and countered.
import { elementMultiplier } from './cards.js';

/** Pick the rival's plays for this turn, in order, without mutating the hand. */
export function choosePlays(game) {
  const rival = game.rival;
  const hand = [...rival.hand];
  let mana = rival.mana;
  const plays = [];
  const playerElement = game.lastElement.player;

  // Hurt and holding a heal? Patch up first.
  if (rival.life <= 12) {
    const heal = bestOf(hand, (card) => card.heal > 0, (card) => card.heal);
    if (heal && heal.cost <= mana) {
      plays.push(heal);
      mana -= heal.cost;
      hand.splice(hand.indexOf(heal), 1);
    }
  }

  // The player just landed a big hit and we have a shield? Raise it.
  if (game.player.life > rival.life) {
    const shield = bestOf(hand, (card) => card.shield > 0, (card) => card.shield);
    if (shield && shield.cost <= mana) {
      plays.push(shield);
      mana -= shield.cost;
      hand.splice(hand.indexOf(shield), 1);
    }
  }

  // Then attacks, strongest first, element advantage ahead of raw power.
  const attacks = hand
    .filter((card) => card.attack > 0)
    .map((card) => ({ card, value: card.attack * elementMultiplier(card.element, playerElement) }))
    .sort((a, b) => b.value - a.value);
  for (const { card } of attacks) {
    if (card.cost <= mana) {
      plays.push(card);
      mana -= card.cost;
    }
  }

  // A spare mana and a scout in hand? Draw into next turn.
  const scout = hand.find((card) => card.draw > 0 && card.cost <= mana && !plays.includes(card));
  if (scout) plays.push(scout);

  return plays;
}

function bestOf(hand, test, score) {
  let best = null;
  for (const card of hand) {
    if (!test(card)) continue;
    if (best === null || score(card) > score(best)) best = card;
  }
  return best;
}
