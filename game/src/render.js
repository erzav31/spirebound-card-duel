// DOM rendering: the table, the hands, the cards and the overlays.
// Everything visible is built here from the game state, so a screenshot
// always shows exactly what the rules say is on the table.

import { AI_NAME, AI_TITLE, PLAYER_NAME, PLAYER_TITLE, SUITS } from './config.js';
import { creatureHp, effectiveAtk, effectiveMaxHp, resonanceCount } from './state.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function suitBadge(suitKey) {
  const suit = SUITS[suitKey];
  const badge = el('span', 'suit-badge');
  badge.style.setProperty('--suit', suit.color);
  badge.textContent = suit.glyph;
  badge.title = suit.name;
  return badge;
}

function manaPips(side) {
  const wrap = el('div', 'mana');
  for (let i = 0; i < 10; i++) {
    const pip = el('span', 'mana-pip' + (i < side.mana ? ' filled' : '') + (i < side.maxMana ? '' : ' locked'));
    wrap.appendChild(pip);
  }
  wrap.appendChild(el('span', 'mana-text', `${side.mana}/${side.maxMana}`));
  return wrap;
}

function hpBar(side) {
  const wrap = el('div', 'hpbar');
  const fill = el('div', 'hpbar-fill');
  fill.style.width = `${Math.max(0, Math.min(100, (side.hp / side.maxHp) * 100))}%`;
  if (side.hp <= 10) fill.classList.add('low');
  wrap.appendChild(fill);
  wrap.appendChild(el('span', 'hpbar-text', `${Math.max(0, side.hp)} ❤`));
  return wrap;
}

function heroPanel(game, who) {
  const side = game[who];
  const isAi = who === 'ai';
  const panel = el('div', 'hero' + (isAi ? ' hero-ai' : ' hero-player'));
  const name = el('div', 'hero-name', isAi ? AI_NAME : PLAYER_NAME);
  name.appendChild(el('span', 'hero-title', isAi ? AI_TITLE : PLAYER_TITLE));
  panel.appendChild(name);
  panel.appendChild(hpBar(side));
  panel.appendChild(manaPips(side));
  const deck = el('div', 'deck-count', `Deck ${side.deck.length} · Hand ${side.hand.length}`);
  panel.appendChild(deck);
  panel.dataset.who = who;
  return panel;
}

// One card face. `mode` is 'hand' | 'board' | 'back'. Board cards show their
// live attack/health including resonance; hand cards show base values.
export function cardElement(game, who, card, mode, index) {
  if (mode === 'back') {
    const back = el('div', 'card card-back');
    back.appendChild(el('div', 'card-back-glyph', '✦'));
    back.appendChild(el('div', 'card-back-word', 'SPIREBOUND'));
    return back;
  }
  const suit = SUITS[card.suit];
  const node = el('div', `card suit-${card.suit}`);
  node.dataset.uid = card.uid;
  node.dataset.index = String(index);
  node.dataset.kind = card.kind;
  node.dataset.who = who;
  const cost = el('div', 'card-cost', String(card.cost));
  node.appendChild(cost);
  const art = el('div', 'card-art');
  art.appendChild(el('span', 'card-glyph', suit.glyph));
  art.appendChild(el('span', 'card-suit-name', suit.name.toUpperCase()));
  node.appendChild(art);
  node.appendChild(el('div', 'card-name', card.name));
  if (card.kind === 'creature') {
    let atk = card.atk ?? card.baseAtk ?? 0;
    let hp = card.hp ?? card.baseHp ?? 0;
    if (mode === 'board') {
      atk = effectiveAtk(game, who, card);
      hp = creatureHp(game, who, card);
    }
    const stats = el('div', 'card-stats');
    stats.appendChild(el('span', 'stat-atk', `⚔ ${atk}`));
    if (mode === 'board') {
      const res = resonanceCount(game, who, card);
      if (res > 0) stats.appendChild(el('span', 'stat-res', `+${res} wind`));
    }
    stats.appendChild(el('span', 'stat-hp', `❤ ${hp}`));
    node.appendChild(stats);
  } else {
    node.appendChild(el('div', 'card-text', card.text));
  }
  if (mode === 'board') {
    if (card.canAttack) node.classList.add('ready');
    if (card.justPlayed) node.classList.add('just-played');
  }
  return node;
}

function renderRow(game, who, where) {
  const side = game[who];
  const row = el('div', `board-row ${where}`);
  for (let i = 0; i < side.board.length; i++) {
    row.appendChild(cardElement(game, who, side.board[i], 'board', i));
  }
  if (side.board.length === 0) {
    row.appendChild(el('div', 'board-empty', where === 'ai-board' ? 'Zephyra has no creatures — yet.' : 'Your side of the table is empty. Play a creature!'));
  }
  return row;
}

