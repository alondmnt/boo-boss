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

    // Centre divider X
    const divX = L.wallT + L.roomW + L.wallT / 2;
    const dip = 8;

    // Entry: gentle curve in from left
    const entryY = centres[0].y;
    let d = `M${-20},${entryY} Q${centres[0].x * 0.4},${entryY + dip} ${centres[0].x},${centres[0].y}`;

    for (let i = 1; i < centres.length; i++) {
      const prev = centres[i - 1];
      const curr = centres[i];
      const floorChange = Math.abs(prev.y - curr.y) > 10;

      if (!floorChange) {
        // Same floor: gentle dip
        const midX = (prev.x + curr.x) / 2;
        d += ` Q${midX},${prev.y + dip} ${curr.x},${curr.y}`;
      } else {
        // Floor transition: tight curve hugging the divider
        d += ` Q${divX},${prev.y} ${divX},${(prev.y + curr.y) / 2}`;
        d += ` Q${divX},${curr.y} ${curr.x},${curr.y}`;
      }
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

  /** Render track rails and crossties onto the track layer. */
  function _renderTrack(d) {
    _trackLayer.innerHTML = '';

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

    // Crossties at intervals
    const totalLen = _pathEl.getTotalLength();
    const tieSpacing = 18;
    for (let dist = 0; dist < totalLen; dist += tieSpacing) {
      const pt = _pathEl.getPointAtLength(dist);
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
  }

  /** Compute distance along path for each room stop. */
  function _computeStopDistances(route) {
    if (!_pathEl) return [];
    const totalLen = _pathEl.getTotalLength();
    const stops = [];

    for (const roomId of route) {
      const centre = House.getRoomCentre(roomId);
      // Find closest point on path to room centre
      let bestDist = 0;
      let bestDelta = Infinity;
      for (let d = 0; d <= totalLen; d += 2) {
        const pt = _pathEl.getPointAtLength(d);
        const dx = pt.x - centre.x;
        const dy = pt.y - centre.y;
        const delta = dx * dx + dy * dy;
        if (delta < bestDelta) {
          bestDelta = delta;
          bestDist = d;
        }
      }
      stops.push({ roomId, distance: bestDist });
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
    const totalLen = _pathEl.getTotalLength();
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
      const pt = _pathEl.getPointAtLength(currentDist);
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
   * Animate the exit train collecting visitors and leaving.
   * Calls onComplete() when train exits the screen.
   */
  function animateExit(onComplete) {
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (!_pathEl) { if (onComplete) onComplete(); return; }

    const totalLen = _pathEl.getTotalLength();
    const speed = totalLen / (CONFIG.trainSpeedMs * 0.7); // exit is faster
    let startTime = null;

    _cartEl.style.display = '';
    // Start from first room
    const firstPt = _pathEl.getPointAtLength(0);
    _cartEl.setAttribute('transform', `translate(${firstPt.x},${firstPt.y})`);

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const dist = (timestamp - startTime) * speed;

      if (dist >= totalLen) {
        _cartEl.style.display = 'none';
        if (onComplete) onComplete();
        return;
      }

      const pt = _pathEl.getPointAtLength(dist);
      _cartEl.setAttribute('transform', `translate(${pt.x},${pt.y})`);
      _animId = requestAnimationFrame(step);
    }

    _animId = requestAnimationFrame(step);
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

  return { init, animateEntry, animateExit, extendTrack, stop };
})();
