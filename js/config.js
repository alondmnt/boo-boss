/**
 * CONFIG — frozen game settings: creature/room rosters, wave progression, scoring.
 * UNLOCK_TIERS — progression milestones with coin thresholds.
 */
const CONFIG = {
  /* ─── Creatures ─── */
  creatures: ['spider', 'gorilla', 'bat', 'cat'],
  creatureIcons: {
    spider: '🕷️', gorilla: '🦍', bat: '🦇', cat: '🐱',
    dinosaur: '🦕', owl: '🦉', snake: '🐍', rat: '🐀',
  },
  creatureCooldowns: {
    spider: 15000, gorilla: 18000, bat: 12000, cat: 14000,
    dinosaur: 17000, owl: 14000, snake: 16000, rat: 13000,
  },

  /* ─── Monster types (auto-assigned until monster lab unlocks) ─── */
  monsterTypes: ['zombie', 'witch', 'skeleton'],
  monsterIcons: {
    zombie: '🧟', witch: '🧙', skeleton: '💀',
    vampire: '🧛', astronaut: '🧑‍🚀', ghost: '👻',
  },
  defaultMonsterType: {
    spider: 'skeleton', gorilla: 'zombie', bat: 'zombie', cat: 'witch',
    dinosaur: 'zombie', owl: 'witch', snake: 'zombie', rat: 'skeleton',
  },

  /* ─── Actions (MVP: auto-assigned, no player choice) ─── */
  actions: ['jumpOut', 'grabHat', 'dropFromCeiling'],
  defaultAction: {
    spider: 'dropFromCeiling', gorilla: 'jumpOut', bat: 'dropFromCeiling',
    cat: 'jumpOut', dinosaur: 'jumpOut', owl: 'dropFromCeiling', snake: 'jumpOut', rat: 'jumpOut',
  },

  /* ─── Rooms ─── */
  /*
   * Layout (side-view cutaway):
   *   F3:  Attic (left)    | Tower (right)
   *   F2:  Bathroom (left) | Bedroom (right)
   *   F1:  Entrance (left) | Kitchen (right)
   *
   * Track snakes: entrance -> kitchen -> bedroom -> bathroom -> attic -> tower -> (back down, exit)
   * Locked rooms are still part of the track (train passes through, doesn't stop).
   */
  rooms: {
    entrance: { floor: 1, col: 0, label: 'Entrance Hall', colour: '#8B6914', locked: false },
    kitchen:  { floor: 1, col: 1, label: 'Kitchen',       colour: '#708090', locked: false },
    bathroom: { floor: 2, col: 0, label: 'Bathroom',      colour: '#4a6a6a', locked: true },
    bedroom:  { floor: 2, col: 1, label: 'Bedroom',       colour: '#4B0082', locked: false },
    attic:    { floor: 3, col: 0, label: 'Attic',         colour: '#696969', locked: true },
    tower:    { floor: 3, col: 1, label: 'Tower',         colour: '#2F4F4F', locked: true },
  },

  /**
   * Room adjacency — same-floor (shared wall) + staircases (same column, one floor up/down).
   *   F3:  Attic (left)    | Tower (right)
   *   F2:  Bathroom (left) | Bedroom (right)
   *   F1:  Entrance (left) | Kitchen (right)
   */
  adjacency: {
    entrance: ['kitchen', 'bathroom'],      // right wall + stairs up (left col)
    kitchen:  ['entrance', 'bedroom'],      // left wall + stairs up (right col)
    bathroom: ['bedroom', 'entrance', 'attic'], // right wall + stairs down/up (left col)
    bedroom:  ['bathroom', 'kitchen', 'tower'], // left wall + stairs down/up (right col)
    attic:    ['tower', 'bathroom'],        // right wall + stairs down (left col)
    tower:    ['attic', 'bedroom'],         // left wall + stairs down (right col)
  },

  /**
   * Full track route — the dark ride always runs this path.
   * Snakes right on F1, up, left on F2, up, right on F3, then back down to exit.
   * Train passes through locked rooms without stopping.
   */
  fullTrackRoute: ['entrance', 'kitchen', 'bedroom', 'bathroom', 'attic', 'tower'],

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
  { coins: 5,  key: 'dinosaur',        icon: '🦕', label: 'Dinosaur creature!' },
  { coins: 10, key: 'bathroom',        icon: '🚿', label: 'Bathroom unlocked!' },
  { coins: 18, key: 'owl',             icon: '🦉', label: 'Owl creature!' },
  { coins: 25, key: 'snake',           icon: '🐍', label: 'Snake creature!' },
  { coins: 30, key: 'attic',           icon: '🏚️', label: 'Attic unlocked!' },
  { coins: 35, key: 'rat',             icon: '🐀', label: 'Rat creature!' },
  { coins: 40, key: 'tower',           icon: '🗼', label: 'Tower unlocked!' },
  { coins: 45, key: 'fasterCooldowns', icon: '⏱️', label: 'Faster cooldowns!' },
  { coins: 50, key: 'endlessMode',     icon: '♾️',  label: 'Endless mode!' },
  { coins: 55, key: 'monsterLab',      icon: '🧪', label: 'Monster Lab unlocked!' },
  { coins: 65, key: 'vampire',         icon: '🧛', label: 'Vampire type!' },
  { coins: 75, key: 'astronaut',       icon: '🧑‍🚀', label: 'Astronaut type!' },
  { coins: 85, key: 'ghost',           icon: '👻', label: 'Ghost type!' },
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
