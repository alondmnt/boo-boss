/**
 * Picker — 2-stage pick UI: tap creature in scare panel, then tap room.
 * Stage 1: select creature (highlight panel slot, show targetable rooms).
 * Stage 2: tap room to deploy (calls ScareFactory, starts cooldown).
 */
const Picker = (() => {
  let _panel = null;
  let _selectedType = null;
  let _roomClickHandlers = [];
  let _onDeploy = null; // callback: (creatureType, roomId) => void

  /** Creature type -> emoji icon for panel buttons. */
  const ICONS = {
    spider: '🕷️', gorilla: '🦍', bat: '🦇', cat: '🐱',
    owl: '🦉', snake: '🐍', rat: '🐀',
  };

  /** Bind to the scare panel container. */
  function init(container) {
    _panel = container;
  }

  /**
   * Set the deploy handler called when a creature is deployed.
   * Wave module uses this to wire up onExpire callbacks.
   * @param {function} handler - (creatureType, roomId) => void
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
    _panel.innerHTML = '';
    const creatures = GameState.get('creatures');

    for (const type of creatures) {
      const slot = document.createElement('div');
      slot.className = 'scare-panel__slot';
      slot.dataset.creature = type;
      slot.innerHTML = `
        <div class="scare-panel__icon">${ICONS[type] || '?'}</div>
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
    // Ignore if on cooldown
    const slot = _getSlot(type);
    if (!slot || slot.classList.contains('scare-panel__slot--cooldown')) return;

    // If already selected, deselect
    if (_selectedType === type) {
      cleanup();
      return;
    }

    // Select this creature
    cleanup();
    _selectedType = type;
    slot.classList.add('scare-panel__slot--selected');

    // Highlight targetable rooms (unlocked + unoccupied)
    const rooms = GameState.get('rooms');
    for (const [id, def] of Object.entries(rooms)) {
      if (def.locked) continue;
      if (ScareFactory.isOccupied(id)) continue;

      const roomEl = House.getRoomEl(id);
      if (!roomEl) continue;
      roomEl.classList.add('house__room--targetable');

      // Attach room click handler
      const handler = (e) => {
        e.stopPropagation();
        _onRoomTap(type, id);
      };
      roomEl.addEventListener('click', handler);
      roomEl.addEventListener('touchend', handler);
      _roomClickHandlers.push({ el: roomEl, handler });
    }
  }

  /** Stage 2: player taps a room to deploy. */
  function _onRoomTap(creatureType, roomId) {
    if (ScareFactory.isOccupied(roomId)) {
      Audio.play('occupied');
      const el = House.getRoomEl(roomId);
      if (el) {
        el.classList.add('house__room--flash-red');
        setTimeout(() => el.classList.remove('house__room--flash-red'), 300);
      }
      return;
    }

    // Notify deploy handler (Wave wires this up with onExpire)
    if (_onDeploy) _onDeploy(creatureType, roomId);

    // Start cooldown on this creature slot
    disableSlot(creatureType);
    cleanup();
  }

  /** Start cooldown animation on a creature slot. */
  function disableSlot(type) {
    const slot = _getSlot(type);
    if (!slot) return;
    slot.classList.add('scare-panel__slot--cooldown');

    const cdEl = slot.querySelector('.scare-panel__cooldown');
    const cooldown = GameState.get('creatureCooldowns')[type] || CONFIG.creatureLifetimeMs;
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
    const slot = _getSlot(type);
    if (!slot) return;
    slot.classList.remove('scare-panel__slot--cooldown');
    const cdEl = slot.querySelector('.scare-panel__cooldown');
    if (cdEl) cdEl.style.setProperty('--cd-pct', 0);
  }

  /** Clear selection state and room targeting highlights. */
  function cleanup() {
    _selectedType = null;

    // Remove panel selection highlight
    if (_panel) {
      _panel.querySelectorAll('.scare-panel__slot--selected')
        .forEach(s => s.classList.remove('scare-panel__slot--selected'));
    }

    // Remove room targeting and click handlers
    for (const { el, handler } of _roomClickHandlers) {
      el.classList.remove('house__room--targetable');
      el.removeEventListener('click', handler);
      el.removeEventListener('touchend', handler);
    }
    _roomClickHandlers = [];
  }

  /** Helper: find the slot element for a creature type. */
  function _getSlot(type) {
    return _panel ? _panel.querySelector(`[data-creature="${type}"]`) : null;
  }

  return { init, render, setDeployHandler, enableSlot, disableSlot, cleanup };
})();
