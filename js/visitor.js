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
    if (!rect) return null;
    const margin = 18;
    const x = rect.x + margin + Math.random() * (rect.w - margin * 2);
    const y = rect.y + margin + Math.random() * (rect.h - margin * 2);
    return { x, y };
  }

  /**
   * Compute a position at the shared edge between two rooms.
   * Used for smooth room-to-room transitions: visitor walks to the
   * exit edge of the current room, then enters from the entry edge
   * of the next room.
   */
  function _edgePosition(roomId, side) {
    const rect = House.getRoomRect(roomId);
    if (!rect) return null;
    const margin = 10;
    const randY = rect.y + margin + Math.random() * (rect.h - margin * 2);
    const randX = rect.x + margin + Math.random() * (rect.w - margin * 2);
    switch (side) {
      case 'left':   return { x: rect.x + margin, y: randY };
      case 'right':  return { x: rect.x + rect.w - margin, y: randY };
      case 'top':    return { x: randX, y: rect.y + margin };
      case 'bottom': return { x: randX, y: rect.y + rect.h - margin };
      default:       return { x: rect.cx, y: rect.cy };
    }
  }

  /**
   * Determine which side of fromRoom leads to toRoom.
   * Based on relative floor and column positions.
   */
  function _exitSide(fromRoom, toRoom) {
    const from = CONFIG.rooms[fromRoom];
    const to = CONFIG.rooms[toRoom];
    if (!from || !to) return 'right';
    if (to.floor > from.floor) return 'top';
    if (to.floor < from.floor) return 'bottom';
    if (to.col > from.col) return 'right';
    return 'left';
  }

  /** Opposite side for entry into the new room. */
  function _entrySide(side) {
    return { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }[side] || 'left';
  }

  /**
   * Smoothly walk a visitor to a position using CSS transition.
   * @param {object} visitor
   * @param {number} x, y - target position in SVG coords
   * @param {number} durationMs - transition time
   * @param {function} onArrive - called when animation completes
   */
  function _walkTo(visitor, x, y, durationMs, onArrive) {
    visitor.el.style.transition = `transform ${durationMs}ms ease-in-out`;
    visitor.el.setAttribute('transform', `translate(${x}, ${y})`);

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      visitor.el.removeEventListener('transitionend', finish);
      visitor.el.style.transition = '';
      if (onArrive) onArrive();
    }
    visitor.el.addEventListener('transitionend', finish);
    // Fallback in case transitionend doesn't fire
    setTimeout(finish, durationMs + 50);
  }

  /** Place a visitor in a room (instant, no animation). */
  function placeInRoom(visitor, roomId) {
    const pos = _randomRoomPos(roomId);
    if (!pos) return;

    visitor.el.style.transition = '';
    visitor.el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    visitor.currentRoom = roomId;

    // Ensure visitor is in the visitor layer
    const layer = House.getSvg().querySelector('.house__visitor-layer');
    if (layer && !layer.contains(visitor.el)) {
      layer.appendChild(visitor.el);
    }
  }

  /**
   * Wander within the current room: walk to N random positions, then call onDone.
   * Each step is a smooth CSS transition.
   */
  function wanderInRoom(visitor, steps, onDone) {
    if (steps <= 0) { if (onDone) onDone(); return; }

    const pos = _randomRoomPos(visitor.currentRoom);
    if (!pos) { if (onDone) onDone(); return; }

    setState(visitor, 'walking');
    _walkTo(visitor, pos.x, pos.y, 600 + Math.random() * 400, () => {
      wanderInRoom(visitor, steps - 1, onDone);
    });
  }

  /**
   * Fade a visitor's opacity over a duration.
   * @param {object} visitor
   * @param {number} targetOpacity - 0 to 1
   * @param {number} durationMs
   * @param {function} onDone
   */
  function _fadeTo(visitor, targetOpacity, durationMs, onDone) {
    visitor.el.style.transition = `opacity ${durationMs}ms ease-in-out`;
    visitor.el.style.opacity = targetOpacity;
    setTimeout(() => {
      visitor.el.style.transition = '';
      if (onDone) onDone();
    }, durationMs + 20);
  }

  /**
   * Move visitor to a new room.
   * Same-floor: continuous walk through the wall (single CSS transition).
   * Cross-floor: walk to stair edge, fade out, teleport, fade in, walk inward.
   */
  function moveToRoom(visitor, roomId, onArrive) {
    const innerPos = _randomRoomPos(roomId);
    if (!innerPos) {
      visitor.currentRoom = roomId;
      if (onArrive) onArrive();
      return;
    }

    const fromRoom = CONFIG.rooms[visitor.currentRoom];
    const toRoom = CONFIG.rooms[roomId];
    const sameFloor = fromRoom && toRoom && fromRoom.floor === toRoom.floor;

    setState(visitor, 'walking');

    if (sameFloor) {
      // Continuous walk through the shared wall - single smooth transition
      visitor.currentRoom = roomId;
      _walkTo(visitor, innerPos.x, innerPos.y, 800, () => {
        if (onArrive) onArrive();
      });
    } else {
      // Cross-floor: walk to stair edge, fade, teleport, fade in, walk inward
      const exitSide = _exitSide(visitor.currentRoom, roomId);
      const entSide = _entrySide(exitSide);
      const exitPos = _edgePosition(visitor.currentRoom, exitSide);
      const entryPos = _edgePosition(roomId, entSide);

      if (!exitPos || !entryPos) {
        visitor.currentRoom = roomId;
        _walkTo(visitor, innerPos.x, innerPos.y, 600, onArrive);
        return;
      }

      // Walk to stair edge
      _walkTo(visitor, exitPos.x, exitPos.y, 400, () => {
        // Fade out (going through stairs)
        _fadeTo(visitor, 0.3, 200, () => {
          // Teleport to entry edge of new floor
          visitor.el.style.transition = '';
          visitor.el.setAttribute('transform', `translate(${entryPos.x}, ${entryPos.y})`);
          visitor.currentRoom = roomId;
          // Fade back in
          _fadeTo(visitor, 1.0, 200, () => {
            // Walk inward from stair edge
            _walkTo(visitor, innerPos.x, innerPos.y, 400, () => {
              if (onArrive) onArrive();
            });
          });
        });
      });
    }
  }

  /**
   * Walk visitor toward a track position and fade out (boarding the train).
   * @param {object} visitor
   * @param {{x: number, y: number}} trackPos - position to walk toward
   * @param {function} onDone
   */
  function boardTrain(visitor, trackPos, onDone) {
    setState(visitor, 'exiting');
    _walkTo(visitor, trackPos.x, trackPos.y, 500, () => {
      _fadeTo(visitor, 0, 300, () => {
        if (onDone) onDone();
      });
    });
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

  return { create, placeInRoom, wanderInRoom, moveToRoom, boardTrain, setState, pickNextRoom, remove, CREATURE_ICONS };
})();
