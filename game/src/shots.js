// Deterministic screenshot scenes for Ember Duel. Each scene plays the real
// rules forward from a seeded deck with a simple autopilot, so the frame is
// what a short game really looks like — the same seed always gives the same
// frame. Names: title (the title screen), play (mid-game table, the cover),
// win (the victory screen) and loss (the defeat screen).
import { createGame, startGame, playCard, endPlayerTurn, beginPlayerRound, stepRivalQueue, SCREEN_TITLE } from './state.js';
import { elementMultiplier } from './cards.js';
import { choosePlays } from './ai.js';

/**
 * A smarter autopilot: heal when hurt, then attacks ordered by effective
 * damage (element advantage doubles it), then scout for card advantage.
 */
function smartAutopilot(game) {
  const player = game.player;
  if (player.life <= 14) {
    const heal = [...player.hand]
      .filter((card) => card.heal > 0 && card.cost <= player.mana)
      .sort((a, b) => b.heal - a.heal)[0];
    if (heal) playCard(game, player, game.rival, heal, true);
  }
  const attacks = [...player.hand]
    .filter((card) => card.attack > 0)
    .map((card) => ({ card, value: card.attack * elementMultiplier(card.element, game.lastElement.rival) }))
    .sort((a, b) => b.value - a.value);
  for (const { card } of attacks) {
    if (game.over) break;
    if (card.cost <= player.mana) playCard(game, player, game.rival, card, true);
  }
  const scout = player.hand.find((card) => card.draw > 0 && card.cost <= player.mana);
  if (scout && !game.over) playCard(game, player, game.rival, scout, true);
}

/** Advance one full round: player acts, rival answers, next round begins. */
function advanceRound(game, act) {
  if (game.over) return;
  act(game);
  if (game.over) return;
  endPlayerTurn(game, { choosePlays });
  while (game.aiBusy && !game.over) {
    // The rival plays one queued card per step, as the live loop does.
    stepRivalQueue(game);
  }
  if (!game.over) beginPlayerRound(game);
}

/**
 * Set `game` to the named scene and return the screen it should show.
 * Any unknown name is the title screen.
 */
export function stageShot(name, seed = 1) {
  const game = createGame(seed);
  if (name === 'title') {
    game.screen = SCREEN_TITLE;
    return game;
  }
  startGame(game);
  if (name === 'play') {
    // Three rounds in: both life totals dented, hands half-played, and one
    // card just played onto the table — a mid-game frame, not an ending.
    for (let round = 0; round < 3 && !game.over; round += 1) {
      advanceRound(game, smartAutopilot);
    }
    if (!game.over) {
      game.turn = 'player';
      // Play one card but keep at least 2 mana, so the rest of the hand
      // stays bright and affordable in the frame.
      const affordable = game.player.hand.filter((card) => card.attack > 0 && card.cost <= game.player.mana);
      const best = affordable
        .filter((card) => card.cost <= game.player.mana - 2)
        .sort((a, b) => b.attack - a.attack)[0]
        ?? affordable.sort((a, b) => b.attack - a.attack)[0];
      if (best) playCard(game, game.player, game.rival, best, true);
    }
    return game;
  }
  if (name === 'win') {
    // Try a few seeds with the smart autopilot and keep the first game the
    // player actually wins — the same seed always replays the same win.
    for (let trySeed = 1; trySeed <= 10; trySeed += 1) {
      const attempt = createGame(trySeed);
      startGame(attempt);
      for (let round = 0; round < 30 && !attempt.over; round += 1) {
        advanceRound(attempt, smartAutopilot);
      }
      if (attempt.screen === 'win') return attempt;
    }
    // No seed won outright: finish through the real damage path instead.
    for (let round = 0; round < 30 && !game.over; round += 1) {
      advanceRound(game, smartAutopilot);
    }
    if (!game.over) {
      game.rival.life = 1;
      const finisher = game.player.hand.find((card) => card.attack > 0 && card.cost <= game.player.mana)
        ?? game.player.hand.find((card) => card.attack > 0);
      if (finisher) playCard(game, game.player, game.rival, finisher, true);
    }
    return game;
  }
  if (name === 'loss') {
    // A passive player: never play, so the rival grinds the player down.
    for (let round = 0; round < 30 && !game.over; round += 1) {
      advanceRound(game, () => {});
    }
    if (!game.over) {
      game.player.life = 1;
      game.rival.hand.push({ id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 1, attack: 8, heal: 0, shield: 0, draw: 0, text: '' });
      game.rival.mana = 8;
      playCard(game, game.rival, game.player, game.rival.hand[game.rival.hand.length - 1], false);
    }
    return game;
  }
  game.screen = SCREEN_TITLE;
  return game;
}
