// Game state and rules: turns, mana, resonance, combat and win/loss.
// No DOM lives here, so the rules can be tested on their own.

import { AI_START_HAND, BOARD_MAX, MAX_MANA, START_HAND, START_HP } from './config.js';
import { buildDeck, drawCards, makeBoardCreature, mulberry32 } from './deck.js';

export function newSide(rng) {
  return {
    hp: START_HP,
    maxHp: START_HP,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    fatigue: 0,
  };
}

export function createGame(seed = 20261123) {
  const rng = mulberry32(seed);
  const game = {
    seed,
    rng,
    turn: 1,
    phase: 'title', // title | play | won | lost
    active: 'player',
    log: [],
    stats: { cardsPlayed: 0, damageDealt: 0, creaturesSummoned: 0, turnsTaken: 0 },
    player: newSide(rng),
    ai: newSide(rng),
    selected: null, // { kind: 'hand'|'board', index } | { kind: 'spell', index }
    banner: '',
  };
  drawCards(game.player, START_HAND);
  drawCards(game.ai, AI_START_HAND);
  return game;
}

export function pushLog(game, text) {
  game.log.push(`Turn ${game.turn} — ${text}`);
  if (game.log.length > 40) game.log.splice(0, game.log.length - 40);
}

export function otherSide(who) {
  return who === 'player' ? 'ai' : 'player';
}

export function sideName(who) {
  return who === 'player' ? 'You' : 'Zephyra';
}

// Resonance: a creature gains +1 attack and +1 health for each other friendly
// creature of the same wind. Same-suit boards hit harder — build around it.
export function resonanceCount(game, who, creature) {
  return game[who].board.filter((c) => c.uid !== creature.uid && c.suit === creature.suit).length;
}

export function effectiveAtk(game, who, creature) {
  return creature.baseAtk + resonanceCount(game, who, creature);
}

export function effectiveMaxHp(game, who, creature) {
  return creature.baseHp + resonanceCount(game, who, creature);
}

export function creatureHp(game, who, creature) {
  return effectiveMaxHp(game, who, creature) - creature.dmg;
}

export function isDead(game, who, creature) {
  return creatureHp(game, who, creature) <= 0;
}

export function sweepDead(game, who) {
  const before = game[who].board.length;
  game[who].board = game[who].board.filter((c) => !isDead(game, who, c));
  return before - game[who].board.length;
}

export function startTurn(game, who) {
  const side = game[who];
  side.maxMana = Math.min(MAX_MANA, side.maxMana + 1);
  side.mana = side.maxMana;
  for (const creature of side.board) {
    creature.canAttack = true;
    creature.justPlayed = false;
  }
  const drawn = drawCards(side, 1);
  if (drawn.length === 0) {
    side.fatigue += 1;
    side.hp -= side.fatigue;
    pushLog(game, `${sideName(who)} draws from an empty deck and takes ${side.fatigue} fatigue.`);
  }
  if (who === 'player') {
    game.stats.turnsTaken += 1;
    game.banner = `Your turn — ${side.mana} mana`;
  }
  game.active = who;
  checkEnd(game);
}

export function canPlayCard(game, who, handIndex) {
  const side = game[who];
  const card = side.hand[handIndex];
  if (!card) return false;
  if (card.cost > side.mana) return false;
  if (card.kind === 'creature' && side.board.length >= BOARD_MAX) return false;
  return true;
}

export function playCreature(game, who, handIndex) {
  const side = game[who];
  const card = side.hand[handIndex];
  if (!card || card.kind !== 'creature' || !canPlayCard(game, who, handIndex)) return null;
  side.hand.splice(handIndex, 1);
  side.mana -= card.cost;
  const creature = makeBoardCreature(card);
  side.board.push(creature);
  game.stats.cardsPlayed += 1;
  game.stats.creaturesSummoned += 1;
  pushLog(game, `${sideName(who)} summons ${card.name} (${card.cost}).`);
  return creature;
}

