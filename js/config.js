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
    jumpOut: '💥', grabHat: '🎩', dropFromCeiling: '🪂', swarm: '👥', peekABoo: '🫣', chase: '🏃', block: '🛑',
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
    // block: no entry needed — its duration IS the creature's lifetime, which
    // is already modulated by witch/skeleton via lifetimeBonus. One timer.
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
      // The tunnel hugs the underlying track curve (it doesn't change
      // geometry — only visibility), rendered as a thick semi-transparent
      // stroke that bends with the path. stroke-dasharray creates periodic
      // gaps (slits) so the cart is briefly visible as it passes through.
      const innerPath = `M${prev.x},${prev.y}` + PIECES.straight.pathGenerator(prev, curr, slotType);
      return `<path class="piece--tunnel" d="${innerPath}"
                    fill="none"
                    stroke="#1a0a26" stroke-width="20"
                    stroke-linecap="round"
                    stroke-dasharray="22 7"
                    opacity="0.78"/>`;
    },
  },
  loop: {
    key: 'loop',
    label: 'loop',
    icon: '🔁',
    costCoins: 12,
    // Horizontal only — loops on floor transitions would collide with room walls.
    slotTypes: ['sameFloorHorizontal'],
    // Loops are the one piece where inverting is in character — opt out of the
    // wheels-down hybrid and let the cart rotate fully along the path tangent.
    cartOrientation: 'tangent',
    pathGenerator: (prev, curr, slotType) => {
      // The loop must run in the direction that matches the cart's incoming
      // velocity, otherwise the entry tangent reverses ~180° on impact.
      // fullTrackRoute snakes through the house, so segments alternate
      // direction: floors 1 and 3 run left-to-right, floor 2 runs right-to-left.
      //
      // Rightward cart (+x): natural direction is CCW visually — enter on the
      //   RIGHT of the loop's bottom, exit on the LEFT. (sweep-flag=0)
      // Leftward cart (-x): mirror — enter on the LEFT, exit on the RIGHT,
      //   loop runs CW. (sweep-flag=1)
      // In both cases we use the upper-circle long arc so the loop sits above
      // the baseline.
      const r = 16;
      const midX = (prev.x + curr.x) / 2;
      const baseY = (prev.y + curr.y) / 2;
      const goingRight = curr.x > prev.x;
      const entryX = goingRight ? midX + 1 : midX - 1;
      const exitX  = goingRight ? midX - 1 : midX + 1;
      const sweep  = goingRight ? 0 : 1;
      return ` Q${(prev.x + midX) / 2},${prev.y + 4} ${entryX},${baseY}`
           + ` A${r},${r} 0 1 ${sweep} ${exitX},${baseY}`
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
  // ── Spooky ─────────────────────────────────────────────
  mine: {
    key: 'mine',
    label: 'mine cart',
    icon: '⛏️',
    costCoins: 20,
    cartSvg: () => `
      <!-- Iron-banded wood box, weathered -->
      <rect x="-14" y="-10" width="28" height="14" rx="1" fill="#5a2e14" stroke="#1a0a04" stroke-width="1.2"/>
      <!-- Plank seams -->
      <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#2a1408" stroke-width="0.6"/>
      <line x1="-14" y1="0" x2="14" y2="0" stroke="#2a1408" stroke-width="0.6"/>
      <!-- Splintered top edge (one broken plank) -->
      <path d="M-14,-10 L-9,-10 L-7,-12 L-3,-10 L0,-11 L4,-10 L14,-10"
            fill="none" stroke="#8a5a28" stroke-width="1.5" stroke-linejoin="miter"/>
      <!-- Iron bands -->
      <rect x="-14" y="-9" width="28" height="1.5" fill="#3a3a3a"/>
      <rect x="-14" y="2" width="28" height="1.5" fill="#3a3a3a"/>
      <!-- Rust patches -->
      <circle cx="-7" cy="-3" r="1.4" fill="#7a3010" opacity="0.5"/>
      <circle cx="6" cy="-1" r="1.1" fill="#7a3010" opacity="0.5"/>
      <!-- Gaslight lantern hanging in front -->
      <line x1="13" y1="-10" x2="15" y2="-7" stroke="#2a2a2a" stroke-width="0.6"/>
      <rect x="13.5" y="-7" width="3" height="4" fill="#1a0a04" stroke="#3a2a14" stroke-width="0.5"/>
      <rect x="14" y="-6.5" width="2" height="3" fill="#fff8b0" opacity="0.85"/>
      <!-- Wheels: heavy iron -->
      <circle cx="-8" cy="6" r="4" fill="#2a2a2a" stroke="#888" stroke-width="1.2"/>
      <circle cx="8" cy="6" r="4" fill="#2a2a2a" stroke="#888" stroke-width="1.2"/>
      <line x1="-8" y1="3" x2="-8" y2="9" stroke="#aaa" stroke-width="0.6"/>
      <line x1="-11" y1="6" x2="-5" y2="6" stroke="#aaa" stroke-width="0.6"/>
      <line x1="8" y1="3" x2="8" y2="9" stroke="#aaa" stroke-width="0.6"/>
      <line x1="5" y1="6" x2="11" y2="6" stroke="#aaa" stroke-width="0.6"/>
    `,
  },
  coffin: {
    key: 'coffin',
    label: 'coffin',
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

  // ── Funny ──────────────────────────────────────────────
  shopping: {
    key: 'shopping',
    label: 'shopping cart',
    icon: '🛒',
    costCoins: 20,
    cartSvg: () => `
      <!-- Wire basket: trapezoid, wider at top -->
      <path d="M-12,-12 L13,-12 L11,0 L-9,0 Z"
            fill="rgba(220,225,235,0.15)" stroke="#aab0bc" stroke-width="1"/>
      <!-- Vertical wires -->
      <line x1="-7" y1="-12" x2="-6" y2="0" stroke="#aab0bc" stroke-width="0.6"/>
      <line x1="-2" y1="-12" x2="-2" y2="0" stroke="#aab0bc" stroke-width="0.6"/>
      <line x1="3" y1="-12" x2="2" y2="0" stroke="#aab0bc" stroke-width="0.6"/>
      <line x1="8" y1="-12" x2="6" y2="0" stroke="#aab0bc" stroke-width="0.6"/>
      <!-- Horizontal wires -->
      <line x1="-11" y1="-8" x2="12" y2="-8" stroke="#aab0bc" stroke-width="0.6"/>
      <line x1="-10" y1="-4" x2="11" y2="-4" stroke="#aab0bc" stroke-width="0.6"/>
      <!-- Push handle: arc behind -->
      <path d="M-12,-12 L-15,-15 L-13,-16" fill="none" stroke="#666" stroke-width="1.4"/>
      <!-- Wheels: 4 small castors -->
      <circle cx="-9" cy="3" r="2.2" fill="#444" stroke="#888" stroke-width="0.6"/>
      <circle cx="-3" cy="3" r="2.2" fill="#444" stroke="#888" stroke-width="0.6"/>
      <circle cx="3" cy="3" r="2.2" fill="#444" stroke="#888" stroke-width="0.6"/>
      <circle cx="9" cy="3" r="2.2" fill="#444" stroke="#888" stroke-width="0.6"/>
    `,
  },
  sneaker: {
    key: 'sneaker',
    label: 'sneaker',
    icon: '👟',
    costCoins: 20,
    cartSvg: () => `
      <!-- Wheels (sole covers their upper half) -->
      <circle cx="-9" cy="7" r="2.6" fill="#1a1a1a" stroke="#666" stroke-width="0.6"/>
      <circle cx="9" cy="7" r="2.6" fill="#1a1a1a" stroke="#666" stroke-width="0.6"/>
      <!-- White rubber sole — thin, low-profile -->
      <path d="M-13,3 Q-14,5 -12,6.5 L11,6.5 Q14,5 13,3 Z"
            fill="#f5f5f5" stroke="#888" stroke-width="0.5"/>
      <!-- Midsole pinstripe -->
      <rect x="-13" y="2" width="26" height="1.2" fill="#fafafa" stroke="#aaa" stroke-width="0.4"/>
      <!-- Tread marks -->
      <line x1="-7" y1="5.5" x2="-7" y2="6.3" stroke="#888" stroke-width="0.4"/>
      <line x1="-2" y1="5.5" x2="-2" y2="6.3" stroke="#888" stroke-width="0.4"/>
      <line x1="3" y1="5.5" x2="3" y2="6.3" stroke="#888" stroke-width="0.4"/>
      <line x1="8" y1="5.5" x2="8" y2="6.3" stroke="#888" stroke-width="0.4"/>
      <!-- Wedge upper: highest at the back collar, top edge slopes smoothly
           down to a low blunt toe. No flat lace shelf — the laces and tongue
           sit on the slanted surface, like the Campus side profile. -->
      <path d="M-13,2
               L-13,-3
               Q-14,-5 -12,-7
               Q-10,-8 -8,-8
               L-6,-8
               Q1,-7.5 10,-5
               Q13,-3 13,2
               Z"
            fill="#c8252a" stroke="#7a1010" stroke-width="0.9"/>
      <!-- Tongue: low-profile, top sits just above the collar peak so the
           sneaker reads as Campus-style rather than tongue-on-a-stalk. -->
      <path d="M-1,-7.5
               L-1,-8.8
               Q-1,-9.2 -0.3,-9.2
               L5.3,-9.2
               Q6,-9.2 6,-8.8
               L6,-6
               Z"
            fill="#fafafa" stroke="#888" stroke-width="0.4"/>
      <!-- Laces: 3 slim stripes spanning the tongue, slanted with the slope -->
      <line x1="-0.4" y1="-8.8" x2="5.3" y2="-8.4" stroke="#fafafa" stroke-width="0.4"/>
      <line x1="-0.4" y1="-8.1" x2="5.3" y2="-7.7" stroke="#fafafa" stroke-width="0.4"/>
      <line x1="-0.4" y1="-7.4" x2="5.3" y2="-7" stroke="#fafafa" stroke-width="0.4"/>
      <!-- Eyelets along the tongue edges -->
      <circle cx="-1" cy="-8.5" r="0.3" fill="#1a1a1a"/>
      <circle cx="-1" cy="-7.5" r="0.3" fill="#1a1a1a"/>
      <circle cx="6" cy="-8" r="0.3" fill="#1a1a1a"/>
      <circle cx="6" cy="-7" r="0.3" fill="#1a1a1a"/>
      <!-- Three diagonal Adidas-style stripes — slanted to follow the wedge -->
      <line x1="6" y1="2" x2="4" y2="-4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
      <line x1="4" y1="2" x2="2" y2="-4.5" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
      <line x1="2" y1="2" x2="0" y2="-5" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
    `,
  },
  tram: {
    key: 'tram',
    label: 'Melbourne tram',
    icon: '🚋',
    costCoins: 20,
    cartSvg: () => `
      <!-- Pantograph (scissor diamond + contact bar) -->
      <path d="M0,-13 L-3,-16 L0,-18 L3,-16 Z" fill="none" stroke="#3a3a3a" stroke-width="0.8"/>
      <line x1="-3.5" y1="-18.5" x2="3.5" y2="-18.5" stroke="#3a3a3a" stroke-width="0.7"/>
      <!-- Rounded cream roof — the W-class's iconic curved top -->
      <path d="M-15,-10 Q-15,-14 -10,-14 L10,-14 Q15,-14 15,-10 Z"
            fill="#f5d878" stroke="#5a4218" stroke-width="0.7"/>
      <!-- Route-number plate on the roof front -->
      <rect x="8.5" y="-13.5" width="5" height="3" fill="#1a1a1a" stroke="#f5d878" stroke-width="0.3"/>
      <!-- Cream window band -->
      <rect x="-15" y="-10" width="30" height="5.5" fill="#f5e8b8" stroke="#5a4218" stroke-width="0.6"/>
      <!-- Window pillars (green dividers) -->
      <line x1="-9" y1="-10" x2="-9" y2="-4.5" stroke="#1f6b3c" stroke-width="0.7"/>
      <line x1="-3" y1="-10" x2="-3" y2="-4.5" stroke="#1f6b3c" stroke-width="0.7"/>
      <line x1="3" y1="-10" x2="3" y2="-4.5" stroke="#1f6b3c" stroke-width="0.7"/>
      <line x1="9" y1="-10" x2="9" y2="-4.5" stroke="#1f6b3c" stroke-width="0.7"/>
      <!-- Green lower body -->
      <rect x="-15" y="-4.5" width="30" height="7" fill="#1f6b3c" stroke="#0d2e1a" stroke-width="0.7"/>
      <!-- Door panels at each end (cream insets on the green) -->
      <rect x="-13.5" y="-4.5" width="3.5" height="7" fill="#f5e8b8" opacity="0.55" stroke="#5a4218" stroke-width="0.4"/>
      <rect x="10" y="-4.5" width="3.5" height="7" fill="#f5e8b8" opacity="0.55" stroke="#5a4218" stroke-width="0.4"/>
      <!-- Headlight (front, low on the green nose) -->
      <circle cx="14" cy="0.5" r="1.1" fill="#fff8a0" opacity="0.95"/>
      <!-- Marker lights (small red side lights) -->
      <circle cx="-14" cy="-2" r="0.5" fill="#a01010" opacity="0.85"/>
      <!-- Wheels (rendered before skirt so the skirt hides their tops) -->
      <circle cx="-9" cy="5" r="2.7" fill="#1a1a1a" stroke="#777" stroke-width="0.7"/>
      <circle cx="9" cy="5" r="2.7" fill="#1a1a1a" stroke="#777" stroke-width="0.7"/>
      <!-- Black coupler / skirt covering the wheel tops -->
      <rect x="-15" y="2.5" width="30" height="2" fill="#0a0a0a"/>
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
  { coins: 135, key: 'roomBlock',      icon: '🛑', label: 'Room block action!' },
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
