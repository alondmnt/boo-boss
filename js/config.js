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
  /** Monster type passive effects (active only when Monster Lab is unlocked). */
  monsterEffects: {
    zombie:    { type: 'scareBonus',    value: 0.2,  label: '+20% 😱' },
    witch:     { type: 'lifetimeBonus', value: 0.25, label: '+25% ⌛' },
    skeleton:  { type: 'lifetimeBonus', value: -0.25, label: '-25% ⌛' },
    vampire:   { type: 'hugResist',     value: 0.5,  label: '50% 🛡️' },
    astronaut: { type: 'comboPlus',     value: 1,    label: 'combo +1' },
    ghost:     { type: 'hugBlock',      value: 0.8,  label: '80% 🛡️' },
  },

  /* ─── Actions (player-selectable once Director's Chair is unlocked) ─── */
  actions: ['jumpOut', 'grabHat', 'dropFromCeiling'],
  actionIcons: {
    jumpOut: '💥', grabHat: '🎩', dropFromCeiling: '🪂', swarm: '👥', peekABoo: '🫣', chase: '🏃',
  },
  defaultAction: {
    spider: 'dropFromCeiling', gorilla: 'jumpOut', bat: 'dropFromCeiling',
    cat: 'jumpOut', dinosaur: 'jumpOut', owl: 'dropFromCeiling', snake: 'jumpOut', rat: 'jumpOut',
  },
  /** Action behavioural effects (active only when Director's Chair is unlocked).
   *  jumpOut is baseline (no effect) — omitted intentionally so lookup returns undefined. */
  actionEffects: {
    grabHat:         { type: 'extendStay',  value: 1, label: '+1 🎩' },
    dropFromCeiling: { type: 'splashScare', value: 1, label: 'splash 💥' },
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

  /* ─── Difficulty ─── */
  difficulty: {
    biasStartWave: 5,   // wave at which like/dislike correlation begins
    biasBaseP: 0.3,     // initial probability of biased love assignment
    biasPerWave: 0.1,   // probability increase per wave beyond biasStartWave
    biasMaxP: 0.9,      // ceiling so it's never fully deterministic
  },

  /* ─── Waves ─── */
  waveSizing: { base: 3, perWave: 0.5 },
  visitorDwellMs: { min: 3000, max: 4500 },
  visitorRoomVisits: { min: 4, max: 6 },
  trainSpeedMs: 3000,
  trainStopMs: 600,

  /* ─── Scoring ─── */
  scoring: {
    scareBase: 10,
    vampireResistPoints: 5,  // half of scareBase: resist is half-defense, half-offense
    combo2x: 1.5,
    combo3x: 2.0,
    waveBonusThreshold: 0.8,
    waveBonus: 50,
    noHugBonus: 30,
    varietyFullCastPct: 0.20,  // full-cast bonus per axis, as fraction of wave scare score
    creatureFullCastMin: 5,
  },

  /* ─── Coins ─── */
  coinsPerWave: 1,
  coinsBonusWave: 1,

  /* ─── Creature lifetime ─── */
  creatureLifetimeMs: 15000,

  /* ─── Rollercoaster (expansion 3) ─── */
  rollercoaster: {
    malfunctionChance: 0.2,
    malfunctionRepairCost: 3,
    minOpenRooms: 2,
    pieceShowinessWeights: {
      straight: 1, hill: 2, tunnel: 2, loop: 4, corkscrew: 5,
    },
    pieceSellbackPct: 0.5,
  },
};

/**
 * PIECES — track segment pieces. Each piece's pathGenerator returns the SVG
 * path-segment string (continuation, no leading 'M') between two room centres.
 * Segments are classified by slotType: sameFloorHorizontal, floorChange, returnExterior.
 * The `straight` piece reproduces the game's default curve exactly.
 */
