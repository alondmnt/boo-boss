/**
 * Train — renders the dark-ride track through unlocked rooms and animates
 * the cart along it. Fires callbacks at room stops for visitor loading/unloading.
 */
const Train = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let _svg = null;
  let _trackLayer = null;
  let _pathEl = null;
  let _cartEl = null;
  let _animId = null;

  // Pre-sampled path points: getPointAtLength is O(path-complexity) and was
  // previously called every rAF frame plus ~250 times at startup. We sample
  // once per _renderTrack into a flat Float32Array and read via _sampleAt.
  let _pathSamples = null;   // Float32Array of [x0,y0, x1,y1, ...]
  let _pathSampleStep = 2;   // units between consecutive samples
  let _pathTotalLen = 0;

  /** Create the cart SVG group (~30×20). */
  function _createCart() {
    const g = document.createElementNS(NS, 'g');
    g.classList.add('train__cart');
    g.innerHTML = `
      <!-- cart body -->
      <rect x="-14" y="-12" width="28" height="16" rx="3" fill="#2a1a3a" stroke="#5a3a6a" stroke-width="1.2"/>
      <!-- seat back -->
      <rect x="-10" y="-16" width="20" height="6" rx="2" fill="#3a2a4a" stroke="#5a3a6a" stroke-width="0.8"/>
      <!-- wheels -->
      <circle cx="-8" cy="6" r="3.5" fill="#444" stroke="#666" stroke-width="1"/>
      <circle cx="8" cy="6" r="3.5" fill="#444" stroke="#666" stroke-width="1"/>
      <!-- headlamp -->
      <circle cx="15" cy="-6" r="2" fill="#ffd700" opacity="0.8"/>
    `;
    g.style.display = 'none';
    return g;
  }

  /**
   * Generate one segment of the SVG path between two room centres.
   * Dispatches to a piece's pathGenerator when the player has placed one
   * on this segment (via GameState.setSegmentOverride); otherwise uses the
   * default `straight` piece, which reproduces the game's original curve.
   */
  function _segmentPath(prev, curr, slotType, fromRoom, toRoom) {
    const segId = GameState._segId(fromRoom, toRoom);
    const key = GameState.getSegmentOverride(segId) || 'straight';
    const piece = PIECES[key] || PIECES.straight;
    return piece.pathGenerator(prev, curr, slotType);
  }

  /** Classify a segment by the vertical gap between its endpoints. */
  function _slotTypeFor(prev, curr) {
    return Math.abs(prev.y - curr.y) > 10 ? 'floorChange' : 'sameFloorHorizontal';
  }

  /**
   * Compute the SVG path through the current track route.
   * The track winds like a dark ride — gentle dips through rooms,
   * tight arcs for floor transitions. Return path spirals down
   * the outside of the house to keep room interiors clear.
   */
  function _computeTrack() {
    const route = GameState.getTrackRoute();
    if (!route.length) return { d: '', stops: [] };

    const L = CONFIG.house;
    const svgW = 2 * L.roomW + 3 * L.wallT;
    const centres = route.map(r => House.getRoomCentre(r));

    // Entry: gentle curve in from left
    const entryY = centres[0].y;
    let d = `M${-20},${entryY} Q${centres[0].x * 0.4},${entryY + 8} ${centres[0].x},${centres[0].y}`;

    for (let i = 1; i < centres.length; i++) {
      const prev = centres[i - 1];
      const curr = centres[i];
      d += _segmentPath(prev, curr, _slotTypeFor(prev, curr), route[i - 1], route[i]);
    }

    // Return path: corkscrew down the exterior right wall
    const lastCentre = centres[centres.length - 1];
    const groundY = centres[0].y;
    const wallX = svgW + 18;    // clear of the right wall
    const loopR = 14;           // loop radius
    const loops = 5;            // number of full sine loops
    const totalDrop = groundY - lastCentre.y;

    // Exit right from last room
    d += ` L${wallX},${lastCentre.y}`;

    // Smooth corkscrew: cubic bezier S-curves down the wall
    const loopH = totalDrop / loops;
    for (let i = 0; i < loops; i++) {
      const y0 = lastCentre.y + i * loopH;
      const y1 = y0 + loopH / 2;
      const y2 = y0 + loopH;
      // First half: bulge right
      d += ` C${wallX + loopR},${y0} ${wallX + loopR},${y1} ${wallX},${y1}`;
      // Second half: bulge left
      d += ` C${wallX - loopR},${y1} ${wallX - loopR},${y2} ${wallX},${y2}`;
    }

    // Curve back to ground exit
    d += ` Q${wallX + loopR},${groundY + 5} ${svgW + 30},${groundY}`;

    return { d, route };
  }

  /**
   * Sample the current _pathEl into a flat Float32Array so per-frame and
   * per-tie position lookups become O(1) array reads instead of O(path)
   * getPointAtLength calls. Called once per _renderTrack.
   */
  function _samplePath() {
    const totalLen = _pathEl.getTotalLength();
    if (!(totalLen > 0)) { _pathSamples = null; _pathTotalLen = 0; return; }
    const step = _pathSampleStep;
    const n = Math.ceil(totalLen / step) + 1;
    const samples = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const pt = _pathEl.getPointAtLength(Math.min(i * step, totalLen));
      samples[i * 2]     = pt.x;
      samples[i * 2 + 1] = pt.y;
    }
    _pathSamples = samples;
    _pathTotalLen = totalLen;
  }

  /**
   * Linearly interpolate the sampled path at distance d.
   * Returns a plain {x, y} object (same shape as SVGPoint, easier to pool).
   */
  function _sampleAt(d) {
    if (!_pathSamples) return { x: 0, y: 0 };
    const step = _pathSampleStep;
    if (d <= 0) return { x: _pathSamples[0], y: _pathSamples[1] };
    if (d >= _pathTotalLen) {
      const last = _pathSamples.length - 2;
      return { x: _pathSamples[last], y: _pathSamples[last + 1] };
    }
    const f = d / step;
    const i = f | 0;
    const t = f - i;
    const a = i * 2;
    const b = a + 2;
    return {
      x: _pathSamples[a]     + (_pathSamples[b]     - _pathSamples[a])     * t,
      y: _pathSamples[a + 1] + (_pathSamples[b + 1] - _pathSamples[a + 1]) * t,
    };
  }

  /** Render track rails and crossties onto the track layer. */
  function _renderTrack(d) {
    _trackLayer.innerHTML = '';
    _pathSamples = null;

    if (!d) return;

    // Main track path (invisible, used for animation)
    _pathEl = document.createElementNS(NS, 'path');
    _pathEl.setAttribute('d', d);
    _pathEl.classList.add('train__track-path');
    _pathEl.setAttribute('fill', 'none');
    _pathEl.setAttribute('stroke', 'none');
    _trackLayer.appendChild(_pathEl);

    // Visible rails (two parallel lines offset from path)
    const rail1 = document.createElementNS(NS, 'path');
    rail1.setAttribute('d', d);
    rail1.classList.add('train__rail');
    rail1.setAttribute('fill', 'none');
    rail1.setAttribute('stroke', '#555');
    rail1.setAttribute('stroke-width', '2');
    rail1.setAttribute('transform', 'translate(0,-4)');
    _trackLayer.appendChild(rail1);

    const rail2 = document.createElementNS(NS, 'path');
    rail2.setAttribute('d', d);
    rail2.classList.add('train__rail');
    rail2.setAttribute('fill', 'none');
    rail2.setAttribute('stroke', '#555');
    rail2.setAttribute('stroke-width', '2');
    rail2.setAttribute('transform', 'translate(0,4)');
    _trackLayer.appendChild(rail2);

    // Sample the path once — all subsequent position lookups read from
    // _pathSamples instead of calling getPointAtLength per frame/per tie.
    _samplePath();

    // Crossties at intervals
    const totalLen = _pathTotalLen;
    const tieSpacing = 18;
    for (let dist = 0; dist < totalLen; dist += tieSpacing) {
      const pt = _sampleAt(dist);
      const tie = document.createElementNS(NS, 'line');
      tie.setAttribute('x1', pt.x);
      tie.setAttribute('y1', pt.y - 5);
      tie.setAttribute('x2', pt.x);
      tie.setAttribute('y2', pt.y + 5);
      tie.setAttribute('stroke', '#3a3a3a');
      tie.setAttribute('stroke-width', '2.5');
      tie.classList.add('train__tie');
      _trackLayer.appendChild(tie);
    }

    // Add cart to track layer
    _trackLayer.appendChild(_cartEl);

    // Piece aux overlays (e.g. tunnel dark rects) — rendered ABOVE the cart so
    // a cart passing through a tunnel visibly disappears behind the overlay.
    _renderPieceAux();
  }

  /** Append any aux SVG (overlays, not in the path) contributed by installed pieces. */
  function _renderPieceAux() {
    const route = GameState.getTrackRoute();
    if (route.length < 2) return;
    for (let i = 1; i < route.length; i++) {
      const fromRoom = route[i - 1];
      const toRoom = route[i];
      const key = GameState.getSegmentOverride(GameState._segId(fromRoom, toRoom));
      if (!key) continue;
      const piece = PIECES[key];
      if (!piece || !piece.auxSvg) continue;
      const prev = House.getRoomCentre(fromRoom);
      const curr = House.getRoomCentre(toRoom);
      if (!prev || !curr) continue;
      const g = document.createElementNS(NS, 'g');
      g.classList.add('piece-aux');
      g.setAttribute('data-piece', key);
      g.innerHTML = piece.auxSvg(prev, curr, _slotTypeFor(prev, curr));
      _trackLayer.appendChild(g);
    }
  }

  /** Compute distance along path for each room stop. */
  function _computeStopDistances(route) {
    if (!_pathSamples) return [];
    const step = _pathSampleStep;
    const n = _pathSamples.length / 2;
    const stops = [];

    for (const roomId of route) {
      const centre = House.getRoomCentre(roomId);
      // Find closest sample to room centre
      let bestIdx = 0;
      let bestDelta = Infinity;
      for (let i = 0; i < n; i++) {
        const dx = _pathSamples[i * 2]     - centre.x;
        const dy = _pathSamples[i * 2 + 1] - centre.y;
        const delta = dx * dx + dy * dy;
        if (delta < bestDelta) {
          bestDelta = delta;
          bestIdx = i;
        }
      }
      stops.push({ roomId, distance: Math.min(bestIdx * step, _pathTotalLen) });
    }

    return stops;
  }

  /** Initialise the train module and render initial track. */
  function init(svg) {
    _svg = svg;
    _trackLayer = svg.querySelector('.house__track-layer');
    _cartEl = _createCart();

    const { d, route } = _computeTrack();
    _renderTrack(d);
  }

  /**
   * Animate the entry train carrying visitors through all rooms.
   * Calls onRoomReached(roomId, roomIndex) at each stop.
   * Calls onComplete() when train exits.
   */
  function animateEntry(onRoomReached, onComplete) {
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (!_pathEl) { if (onComplete) onComplete(); return; }

    const { route } = _computeTrack();
    const stops = _computeStopDistances(route);
    const totalLen = _pathTotalLen;
    const speed = totalLen / CONFIG.trainSpeedMs;
    let currentDist = 0;
    let nextStopIdx = 0;
    let paused = false;
    let startTime = null;
    let pauseStart = null;

    _cartEl.style.display = '';

    function step(timestamp) {
      if (!startTime) startTime = timestamp;

      if (paused) {
        // Check if pause duration elapsed
        if (timestamp - pauseStart >= CONFIG.trainStopMs) {
          paused = false;
          startTime = timestamp - (currentDist / speed);
        } else {
          _animId = requestAnimationFrame(step);
          return;
        }
      }

      currentDist = (timestamp - startTime) * speed;

      if (currentDist >= totalLen) {
        _cartEl.style.display = 'none';
        if (onComplete) onComplete();
        return;
      }

      // Position cart
      const pt = _sampleAt(currentDist);
      _cartEl.setAttribute('transform', `translate(${pt.x},${pt.y})`);

      // Check for room stops
      if (nextStopIdx < stops.length && currentDist >= stops[nextStopIdx].distance) {
        const stop = stops[nextStopIdx];
        nextStopIdx++;
        paused = true;
        pauseStart = timestamp;
        if (onRoomReached) onRoomReached(stop.roomId, nextStopIdx - 1);
      }

      _animId = requestAnimationFrame(step);
    }

    _animId = requestAnimationFrame(step);
  }

  /**
   * Animate the collection train: runs the full route, pausing at each room
   * to collect visitors. Calls onRoomReached(roomId) at each stop so Wave
   * can trigger boarding animations.
   * Calls onComplete() when the train exits the screen.
   */
  function animateCollection(onRoomReached, onComplete) {
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (!_pathEl) { if (onComplete) onComplete(); return; }

    const { route } = _computeTrack();
    const stops = _computeStopDistances(route);
    const totalLen = _pathTotalLen;
    const speed = totalLen / (CONFIG.trainSpeedMs * 0.7); // faster collection run
    let nextStopIdx = 0;
    let paused = false;
    let startTime = null;
    let pauseStart = null;
    let lastDist = 0;
    const stopDuration = 800; // pause at each room for boarding

    _cartEl.style.display = '';

    function step(timestamp) {
      if (!startTime) startTime = timestamp;

      if (paused) {
        if (timestamp - pauseStart >= stopDuration) {
          paused = false;
          startTime = timestamp - (lastDist / speed);
        } else {
          _animId = requestAnimationFrame(step);
          return;
        }
      }

      const currentDist = (timestamp - startTime) * speed;
      lastDist = currentDist;

      if (currentDist >= totalLen) {
        _cartEl.style.display = 'none';
        if (onComplete) onComplete();
        return;
      }

      const pt = _sampleAt(currentDist);
      _cartEl.setAttribute('transform', `translate(${pt.x},${pt.y})`);

      // Check for room stops
      if (nextStopIdx < stops.length && currentDist >= stops[nextStopIdx].distance) {
        const stop = stops[nextStopIdx];
        nextStopIdx++;
        paused = true;
        pauseStart = timestamp;
        if (onRoomReached) onRoomReached(stop.roomId);
      }

      _animId = requestAnimationFrame(step);
    }

    _animId = requestAnimationFrame(step);
  }

  /**
   * Simple exit animation (no stops). Used as fallback.
   */
  function animateExit(onComplete) {
    animateCollection(null, onComplete);
  }

  /** Recompute and animate the track to include newly unlocked rooms. */
  function extendTrack() {
    const { d } = _computeTrack();
    _renderTrack(d);

    // Animate track drawing via stroke-dashoffset
    const rails = _trackLayer.querySelectorAll('.train__rail');
    rails.forEach(rail => {
      const len = rail.getTotalLength();
      rail.style.strokeDasharray = len;
      rail.style.strokeDashoffset = len;
      rail.style.transition = 'stroke-dashoffset 1s ease-out';
      requestAnimationFrame(() => { rail.style.strokeDashoffset = '0'; });
    });
  }

  /** Cancel any running animation. */
  function stop() {
    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }
    if (_cartEl) _cartEl.style.display = 'none';
  }

  /** Silent re-render of the current track path. Used by the editor on piece change. */
  function renderTrack() {
    const { d } = _computeTrack();
    _renderTrack(d);
  }

  return { init, animateEntry, animateCollection, animateExit, extendTrack, renderTrack, stop };
})();
