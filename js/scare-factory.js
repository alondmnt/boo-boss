/**
 * ScareFactory — composites creature + monster type + action into a deployed scare.
 * Single entry point for creature deployment. Manages room occupancy (1 per room).
 * Does NOT know about Picker — callers provide onExpire callbacks.
 */
const ScareFactory = (() => {
  const _deployed = {}; // roomId -> creature object
  let _onChange = null; // optional listener notified after occupancy changes

  /** Look up the active monster type effect, or null if lab not unlocked. */
  function _getEffect(monsterType) {
    return GameState.get('monsterLab') ? CONFIG.monsterEffects[monsterType] || null : null;
  }

  /**
   * Called after any mutation to _deployed: toggles body.crowd--many for
   * CSS (pauses idle animations under load) and notifies a single
   * subscriber (the Picker while in room-targeting mode) so the
   * targetable-room highlight stays in sync with live occupancy.
   */
  function _onDeployChange() {
    const count = Object.keys(_deployed).length;
    document.body.classList.toggle('crowd--many', count >= 2);
    if (_onChange) _onChange();
  }

  /**
   * Register a single listener fired after any deploy/clear. Pass null
   * to unsubscribe. Single-slot by design — only the Picker uses this,
   * and only while the player is choosing a room.
   */
  function setChangeListener(cb) { _onChange = cb; }

  /**
   * Deploy a creature to a room with a monster type and action.
   * Monster type and action default to CONFIG defaults when not provided.
   *
   * @param {string} creatureType - creature type key
   * @param {string} roomId - room to deploy into
   * @param {function} [onExpire] - called when creature's lifetime ends
   * @param {string} [chosenMonsterType] - monster type (if monster lab unlocked)
   * @param {string} [chosenAction] - action (if director's chair unlocked)
   * @returns {object|null} creature object or null if room occupied
   */
  function deploy(creatureType, roomId, onExpire, chosenMonsterType, chosenAction) {
    if (_deployed[roomId]) return null;

    // Only one instance of each creature type at a time
    for (const c of Object.values(_deployed)) {
      if (c.type === creatureType) return null;
    }

    const creature = Creatures.create(creatureType, roomId);
    if (!creature) return null;

    // Apply monster type overlay only after Monster Lab is unlocked
    const monsterType = chosenMonsterType || CONFIG.defaultMonsterType[creatureType];
    if (GameState.get('monsterLab')) {
      MonsterTypes.apply(creature.el, monsterType, creatureType);
    }
    creature.monsterType = monsterType;
    creature.action = chosenAction || CONFIG.defaultAction[creatureType];

    _deployed[roomId] = creature;
    _onDeployChange();

    // Start lifetime timer (per-creature cooldown, reduced if fasterCooldowns unlocked)
    let lifetime = CONFIG.creatureCooldowns[creatureType] || CONFIG.creatureLifetimeMs;
    if (GameState.get('fasterCooldowns')) lifetime = Math.round(lifetime * 0.75);

    // Monster type effects on deployment (witch extends, skeleton shortens)
    const effect = _getEffect(monsterType);
    if (effect && effect.type === 'lifetimeBonus') {
      lifetime = Math.round(lifetime * (1 + effect.value));
    }
    creature.lifetime = lifetime;
    creature.timer = setTimeout(() => {
      // Defer expiry while a scene (scare/hug) is playing to avoid yanking
      // the creature mid-animation. endScene() flushes the pending thunk.
      // Assumes one scene per creature at a time (see review point 4).
      if (creature._sceneActive) {
        creature._expirePending = () => _expire(creature, onExpire);
      } else {
        _expire(creature, onExpire);
      }
    }, lifetime);

    // Show effect label above creature (only with Monster Lab)
    if (effect) {
      _addEffectLabel(creature.el, effect.label, creatureType);
    }

    Audio.play('deploy');

    // Pre-stage the action in the idle room, so the creature is visibly
    // primed before any visitor arrives. No-op if the action has no arm.
    ActionScene.arm(creature);

    // Room-block action: start the timed block on deploy. Reuses
    // lifetimeBonus (witch +25%, skeleton −25%) so type choice modulates
    // duration. Cleanup runs through clearRoom (idempotent).
    if (creature.action === 'block') {
      const blockEffect = CONFIG.actionEffects.block;
      const baseMs = (blockEffect && blockEffect.value) || 6000;
      const lifetimeMod = effect && effect.type === 'lifetimeBonus' ? effect.value : 0;
      const blockMs = Math.round(baseMs * (1 + lifetimeMod));
      GameState.blockRoom(roomId);
      House.setRoomVisualBlocked(roomId, true);
      creature._blockTimeout = setTimeout(() => {
        creature._blockTimeout = null;
        GameState.unblockRoom(roomId);
        House.setRoomVisualBlocked(roomId, false);
      }, blockMs);
    }

    return creature;
  }

  /** Add a floating effect label near a creature SVG, positioned via anchors. */
  function _addEffectLabel(creatureEl, text, creatureType) {
    const NS = 'http://www.w3.org/2000/svg';
    const anchors = Creatures.getAnchors(creatureType);
    // Bat hangs upside down - label goes below the body instead of above the head
    const labelY = creatureType === 'bat'
      ? anchors.bodyCenter.y + 10
      : anchors.headTop.y - 8;
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(labelY));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '6');
    label.setAttribute('fill', '#ffd700');
    label.setAttribute('opacity', '0.85');
    label.classList.add('creature__effect-label');
    label.textContent = text;
    creatureEl.appendChild(label);
  }

  /** Internal: expire a creature (lifetime ended). */
  function _expire(creature, onExpire) {
    clearRoom(creature.roomId);
    Creatures.remove(creature);
    Audio.play('expire');
    if (onExpire) onExpire(creature);
  }

  /**
   * Mark a creature as playing a scene (scare or hug). While active, a
   * lifetime-timer firing sets a deferred expire thunk instead of expiring
   * immediately. Callers must pair with endScene().
   */
  function beginScene(creature) {
    if (!creature) return;
    creature._sceneActive = true;
  }

  /**
   * Clear the scene flag and flush any pending expire. If the creature is
   * no longer in _deployed (the hug path cleared it in the caller's onDone),
   * drop the pending thunk silently — no double-remove, no extra expire audio.
   */
  function endScene(creature) {
    if (!creature) return;
    creature._sceneActive = false;
    const pending = creature._expirePending;
    if (pending && _deployed[creature.roomId] === creature) {
      creature._expirePending = null;
      pending();
    } else {
      creature._expirePending = null;
    }
  }

  /**
   * Classify what happens when a visitor encounters a deployed creature.
   * Pure: does not mutate the visitor. The caller bumps visitor.scareCount
   * on the 'scared' branch so combo math stays honest for any repeat calls
   * (e.g. preview, debug) without side effects leaking.
   *
   * @param {object} visitor - visitor object with fear/love/scareCount
   * @param {object} creature - creature object with type
   * @returns {{ result: string, points: number }}
   */
  function evaluate(visitor, creature) {
    const effect = _getEffect(creature.monsterType);

    if (visitor.fear === creature.type) {
      // Forward-looking: this scare will be the Nth for the visitor.
      const scareNumber = visitor.scareCount + 1;
      // Astronaut: combo +1 (each scare counts one level higher)
      const comboLevel = scareNumber +
        (effect && effect.type === 'comboPlus' ? effect.value : 0);
      let mult = comboLevel <= 1 ? 1
        : comboLevel === 2 ? CONFIG.scoring.combo2x
        : CONFIG.scoring.combo3x;
      let points = CONFIG.scoring.scareBase * mult;
      // Zombie: flat scare bonus
      if (effect && effect.type === 'scareBonus') {
        points *= (1 + effect.value);
      }
      return { result: 'scared', points: Math.round(points) };
    }
    if (visitor.love === creature.type) {
      // Vampire: resist hug + scare the visitor
      if (effect && effect.type === 'hugResist' && Math.random() < effect.value) {
        return { result: 'hugResist', points: 0 };
      }
      // Ghost: block hug silently (rolled fresh each encounter)
      if (effect && effect.type === 'hugBlock' && Math.random() < effect.value) {
        return { result: 'hugBlock', points: 0 };
      }
      return { result: 'loved', points: 0 };
    }
    return { result: 'neutral', points: 0 };
  }

  /** Check if a room has a deployed creature. */
  function isOccupied(roomId) { return !!_deployed[roomId]; }

  /** Return the deployed creature in a room, or null. */
  function getDeployed(roomId) { return _deployed[roomId] || null; }

  /** Clear the room occupancy record (after removal or hug). Also cleans up
   *  any pending block timer + room-block state owned by this creature, so
   *  hug-removal doesn't leave a ghost block behind. */
  function clearRoom(roomId) {
    const creature = _deployed[roomId];
    if (creature && creature._blockTimeout) {
      clearTimeout(creature._blockTimeout);
      creature._blockTimeout = null;
      GameState.unblockRoom(roomId);
      House.setRoomVisualBlocked(roomId, false);
    }
    delete _deployed[roomId];
    _onDeployChange();
  }

  /** Clear all deployed creatures (on wave/game reset). */
  function clearAll() {
    for (const roomId of Object.keys(_deployed)) {
      const creature = _deployed[roomId];
      if (creature._blockTimeout) {
        clearTimeout(creature._blockTimeout);
        GameState.unblockRoom(roomId);
        House.setRoomVisualBlocked(roomId, false);
      }
      Creatures.remove(creature);
      delete _deployed[roomId];
    }
    _onDeployChange();
  }

  return { deploy, evaluate, isOccupied, getDeployed, clearRoom, clearAll, beginScene, endScene, setChangeListener };
})();