const PIECES = {
  straight: {
    key: 'straight',
    label: 'straight',
    icon: '—',
    costCoins: 2,
    slotTypes: ['sameFloorHorizontal', 'floorChange'],
    pathGenerator: (prev, curr, slotType) => {
      const L = CONFIG.house;
      const divX = L.wallT + L.roomW + L.wallT / 2;
      if (slotType === 'floorChange') {
        return ` Q${divX},${prev.y} ${divX},${(prev.y + curr.y) / 2}`
             + ` Q${divX},${curr.y} ${curr.x},${curr.y}`;
      }
      const midX = (prev.x + curr.x) / 2;
      return ` Q${midX},${prev.y + 8} ${curr.x},${curr.y}`;
    },
  },
  hill: {
    key: 'hill',
    label: 'hill',
    icon: '⛰️',
    costCoins: 5,
    slotTypes: ['sameFloorHorizontal', 'floorChange'],
    pathGenerator: (prev, curr, slotType) => {
      const L = CONFIG.house;
      const divX = L.wallT + L.roomW + L.wallT / 2;
      if (slotType === 'floorChange') {
        // Climb over a peak above the upper room, then descend. Cubic Béziers
        // so the peak has a smooth tangent instead of a pointy Q-corner.
        const peakY = Math.min(prev.y, curr.y) - 22;
        return ` C${(prev.x + divX) / 2},${prev.y - 16} ${divX},${peakY + 8} ${divX},${peakY}`
             + ` C${divX},${peakY + 8} ${(divX + curr.x) / 2},${curr.y - 10} ${curr.x},${curr.y}`;
      }
      // Same floor: rise above baseline into a hump, then descend back.
      const midX = (prev.x + curr.x) / 2;
      const peakY = Math.min(prev.y, curr.y) - 26;
      return ` C${prev.x + 30},${prev.y - 12} ${midX - 24},${peakY} ${midX},${peakY}`
           + ` C${midX + 24},${peakY} ${curr.x - 30},${curr.y - 12} ${curr.x},${curr.y}`;
    },
  },
  tunnel: {
    key: 'tunnel',
    label: 'tunnel',
    icon: '🕳️',
    costCoins: 5,
    slotTypes: ['sameFloorHorizontal', 'floorChange'],
    // Path matches the straight curve — the cart traverses normally. The
    // visible effect comes from an aux dark rect rendered above the cart.
    pathGenerator: (prev, curr, slotType) =>
      PIECES.straight.pathGenerator(prev, curr, slotType),
    auxSvg: (prev, curr, slotType) => {
      if (slotType === 'floorChange') {
        const L = CONFIG.house;
        const divX = L.wallT + L.roomW + L.wallT / 2;
        const minY = Math.min(prev.y, curr.y) + 10;
        const maxY = Math.max(prev.y, curr.y) - 10;
        // Pill-shaped vertical tunnel along the divider, tall rounded corners
        // read as a tunnel mouth at each end.
        return `<rect class="piece--tunnel" x="${divX - 15}" y="${minY}"
                      width="30" height="${Math.max(24, maxY - minY)}"
                      rx="15" ry="15"
                      fill="#05020c" stroke="#3a2040" stroke-width="1.5"/>`;
      }
      // Same-floor: horizontal pill covering the middle ~70% of the segment.
      const x1 = Math.min(prev.x, curr.x) + 22;
      const x2 = Math.max(prev.x, curr.x) - 22;
      const midY = (prev.y + curr.y) / 2;
      return `<rect class="piece--tunnel" x="${x1}" y="${midY - 14}"
                    width="${x2 - x1}" height="32"
                    rx="16" ry="16"
                    fill="#05020c" stroke="#3a2040" stroke-width="1.5"/>`;
    },
  },
  loop: {
    key: 'loop',
    label: 'loop',
    icon: '🔁',
    costCoins: 12,
    // Horizontal only — loops on floor transitions would collide with room walls.
    slotTypes: ['sameFloorHorizontal'],
    pathGenerator: (prev, curr, slotType) => {
      // For a left-to-right cart, a natural loop runs CCW visually: up the
      // right side, over the top moving left, down the left side. We enter on
      // the RIGHT of the loop's bottom (midX+1), so the entry tangent points
      // up-right matching the cart's +x velocity, and exit on the LEFT
      // (midX-1) where the tangent points right-down into the exit curve.
      // sweep-flag=0 selects the CCW direction along the upper-circle long arc.
      const r = 16;
      const midX = (prev.x + curr.x) / 2;
      const baseY = (prev.y + curr.y) / 2;
      return ` Q${(prev.x + midX) / 2},${prev.y + 4} ${midX + 1},${baseY}`
           + ` A${r},${r} 0 1 0 ${midX - 1},${baseY}`
           + ` Q${(midX + curr.x) / 2},${curr.y + 4} ${curr.x},${curr.y}`;
    },
  },
  corkscrew: {
    key: 'corkscrew',
    label: 'corkscrew',
    icon: '🌀',
    costCoins: 15,
    // Horizontal only — same rationale as loop.
    slotTypes: ['sameFloorHorizontal'],
    pathGenerator: (prev, curr, slotType) => {
      // Three S-curve bulges alternating up/down, reusing the shape of the
      // existing exterior return corkscrew (see _computeTrack:77-101).
      const turns = 3;
      const amp = 12;
      const midY = (prev.y + curr.y) / 2;
      const totalX = curr.x - prev.x;
      const step = totalX / (turns * 2);
      let d = '';
      let x = prev.x;
      for (let i = 0; i < turns; i++) {
        d += ` C${x + step * 0.6},${midY - amp} ${x + step * 0.6},${midY - amp} ${x + step},${midY}`;
        x += step;
        d += ` C${x + step * 0.6},${midY + amp} ${x + step * 0.6},${midY + amp} ${x + step},${midY}`;
        x += step;
      }
      d += ` L${curr.x},${curr.y}`;
      return d;
    },
  },
};

