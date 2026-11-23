// All drawing for Ember Duel: the green felt table, both hands, the played
// card, the life and mana totals, and the title, win and loss screens.
// Everything is vector-drawn on one canvas — no image files, no fonts to load.
import { TABLE, CARD, ELEMENTS, GAME } from './config.js';
import { cardEffectLabel } from './cards.js';
import { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS } from './state.js';

const HAND_Y = 486;
const RIVAL_HAND_Y = 96;
const PLAYED_X = 565;
const PLAYED_Y = 248;

/** Where each player-hand card sits, fanned across the bottom of the table. */
export function handLayout(count) {
  // Wide hands tighten their spacing so the row never runs off the table.
  const step = count > 1
    ? Math.min(CARD.width + 12, Math.floor((1240 - CARD.width) / (count - 1)))
    : CARD.width + 12;
  const total = CARD.width + (count - 1) * step;
  const startX = (TABLE.width - total) / 2;
  const spots = [];
  for (let index = 0; index < count; index += 1) {
    spots.push({ x: startX + index * step, y: HAND_Y });
  }
  return spots;
}

/** Where each rival-hand card back sits, across the top of the table. */
export function rivalHandLayout(count) {
  const width = 84;
  const height = 116;
  const gap = 10;
  const total = count * width + (count - 1) * gap;
  const startX = (TABLE.width - total) / 2;
  const spots = [];
  for (let index = 0; index < count; index += 1) {
    spots.push({ x: startX + index * (width + gap), y: RIVAL_HAND_Y, width, height });
  }
  return spots;
}

