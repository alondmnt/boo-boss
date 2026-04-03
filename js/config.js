/**
 * CONFIG — frozen game settings: creature/room rosters, wave progression, scoring.
 * UNLOCK_TIERS — progression milestones with coin thresholds.
 */
const CONFIG = {
  /* ─── Creatures ─── */
  creatures: ['spider', 'gorilla', 'bat', 'cat'],
  creatureCooldowns: {
    spider: 15000, gorilla: 18000, bat: 12000, cat: 14000,
    owl: 14000, snake: 16000, rat: 13000,
  },

  /* ─── Monster types (MVP: auto-assigned, no player choice) ─── */
  monsterTypes: ['zombie', 'witch', 'skeleton'],
  defaultMonsterType: {
    spider: 'skeleton', gorilla: 'zombie', bat: 'zombie', cat: 'witch',
    owl: 'witch', snake: 'zombie', rat: 'skeleton',
  },

  /* ─── Actions (MVP: auto-assigned, no player choice) ─── */
  actions: ['jumpOut', 'grabHat', 'dropFromCeiling'],
  defaultAction: {
    spider: 'dropFromCeiling', gorilla: 'jumpOut', bat: 'dropFromCeiling',
    cat: 'jumpOut', owl: 'dropFromCeiling', snake: 'jumpOut', rat: 'jumpOut',
  },

  /* ─── Rooms ─── */
  rooms: {
    entrance:    { floor: 1, col: 0, label: 'Entrance Hall', colour: '#8B6914', locked: false },
    kitchen:     { floor: 1, col: 1, label: 'Kitchen',       colour: '#708090', locked: false },
    bedroom:     { floor: 2, col: 0, label: 'Bedroom',       colour: '#4B0082', locked: false },
    attic:       { floor: 2, col: 1, label: 'Attic',         colour: '#696969', locked: true },
    tower:       { floor: 3, col: 0, label: 'Tower',         colour: '#2F4F4F', locked: true },
    observatory: { floor: 3, col: 1, label: 'Observatory',   colour: '#191970', locked: true },
  },

  /** Room adjacency — rooms connected on foot (same floor). */
  adjacency: {
    entrance:    ['kitchen'],
    kitchen:     ['entrance'],
    bedroom:     ['attic'],
    attic:       ['bedroom'],
    tower:       ['observatory'],
    observatory: ['tower'],
  },

  /**
   * Full track route order (top-level, ordered for the dark ride).
   * GameState.getTrackRoute() filters this to unlocked rooms only.
   */
  fullTrackRoute: ['entrance', 'bedroom', 'attic', 'tower', 'observatory', 'kitchen'],

  /* ─── House SVG layout (px, viewBox-relative) ─── */
  house: {
    roomW: 160,
    roomH: 120,
    wallT: 6,
    roofH: 30,
    trainY: 20,
    // derived: svgW = 2 * roomW + 3 * wallT = 338
    // derived: svgH = 3 * roomH + 4 * wallT + roofH + trainY = 434
  },

  /* ─── Waves ─── */
  totalWaves: 10,
  waveSizing: { base: 3, perWave: 0.5 },
  visitorDwellMs: { min: 2000, max: 3000 },
  visitorRoomVisits: { min: 4, max: 6 },
  trainSpeedMs: 3000,
  trainStopMs: 600,

  /* ─── Scoring ─── */
  scoring: {
    scareBase: 10,
    combo2x: 1.5,
    combo3x: 2.0,
    waveBonusThreshold: 0.8,
    waveBonus: 50,
  },

  /* ─── Coins ─── */
  coinsPerWave: 1,
  coinsBonusWave: 1,

  /* ─── Creature lifetime ─── */
  creatureLifetimeMs: 15000,
};

const UNLOCK_TIERS = [
  { coins: 5,  key: 'owl',             icon: '🦉', label: 'Owl creature!' },
  { coins: 10, key: 'attic',           icon: '🏚️', label: 'Attic unlocked!' },
  { coins: 18, key: 'snake',           icon: '🐍', label: 'Snake creature!' },
  { coins: 25, key: 'fasterCooldowns', icon: '⏱️', label: 'Faster cooldowns!' },
  { coins: 35, key: 'rat',             icon: '🐀', label: 'Rat creature!' },
  { coins: 40, key: 'endlessMode',     icon: '♾️',  label: 'Endless mode!' },
];

/** Deep-freeze CONFIG and UNLOCK_TIERS to prevent accidental mutation. */
function _deepFreeze(obj) {
  Object.freeze(obj);
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) _deepFreeze(v);
  }
  return obj;
}
_deepFreeze(CONFIG);
_deepFreeze(UNLOCK_TIERS);
