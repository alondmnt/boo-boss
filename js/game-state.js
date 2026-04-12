/**
 * GameState — runtime overlay on frozen CONFIG.
 * Tracks unlocked creatures, rooms, and upgrades. Consumers call get(key)
 * instead of reading CONFIG directly, so unlocks merge transparently.
 */
const GameState = (() => {
  const _arrays = {};
  const _booleans = {};
  const _objects = {};

  /** Add an item to an array store, skipping duplicates. */
  function _addUnique(key, item) {
    const arr = _arrays[key] || [];
    if (!arr.includes(item) && !CONFIG[key].includes(item)) arr.push(item);
    _arrays[key] = arr;
  }

  /** Unlock a room by key. */
  function _unlockRoom(roomId) {
    if (!_objects.rooms) _objects.rooms = {};
    _objects.rooms[roomId] = { locked: false };
  }

  /** Maps UNLOCK_TIERS keys to state mutations. */
  const TIER_ACTIONS = {
    dinosaur: () => { _addUnique('creatures', 'dinosaur'); },
    owl:      () => { _addUnique('creatures', 'owl'); },
    snake:    () => { _addUnique('creatures', 'snake'); },
    rat:      () => { _addUnique('creatures', 'rat'); },

    bathroom: () => { _unlockRoom('bathroom'); },
    attic:    () => { _unlockRoom('attic'); },
    tower:    () => { _unlockRoom('tower'); },

    fasterCooldowns: () => {
      // 25% reduction to creature lifetime (deploy -> expire cycle)
      _objects.creatureLifetimeMs = Math.round(CONFIG.creatureLifetimeMs * 0.75);
    },

    endlessMode: () => { _booleans.endlessMode = true; },

    monsterLab: () => { _booleans.monsterLab = true; },
    vampire:    () => { _addUnique('monsterTypes', 'vampire'); },
    astronaut:  () => { _addUnique('monsterTypes', 'astronaut'); },
    ghost:      () => { _addUnique('monsterTypes', 'ghost'); },
  };

  /**
   * Merged view: frozen CONFIG + runtime unlocks.
   * Arrays are concatenated, objects are shallow-merged (one level deep for
   * rooms so each room's properties merge individually), booleans are direct.
   */
  function get(key) {
    if (key in _booleans) return _booleans[key];
    if (key in _objects) {
      const override = _objects[key];
      const base = CONFIG[key];
      // Scalar override (numbers, strings): return directly
      if (typeof override !== 'object' || override === null) return override;
      if (base && typeof base === 'object' && !Array.isArray(base)) {
        // Deep merge one level — needed for rooms (each room is an object)
        const merged = {};
        for (const k of Object.keys(base)) {
          merged[k] = override[k]
            ? { ...base[k], ...override[k] }
            : base[k];
        }
        return merged;
      }
      return { ...base, ...override };
    }
    if (key in _arrays) return [...CONFIG[key], ..._arrays[key]];
    return CONFIG[key];
  }

  /**
   * Full track route — the train always traverses all rooms (including locked).
   * Used by Train for the track path.
   */
  function getTrackRoute() {
    return CONFIG.fullTrackRoute;
  }

  /**
   * Track stops — only unlocked rooms where visitors can disembark.
   * Used by Wave for visitor distribution.
   */
  function getTrackStops() {
    const rooms = get('rooms');
    return CONFIG.fullTrackRoute.filter(r => rooms[r] && !rooms[r].locked);
  }

  /** Apply a single tier's effects via TIER_ACTIONS or generic array merge. */
  function applyTier(tier) {
    const action = TIER_ACTIONS[tier.key];
    if (action) { action(); return; }
    // Generic array merge fallback (if tier has items)
    if (!tier.items || !tier.items.length) return;
    if (!Array.isArray(CONFIG[tier.key])) return;
    const existing = _arrays[tier.key] || [];
    for (const item of tier.items) {
      if (!CONFIG[tier.key].includes(item) && !existing.includes(item)) {
        existing.push(item);
      }
    }
    _arrays[tier.key] = existing;
  }

  /** Clear all runtime state (on full progress reset). */
  function reset() {
    for (const k of Object.keys(_arrays)) delete _arrays[k];
    for (const k of Object.keys(_booleans)) delete _booleans[k];
    for (const k of Object.keys(_objects)) delete _objects[k];
  }

  return { get, getTrackRoute, getTrackStops, applyTier, reset };
})();
