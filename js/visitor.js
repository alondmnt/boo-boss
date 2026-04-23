/**
 * Visitor — lightweight stick-figure SVGs with thought bubbles.
 * Intentionally minimal so scare creatures remain the visual focus.
 */
const Visitor = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let _nextId = 0;

  /** Small palette for visitor skin tones. */
  const SKIN_TONES = ['#f5d0a9', '#d4a574', '#a0785a', '#6b4c3b', '#f0c8a0', '#e8b88a'];

  /** Prop colour palette — used for every prop except `flower`, which has
   *  its own brighter petals. Dark-ish Victorian tones. */
  const HAT_COLOURS = ['#4a3a6a', '#6a3a3a', '#3a4a6a', '#4a6a3a', '#6a5a2a', '#2a4a4a'];

  /** Hair styles. Assigned independently from prop so visitor variety spans
   *  gender presentations without forced pairings. */
  const HAIR_STYLES = ['short', 'long', 'bun', 'pigtails'];

  /** Hair colour palette. Picked independently of skin tone. */
  const HAIR_COLOURS = ['#1a0f08', '#3a2010', '#5a3a20', '#c8a060', '#808080', '#b85040', '#e0e0e0'];

  /** Headwear prop types. Gender mix tilts slightly feminine to offset the
   *  top hat's visual dominance: topHat (M-coded), bow + flower + bonnet
   *  (F-coded), beanie (neutral). Every visitor still has exactly one prop
   *  inside `.visitor__hat` so grabHat always has a target. */
  const PROP_TYPES = ['topHat', 'bow', 'flower', 'bonnet', 'beanie'];

  /** Brighter palette used for the flower prop's petals. */
  const FLOWER_COLOURS = ['#ff88bb', '#dd5555', '#ffcc33', '#88bbff', '#cc88cc', '#ff7777'];

  /**
   * Create a visitor object with fear/love thought bubbles.
   * Fear and love are always different creature types.
   */
  function create(fear, love) {
    const id = _nextId++;
    const skin = _pick(SKIN_TONES);
    const hair = _pick(HAIR_STYLES);
    const hairColour = _pick(HAIR_COLOURS);
    const prop = _pick(PROP_TYPES);
    const propColour = prop === 'flower' ? _pick(FLOWER_COLOURS) : _pick(HAT_COLOURS);
    const hasGlasses = Math.random() < 0.12;

    const g = document.createElementNS(NS, 'g');
    g.classList.add('visitor');
    g.setAttribute('data-visitor', id);

    // Inner wrapper receives visual animation classes (scared/hugging)
    // so they don't clobber the translate positioning on the outer <g>.
    const inner = document.createElementNS(NS, 'g');
    inner.classList.add('visitor__inner');

    // Build the stick figure (~40px tall, centred at 0,0 feet level)
    let svg = '';

    // Head
    svg += `<circle cx="0" cy="-32" r="6" fill="${skin}" stroke="#333" stroke-width="0.8"/>`;

    // Hair — drawn after the head, before the prop, so props sit on top of
    // hair where they overlap. Not inside .visitor__hat so grabHat leaves
    // hair intact.
    const hairMarkup = _hairSvg(hair, hairColour);
    if (hairMarkup) svg += `<g class="visitor__hair">${hairMarkup}</g>`;

    // Prop (headwear) — one of five shapes, inside .visitor__hat so grabHat
    // (ActionScene) can snap it off regardless of shape.
    svg += `<g class="visitor__hat">${_propSvg(prop, propColour)}</g>`;

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

    // Fear bubble (left shoulder, green circle). The #bubble-halo filter
    // (defined in the house SVG defs) gives the emoji a white outline so it
    // reads against any bubble colour regardless of the emoji's own palette.
    svg += `<g class="visitor__bubble visitor__bubble--fear">`;
    svg += `  <circle cx="-18" cy="-18" r="12" fill="#44cc66" stroke="#228844" stroke-width="1.5"/>`;
    svg += `  <text x="-18" y="-17" font-size="16" text-anchor="middle" dominant-baseline="central"
                   filter="url(#bubble-halo)">${CONFIG.creatureIcons[fear] || '?'}</text>`;
    svg += `</g>`;

    // Love bubble (right shoulder, pink circle).
    svg += `<g class="visitor__bubble visitor__bubble--love">`;
    svg += `  <circle cx="18" cy="-18" r="12" fill="#ff88bb" stroke="#cc4477" stroke-width="1.5"/>`;
    svg += `  <text x="18" y="-17" font-size="16" text-anchor="middle" dominant-baseline="central"
                   filter="url(#bubble-halo)">${CONFIG.creatureIcons[love] || '?'}</text>`;
    svg += `</g>`;

    inner.innerHTML = svg;
    g.appendChild(inner);

    const visitor = {
      id,
      el: g,
      innerEl: inner,
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

  /** Pick a random element from an array. */
  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * SVG for a hair style. Drawn between head and prop so props visually sit
   * on top where they overlap.
   */
  function _hairSvg(style, colour) {
    // Solid dome from the hairline at y=-34 (just above eyes at cy=-33) up
    // over the head top. Control y=-43 so the quadratic's actual peak lands
    // at y=-38.5 — half a pixel above the head top (y=-38) and above it at
    // every x. Covers the full scalp when the prop is grabbed away.
    const topArc = `<path d="M-6 -34 Q 0 -43 6 -34 Z" fill="${colour}"/>`;
    switch (style) {
      case 'short':
        return topArc;
      case 'long':
        return `
          <path d="M-6 -34 Q -8 -22 -6 -16 L -4 -16 Q -5 -22 -4 -34 Z" fill="${colour}"/>
          <path d="M6 -34 Q 8 -22 6 -16 L 4 -16 Q 5 -22 4 -34 Z" fill="${colour}"/>
          ${topArc}
        `;
      case 'bun':
        return `
          <circle cx="5" cy="-38" r="2.5" fill="${colour}"/>
          ${topArc}
        `;
      case 'pigtails':
        return `
          <ellipse cx="-9" cy="-27" rx="2.5" ry="4" fill="${colour}"/>
          <ellipse cx="9" cy="-27" rx="2.5" ry="4" fill="${colour}"/>
          ${topArc}
        `;
      default:
        return '';
    }
  }

  /**
   * SVG for a headwear prop. Caller wraps in `<g class="visitor__hat">` so
   * grabHat can snap the whole group away regardless of shape. All props
   * sit in y ∈ [-44, -34] so grabHat's fixed aim point (vPos.y - 40) lands
   * on them visually.
   */
  function _propSvg(type, colour) {
    switch (type) {
      case 'topHat':
        return `
          <rect x="-7" y="-40" width="14" height="4" rx="1" fill="${colour}"/>
          <rect x="-4" y="-44" width="8" height="5" rx="1" fill="${colour}"/>
        `;
      case 'bow':
        return `
          <polygon points="-6,-42 0,-38 -6,-34" fill="${colour}"/>
          <polygon points="6,-42 0,-38 6,-34" fill="${colour}"/>
          <circle cx="0" cy="-38" r="1.2" fill="${colour}"/>
        `;
      case 'flower':
        return `
          <circle cx="-3" cy="-39" r="2" fill="${colour}"/>
          <circle cx="3" cy="-39" r="2" fill="${colour}"/>
          <circle cx="0" cy="-41.5" r="2" fill="${colour}"/>
          <circle cx="0" cy="-36.5" r="2" fill="${colour}"/>
          <circle cx="0" cy="-39" r="1.2" fill="#ffcc33"/>
        `;
      case 'bonnet':
        return `
          <path d="M-9 -35 Q -10 -42 0 -42 Q 10 -42 9 -35 L 9 -34 L -9 -34 Z" fill="${colour}"/>
          <line x1="-6" y1="-33" x2="-3" y2="-27" stroke="${colour}" stroke-width="0.8" opacity="0.7"/>
          <line x1="6" y1="-33" x2="3" y2="-27" stroke="${colour}" stroke-width="0.8" opacity="0.7"/>
        `;
      case 'beanie':
        return `
          <path d="M-6 -34 Q -7 -42 0 -43 Q 7 -42 6 -34 Z" fill="${colour}"/>
          <circle cx="0" cy="-44" r="1.8" fill="${colour}" opacity="0.8"/>
        `;
      default:
        return '';
    }
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

    // Clean up any in-flight animation from a previous _walkTo call
    _cleanupTransition(visitor);

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      visitor.el.removeEventListener('transitionend', finish);
      visitor._transitionCleanup = null;
      visitor.el.style.transition = '';
      if (onArrive) onArrive();
    }
    visitor.el.addEventListener('transitionend', finish);
    // Fallback in case transitionend doesn't fire
    const fallback = setTimeout(finish, durationMs + 50);

    // Store cleanup ref so remove() can cancel in-flight animations
    visitor._transitionCleanup = () => {
      done = true;
      visitor.el.removeEventListener('transitionend', finish);
      clearTimeout(fallback);
    };
  }

  /** Cancel any in-flight transition on a visitor. */
  function _cleanupTransition(visitor) {
    if (visitor._transitionCleanup) {
      visitor._transitionCleanup();
      visitor._transitionCleanup = null;
    }
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
   * Each step is a smooth CSS transition. If onStep is provided, it runs
   * after each step completes; returning truthy stops the wander (caller
   * took ownership of what happens next).
   */
  function wanderInRoom(visitor, steps, onDone, onStep) {
    if (steps <= 0) { if (onDone) onDone(); return; }

    const pos = _randomRoomPos(visitor.currentRoom);
    if (!pos) { if (onDone) onDone(); return; }

    setState(visitor, 'walking');
    _walkTo(visitor, pos.x, pos.y, 600 + Math.random() * 400, () => {
      if (onStep && onStep()) return;
      wanderInRoom(visitor, steps - 1, onDone, onStep);
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
      _walkTo(visitor, innerPos.x, innerPos.y, 1200, () => {
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

  /** Swap the visitor's CSS state class on the inner wrapper. */
  function setState(visitor, state) {
    // Animation classes go on innerEl to avoid clobbering position transforms
    const target = visitor.innerEl || visitor.el;
    target.classList.remove('visitor--walking', 'visitor--scared', 'visitor--hugging', 'visitor--exiting', 'visitor--riding');
    target.classList.add(`visitor--${state}`);
    visitor.state = state;

    // Show/hide smile for exiting state
    const smile = target.querySelector('.visitor__smile');
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

  /**
   * Pop the visitor's hat off with a quick upward fade.
   * Used by ActionScene.grabHat — idempotent (no-op if hat already gone).
   */
  function removeHat(visitor) {
    const hat = visitor.innerEl && visitor.innerEl.querySelector('.visitor__hat');
    if (!hat) return;
    hat.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    hat.style.transform = 'translateY(-20px)';
    hat.style.opacity = '0';
    setTimeout(() => {
      if (hat.parentNode) hat.parentNode.removeChild(hat);
    }, 300);
  }

  /** Remove a visitor's SVG from the DOM and cancel in-flight animations. */
  function remove(visitor) {
    _cleanupTransition(visitor);
    if (visitor.el && visitor.el.parentNode) {
      visitor.el.parentNode.removeChild(visitor.el);
    }
  }

  return { create, placeInRoom, wanderInRoom, moveToRoom, boardTrain, setState, pickNextRoom, remove, removeHat };
})();
