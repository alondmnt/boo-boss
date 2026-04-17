/**
 * Reactions — visitor + creature animation helpers via CSS class toggles.
 * Each reaction orchestrates pose changes, audio, and particle effects.
 * Does NOT know about ScareFactory or Picker — callers provide onDone callbacks.
 */
const Reactions = (() => {
  /**
   * Add a CSS class to an element, auto-remove after duration.
   * Core pattern from car-doctor.
   */
  function _flash(el, cls, duration) {
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), duration);
  }

  /**
   * Play the scared reaction sequence.
   * Creature performs its scare action, visitor jumps, spooky particles burst.
   *
   * @param {object} visitor - visitor object
   * @param {object} creature - creature object
   * @param {function} [onDone] - called when animation sequence completes
   */
  function scared(visitor, creature, onDone) {
    // Creature: trigger action animation on inner wrapper (not outer positioned <g>)
    const actionCls = Actions.getKeyframes(creature.action);
    const actionDur = Actions.getDuration(creature.action);
    _flash(creature.innerEl || creature.el, actionCls, actionDur);
    Creatures.setPose(creature, 'scare');
    setTimeout(() => Creatures.setPose(creature, 'idle'), 1000);

    // Visitor: scared state
    Visitor.setState(visitor, 'scared');
    setTimeout(() => {
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, 800);

    Audio.play('scare');
    Particles.spookyBurst(visitor.el);
  }

  /**
   * Play the hug reaction sequence.
   * Visitor hugs creature, hearts float up, creature disappears.
   *
   * @param {object} visitor - visitor object
   * @param {object} creature - creature object
   * @param {function} [onDone] - called after creature removal (caller handles cleanup)
   */
  function hugged(visitor, creature, onDone) {
    Visitor.setState(visitor, 'hugging');
    Creatures.setPose(creature, 'hug');

    Particles.hearts(creature.el);
    Audio.play('hug');

    setTimeout(() => {
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, 1200);
  }

  /** Brief meh reaction — visitor walks through unimpressed. */
  function neutral(visitor) {
    Particles.scoreFloat(visitor.el, '😐', 'particle--hug-float');
  }

  /** Bouncy happy exit walk (set state + flash). */
  function exitHappy(visitor) {
    Visitor.setState(visitor, 'exiting');
  }

  return { scared, hugged, neutral, exitHappy };
})();