/**
 * TRAIN_SKINS — cosmetic cart appearances. Each skin's cartSvg returns the
 * inner SVG markup for a ~30×20 cart group. The `default` skin preserves the
 * game's current cart so existing saves render unchanged.
 */
const TRAIN_SKINS = {
  default: {
    key: 'default',
    label: 'classic',
    icon: '🛤️',
    costCoins: 0,
    cartSvg: () => `
      <rect x="-14" y="-12" width="28" height="16" rx="3" fill="#2a1a3a" stroke="#5a3a6a" stroke-width="1.2"/>
      <rect x="-10" y="-16" width="20" height="6" rx="2" fill="#3a2a4a" stroke="#5a3a6a" stroke-width="0.8"/>
      <circle cx="-8" cy="6" r="3.5" fill="#444" stroke="#666" stroke-width="1"/>
      <circle cx="8" cy="6" r="3.5" fill="#444" stroke="#666" stroke-width="1"/>
      <circle cx="15" cy="-6" r="2" fill="#ffd700" opacity="0.8"/>
    `,
  },
  wooden: {
    key: 'wooden',
    label: 'mine cart',
    icon: '🛒',
    costCoins: 20,
    cartSvg: () => `
      <rect x="-14" y="-10" width="28" height="14" rx="1" fill="#6b3a18" stroke="#3a1a08" stroke-width="1.2"/>
      <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#3a1a08" stroke-width="0.6"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#3a1a08" stroke-width="0.6"/>
      <rect x="-14" y="-11" width="28" height="2" fill="#8a5a28"/>
      <circle cx="-8" cy="6" r="4" fill="#555" stroke="#999" stroke-width="1.2"/>
      <circle cx="8" cy="6" r="4" fill="#555" stroke="#999" stroke-width="1.2"/>
      <line x1="-8" y1="3" x2="-8" y2="9" stroke="#aaa" stroke-width="0.6"/>
      <line x1="-11" y1="6" x2="-5" y2="6" stroke="#aaa" stroke-width="0.6"/>
      <line x1="8" y1="3" x2="8" y2="9" stroke="#aaa" stroke-width="0.6"/>
      <line x1="5" y1="6" x2="11" y2="6" stroke="#aaa" stroke-width="0.6"/>
    `,
  },
  coffin: {
    key: 'coffin',
    label: 'coffin cart',
    icon: '⚰️',
    costCoins: 20,
    cartSvg: () => `
      <path d="M-14,-8 L-10,-14 L10,-14 L14,-8 L14,4 L-14,4 Z"
            fill="#2a140a" stroke="#0a0402" stroke-width="1.2"/>
      <path d="M-10,-13 L10,-13" stroke="#6a3a1a" stroke-width="0.5"/>
      <rect x="-1.5" y="-10" width="3" height="9" fill="#c8a878"/>
      <rect x="-4" y="-8" width="8" height="2.5" fill="#c8a878"/>
      <circle cx="-8" cy="6" r="3.5" fill="#1a0a04" stroke="#4a2a1a" stroke-width="1"/>
      <circle cx="8" cy="6" r="3.5" fill="#1a0a04" stroke="#4a2a1a" stroke-width="1"/>
    `,
  },
  pumpkin: {
    key: 'pumpkin',
    label: 'pumpkin',
    icon: '🎃',
    costCoins: 20,
    cartSvg: () => `
      <ellipse cx="0" cy="-3" rx="14" ry="10" fill="#e07a1a" stroke="#a0520a" stroke-width="1.2"/>
      <path d="M-9,-12 Q-10,-3 -9,5" stroke="#a0520a" stroke-width="0.7" fill="none"/>
      <path d="M-3,-14 Q-3,-3 -3,6" stroke="#a0520a" stroke-width="0.7" fill="none"/>
      <path d="M3,-14 Q3,-3 3,6" stroke="#a0520a" stroke-width="0.7" fill="none"/>
      <path d="M9,-12 Q10,-3 9,5" stroke="#a0520a" stroke-width="0.7" fill="none"/>
      <rect x="-2" y="-15" width="4" height="3" fill="#3a7a2a"/>
      <path d="M2,-15 Q5,-17 4,-13" fill="none" stroke="#3a7a2a" stroke-width="1"/>
      <path d="M-5,-6 L-3,-3 L-1,-6 Z" fill="#2a0a0a"/>
      <path d="M1,-6 L3,-3 L5,-6 Z" fill="#2a0a0a"/>
      <path d="M-4,0 Q0,3 4,0" fill="none" stroke="#2a0a0a" stroke-width="1.2"/>
      <circle cx="-8" cy="6" r="3.5" fill="#333" stroke="#666" stroke-width="1"/>
      <circle cx="8" cy="6" r="3.5" fill="#333" stroke="#666" stroke-width="1"/>
    `,
  },
};

