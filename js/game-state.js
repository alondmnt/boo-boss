/**
 * GameState — runtime overlay on frozen CONFIG.
 * Tracks unlocked creatures, rooms, and upgrades. Consumers call get(key)
 * instead of reading CONFIG directly, so unlocks merge transparently.
 */
const GameState = (() => {
  const _arrays = {};
  const _booleans = {};
  const _objects = {};

  // Rollercoaster (expansion 3) — per-player track customisation.
  // `_segmentOverrides`: missing key ⇒ default procedural curve (NOT "straight piece").
  // A key mapping to 'straight' or another piece ⇒ that piece's generator runs.
  const _segmentOverrides = {};
  const _closedRooms = new Set();
  // Transient mid-wave room blocks (sign-holding creatures). Distinct from
  // _closedRooms (which is the player's persistent night-closure choice).
  // Not persisted; always empty on load.
  const _blockedRooms = new Set();
  const _malfunctions = {};
  let _trainSkin = 'default';
  // Skins the player has bought (default always included). Buying is one-shot;
  // switching between owned skins is free.
  const _ownedSkins = new Set(['default']);
  // Player-customised visit sequence. null ⇒ use CONFIG.fullTrackRoute as-is.
  // When non-null, it's a permutation of CONFIG.fullTrackRoute.
  let _customRoute = null;

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

    fasterCooldowns: () => { _booleans.fasterCooldowns = true; },

    monsterLab: () => { _booleans.monsterLab = true; },
    vampire:    () => { _addUnique('monsterTypes', 'vampire'); },
    astronaut:  () => { _addUnique('monsterTypes', 'astronaut'); },
    ghost:      () => { _addUnique('monsterTypes', 'ghost'); },

    directorsChair: () => { _booleans.directorsChair = true; },
    swarm:          () => { _addUnique('actions', 'swarm'); },
    peekABoo:       () => { _addUnique('actions', 'peekABoo'); },
    chase:          () => { _addUnique('actions', 'chase'); },
    roomBlock:      () => { _addUnique('actions', 'blockRoom'); },

    trackEditor:         () => { _booleans.trackEditor = true; },
    trackPieceHill:      () => { _booleans.trackPieceHill = true; },
    trackPieceTunnel:    () => { _booleans.trackPieceTunnel = true; },
    trackPieceLoop:      () => { _booleans.trackPieceLoop = true; },
    trackPieceCorkscrew: () => { _booleans.trackPieceCorkscrew = true; },
    trainSkins:          () => { _booleans.trainSkins = true; },
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
   * Returns a player-customised permutation when one exists, else the CONFIG default.
   */
  function getTrackRoute() {
    return _customRoute || CONFIG.fullTrackRoute;
  }

  /** Replace the custom route wholesale. Pass null to revert to CONFIG default. */
  function setCustomRoute(route) {
    if (!route || !Array.isArray(route)) { _customRoute = null; return; }
    _customRoute = route.slice();
  }

  /**
   * Swap a room with its neighbour in the visit sequence.
   * direction: -1 moves it earlier, +1 moves it later.
   * Returns true if the swap happened, false if it was out of bounds.
   */
  function swapRoomInRoute(roomId, direction) {
    const route = (_customRoute || CONFIG.fullTrackRoute).slice();
    const idx = route.indexOf(roomId);
    if (idx === -1) return false;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= route.length) return false;
    [route[idx], route[newIdx]] = [route[newIdx], route[idx]];
    _customRoute = route;
    return true;
  }

  /** Current position of a room in the visit sequence (0-indexed). */
  function getRoomRouteIndex(roomId) {
    return getTrackRoute().indexOf(roomId);
  }

  /**
   * Track stops — only unlocked rooms where visitors can disembark.
   * Closed-tonight rooms (editor toggle) are also filtered out.
   * Used by Wave for visitor distribution.
   */
  function getTrackStops() {
    const rooms = get('rooms');
    return CONFIG.fullTrackRoute.filter(r =>
      rooms[r] && !rooms[r].locked && !_closedRooms.has(r)
    );
  }

  /* ─── Rollercoaster accessors ─── */

  /** Segment ID format: "fromRoom→toRoom" (arrow char). */
  function _segId(fromRoom, toRoom) { return `${fromRoom}→${toRoom}`; }

  function getSegmentOverride(segId) {
    return _segmentOverrides[segId] || null;
  }

  /** Set a piece key for a segment. Pass null to clear (revert to default curve). */
  function setSegmentOverride(segId, pieceKey) {
    if (pieceKey == null) delete _segmentOverrides[segId];
    else _segmentOverrides[segId] = pieceKey;
  }

  function getAllSegmentOverrides() { return { ..._segmentOverrides }; }

  function getClosedRooms() { return new Set(_closedRooms); }

  function isRoomClosed(roomId) { return _closedRooms.has(roomId); }

  /** Toggle a room's closed-tonight state. Returns the new state. */
  function toggleRoomClosed(roomId) {
    if (_closedRooms.has(roomId)) _closedRooms.delete(roomId);
    else _closedRooms.add(roomId);
    return _closedRooms.has(roomId);
  }

  /* ─── Mid-wave room blocks (sign-holding creatures) ─── */

  function isRoomBlocked(roomId) { return _blockedRooms.has(roomId); }
  function blockRoom(roomId) { _blockedRooms.add(roomId); }
  function unblockRoom(roomId) { _blockedRooms.delete(roomId); }

  function getTrainSkin() { return _trainSkin; }
  function setTrainSkin(key) { _trainSkin = key || 'default'; }

  function hasOwnedSkin(key) { return _ownedSkins.has(key); }
  function markSkinOwned(key) { _ownedSkins.add(key); }
  function getOwnedSkins() { return new Set(_ownedSkins); }

  function getMalfunctions() { return { ..._malfunctions }; }
  function isSegmentBroken(segId) { return !!_malfunctions[segId]; }
  function setMalfunction(segId, broken) {
    if (broken) _malfunctions[segId] = true;
    else delete _malfunctions[segId];
  }

  /** Rehydrate rollercoaster state from a persisted snapshot. */
  function loadRollercoasterState(snapshot) {
    if (!snapshot) return;
    for (const k of Object.keys(_segmentOverrides)) delete _segmentOverrides[k];
    if (snapshot.segmentOverrides) {
      for (const [k, v] of Object.entries(snapshot.segmentOverrides)) {
        _segmentOverrides[k] = v;
      }
    }
    _closedRooms.clear();
    if (Array.isArray(snapshot.closedRooms)) {
      for (const r of snapshot.closedRooms) _closedRooms.add(r);
    }
    for (const k of Object.keys(_malfunctions)) delete _malfunctions[k];
    if (snapshot.malfunctions) {
      for (const [k, v] of Object.entries(snapshot.malfunctions)) {
        if (v) _malfunctions[k] = true;
      }
    }
    _trainSkin = snapshot.trainSkin || 'default';
    _ownedSkins.clear();
    _ownedSkins.add('default');
    if (Array.isArray(snapshot.ownedSkins)) {
      for (const s of snapshot.ownedSkins) _ownedSkins.add(s);
    }
    // Legacy 'wooden' was the original mine-cart SVG mis-labelled with a
    // shopping-cart emoji. Renamed to 'mine' (now in the spooky group);
    // anyone who paid for it keeps the visual they actually bought.
    if (_ownedSkins.has('wooden')) {
      _ownedSkins.delete('wooden');
      _ownedSkins.add('mine');
    }
    if (_trainSkin === 'wooden') _trainSkin = 'mine';
    // 'shoe' (old leather boot) replaced by 'sneaker'.
    if (_ownedSkins.has('shoe')) {
      _ownedSkins.delete('shoe');
      _ownedSkins.add('sneaker');
    }
    if (_trainSkin === 'shoe') _trainSkin = 'sneaker';
    // If we loaded a current skin, mark it owned even if the snapshot's
    // ownedSkins list is stale (from before ownership tracking).
    _ownedSkins.add(_trainSkin);
    // Only accept a custom route if it's a full permutation of CONFIG.fullTrackRoute
    // (defends against corrupted/outdated saves).
    if (Array.isArray(snapshot.customRoute) &&
        snapshot.customRoute.length === CONFIG.fullTrackRoute.length &&
        snapshot.customRoute.every(r => CONFIG.fullTrackRoute.includes(r))) {
      _customRoute = snapshot.customRoute.slice();
    } else {
      _customRoute = null;
    }
  }

  /** Snapshot for persistence. */
  function dumpRollercoasterState() {
    return {
      segmentOverrides: { ..._segmentOverrides },
      closedRooms: [..._closedRooms],
      malfunctions: { ..._malfunctions },
      trainSkin: _trainSkin,
      ownedSkins: [..._ownedSkins],
      customRoute: _customRoute ? _customRoute.slice() : null,
    };
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
    for (const k of Object.keys(_segmentOverrides)) delete _segmentOverrides[k];
    _closedRooms.clear();
    _blockedRooms.clear();
    for (const k of Object.keys(_malfunctions)) delete _malfunctions[k];
    _trainSkin = 'default';
    _ownedSkins.clear();
    _ownedSkins.add('default');
    _customRoute = null;
  }

  return {
    get, getTrackRoute, getTrackStops, applyTier, reset,
    getSegmentOverride, setSegmentOverride, getAllSegmentOverrides,
    getClosedRooms, isRoomClosed, toggleRoomClosed,
    isRoomBlocked, blockRoom, unblockRoom,
    getTrainSkin, setTrainSkin, hasOwnedSkin, markSkinOwned, getOwnedSkins,
    getMalfunctions, isSegmentBroken, setMalfunction,
    setCustomRoute, swapRoomInRoute, getRoomRouteIndex,
    loadRollercoasterState, dumpRollercoasterState,
    _segId,
  };
})();
