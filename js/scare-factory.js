/**
 * ScareFactory — composites creature + monster type + action into a deployed scare.
 * Single entry point for creature deployment. Manages room occupancy (1 per room).
 * Does NOT know about Picker — callers provide onExpire callbacks.
 */
const ScareFactory = (() => {
  const _deployed = {}; // roomId -> creature object

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

    // Apply monster type overlay (player-chosen or default)
    const monsterType = chosenMonsterType || CONFIG.defaultMonsterType[creatureType];
    MonsterTypes.apply(creature.el, monsterType);
    creature.monsterType = monsterType;
    creature.action = CONFIG.defaultAction[creatureType];

    _deployed[roomId] = creature;

    // Start lifetime timer
    creature.timer = setTimeout(() => {
      _expire(creature, onExpire);
    }, GameState.get('creatureLifetimeMs'));

    Audio.play('deploy');
    return creature;
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
   * Pure function — no side effects.
   *
   * @param {object} visitor - visitor object with fear/love/scareCount
   * @param {object} creature - creature object with type
   * @returns {{ result: string, points: number }}
   */
  function evaluate(visitor, creature) {
    if (visitor.fear === creature.type) {
      visitor.scareCount++;
      let mult = visitor.scareCount === 1 ? 1
        : visitor.scareCount === 2 ? CONFIG.scoring.combo2x
        : CONFIG.scoring.combo3x;
      // Monster combo bonus (only matters when monster lab is unlocked)
      const comboKey = `${creature.type}:${creature.monsterType}`;
      const isCombo = GameState.get('monsterLab') && CONFIG.monsterCombos[comboKey];
      if (isCombo) mult *= CONFIG.scoring.monsterComboBonus;
      return { result: 'scared', points: Math.round(CONFIG.scoring.scareBase * mult), combo: !!isCombo };
    }
    if (visitor.love === creature.type) {
      return { result: 'loved', points: 0, combo: false };
    }
    return { result: 'neutral', points: 0, combo: false };
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
