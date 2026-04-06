/**
 * Visitor — lightweight stick-figure SVGs with thought bubbles.
 * Intentionally minimal so scare creatures remain the visual focus.
 */
const Visitor = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let _nextId = 0;

  /** Creature type -> emoji for thought bubbles. */
  const CREATURE_ICONS = {
    spider: '🕷️', gorilla: '🦍', bat: '🦇', cat: '🐱',
    owl: '🦉', snake: '🐍', rat: '🐀',
  };

  /** Small palette for visitor skin tones. */
  const SKIN_TONES = ['#f5d0a9', '#d4a574', '#a0785a', '#6b4c3b', '#f0c8a0', '#e8b88a'];

  /**
   * Create a visitor object with fear/love thought bubbles.
   * Fear and love are always different creature types.
   */
  function create(fear, love) {
    const id = _nextId++;
    const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const hasHat = Math.random() < 0.15;
    const hasGlasses = Math.random() < 0.12;

    const g = document.createElementNS(NS, 'g');
    g.classList.add('visitor');
    g.setAttribute('data-visitor', id);

    // Build the stick figure (~40px tall, centred at 0,0 feet level)
    let svg = '';

    // Head
    svg += `<circle cx="0" cy="-32" r="6" fill="${skin}" stroke="#333" stroke-width="0.8"/>`;

    // Optional hat
    if (hasHat) {
      svg += `<rect x="-7" y="-40" width="14" height="4" rx="1" fill="#4a3a6a"/>`;
      svg += `<rect x="-4" y="-44" width="8" height="5" rx="1" fill="#4a3a6a"/>`;
    }

    // Optional glasses
    if (hasGlasses) {
      svg += `<circle cx="-3" cy="-33" r="2.5" fill="none" stroke="#555" stroke-width="0.6"/>`;
      svg += `<circle cx="3" cy="-33" r="2.5" fill="none" stroke="#555" stroke-width="0.6"/>`;
      svg += `<line x1="-0.5" y1="-33" x2="0.5" y2="-33" stroke="#555" stroke-width="0.5"/>`;
    }

    // Eyes
    svg += `<circle cx="-2" cy="-33" r="0.8" fill="#333"/>`;
    svg += `<circle cx="2" cy="-33" r="0.8" fill="#333"/>`;

    // Body
    svg += `<rect x="-5" y="-25" width="10" height="16" rx="2" fill="${skin}" opacity="0.8"
                  stroke="#333" stroke-width="0.6"/>`;

    // Arms
    svg += `<line x1="-5" y1="-22" x2="-10" y2="-14" stroke="${skin}" stroke-width="2" stroke-linecap="round" class="visitor__arm-l"/>`;
    svg += `<line x1="5" y1="-22" x2="10" y2="-14" stroke="${skin}" stroke-width="2" stroke-linecap="round" class="visitor__arm-r"/>`;

    // Legs
    svg += `<line x1="-3" y1="-9" x2="-5" y2="0" stroke="${skin}" stroke-width="2.5" stroke-linecap="round" class="visitor__leg-l"/>`;
    svg += `<line x1="3" y1="-9" x2="5" y2="0" stroke="${skin}" stroke-width="2.5" stroke-linecap="round" class="visitor__leg-r"/>`;

    // Smile (for exiting state, hidden by default)
    svg += `<path d="M-2.5 -30 Q0 -28 2.5 -30" stroke="#333" stroke-width="0.6" fill="none"
                  class="visitor__smile" style="display:none"/>`;

    // Fear bubble (left shoulder, green circle)
    svg += `<g class="visitor__bubble visitor__bubble--fear">`;
    svg += `  <circle cx="-18" cy="-18" r="10" fill="#44cc66" opacity="0.9" stroke="#228844" stroke-width="1"/>`;
    svg += `  <text x="-18" y="-17" font-size="14" text-anchor="middle" dominant-baseline="central">${CREATURE_ICONS[fear] || '?'}</text>`;
    svg += `</g>`;

    // Love bubble (right shoulder, pink circle)
    svg += `<g class="visitor__bubble visitor__bubble--love">`;
    svg += `  <circle cx="18" cy="-18" r="10" fill="#ff88bb" opacity="0.9" stroke="#cc4477" stroke-width="1"/>`;
    svg += `  <text x="18" y="-17" font-size="14" text-anchor="middle" dominant-baseline="central">${CREATURE_ICONS[love] || '?'}</text>`;
    svg += `</g>`;

    g.innerHTML = svg;

    const visitor = {
      id,
      el: g,
      fear,
      love,
      currentRoom: null,
      scareCount: 0,
      roomsVisited: 0,
      state: 'riding',
      _scared: false, // true when currently in a scare encounter
    };

    return visitor;
  }

  /** Compute a random position within a room, clamped to bounds. */
  function _randomRoomPos(roomId) {
    const rect = House.getRoomRect(roomId);
    const centre = House.getRoomCentre(roomId);
    if (!rect || !centre) return centre || { x: 0, y: 0 };
    const margin = 18;
    const x = rect.x + margin + Math.random() * (rect.w - margin * 2);
    const y = rect.y + margin + Math.random() * (rect.h - margin * 2);
    return { x, y };
  }

  /** Place a visitor in a room (instant, no animation). */
  function placeInRoom(visitor, roomId) {
    const pos = _randomRoomPos(roomId);
    if (!pos) return;

    visitor.el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    visitor.currentRoom = roomId;

    // Ensure visitor is in the visitor layer
    const layer = House.getSvg().querySelector('.house__visitor-layer');
    if (layer && !layer.contains(visitor.el)) {
      layer.appendChild(visitor.el);
    }
  }

  /** Move visitor to a new room. Instant placement, calls onArrive after brief delay. */
  function moveToRoom(visitor, roomId, onArrive) {
    const pos = _randomRoomPos(roomId);
    if (!pos) { if (onArrive) onArrive(); return; }

    visitor.currentRoom = roomId;
    setState(visitor, 'walking');
    visitor.el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    setTimeout(() => { if (onArrive) onArrive(); }, 300);
  }

  /** Swap the visitor's CSS state class. */
  function setState(visitor, state) {
    const el = visitor.el;
    el.classList.remove('visitor--walking', 'visitor--scared', 'visitor--hugging', 'visitor--exiting', 'visitor--riding');
    el.classList.add(`visitor--${state}`);
    visitor.state = state;

    // Show/hide smile for exiting state
    const smile = el.querySelector('.visitor__smile');
    if (smile) smile.style.display = state === 'exiting' ? '' : 'none';
  }

  /**
   * Pick a random adjacent unlocked room for the visitor to wander to.
   * Avoids immediate backtrack when possible.
   */
  function pickNextRoom(visitor) {
    const adj = GameState.get('adjacency')[visitor.currentRoom];
    if (!adj) return visitor.currentRoom;

    const rooms = GameState.get('rooms');
    const unlocked = adj.filter(r => rooms[r] && !rooms[r].locked);
    if (!unlocked.length) return visitor.currentRoom;

    return unlocked[Math.floor(Math.random() * unlocked.length)];
  }

  /** Remove a visitor's SVG from the DOM. */
  function remove(visitor) {
    if (visitor.el && visitor.el.parentNode) {
      visitor.el.parentNode.removeChild(visitor.el);
    }
  }

  return { create, placeInRoom, moveToRoom, setState, pickNextRoom, remove, CREATURE_ICONS };
})();
