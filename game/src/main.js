// Boot: build the game, wire input, run Zephyra's turns on a beat so her
// plays read one at a time, and jump to a scripted state for screenshots.

import { createGame, endTurn, pushLog, startTurn } from './state.js';
import { planAiTurn } from './ai.js';
import { aiAttack, aiPlayCard, bindInput } from './input.js';
import { hideEnd, hideTitle, renderTable, showEnd, showTitle } from './render.js';
import { applyShot } from './shots.js';

let game = null;
let aiTimer = null;

function clearAiTimer() {
  if (aiTimer !== null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
}

function runAiTurn() {
  const plan = planAiTurn(game);
  let step = 0;
  const stepDelay = 650;
  const runStep = () => {
    if (game.phase !== 'play') return;
    const action = plan[step++];
    if (!action) return;
    if (action.type === 'play') aiPlayCard(game, action);
    else if (action.type === 'attack') aiAttack(game, action);
    else if (action.type === 'end') {
      startTurn(game, 'player');
      game.banner = 'Your turn — play a card, then attack.';
      renderTable(game);
      return;
    }
    renderTable(game);
    if (game.phase === 'won' || game.phase === 'lost') {
      showEnd(game);
      return;
    }
    aiTimer = setTimeout(runStep, stepDelay);
  };
  aiTimer = setTimeout(runStep, 700);
}

function endPlayerTurn() {
  if (game.phase !== 'play' || game.active !== 'player') return;
  clearAiTimer();
  game.selected = null;
  endTurn(game);
  renderTable(game);
  startTurn(game, 'ai');
  renderTable(game);
  runAiTurn();
}

function restart() {
  clearAiTimer();
  const seed = (game ? game.seed : 20261123) + 1;
  // Replace the state inside the same object, so the input handlers bound
  // once at boot keep pointing at the live game.
  const fresh = createGame(seed);
  for (const key of Object.keys(game)) delete game[key];
  Object.assign(game, fresh);
  hideEnd();
  showTitle();
  renderTable(game);
}

function bindAll() {
  bindInput(game, {
    endPlayerTurn,
    restart,
    afterPlayerAction() {
      // Nothing to do after a player action: the table already re-rendered.
    },
  });
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '20261123') || 20261123;
  game = createGame(seed);
  bindAll();
  if (shot) {
    applyShot(game, shot);
    hideTitle();
    if (game.phase === 'won' || game.phase === 'lost') showEnd(game);
    renderTable(game);
    return;
  }
  game.banner = 'Four winds. One spire. Your move.';
  pushLog(game, 'Welcome to the spire. The winds are watching.');
  showTitle();
  renderTable(game);
}

window.addEventListener('DOMContentLoaded', boot);
