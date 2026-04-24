/**
 * Picker — multi-stage pick UI for deploying scare creatures.
 * Without monster lab: 2-stage (creature -> room).
 * With monster lab: 3-stage (creature -> monster type -> room).
 * With director's chair: 4-stage (creature -> monster type -> action -> room).
 */
const Picker = (() => {
  let _panel = null;
  let _monsterPanel = null;
  let _actionPanel = null;
  let _selectedType = null;
  let _selectedMonster = null;
  let _selectedAction = null;
  // Sticky across deploys: the last monster/action actually deployed. Pre-fills
  // the picker on the next creature tap so repeat deploys collapse to
  // creature-tap → room-tap. Cleared implicitly if the value falls out of the
  // unlocked roster (validated at pre-fill time).
  let _lastMonster = null;
  let _lastAction = null;
  let _roomClickHandlers = [];
  let _onDeploy = null;
  const _onCooldown = new Set();

  /** Emoji icons from CONFIG for panel buttons. */
  const CREATURE_ICONS = CONFIG.creatureIcons;
  const MONSTER_ICONS = CONFIG.monsterIcons;
  const ACTION_ICONS = CONFIG.actionIcons;

  /** Humanise a camelCase string for aria-label / hover tooltip. */
  function _humanise(s) {
    return s.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  }

  /** Bind to the scare panel container. */
  function init(container) {
    _panel = container;
    // Sub-panels stack above the main panel: action on top, then monster, then creatures.
    _actionPanel = document.createElement('div');
    _actionPanel.id = 'action-panel';
    _actionPanel.style.display = 'none';
    _panel.parentNode.insertBefore(_actionPanel, _panel);

    _monsterPanel = document.createElement('div');
    _monsterPanel.id = 'monster-panel';
    _monsterPanel.style.display = 'none';
    _panel.parentNode.insertBefore(_monsterPanel, _panel);
  }

  /**
   * Set the deploy handler called when a creature is deployed.
   * @param {function} handler - (creatureType, roomId, monsterType, action) => void
   */
  function setDeployHandler(handler) {
    _onDeploy = handler;
  }

  /**
   * Populate the scare panel with one button per unlocked creature.
   * Called on init and after creature unlocks.
   */
  function render() {
    if (!_panel) return;
    _onCooldown.clear();
    _panel.innerHTML = '';
    const creatures = GameState.get('creatures');

    for (const type of creatures) {
      const slot = document.createElement('div');
      slot.className = 'scare-panel__slot';
      slot.dataset.creature = type;
      slot.setAttribute('aria-label', type);
      slot.setAttribute('title', type);
      slot.innerHTML = `
        <div class="scare-panel__icon">${CREATURE_ICONS[type] || '?'}</div>
        <div class="scare-panel__cooldown"></div>
      `;
      slot.addEventListener('click', () => _onSlotTap(type));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); _onSlotTap(type); });
      _panel.appendChild(slot);
    }
  }

  /**
   * Stage 1: player taps a creature slot.
   *
   * Changing the creature preserves any monster/action already picked in
   * this picker session, so the player can swap one axis without re-clicking
   * the others. Tapping the already-selected creature is the cancel gesture
   * and does a full cleanup.
   */
  function _onSlotTap(type) {
    if (_onCooldown.has(type)) return;
    const slot = _getSlot(type);
    if (!slot) return;

    if (_selectedType === type) {
      cleanup();
      return;
    }

    _selectedType = type;
    if (_panel) {
      _panel.querySelectorAll('.scare-panel__slot--selected')
        .forEach(s => s.classList.remove('scare-panel__slot--selected'));
    }
    slot.classList.add('scare-panel__slot--selected');

    // Sticky pre-fill: inherit the last deployed monster/action if still
    // unlocked. Only fires on fresh sessions (when _selected* are null);
    // mid-session swaps are preserved by the existing flow.
    if (_selectedMonster === null && GameState.get('monsterLab')
        && _lastMonster && GameState.get('monsterTypes').includes(_lastMonster)) {
      _selectedMonster = _lastMonster;
    }
    if (_selectedAction === null && GameState.get('directorsChair')
        && _lastAction && GameState.get('actions').includes(_lastAction)) {
      _selectedAction = _lastAction;
    }

    _renderSubPanels();
    _advanceIfComplete();
  }

  /**
   * Show the monster type sub-panel. Idempotent: if already populated with
   * slots, just make sure it's visible. Re-population happens after cleanup
   * (which empties the innerHTML).
   */
  function _showMonsterPanel() {
    if (!_monsterPanel) return;
    _monsterPanel.style.display = '';
    if (_monsterPanel.children.length > 0) return;

    const types = GameState.get('monsterTypes');
    for (const mt of types) {
      const slot = document.createElement('div');
      slot.className = 'monster-panel__slot';
      slot.dataset.monster = mt;
      slot.setAttribute('aria-label', mt);
      slot.setAttribute('title', mt);
      slot.innerHTML = `
        <div class="monster-panel__icon">${MONSTER_ICONS[mt] || '?'}</div>
      `;
      slot.addEventListener('click', () => _onMonsterTap(mt));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); _onMonsterTap(mt); });
      _monsterPanel.appendChild(slot);
    }
  }

  /** Stage 1.5: player picks a monster type. Preserves action selection. */
  function _onMonsterTap(monsterType) {
    _selectedMonster = monsterType;
    _renderSubPanels();
    _advanceIfComplete();
  }

  /** Show the action sub-panel. Idempotent — see _showMonsterPanel. */
  function _showActionPanel() {
    if (!_actionPanel) return;
    _actionPanel.style.display = '';
    if (_actionPanel.children.length > 0) return;

    const actions = GameState.get('actions');
    for (const a of actions) {
      const slot = document.createElement('div');
      slot.className = 'action-panel__slot';
      slot.dataset.action = a;
      const label = _humanise(a);
      slot.setAttribute('aria-label', label);
      slot.setAttribute('title', label);
      slot.innerHTML = `
        <div class="action-panel__icon">${ACTION_ICONS[a] || '?'}</div>
      `;
      slot.addEventListener('click', () => _onActionTap(a));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); _onActionTap(a); });
      _actionPanel.appendChild(slot);
    }
  }

  /** Stage 1.75: player picks an action. */
  function _onActionTap(action) {
    _selectedAction = action;
    _renderSubPanels();
    _advanceIfComplete();
  }

  /**
   * Show whichever sub-panels are required by current unlocks, and reflect
   * the current _selectedMonster / _selectedAction in their highlights.
   * Called after any in-picker pick so persisted selections stay visible
   * when the player swaps an earlier stage.
   */
  function _renderSubPanels() {
    if (GameState.get('monsterLab')) {
      _showMonsterPanel();
      _monsterPanel.querySelectorAll('.monster-panel__slot--selected')
        .forEach(s => s.classList.remove('monster-panel__slot--selected'));
      if (_selectedMonster) {
        const sl = _monsterPanel.querySelector(`[data-monster="${_selectedMonster}"]`);
        if (sl) sl.classList.add('monster-panel__slot--selected');
      }
    }
    // Action panel only appears once the monster requirement is satisfied,
    // so the player sees a predictable left-to-right stage order.
    const monsterReady = !GameState.get('monsterLab') || _selectedMonster;
    if (GameState.get('directorsChair') && monsterReady) {
      _showActionPanel();
      _actionPanel.querySelectorAll('.action-panel__slot--selected')
        .forEach(s => s.classList.remove('action-panel__slot--selected'));
      if (_selectedAction) {
        const sl = _actionPanel.querySelector(`[data-action="${_selectedAction}"]`);
        if (sl) sl.classList.add('action-panel__slot--selected');
      }
    }
  }

  /**
   * Enter room targeting once every required stage has a selection.
   * _enterRoomTargeting clears prior handlers before re-attaching, so
   * calling this repeatedly as the player tweaks picks is safe.
   */
  function _advanceIfComplete() {
    if (!_selectedType) return;
    const needsMonster = GameState.get('monsterLab') && !_selectedMonster;
    const needsAction = GameState.get('directorsChair') && !_selectedAction;
    if (!needsMonster && !needsAction) {
      _enterRoomTargeting();
    }
  }

  /**
   * Stage 2: highlight targetable rooms and attach click handlers.
   *
   * Attach click handlers to EVERY unlocked room (not just currently-free
   * ones): occupancy is re-checked at tap time in _onRoomTap, so rooms
   * that free up mid-selection work without the player re-selecting.
   * The highlight class only goes on currently-free rooms, and we
   * subscribe to ScareFactory so it stays in sync with live occupancy
   * while the picker is open.
   */
  function _enterRoomTargeting() {
    // Clear any existing room handlers (in case re-entering from monster change)
    _clearRoomHandlers();

    const rooms = GameState.get('rooms');
    for (const [id, def] of Object.entries(rooms)) {
      if (def.locked) continue;

      const roomEl = House.getRoomEl(id);
      if (!roomEl) continue;

      if (!ScareFactory.isOccupied(id)) {
        roomEl.classList.add('house__room--targetable');
      }

      const handler = (e) => {
        e.stopPropagation();
        _onRoomTap(_selectedType, id);
      };
      roomEl.addEventListener('click', handler);
      roomEl.addEventListener('touchend', handler);
      _roomClickHandlers.push({ el: roomEl, handler });
    }

    ScareFactory.setChangeListener(_refreshTargetableHighlight);
  }

  /**
   * Re-sync the targetable highlight class with current occupancy.
   * Called whenever ScareFactory fires a deploy/clear event while the
   * picker is in room-targeting mode.
   */
  function _refreshTargetableHighlight() {
    for (const { el } of _roomClickHandlers) {
      const id = el.dataset.room;
      if (!id) continue;
      el.classList.toggle('house__room--targetable', !ScareFactory.isOccupied(id));
    }
  }

  /** Stage 2: player taps a room to deploy. */
  function _onRoomTap(creatureType, roomId) {
    if (_onCooldown.has(creatureType)) return;

    if (ScareFactory.isOccupied(roomId)) {
      Audio.play('occupied');
      const el = House.getRoomEl(roomId);
      if (el) {
        el.classList.add('house__room--flash-red');
        setTimeout(() => el.classList.remove('house__room--flash-red'), 300);
      }
      cleanup();
      return;
    }

    // Mark as on cooldown immediately (prevents double-tap).
    // Full cooldown animation starts when wave.js calls disableSlot with duration.
    _onCooldown.add(creatureType);
    const monsterType = _selectedMonster;
    const action = _selectedAction;
    // Persist for the next deploy's sticky pre-fill. Cancel paths (tap same
    // creature, tap occupied room) reach cleanup() without updating these.
    if (monsterType) _lastMonster = monsterType;
    if (action) _lastAction = action;
    cleanup();

    if (_onDeploy) _onDeploy(creatureType, roomId, monsterType, action);
  }

  /**
   * Start cooldown animation on a creature slot.
   * Animation is cosmetic only - enableSlot() is called by the creature's
   * expire callback, not by the animation timer.
   * @param {string} type - creature type
   * @param {number} [duration] - cooldown duration in ms (from ScareFactory)
   */
  function disableSlot(type, duration) {
    _onCooldown.add(type);
    const slot = _getSlot(type);
    if (!slot) return;
    slot.classList.add('scare-panel__slot--cooldown');

    const cdEl = slot.querySelector('.scare-panel__cooldown');
    const cooldown = duration ||
      (CONFIG.creatureCooldowns[type] || CONFIG.creatureLifetimeMs);
    const start = Date.now();

    function tick() {
      if (!_onCooldown.has(type)) return; // already re-enabled (e.g., hug)
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / cooldown, 1);
      if (cdEl) cdEl.style.setProperty('--cd-pct', pct);
      if (pct < 1) {
        requestAnimationFrame(tick);
      }
      // Don't self-enable; wait for ScareFactory expire callback
    }
    requestAnimationFrame(tick);
  }

  /** Re-enable a creature slot after cooldown. */
  function enableSlot(type) {
    _onCooldown.delete(type);
    const slot = _getSlot(type);
    if (!slot) return;
    slot.classList.remove('scare-panel__slot--cooldown');
    const cdEl = slot.querySelector('.scare-panel__cooldown');
    if (cdEl) cdEl.style.setProperty('--cd-pct', 0);
  }

  /** Clear room targeting highlights and handlers. */
  function _clearRoomHandlers() {
    for (const { el, handler } of _roomClickHandlers) {
      el.classList.remove('house__room--targetable');
      el.removeEventListener('click', handler);
      el.removeEventListener('touchend', handler);
    }
    _roomClickHandlers = [];
    ScareFactory.setChangeListener(null);
  }

  /** Clear all selection state. */
  function cleanup() {
    _selectedType = null;
    _selectedMonster = null;
    _selectedAction = null;

    if (_panel) {
      _panel.querySelectorAll('.scare-panel__slot--selected')
        .forEach(s => s.classList.remove('scare-panel__slot--selected'));
    }

    // Hide monster sub-panel
    if (_monsterPanel) {
      _monsterPanel.style.display = 'none';
      _monsterPanel.innerHTML = '';
    }

    // Hide action sub-panel
    if (_actionPanel) {
      _actionPanel.style.display = 'none';
      _actionPanel.innerHTML = '';
    }

    _clearRoomHandlers();
  }

  /** Helper: find the slot element for a creature type. */
  function _getSlot(type) {
    return _panel ? _panel.querySelector(`[data-creature="${type}"]`) : null;
  }

  return { init, render, setDeployHandler, enableSlot, disableSlot, cleanup };
})();