const UNLOCK_TIERS = [
  { coins: 5,  key: 'dinosaur',        icon: '🦕', label: 'Dinosaur creature!' },
  { coins: 10, key: 'bathroom',        icon: '🚿', label: 'Bathroom unlocked!' },
  { coins: 18, key: 'owl',             icon: '🦉', label: 'Owl creature!' },
  { coins: 25, key: 'fasterCooldowns', icon: '⏱️', label: 'Faster cooldowns!' },
  { coins: 30, key: 'attic',           icon: '🏚️', label: 'Attic unlocked!' },
  { coins: 35, key: 'snake',           icon: '🐍', label: 'Snake creature!' },
  { coins: 38, key: 'rat',             icon: '🐀', label: 'Rat creature!' },
  { coins: 40, key: 'tower',           icon: '🗼', label: 'Tower unlocked!' },
  { coins: 50, key: 'monsterLab',      icon: '🧪', label: 'Monster Lab unlocked!' },
  { coins: 65, key: 'vampire',         icon: '🧛', label: 'Vampire type!' },
  { coins: 75, key: 'astronaut',       icon: '🧑‍🚀', label: 'Astronaut type!' },
  { coins: 85, key: 'ghost',           icon: '👻', label: 'Ghost type!' },
  { coins: 95, key: 'directorsChair',  icon: '🎬', label: "Director's Chair unlocked!" },
  { coins: 105, key: 'swarm',          icon: '👥', label: 'Swarm action!' },
  { coins: 115, key: 'peekABoo',       icon: '🫣', label: 'Peek-a-boo action!' },
  { coins: 130, key: 'chase',          icon: '🏃', label: 'Chase action!' },
  { coins: 140, key: 'trackEditor',     icon: '🎢', label: 'Ride designer unlocked!' },
  { coins: 160, key: 'trackPiecesBasic',icon: '⛰️', label: 'Hill & tunnel pieces!' },
  { coins: 180, key: 'trackPiecesShowy',icon: '🌀', label: 'Loop & corkscrew!' },
  { coins: 200, key: 'trainSkins',      icon: '🚂', label: 'Train skins!' },
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
_deepFreeze(PIECES);
_deepFreeze(TRAIN_SKINS);