// target: { kind: 'hero', who } or { kind: 'creature', who, index } or null
// for spells that need no target (heal, draw, quake).
export function castSpell(game, who, handIndex, target) {
  const side = game[who];
  const card = side.hand[handIndex];
  if (!card || card.kind !== 'spell' || !canPlayCard(game, who, handIndex)) return false;
  if (card.damage > 0 && !target) return false;
  side.hand.splice(handIndex, 1);
  side.mana -= card.cost;
  game.stats.cardsPlayed += 1;
  const foe = otherSide(who);
  if (card.damage > 0 && target) {
    dealDamage(game, who, target, card.damage);
    pushLog(game, `${sideName(who)} casts ${card.name} for ${card.damage}.`);
  }
  if (card.heal > 0) {
    side.hp = Math.min(side.maxHp, side.hp + card.heal);
    pushLog(game, `${sideName(who)} casts ${card.name} and restores ${card.heal} life.`);
  }
  if (card.aoe > 0) {
    for (const creature of [...game[foe].board]) {
      creature.dmg += card.aoe;
    }
    const fallen = sweepDead(game, foe);
    pushLog(game, `${sideName(who)} casts ${card.name}: ${card.aoe} to every enemy creature${fallen ? `, ${fallen} fall` : ''}.`);
  }
  if (card.draw > 0) {
    const drawn = drawCards(side, card.draw);
    pushLog(game, `${sideName(who)} casts ${card.name} and draws ${drawn.length}.`);
  }
  checkEnd(game);
  return true;
}

export function dealDamage(game, fromWho, target, amount) {
  if (target.kind === 'hero') {
    const side = game[target.who];
    side.hp -= amount;
    if (fromWho === 'player') game.stats.damageDealt += amount;
    pushLog(game, `${sideName(target.who)} takes ${amount} damage.`);
  } else {
    const creature = game[target.who].board[target.index];
    if (!creature) return;
    creature.dmg += amount;
    if (fromWho === 'player') game.stats.damageDealt += amount;
    pushLog(game, `${creature.name} takes ${amount} damage.`);
    sweepDead(game, target.who);
  }
  checkEnd(game);
}

export function attackWith(game, who, boardIndex, target) {
  const side = game[who];
  const attacker = side.board[boardIndex];
  if (!attacker || !attacker.canAttack) return false;
  const atk = effectiveAtk(game, who, attacker);
  attacker.canAttack = false;
  if (target.kind === 'hero') {
    dealDamage(game, who, target, atk);
    pushLog(game, `${attacker.name} strikes ${sideName(target.who)} for ${atk}.`);
  } else {
    const defender = game[target.who].board[target.index];
    if (!defender) return false;
    const defAtk = effectiveAtk(game, target.who, defender);
    defender.dmg += atk;
    attacker.dmg += defAtk;
    if (who === 'player') game.stats.damageDealt += atk;
    pushLog(game, `${attacker.name} (${atk}) trades with ${defender.name} (${defAtk}).`);
    sweepDead(game, target.who);
    sweepDead(game, who);
  }
  checkEnd(game);
  return true;
}

export function endTurn(game) {
  game.selected = null;
  game.turn += 1;
  game.banner = 'Zephyra takes the table…';
}

export function checkEnd(game) {
  if (game.phase === 'won' || game.phase === 'lost') return;
  if (game.ai.hp <= 0) {
    game.phase = 'won';
    game.banner = 'Victory — the spire is yours.';
    pushLog(game, 'Zephyra falls. The Four Winds bow to you.');
  } else if (game.player.hp <= 0) {
    game.phase = 'lost';
    game.banner = 'Defeat — the spire keeps its secret.';
    pushLog(game, 'Your light fades. Zephyra holds the spire.');
  }
}

export function boardPower(game, who) {
  return game[who].board.reduce((sum, c) => sum + effectiveAtk(game, who, c), 0);
}
