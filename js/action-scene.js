/**
 * ActionScene — scripted mini-scenes for axis-3 actions.
 * Each scene orchestrates a setup → pause → payoff sequence that REPLACES
 * the default scare reaction when Director's Chair is unlocked.
 *
 * Scenes are defensive on two axes:
 *   - creature.el.isConnected checks guard against full removal (wave reset).
 *   - A scene-generation counter (creature._sceneGen) lets play() and
 *     disarm() invalidate all in-flight tweens and scheduled continuations
 *     so a hug mid-scare cleanly interrupts the scare choreography without
 *     leaving the creature mid-transform. Scenes grab an is-stale closure
 *     at entry (_makeIsStale) and thread it through their tweens + timers.
 *
 * The caller's onDone is stashed on creature._sceneOnDone during a scene
 * and flushed by disarm or a superseding play(), so the wave state machine
 * (visitor._scared reset, next movement tick) always advances even when a
 * scene is cut short.
 */
const ActionScene = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  /** Small helper: is the creature still live in the DOM? */
  function _live(creature) {
    return creature && creature.el && creature.el.isConnected;
  }

  /** Quadratic ease-out (default for most phases). */
  function _easeOut(t) { return 1 - (1 - t) * (1 - t); }
  /** Cubic ease-in (weighty drop). */
  function _easeIn(t) { return t * t * t; }

  /**
   * Tween an SVG element's transform attribute between two states.
   * State shape: { tx, ty, rot, sx, sy }. Uses rAF; bails if element
   * disconnects mid-tween. Calls onDone when complete.
   *
   * SVG attribute transform is used (not CSS) so the rotation pivots
   * around the element's local (0, 0) — predictable across browsers,
   * unlike CSS transformOrigin on SVG <g>.
   *
   * Optional abortIf predicate is polled each frame: when it returns
   * true, the tween stops writing and skips its onDone. Scenes pass
   * an is-stale closure here so hug-interrupt can cancel in-flight
   * transforms cleanly.
   */
  function _tweenTransform(el, from, to, durationMs, easing, onDone, abortIf) {
    const ease = easing || _easeOut;
    const start = performance.now();
    function step(now) {
      if (!el || !el.isConnected) { if (onDone) onDone(); return; }
      if (abortIf && abortIf()) return;
      const t = Math.min(1, (now - start) / durationMs);
      const e = ease(t);
      const tx  = from.tx + (to.tx - from.tx) * e;
      const ty  = from.ty + (to.ty - from.ty) * e;
      const rot = from.rot + (to.rot - from.rot) * e;
      const sx  = from.sx + (to.sx - from.sx) * e;
      const sy  = from.sy + (to.sy - from.sy) * e;
      el.setAttribute('transform',
        `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) ` +
        `rotate(${rot.toFixed(1)}) ` +
        `scale(${sx.toFixed(3)} ${sy.toFixed(3)})`
      );
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }

  /** Return +1 if visitor is to the right of creature, -1 if to the left. */
  function _lungeDirection(visitor, creature) {
    try {
      const vr = visitor.el.getBoundingClientRect();
      const cr = creature.el.getBoundingClientRect();
      return vr.left + vr.width / 2 >= cr.left + cr.width / 2 ? 1 : -1;
    } catch (_) {
      return 1;
    }
  }

  /** Parse an SVG translate(x, y) from an element's transform attribute. */
  function _parseTranslate(el) {
    const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
    const m = t.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
  }

  /**
   * Compute angle (degrees) and distance from the creature's bodyCenter
   * to the visitor's hat, expressed in the creature's parent SVG coordinates.
   * Visitor hat sits ~40 units above the visitor's local origin.
   */
  function _aimAtHat(visitor, creature) {
    const cPos = _parseTranslate(creature.el);
    const vPos = _parseTranslate(visitor.el);
    const anchors = Creatures.getAnchors(creature.type);
    const bodyX = cPos.x + anchors.bodyCenter.x;
    const bodyY = cPos.y + anchors.bodyCenter.y;
    const hatX  = vPos.x;
    const hatY  = vPos.y - 40;
    const dx = hatX - bodyX;
    const dy = hatY - bodyY;
    return {
      angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
      distance: Math.sqrt(dx * dx + dy * dy),
    };
  }

  /**
   * Add an embarrassed-face overlay on top of the current pose.
   * Uses the creature's headCenter anchor + scale. The overlay is
   * appended INSIDE the active pose group so it inherits any pose-level
   * animations (e.g. spider-sway) and stays glued to the creature's head.
   * Idempotent: removes any existing face first so repeat calls don't stack.
   */
  function _addEmbarrassedFace(creature) {
    if (!_live(creature)) return null;
    _removeEmbarrassedFace(creature);
    const poseName = creature.pose || 'idle';
    const poseGroup = creature.el.querySelector(`.creature__pose--${poseName}`);
    if (!poseGroup) return null;

    const anchors = Creatures.getAnchors(creature.type);
    const { x, y } = anchors.headCenter;
    const s = anchors.scale || 1;

    const g = document.createElementNS(NS, 'g');
    g.classList.add('creature__embarrassed');
    g.setAttribute('transform', `translate(${x}, ${y}) scale(${s})`);
    g.innerHTML = `
      <ellipse cx="-4" cy="0" rx="2.8" ry="2" fill="#fff" stroke="#333" stroke-width="0.3"/>
      <ellipse cx="4"  cy="0" rx="2.8" ry="2" fill="#fff" stroke="#333" stroke-width="0.3"/>
      <circle  cx="-4" cy="-1.1" r="0.9" fill="#333"/>
      <circle  cx="4"  cy="-1.1" r="0.9" fill="#333"/>
      <ellipse cx="-5" cy="2.2" rx="1.1" ry="0.5" fill="#ff9999" opacity="0.55"/>
      <ellipse cx="5"  cy="2.2" rx="1.1" ry="0.5" fill="#ff9999" opacity="0.55"/>
    `;
    poseGroup.appendChild(g);
    return g;
  }

  function _removeEmbarrassedFace(creature) {
    if (!creature || !creature.el) return;
    const face = creature.el.querySelector('.creature__embarrassed');
    if (face && face.parentNode) face.parentNode.removeChild(face);
  }

  /**
   * Add a held stop-sign-on-a-stick to a creature for the room-block action.
   * Stick emerges from a grip near bodyCenter and reaches past the head (or
   * past the body the other way for the upside-down bat). Sign carries a
   * white "halt"-hand on red. Each deploy gets a random tilt in ±20° so
   * different creatures don't all hold it dead-vertical — feels organic.
   *
   * Attached at the creature's top level (like _addFloorShadow) so it
   * survives idle→scare pose transitions during the payoff. Idempotent.
   *
   * Coordinates are in creature-local SVG units (not scaled). Anchor offsets
   * already encode each creature's natural size, so spider gets a small held
   * sign and gorilla a chunky one without an explicit scale factor.
   */
  function _addBlockSign(creature) {
    if (!_live(creature)) return null;
    _removeBlockSign(creature);

    const anchors = Creatures.getAnchors(creature.type);
    const isBat = creature.type === 'bat';

    // Post emerges from body centre (no x offset). Read as "held in front
    // of the body" — combined with the random tilt this still reads as a
    // casual holding pose, but stays centred on small/symmetric creatures.
    const gripX = anchors.bodyCenter.x;
    const gripY = anchors.bodyCenter.y;
    const signCx = gripX;
    // Sign clears the silhouette: above the head for upright creatures,
    // below the body for the bat (matches the _addEffectLabel convention).
    const signCy = isBat
      ? anchors.bodyCenter.y + 14
      : anchors.headTop.y - 12;
    const signR = 8;
    const stickEndY = isBat ? signCy - signR : signCy + signR;

    // Octagon vertices around (signCx, signCy), flat-top via π/8 phase offset.
    const oct = [];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i + (Math.PI / 8);
      oct.push(`${(signCx + signR * Math.cos(a)).toFixed(2)},${(signCy + signR * Math.sin(a)).toFixed(2)}`);
    }

    // Wood-coloured post, halo + dark core like the grab stick (action-scene
    // _makeGrabber) but ~60% the thickness — held, not extended.
    const stickY = Math.min(gripY, stickEndY);
    const stickH = Math.abs(stickEndY - gripY);
    const haloW = 2.0, coreW = 1.4;

    // Tilt: 15-30° off vertical with random sign. Magnitude floor of 15°
    // keeps the post out of the floating monster-effect label that lives
    // directly above the head.
    const tiltDeg = (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 15);

    const g = document.createElementNS(NS, 'g');
    g.classList.add('creature__block-sign');
    g.setAttribute('transform', `rotate(${tiltDeg.toFixed(1)}, ${gripX}, ${gripY})`);
    g.innerHTML = `
      <rect x="${(gripX - haloW / 2).toFixed(2)}" y="${stickY.toFixed(2)}"
            width="${haloW.toFixed(2)}" height="${stickH.toFixed(2)}" rx="0.6" fill="#f5e6c0"/>
      <rect x="${(gripX - coreW / 2).toFixed(2)}" y="${stickY.toFixed(2)}"
            width="${coreW.toFixed(2)}" height="${stickH.toFixed(2)}" rx="0.4" fill="#6b4226"/>
      <polygon points="${oct.join(' ')}" fill="#c0392b" stroke="#5a1410" stroke-width="0.7"/>
      ${_handPictogram(signCx, signCy, signR)}
    `;
    creature.el.appendChild(g);
    // Mark the creature as sign-holding so CSS can pause its idle motion —
    // otherwise the body sways (e.g. spider) but the sign, attached at the
    // outer creature.el, stays put and reads as detached.
    creature.el.classList.add('creature--block-active');
    return g;
  }

  /**
   * White "halt" hand pictogram: tall rounded palm + an angled thumb, with
   * three thin background-coloured lines through the upper palm to suggest
   * finger separation without tracing each finger.
   */
  function _handPictogram(cx, cy, r) {
    const u = r / 3.5;
    const palmW = 2.8 * u, palmH = 4.2 * u;
    const palmCx = cx - 0.25 * u, palmCy = cy - 0.1 * u;
    const thumbW = 0.85 * u, thumbH = 1.7 * u;
    const thumbBaseX = palmCx + palmW / 2 - 0.1 * u;
    const thumbBaseY = palmCy + 0.4 * u;
    // Finger-separator lines: top inset from the rounded crown of the palm,
    // bottom about 55% down from the top so they only mark the finger zone.
    const finY1 = palmCy - palmH / 2 + 0.5 * u;
    const finY2 = palmCy - 0.4 * u;
    const finLineW = (0.16 * u).toFixed(2);
    const finXs = [-0.7, 0.0, 0.7].map(d => (palmCx + d * u).toFixed(2));
    return `
      <g fill="#fff">
        <rect x="${(palmCx - palmW / 2).toFixed(2)}" y="${(palmCy - palmH / 2).toFixed(2)}"
              width="${palmW.toFixed(2)}" height="${palmH.toFixed(2)}" rx="${(1.0 * u).toFixed(2)}"/>
        <rect x="${(thumbBaseX - thumbW / 2).toFixed(2)}" y="${(thumbBaseY - thumbH).toFixed(2)}"
              width="${thumbW.toFixed(2)}" height="${thumbH.toFixed(2)}" rx="${(0.4 * u).toFixed(2)}"
              transform="rotate(30 ${thumbBaseX.toFixed(2)} ${thumbBaseY.toFixed(2)})"/>
      </g>
      <g stroke="#c0392b" stroke-width="${finLineW}" stroke-linecap="round">
        <line x1="${finXs[0]}" y1="${finY1.toFixed(2)}" x2="${finXs[0]}" y2="${finY2.toFixed(2)}"/>
        <line x1="${finXs[1]}" y1="${finY1.toFixed(2)}" x2="${finXs[1]}" y2="${finY2.toFixed(2)}"/>
        <line x1="${finXs[2]}" y1="${finY1.toFixed(2)}" x2="${finXs[2]}" y2="${finY2.toFixed(2)}"/>
      </g>
    `;
  }

  function _removeBlockSign(creature) {
    if (!creature || !creature.el) return;
    const sign = creature.el.querySelector('.creature__block-sign');
    if (sign && sign.parentNode) sign.parentNode.removeChild(sign);
  }

  /**
   * Finish the scare: particles, audio, visitor scared state, then onDone.
   * Optional isStale lets the hold-end setTimeout bail on abort so the
   * trailing pose reset doesn't stomp a hug pose that started mid-scare;
   * the caller's _sceneOnDone flush covers the wave-state side separately.
   */
  function _payoffScare(visitor, creature, onDone, totalMs, isStale) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    Creatures.setPose(creature, 'scare');
    Visitor.setState(visitor, 'scared');
    Audio.play('scare');
    Particles.spookyBurst(visitor.el);

    setTimeout(() => {
      if (isStale && isStale()) return;
      if (_live(creature)) Creatures.setPose(creature, 'idle');
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, totalMs);
  }

  /**
   * Build an is-stale predicate keyed to the creature's current scene
   * generation. Scenes call this once at entry. The closure returns
   * true after any play() or disarm() bumps _sceneGen — every tween
   * and setTimeout gated by it aborts cleanly.
   */
  function _makeIsStale(creature) {
    const gen = creature._sceneGen;
    return () => creature._sceneGen !== gen;
  }

  /**
   * Fire any pending wave-state onDone from a superseded scene so the
   * caller's state machine (visitor._scared reset, next movement tick)
   * advances even when a scene is aborted mid-way.
   */
  function _flushPendingOnDone(creature) {
    if (!creature) return;
    const pending = creature._sceneOnDone;
    if (!pending) return;
    creature._sceneOnDone = null;
    pending();
  }

  /**
   * jumpOut — setup: embarrassed fade + tilt, hold at half-opacity "armed" look.
   * Runs on deploy (and after each payoff). Half-opacity hold is the visible
   * tell that the creature is primed; going fully invisible only happens as
   * part of the payoff transition, so a visitor never enters to an empty room.
   * Returns the tween duration so arm() can mark armed when visuals settle.
   */
  function _jumpOutArm(creature) {
    if (!_live(creature)) return 0;
    const inner = creature.innerEl || creature.el;
    _addEmbarrassedFace(creature);
    inner.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    inner.style.transformOrigin = 'center';
    inner.style.opacity = '0.3';
    inner.style.transform = 'rotate(-6deg)';
    return 500;
  }

  /**
   * jumpOut — payoff: disappear briefly, then snap back with a scale bounce
   * into the scare pose. Assumes the creature is armed (half-opacity, tilted,
   * face visible); if called cold, the creature simply fades from full
   * opacity instead of from the embarrassed hold — still a crisp scare,
   * just without the priming beat.
   */
  function _jumpOutPayoff(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);
    const inner = creature.innerEl || creature.el;

    // Disappear fully, remove the embarrassed face.
    inner.style.transition = 'opacity 0.2s linear';
    inner.style.opacity = '0';
    _removeEmbarrassedFace(creature);

    setTimeout(() => {
      if (isStale()) return;
      if (!_live(creature)) { if (onDone) onDone(); return; }
      // Snap back with scale bounce.
      inner.style.transition = 'opacity 0.12s ease-out, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
      inner.style.opacity = '1';
      inner.style.transform = 'rotate(0deg) scale(1.15)';
      setTimeout(() => {
        if (isStale()) return;
        if (_live(creature)) {
          inner.style.transition = 'transform 0.15s ease-out';
          inner.style.transform = 'rotate(0deg) scale(1)';
        }
      }, 180);
      _payoffScare(visitor, creature, () => {
        if (_live(creature)) {
          inner.style.transition = '';
          inner.style.transform = '';
          inner.style.transformOrigin = '';
          inner.style.opacity = '';
        }
        if (onDone) onDone();
      }, 400, isStale);
    }, 300);
  }

  /**
   * Build a hook-on-stick grabber SVG rooted at the creature's bodyCenter,
   * rotated to aim at the target and sized to the reach distance.
   * Returns { outer, inner } — outer positions + rotates; inner is the
   * stretch target (scaleX 0 → 1) for extension and retraction.
   */
  function _makeGrabber(creature, angleDeg, length) {
    const anchors = Creatures.getAnchors(creature.type);
    const { x: bx, y: by } = anchors.bodyCenter;

    const outer = document.createElementNS(NS, 'g');
    outer.classList.add('grabber');
    outer.setAttribute('transform', `translate(${bx} ${by}) rotate(${angleDeg.toFixed(1)})`);

    const inner = document.createElementNS(NS, 'g');
    inner.classList.add('grabber__stretch');
    const L  = length.toFixed(1);
    const Lh = (length + 7).toFixed(1);
    // Thin cream halo underneath the dark-wood core so the prop reads
    // against any wall colour without bulking up the shape (~0.5 unit
    // wider per side).
    inner.innerHTML = `
      <rect x="-0.5" y="-1.7" width="${(length + 1).toFixed(1)}" height="3.4" rx="1.1" fill="#f5e6c0"/>
      <path d="M ${L} -4.5 Q ${(length + 7.5).toFixed(1)} 0 ${L} 4.5" fill="none" stroke="#f5e6c0" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="0"    y="-1.2" width="${L}" height="2.4" rx="0.8" fill="#6b4226"/>
      <path d="M ${L} -4 Q ${Lh} 0 ${L} 4" fill="none" stroke="#6b4226" stroke-width="1.8" stroke-linecap="round"/>
    `;
    outer.appendChild(inner);
    return { outer, inner };
  }

  /**
   * grabHat: a hook-on-stick aims at the visitor's hat, extends to reach,
   * snatches the hat at peak reach, then retracts. Standard scare pose
   * delivers the payoff. Universal prop — no per-creature limb work.
   */
  function _grabHat(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);
    const aim = _aimAtHat(visitor, creature);
    // Clamp the stick length so an odd position doesn't produce a stub or a tree-trunk.
    const length = Math.max(20, Math.min(80, aim.distance - 4));
    const { outer, inner } = _makeGrabber(creature, aim.angleDeg, length);
    creature.el.appendChild(outer);

    const retracted = { tx: 0, ty: 0, rot: 0, sx: 0, sy: 1 };
    const extended  = { tx: 0, ty: 0, rot: 0, sx: 1, sy: 1 };

    const cleanupGrabber = () => {
      if (outer.parentNode) outer.parentNode.removeChild(outer);
    };

    // Phase 1: extend toward visitor
    _tweenTransform(inner, retracted, extended, 350, _easeOut, () => {
      if (isStale()) { cleanupGrabber(); return; }
      if (!_live(creature)) {
        cleanupGrabber();
        if (onDone) onDone();
        return;
      }
      // Phase 2: snatch the hat at peak reach
      Visitor.removeHat(visitor);
      // Phase 3: retract (slightly snappier)
      _tweenTransform(inner, extended, retracted, 260, _easeIn, () => {
        cleanupGrabber();
        if (isStale()) return;
        if (!_live(creature)) { if (onDone) onDone(); return; }
        // Phase 4: payoff scare
        _payoffScare(visitor, creature, onDone, 400, isStale);
      }, isStale);
    }, isStale);
  }

  /**
   * Transform targets for dropFromCeiling. The wall pose rotates 90° so the
   * creature's feet touch the wall and the head points into the room;
   * squash is the landing beat after lunging off.
   */
  const _DROP_REST   = { tx: 0, ty: 0,   rot: 0,   sx: 1,    sy: 1    };
  const _DROP_SQUASH = { tx: 0, ty: 0,   rot: 0,   sx: 1.15, sy: 0.8  };
  const _dropWall = (dir) =>
    ({ tx: 55 * dir, ty: -12, rot: -90 * dir, sx: 0.7, sy: 0.7 });

  /**
   * dropFromCeiling — setup: scramble to a random wall (left or right) and
   * cling. The chosen direction is stashed on the creature so the armed
   * payoff lunges off the correct wall. The cold-path inline scene still
   * picks the wall nearest the visitor instead.
   */
  function _dropFromCeilingArm(creature) {
    if (!_live(creature)) return 0;
    const dir = Math.random() < 0.5 ? -1 : 1;
    creature._dropDir = dir;
    const inner = creature.innerEl || creature.el;
    const isStale = _makeIsStale(creature);
    _tweenTransform(inner, _DROP_REST, _dropWall(dir), 450, _easeOut, null, isStale);
    return 450;
  }

  /**
   * Shared lunge → squash → rest tail used by both the armed and cold paths.
   * Payoff scare runs concurrently with the squash-to-rest tween so the
   * scare pose snaps in as the creature lands.
   */
  function _dropFromCeilingLunge(visitor, creature, from, onDone, isStale) {
    const inner = creature.innerEl || creature.el;
    _tweenTransform(inner, from, _DROP_SQUASH, 300, _easeIn, () => {
      if (isStale()) return;
      if (!_live(creature)) { if (onDone) onDone(); return; }
      _tweenTransform(inner, _DROP_SQUASH, _DROP_REST, 160, _easeOut, () => {
        if (isStale()) return;
        if (_live(creature)) inner.removeAttribute('transform');
      }, isStale);
      _payoffScare(visitor, creature, onDone, 400, isStale);
    }, isStale);
  }

  /**
   * dropFromCeiling — payoff: lunge off the wall with a weighty squash.
   * Armed path lunges directly from the pre-staged right wall. Cold path
   * scrambles to the wall nearest the visitor, clings briefly, then lunges.
   */
  function _dropFromCeilingPayoff(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);

    if (creature.armed) {
      _dropFromCeilingLunge(visitor, creature, _dropWall(creature._dropDir || 1), onDone, isStale);
      return;
    }

    const inner = creature.innerEl || creature.el;
    const wall = _dropWall(_lungeDirection(visitor, creature));

    _tweenTransform(inner, _DROP_REST, wall, 450, _easeOut, () => {
      if (isStale()) return;
      if (!_live(creature)) { if (onDone) onDone(); return; }
      setTimeout(() => {
        if (isStale()) return;
        if (!_live(creature)) { if (onDone) onDone(); return; }
        _dropFromCeilingLunge(visitor, creature, wall, onDone, isStale);
      }, 250);
    }, isStale);
  }

  /**
   * swarm — payoff-only: on encounter, the scare pose multiplies briefly.
   * Four translucent copies of the creature fan out to the diagonal
   * corners around the original (TR, BR, BL, TL), hold for a beat while
   * the scare pose plays, then collapse back and dissolve. Diagonal
   * placement keeps clones clear of wide scare silhouettes (splayed
   * spider legs, gorilla arms) better than cardinal top/bottom would.
   * No arm: the visual punch is concentrated in the payoff moment, which
   * makes the action a timing gag rather than a staging gag.
   *
   * Clones are full creature.el copies so the scare pose inherits correctly
   * (pose visibility is via inline opacity on the pose groups). Clones are
   * desaturated + blurred so they read as echoes rather than real creatures
   * missing their monster overlay. The effect label is stripped so it
   * doesn't multiply above the room.
   */
  const _SWARM_RADIUS = 28;
  const _SWARM_DIAG = _SWARM_RADIUS * Math.SQRT1_2; // radius projected onto each axis
  const _SWARM_OFFSETS = [
    { dx:  _SWARM_DIAG, dy: -_SWARM_DIAG },  // top-right
    { dx:  _SWARM_DIAG, dy:  _SWARM_DIAG },  // bottom-right
    { dx: -_SWARM_DIAG, dy:  _SWARM_DIAG },  // bottom-left
    { dx: -_SWARM_DIAG, dy: -_SWARM_DIAG },  // top-left
  ];

  function _swarm(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);

    Creatures.setPose(creature, 'scare');

    const parent = creature.el.parentNode;
    const base = _parseTranslate(creature.el);
    const clones = [];

    for (const { dx, dy } of _SWARM_OFFSETS) {
      const g = creature.el.cloneNode(true);
      g.style.pointerEvents = 'none';
      g.style.filter = 'saturate(0.15) brightness(1.15) blur(0.5px)';
      g.style.opacity = '0';
      g.style.transition = 'opacity 0.18s ease-out';
      g.setAttribute('transform', `translate(${base.x} ${base.y}) scale(1)`);
      // Strip overlays that shouldn't duplicate
      const label = g.querySelector('.creature__effect-label');
      if (label && label.parentNode) label.parentNode.removeChild(label);
      parent.appendChild(g);
      clones.push({ el: g, dx, dy });
    }

    const cleanupClones = () => {
      for (const { el } of clones) {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    };

    // Fan out
    for (const { el, dx, dy } of clones) {
      el.style.opacity = '0.55';
      _tweenTransform(el,
        { tx: base.x,      ty: base.y,      rot: 0, sx: 1,   sy: 1 },
        { tx: base.x + dx, ty: base.y + dy, rot: 0, sx: 0.9, sy: 0.9 },
        220, _easeOut, null, isStale);
    }

    // Scare payoff runs concurrently with the swarm visual
    Visitor.setState(visitor, 'scared');
    Audio.play('scare');
    Particles.spookyBurst(visitor.el);

    // Collapse back after the hold
    setTimeout(() => {
      if (isStale()) { cleanupClones(); return; }
      for (const { el, dx, dy } of clones) {
        if (!el.isConnected) continue;
        el.style.opacity = '0';
        _tweenTransform(el,
          { tx: base.x + dx, ty: base.y + dy, rot: 0, sx: 0.9, sy: 0.9 },
          { tx: base.x,      ty: base.y,      rot: 0, sx: 1,   sy: 1 },
          180, _easeIn, null, isStale);
      }
    }, 380);

    setTimeout(() => {
      cleanupClones();
      if (isStale()) return;
      if (_live(creature)) Creatures.setPose(creature, 'idle');
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, 640);
  }

  /**
   * Transform targets for peek-a-boo. Hidden sinks the creature below
   * its rest position with zero opacity; visible is the standard rest
   * pose. Amplitude is modest so the creature reads as emerging from
   * the floor rather than teleporting.
   */
  const _PEEK_HIDDEN  = { tx: 0, ty: 15, rot: 0, sx: 1, sy: 1 };
  const _PEEK_VISIBLE = { tx: 0, ty: 0,  rot: 0, sx: 1, sy: 1 };

  /**
   * Add a dark elliptical shadow at floor level on the creature, fading
   * in. The shadow sits on creature.el (not inner), so it stays put
   * while the inner group sinks and rises during peeks. Idempotent.
   */
  function _addFloorShadow(creature) {
    if (!_live(creature)) return null;
    _removeFloorShadow(creature);
    const shadow = document.createElementNS(NS, 'ellipse');
    shadow.classList.add('creature__peek-shadow');
    shadow.setAttribute('cx', '0');
    shadow.setAttribute('cy', '22');
    shadow.setAttribute('rx', '22');
    shadow.setAttribute('ry', '4');
    shadow.setAttribute('fill', '#000');
    shadow.style.opacity = '0';
    shadow.style.transition = 'opacity 0.3s ease-out';
    // Insert as first child so it renders behind the creature body.
    creature.el.insertBefore(shadow, creature.el.firstChild);
    requestAnimationFrame(() => { shadow.style.opacity = '0.4'; });
    return shadow;
  }

  function _removeFloorShadow(creature) {
    if (!creature || !creature.el) return;
    const shadow = creature.el.querySelector('.creature__peek-shadow');
    if (shadow && shadow.parentNode) shadow.parentNode.removeChild(shadow);
  }

  /**
   * peek-a-boo — setup: sink the creature below the floor and draw a
   * shadow at floor level as the visible tell. Returns the tween
   * duration so arm() can mark armed when the sink completes.
   */
  function _peekABooArm(creature) {
    if (!_live(creature)) return 0;
    const inner = creature.innerEl || creature.el;
    const isStale = _makeIsStale(creature);
    inner.style.transition = 'opacity 0.25s ease-out';
    inner.style.opacity = '0';
    _tweenTransform(inner, _PEEK_VISIBLE, _PEEK_HIDDEN, 250, _easeIn, null, isStale);
    _addFloorShadow(creature);
    return 250;
  }

  /** Rise from hidden to visible (opacity + translate). */
  function _peekShow(creature, durationMs, isStale) {
    if (!_live(creature)) return;
    const inner = creature.innerEl || creature.el;
    inner.style.transition = `opacity ${(durationMs / 1000).toFixed(2)}s ease-out`;
    inner.style.opacity = '1';
    _tweenTransform(inner, _PEEK_HIDDEN, _PEEK_VISIBLE, durationMs, _easeOut, null, isStale);
  }

  /** Sink back to hidden. */
  function _peekHide(creature, durationMs, isStale) {
    if (!_live(creature)) return;
    const inner = creature.innerEl || creature.el;
    inner.style.transition = `opacity ${(durationMs / 1000).toFixed(2)}s ease-out`;
    inner.style.opacity = '0';
    _tweenTransform(inner, _PEEK_VISIBLE, _PEEK_HIDDEN, durationMs, _easeIn, null, isStale);
  }

  /**
   * Final beat: rise, run scare payoff, then reset inner styles and
   * clear the SVG transform so the creature is back to idle state.
   */
  function _peekFinal(visitor, creature, onDone, isStale) {
    if (isStale()) return;
    if (!_live(creature)) { _removeFloorShadow(creature); if (onDone) onDone(); return; }
    _peekShow(creature, 160, isStale);
    setTimeout(() => {
      if (isStale()) return;
      _payoffScare(visitor, creature, () => {
        _removeFloorShadow(creature);
        if (_live(creature)) {
          const inner = creature.innerEl || creature.el;
          inner.removeAttribute('transform');
          inner.style.transition = '';
          inner.style.opacity = '';
        }
        if (onDone) onDone();
      }, 400, isStale);
    }, 160);
  }

  /**
   * One quick peek (rise, hold, sink, pause) then the final reveal.
   * Step array keeps the timing readable; each entry is [action, delay
   * until next step]. Live check on every tick bails to cleanup if the
   * creature dies mid-sequence; is-stale bails silently (disarm owns the
   * cleanup in that case).
   */
  function _runPeekSequence(visitor, creature, onDone, isStale) {
    const bail = () => { _removeFloorShadow(creature); if (onDone) onDone(); };
    const steps = [
      [() => _peekShow(creature, 140, isStale), 240],  // rise + visible hold
      [() => _peekHide(creature, 120, isStale), 220],  // sink + hidden pause
      [() => _peekFinal(visitor, creature, onDone, isStale), 0],
    ];
    let i = 0;
    const next = () => {
      if (isStale()) return;
      if (!_live(creature)) return bail();
      const [fn, delay] = steps[i++];
      fn();
      if (i < steps.length) setTimeout(next, delay);
    };
    next();
  }

  /**
   * peek-a-boo — payoff: run the peek sequence. If not armed (visitor
   * arrived before arm completed, or director's chair just unlocked),
   * run the arm inline first so the scene always starts from hidden.
   */
  function _peekABooPayoff(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);
    if (creature.armed) {
      _runPeekSequence(visitor, creature, onDone, isStale);
    } else {
      _peekABooArm(creature);
      setTimeout(() => {
        if (isStale()) return;
        _runPeekSequence(visitor, creature, onDone, isStale);
      }, 250);
    }
  }

  /**
   * chase — payoff-only: creature enters scare pose, shrinks as if
   * retreating into the depth of the room, then barrels back toward
   * the visitor through two sub-tweens that swing rotation opposite
   * ways (reads as a running footfall cadence) while scaling up (reads
   * as depth closing) and stepping toward the visitor's side. Scare
   * beat lands at peak reach, then the creature settles back to its
   * deploy position.
   *
   * Cold-only (like grabHat) — dash direction depends on where the
   * visitor is, so nothing to pre-stage. Uses the existing scare pose
   * rather than a dedicated side-facing run pose; the depth-scaling
   * and rotation wobble do the motion heavy-lifting.
   */
  function _chase(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);
    const inner = creature.innerEl || creature.el;

    const dir = _lungeDirection(visitor, creature);
    const rest  = { tx: 0,        ty: 0, rot: 0,         sx: 1,    sy: 1    };
    // Far back and small — "retreating into the depth of the room"
    const far   = { tx: 0,        ty: 0, rot: -9 * dir,  sx: 0.4,  sy: 0.4  };
    // First footfall: lean into the charge, half-way in x, half-grown
    const mid   = { tx: 11 * dir, ty: 0, rot: 12 * dir,  sx: 0.75, sy: 0.75 };
    // Impact: opposite lean (wobble), full scale, at the visitor's side
    const reach = { tx: 22 * dir, ty: 0, rot: -5 * dir,  sx: 1.15, sy: 1.15 };

    Creatures.setPose(creature, 'scare');

    const bail = () => {
      if (inner) inner.removeAttribute('transform');
      if (onDone) onDone();
    };

    // Phase 1: tween the retreat into depth (visible, not a snap)
    _tweenTransform(inner, rest, far, 300, _easeIn, () => {
      if (isStale()) return;
      if (!_live(creature)) return bail();
      // Phase 2a: first footfall — lean forward, grow, step
      _tweenTransform(inner, far, mid, 220, _easeOut, () => {
        if (isStale()) return;
        if (!_live(creature)) return bail();
        // Phase 2b: second footfall — wobble rotation back, finish growing, land
        _tweenTransform(inner, mid, reach, 220, _easeOut, () => {
          if (isStale()) return;
          if (!_live(creature)) return bail();
          // Phase 3: impact beat
          Visitor.setState(visitor, 'scared');
          Audio.play('scare');
          Particles.spookyBurst(visitor.el);

          setTimeout(() => {
            if (isStale()) return;
            if (!_live(creature)) return bail();
            // Phase 4: settle back to deploy position
            _tweenTransform(inner, reach, rest, 260, _easeIn, () => {
              if (isStale()) return;
              if (_live(creature)) {
                inner.removeAttribute('transform');
                Creatures.setPose(creature, 'idle');
              }
              Visitor.setState(visitor, 'walking');
              if (onDone) onDone();
            }, isStale);
          }, 320);
        }, isStale);
      }, isStale);
    }, isStale);
  }

  /**
   * Registered scenes keyed by action type.
   *
   * - `arm(creature)` — optional pre-stage run on idle (deploy / post-payoff).
   *   Kicks off the setup visuals and returns the duration in ms; the outer
   *   arm() marks creature.armed = true after that window.
   * - `payoff(visitor, creature, onDone)` — the scare proper. Reads
   *   creature.armed to choose between a fast armed path and the cold
   *   full-scene path.
   *
   * Actions without an arm run payoff only (they're always "cold" — e.g.
   * grabHat, whose hook must aim at the visitor).
   */
  const SCENES = {
    jumpOut:         { arm: _jumpOutArm,         payoff: _jumpOutPayoff },
    grabHat:         {                           payoff: _grabHat },
    dropFromCeiling: { arm: _dropFromCeilingArm, payoff: _dropFromCeilingPayoff },
    swarm:           {                           payoff: _swarm },
    peekABoo:        { arm: _peekABooArm,        payoff: _peekABooPayoff },
    chase:           {                           payoff: _chase },
    blockRoom:       { arm: _blockArm,           payoff: _blockPayoff },
  };

  /**
   * block — arm: pin the stop-sign overlay onto the creature's pose.
   * No animated arm window. Idempotent: the sign is added once on first
   * deploy and stays for the creature's lifetime, so post-payoff re-arms
   * after each scare don't churn the DOM or shuffle the tilt.
   */
  function _blockArm(creature) {
    if (!_live(creature)) return 0;
    if (!creature.el || creature.el.querySelector('.creature__block-sign')) return 0;
    _addBlockSign(creature);
    return 0;
  }

  /**
   * block — payoff: keep the sign visible while running the default scare
   * payoff. The block effect itself is independent of the encounter.
   */
  function _blockPayoff(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const isStale = _makeIsStale(creature);
    _payoffScare(visitor, creature, onDone, 380, isStale);
  }

  /** Does this action have a registered scene? */
  function has(action) {
    return !!SCENES[action];
  }

  /** Cancel any pending re-arm timer on a creature. */
  function _cancelArming(creature) {
    if (creature && creature._armTimer) {
      clearTimeout(creature._armTimer);
      creature._armTimer = null;
    }
  }

  /**
   * Pre-stage the creature's action on idle. Safe to call multiple times:
   * cancels any pending arm timer first, then runs the action's arm.
   * No-op if director's chair isn't unlocked, the action has no arm, or
   * the creature isn't live.
   */
  function arm(creature) {
    if (!creature || !_live(creature)) return;
    if (!GameState.get('directorsChair')) return;
    const scene = SCENES[creature.action];
    if (!scene || !scene.arm) return;
    _cancelArming(creature);
    creature.armed = false;
    const durationMs = scene.arm(creature) || 0;
    if (!durationMs) return;
    creature._armTimer = setTimeout(() => {
      creature._armTimer = null;
      if (_live(creature)) creature.armed = true;
    }, durationMs);
  }

  /**
   * Strip any armed visual state from the creature — inner-element styles,
   * embarrassed face, pending arm timer. Called before non-scare reactions
   * (e.g. hug) so the armed look doesn't leak into the next pose.
   */
  function disarm(creature) {
    if (!creature) return;
    _cancelArming(creature);
    creature.armed = false;
    // Bump scene-gen so any in-flight tweens / continuations abort, then
    // fire the pending onDone so the caller's state machine advances even
    // when the scene is cut short mid-way.
    creature._sceneGen = (creature._sceneGen || 0) + 1;
    _flushPendingOnDone(creature);
    _removeEmbarrassedFace(creature);
    _removeFloorShadow(creature);
    const inner = creature.innerEl || creature.el;
    if (inner) {
      inner.removeAttribute('transform');
      if (inner.style) {
        inner.style.transition = '';
        inner.style.transform = '';
        inner.style.transformOrigin = '';
        inner.style.opacity = '';
      }
    }
  }

  /**
   * Play the scene for an action. Falls through to onDone if unknown.
   *
   * creature.armed is NOT cleared before payoff — the payoff reads it to
   * choose between the armed fast-path and the cold full-scene path.
   * finish() clears it after the scene completes.
   */
  function play(action, visitor, creature, onDone) {
    const scene = SCENES[action];
    if (!scene) { if (onDone) onDone(); return; }

    _cancelArming(creature);

    // Bump scene-gen before dispatching so any superseded continuations
    // see a stale gen and abort. Flush any pending onDone from the prior
    // scene so its caller's state machine advances before this one starts.
    creature._sceneGen = (creature._sceneGen || 0) + 1;
    const gen = creature._sceneGen;
    _flushPendingOnDone(creature);
    creature._sceneOnDone = onDone;

    const finish = () => {
      // If _sceneOnDone no longer points at ours, the onDone was already
      // fired via flush (disarm/new-scene); skip the normal completion path.
      if (creature._sceneOnDone !== onDone) return;
      creature._sceneOnDone = null;
      creature.armed = false;
      if (onDone) onDone();
      // Re-arm for the next visitor, after a short breath so the creature
      // reads as "back to normal" before the setup begins again.
      if (scene.arm && _live(creature)) {
        setTimeout(() => {
          if (creature._sceneGen === gen) arm(creature);
        }, 150);
      }
    };

    scene.payoff(visitor, creature, finish);
  }

  return { play, has, arm, disarm };
})();
