// Deck building and drawing. A tiny seeded RNG (mulberry32) keeps shuffles
// reproducible for the scripted screenshot states, and fair in real games.

import { CARDS, DECKLIST } from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uidCounter = 0;

export function makeCardInstance(cardId) {
  const def = CARDS[cardId];
  return {
    uid: `c${++uidCounter}`,
    id: def.id,
    name: def.name,
    suit: def.suit,
    cost: def.cost,
    kind: def.kind,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    text: def.text,
    damage: def.damage ?? 0,
    heal: def.heal ?? 0,
    draw: def.draw ?? 0,
    aoe: def.aoe ?? 0,
  };
}

// A creature on the board carries its own damage and summoning sickness.
export function makeBoardCreature(card) {
  return {
    uid: card.uid,
    id: card.id,
    name: card.name,
    suit: card.suit,
    cost: card.cost,
    kind: 'creature',
    baseAtk: card.atk,
    baseHp: card.hp,
    dmg: 0,
    canAttack: false,
    justPlayed: true,
  };
}

export function buildDeck(rng) {
  const deck = [];
  for (const [cardId, count] of DECKLIST) {
    for (let i = 0; i < count; i++) deck.push(makeCardInstance(cardId));
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function drawCards(side, count, log) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (side.deck.length === 0) break;
    if (side.hand.length >= 8) {
      side.deck.shift();
      if (log) log.push('Hand is full — a drawn card is lost to the wind.');
      continue;
    }
    drawn.push(side.deck.shift());
    side.hand.push(drawn[drawn.length - 1]);
  }
  return drawn;
}