export function endTurnButton() {
  return { x: 1070, y: 636, width: 176, height: 56 };
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawFelt(ctx) {
  const gradient = ctx.createRadialGradient(640, 340, 80, 640, 360, 760);
  gradient.addColorStop(0, TABLE.feltLight);
  gradient.addColorStop(1, TABLE.feltDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let radius = 90; radius < 700; radius += 90) {
    ctx.beginPath();
    ctx.arc(640, 360, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Wooden rail around the table.
  ctx.fillStyle = TABLE.rail;
  ctx.fillRect(0, 0, TABLE.width, 18);
  ctx.fillRect(0, TABLE.height - 18, TABLE.width, 18);
  ctx.fillRect(0, 0, 18, TABLE.height);
  ctx.fillRect(TABLE.width - 18, 0, 18, TABLE.height);
  ctx.fillStyle = TABLE.railLight;
  ctx.fillRect(0, 18, TABLE.width, 3);
  ctx.fillRect(0, TABLE.height - 21, TABLE.width, 3);
  ctx.fillRect(18, 0, 3, TABLE.height);
  ctx.fillRect(TABLE.width - 21, 0, 3, TABLE.height);
}

/** One element glyph, drawn as a vector shape in the element's colour. */
export function drawGlyph(ctx, glyph, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (glyph === 'flame') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.7, -size * 0.3, size * 0.9, size * 0.4, size * 0.45, size * 0.8);
    ctx.bezierCurveTo(size * 0.2, size, -size * 0.2, size, -size * 0.45, size * 0.8);
    ctx.bezierCurveTo(-size * 0.9, size * 0.4, -size * 0.7, -size * 0.3, 0, -size);
  } else if (glyph === 'drop') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.8, -size * 0.1, size * 0.85, size * 0.6, 0, size * 0.9);
    ctx.bezierCurveTo(-size * 0.85, size * 0.6, -size * 0.8, -size * 0.1, 0, -size);
  } else if (glyph === 'leaf') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size, -size * 0.5, size, size * 0.7, 0, size);
    ctx.bezierCurveTo(-size, size * 0.7, -size, -size * 0.5, 0, -size);
  } else {
    ctx.moveTo(size * 0.25, -size);
    ctx.lineTo(-size * 0.45, size * 0.15);
    ctx.lineTo(-size * 0.05, size * 0.15);
    ctx.lineTo(-size * 0.25, size);
    ctx.lineTo(size * 0.45, -size * 0.15);
    ctx.lineTo(size * 0.05, -size * 0.15);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCardBack(ctx, x, y, width, height) {
  roundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = CARD.back;
  ctx.fill();
  ctx.strokeStyle = TABLE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 8, y + 8, width - 16, height - 16, 7);
  ctx.strokeStyle = CARD.backPattern;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = TABLE.gold;
  ctx.font = `bold ${Math.round(width * 0.32)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', x + width / 2, y + height / 2);
}

/**
 * One face-up card. `options` may carry `hover` (lift + glow), `dim` (cannot
 * afford — greyed) and a `scale` for the big played-card view.
 */
export function drawCard(ctx, card, x, y, width, height, options = {}) {
  const element = ELEMENTS[card.element];
  const lift = options.hover ? -14 : 0;
  const top = y + lift;
  ctx.save();
  if (options.dim) ctx.globalAlpha = 0.55;
  roundRect(ctx, x, top, width, height, CARD.radius);
  ctx.fillStyle = CARD.face;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = element.color;
  ctx.stroke();
  // Element band across the top.
  ctx.save();
  roundRect(ctx, x, top, width, 44, CARD.radius);
  ctx.clip();
  ctx.fillStyle = element.color;
  ctx.fillRect(x, top, width, 44);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(width * 0.115)}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, x + 12, top + 23, width - 24);
  // Mana cost circle, top right over the band.
  const costX = x + width - 24;
  const costY = top + 62;
  ctx.beginPath();
  ctx.arc(costX, costY, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#2b4acb';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), costX, costY + 1);
  // Big glyph in the middle, on a tinted disc.
  const centreX = x + width / 2;
  const centreY = top + height * 0.48;
  ctx.beginPath();
  ctx.arc(centreX, centreY, 42, 0, Math.PI * 2);
  ctx.fillStyle = element.color + '22';
  ctx.fill();
  drawGlyph(ctx, element.glyph, centreX, centreY, 34, element.color);
  // Effect line and element name.
  ctx.fillStyle = TABLE.ink;
  ctx.font = `bold ${Math.round(width * 0.11)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(cardEffectLabel(card), centreX, top + height * 0.72);
  ctx.fillStyle = element.dark;
  ctx.font = `bold ${Math.round(width * 0.09)}px Georgia, serif`;
  ctx.fillText(element.name.toUpperCase(), centreX, top + height * 0.83);
  // Flavour line, small and grey.
  ctx.fillStyle = '#6b6252';
  ctx.font = `italic ${Math.round(width * 0.075)}px Georgia, serif`;
  const words = card.text.split(' ');
  let line = '';
  let lineY = top + height * 0.89;
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 22) {
      ctx.fillText(line.trim(), centreX, lineY);
      line = word;
      lineY += 12;
      if (lineY > top + height - 8) break;
    } else {
      line += ' ' + word;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), centreX, lineY);
  if (options.hover) {
    roundRect(ctx, x, top, width, height, CARD.radius);
    ctx.strokeStyle = TABLE.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.8);
  ctx.bezierCurveTo(-size * 1.2, -size * 0.1, -size * 0.6, -size, 0, -size * 0.35);
  ctx.bezierCurveTo(size * 0.6, -size, size * 1.2, -size * 0.1, 0, size * 0.8);
  ctx.fill();
  ctx.restore();
}

