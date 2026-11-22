// Scripted states for the screenshots (?shot=title|table|win|loss).
// Each one builds a fixed, readable table from named cards — no randomness —
// so every screenshot is a real render of the game's own code and can be
// retaken byte-identically.

import { makeBoardCreature, makeCardInstance } from './deck.js';
import { pushLog } from './state.js';

function boardCreature(cardId, dmg = 0, canAttack = true) {
  const c = makeBoardCreature(makeCardInstance(cardId));
  c.dmg = dmg;
  c.canAttack = canAttack;
  c.justPlayed = false;
  return c;
}

function handCards(ids) {
  return ids.map((id) => makeCardInstance(id));
}

export function applyShot(game, shot) {
  game.phase = 'play';
  game.log = [];
  if (shot === 'title') {
    game.phase = 'title';
    return;
  }
  if (shot === 'table') {
    game.turn = 6;
    game.player.hp = 24;
    game.player.maxMana = 6;
    game.player.mana = 4;
    game.player.deck = Array.from({ length: 12 }, () => makeCardInstance('ember-imp'));
    game.player.hand = handCards(['flame-burst', 'tide-serpent', 'windfall', 'stone-golem', 'quake']);
    game.player.board = [
      boardCreature('gale-stormrider'),
      boardCreature('ember-imp'),
      boardCreature('ember-phoenix'),
    ];
    game.ai.hp = 19;
    game.ai.maxMana = 6;
    game.ai.mana = 2;
    game.ai.deck = Array.from({ length: 13 }, () => makeCardInstance('tide-sprite'));
    game.ai.hand = [makeCardInstance('ember-imp'), makeCardInstance('tide-sprite'), makeCardInstance('gale-kite'), makeCardInstance('stone-cub')];
    game.ai.board = [boardCreature('tide-serpent'), boardCreature('gale-kite', 1)];
    game.banner = 'Your turn — 4 mana';
    pushLog(game, 'You summon Gale Stormrider (3).');
    pushLog(game, 'Zephyra summons Tide Serpent (4).');
    pushLog(game, 'Ember Imp (2) strikes Zephyra for 2.');
    pushLog(game, 'Stone Golem holds the line.');
    return;
  }
  if (shot === 'win') {
    game.turn = 9;
    game.player.hp = 14;
    game.player.maxMana = 8;
    game.player.mana = 1;
    game.player.deck = Array.from({ length: 6 }, () => makeCardInstance('ember-imp'));
    game.player.hand = handCards(['healing-spring', 'stone-titan']);
    game.player.board = [boardCreature('ember-dragon'), boardCreature('tide-leviathan', 2)];
    game.ai.hp = 0;
    game.ai.maxMana = 8;
    game.ai.mana = 0;
    game.ai.deck = Array.from({ length: 4 }, () => makeCardInstance('tide-sprite'));
    game.ai.hand = [makeCardInstance('gale-kite')];
    game.ai.board = [];
    pushLog(game, 'Ember Dragon (7) strikes Zephyra for 7.');
    pushLog(game, 'Zephyra falls. The Four Winds bow to you.');
    game.stats = { cardsPlayed: 16, damageDealt: 34, creaturesSummoned: 10, turnsTaken: 9 };
    game.phase = 'won';
    game.banner = 'Victory — the spire is yours.';
    return;
  }
  if (shot === 'loss') {
    game.turn = 8;
    game.player.hp = 0;
    game.player.maxMana = 7;
    game.player.mana = 0;
    game.player.deck = Array.from({ length: 7 }, () => makeCardInstance('ember-imp'));
    game.player.hand = handCards(['flame-burst', 'tide-sprite']);
    game.player.board = [boardCreature('stone-cub', 2)];
    game.ai.hp = 17;
    game.ai.maxMana = 7;
    game.ai.mana = 3;
    game.ai.deck = Array.from({ length: 8 }, () => makeCardInstance('tide-sprite'));
    game.ai.hand = [makeCardInstance('ember-phoenix'), makeCardInstance('gale-kite')];
    game.ai.board = [boardCreature('ember-dragon'), boardCreature('tide-serpent', 1)];
    pushLog(game, 'Ember Dragon (7) strikes you for 7.');
    pushLog(game, 'Your light fades. Zephyra holds the spire.');
    game.stats = { cardsPlayed: 12, damageDealt: 21, creaturesSummoned: 7, turnsTaken: 8 };
    game.phase = 'lost';
    game.banner = 'Defeat — the spire keeps its secret.';
    return;
  }
  // Unknown shot: fall back to the title screen.
  game.phase = 'title';
}

// The four screenshots the entry ships, in dossier order.
export const SHOTS = [
  { name: '1-title.jpg', query: '?shot=title&seed=1' },
  { name: '2-table.jpg', query: '?shot=table&seed=1' },
  { name: '3-win.jpg', query: '?shot=win&seed=1' },
  { name: '4-loss.jpg', query: '?shot=loss&seed=1' },
];
