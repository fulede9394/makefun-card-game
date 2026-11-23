// Pointer and keyboard input for Ember Duel: clicking a hand card plays it,
// the END TURN button ends the turn, and keys 1–8 play cards, Space ends the
// turn, Enter starts or restarts. Hit-testing is done against the same
// layout the renderer draws, so what you see is what you can click.
import { CARD } from './config.js';
import { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS, playCard, endPlayerTurn, startGame } from './state.js';
import { handLayout, endTurnButton } from './render.js';
import { choosePlays } from './ai.js';

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function inside(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

/** Which hand card (index), 'end', or null sits under `point`? */
export function hitTest(game, point) {
  if (game.screen !== 'play') return null;
  const button = endTurnButton();
  if (inside(point, button)) return 'end';
  const spots = handLayout(game.player.hand.length);
  for (let index = spots.length - 1; index >= 0; index -= 1) {
    const spot = spots[index];
    const lift = 14;
    if (inside(point, { x: spot.x, y: spot.y - lift, width: CARD.width, height: CARD.height + lift })) return index;
  }
  return null;
}

/** Wire pointer and keyboard input onto `canvas` for `game`. */
export function attachInput(canvas, game, hooks) {
  canvas.addEventListener('pointermove', (event) => {
    const point = canvasPoint(canvas, event);
    hooks.setHover(hitTest(game, point));
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(canvas, event);
    if (game.screen === SCREEN_TITLE) {
      startGame(game);
      hooks.onAction();
      return;
    }
    if (game.screen === SCREEN_WIN || game.screen === SCREEN_LOSS) {
      const fresh = hooks.restart();
      startGame(fresh);
      return;
    }
    const hit = hitTest(game, point);
    if (hit === 'end') {
      endPlayerTurn(game, { choosePlays });
      hooks.onAction();
    } else if (typeof hit === 'number') {
      const card = game.player.hand[hit];
      if (card && game.turn === 'player' && !game.aiBusy) {
        const played = playCard(game, game.player, game.rival, card, true);
        if (!played) game.log.push(card.cost > game.player.mana ? 'Not enough mana for that card.' : 'That card cannot be played now.');
        hooks.onAction();
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (game.screen === SCREEN_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      startGame(game);
      hooks.onAction();
      return;
    }
    if ((game.screen === SCREEN_WIN || game.screen === SCREEN_LOSS) && event.key === 'Enter') {
      const fresh = hooks.restart();
      startGame(fresh);
      return;
    }
    if (game.screen !== 'play') return;
    if (event.key >= '1' && event.key <= '8') {
      const index = Number(event.key) - 1;
      const card = game.player.hand[index];
      if (card && game.turn === 'player' && !game.aiBusy) {
        playCard(game, game.player, game.rival, card, true);
        hooks.onAction();
      }
    } else if (event.key === ' ' || event.key === 'Enter') {
      endPlayerTurn(game, { choosePlays });
      hooks.onAction();
    }
  });
}