function drawShieldIcon(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.85, -size * 0.6);
  ctx.lineTo(size * 0.85, size * 0.2);
  ctx.bezierCurveTo(size * 0.85, size * 0.7, size * 0.4, size * 0.95, 0, size);
  ctx.bezierCurveTo(-size * 0.4, size * 0.95, -size * 0.85, size * 0.7, -size * 0.85, size * 0.2);
  ctx.lineTo(-size * 0.85, -size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLifePanel(ctx, x, y, name, life, shield, mana, maxMana, alignRight) {
  const width = 300;
  const panelX = alignRight ? x - width : x;
  ctx.fillStyle = 'rgba(10,25,18,0.92)';
  roundRect(ctx, panelX, y, width, 66, 10);
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = TABLE.cream;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(name, panelX + 16, y + 20);
  // Life as a big number with a vector heart.
  drawHeart(ctx, panelX + 30, y + 48, 11, '#ff6b6b');
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(life), panelX + 48, y + 48);
  // Shield, when raised.
  if (shield > 0) {
    drawShieldIcon(ctx, panelX + 118, y + 48, 11, '#8ec9ff');
    ctx.fillStyle = '#8ec9ff';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(String(shield), panelX + 136, y + 48);
  }
  // Mana pips.
  const pipStart = panelX + width - 16 - maxMana * 20;
  for (let index = 0; index < maxMana; index += 1) {
    ctx.beginPath();
    ctx.arc(pipStart + index * 20 + 8, y + 48, 7, 0, Math.PI * 2);
    ctx.fillStyle = index < mana ? '#4aa8ff' : 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawManaAndButton(ctx, game, hoverEnd) {
  const button = endTurnButton();
  const enabled = game.turn === 'player' && !game.over && !game.aiBusy;
  ctx.save();
  if (!enabled) ctx.globalAlpha = 0.5;
  roundRect(ctx, button.x, button.y, button.width, button.height, 12);
  ctx.fillStyle = hoverEnd && enabled ? '#f0c44a' : TABLE.gold;
  ctx.fill();
  ctx.strokeStyle = '#8a6a10';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = TABLE.ink;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', button.x + button.width / 2, button.y + button.height / 2 + 1);
  ctx.restore();
  ctx.fillStyle = TABLE.cream;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Mana ${game.player.mana}/${game.player.maxMana}`, button.x - 16, button.y + 28);
}

function drawLog(ctx, game) {
  // Left of the table, clear of the played card and both hands.
  const lines = game.log.slice(-3);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(245,236,215,0.6)';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('BATTLE LOG', 40, 252);
  lines.forEach((line, index) => {
    ctx.globalAlpha = index === lines.length - 1 ? 1 : 0.55;
    ctx.fillStyle = TABLE.cream;
    ctx.font = index === lines.length - 1 ? 'bold 18px Georgia, serif' : '16px Georgia, serif';
    ctx.fillText(line, 40, 282 + index * 28);
  });
  ctx.globalAlpha = 1;
}

function drawPlayedCard(ctx, game) {
  if (!game.playedCard) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    roundRect(ctx, PLAYED_X, PLAYED_Y, CARD.width, CARD.height, CARD.radius);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Last played card', PLAYED_X + CARD.width / 2, PLAYED_Y + CARD.height / 2);
    return;
  }
  const label = game.playedBy === 'player' ? 'You played' : 'Rival played';
  ctx.fillStyle = TABLE.cream;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, PLAYED_X + CARD.width / 2, PLAYED_Y - 18);
  drawCard(ctx, game.playedCard, PLAYED_X, PLAYED_Y, CARD.width, CARD.height);
}

function drawFloaters(ctx, game) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const floater of game.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - floater.age / 1.4);
    ctx.fillStyle = floater.color;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(floater.text, floater.x, floater.y - floater.age * 40);
  }
  ctx.globalAlpha = 1;
}

function drawTable(ctx, game, hover) {
  drawFelt(ctx);
  // Rival panel, top left; player panel, left edge under the battle log —
  // both clear of the hands, so a wide hand never hides a life total.
  drawLifePanel(ctx, 28, 26, 'RIVAL · Warden Mira', game.rival.life, game.rival.shield, game.rival.mana, game.rival.maxMana, false);
  drawLifePanel(ctx, 28, 384, 'YOU · Ember Duelist', game.player.life, game.player.shield, game.player.mana, game.player.maxMana, false);
  // Round, top centre.
  ctx.fillStyle = TABLE.cream;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ROUND ${game.round}`, 640, 44);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = 'rgba(245,236,215,0.8)';
  ctx.fillText(game.turn === 'player' ? 'Your turn — click a card to play it' : 'Rival is playing…', 640, 72);
  // Deck counts, top right.
  ctx.textAlign = 'right';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillStyle = TABLE.cream;
  ctx.fillText(`Rival deck ${game.rival.deck.length} · Your deck ${game.player.deck.length}`, 1252, 44);
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Discard ${game.player.discard.length} · Rival discard ${game.rival.discard.length}`, 1252, 70);
  // Rival hand, face down.
  for (const spot of rivalHandLayout(game.rival.hand.length)) {
    drawCardBack(ctx, spot.x, spot.y, spot.width, spot.height);
  }
  ctx.fillStyle = 'rgba(245,236,215,0.75)';
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Rival hand · ${game.rival.hand.length} cards`, 28, RIVAL_HAND_Y + 58);
  // Played card and the running log.
  drawPlayedCard(ctx, game);
  drawLog(ctx, game);
  // Player hand.
  const spots = handLayout(game.player.hand.length);
  game.player.hand.forEach((card, index) => {
    const spot = spots[index];
    drawCard(ctx, card, spot.x, spot.y, CARD.width, CARD.height, {
      hover: hover === index,
      dim: card.cost > game.player.mana || game.turn !== 'player',
    });
  });
  // Element advantage key, bottom centre.
  ctx.fillStyle = 'rgba(245,236,215,0.85)';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ember beats Thorn · Thorn beats Tide · Tide beats Gale · Gale beats Ember — a winning element deals double damage', 640, 466);
  drawManaAndButton(ctx, game, hover === 'end');
  drawFloaters(ctx, game);
}

