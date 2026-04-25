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
    // Grand Victorian foyer - dark wood panelling, checkerboard floor, chandelier
    const cx = x + w / 2, cy = y + h / 2;
    const floorY = y + h - 20; // floor zone starts here
    let s = '';

    // --- floor: cracked black-and-white checkerboard tiles ---
    const tileSize = 10;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < Math.ceil(w / tileSize); col++) {
        const tx = x + col * tileSize;
        const ty = floorY + row * tileSize;
        const isDark = (row + col) % 2 === 0;
        s += `<rect x="${tx}" y="${ty}" width="${tileSize}" height="${tileSize}"
              fill="${isDark ? '#1a1a1a' : '#9a9080'}" opacity="${isDark ? 0.5 : 0.35}"/>`;
      }
    }
    // Tile crack lines
    s += `<line x1="${x + 22}" y1="${floorY + 2}" x2="${x + 28}" y2="${floorY + 18}" stroke="#111" stroke-width="0.4" opacity="0.70"/>`;
    s += `<line x1="${x + 80}" y1="${floorY}" x2="${x + 85}" y2="${floorY + 12}" stroke="#111" stroke-width="0.3" opacity="0.56"/>`;

    // --- walls: dark wood panelling (vertical strips) ---
    for (let i = 0; i < 10; i++) {
      const px = x + 3 + i * (w / 10);
      s += `<line x1="${px}" y1="${y + 5}" x2="${px}" y2="${floorY}" stroke="#3a2510" stroke-width="0.6" opacity="0.51"/>`;
    }
    // Dado rail (horizontal moulding)
    s += `<line x1="${x + 2}" y1="${y + h * 0.55}" x2="${x + w - 2}" y2="${y + h * 0.55}" stroke="#5a3a1a" stroke-width="0.8" opacity="0.56"/>`;
    // Peeling wallpaper strips above dado
    s += `<path d="M${x + 30} ${y + 10} Q${x + 32} ${y + 25} ${x + 28} ${y + 40}" stroke="#6a5030" stroke-width="1.5" fill="none" opacity="0.34"/>`;
    s += `<path d="M${x + 110} ${y + 8} Q${x + 113} ${y + 20} ${x + 108} ${y + 35}" stroke="#6a5030" stroke-width="1.2" fill="none" opacity="0.31"/>`;

    // --- furniture: grandfather clock (left wall) ---
    s += `<rect x="${x + 5}" y="${y + 25}" width="14" height="60" rx="1" fill="#2a1808" opacity="0.70" stroke="#4a3018" stroke-width="0.6"/>`;
    s += `<circle cx="${x + 12}" cy="${y + 40}" r="5" fill="none" stroke="#c8a84e" stroke-width="0.5" opacity="0.70"/>`;
    s += `<line x1="${x + 12}" y1="${y + 40}" x2="${x + 12}" y2="${y + 36}" stroke="#c8a84e" stroke-width="0.4" opacity="0.70"/>`;
    s += `<line x1="${x + 12}" y1="${y + 40}" x2="${x + 15}" y2="${y + 41}" stroke="#c8a84e" stroke-width="0.3" opacity="0.56"/>`;
    // Pendulum
    s += `<line x1="${x + 12}" y1="${y + 50}" x2="${x + 11}" y2="${y + 70}" stroke="#c8a84e" stroke-width="0.3" opacity="0.49"/>`;
    s += `<circle cx="${x + 11}" cy="${y + 72}" r="2.5" fill="#c8a84e" opacity="0.34"/>`;

    // --- furniture: door frame (right side, double doors, one ajar) ---
    s += `<rect x="${x + w - 38}" y="${y + 18}" width="34" height="${floorY - y - 18}" rx="1" fill="none" stroke="#3a2010" stroke-width="1.5" opacity="0.72"/>`;
    // Arch top
    s += `<path d="M${x + w - 38} ${y + 18} Q${x + w - 21} ${y + 6} ${x + w - 4} ${y + 18}" fill="none" stroke="#3a2010" stroke-width="1.2" opacity="0.70"/>`;
    // Left door (closed)
    s += `<rect x="${x + w - 37}" y="${y + 19}" width="15" height="${floorY - y - 20}" fill="#1a0c04" opacity="0.49"/>`;
    // Right door (slightly ajar - angled)
    s += `<path d="M${x + w - 21} ${y + 19} L${x + w - 12} ${y + 22} L${x + w - 12} ${floorY - 1} L${x + w - 21} ${floorY - 1} Z"
          fill="#1a0c04" opacity="0.51"/>`;
    // Gap of ajar door (darkness)
    s += `<rect x="${x + w - 12}" y="${y + 22}" width="5" height="${floorY - y - 24}" fill="#050005" opacity="0.70"/>`;
    // Door handles
    s += `<circle cx="${x + w - 24}" cy="${cy}" r="1.2" fill="#8a7a50" opacity="0.70"/>`;

    // --- furniture: coat hooks and dusty coat ---
    s += `<line x1="${x + 90}" y1="${y + 22}" x2="${x + 90}" y2="${y + 24}" stroke="#5a4a30" stroke-width="0.8" opacity="0.56"/>`;
    s += `<line x1="${x + 98}" y1="${y + 22}" x2="${x + 98}" y2="${y + 24}" stroke="#5a4a30" stroke-width="0.8" opacity="0.56"/>`;
    s += `<line x1="${x + 106}" y1="${y + 22}" x2="${x + 106}" y2="${y + 24}" stroke="#5a4a30" stroke-width="0.8" opacity="0.56"/>`;
    // Dusty coat hanging from middle hook
    s += `<path d="M${x + 98} ${y + 24} Q${x + 95} ${y + 40} ${x + 92} ${y + 58} Q${x + 94} ${y + 62} ${x + 102} ${y + 58} Q${x + 100} ${y + 40} ${x + 98} ${y + 24}"
          fill="#2a2018" opacity="0.51" stroke="#3a3020" stroke-width="0.4"/>`;

    // --- furniture: umbrella stand (near door) ---
    s += `<path d="M${x + w - 48} ${floorY - 22} L${x + w - 52} ${floorY} L${x + w - 40} ${floorY} L${x + w - 44} ${floorY - 22} Z"
          fill="#2a1a0a" opacity="0.56" stroke="#4a3a20" stroke-width="0.5"/>`;
    // Umbrella handle poking out
    s += `<path d="M${x + w - 46} ${floorY - 22} Q${x + w - 47} ${floorY - 30} ${x + w - 43} ${floorY - 32}"
          stroke="#3a3a4a" stroke-width="0.8" fill="none" opacity="0.56"/>`;

    // --- chandelier: heavy, dripping with wax and cobwebs ---
    s += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + 14}" stroke="#5a4a20" stroke-width="1.0" opacity="0.70"/>`;
    // Chain links
    s += `<ellipse cx="${cx}" cy="${y + 5}" rx="1.5" ry="2" fill="none" stroke="#6a5a30" stroke-width="0.5" opacity="0.56"/>`;
    s += `<ellipse cx="${cx}" cy="${y + 10}" rx="1.5" ry="2" fill="none" stroke="#6a5a30" stroke-width="0.5" opacity="0.56"/>`;
    // Main ring
    s += `<ellipse cx="${cx}" cy="${y + 18}" rx="14" ry="4" fill="none" stroke="#6a5a20" stroke-width="1.0" opacity="0.63"/>`;
    // Candle stubs on chandelier
    for (let i = -2; i <= 2; i++) {
      const candleX = cx + i * 6;
      s += `<rect x="${candleX - 1}" y="${y + 13}" width="2" height="5" fill="#d8c890" opacity="0.56"/>`;
      s += `<circle cx="${candleX}" cy="${y + 12}" r="1.2" fill="#ffd700" opacity="0.49" class="house__flicker"/>`;
      // Wax drips
      if (i % 2 === 0) {
        s += `<ellipse cx="${candleX + 0.5}" cy="${y + 19}" rx="0.5" ry="1.5" fill="#d8c890" opacity="0.42"/>`;
      }
    }
    // Cobwebs from chandelier to ceiling/walls
    s += `<path d="M${cx - 14} ${y + 17} Q${cx - 25} ${y + 10} ${x + 2} ${y + 2}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.42"/>`;
    s += `<path d="M${cx + 14} ${y + 17} Q${cx + 20} ${y + 8} ${x + w - 2} ${y + 2}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.34"/>`;
    s += `<path d="M${cx - 10} ${y + 16} Q${cx - 8} ${y + 22} ${cx - 14} ${y + 25}" stroke="#777" stroke-width="0.25" fill="none" opacity="0.34"/>`;

    // --- atmosphere: shadow pools in corners ---
    s += `<ellipse cx="${x + 8}" cy="${floorY + 5}" rx="12" ry="4" fill="#000" opacity="0.34"/>`;
    s += `<ellipse cx="${x + w - 8}" cy="${floorY + 5}" rx="10" ry="3" fill="#000" opacity="0.31"/>`;

    // --- atmosphere: ceiling crack lines ---
    s += `<line x1="${x + 40}" y1="${y + 2}" x2="${x + 55}" y2="${y + 4}" stroke="#222" stroke-width="0.3" opacity="0.56"/>`;
    s += `<line x1="${x + 55}" y1="${y + 4}" x2="${x + 60}" y2="${y + 2}" stroke="#222" stroke-width="0.25" opacity="0.49"/>`;
    s += `<line x1="${x + 90}" y1="${y + 1}" x2="${x + 95}" y2="${y + 5}" stroke="#222" stroke-width="0.3" opacity="0.51"/>`;

    // --- atmosphere: warm radial highlight from chandelier ---
    s += `<circle cx="${cx}" cy="${y + 20}" r="30" fill="#ffd700" opacity="0.08"/>`;
    s += `<circle cx="${cx}" cy="${y + 20}" r="18" fill="#ffd700" opacity="0.12"/>`;

    // --- atmosphere: dust motes ---
    s += `<circle cx="${x + 50}" cy="${y + 45}" r="0.6" fill="#ccc" opacity="0.34" class="house__dust"/>`;
    s += `<circle cx="${x + 120}" cy="${y + 35}" r="0.5" fill="#ccc" opacity="0.26" class="house__dust"/>`;
    s += `<circle cx="${x + 75}" cy="${y + 60}" r="0.4" fill="#ccc" opacity="0.31" class="house__dust"/>`;

    return s;
  }

  function _kitchenDecor(x, y, w, h) {
    // Cast-iron Victorian kitchen - stove, copper pots, flagstone floor
    const floorY = y + h - 18;
    let s = '';

    // --- floor: stone flagstones (irregular rectangles) ---
    const flagW = [22, 18, 25, 20, 16, 24, 19];
    let fx = x;
    for (let row = 0; row < 2; row++) {
      fx = x + (row * 8);
      for (let i = 0; i < flagW.length && fx < x + w; i++) {
        const fw = flagW[i];
        s += `<rect x="${fx}" y="${floorY + row * 9}" width="${fw}" height="9"
              fill="#4a4a42" opacity="0.42" stroke="#333" stroke-width="0.3"/>`;
        fx += fw + 1;
      }
    }

    // --- walls: grease stains behind stove area ---
    s += `<ellipse cx="${x + 30}" cy="${y + 30}" rx="18" ry="12" fill="#3a3520" opacity="0.26"/>`;
    s += `<ellipse cx="${x + 25}" cy="${y + 45}" rx="10" ry="8" fill="#3a3520" opacity="0.20"/>`;

    // --- furniture: large cast-iron stove/range ---
    s += `<rect x="${x + 5}" y="${y + h - 55}" width="48" height="37" rx="2" fill="#222" opacity="0.66" stroke="#444" stroke-width="0.8"/>`;
    // Stove top with burner rings
    s += `<rect x="${x + 5}" y="${y + h - 55}" width="48" height="5" fill="#333" opacity="0.70"/>`;
    s += `<circle cx="${x + 17}" cy="${y + h - 52}" r="5" fill="none" stroke="#555" stroke-width="0.6" opacity="0.70"/>`;
    s += `<circle cx="${x + 17}" cy="${y + h - 52}" r="2.5" fill="none" stroke="#555" stroke-width="0.4" opacity="0.56"/>`;
    s += `<circle cx="${x + 37}" cy="${y + h - 52}" r="5" fill="none" stroke="#555" stroke-width="0.6" opacity="0.70"/>`;
    s += `<circle cx="${x + 37}" cy="${y + h - 52}" r="2.5" fill="none" stroke="#555" stroke-width="0.4" opacity="0.56"/>`;
    // Stove door
    s += `<rect x="${x + 14}" y="${y + h - 45}" width="22" height="16" rx="1" fill="#1a1a1a" opacity="0.56" stroke="#555" stroke-width="0.5"/>`;
    s += `<circle cx="${x + 38}" cy="${y + h - 37}" r="1.2" fill="#8a6a30" opacity="0.56"/>`;
    // Faint ember glow inside
    s += `<rect x="${x + 16}" y="${y + h - 43}" width="18" height="12" rx="1" fill="#8a2a00" opacity="0.16"/>`;
    // Stovepipe going up to ceiling
    s += `<rect x="${x + 24}" y="${y}" width="6" height="${h - 55}" fill="#2a2a2a" opacity="0.63"/>`;
    s += `<rect x="${x + 23}" y="${y + h - 58}" width="8" height="4" fill="#333" opacity="0.56"/>`;

    // --- furniture: hanging pot rack with copper pots ---
    const rackX = x + 80, rackY = y + 8;
    s += `<line x1="${rackX}" y1="${y}" x2="${rackX}" y2="${rackY}" stroke="#5a4a30" stroke-width="0.8" opacity="0.56"/>`;
    s += `<line x1="${rackX + 40}" y1="${y}" x2="${rackX + 40}" y2="${rackY}" stroke="#5a4a30" stroke-width="0.8" opacity="0.56"/>`;
    s += `<line x1="${rackX}" y1="${rackY}" x2="${rackX + 40}" y2="${rackY}" stroke="#5a4a30" stroke-width="1.0" opacity="0.63"/>`;
    // Individual pots hanging at different heights
    const pots = [{dx: 5, dy: 8, rx: 7, ry: 4}, {dx: 18, dy: 5, rx: 5, ry: 3}, {dx: 30, dy: 10, rx: 8, ry: 5}, {dx: 40, dy: 6, rx: 4, ry: 2.5}];
    for (const p of pots) {
      s += `<line x1="${rackX + p.dx}" y1="${rackY}" x2="${rackX + p.dx}" y2="${rackY + p.dy}" stroke="#7a5a2a" stroke-width="0.5" opacity="0.56"/>`;
      s += `<ellipse cx="${rackX + p.dx}" cy="${rackY + p.dy + p.ry}" rx="${p.rx}" ry="${p.ry}"
            fill="none" stroke="#9a6a30" stroke-width="0.8" opacity="0.56"/>`;
      // Handle arc
      s += `<path d="M${rackX + p.dx - p.rx * 0.6} ${rackY + p.dy} Q${rackX + p.dx} ${rackY + p.dy - 3} ${rackX + p.dx + p.rx * 0.6} ${rackY + p.dy}"
            fill="none" stroke="#9a6a30" stroke-width="0.5" opacity="0.49"/>`;
    }

    // --- furniture: deep Belfast sink with dripping tap ---
    const sinkX = x + w - 50;
    s += `<rect x="${sinkX}" y="${y + h - 45}" width="30" height="18" rx="1" fill="#505858" opacity="0.51" stroke="#6a7a7a" stroke-width="0.8"/>`;
    // Sink basin (dark interior)
    s += `<rect x="${sinkX + 3}" y="${y + h - 43}" width="24" height="13" fill="#1a2a2a" opacity="0.51"/>`;
    // Tap
    s += `<path d="M${sinkX + 20} ${y + h - 50} L${sinkX + 20} ${y + h - 55} Q${sinkX + 18} ${y + h - 58} ${sinkX + 14} ${y + h - 55}"
          stroke="#6a7a7a" stroke-width="1.2" fill="none" opacity="0.70"/>`;
    // Dripping water
    s += `<circle cx="${sinkX + 15}" cy="${y + h - 48}" r="0.8" fill="#5a8a9a" opacity="0.70" class="house__drip"/>`;
    s += `<circle cx="${sinkX + 15}" cy="${y + h - 44}" r="0.6" fill="#5a8a9a" opacity="0.51" class="house__drip"/>`;

    // --- furniture: wooden table with wonky leg ---
    const tableX = x + 58, tableY = y + h - 38;
    s += `<rect x="${tableX}" y="${tableY}" width="35" height="2.5" fill="#4a3a20" opacity="0.56"/>`;
    // Legs (one slightly askew)
    s += `<line x1="${tableX + 3}" y1="${tableY + 2}" x2="${tableX + 3}" y2="${floorY}" stroke="#4a3a20" stroke-width="1" opacity="0.49"/>`;
    s += `<line x1="${tableX + 32}" y1="${tableY + 2}" x2="${tableX + 34}" y2="${floorY}" stroke="#4a3a20" stroke-width="1" opacity="0.49"/>`;

    // --- furniture: shelves with jars ---
    const shelfX = x + w - 40, shelfY = y + 30;
    for (let i = 0; i < 3; i++) {
      const sy = shelfY + i * 18;
      s += `<line x1="${shelfX}" y1="${sy}" x2="${shelfX + 35}" y2="${sy}" stroke="#5a4a30" stroke-width="1" opacity="0.49"/>`;
    }
    // Jars on shelves (some intact, one broken)
    s += `<rect x="${shelfX + 3}" y="${shelfY - 9}" width="5" height="9" rx="1" fill="#4a6a5a" opacity="0.42" stroke="#5a7a6a" stroke-width="0.3"/>`;
    s += `<rect x="${shelfX + 12}" y="${shelfY - 11}" width="6" height="11" rx="1" fill="#6a5a4a" opacity="0.34" stroke="#7a6a5a" stroke-width="0.3"/>`;
    s += `<rect x="${shelfX + 22}" y="${shelfY - 7}" width="5" height="7" rx="1" fill="#5a5a6a" opacity="0.34" stroke="#6a6a7a" stroke-width="0.3"/>`;
    // Broken jar on second shelf
    s += `<path d="M${shelfX + 5} ${shelfY + 9} L${shelfX + 5} ${shelfY + 15} L${shelfX + 10} ${shelfY + 15} L${shelfX + 10} ${shelfY + 12}"
          fill="none" stroke="#6a5a4a" stroke-width="0.4" opacity="0.51"/>`;
    // Jar on third shelf
    s += `<rect x="${shelfX + 15}" y="${shelfY + 36 - 10}" width="7" height="10" rx="1" fill="#5a6a5a" opacity="0.34" stroke="#6a7a6a" stroke-width="0.3"/>`;

    // --- mouse hole in baseboard ---
    s += `<path d="M${x + 65} ${floorY} Q${x + 68} ${floorY - 7} ${x + 71} ${floorY}" fill="#0a0a0a" opacity="0.70"/>`;

    // --- atmosphere: gas lamp on wall ---
    const lampX = x + 60, lampY = y + 15;
    s += `<rect x="${lampX - 2}" y="${lampY}" width="4" height="8" fill="#5a4a30" opacity="0.49"/>`;
    s += `<ellipse cx="${lampX}" cy="${lampY - 2}" rx="4" ry="5" fill="#ffa500" opacity="0.12"/>`;
    s += `<circle cx="${lampX}" cy="${lampY + 2}" r="1.5" fill="#ffaa30" opacity="0.51" class="house__flicker"/>`;

    // --- atmosphere: shadow pools ---
    s += `<ellipse cx="${x + 8}" cy="${floorY + 4}" rx="10" ry="3" fill="#000" opacity="0.31"/>`;
    s += `<ellipse cx="${x + w - 8}" cy="${floorY + 4}" rx="8" ry="3" fill="#000" opacity="0.26"/>`;

    // --- atmosphere: dust motes ---
    s += `<circle cx="${x + 70}" cy="${y + 50}" r="0.5" fill="#aaa" opacity="0.26" class="house__dust"/>`;
    s += `<circle cx="${x + 100}" cy="${y + 30}" r="0.4" fill="#aaa" opacity="0.24" class="house__dust"/>`;

    return s;
  }

  function _bedroomDecor(x, y, w, h) {
    // Gothic Victorian bedroom - four-poster bed, wardrobe, moonlit window
    const floorY = y + h - 14;
    let s = '';

    // --- floor: moth-eaten rug ---
    s += `<ellipse cx="${x + w / 2 - 10}" cy="${floorY + 2}" rx="40" ry="6" fill="#3a1a2a" opacity="0.34"/>`;
    s += `<ellipse cx="${x + w / 2 - 10}" cy="${floorY + 2}" rx="35" ry="4.5" fill="#4a2a3a" opacity="0.26"/>`;
    // Rug moth holes
    s += `<circle cx="${x + w / 2 - 20}" cy="${floorY + 1}" r="1.5" fill="#4B0082" opacity="0.34"/>`;
    s += `<circle cx="${x + w / 2 + 5}" cy="${floorY + 3}" r="1" fill="#4B0082" opacity="0.31"/>`;
    // Bare floorboards
    for (let i = 0; i < 8; i++) {
      s += `<line x1="${x + 2}" y1="${floorY + i * 2}" x2="${x + w - 2}" y2="${floorY + i * 2}"
            stroke="#2a1a3a" stroke-width="0.3" opacity="0.42"/>`;
    }

    // --- walls: peeling wallpaper with faint damask pattern hints ---
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const px = x + 5 + col * 19;
        const py = y + 8 + row * 22;
        s += `<path d="M${px} ${py} Q${px + 5} ${py - 4} ${px + 10} ${py} Q${px + 5} ${py + 4} ${px} ${py}"
              fill="none" stroke="#6a4a7a" stroke-width="0.3" opacity="0.20"/>`;
      }
    }
    // Peeling strips
    s += `<path d="M${x + 45} ${y + 3} Q${x + 47} ${y + 15} ${x + 43} ${y + 30} Q${x + 44} ${y + 35} ${x + 46} ${y + 38}"
          stroke="#5a3a6a" stroke-width="1.2" fill="none" opacity="0.26"/>`;
    s += `<path d="M${x + 120} ${y + 5} Q${x + 122} ${y + 12} ${x + 119} ${y + 22}"
          stroke="#5a3a6a" stroke-width="1.0" fill="none" opacity="0.24"/>`;

    // --- furniture: four-poster bed with torn canopy ---
    const bedX = x + 10, bedY = y + h - 50;
    // Bed frame - four posts
    s += `<line x1="${bedX}" y1="${bedY - 30}" x2="${bedX}" y2="${floorY}" stroke="#2a1020" stroke-width="2.5" opacity="0.70"/>`;
    s += `<line x1="${bedX + 55}" y1="${bedY - 30}" x2="${bedX + 55}" y2="${floorY}" stroke="#2a1020" stroke-width="2.5" opacity="0.70"/>`;
    // Post finials
    s += `<circle cx="${bedX}" cy="${bedY - 32}" r="2" fill="#2a1020" opacity="0.56"/>`;
    s += `<circle cx="${bedX + 55}" cy="${bedY - 32}" r="2" fill="#2a1020" opacity="0.56"/>`;
    // Canopy rail
    s += `<line x1="${bedX}" y1="${bedY - 28}" x2="${bedX + 55}" y2="${bedY - 28}" stroke="#2a1020" stroke-width="1" opacity="0.49"/>`;
    // Torn canopy drapes (hanging fabric curves)
    s += `<path d="M${bedX} ${bedY - 28} Q${bedX + 5} ${bedY - 15} ${bedX + 3} ${bedY}"
          stroke="#4a2a4a" stroke-width="0.8" fill="#3a1a3a" fill-opacity="0.24" opacity="0.49"/>`;
    s += `<path d="M${bedX + 55} ${bedY - 28} Q${bedX + 50} ${bedY - 10} ${bedX + 53} ${bedY + 5}"
          stroke="#4a2a4a" stroke-width="0.8" fill="#3a1a3a" fill-opacity="0.20" opacity="0.51"/>`;
    // Torn drape fragment hanging mid-canopy
    s += `<path d="M${bedX + 20} ${bedY - 28} Q${bedX + 22} ${bedY - 20} ${bedX + 18} ${bedY - 14}"
          stroke="#4a2a4a" stroke-width="0.5" fill="none" opacity="0.42"/>`;
    // Mattress / bedding
    s += `<rect x="${bedX + 2}" y="${bedY}" width="51" height="12" rx="2" fill="#2a1030" opacity="0.49"/>`;
    // Ornate headboard
    s += `<path d="M${bedX + 2} ${bedY} Q${bedX + 10} ${bedY - 10} ${bedX + 27} ${bedY - 12} Q${bedX + 44} ${bedY - 10} ${bedX + 53} ${bedY}"
          fill="#1a0818" opacity="0.56" stroke="#3a1a30" stroke-width="0.6"/>`;
    // Pillow
    s += `<ellipse cx="${bedX + 12}" cy="${bedY + 3}" rx="8" ry="3" fill="#3a2a3a" opacity="0.51"/>`;

    // --- furniture: nightstand with melted candle ---
    s += `<rect x="${bedX + 60}" y="${bedY + 2}" width="14" height="18" rx="1" fill="#1a0a18" opacity="0.49" stroke="#3a2a30" stroke-width="0.5"/>`;
    // Drawer handle
    s += `<line x1="${bedX + 64}" y1="${bedY + 12}" x2="${bedX + 70}" y2="${bedY + 12}" stroke="#5a4a40" stroke-width="0.4" opacity="0.51"/>`;
    // Melted candle
    s += `<rect x="${bedX + 65}" y="${bedY - 5}" width="3" height="7" fill="#d8c880" opacity="0.49"/>`;
    s += `<circle cx="${bedX + 66.5}" cy="${bedY - 6}" r="1.2" fill="#ffa500" opacity="0.42" class="house__flicker"/>`;
    // Wax drip marks down the side
    s += `<path d="M${bedX + 67} ${bedY + 2} Q${bedX + 68} ${bedY + 5} ${bedX + 67.5} ${bedY + 8}"
          stroke="#d8c880" stroke-width="0.5" fill="none" opacity="0.34"/>`;

    // --- furniture: large wardrobe (slightly ajar with darkness inside) ---
    const wardX = x + w - 32;
    s += `<rect x="${wardX}" y="${y + 25}" width="26" height="${floorY - y - 25}" rx="1" fill="#1a0a18" opacity="0.56" stroke="#3a2030" stroke-width="0.8"/>`;
    // Wardrobe door line (one side ajar)
    s += `<line x1="${wardX + 13}" y1="${y + 26}" x2="${wardX + 13}" y2="${floorY - 1}" stroke="#3a2030" stroke-width="0.5" opacity="0.51"/>`;
    // Ajar gap (deep darkness)
    s += `<rect x="${wardX + 12}" y="${y + 28}" width="3" height="${floorY - y - 32}" fill="#050008" opacity="0.63"/>`;
    // Door handles
    s += `<circle cx="${wardX + 11}" cy="${y + 55}" r="1" fill="#6a5a50" opacity="0.49"/>`;
    s += `<circle cx="${wardX + 15}" cy="${y + 55}" r="1" fill="#6a5a50" opacity="0.49"/>`;
    // Ornate top carving
    s += `<path d="M${wardX + 3} ${y + 27} Q${wardX + 13} ${y + 23} ${wardX + 23} ${y + 27}" fill="none" stroke="#4a2a40" stroke-width="0.5" opacity="0.51"/>`;

    // --- furniture: oval mirror on stand with crack ---
    const mirX = x + 95, mirY = y + 25;
    s += `<line x1="${mirX}" y1="${mirY + 16}" x2="${mirX - 4}" y2="${mirY + 30}" stroke="#3a2a30" stroke-width="0.8" opacity="0.51"/>`;
    s += `<line x1="${mirX}" y1="${mirY + 16}" x2="${mirX + 4}" y2="${mirY + 30}" stroke="#3a2a30" stroke-width="0.8" opacity="0.51"/>`;
    s += `<ellipse cx="${mirX}" cy="${mirY}" rx="8" ry="12" fill="#1a1a2a" opacity="0.26" stroke="#5a4a6a" stroke-width="0.8"/>`;
    // Crack across mirror
    s += `<path d="M${mirX - 5} ${mirY - 4} L${mirX + 1} ${mirY + 2} L${mirX - 1} ${mirY + 5} L${mirX + 6} ${mirY + 10}"
          stroke="#8a7a9a" stroke-width="0.4" fill="none" opacity="0.56"/>`;

    // --- furniture: curtained window with moonlight ---
    const winX = x + w / 2 - 15, winY = y + 5;
    s += `<rect x="${winX}" y="${winY}" width="20" height="28" fill="#0a0a2a" opacity="0.49" stroke="#3a3a5a" stroke-width="0.8"/>`;
    // Window panes
    s += `<line x1="${winX + 10}" y1="${winY}" x2="${winX + 10}" y2="${winY + 28}" stroke="#3a3a5a" stroke-width="0.4" opacity="0.51"/>`;
    s += `<line x1="${winX}" y1="${winY + 14}" x2="${winX + 20}" y2="${winY + 14}" stroke="#3a3a5a" stroke-width="0.4" opacity="0.51"/>`;
    // Heavy drapes (left pulled aside, right hanging)
    s += `<path d="M${winX - 3} ${winY - 2} Q${winX - 8} ${winY + 15} ${winX - 5} ${winY + 35}"
          stroke="#2a1030" stroke-width="2" fill="#2a1030" fill-opacity="0.34" opacity="0.49"/>`;
    s += `<path d="M${winX + 23} ${winY - 2} Q${winX + 26} ${winY + 10} ${winX + 25} ${winY + 35}"
          stroke="#2a1030" stroke-width="3" fill="#2a1030" fill-opacity="0.42" opacity="0.56"/>`;
    // Moonlight sliver through gap
    s += `<rect x="${winX + 2}" y="${winY + 2}" width="7" height="24" fill="#c0c8e0" opacity="0.12"/>`;
    // Moonbeam on floor
    s += `<path d="M${winX + 5} ${winY + 28} L${winX - 5} ${floorY} L${winX + 15} ${floorY} L${winX + 10} ${winY + 28}"
          fill="#c0c8e0" opacity="0.08"/>`;

    // --- scattered old books on floor ---
    s += `<rect x="${x + 85}" y="${floorY - 4}" width="8" height="3" rx="0.5" fill="#3a2020" opacity="0.51" transform="rotate(-8 ${x + 89} ${floorY - 2})"/>`;
    s += `<rect x="${x + 90}" y="${floorY - 3}" width="7" height="2.5" rx="0.5" fill="#2a2030" opacity="0.42" transform="rotate(5 ${x + 93} ${floorY - 2})"/>`;
    s += `<rect x="${x + 82}" y="${floorY - 2}" width="6" height="2" rx="0.5" fill="#2a1828" opacity="0.34"/>`;

    // --- atmosphere: shadow pools ---
    s += `<ellipse cx="${x + 10}" cy="${floorY + 3}" rx="14" ry="4" fill="#000" opacity="0.34"/>`;
    s += `<ellipse cx="${x + w - 15}" cy="${floorY + 3}" rx="12" ry="3.5" fill="#000" opacity="0.37"/>`;

    // --- atmosphere: dust motes in moonbeam ---
    s += `<circle cx="${winX + 3}" cy="${y + 50}" r="0.5" fill="#c0c8e0" opacity="0.26" class="house__dust"/>`;
    s += `<circle cx="${winX + 8}" cy="${y + 65}" r="0.4" fill="#c0c8e0" opacity="0.24" class="house__dust"/>`;
    s += `<circle cx="${winX}" cy="${y + 80}" r="0.6" fill="#c0c8e0" opacity="0.20" class="house__dust"/>`;

    return s;
  }

  function _atticDecor(x, y, w, h) {
    // Dusty Victorian attic - exposed rafters, trunks, dormer moonlight
    const floorY = y + h - 10;
    const cx = x + w / 2;
    let s = '';

    // --- floor: bare floorboards with gaps ---
    for (let i = 0; i < 12; i++) {
      const bx = x + i * 14;
      s += `<rect x="${bx}" y="${floorY}" width="13" height="10" fill="#3a3228" opacity="0.34" stroke="#2a2218" stroke-width="0.3"/>`;
    }
    // Gaps between boards (dark lines)
    for (let i = 1; i < 12; i++) {
      s += `<line x1="${x + i * 14 - 0.5}" y1="${floorY}" x2="${x + i * 14 - 0.5}" y2="${y + h}" stroke="#111" stroke-width="0.4" opacity="0.51"/>`;
    }

    // --- walls/structure: exposed roof beams (angled rafters meeting at peak) ---
    // Main ridge beam
    s += `<line x1="${x + 5}" y1="${y + 18}" x2="${x + w - 5}" y2="${y + 18}" stroke="#4a3218" stroke-width="3" opacity="0.63"/>`;
    // Angled rafters from ridge to walls
    s += `<line x1="${cx}" y1="${y + 3}" x2="${x + 5}" y2="${y + 18}" stroke="#4a3218" stroke-width="2.5" opacity="0.56"/>`;
    s += `<line x1="${cx}" y1="${y + 3}" x2="${x + w - 5}" y2="${y + 18}" stroke="#4a3218" stroke-width="2.5" opacity="0.56"/>`;
    // Vertical supports
    s += `<line x1="${x + w / 4}" y1="${y + 12}" x2="${x + w / 4}" y2="${y + 18}" stroke="#4a3218" stroke-width="2" opacity="0.49"/>`;
    s += `<line x1="${x + 3 * w / 4}" y1="${y + 12}" x2="${x + 3 * w / 4}" y2="${y + 18}" stroke="#4a3218" stroke-width="2" opacity="0.49"/>`;
    // Secondary horizontal beam lower
    s += `<line x1="${x + 10}" y1="${y + 40}" x2="${x + w - 10}" y2="${y + 40}" stroke="#4a3218" stroke-width="1.5" opacity="0.42"/>`;

    // --- cobwebs spanning between beams (multiple layers) ---
    s += `<path d="M${x + 2} ${y + 2} Q${x + 15} ${y + 8} ${x + 25} ${y + 2}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.42"/>`;
    s += `<path d="M${x + 2} ${y + 2} Q${x + 6} ${y + 12} ${x + 2} ${y + 20}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.34"/>`;
    s += `<path d="M${x + 2} ${y + 2} Q${x + 12} ${y + 10} ${x + 18} ${y + 16}" stroke="#777" stroke-width="0.25" fill="none" opacity="0.31"/>`;
    // Right corner cobweb
    s += `<path d="M${x + w} ${y + 2} Q${x + w - 12} ${y + 6} ${x + w - 22} ${y + 2}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.37"/>`;
    s += `<path d="M${x + w} ${y + 2} Q${x + w - 5} ${y + 14} ${x + w} ${y + 22}" stroke="#777" stroke-width="0.3" fill="none" opacity="0.34"/>`;
    s += `<path d="M${x + w} ${y + 2} Q${x + w - 10} ${y + 9} ${x + w - 16} ${y + 15}" stroke="#777" stroke-width="0.25" fill="none" opacity="0.31"/>`;
    // Cobweb sagging from lower beam
    s += `<path d="M${x + 50} ${y + 40} Q${x + 65} ${y + 48} ${x + 80} ${y + 40}" stroke="#777" stroke-width="0.25" fill="none" opacity="0.26"/>`;
    s += `<path d="M${x + 55} ${y + 40} Q${x + 65} ${y + 45} ${x + 75} ${y + 40}" stroke="#777" stroke-width="0.2" fill="none" opacity="0.24"/>`;

    // --- furniture: stacked steamer trunks ---
    // Bottom trunk (large)
    s += `<rect x="${x + 10}" y="${floorY - 22}" width="38" height="22" rx="2" fill="#3a2a18" opacity="0.56" stroke="#5a4a28" stroke-width="0.7"/>`;
    s += `<line x1="${x + 10}" y1="${floorY - 11}" x2="${x + 48}" y2="${floorY - 11}" stroke="#5a4a28" stroke-width="0.4" opacity="0.51"/>`;
    // Metal clasps
    s += `<rect x="${x + 22}" y="${floorY - 14}" width="4" height="5" fill="#6a5a30" opacity="0.51"/>`;
    s += `<rect x="${x + 36}" y="${floorY - 14}" width="4" height="5" fill="#6a5a30" opacity="0.51"/>`;
    // Top trunk (smaller, at angle)
    s += `<rect x="${x + 14}" y="${floorY - 36}" width="28" height="15" rx="2" fill="#4a3a22" opacity="0.49" stroke="#5a4a28" stroke-width="0.6"
          transform="rotate(-3 ${x + 28} ${floorY - 28})"/>`;

    // --- furniture: draped furniture under sheets (ghostly shapes) ---
    s += `<path d="M${x + 55} ${floorY} Q${x + 55} ${floorY - 30} ${x + 65} ${floorY - 35}
                   Q${x + 78} ${floorY - 38} ${x + 85} ${floorY - 32}
                   Q${x + 90} ${floorY - 28} ${x + 90} ${floorY}"
          fill="#5a5a52" opacity="0.26" stroke="#6a6a60" stroke-width="0.5"/>`;
    // Folds in the sheet
    s += `<path d="M${x + 62} ${floorY - 10} Q${x + 68} ${floorY - 14} ${x + 72} ${floorY - 10}" stroke="#6a6a60" stroke-width="0.3" fill="none" opacity="0.26"/>`;

    // --- furniture: broken rocking chair ---
    const chairX = x + 100;
    s += `<path d="M${chairX} ${floorY} Q${chairX + 5} ${floorY - 5} ${chairX + 18} ${floorY}" stroke="#4a3a20" stroke-width="1" fill="none" opacity="0.51"/>`;
    // Back rest (tilted, broken)
    s += `<line x1="${chairX + 2}" y1="${floorY - 4}" x2="${chairX - 1}" y2="${floorY - 28}" stroke="#4a3a20" stroke-width="0.8" opacity="0.51"/>`;
    s += `<line x1="${chairX + 16}" y1="${floorY - 4}" x2="${chairX + 14}" y2="${floorY - 25}" stroke="#4a3a20" stroke-width="0.8" opacity="0.51"/>`;
    // Broken back spindle
    s += `<line x1="${chairX + 5}" y1="${floorY - 8}" x2="${chairX + 3}" y2="${floorY - 18}" stroke="#4a3a20" stroke-width="0.5" opacity="0.42"/>`;
    // Seat
    s += `<line x1="${chairX + 2}" y1="${floorY - 6}" x2="${chairX + 16}" y2="${floorY - 6}" stroke="#4a3a20" stroke-width="0.8" opacity="0.42"/>`;

    // --- cracked birdcage hanging from beam ---
    const cageX = x + 120, cageY = y + 40;
    s += `<line x1="${cageX}" y1="${cageY}" x2="${cageX}" y2="${cageY + 5}" stroke="#5a5a5a" stroke-width="0.4" opacity="0.51"/>`;
    s += `<ellipse cx="${cageX}" cy="${cageY + 14}" rx="6" ry="9" fill="none" stroke="#5a5a5a" stroke-width="0.5" opacity="0.42"/>`;
    // Cage bars
    s += `<line x1="${cageX - 3}" y1="${cageY + 6}" x2="${cageX - 3}" y2="${cageY + 22}" stroke="#5a5a5a" stroke-width="0.3" opacity="0.34"/>`;
    s += `<line x1="${cageX + 3}" y1="${cageY + 6}" x2="${cageX + 3}" y2="${cageY + 22}" stroke="#5a5a5a" stroke-width="0.3" opacity="0.34"/>`;
    // Cage door (open, hanging)
    s += `<rect x="${cageX + 5}" y="${cageY + 10}" width="3" height="5" fill="none" stroke="#5a5a5a" stroke-width="0.3" opacity="0.34"
          transform="rotate(20 ${cageX + 5} ${cageY + 10})"/>`;

    // --- dormer window with moonlight shaft ---
    const winX = x + w - 38, winY = y + 4;
    s += `<path d="M${winX} ${winY + 10} L${winX + 10} ${winY} L${winX + 20} ${winY + 10} Z"
          fill="none" stroke="#5a5a6a" stroke-width="0.8" opacity="0.56"/>`;
    s += `<rect x="${winX + 2}" y="${winY + 10}" width="16" height="16" fill="#0a0a2a" opacity="0.51" stroke="#5a5a6a" stroke-width="0.6"/>`;
    // Window cross-bars
    s += `<line x1="${winX + 10}" y1="${winY + 10}" x2="${winX + 10}" y2="${winY + 26}" stroke="#5a5a6a" stroke-width="0.4" opacity="0.51"/>`;
    s += `<line x1="${winX + 2}" y1="${winY + 18}" x2="${winX + 18}" y2="${winY + 18}" stroke="#5a5a6a" stroke-width="0.4" opacity="0.51"/>`;
    // Moon glow in window
    s += `<circle cx="${winX + 12}" cy="${winY + 14}" r="3" fill="#d0d8f0" opacity="0.34"/>`;
    // Angled moonlight beam with dust motes
    s += `<path d="M${winX + 5} ${winY + 26} L${winX - 15} ${floorY} L${winX + 10} ${floorY} L${winX + 15} ${winY + 26}"
          fill="#c0c8e0" opacity="0.08"/>`;
    // Dust motes in moonbeam
    s += `<circle cx="${winX}" cy="${y + 50}" r="0.6" fill="#d0d8f0" opacity="0.34" class="house__dust"/>`;
    s += `<circle cx="${winX + 5}" cy="${y + 60}" r="0.4" fill="#d0d8f0" opacity="0.26" class="house__dust"/>`;
    s += `<circle cx="${winX - 3}" cy="${y + 70}" r="0.5" fill="#d0d8f0" opacity="0.31" class="house__dust"/>`;
    s += `<circle cx="${winX + 8}" cy="${y + 80}" r="0.3" fill="#d0d8f0" opacity="0.24" class="house__dust"/>`;
    s += `<circle cx="${winX - 7}" cy="${y + 90}" r="0.5" fill="#d0d8f0" opacity="0.28" class="house__dust"/>`;

    // --- scattered papers and old photographs ---
    s += `<rect x="${x + 50}" y="${floorY - 3}" width="5" height="4" fill="#d8d0b0" opacity="0.26" transform="rotate(-15 ${x + 52} ${floorY - 1})"/>`;
    s += `<rect x="${x + 58}" y="${floorY - 2}" width="4" height="3" fill="#c8c0a0" opacity="0.24" transform="rotate(8 ${x + 60} ${floorY})"/>`;
    s += `<rect x="${x + 95}" y="${floorY - 2}" width="6" height="4.5" fill="#b8a880" opacity="0.20" transform="rotate(-5 ${x + 98} ${floorY})"/>`;

    // --- atmosphere: shadow pools ---
    s += `<ellipse cx="${x + 10}" cy="${floorY + 2}" rx="12" ry="3" fill="#000" opacity="0.34"/>`;
    s += `<ellipse cx="${x + w - 10}" cy="${floorY + 2}" rx="10" ry="3" fill="#000" opacity="0.31"/>`;
    s += `<ellipse cx="${x + 70}" cy="${floorY + 2}" rx="15" ry="3" fill="#000" opacity="0.20"/>`;

    return s;
  }

  function _towerDecor(x, y, w, h) {
    // Circular stone tower room - dungeon-like, chains, candle sconces
    const cx = x + w / 2, cy = y + h / 2;
    const floorY = y + h - 12;
    let s = '';

    // --- floor: stone slab floor ---
    const slabWidths = [20, 25, 18, 22, 28, 20, 18];
    let sx = x;
    for (let row = 0; row < 2; row++) {
      sx = x + (row * 12);
      for (let i = 0; i < slabWidths.length && sx < x + w; i++) {
        s += `<rect x="${sx}" y="${floorY + row * 6}" width="${slabWidths[i]}" height="6"
              fill="#2a3a2a" opacity="0.34" stroke="#1a2a1a" stroke-width="0.3"/>`;
        sx += slabWidths[i] + 1;
      }
    }

    // --- walls: stone block texture (offset rectangles) ---
    const stoneH = 9;
    for (let row = 0; row < Math.floor((floorY - y) / stoneH); row++) {
      const offset = (row % 2) * 15;
      const sy = y + row * stoneH;
      for (let col = 0; col < 6; col++) {
        const bx = x + offset + col * 28;
        if (bx < x + w - 5) {
          const bw = Math.min(26, x + w - bx - 2);
          s += `<rect x="${bx}" y="${sy}" width="${bw}" height="${stoneH - 1}"
                fill="none" stroke="#3a4a3a" stroke-width="0.4" opacity="0.31"/>`;
        }
      }
    }
    // Mortar staining/cracks on stones
    s += `<line x1="${x + 20}" y1="${y + 15}" x2="${x + 25}" y2="${y + 22}" stroke="#222" stroke-width="0.3" opacity="0.42"/>`;
    s += `<line x1="${x + 90}" y1="${y + 40}" x2="${x + 95}" y2="${y + 48}" stroke="#222" stroke-width="0.25" opacity="0.34"/>`;
    s += `<line x1="${x + 50}" y1="${y + 70}" x2="${x + 58}" y2="${y + 73}" stroke="#222" stroke-width="0.3" opacity="0.34"/>`;

    // --- dripping moisture on walls ---
    s += `<path d="M${x + 35} ${y + 10} Q${x + 36} ${y + 25} ${x + 35} ${y + 40}" stroke="#3a5a4a" stroke-width="0.4" fill="none" opacity="0.26"/>`;
    s += `<circle cx="${x + 35}" cy="${y + 42}" r="0.7" fill="#3a6a5a" opacity="0.42" class="house__drip"/>`;
    s += `<path d="M${x + 110} ${y + 20} Q${x + 111} ${y + 35} ${x + 110} ${y + 50}" stroke="#3a5a4a" stroke-width="0.3" fill="none" opacity="0.24"/>`;

    // --- furniture: narrow arched window with lightning ---
    const winX = cx - 6, winY = y + 12;
    // Arched top
    s += `<path d="M${winX} ${winY + 10} Q${winX + 6} ${winY} ${winX + 12} ${winY + 10}" fill="#0a0a1a" opacity="0.56" stroke="#4a4a5a" stroke-width="0.8"/>`;
    s += `<rect x="${winX}" y="${winY + 10}" width="12" height="25" fill="#0a0a1a" opacity="0.49" stroke="#4a4a5a" stroke-width="0.8"/>`;
    // Window cross
    s += `<line x1="${winX + 6}" y1="${winY + 5}" x2="${winX + 6}" y2="${winY + 35}" stroke="#4a4a5a" stroke-width="0.5" opacity="0.51"/>`;
    s += `<line x1="${winX}" y1="${winY + 20}" x2="${winX + 12}" y2="${winY + 20}" stroke="#4a4a5a" stroke-width="0.5" opacity="0.51"/>`;
    // Lightning visible through window
    s += `<path d="M${winX + 4} ${winY + 8} l2 6 l-3 1 l3 8 l-2 1 l2 5"
          stroke="#e0e8ff" stroke-width="0.8" fill="none" opacity="0.42" class="house__lightning"/>`;
    // Lightning ambient glow
    s += `<rect x="${winX - 2}" y="${winY}" width="16" height="38" fill="#c0c8ff" opacity="0.06" class="house__lightning"/>`;

    // --- furniture: spiral staircase hint (curved lines, bottom-left corner) ---
    const stairX = x + 5, stairY = y + h - 50;
    for (let i = 0; i < 6; i++) {
      const sy = stairY + i * 7;
      const sw = 18 - i * 1.5;
      s += `<path d="M${stairX} ${sy} Q${stairX + sw / 2} ${sy - 3} ${stairX + sw} ${sy}"
            stroke="#3a4a3a" stroke-width="0.6" fill="none" opacity="${0.3 - i * 0.03}"/>`;
    }
    // Central pole
    s += `<line x1="${stairX + 2}" y1="${stairY}" x2="${stairX + 2}" y2="${stairY + 42}" stroke="#4a4a4a" stroke-width="0.8" opacity="0.51"/>`;

    // --- furniture: chains and shackles on wall ---
    const chainX = x + w - 30, chainY = y + 25;
    // Wall bracket
    s += `<rect x="${chainX}" y="${chainY}" width="5" height="3" fill="#4a4a4a" opacity="0.49"/>`;
    // Chain links (hanging down)
    for (let i = 0; i < 8; i++) {
      const ly = chainY + 3 + i * 4;
      s += `<ellipse cx="${chainX + 2.5}" cy="${ly + 2}" rx="1.8" ry="2.2"
            fill="none" stroke="#5a5a5a" stroke-width="0.5" opacity="${0.35 - i * 0.02}"/>`;
    }
    // Shackle at bottom
    s += `<path d="M${chainX - 1} ${chainY + 38} Q${chainX + 2.5} ${chainY + 44} ${chainX + 6} ${chainY + 38}"
          stroke="#5a5a5a" stroke-width="0.8" fill="none" opacity="0.51"/>`;
    // Second shorter chain
    s += `<rect x="${chainX + 15}" y="${chainY + 5}" width="4" height="3" fill="#4a4a4a" opacity="0.51"/>`;
    for (let i = 0; i < 5; i++) {
      const ly = chainY + 8 + i * 4;
      s += `<ellipse cx="${chainX + 17}" cy="${ly + 2}" rx="1.5" ry="2"
            fill="none" stroke="#5a5a5a" stroke-width="0.4" opacity="${0.3 - i * 0.03}"/>`;
    }

    // --- furniture: heavy wooden door with iron studs ---
    const doorX = x + w - 45, doorY = y + h - 60;
    s += `<rect x="${doorX}" y="${doorY}" width="24" height="${floorY - doorY}" rx="1" fill="#1a1a0a" opacity="0.49" stroke="#3a3a2a" stroke-width="1"/>`;
    // Arched top
    s += `<path d="M${doorX} ${doorY + 3} Q${doorX + 12} ${doorY - 6} ${doorX + 24} ${doorY + 3}" fill="#1a1a0a" opacity="0.51" stroke="#3a3a2a" stroke-width="0.8"/>`;
    // Iron studs (grid)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        s += `<circle cx="${doorX + 7 + c * 10}" cy="${doorY + 10 + r * 14}" r="1.5" fill="#4a4a4a" opacity="0.51"/>`;
      }
    }
    // Iron handle ring
    s += `<circle cx="${doorX + 19}" cy="${doorY + 25}" r="3" fill="none" stroke="#5a5a5a" stroke-width="0.7" opacity="0.49"/>`;

    // --- candle sconces on walls ---
    const sconces = [{sx: x + 25, sy: y + 35}, {sx: x + w - 55, sy: y + 30}];
    for (const sc of sconces) {
      // Wall bracket
      s += `<path d="M${sc.sx} ${sc.sy} L${sc.sx + 4} ${sc.sy} L${sc.sx + 4} ${sc.sy - 3}" stroke="#5a5a4a" stroke-width="0.6" fill="none" opacity="0.49"/>`;
      // Candle stub
      s += `<rect x="${sc.sx + 2}" y="${sc.sy - 10}" width="3" height="7" fill="#d8c880" opacity="0.51"/>`;
      // Flame
      s += `<ellipse cx="${sc.sx + 3.5}" cy="${sc.sy - 12}" rx="1.5" ry="2.5" fill="#ffa030" opacity="0.42" class="house__flicker"/>`;
      // Warm glow
      s += `<circle cx="${sc.sx + 3.5}" cy="${sc.sy - 8}" r="10" fill="#ffa030" opacity="0.08"/>`;
    }

    // --- iron chandelier (heavier than entrance) ---
    s += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + 8}" stroke="#3a3a3a" stroke-width="1" opacity="0.56"/>`;
    // Heavy iron ring
    s += `<ellipse cx="${cx}" cy="${y + 12}" rx="16" ry="4" fill="none" stroke="#4a4a4a" stroke-width="1.2" opacity="0.49"/>`;
    // Candles on chandelier
    for (let i = -2; i <= 2; i++) {
      const candleX = cx + i * 7;
      s += `<rect x="${candleX - 1}" y="${y + 7}" width="2" height="4" fill="#d8c880" opacity="0.42"/>`;
      s += `<circle cx="${candleX}" cy="${y + 6}" r="1" fill="#ffa030" opacity="0.34" class="house__flicker"/>`;
    }

    // --- scratches/claw marks on stone ---
    s += `<line x1="${x + 60}" y1="${y + 55}" x2="${x + 65}" y2="${y + 70}" stroke="#222" stroke-width="0.5" opacity="0.42"/>`;
    s += `<line x1="${x + 63}" y1="${y + 55}" x2="${x + 67}" y2="${y + 68}" stroke="#222" stroke-width="0.4" opacity="0.34"/>`;
    s += `<line x1="${x + 66}" y1="${y + 56}" x2="${x + 69}" y2="${y + 66}" stroke="#222" stroke-width="0.4" opacity="0.34"/>`;

    // --- rat hole ---
    s += `<path d="M${x + 75} ${floorY} Q${x + 78} ${floorY - 5} ${x + 81} ${floorY}" fill="#0a0a0a" opacity="0.63"/>`;

    // --- atmosphere: shadow pools ---
    s += `<ellipse cx="${x + 10}" cy="${floorY + 2}" rx="12" ry="3" fill="#000" opacity="0.37"/>`;
    s += `<ellipse cx="${x + w - 10}" cy="${floorY + 2}" rx="10" ry="3" fill="#000" opacity="0.34"/>`;

    // --- atmosphere: dust motes ---
    s += `<circle cx="${x + 45}" cy="${y + 50}" r="0.5" fill="#aaa" opacity="0.24" class="house__dust"/>`;
    s += `<circle cx="${x + 80}" cy="${y + 35}" r="0.4" fill="#aaa" opacity="0.20" class="house__dust"/>`;

    return s;
  }

  function _bathroomDecor(x, y, w, h) {
    // Victorian bathroom - claw-foot tub, exposed pipes, mould, hexagonal tiles
    const floorY = y + h - 14;
    let s = '';

    // --- floor: hexagonal tile pattern ---
    const hexR = 5;
    const hexH = hexR * Math.sqrt(3);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 12; col++) {
        const hx = x + col * hexR * 1.5 + (row % 2) * hexR * 0.75;
        const hy = floorY + row * hexH * 0.5;
        if (hx < x + w && hy < y + h) {
          s += `<polygon points="${hx},${hy - hexR * 0.5} ${hx + hexR * 0.43},${hy - hexR * 0.25} ${hx + hexR * 0.43},${hy + hexR * 0.25} ${hx},${hy + hexR * 0.5} ${hx - hexR * 0.43},${hy + hexR * 0.25} ${hx - hexR * 0.43},${hy - hexR * 0.25}"
                fill="none" stroke="#3a5a5a" stroke-width="0.3" opacity="0.42"/>`;
        }
      }
    }

    // --- walls: exposed pipes running along upper wall ---
    // Main horizontal pipe
    s += `<line x1="${x + 2}" y1="${y + 8}" x2="${x + w - 2}" y2="${y + 8}" stroke="#5a6a6a" stroke-width="2" opacity="0.49"/>`;
    // Pipe brackets
    s += `<path d="M${x + 30} ${y + 4} L${x + 30} ${y + 8}" stroke="#5a6a6a" stroke-width="1" opacity="0.51"/>`;
    s += `<path d="M${x + 80} ${y + 4} L${x + 80} ${y + 8}" stroke="#5a6a6a" stroke-width="1" opacity="0.51"/>`;
    s += `<path d="M${x + 130} ${y + 4} L${x + 130} ${y + 8}" stroke="#5a6a6a" stroke-width="1" opacity="0.51"/>`;
    // Vertical pipe down to tub taps
    s += `<line x1="${x + 60}" y1="${y + 8}" x2="${x + 60}" y2="${y + h - 55}" stroke="#5a6a6a" stroke-width="1.5" opacity="0.51"/>`;
    // Pipe joint
    s += `<ellipse cx="${x + 60}" cy="${y + h - 55}" rx="2.5" ry="1.5" fill="#5a6a6a" opacity="0.51"/>`;
    // Secondary pipe (to sink)
    s += `<line x1="${x + 110}" y1="${y + 8}" x2="${x + 110}" y2="${y + 35}" stroke="#5a6a6a" stroke-width="1.2" opacity="0.48"/>`;

    // --- mould stains in corners (dark green patches) ---
    s += `<ellipse cx="${x + 5}" cy="${y + 5}" rx="8" ry="6" fill="#1a3a1a" opacity="0.24"/>`;
    s += `<ellipse cx="${x + 8}" cy="${y + 10}" rx="5" ry="4" fill="#1a3a1a" opacity="0.16"/>`;
    s += `<ellipse cx="${x + w - 5}" cy="${y + h - 5}" rx="10" ry="5" fill="#1a3a1a" opacity="0.20"/>`;
    s += `<ellipse cx="${x + w - 8}" cy="${y + 8}" rx="6" ry="5" fill="#1a3a1a" opacity="0.18"/>`;

    // --- furniture: claw-foot bathtub (detailed) ---
    const tubX = x + 8, tubY = y + h - 48;
    // Tub body
    s += `<path d="M${tubX} ${tubY + 30} Q${tubX} ${tubY} ${tubX + 15} ${tubY - 3}
                   L${tubX + 50} ${tubY - 3} Q${tubX + 65} ${tubY} ${tubX + 65} ${tubY + 30}"
          fill="#2a4a4a" fill-opacity="0.20" stroke="#5a7a7a" stroke-width="1.0" opacity="0.63"/>`;
    // Tub rim
    s += `<path d="M${tubX - 1} ${tubY + 2} Q${tubX + 8} ${tubY - 5} ${tubX + 15} ${tubY - 4}
                   L${tubX + 50} ${tubY - 4} Q${tubX + 57} ${tubY - 5} ${tubX + 66} ${tubY + 2}"
          fill="none" stroke="#6a8a8a" stroke-width="0.8" opacity="0.56"/>`;
    // Claw feet (ornate - lion paw style)
    // Front-left foot
    s += `<path d="M${tubX + 4} ${tubY + 30} Q${tubX + 2} ${tubY + 33} ${tubX} ${tubY + 35}
                   Q${tubX + 3} ${tubY + 36} ${tubX + 7} ${tubY + 35} Q${tubX + 6} ${tubY + 32} ${tubX + 4} ${tubY + 30}"
          fill="#5a7a7a" opacity="0.51"/>`;
    // Front-right foot
    s += `<path d="M${tubX + 61} ${tubY + 30} Q${tubX + 63} ${tubY + 33} ${tubX + 65} ${tubY + 35}
                   Q${tubX + 62} ${tubY + 36} ${tubX + 58} ${tubY + 35} Q${tubX + 59} ${tubY + 32} ${tubX + 61} ${tubY + 30}"
          fill="#5a7a7a" opacity="0.51"/>`;
    // Water line inside tub
    s += `<line x1="${tubX + 5}" y1="${tubY + 10}" x2="${tubX + 60}" y2="${tubY + 10}" stroke="#3a6a6a" stroke-width="0.3" opacity="0.34"/>`;
    // Tub taps
    s += `<path d="M${tubX + 55} ${tubY - 8} L${tubX + 55} ${tubY - 14} Q${tubX + 53} ${tubY - 17} ${tubX + 49} ${tubY - 14}"
          stroke="#6a7a7a" stroke-width="1.2" fill="none" opacity="0.56"/>`;
    // Hot/cold handles
    s += `<circle cx="${tubX + 52}" cy="${tubY - 16}" r="1.5" fill="none" stroke="#6a7a7a" stroke-width="0.5" opacity="0.51"/>`;
    s += `<circle cx="${tubX + 58}" cy="${tubY - 13}" r="1.5" fill="none" stroke="#6a7a7a" stroke-width="0.5" opacity="0.51"/>`;
    // Dripping water from tap
    s += `<circle cx="${tubX + 50}" cy="${tubY - 10}" r="0.8" fill="#4a8a9a" opacity="0.56" class="house__drip"/>`;
    s += `<circle cx="${tubX + 50}" cy="${tubY - 6}" r="0.6" fill="#4a8a9a" opacity="0.51" class="house__drip"/>`;

    // --- furniture: pedestal sink with ornate mirror ---
    const sinkX = x + w - 40;
    // Pedestal base
    s += `<path d="M${sinkX + 5} ${floorY} L${sinkX + 7} ${y + h - 40} L${sinkX + 18} ${y + h - 40} L${sinkX + 20} ${floorY}"
          fill="#4a5a5a" opacity="0.34" stroke="#5a6a6a" stroke-width="0.5"/>`;
    // Sink basin
    s += `<ellipse cx="${sinkX + 13}" cy="${y + h - 42}" rx="14" ry="4" fill="#3a4a4a" opacity="0.34" stroke="#5a6a6a" stroke-width="0.6"/>`;
    // Sink tap
    s += `<path d="M${sinkX + 13} ${y + h - 48} L${sinkX + 13} ${y + h - 52} Q${sinkX + 11} ${y + h - 55} ${sinkX + 8} ${y + h - 52}"
          stroke="#6a7a7a" stroke-width="0.8" fill="none" opacity="0.49"/>`;
    // Ornate mirror above sink (oval, with frame)
    s += `<ellipse cx="${sinkX + 13}" cy="${y + 28}" rx="13" ry="17"
          fill="#1a2a2a" opacity="0.24" stroke="#5a6a6a" stroke-width="1.0"/>`;
    // Mirror frame decoration (small flourishes)
    s += `<path d="M${sinkX} ${y + 28} Q${sinkX - 2} ${y + 22} ${sinkX + 2} ${y + 16}" stroke="#5a6a6a" stroke-width="0.4" fill="none" opacity="0.34"/>`;
    s += `<path d="M${sinkX + 26} ${y + 28} Q${sinkX + 28} ${y + 22} ${sinkX + 24} ${y + 16}" stroke="#5a6a6a" stroke-width="0.4" fill="none" opacity="0.34"/>`;
    // Crack across mirror
    s += `<path d="M${sinkX + 5} ${y + 18} L${sinkX + 14} ${y + 28} L${sinkX + 10} ${y + 35} L${sinkX + 18} ${y + 42}"
          stroke="#7a8a8a" stroke-width="0.4" fill="none" opacity="0.49"/>`;
    // Mirror reflection hint (faint highlight)
    s += `<ellipse cx="${sinkX + 9}" cy="${y + 24}" rx="4" ry="6" fill="#6a8a8a" opacity="0.08"/>`;

    // --- furniture: towel rail with ragged towel ---
    const railX = x + 85, railY = y + 55;
    s += `<line x1="${railX}" y1="${railY}" x2="${railX + 20}" y2="${railY}" stroke="#5a6a6a" stroke-width="0.8" opacity="0.51"/>`;
    // Wall brackets
    s += `<line x1="${railX}" y1="${railY - 3}" x2="${railX}" y2="${railY}" stroke="#5a6a6a" stroke-width="0.6" opacity="0.42"/>`;
    s += `<line x1="${railX + 20}" y1="${railY - 3}" x2="${railX + 20}" y2="${railY}" stroke="#5a6a6a" stroke-width="0.6" opacity="0.42"/>`;
    // Ragged towel draped over
    s += `<path d="M${railX + 5} ${railY} Q${railX + 7} ${railY + 8} ${railX + 4} ${railY + 18}
                   Q${railX + 6} ${railY + 22} ${railX + 10} ${railY + 20}
                   Q${railX + 14} ${railY + 22} ${railX + 16} ${railY + 15}
                   Q${railX + 14} ${railY + 8} ${railX + 15} ${railY}"
          fill="#4a5a5a" opacity="0.26" stroke="#5a6a6a" stroke-width="0.4"/>`;

    // --- furniture: small window with frosted glass ---
    const winX = x + 5, winY = y + 20;
    s += `<rect x="${winX}" y="${winY}" width="14" height="18" fill="#1a2a2a" opacity="0.34" stroke="#4a5a5a" stroke-width="0.8"/>`;
    // Frosted glass effect
    s += `<rect x="${winX + 1}" y="${winY + 1}" width="12" height="16" fill="#5a6a6a" opacity="0.16"/>`;
    // Window frame cross
    s += `<line x1="${winX + 7}" y1="${winY}" x2="${winX + 7}" y2="${winY + 18}" stroke="#4a5a5a" stroke-width="0.4" opacity="0.42"/>`;
    s += `<line x1="${winX}" y1="${winY + 9}" x2="${winX + 14}" y2="${winY + 9}" stroke="#4a5a5a" stroke-width="0.4" opacity="0.42"/>`;
    // Faint light through frosted glass
    s += `<rect x="${winX + 2}" y="${winY + 2}" width="4" height="6" fill="#8a9aaa" opacity="0.12"/>`;

    // --- water puddle on floor ---
    s += `<ellipse cx="${tubX + 30}" cy="${floorY + 3}" rx="15" ry="3" fill="#3a6a7a" opacity="0.24"/>`;
    // Reflection shimmer in puddle
    s += `<ellipse cx="${tubX + 28}" cy="${floorY + 2}" rx="6" ry="1.5" fill="#5a8a9a" opacity="0.12"/>`;

    // --- atmosphere: shadow pools ---
    s += `<ellipse cx="${x + 8}" cy="${floorY + 3}" rx="10" ry="3" fill="#000" opacity="0.31"/>`;
    s += `<ellipse cx="${x + w - 8}" cy="${floorY + 3}" rx="10" ry="3" fill="#000" opacity="0.26"/>`;

    // --- atmosphere: dampness/water stains on walls ---
    s += `<ellipse cx="${x + 45}" cy="${y + 60}" rx="8" ry="12" fill="#2a4a3a" opacity="0.12"/>`;
    s += `<ellipse cx="${x + w - 20}" cy="${y + 70}" rx="6" ry="10" fill="#2a4a3a" opacity="0.10"/>`;

    // --- atmosphere: dust motes ---
    s += `<circle cx="${x + 30}" cy="${y + 40}" r="0.4" fill="#8a9a9a" opacity="0.24" class="house__dust"/>`;
    s += `<circle cx="${x + 100}" cy="${y + 50}" r="0.5" fill="#8a9a9a" opacity="0.20" class="house__dust"/>`;

    return s;
  }

  const DECOR = {
    entrance: _entranceDecor,
    kitchen: _kitchenDecor,
    bathroom: _bathroomDecor,
    bedroom: _bedroomDecor,
    attic: _atticDecor,
    tower: _towerDecor,
  };

  /* ─── SVG generation ─── */

  /** Build the full house SVG and inject it into the container element. */
  function init(container) {
    const L = _layout();
    const rooms = GameState.get('rooms');

    // Extra width for exterior return track on the right side
    const trackMargin = 50;
    const vbW = L.svgW + trackMargin;
    let svg = `<svg xmlns="${NS}" viewBox="-20 0 ${vbW + 20} ${L.svgH}"
                    class="house" preserveAspectRatio="xMidYMid meet">`;

    // Shared filter defs. The bubble-halo puts a crisp dark outline behind
    // emoji glyphs in visitor thought bubbles so they read against the
    // bright bubble fills — especially light-coloured emojis (ghost,
    // skeleton, astronaut) that would otherwise blend in. We can't use
    // `stroke` on the text: Firefox strips colour emojis when stroke is
    // applied. feDropShadow operates on SourceAlpha, which keeps the
    // colour glyph intact.
    svg += `<defs>
      <filter id="bubble-halo" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.0" flood-color="#000000" flood-opacity="1"/>
      </filter>
    </defs>`;

    // Static structure wrapper — rooms, walls, decorations, everything that
    // doesn't animate. The drop-shadow filter lives on this group (not the
    // root SVG) so the animated sibling layers below don't force the whole
    // scene to re-rasterise on every child animation.
    svg += `<g class="house__structure">`;

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
                    fill="${roomFill}" opacity="0.55" class="house__room-bg"/>`;

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

    // Close static structure wrapper — animated sibling layers follow.
    svg += `</g>`;

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

  /** Animate a locked room becoming unlocked. Idempotent — already-unlocked rooms are a no-op. */
  function unlockRoom(roomId) {
    const el = _roomEls[roomId];
    if (!el) return;
    if (!el.classList.contains('house__room--locked')) return;
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

    // Remove planks after fade-out animation
    setTimeout(() => {
      el.classList.remove('house__room--unlocking');
      const planks = el.querySelector('.house__planks');
      if (planks) planks.remove();
    }, 600);
  }

  /**
   * Toggle a room's "closed tonight" visual (editor-controlled skip state).
   * Visually distinct from `locked` — this is a player choice, not a gate.
   * Adds/removes a diagonal red CLOSED banner inside the room.
   */
  function setRoomVisualClosed(roomId, closed) {
    const el = _roomEls[roomId];
    if (!el) return;
    let banner = el.querySelector('.house__closed-banner');
    if (closed) {
      el.classList.add('house__room--closed');
      if (!banner) {
        const r = _roomCoords[roomId];
        if (!r) return;
        banner = document.createElementNS(NS, 'g');
        banner.classList.add('house__closed-banner');
        banner.innerHTML = `
          <rect x="${r.x + 8}" y="${r.cy - 9}" width="${r.w - 16}" height="18"
                fill="#8B1A1A" stroke="#3a0000" stroke-width="1" opacity="0.94"
                transform="rotate(-6 ${r.cx} ${r.cy})"/>
          <text x="${r.cx}" y="${r.cy + 4}" text-anchor="middle"
                fill="#fff" font-size="11" font-weight="bold" letter-spacing="1"
                font-family="'Arial Black', sans-serif"
                transform="rotate(-6 ${r.cx} ${r.cy})">CLOSED</text>
        `;
        el.appendChild(banner);
      }
    } else {
      el.classList.remove('house__room--closed');
      if (banner) banner.remove();
    }
  }

  /**
   * Toggle a room's mid-wave block visual (sign-holding creature inside).
   * Adds a small octagonal stop-sign overlay near the top of the room.
   * Distinct from setRoomVisualClosed — both can apply, neither interferes.
   */
  function setRoomVisualBlocked(roomId, blocked) {
    const el = _roomEls[roomId];
    if (!el) return;
    let sign = el.querySelector('.house__block-sign');
    if (blocked) {
      el.classList.add('house__room--blocked');
      if (!sign) {
        const r = _roomCoords[roomId];
        if (!r) return;
        const cx = r.cx;
        const cy = r.y + 14;
        const radius = 8;
        // Octagon vertices around (cx, cy), flat-top via π/8 phase offset
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i + (Math.PI / 8);
          pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
        }
        sign = document.createElementNS(NS, 'g');
        sign.classList.add('house__block-sign');
        sign.innerHTML = `
          <polygon points="${pts.join(' ')}" fill="#c0392b" stroke="#5a1410" stroke-width="1.2"/>
          <text x="${cx}" y="${cy + 2}" text-anchor="middle"
                fill="#fff" font-size="4.5" font-weight="bold" letter-spacing="0.3"
                font-family="'Arial Black', sans-serif">STOP</text>
        `;
        el.appendChild(sign);
      }
    } else {
      el.classList.remove('house__room--blocked');
      if (sign) sign.remove();
    }
  }

  return { init, getRoomEl, getRoomCentre, getRoomRect, getSvg, unlockRoom, setRoomVisualClosed, setRoomVisualBlocked };
})();
