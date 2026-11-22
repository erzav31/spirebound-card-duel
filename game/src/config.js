// SPIREBOUND — Duel of the Four Winds
// Card pool, suits and tuning constants. Every card, name and rule here is
// original work for this game: no commercial game's cards are copied.

export const START_HP = 30;
export const MAX_MANA = 10;
export const BOARD_MAX = 5;
export const HAND_MAX = 8;
export const START_HAND = 3;
// The second duelist draws one extra card to balance going second.
export const AI_START_HAND = 4;

// Four winds, told apart by colour AND shape, never by text alone.
export const SUITS = {
  ember: { key: 'ember', name: 'Ember', glyph: '\u25B2', color: '#e5484d', deep: '#7f1d1d', wash: '#fde8e8' },
  tide: { key: 'tide', name: 'Tide', glyph: '\u25CF', color: '#2f7fe0', deep: '#123a6e', wash: '#e3eefc' },
  gale: { key: 'gale', name: 'Gale', glyph: '\u25C6', color: '#1f9d63', deep: '#0b4d2e', wash: '#e2f6ec' },
  stone: { key: 'stone', name: 'Stone', glyph: '\u25A0', color: '#d9930d', deep: '#6b4a08', wash: '#fdf3d7' },
};

export const SUIT_ORDER = ['ember', 'tide', 'gale', 'stone'];

// id, name, suit, cost, kind, attack, health, rules text.
// Creatures fight on the board. Spells resolve at once, then leave the game.
export const CARDS = {
  'ember-imp': { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', cost: 1, kind: 'creature', atk: 2, hp: 1, text: 'Quick spark. Hits hard, burns out fast.' },
  'tide-sprite': { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', cost: 1, kind: 'creature', atk: 1, hp: 2, text: 'Patient water. Hard to wash away.' },
  'gale-kite': { id: 'gale-kite', name: 'Gale Kite', suit: 'gale', cost: 2, kind: 'creature', atk: 3, hp: 2, text: 'Strikes from above, then rides away.' },
  'stone-cub': { id: 'stone-cub', name: 'Stone Cub', suit: 'stone', cost: 2, kind: 'creature', atk: 2, hp: 3, text: 'Small boulder, big attitude.' },
  'ember-phoenix': { id: 'ember-phoenix', name: 'Ember Phoenix', suit: 'ember', cost: 4, kind: 'creature', atk: 4, hp: 3, text: 'Rises again in every hand it haunts.' },
  'tide-serpent': { id: 'tide-serpent', name: 'Tide Serpent', suit: 'tide', cost: 4, kind: 'creature', atk: 5, hp: 4, text: 'The deep answers when it coils.' },
  'gale-stormrider': { id: 'gale-stormrider', name: 'Gale Stormrider', suit: 'gale', cost: 3, kind: 'creature', atk: 3, hp: 3, text: 'Rides the front of every storm.' },
  'stone-golem': { id: 'stone-golem', name: 'Stone Golem', suit: 'stone', cost: 3, kind: 'creature', atk: 2, hp: 5, text: 'A wall that learned to walk.' },
  'ember-dragon': { id: 'ember-dragon', name: 'Ember Dragon', suit: 'ember', cost: 6, kind: 'creature', atk: 7, hp: 5, text: 'The spire itself, breathing fire.' },
  'tide-leviathan': { id: 'tide-leviathan', name: 'Tide Leviathan', suit: 'tide', cost: 6, kind: 'creature', atk: 6, hp: 7, text: 'Whole fleets have mistaken it for weather.' },
  'gale-tempest': { id: 'gale-tempest', name: 'Gale Tempest', suit: 'gale', cost: 5, kind: 'creature', atk: 6, hp: 4, text: 'A hurricane with somewhere to be.' },
  'stone-titan': { id: 'stone-titan', name: 'Stone Titan', suit: 'stone', cost: 5, kind: 'creature', atk: 5, hp: 6, text: 'Mountains do not hurry. They arrive.' },
  'flame-burst': { id: 'flame-burst', name: 'Flame Burst', suit: 'ember', cost: 2, kind: 'spell', text: 'Deal 3 damage to any target.', damage: 3 },
  'healing-spring': { id: 'healing-spring', name: 'Healing Spring', suit: 'tide', cost: 2, kind: 'spell', text: 'Restore 5 life to your hero.', heal: 5 },
  'windfall': { id: 'windfall', name: 'Windfall', suit: 'gale', cost: 2, kind: 'spell', text: 'Draw 2 cards.', draw: 2 },
  'quake': { id: 'quake', name: 'Quake', suit: 'stone', cost: 3, kind: 'spell', text: 'Deal 2 damage to all enemy creatures.', aoe: 2 },
  'ember-nova': { id: 'ember-nova', name: 'Ember Nova', suit: 'ember', cost: 5, kind: 'spell', text: 'Deal 5 damage to any target.', damage: 5 },
  'tidal-surge': { id: 'tidal-surge', name: 'Tidal Surge', suit: 'tide', cost: 4, kind: 'spell', text: 'Deal 2 damage to all enemies and draw 1 card.', aoe: 2, draw: 1 },
};

// A 24-card deck: the same list builds both sides, so every duel is fair.
export const DECKLIST = [
  ['ember-imp', 2], ['tide-sprite', 2], ['gale-kite', 2], ['stone-cub', 2],
  ['ember-phoenix', 1], ['tide-serpent', 1], ['gale-stormrider', 2], ['stone-golem', 2],
  ['ember-dragon', 1], ['tide-leviathan', 1], ['gale-tempest', 1], ['stone-titan', 1],
  ['flame-burst', 2], ['healing-spring', 1], ['windfall', 1], ['quake', 1],
  ['ember-nova', 1], ['tidal-surge', 1],
];

export const AI_NAME = 'Zephyra';
export const AI_TITLE = 'Warden of the Spire';
export const PLAYER_NAME = 'You';
export const PLAYER_TITLE = 'Challenger of the Winds';
