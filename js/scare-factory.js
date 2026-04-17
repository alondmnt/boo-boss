/**
 * ScareFactory — composites creature + monster type + action into a deployed scare.
 * Single entry point for creature deployment. Manages room occupancy (1 per room).
 * Does NOT know about Picker — callers provide onExpire callbacks.
 */
const ScareFactory = (() => {
  const _deployed = {}; // roomId -> creature object

  /** Look up the active monster type effect, or null if lab not unlocked. */
  function _getEffect(monsterType) {
    return GameState.get('monsterLab') ? CONFIG.monsterEffects[monsterType] || null : null;
  }

  /**
   * Deploy a creature to a room with a monster type and action.
   * Monster type defaults to CONFIG.defaultMonsterType if not provided.
   *
   * @param {string} creatureType - creature type key
   * @param {string} roomId - room to deploy into
   * @param {function} [onExpire] - called when creature's lifetime ends
   * @param {string} [chosenMonsterType] - monster type (if monster lab unlocked)
   * @returns {object|null} creature object or null if room occupied
   */
  function deploy(creatureType, roomId, onExpire, chosenMonsterType) {
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
    creature.action = CONFIG.defaultAction[creatureType];

    _deployed[roomId] = creature;

    // Start lifetime timer (per-creature cooldown, reduced if fasterCooldowns unlocked)
    let lifetime = CONFIG.creatureCooldowns[creatureType] || CONFIG.creatureLifetimeMs;
    if (GameState.get('fasterCooldowns')) lifetime = Math.round(lifetime * 0.75);

    // Monster type effects on deployment
    const effect = _getEffect(monsterType);
    if (effect && effect.type === 'lifetimeBonus') {
      lifetime = Math.round(lifetime * (1 + effect.value));
    }
    creature.timer = setTimeout(() => {
      _expire(creature, onExpire);
    }, lifetime);

    // Show effect label above creature (only with Monster Lab)
    if (effect) {
      _addEffectLabel(creature.el, effect.label, creatureType);
    }

    Audio.play('deploy');
    return creature;
  }

  /** Add a floating effect label above a creature SVG, positioned via anchors. */
  function _addEffectLabel(creatureEl, text, creatureType) {
    const NS = 'http://www.w3.org/2000/svg';
    const anchors = Creatures.getAnchors(creatureType);
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(anchors.headTop.y - 8));
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
   * Evaluate what happens when a visitor encounters a deployed creature.
   *
   * @param {object} visitor - visitor object with fear/love/scareCount
   * @param {object} creature - creature object with type
   * @returns {{ result: string, points: number }}
   */
  function evaluate(visitor, creature) {
    const effect = _getEffect(creature.monsterType);

    if (visitor.fear === creature.type) {
      visitor.scareCount++;
      let mult = visitor.scareCount === 1 ? 1
        : visitor.scareCount === 2 ? CONFIG.scoring.combo2x
        : CONFIG.scoring.combo3x;
      // Astronaut: double combo multiplier on 2nd+ scares
      if (effect && effect.type === 'comboBonus' && visitor.scareCount >= 2) {
        mult *= effect.value;
      }
      let points = CONFIG.scoring.scareBase * mult;
      // Zombie: flat scare bonus
      if (effect && effect.type === 'scareBonus') {
        points *= (1 + effect.value);
      }
      return { result: 'scared', points: Math.round(points) };
    }
    if (visitor.love === creature.type) {
      // Ghost: hug immune
      if (effect && effect.type === 'hugImmune') {
        return { result: 'ghostBlock', points: 0 };
      }
      return { result: 'loved', points: 0 };
    }
    return { result: 'neutral', points: 0 };
  }

  /** Check if a room has a deployed creature. */
  function isOccupied(roomId) { return !!_deployed[roomId]; }

  /** Return the deployed creature in a room, or null. */
  function getDeployed(roomId) { return _deployed[roomId] || null; }

  /** Clear the room occupancy record (after removal or hug). */
  function clearRoom(roomId) { delete _deployed[roomId]; }

  /** Clear all deployed creatures (on wave/game reset). */
  function clearAll() {
    for (const roomId of Object.keys(_deployed)) {
      const creature = _deployed[roomId];
      Creatures.remove(creature);
      delete _deployed[roomId];
    }
  }

  return { deploy, evaluate, isOccupied, getDeployed, clearRoom, clearAll };
})();
