/**
 * Picker — multi-stage pick UI for deploying scare creatures.
 * Without monster lab: 2-stage (creature -> room).
 * With monster lab: 3-stage (creature -> monster type -> room).
 */
const Picker = (() => {
  let _panel = null;
  let _monsterPanel = null;
  let _selectedType = null;
  let _selectedMonster = null;
  let _roomClickHandlers = [];
  let _onDeploy = null;
  const _onCooldown = new Set();

  /** Creature type -> emoji icon for panel buttons. */
  const CREATURE_ICONS = {
    spider: '🕷️', gorilla: '🦍', bat: '🦇', cat: '🐱',
    dinosaur: '🦕', owl: '🦉', snake: '🐍', rat: '🐀',
  };

  /** Monster type -> emoji icon for sub-panel buttons. */
  const MONSTER_ICONS = {
    zombie: '🧟', witch: '🧙', skeleton: '💀',
    vampire: '🧛', astronaut: '🧑‍🚀', ghost: '👻',
  };

  /** Bind to the scare panel container. */
  function init(container) {
    _panel = container;
    // Create monster type sub-panel (hidden until needed)
    _monsterPanel = document.createElement('div');
    _monsterPanel.id = 'monster-panel';
    _monsterPanel.style.display = 'none';
    _panel.parentNode.insertBefore(_monsterPanel, _panel);
  }

  /**
   * Set the deploy handler called when a creature is deployed.
   * @param {function} handler - (creatureType, roomId, monsterType) => void
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
      slot.innerHTML = `
        <div class="scare-panel__icon">${CREATURE_ICONS[type] || '?'}</div>
        <div class="scare-panel__cooldown"></div>
        <div class="scare-panel__label">${type}</div>
      `;
      slot.addEventListener('click', () => _onSlotTap(type));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); _onSlotTap(type); });
      _panel.appendChild(slot);
    }
  }

  /** Stage 1: player taps a creature slot. */
  function _onSlotTap(type) {
    if (_onCooldown.has(type)) return;
    const slot = _getSlot(type);
    if (!slot) return;

    // If already selected, deselect
    if (_selectedType === type) {
      cleanup();
      return;
    }

    // Select this creature
    cleanup();
    _selectedType = type;
    slot.classList.add('scare-panel__slot--selected');

    // If monster lab is unlocked, show monster type sub-panel (stage 1.5)
    if (GameState.get('monsterLab')) {
      _showMonsterPanel();
    } else {
      // No monster lab: skip to room targeting (stage 2)
      _enterRoomTargeting();
    }
  }

  /** Stage 1.5: show monster type sub-panel. */
  function _showMonsterPanel() {
    if (!_monsterPanel) return;
    _monsterPanel.innerHTML = '';
    _monsterPanel.style.display = '';

    // Available types: base 3 + any unlocked
    const types = GameState.get('monsterTypes');

    for (const mt of types) {
      const slot = document.createElement('div');
      slot.className = 'monster-panel__slot';
      slot.dataset.monster = mt;
      slot.innerHTML = `
        <div class="monster-panel__icon">${MONSTER_ICONS[mt] || '?'}</div>
        <div class="monster-panel__label">${mt}</div>
      `;
      slot.addEventListener('click', () => _onMonsterTap(mt));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); _onMonsterTap(mt); });
      _monsterPanel.appendChild(slot);
    }
  }

  /** Stage 1.5 -> Stage 2: player picks a monster type, enter room targeting. */
  function _onMonsterTap(monsterType) {
    _selectedMonster = monsterType;

    // Highlight selected monster slot
    if (_monsterPanel) {
      _monsterPanel.querySelectorAll('.monster-panel__slot--selected')
        .forEach(s => s.classList.remove('monster-panel__slot--selected'));
      const slot = _monsterPanel.querySelector(`[data-monster="${monsterType}"]`);
      if (slot) slot.classList.add('monster-panel__slot--selected');
    }

    _enterRoomTargeting();
  }

  /** Stage 2: highlight targetable rooms and attach click handlers. */
  function _enterRoomTargeting() {
    // Clear any existing room handlers (in case re-entering from monster change)
    _clearRoomHandlers();

    const rooms = GameState.get('rooms');
    for (const [id, def] of Object.entries(rooms)) {
      if (def.locked) continue;
      if (ScareFactory.isOccupied(id)) continue;

      const roomEl = House.getRoomEl(id);
      if (!roomEl) continue;
      roomEl.classList.add('house__room--targetable');

      const handler = (e) => {
        e.stopPropagation();
        _onRoomTap(_selectedType, id);
      };
      roomEl.addEventListener('click', handler);
      roomEl.addEventListener('touchend', handler);
      _roomClickHandlers.push({ el: roomEl, handler });
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

    // Lock immediately BEFORE deploy
    disableSlot(creatureType);
    const monsterType = _selectedMonster;
    cleanup();

    if (_onDeploy) _onDeploy(creatureType, roomId, monsterType);
  }

  /** Start cooldown animation on a creature slot. */
  function disableSlot(type) {
    _onCooldown.add(type);
    const slot = _getSlot(type);
    if (!slot) return;
    slot.classList.add('scare-panel__slot--cooldown');

    const cdEl = slot.querySelector('.scare-panel__cooldown');
    const cooldown = GameState.get('creatureLifetimeMs');
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / cooldown, 1);
      if (cdEl) cdEl.style.setProperty('--cd-pct', pct);
      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        enableSlot(type);
      }
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
  }

  /** Clear all selection state. */
  function cleanup() {
    _selectedType = null;
    _selectedMonster = null;

    if (_panel) {
      _panel.querySelectorAll('.scare-panel__slot--selected')
        .forEach(s => s.classList.remove('scare-panel__slot--selected'));
    }

    // Hide monster sub-panel
    if (_monsterPanel) {
      _monsterPanel.style.display = 'none';
      _monsterPanel.innerHTML = '';
    }

    _clearRoomHandlers();
  }

  /** Helper: find the slot element for a creature type. */
  function _getSlot(type) {
    return _panel ? _panel.querySelector(`[data-creature="${type}"]`) : null;
  }

  return { init, render, setDeployHandler, enableSlot, disableSlot, cleanup };
})();
