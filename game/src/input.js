// Mouse and keyboard input: pick a hand card, play it, aim a spell, send a
// creature to attack, end the turn. Every click re-renders, so the table
// never shows a stale state.

import { canPlayCard, castSpell, checkEnd, otherSide, playCreature, attackWith, startTurn } from './state.js';
import { spellTarget } from './ai.js';
import { hideEnd, hideTitle, renderTable, showEnd } from './render.js';

function heroTarget(who) {
  return { kind: 'hero', who };
}

function creatureTarget(who, index) {
  return { kind: 'creature', who, index };
}

export function bindInput(game, hooks) {
  const table = document.getElementById('table');

  table.addEventListener('click', (event) => {
    // The End Turn button lives inside #table and is rebuilt on every
    // render, so it is handled here by delegation, not by a direct binding.
    if (event.target.closest('#end-turn')) {
      if (game.phase === 'play' && game.active === 'player') hooks.endPlayerTurn();
      return;
    }
    if (game.phase !== 'play' || game.active !== 'player') return;
    const cardNode = event.target.closest('.card');
    const heroNode = event.target.closest('.hero');

    // A spell is waiting for a target.
    if (game.selected && game.selected.kind === 'spell') {
      const card = game.player.hand[game.selected.index];
      if (!card) {
        game.selected = null;
        renderTable(game);
        return;
      }
      let target = null;
      if (card.damage > 0) {
        if (cardNode && cardNode.closest('.ai-board')) target = creatureTarget('ai', Number(cardNode.dataset.index));
        else if (heroNode && heroNode.dataset.who === 'ai') target = heroTarget('ai');
      } else if (card.heal > 0 && heroNode && heroNode.dataset.who === 'player') {
        target = heroTarget('player');
      }
      if (target) {
        const idx = game.selected.index;
        game.selected = null;
        castSpell(game, 'player', idx, target);
        afterAction(game, hooks);
      }
      return;
    }

    // An attacker is waiting for a target.
    if (game.selected && game.selected.kind === 'board') {
      let target = null;
      if (cardNode && cardNode.closest('.ai-board')) target = creatureTarget('ai', Number(cardNode.dataset.index));
      else if (heroNode && heroNode.dataset.who === 'ai') target = heroTarget('ai');
      if (target) {
        const idx = game.selected.index;
        game.selected = null;
        attackWith(game, 'player', idx, target);
        afterAction(game, hooks);
        return;
      }
      game.selected = null;
      renderTable(game);
      return;
    }

    // Pick a card from the hand.
    if (cardNode && cardNode.closest('.player-hand')) {
      const index = Number(cardNode.dataset.index);
      const card = game.player.hand[index];
      if (!card || !canPlayCard(game, 'player', index)) return;
      if (card.kind === 'creature') {
        playCreature(game, 'player', index);
        afterAction(game, hooks);
      } else if (card.damage > 0) {
        game.selected = { kind: 'spell', index };
        game.banner = `Aim ${card.name} — click an enemy creature or Zephyra.`;
        renderTable(game);
      } else {
        castSpell(game, 'player', index, null);
        afterAction(game, hooks);
      }
      return;
    }

    // Pick one of your creatures to attack with.
    if (cardNode && cardNode.closest('.player-board')) {
      const index = Number(cardNode.dataset.index);
      const creature = game.player.board[index];
      if (!creature || !creature.canAttack) return;
      game.selected = { kind: 'board', index };
      game.banner = `${creature.name} is ready — click an enemy creature or Zephyra.`;
      renderTable(game);
    }
  });

  document.getElementById('play-button').addEventListener('click', () => {
    hideTitle();
    game.phase = 'play';
    startTurn(game, 'player');
    game.banner = 'Your turn — play a card, then attack.';
    renderTable(game);
  });

  document.getElementById('again-button').addEventListener('click', () => {
    hooks.restart();
  });

  document.addEventListener('keydown', (event) => {
    if (game.phase !== 'play' || game.active !== 'player') return;
    if (event.key === 'Enter' && !event.repeat) {
      hooks.endPlayerTurn();
    } else if (event.key === 'Escape') {
      game.selected = null;
      renderTable(game);
    } else if (/^[1-8]$/.test(event.key)) {
      const index = Number(event.key) - 1;
      const card = game.player.hand[index];
      if (card && canPlayCard(game, 'player', index) && card.kind === 'creature') {
        playCreature(game, 'player', index);
        afterAction(game, hooks);
      }
    }
  });
}

function afterAction(game, hooks) {
  game.selected = null;
  checkEnd(game);
  if (game.phase === 'play' && game.active === 'player') {
    game.banner = 'Your turn — play a card, then attack.';
  }
  renderTable(game);
  if (game.phase === 'won' || game.phase === 'lost') {
    showEnd(game);
    return;
  }
  hooks.afterPlayerAction();
}

export function aiPlayCard(game, action) {
  const card = game.ai.hand[action.handIndex];
  if (!card) return;
  if (card.kind === 'creature') {
    playCreature(game, 'ai', action.handIndex);
  } else {
    const target = card.damage > 0 ? spellTarget(game, 'ai', card) : null;
    castSpell(game, 'ai', action.handIndex, target);
  }
}

export function aiAttack(game, action) {
  const idx = game.ai.board.findIndex((c) => c.uid === action.uid);
  if (idx < 0) return;
  let target = action.target;
  if (target.kind === 'creature' && target.uid) {
    const ti = game.player.board.findIndex((c) => c.uid === target.uid);
    if (ti < 0) target = heroTarget('player');
    else target = creatureTarget('player', ti);
  }
  attackWith(game, 'ai', idx, target);
}

export { hideEnd };
