// Screenshot + playtest helper for Ember Duel (best-card-game-20261122-1826).
// Usage: node card-shots.mjs [baseUrl] [shotsJson] [outDir]
// Takes the 4 staged screenshots, then playtests the real game in the
// browser: start from the title screen, play a card, end the turn, and
// confirm the rival answers with zero console/page errors.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:8080';
const shotsFile = process.argv[3] || '/home/hatch/workspace/makefun/card-game/shots.json';
const outDir = process.argv[4] || '/home/hatch/workspace/makefun/card-game/screenshots';
const exe = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';

fs.mkdirSync(outDir, { recursive: true });
const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));

for (const shot of shots) {
  const url = base + '/' + shot.query;
  console.log('shot:', shot.name, url);
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  try {
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 20000 });
  } catch {
    console.log('  !! __shotReady never fired');
  }
  await page.waitForTimeout(1200);
  const file = path.join(outDir, shot.name);
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  const size = fs.statSync(file).size;
  console.log('  saved', file, (size / 1024).toFixed(1) + ' KiB');
  const state = await page.evaluate(() => ({
    screen: window.__game.screen,
    round: window.__game.round,
    playerLife: window.__game.player.life,
    rivalLife: window.__game.rival.life,
    playerHand: window.__game.player.hand.length,
    rivalHand: window.__game.rival.hand.length,
    errors: (window.__errors || []).slice(),
  }));
  console.log('  state:', JSON.stringify(state));
}

// --- interactive playtest ---
console.log('playtest: title -> start -> play card -> end turn -> rival answers');
await page.goto(base + '/', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 20000 });
await page.waitForTimeout(400);
let state = await page.evaluate(() => ({ screen: window.__game.screen }));
console.log('  title screen:', state.screen);
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
state = await page.evaluate(() => ({
  screen: window.__game.screen,
  hand: window.__game.player.hand.map((c) => `${c.name}(${c.cost})`),
  mana: window.__game.player.mana,
}));
console.log('  after start:', JSON.stringify(state));
// Play the first affordable card by clicking its hand position.
const handInfo = await page.evaluate(() => {
  const spots = [];
  const count = window.__game.player.hand.length;
  const total = count * 150 + (count - 1) * 12;
  const startX = (1280 - total) / 2;
  window.__game.player.hand.forEach((card, i) => {
    spots.push({ i, x: startX + i * 162 + 75, y: 486 + 104, affordable: card.cost <= window.__game.player.mana, name: card.name });
  });
  return spots;
});
const playable = handInfo.find((s) => s.affordable);
console.log('  clicking card:', JSON.stringify(playable));
await page.mouse.click(playable.x, playable.y);
await page.waitForTimeout(400);
state = await page.evaluate(() => ({
  screen: window.__game.screen,
  playerLife: window.__game.player.life,
  rivalLife: window.__game.rival.life,
  mana: window.__game.player.mana,
  hand: window.__game.player.hand.length,
  log: window.__game.log.slice(-2),
}));
console.log('  after play:', JSON.stringify(state));
await page.mouse.click(1158, 664); // END TURN button centre
await page.waitForTimeout(4000); // rival queue ticks out
state = await page.evaluate(() => ({
  screen: window.__game.screen,
  turn: window.__game.turn,
  round: window.__game.round,
  playerLife: window.__game.player.life,
  rivalLife: window.__game.rival.life,
  rivalHand: window.__game.rival.hand.length,
  log: window.__game.log.slice(-3),
  errors: (window.__errors || []).slice(),
}));
console.log('  after end turn:', JSON.stringify(state));
console.log('all console/page errors:', JSON.stringify(errors));
await browser.close();
