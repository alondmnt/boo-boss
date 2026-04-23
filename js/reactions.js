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
    // Pause creature expiry for the duration of the scene, so a lifetime
    // timer that fires mid-choreography doesn't remove the element from
    // under the animation. endScene runs after the caller's onDone.
    ScareFactory.beginScene(creature);
    const finish = () => {
      if (onDone) onDone();
      ScareFactory.endScene(creature);
    };

    if (GameState.get('directorsChair') && ActionScene.has(creature.action)) {
      ActionScene.play(creature.action, visitor, creature, finish);
      return;
    }

    // Default: scare pose + visitor jump + particles
    Creatures.setPose(creature, 'scare');
    setTimeout(() => Creatures.setPose(creature, 'idle'), 1000);

    Visitor.setState(visitor, 'scared');
    setTimeout(() => {
      Visitor.setState(visitor, 'walking');
      finish();
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
    // Same scene guard as scared(): suppress mid-hug expiry. The caller's
    // onDone clears the room and removes the creature, so endScene runs
    // after — it sees the creature is no longer deployed and drops the
    // pending thunk silently (no extra 'expire' audio, no double-remove).
    ScareFactory.beginScene(creature);
    ActionScene.disarm(creature);
    Visitor.setState(visitor, 'hugging');
    Creatures.setPose(creature, 'hug');

    Particles.hearts(creature.el);
    Audio.play('hug');

    setTimeout(() => {
      Visitor.setState(visitor, 'walking');
      if (onDone) onDone();
      ScareFactory.endScene(creature);
    }, 1200);
  }

  /** Bouncy happy exit walk (set state + flash). */
  function exitHappy(visitor) {
    Visitor.setState(visitor, 'exiting');
  }

  return { scared, hugged, exitHappy };
})();
