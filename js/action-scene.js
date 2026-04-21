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
    const inner = creature.innerEl || creature.el;

    // Disappear fully, remove the embarrassed face.
    inner.style.transition = 'opacity 0.2s linear';
    inner.style.opacity = '0';
    _removeEmbarrassedFace(creature);

    setTimeout(() => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      // Snap back with scale bounce.
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
    const aim = _aimAtHat(visitor, creature);
    // Clamp the stick length so an odd position doesn't produce a stub or a tree-trunk.
    const length = Math.max(20, Math.min(80, aim.distance - 4));
    const { outer, inner } = _makeGrabber(creature, aim.angleDeg, length);
    creature.el.appendChild(outer);

    const retracted = { tx: 0, ty: 0, rot: 0, sx: 0, sy: 1 };
    const extended  = { tx: 0, ty: 0, rot: 0, sx: 1, sy: 1 };

    // Phase 1: extend toward visitor
    _tweenTransform(inner, retracted, extended, 350, _easeOut, () => {
      if (!_live(creature)) {
        if (outer.parentNode) outer.parentNode.removeChild(outer);
        if (onDone) onDone();
        return;
      }
      // Phase 2: snatch the hat at peak reach
      Visitor.removeHat(visitor);
      // Phase 3: retract (slightly snappier)
      _tweenTransform(inner, extended, retracted, 260, _easeIn, () => {
        if (outer.parentNode) outer.parentNode.removeChild(outer);
        if (!_live(creature)) { if (onDone) onDone(); return; }
        // Phase 4: payoff scare
        _payoffScare(visitor, creature, onDone, 400);
      });
    });
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
    _tweenTransform(inner, _DROP_REST, _dropWall(dir), 450, _easeOut);
    return 450;
  }

  /**
   * Shared lunge → squash → rest tail used by both the armed and cold paths.
   * Payoff scare runs concurrently with the squash-to-rest tween so the
   * scare pose snaps in as the creature lands.
   */
  function _dropFromCeilingLunge(visitor, creature, from, onDone) {
    const inner = creature.innerEl || creature.el;
    _tweenTransform(inner, from, _DROP_SQUASH, 300, _easeIn, () => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      _tweenTransform(inner, _DROP_SQUASH, _DROP_REST, 160, _easeOut, () => {
        if (_live(creature)) inner.removeAttribute('transform');
      });
      _payoffScare(visitor, creature, onDone, 400);
    });
  }

  /**
   * dropFromCeiling — payoff: lunge off the wall with a weighty squash.
   * Armed path lunges directly from the pre-staged right wall. Cold path
   * scrambles to the wall nearest the visitor, clings briefly, then lunges.
   */
  function _dropFromCeilingPayoff(visitor, creature, onDone) {
    if (!_live(creature)) { if (onDone) onDone(); return; }

    if (creature.armed) {
      _dropFromCeilingLunge(visitor, creature, _dropWall(creature._dropDir || 1), onDone);
      return;
    }

    const inner = creature.innerEl || creature.el;
    const wall = _dropWall(_lungeDirection(visitor, creature));

    _tweenTransform(inner, _DROP_REST, wall, 450, _easeOut, () => {
      if (!_live(creature)) { if (onDone) onDone(); return; }
      setTimeout(() => {
        if (!_live(creature)) { if (onDone) onDone(); return; }
        _dropFromCeilingLunge(visitor, creature, wall, onDone);
      }, 250);
    });
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

    // Fan out
    for (const { el, dx, dy } of clones) {
      el.style.opacity = '0.55';
      _tweenTransform(el,
        { tx: base.x,      ty: base.y,      rot: 0, sx: 1,   sy: 1 },
        { tx: base.x + dx, ty: base.y + dy, rot: 0, sx: 0.9, sy: 0.9 },
        220, _easeOut);
    }

    // Scare payoff runs concurrently with the swarm visual
    Visitor.setState(visitor, 'scared');
    Audio.play('scare');
    Particles.spookyBurst(visitor.el);

    // Collapse back after the hold
    setTimeout(() => {
      for (const { el, dx, dy } of clones) {
        if (!el.isConnected) continue;
        el.style.opacity = '0';
        _tweenTransform(el,
          { tx: base.x + dx, ty: base.y + dy, rot: 0, sx: 0.9, sy: 0.9 },
          { tx: base.x,      ty: base.y,      rot: 0, sx: 1,   sy: 1 },
          180, _easeIn);
      }
    }, 380);

    setTimeout(() => {
      for (const { el } of clones) {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
      if (_live(creature)) Creatures.setPose(creature, 'idle');
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, 640);
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
  };

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
    _removeEmbarrassedFace(creature);
    const inner = creature.innerEl || creature.el;
    if (inner && inner.style) {
      inner.style.transition = '';
      inner.style.transform = '';
      inner.style.transformOrigin = '';
      inner.style.opacity = '';
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

    const finish = () => {
      creature.armed = false;
      if (onDone) onDone();
      // Re-arm for the next visitor, after a short breath so the creature
      // reads as "back to normal" before the setup begins again.
      if (scene.arm && _live(creature)) {
        setTimeout(() => arm(creature), 150);
      }
    };

    scene.payoff(visitor, creature, finish);
  }

  return { play, has, arm, disarm };
})();
