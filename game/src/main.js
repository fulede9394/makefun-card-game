// Bootstrap for Ember Duel: creates the game, wires input, runs the render
// loop and drives the rival's queued plays. With ?shot=<name>&seed=<n> the
// page stages that scene deterministically instead of waiting for a player,
// and sets window.__shotReady once it is drawn.
import { createGame, startGame, stepRivalQueue, beginPlayerRound } from './state.js';
import { renderGame } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { TABLE } from './config.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

let game = shotName ? stageShot(shotName, seed) : createGame(seed);
let hover = null;
let lastRivalStep = 0;
let lastFrame = 0;

window.__game = game;
window.__gameReady = false;
window.__shotReady = false;
window.__errors = [];
window.addEventListener('error', (event) => window.__errors.push(String(event.message)));

function announce() {
  const last = game.log[game.log.length - 1] ?? '';
  status.textContent = `Ember Duel. ${last} Your life ${game.player.life}, rival life ${game.rival.life}, round ${game.round}.`;
}

attachInput(canvas, game, {
  setHover(value) {
    hover = value;
  },
  onAction() {
    announce();
  },
  restart() {
    // Reset the same game object in place, so the attached listeners keep
    // pointing at the live game — no re-attachment, no stale handlers.
    Object.assign(game, createGame(seed));
    return game;
  },
});

// The restart hook resets the same game object in place; the input
// attachment above is the only one, for the whole session.
function frame(now) {
  // Rival queued plays tick out one at a time, about twice a second.
  if (game.turn === 'rival' && game.aiBusy && !game.over && now - lastRivalStep > 500) {
    lastRivalStep = now;
    stepRivalQueue(game);
    if (!game.aiBusy && !game.over) beginPlayerRound(game);
    announce();
  }
  // Floating damage numbers age in real seconds, not frames, so a slow
  // software renderer cannot leave them hanging over a screenshot.
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  for (const floater of game.floaters) floater.age += dt;
  game.floaters = game.floaters.filter((floater) => floater.age < 1.4);
  ctx.clearRect(0, 0, TABLE.width, TABLE.height);
  renderGame(ctx, game, hover);
  if (!window.__gameReady) window.__gameReady = true;
  if (shotName && !window.__shotReady) window.__shotReady = true;
  requestAnimationFrame(frame);
}

announce();
requestAnimationFrame(frame);