function drawTitleScreen(ctx, game) {
  drawFelt(ctx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('EMBER DUEL', 640, 150);
  ctx.fillStyle = TABLE.cream;
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('A duel of elemental cards against Warden Mira', 640, 215);
  // The four elements, as a legend.
  const names = Object.keys(ELEMENTS);
  names.forEach((key, index) => {
    const element = ELEMENTS[key];
    const x = 340 + index * 200;
    drawGlyph(ctx, element.glyph, x, 300, 30, element.color);
    ctx.fillStyle = TABLE.cream;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(element.name, x, 350);
    ctx.fillStyle = 'rgba(245,236,215,0.75)';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`beats ${ELEMENTS[element.beats].name}`, x, 378);
  });
  // How to play.
  ctx.fillStyle = TABLE.cream;
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Both duelists start at 30 life. Each round you gain mana and draw a card.', 640, 440);
  ctx.fillText('Click a card to play it — attacks, heals, shields and scouts.', 640, 474);
  ctx.fillText('Match the element your rival just played to deal double damage.', 640, 508);
  ctx.fillText('First to bring the other to 0 life wins the duel.', 640, 542);
  // A fanned preview of four cards, drawn at half scale.
  const preview = [
    { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 4, attack: 8, heal: 0, shield: 0, draw: 0, text: 'The whole field catches light at once.' },
    { id: 'mend', name: 'Mend', element: 'tide', cost: 2, attack: 0, heal: 6, shield: 0, draw: 0, text: 'Cool water knits the wound shut.' },
    { id: 'ancient-oak', name: 'Ancient Oak', element: 'thorn', cost: 3, attack: 5, heal: 2, shield: 0, draw: 0, text: 'It strikes, and its roots drink deep.' },
    { id: 'aegis', name: 'Aegis', element: 'gale', cost: 2, attack: 0, heal: 0, shield: 6, draw: 0, text: 'A wall of wind turns the blow aside.' },
  ];
  preview.forEach((card, index) => {
    ctx.save();
    ctx.translate(330 + index * 168, 566);
    ctx.scale(0.52, 0.52);
    drawCard(ctx, card, 0, 0, CARD.width, CARD.height);
    ctx.restore();
  });
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', 640, 700 - 8);
}

function drawEndScreen(ctx, game, won) {
  drawTable(ctx, game, null);
  ctx.fillStyle = 'rgba(10,20,14,0.72)';
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? TABLE.gold : '#ff6b6b';
  ctx.font = 'bold 110px Georgia, serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 250);
  ctx.fillStyle = TABLE.cream;
  ctx.font = '28px Georgia, serif';
  ctx.fillText(
    won
      ? `Warden Mira falls. You win with ${game.player.life} life left after ${game.round} rounds.`
      : `Warden Mira wins. You lasted ${game.round} rounds.`,
    640,
    350,
  );
  ctx.font = '22px Georgia, serif';
  ctx.fillStyle = 'rgba(245,236,215,0.85)';
  ctx.fillText('Your hand, the table and both life totals are behind this banner.', 640, 400);
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('PRESS ENTER TO PLAY AGAIN', 640, 530);
}

/** Draw the whole game for the current screen. `hover` is a hand index, 'end', or null. */
export function renderGame(ctx, game, hover) {
  if (game.screen === SCREEN_TITLE) {
    drawTitleScreen(ctx, game);
    return;
  }
  if (game.screen === SCREEN_WIN) {
    drawEndScreen(ctx, game, true);
    return;
  }
  if (game.screen === SCREEN_LOSS) {
    drawEndScreen(ctx, game, false);
    return;
  }
  drawTable(ctx, game, hover);
}