function renderHand(game, who, interactive) {
  const side = game[who];
  const row = el('div', 'hand-row' + (who === 'ai' ? ' ai-hand' : ' player-hand'));
  if (who === 'ai') {
    for (let i = 0; i < side.hand.length; i++) row.appendChild(cardElement(game, who, null, 'back', i));
    row.appendChild(el('div', 'hand-count', `${side.hand.length} cards`));
    return row;
  }
  for (let i = 0; i < side.hand.length; i++) {
    const card = side.hand[i];
    const node = cardElement(game, who, card, 'hand', i);
    if (interactive && game.active === 'player' && game.phase === 'play') {
      const affordable = card.cost <= side.mana && !(card.kind === 'creature' && side.board.length >= 5);
      node.classList.add(affordable ? 'playable' : 'unplayable');
      if (game.selected && game.selected.kind === 'hand' && game.selected.index === i) node.classList.add('selected');
    }
    row.appendChild(node);
  }
  return row;
}

export function renderLog(game) {
  const box = document.getElementById('log');
  box.innerHTML = '';
  for (const line of game.log.slice(-6)) box.appendChild(el('div', 'log-line', line));
  box.scrollTop = box.scrollHeight;
}

export function renderTable(game) {
  const table = document.getElementById('table');
  table.innerHTML = '';
  const top = el('div', 'table-top');
  top.appendChild(heroPanel(game, 'ai'));
  top.appendChild(renderHand(game, 'ai', false));
  table.appendChild(top);
  table.appendChild(renderRow(game, 'ai', 'ai-board'));
  const mid = el('div', 'table-mid');
  const banner = el('div', 'banner', game.banner || `Turn ${game.turn}`);
  mid.appendChild(banner);
  const endBtn = el('button', 'end-turn', game.active === 'player' && game.phase === 'play' ? 'End Turn  ⏎' : 'Zephyra is thinking…');
  endBtn.id = 'end-turn';
  endBtn.disabled = !(game.active === 'player' && game.phase === 'play');
  mid.appendChild(endBtn);
  table.appendChild(mid);
  table.appendChild(renderRow(game, 'player', 'player-board'));
  const bottom = el('div', 'table-bottom');
  bottom.appendChild(renderHand(game, 'player', true));
  bottom.appendChild(heroPanel(game, 'player'));
  table.appendChild(bottom);
  renderLog(game);
  markSelection(game);
}

function markSelection(game) {
  const sel = game.selected;
  if (!sel) return;
  if (sel.kind === 'board') {
    const node = document.querySelector(`.player-board .card[data-index="${sel.index}"]`);
    if (node) node.classList.add('selected');
    document.querySelectorAll('.ai-board .card, .hero-ai').forEach((n) => n.classList.add('targetable'));
  }
  if (sel.kind === 'spell') {
    document.querySelectorAll('.ai-board .card, .hero-ai, .hero-player').forEach((n) => n.classList.add('targetable'));
  }
}

export function showTitle() {
  document.getElementById('title-screen').classList.remove('hidden');
  document.getElementById('end-screen').classList.add('hidden');
}

export function hideTitle() {
  document.getElementById('title-screen').classList.add('hidden');
}

export function showEnd(game) {
  const screen = document.getElementById('end-screen');
  const won = game.phase === 'won';
  screen.className = `overlay ${won ? 'win' : 'loss'}`;
  document.getElementById('end-heading').textContent = won ? 'VICTORY' : 'DEFEAT';
  document.getElementById('end-sub').textContent = won
    ? 'The Four Winds bow to you. The spire is yours.'
    : 'Zephyra holds the spire. The winds scatter your challenge.';
  document.getElementById('end-stats').innerHTML = '';
  const stats = [
    ['Turns', String(game.stats.turnsTaken)],
    ['Cards played', String(game.stats.cardsPlayed)],
    ['Creatures summoned', String(game.stats.creaturesSummoned)],
    ['Damage dealt', String(game.stats.damageDealt)],
    ['Your life', `${Math.max(0, game.player.hp)} / ${game.player.maxHp}`],
    ['Zephyra’s life', `${Math.max(0, game.ai.hp)} / ${game.ai.maxHp}`],
  ];
  for (const [label, value] of stats) {
    const row = el('div', 'stat-row');
    row.appendChild(el('span', 'stat-label', label));
    row.appendChild(el('span', 'stat-value', value));
    document.getElementById('end-stats').appendChild(row);
  }
  screen.classList.remove('hidden');
}

export function hideEnd() {
  document.getElementById('end-screen').classList.add('hidden');
}
