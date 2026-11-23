[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/fulede9394/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/fulede9394/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Duel

An original turn-based elemental card duel for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You face Warden Mira across a green felt table: both duelists start at 30 life, gain mana each round, and play cards from a 32-card deck of four original elements — Ember, Tide, Thorn and Gale.

## How it plays

- **Mana and draw:** each round you gain +1 max mana (up to 8) and draw a card. Click a card to play it, or press keys 1–8; Space or the END TURN button ends your turn.
- **Elements matter:** Ember beats Thorn, Thorn beats Tide, Tide beats Gale, Gale beats Ember. Attacking with the element that beats your rival's last played element deals **double damage**.
- **Card types:** attacks, heals (Mend), shields (Aegis) and scouts that draw extra cards. The rival heals when hurt, shields when pressed, and picks its strongest affordable attack — so its choices can be read and countered.
- **Win or lose:** first life total to reach 0 ends the duel, with a victory or defeat screen.

## Play it

Serve `game/` with any static server (`node serve.ts`, then open http://localhost:8080) — no build step, no network requests, vanilla JS + Canvas.

Screenshot scenes are deterministic: `?shot=title|play|win|loss&seed=1` stages each screen from the real rules, so the screenshots are exact replays.
