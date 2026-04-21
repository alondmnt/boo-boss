/**
 * Reactions — visitor + creature animation helpers via CSS class toggles.
 * Each reaction orchestrates pose changes, audio, and particle effects.
 * Does NOT know about ScareFactory or Picker — callers provide onDone callbacks.
 */
const Reactions = (() => {
  /**
   * Play the scared reaction sequence.
   * When Director's Chair is unlocked and the creature's action has a
   * registered ActionScene, delegate to it for a scripted mini-scene.
   * Otherwise run the default: scare pose + visitor scared + particles.
   *
   * @param {object} visitor - visitor object
   * @param {object} creature - creature object
   * @param {function} [onDone] - called when animation sequence completes
   */
  function scared(visitor, creature, onDone) {
    if (GameState.get('directorsChair') && ActionScene.has(creature.action)) {
      ActionScene.play(creature.action, visitor, creature, onDone);
      return;
    }

    // Default: scare pose + visitor jump + particles
    Creatures.setPose(creature, 'scare');
    setTimeout(() => Creatures.setPose(creature, 'idle'), 1000);

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
    ActionScene.disarm(creature);
    Visitor.setState(visitor, 'hugging');
    Creatures.setPose(creature, 'hug');

    Particles.hearts(creature.el);
    Audio.play('hug');

    setTimeout(() => {
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
    }, 1200);
  }

  /** Bouncy happy exit walk (set state + flash). */
  function exitHappy(visitor) {
    Visitor.setState(visitor, 'exiting');
  }

  return { scared, hugged, exitHappy };
})();
