// The rules and state of Ember Duel: a turn-based card duel. The player and
// the rival each have life, mana, a deck, a hand and a shield. A turn is:
// gain mana, draw a card, play cards by spending mana, then end the turn and
// let the rival answer. First life total to reach 0 loses.
import { GAME } from './config.js';
import { buildDeck, elementMultiplier } from './cards.js';
import { createRng, shuffle } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

/** A fresh, unstarted game. `seed` fixes every shuffle. */
export function createGame(seed = 1) {
  const rng = createRng(seed);
  return {
    seed,
    rng,
    screen: SCREEN_TITLE,
    round: 1,
    turn: 'player',
    log: ['Welcome to Ember Duel.'],
    player: freshSide(buildDeck(rng)),
    rival: freshSide(buildDeck(rng)),
    playedCard: null,
    playedBy: null,
    floaters: [],
    aiQueue: [],
    aiBusy: false,
    over: false,
    winner: null,
    lastElement: { player: null, rival: null },
  };
}

function freshSide(deck) {
  return {
    life: GAME.startLife,
    shield: 0,
    mana: 1,
    maxMana: 1,
    deck,
    hand: [],
    discard: [],
  };
}

function drawCards(side, count, game) {
  for (let index = 0; index < count; index += 1) {
    if (side.hand.length >= GAME.maxHand) break;
    if (side.deck.length === 0) {
      side.deck = shuffle(side.discard, game.rng);
      side.discard = [];
      if (side.deck.length === 0) break;
    }
    side.hand.push(side.deck.pop());
  }
}

/** Deal the opening hands and open the table. */
export function startGame(game) {
  game.player.hand = [];
  game.rival.hand = [];
  drawCards(game.player, GAME.startHand, game);
  drawCards(game.rival, GAME.startHand, game);
  game.player.mana = 1;
  game.player.maxMana = 1;
  game.rival.mana = 1;
  game.rival.maxMana = 1;
  game.round = 1;
  game.turn = 'player';
  game.screen = SCREEN_PLAY;
  game.over = false;
  game.winner = null;
  game.playedCard = null;
  game.log = ['Round 1 — your turn. Play a card!'];
}

/** Damage first eats the shield, then life. Returns the life damage dealt. */
export function dealDamage(game, target, amount) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  const lifeDamage = amount - absorbed;
  target.life = Math.max(0, target.life - lifeDamage);
  return { absorbed, lifeDamage };
}

function healLife(side, amount) {
  side.life = Math.min(GAME.startLife, side.life + amount);
}

function addFloater(game, text, x, y, color) {
  game.floaters.push({ text, x, y, color, age: 0 });
}

/**
 * Play `card` from `side`'s hand against `foe`. Returns false when the card
 * cannot be played (not in hand, or not enough mana). Attack damage doubles
 * when the card's element beats the foe's last played element.
 */
export function playCard(game, side, foe, card, isPlayer) {
  const index = side.hand.indexOf(card);
  if (index === -1) return false;
  if (side.mana < card.cost) return false;
  side.hand.splice(index, 1);
  side.discard.push(card);
  side.mana -= card.cost;

  const owner = isPlayer ? 'player' : 'rival';
  const foeOwner = isPlayer ? 'rival' : 'player';
  game.playedCard = card;
  game.playedBy = owner;
  game.lastElement[owner] = card.element;

  const who = isPlayer ? 'You' : 'Rival';
  if (card.attack > 0) {
    const multiplier = elementMultiplier(card.element, game.lastElement[foeOwner]);
    const damage = card.attack * multiplier;
    const result = dealDamage(game, foe, damage);
    const strong = multiplier === 2 ? ' Super effective!' : '';
    game.log.push(`${who} played ${card.name} — ${damage} damage!${strong}`);
    // The number pops up beside the life total it just dented.
    addFloater(game, `-${damage}`, 300, isPlayer ? 110 : 470, '#ff6b4a');
    if (result.absorbed > 0) game.log.push(`Shield absorbed ${result.absorbed}.`);
  }
  if (card.heal > 0) {
    healLife(side, card.heal);
    game.log.push(`${who} played ${card.name} — healed ${card.heal}.`);
    addFloater(game, `+${card.heal}`, 300, isPlayer ? 470 : 110, '#7be495');
  }
  if (card.shield > 0) {
    side.shield += card.shield;
    game.log.push(`${who} played ${card.name} — shield ${card.shield}.`);
    addFloater(game, `Shield ${card.shield}`, 300, isPlayer ? 470 : 110, '#8ec9ff');
  }
  if (card.draw > 0) {
    drawCards(side, card.draw, game);
    game.log.push(`${who} played ${card.name} — drew ${card.draw} cards.`);
  }
  checkEnd(game);
  return true;
}

/** The rival's turn: play its affordable cards, best damage first. */
export function rivalTurn(game, ai) {
  const moves = ai.choosePlays(game);
  game.aiQueue = moves;
  game.aiBusy = moves.length > 0;
  if (moves.length === 0) game.log.push('Rival passes.');
}

/** One queued rival card per tick, so the table animates instead of jumping. */
export function stepRivalQueue(game) {
  if (game.aiQueue.length === 0) {
    game.aiBusy = false;
    return;
  }
  const card = game.aiQueue.shift();
  playCard(game, game.rival, game.player, card, false);
  if (game.aiQueue.length === 0) game.aiBusy = false;
}

/** End the player's turn: the rival answers, then a new round begins. */
export function endPlayerTurn(game, ai) {
  if (game.over || game.turn !== 'player') return;
  game.turn = 'rival';
  game.log.push('Rival is thinking…');
  rivalTurn(game, ai);
}

/** After the rival's queue is empty, start the next round for the player. */
export function beginPlayerRound(game) {
  game.round += 1;
  game.turn = 'player';
  game.player.maxMana = Math.min(GAME.maxMana, game.player.maxMana + GAME.manaPerTurn);
  game.player.mana = game.player.maxMana;
  game.rival.maxMana = Math.min(GAME.maxMana, game.rival.maxMana + GAME.manaPerTurn);
  game.rival.mana = game.rival.maxMana;
  drawCards(game.player, GAME.drawPerTurn, game);
  drawCards(game.rival, GAME.drawPerTurn, game);
  game.log.push(`Round ${game.round} — your turn. Mana ${game.player.mana}.`);
}

function checkEnd(game) {
  if (game.over) return;
  if (game.rival.life <= 0) {
    game.over = true;
    game.winner = 'player';
    game.screen = SCREEN_WIN;
    game.log.push('You win the duel!');
  } else if (game.player.life <= 0) {
    game.over = true;
    game.winner = 'rival';
    game.screen = SCREEN_LOSS;
    game.log.push('The rival wins the duel.');
  }
}
