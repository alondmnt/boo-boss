/**
 * ActionScene — scripted mini-scenes for axis-3 actions.
 * Each scene orchestrates a setup → pause → payoff sequence that REPLACES
 * the default scare reaction when Director's Chair is unlocked.
 *
 * Scenes are intentionally short (≤1200ms) and defensive: each phase checks
 * creature.el.isConnected before mutating so reset mid-scene is safe without
 * explicit generation threading. The final onDone runs wave.js's generation
 * check as usual.
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
   */
  function _tweenTransform(el, from, to, durationMs, easing, onDone) {
    const ease = easing || _easeOut;
    const start = performance.now();
    function step(now) {
      if (!el || !el.isConnected) { if (onDone) onDone(); return; }
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

  /**
   * Add an embarrassed-face overlay on top of the current pose.
   * Uses the creature's headCenter anchor + scale. The overlay is
   * appended INSIDE the active pose group so it inherits any pose-level
   * animations (e.g. spider-sway) and stays glued to the creature's head.
   */
  function _addEmbarrassedFace(creature) {
    if (!_live(creature)) return null;
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

  /** Finish the scare: particles, audio, visitor scared state, then onDone. */
  function _payoffScare(visitor, creature, onDone, totalMs) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    Creatures.setPose(creature, 'scare');
    Visitor.setState(visitor, 'scared');
    Audio.play('scare');
    Particles.spookyBurst(visitor.el);

    setTimeout(() => {
      if (_live(creature)) Creatures.setPose(creature, 'idle');
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, totalMs);
  }

  /**
   * jumpOut: creature primes itself with an embarrassed fade, disappears,
   * then snaps back with a bounce into the scare pose.
   */
  function _jumpOut(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const inner = creature.innerEl || creature.el;
    _addEmbarrassedFace(creature);

    // Setup: embarrassed fade-out with tilt
    inner.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    inner.style.transformOrigin = 'center';
    inner.style.opacity = '0.3';
    inner.style.transform = 'rotate(-6deg)';

    setTimeout(() => {
      if (!_live(creature)) return;
      // Pause: fully invisible, remove embarrassed face
      inner.style.transition = 'opacity 0.2s linear';
      inner.style.opacity = '0';
      _removeEmbarrassedFace(creature);
    }, 500);

    setTimeout(() => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      // Payoff: snap back with scale bounce
      inner.style.transition = 'opacity 0.12s ease-out, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
      inner.style.opacity = '1';
      inner.style.transform = 'rotate(0deg) scale(1.15)';
      setTimeout(() => {
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
      }, 400);
    }, 800);
  }

  /**
   * grabHat: creature lunges toward the visitor, snatches their hat off,
   * returns to position, then delivers the scare.
   */
  function _grabHat(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const inner = creature.innerEl || creature.el;
    const dir = _lungeDirection(visitor, creature);
    const dx = 18 * dir;

    // Lunge toward visitor
    inner.style.transition = 'transform 0.35s ease-out';
    inner.style.transformOrigin = 'center';
    inner.style.transform = `translateX(${dx}px) scale(1.05)`;

    setTimeout(() => {
      if (!_live(creature)) return;
      // Snatch: remove the hat + recoil back
      Visitor.removeHat(visitor);
      inner.style.transition = 'transform 0.2s ease-in';
      inner.style.transform = 'translateX(0px) scale(1)';
    }, 400);

    setTimeout(() => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      _payoffScare(visitor, creature, () => {
        if (_live(creature)) {
          inner.style.transition = '';
          inner.style.transform = '';
          inner.style.transformOrigin = '';
        }
        if (onDone) onDone();
      }, 400);
    }, 600);
  }

  /**
   * dropFromCeiling: creature scurries sideways to the nearest wall
   * (rotated 90° so its feet touch the wall, scaled down for perspective),
   * clings briefly, then lunges off the wall toward the visitor with a
   * weighty squash landing. Uses SVG attribute transform via rAF tween
   * because CSS rotate+transformOrigin on SVG <g> is unreliable.
   */
  function _dropFromCeiling(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }
    const inner = creature.innerEl || creature.el;
    const dir = _lungeDirection(visitor, creature); // +1 visitor right → right wall, -1 → left wall

    // Rotate so feet touch the wall and head points back into the room
    // (rotate -90 for the right wall, +90 for the left wall).
    const rest   = { tx: 0,         ty: 0,   rot: 0,         sx: 1,    sy: 1    };
    const wall   = { tx: 55 * dir,  ty: -12, rot: -90 * dir, sx: 0.7,  sy: 0.7  };
    const squash = { tx: 0,         ty: 0,   rot: 0,         sx: 1.15, sy: 0.8  };

    // Phase 1: scramble to the wall (rotate + shrink)
    _tweenTransform(inner, rest, wall, 450, _easeOut, () => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      // Phase 2: cling to the wall briefly
      setTimeout(() => {
        if (!_live(creature)) { if (onDone) onDone(); return; }
        // Phase 3: fast weighty lunge off the wall, ending in a squash
        _tweenTransform(inner, wall, squash, 300, _easeIn, () => {
          if (!_live(creature)) { if (onDone) onDone(); return; }
          // Phase 4: recover to rest + deliver the scare
          _tweenTransform(inner, squash, rest, 160, _easeOut, () => {
            if (_live(creature)) inner.removeAttribute('transform');
          });
          _payoffScare(visitor, creature, onDone, 400);
        });
      }, 250);
    });
  }

  /** Registered scenes keyed by action type. */
  const SCENES = {
    jumpOut:         _jumpOut,
    grabHat:         _grabHat,
    dropFromCeiling: _dropFromCeiling,
  };

  /** Does this action have a registered scene? */
  function has(action) {
    return !!SCENES[action];
  }

  /** Play the scene for an action. Falls through to onDone if unknown. */
  function play(action, visitor, creature, onDone) {
    const scene = SCENES[action];
    if (scene) {
      scene(visitor, creature, onDone);
    } else if (onDone) {
      onDone();
    }
  }

  return { play, has };
})();
