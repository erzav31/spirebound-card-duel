// Zephyra's brain: a readable heuristic opponent. It plays what it can
// afford, spends damage where it counts, and attacks with a plan — lethal
// first, then trades it wins, then straight at the hero.

import { canPlayCard, effectiveAtk, otherSide } from './state.js';

function cardValue(game, card) {
  if (card.kind === 'creature') return card.atk + card.hp + card.cost * 0.5;
  if (card.damage > 0) return card.damage * 1.4;
  if (card.heal > 0) return game.ai.hp < 18 ? 6 : 1.5;
  if (card.draw > 0) return 4;
  if (card.aoe > 0) return game.player.board.length > 0 ? 5 : 0.5;
  return 1;
}

// Plan the whole AI turn up front as a list of actions, so the UI can play
// them out one by one with a beat between each.
export function planAiTurn(game) {
  const plan = [];
  const ai = game.ai;
  let mana = ai.mana;

  // 1. Play cards, best value per mana first, while anything is affordable.
  for (;;) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < ai.hand.length; i++) {
      const card = ai.hand[i];
      if (card.cost > mana) continue;
      if (card.kind === 'creature' && ai.board.length >= 5) continue;
      if (card.kind === 'spell' && card.aoe > 0 && game.player.board.length === 0) continue;
      if (card.kind === 'spell' && card.heal > 0 && ai.hp >= 28) continue;
      const score = cardValue(game, card) / Math.max(1, card.cost);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0) break;
    const card = ai.hand[best];
    plan.push({ type: 'play', handIndex: best, cardId: card.id });
    mana -= card.cost;
    if (card.kind === 'creature') {
      // Pretend the creature is on the board so later value calls see it.
      ai.board.push({ suit: card.suit, baseAtk: card.atk, baseHp: card.hp, uid: `plan-${plan.length}`, dmg: 0 });
    }
  }
  // Drop the pretend creatures; the real ones arrive when actions execute.
  ai.board = ai.board.filter((c) => !String(c.uid).startsWith('plan-'));

  // 2. Direct damage spells go face when they can close the game, or when
  //    the board is empty and there is nothing better to hit.
  //    (Handled inside play steps: damage spells target the hero by default.)

  // 3. Attack with every creature that can: lethal first, then a trade the
  //    attacker wins, then face. Targets are tracked by uid, because the
  //    board shifts as creatures fall during the plan's execution.
  const attackers = ai.board.map((c) => c).filter((c) => c.canAttack);
  for (const attacker of attackers) {
    const atk = effectiveAtk(game, 'ai', attacker);
    const foeBoard = game.player.board;
    let target = { kind: 'hero', who: 'player' };
    // Finisher instinct: a wounded hero is finished, never traded with.
    if (atk < game.player.hp && game.player.hp > 10) {
      // Best trade: a defender this attacker kills while surviving.
      let bestDef = null;
      let bestGain = 0;
      for (const def of foeBoard) {
        const defHp = def.baseHp - def.dmg;
        const defAtk = effectiveAtk(game, 'player', def);
        if (atk >= defHp && defAtk < attacker.baseHp - attacker.dmg) {
          const gain = def.cost + def.baseAtk - attacker.cost;
          if (gain > bestGain) {
            bestGain = gain;
            bestDef = def;
          }
        }
      }
      if (bestDef) target = { kind: 'creature', who: 'player', uid: bestDef.uid };
    }
    plan.push({ type: 'attack', uid: attacker.uid, target });
  }
  plan.push({ type: 'end' });
  return plan;
}

// Where a damage spell should land: a creature the spell kills, else face.
export function spellTarget(game, who, card) {
  const foe = otherSide(who);
  if (card.damage <= 0) return null;
  for (let i = 0; i < game[foe].board.length; i++) {
    const creature = game[foe].board[i];
    if (creature.baseHp - creature.dmg <= card.damage) {
      return { kind: 'creature', who: foe, index: i };
    }
  }
  return { kind: 'hero', who: foe };
}
