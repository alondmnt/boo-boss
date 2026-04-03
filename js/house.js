/**
 * House — generates the 2×3 Victorian house cutaway as inline SVG.
 * Provides room coordinate lookups for Train, Visitor, and creature placement.
 */
const House = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let _svg = null;
  const _roomEls = {};
  const _roomCoords = {};

  /* ─── Layout constants derived from CONFIG.house ─── */

  function _layout() {
    const h = CONFIG.house;
    const svgW = 2 * h.roomW + 3 * h.wallT;
    const svgH = 3 * h.roomH + 4 * h.wallT + h.roofH + h.trainY;
    return { ...h, svgW, svgH };
  }

  /**
   * Compute room rectangle in SVG coords.
   * Grid is bottom-up: floor 1 at the bottom, floor 3 at the top.
   */
  function _roomRect(roomId, roomDef, L) {
    const col = roomDef.col;
    const floorFromTop = 3 - roomDef.floor; // 0=top, 1=mid, 2=bottom
    const x = L.wallT + col * (L.roomW + L.wallT);
    const y = L.roofH + L.wallT + floorFromTop * (L.roomH + L.wallT);
    return { x, y, w: L.roomW, h: L.roomH, cx: x + L.roomW / 2, cy: y + L.roomH / 2 };
  }

  /* ─── Room decoration factories (minimal Victorian furniture silhouettes) ─── */

  function _entranceDecor(x, y, w, h) {
    const cx = x + w / 2, cy = y + h / 2;
    return `
      <!-- chandelier -->
      <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + 18}" stroke="#c8a84e" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${y + 22}" r="8" fill="none" stroke="#c8a84e" stroke-width="1.2"/>
      <circle cx="${cx - 3}" cy="${y + 22}" r="1.5" fill="#ffd700" opacity="0.7"/>
      <circle cx="${cx + 3}" cy="${y + 22}" r="1.5" fill="#ffd700" opacity="0.7"/>
      <!-- cobweb top-left -->
      <path d="M${x} ${y} Q${x + 15} ${y + 5} ${x + 25} ${y}" stroke="#888" stroke-width="0.5" fill="none" opacity="0.5"/>
      <path d="M${x} ${y} Q${x + 5} ${y + 15} ${x} ${y + 25}" stroke="#888" stroke-width="0.5" fill="none" opacity="0.5"/>
      <path d="M${x} ${y} Q${x + 10} ${y + 10} ${x + 18} ${y + 18}" stroke="#888" stroke-width="0.4" fill="none" opacity="0.4"/>
      <!-- door frame -->
      <rect x="${x + w - 28}" y="${y + h - 50}" width="22" height="50" rx="2"
            fill="none" stroke="#5a3a1a" stroke-width="1.5"/>
      <!-- floor tiles -->
      <line x1="${x}" y1="${y + h - 2}" x2="${x + w}" y2="${y + h - 2}" stroke="#5a3a1a" stroke-width="0.8" opacity="0.5"/>
    `;
  }

  function _kitchenDecor(x, y, w, h) {
    return `
      <!-- stove -->
      <rect x="${x + 10}" y="${y + h - 40}" width="30" height="40" rx="2" fill="#333" opacity="0.6"/>
      <circle cx="${x + 18}" cy="${y + h - 32}" r="4" fill="none" stroke="#555" stroke-width="1"/>
      <circle cx="${x + 32}" cy="${y + h - 32}" r="4" fill="none" stroke="#555" stroke-width="1"/>
      <!-- hanging pots -->
      <line x1="${x + w - 40}" y1="${y}" x2="${x + w - 40}" y2="${y + 15}" stroke="#8a6a3a" stroke-width="1"/>
      <ellipse cx="${x + w - 40}" cy="${y + 20}" rx="8" ry="5" fill="none" stroke="#8a6a3a" stroke-width="1.2"/>
      <line x1="${x + w - 20}" y1="${y}" x2="${x + w - 20}" y2="${y + 12}" stroke="#8a6a3a" stroke-width="1"/>
      <ellipse cx="${x + w - 20}" cy="${y + 16}" rx="6" ry="4" fill="none" stroke="#8a6a3a" stroke-width="1.2"/>
      <!-- dripping tap -->
      <path d="M${x + w - 55} ${y + h - 35} Q${x + w - 50} ${y + h - 40} ${x + w - 45} ${y + h - 35}"
            stroke="#6a8a9a" stroke-width="1.5" fill="none"/>
      <circle cx="${x + w - 50}" cy="${y + h - 30}" r="1.2" fill="#4a7a9a" opacity="0.6" class="house__drip"/>
    `;
  }

  function _bedroomDecor(x, y, w, h) {
    return `
      <!-- four-poster bed -->
      <rect x="${x + 15}" y="${y + h - 35}" width="50" height="25" rx="2" fill="#3a1a4a" opacity="0.5"/>
      <line x1="${x + 15}" y1="${y + h - 35}" x2="${x + 15}" y2="${y + h - 55}" stroke="#3a1a4a" stroke-width="2"/>
      <line x1="${x + 65}" y1="${y + h - 35}" x2="${x + 65}" y2="${y + h - 55}" stroke="#3a1a4a" stroke-width="2"/>
      <line x1="${x + 15}" y1="${y + h - 55}" x2="${x + 65}" y2="${y + h - 55}" stroke="#3a1a4a" stroke-width="1" opacity="0.4"/>
      <!-- wardrobe -->
      <rect x="${x + w - 30}" y="${y + h - 55}" width="22" height="55" rx="2"
            fill="#2a1a3a" opacity="0.5" stroke="#4a2a5a" stroke-width="0.8"/>
      <!-- mirror -->
      <ellipse cx="${x + w / 2 + 20}" cy="${y + 25}" rx="10" ry="14"
               fill="none" stroke="#6a5a8a" stroke-width="1.2"/>
    `;
  }

  function _atticDecor(x, y, w, h) {
    return `
      <!-- exposed beams -->
      <line x1="${x}" y1="${y + 20}" x2="${x + w}" y2="${y + 20}" stroke="#5a3a1a" stroke-width="2.5" opacity="0.5"/>
      <line x1="${x + w / 3}" y1="${y}" x2="${x + w / 3}" y2="${y + 20}" stroke="#5a3a1a" stroke-width="2" opacity="0.4"/>
      <line x1="${x + 2 * w / 3}" y1="${y}" x2="${x + 2 * w / 3}" y2="${y + 20}" stroke="#5a3a1a" stroke-width="2" opacity="0.4"/>
      <!-- trunk -->
      <rect x="${x + 20}" y="${y + h - 25}" width="30" height="20" rx="3"
            fill="#4a3a2a" opacity="0.5" stroke="#6a5a3a" stroke-width="0.8"/>
      <!-- dormer window with moonlight -->
      <path d="M${x + w - 35} ${y + 8} L${x + w - 25} ${y - 2} L${x + w - 15} ${y + 8} Z"
            fill="none" stroke="#6a6a8a" stroke-width="1"/>
      <rect x="${x + w - 33}" y="${y + 8}" width="16" height="16" fill="#1a1a3a" opacity="0.4"
            stroke="#6a6a8a" stroke-width="0.8"/>
      <circle cx="${x + w - 25}" cy="${y + 14}" r="3" fill="#e0e8ff" opacity="0.3"/>
    `;
  }

  function _towerDecor(x, y, w, h) {
    return `
      <!-- stone wall texture -->
      <line x1="${x + 10}" y1="${y + 25}" x2="${x + 50}" y2="${y + 25}" stroke="#3a3a3a" stroke-width="0.6" opacity="0.4"/>
      <line x1="${x + 30}" y1="${y + 50}" x2="${x + 70}" y2="${y + 50}" stroke="#3a3a3a" stroke-width="0.6" opacity="0.4"/>
      <line x1="${x + 5}" y1="${y + 75}" x2="${x + 45}" y2="${y + 75}" stroke="#3a3a3a" stroke-width="0.6" opacity="0.4"/>
      <!-- narrow window -->
      <rect x="${x + w / 2 - 5}" y="${y + 15}" width="10" height="30" rx="5"
            fill="#1a1a3a" stroke="#4a4a5a" stroke-width="1"/>
      <!-- lightning flash -->
      <path d="M${x + w / 2} ${y + 18} l3 8 l-5 2 l4 10" stroke="#ffd700" stroke-width="1"
            fill="none" opacity="0.3" class="house__lightning"/>
    `;
  }

  function _observatoryDecor(x, y, w, h) {
    return `
      <!-- dome ceiling arc -->
      <path d="M${x} ${y + 10} Q${x + w / 2} ${y - 15} ${x + w} ${y + 10}"
            fill="none" stroke="#2a2a4a" stroke-width="2" opacity="0.5"/>
      <!-- crack in dome -->
      <path d="M${x + w / 2 + 10} ${y + 2} l5 8 l-3 6" stroke="#3a3a5a" stroke-width="0.8" opacity="0.4"/>
      <!-- telescope -->
      <line x1="${x + 30}" y1="${y + h - 15}" x2="${x + 50}" y2="${y + 30}" stroke="#5a5a7a" stroke-width="2.5"/>
      <circle cx="${x + 52}" cy="${y + 28}" r="4" fill="none" stroke="#5a5a7a" stroke-width="1.5"/>
      <!-- star dots -->
      <circle cx="${x + w - 20}" cy="${y + 15}" r="1" fill="#e0e8ff" opacity="0.5"/>
      <circle cx="${x + w - 35}" cy="${y + 8}" r="0.8" fill="#e0e8ff" opacity="0.4"/>
      <circle cx="${x + w - 50}" cy="${y + 12}" r="1.2" fill="#e0e8ff" opacity="0.3"/>
    `;
  }

  const DECOR = {
    entrance: _entranceDecor,
    kitchen: _kitchenDecor,
    bedroom: _bedroomDecor,
    attic: _atticDecor,
    tower: _towerDecor,
    observatory: _observatoryDecor,
  };

  /* ─── SVG generation ─── */

  /** Build the full house SVG and inject it into the container element. */
  function init(container) {
    const L = _layout();
    const rooms = GameState.get('rooms');

    let svg = `<svg xmlns="${NS}" viewBox="0 0 ${L.svgW} ${L.svgH}"
                    class="house" preserveAspectRatio="xMidYMid meet">`;

    // Background
    svg += `<rect width="${L.svgW}" height="${L.svgH}" fill="#0d0520"/>`;

    // Roof (peaked gothic)
    const roofY = 0;
    const roofMidX = L.svgW / 2;
    svg += `<path d="M${L.wallT - 2} ${L.roofH} L${roofMidX} ${roofY}
                     L${L.svgW - L.wallT + 2} ${L.roofH}"
                  fill="#1a0a2e" stroke="#2a1a0a" stroke-width="2.5"/>`;
    // Chimney
    const chimX = L.svgW - L.wallT - 40;
    svg += `<rect x="${chimX}" y="${roofY + 5}" width="14" height="${L.roofH - 5}"
                  fill="#2a1a0a" stroke="#1a0a1a" stroke-width="1"/>`;

    // Outer walls
    svg += `<rect x="${L.wallT / 2}" y="${L.roofH}" width="${L.svgW - L.wallT}"
                  height="${3 * L.roomH + 4 * L.wallT - L.wallT}"
                  fill="none" stroke="#2a1a0a" stroke-width="${L.wallT}"/>`;

    // Rooms
    for (const [id, def] of Object.entries(rooms)) {
      const r = _roomRect(id, def, L);
      _roomCoords[id] = r;

      const isLocked = def.locked;
      const roomFill = isLocked ? '#111' : def.colour;
      const cls = `house__room${isLocked ? ' house__room--locked' : ''}`;

      svg += `<g class="${cls}" data-room="${id}">`;
      // Room background
      svg += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"
                    fill="${roomFill}" opacity="0.3" class="house__room-bg"/>`;

      // Decoration (only if unlocked)
      if (!isLocked && DECOR[id]) {
        svg += DECOR[id](r.x, r.y, r.w, r.h);
      }

      // Locked planks
      if (isLocked) {
        svg += `<g class="house__planks">`;
        for (let i = 0; i < 3; i++) {
          const py = r.y + 15 + i * 35;
          svg += `<line x1="${r.x + 5}" y1="${py}" x2="${r.x + r.w - 5}" y2="${py + 8}"
                        stroke="#5a3a1a" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
        }
        svg += `</g>`;
      }

      // Room label
      svg += `<text x="${r.x + 6}" y="${r.y + r.h - 5}" font-size="8"
                    fill="${isLocked ? '#333' : '#ddd'}" opacity="0.6"
                    font-family="sans-serif">${def.label}</text>`;

      svg += `</g>`;
    }

    // Internal walls — vertical divider between columns
    for (let floor = 0; floor < 3; floor++) {
      const fy = L.roofH + L.wallT + floor * (L.roomH + L.wallT);
      const divX = L.wallT + L.roomW + L.wallT / 2;
      svg += `<line x1="${divX}" y1="${fy}" x2="${divX}" y2="${fy + L.roomH}"
                    stroke="#2a1a0a" stroke-width="${L.wallT}" opacity="0.8"/>`;
    }

    // Floor dividers — horizontal lines between floors
    for (let i = 1; i < 3; i++) {
      const fy = L.roofH + L.wallT + i * (L.roomH + L.wallT) - L.wallT / 2;
      svg += `<line x1="${L.wallT / 2}" y1="${fy}" x2="${L.svgW - L.wallT / 2}" y2="${fy}"
                    stroke="#2a1a0a" stroke-width="${L.wallT}" opacity="0.8"/>`;
    }

    // Staircase indicators (left column, between floors)
    for (let floor = 1; floor < 3; floor++) {
      const floorFromTop = 3 - floor;
      const prevFloorFromTop = floorFromTop - 1;
      const bottomY = L.roofH + L.wallT + floorFromTop * (L.roomH + L.wallT);
      const stairX = L.wallT + 10;
      // Small stair steps
      for (let s = 0; s < 4; s++) {
        const sy = bottomY - 3 - s * 3;
        const sx = stairX + s * 4;
        svg += `<rect x="${sx}" y="${sy}" width="5" height="2" fill="#2a1a0a" opacity="0.4"/>`;
      }
    }

    // Track layer placeholder (Train module will populate this)
    svg += `<g class="house__track-layer"></g>`;

    // Creature layer (creatures deployed here)
    svg += `<g class="house__creature-layer"></g>`;

    // Visitor layer (visitors walk here)
    svg += `<g class="house__visitor-layer"></g>`;

    svg += `</svg>`;

    container.innerHTML = svg;
    _svg = container.querySelector('svg');

    // Cache room element references
    for (const id of Object.keys(rooms)) {
      _roomEls[id] = _svg.querySelector(`[data-room="${id}"]`);
    }
  }

  /** Return the SVG element for a room. */
  function getRoomEl(roomId) { return _roomEls[roomId]; }

  /** Return the centre point {x, y} of a room in SVG coordinates. */
  function getRoomCentre(roomId) {
    const r = _roomCoords[roomId];
    return r ? { x: r.cx, y: r.cy } : null;
  }

  /** Return the full room rect {x, y, w, h, cx, cy}. */
  function getRoomRect(roomId) { return _roomCoords[roomId]; }

  /** Return the root SVG element. */
  function getSvg() { return _svg; }

  /** Animate a locked room becoming unlocked. */
  function unlockRoom(roomId) {
    const el = _roomEls[roomId];
    if (!el) return;
    el.classList.remove('house__room--locked');
    el.classList.add('house__room--unlocking');

    // Update background fill to room colour
    const bg = el.querySelector('.house__room-bg');
    const rooms = GameState.get('rooms');
    if (bg && rooms[roomId]) {
      bg.setAttribute('fill', rooms[roomId].colour);
    }

    // Add decoration
    const r = _roomCoords[roomId];
    if (DECOR[roomId] && r) {
      const decorGroup = document.createElementNS(NS, 'g');
      decorGroup.innerHTML = DECOR[roomId](r.x, r.y, r.w, r.h);
      el.insertBefore(decorGroup, el.querySelector('.house__planks'));
    }

    // Update label colour
    const label = el.querySelector('text');
    if (label) label.setAttribute('fill', '#ddd');

    setTimeout(() => el.classList.remove('house__room--unlocking'), 600);
  }

  return { init, getRoomEl, getRoomCentre, getRoomRect, getSvg, unlockRoom };
})();
