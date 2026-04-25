/**
 * TrackEditor — builder-mode overlay reached opt-in from the wave summary.
 * Lets the player place track pieces on segments, close rooms off the ride,
 * and pick a cart skin (cart skin itself arrives in a later tier). Gated on
 * the `trackEditor` unlock (140 coins). Pieces available scale with further
 * unlocks (`trackPiecesBasic`, `trackPiecesShowy`) and cart skins with
 * `trainSkins`.
 *
 * Stage flow mirrors picker.js: tap-a-target → popup → confirm → re-render.
 */
const TrackEditor = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let _overlay = null;
  let _closeBtn = null;
  let _cartBtn = null;
  let _popupHost = null;
  let _hintEl = null;
  let _editorLayer = null;
  let _active = false;

  let _roomHandlers = [];   // { el, handler } pairs, restored on hide
  let _currentPopup = null; // DOM element of the open popup, if any

  /** One-time init: cache DOM refs, bind close button, create SVG layer. */
  function init() {
    _overlay = document.getElementById('track-editor');
    if (!_overlay) return;
    _closeBtn = _overlay.querySelector('.track-editor__close');
    _cartBtn = _overlay.querySelector('.track-editor__cart-btn');
    _popupHost = _overlay.querySelector('.track-editor__popup-host');
    _hintEl = _overlay.querySelector('.track-editor__hint');

    if (_closeBtn) {
      const close = (e) => { e.preventDefault(); e.stopPropagation(); hide(); };
      _closeBtn.addEventListener('click', close);
      _closeBtn.addEventListener('touchend', close);
    }

    if (_cartBtn) {
      const onCart = (e) => { e.preventDefault(); e.stopPropagation(); _openSkinPopup(); };
      _cartBtn.addEventListener('click', onCart);
      _cartBtn.addEventListener('touchend', onCart);
    }

    if (_popupHost) {
      // Tapping the popup host background (not a popup child) dismisses the popup.
      const dismissPopup = (e) => {
        if (e.target === _popupHost) _closePopup();
      };
      _popupHost.addEventListener('click', dismissPopup);
      _popupHost.addEventListener('touchend', dismissPopup);
    }

    // SVG editor layer — tap targets live here, initially empty.
    const svg = House.getSvg();
    if (svg && !svg.querySelector('.house__editor-layer')) {
      const layer = document.createElementNS(NS, 'g');
      layer.classList.add('house__editor-layer');
      svg.appendChild(layer);
    }
  }

  /** Enter builder mode. Gated on the 140-coin unlock. */
  function show() {
    if (!_overlay || !GameState.get('trackEditor')) return;
    if (_active) return;
    _active = true;

    // Hide the wave summary so the house is visible underneath.
    const summary = document.getElementById('wave-summary');
    if (summary) summary.classList.add('overlay--hidden');

    // Drop any lingering picker handlers — Picker.cleanup otherwise only runs
    // on summary dismiss, so builder mode could inherit stale room handlers.
    if (typeof Picker !== 'undefined' && Picker.cleanup) Picker.cleanup();

    _overlay.classList.remove('overlay--hidden');
    _resetHint();

    if (_cartBtn) {
      _cartBtn.style.display = GameState.get('trainSkins') ? '' : 'none';
    }

    const svg = House.getSvg();
    _editorLayer = svg ? svg.querySelector('.house__editor-layer') : null;
    if (_editorLayer) {
      _editorLayer.innerHTML = '';
      _editorLayer.classList.add('house__editor-layer--active');
      _renderSegmentTargets();
    }

    _attachRoomHandlers();
    if (typeof Audio !== 'undefined' && Audio.resume) Audio.resume();
  }

  /** Exit builder mode, restore summary overlay. */
  function hide() {
    if (!_active) return;
    _active = false;

    _closePopup();
    _detachRoomHandlers();

    if (_editorLayer) {
      _editorLayer.innerHTML = '';
      _editorLayer.classList.remove('house__editor-layer--active');
    }
    _overlay.classList.add('overlay--hidden');

    // Re-show the wave summary so the player can advance or re-enter the editor.
    const summary = document.getElementById('wave-summary');
    if (summary) summary.classList.remove('overlay--hidden');
  }

  /* ─── Tap-target rendering ─── */

  /** Place a clickable affordance at every non-return segment's midpoint. */
  function _renderSegmentTargets() {
    const route = GameState.getTrackRoute();
    if (route.length < 2) return;
    const rooms = GameState.get('rooms');

    for (let i = 1; i < route.length; i++) {
      const fromRoom = route[i - 1];
      const toRoom = route[i];
      // Skip segments touching a locked room — the player can't edit track
      // into a room they haven't unlocked yet.
      if ((rooms[fromRoom] && rooms[fromRoom].locked) ||
          (rooms[toRoom] && rooms[toRoom].locked)) continue;
      const prev = House.getRoomCentre(fromRoom);
      const curr = House.getRoomCentre(toRoom);
      if (!prev || !curr) continue;

      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;

      const g = document.createElementNS(NS, 'g');
      g.classList.add('house__editor-segment');
      g.setAttribute('data-from', fromRoom);
      g.setAttribute('data-to', toRoom);

      const bg = document.createElementNS(NS, 'circle');
      bg.setAttribute('cx', mx);
      bg.setAttribute('cy', my);
      bg.setAttribute('r', 13);
      g.appendChild(bg);

      const segId = GameState._segId(fromRoom, toRoom);
      const currentKey = GameState.getSegmentOverride(segId);
      const broken = GameState.isSegmentBroken(segId);
      const piece = currentKey && PIECES[currentKey];
      const icon = broken ? '🔨' : (piece ? piece.icon : '✎');

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', mx);
      label.setAttribute('y', my + 4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', broken
        ? 'house__editor-segment-label house__editor-segment-label--broken'
        : 'house__editor-segment-label');
      label.textContent = icon;
      g.appendChild(label);

      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        _openSegmentPopup(fromRoom, toRoom);
      };
      g.addEventListener('click', handler);
      g.addEventListener('touchend', handler);

      _editorLayer.appendChild(g);
    }
  }

  function _attachRoomHandlers() {
    const rooms = GameState.get('rooms');
    for (const id of Object.keys(CONFIG.rooms)) {
      if (rooms[id] && rooms[id].locked) continue;
      const el = House.getRoomEl(id);
      if (!el) continue;
      el.classList.add('house__room--editor-target');
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        _openRoomPopup(id);
      };
      el.addEventListener('click', handler);
      el.addEventListener('touchend', handler);
      _roomHandlers.push({ el, handler });
    }
  }

  function _detachRoomHandlers() {
    for (const { el, handler } of _roomHandlers) {
      el.classList.remove('house__room--editor-target');
      el.removeEventListener('click', handler);
      el.removeEventListener('touchend', handler);
    }
    _roomHandlers = [];
  }

  /* ─── Popups ─── */

  function _closePopup() {
    if (_currentPopup) {
      _currentPopup.remove();
      _currentPopup = null;
    }
  }

  function _openSegmentPopup(fromRoom, toRoom) {
    _closePopup();
    const segId = GameState._segId(fromRoom, toRoom);

    // If this segment is broken, show the repair flow instead of the piece picker.
    if (GameState.isSegmentBroken(segId)) {
      _openRepairPopup(fromRoom, toRoom);
      return;
    }

    const currentKey = GameState.getSegmentOverride(segId);
    const slotType = _slotTypeFor(fromRoom, toRoom);

    const pop = document.createElement('div');
    pop.className = 'editor-popup editor-popup--piece';

    const title = document.createElement('div');
    title.className = 'editor-popup__title';
    title.textContent = `${_prettyRoom(fromRoom)} → ${_prettyRoom(toRoom)}`;
    pop.appendChild(title);

    const row = document.createElement('div');
    row.className = 'editor-popup__row';

    const available = _availablePieces();
    const oldPiece = currentKey ? PIECES[currentKey] : null;
    const refund = oldPiece
      ? Math.floor(oldPiece.costCoins * CONFIG.rollercoaster.pieceSellbackPct)
      : 0;
    const coins = Progress.getCoins();

    let rendered = 0;
    for (const pieceKey of available) {
      const piece = PIECES[pieceKey];
      if (!piece || !piece.slotTypes.includes(slotType)) continue;
      rendered++;

      // A straight piece on a segment with no override is visually identical
      // to the default — treat it as the "current" state so the player isn't
      // taxed for confirming the default.
      const isCurrent = currentKey === pieceKey
                     || (currentKey == null && pieceKey === 'straight');
      const netCost = isCurrent ? 0 : piece.costCoins - refund;
      const canAfford = netCost <= 0 || coins >= netCost;

      const btn = document.createElement('button');
      btn.className = 'editor-popup__option';
      if (isCurrent) btn.classList.add('editor-popup__option--selected');
      if (!isCurrent && !canAfford) btn.classList.add('editor-popup__option--disabled');
      btn.type = 'button';
      btn.innerHTML = `
        <div class="editor-popup__icon">${piece.icon}</div>
        <div class="editor-popup__label">${piece.label}</div>
        <div class="editor-popup__cost">${_costLabel(isCurrent, netCost)}</div>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCurrent) { _closePopup(); return; }
        if (!canAfford) return;
        _placePiece(segId, pieceKey, netCost);
      });
      row.appendChild(btn);
    }

    if (rendered === 0) {
      const empty = document.createElement('div');
      empty.className = 'editor-popup__empty';
      empty.textContent = 'no pieces available for this segment yet';
      pop.appendChild(empty);
    } else {
      pop.appendChild(row);
    }

    _popupHost.appendChild(pop);
    _currentPopup = pop;
  }

  function _openRoomPopup(roomId) {
    _closePopup();
    const closed = GameState.isRoomClosed(roomId);

    const pop = document.createElement('div');
    pop.className = 'editor-popup editor-popup--room';

    const title = document.createElement('div');
    title.className = 'editor-popup__title';
    title.textContent = _prettyRoom(roomId);
    pop.appendChild(title);

    const row = document.createElement('div');
    row.className = 'editor-popup__row';

    const mkOpt = (selected, icon, label, onTap) => {
      const btn = document.createElement('button');
      btn.className = 'editor-popup__option';
      if (selected) btn.classList.add('editor-popup__option--selected');
      btn.type = 'button';
      btn.innerHTML = `
        <div class="editor-popup__icon">${icon}</div>
        <div class="editor-popup__label">${label}</div>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onTap();
      });
      return btn;
    };

    row.appendChild(mkOpt(!closed, '🚂', 'on the ride', () => {
      if (closed) _toggleRoom(roomId);
      else _closePopup();
    }));
    row.appendChild(mkOpt(closed, '🚫', 'closed tonight', () => {
      if (!closed) _toggleRoom(roomId);
      else _closePopup();
    }));

    pop.appendChild(row);

    // Visit-order row: show current position + earlier/later controls.
    const route = GameState.getTrackRoute();
    const pos = GameState.getRoomRouteIndex(roomId);
    const routeInfo = document.createElement('div');
    routeInfo.className = 'editor-popup__body';
    routeInfo.textContent = `visit order: ${pos + 1} of ${route.length}`;
    pop.appendChild(routeInfo);

    const reorderRow = document.createElement('div');
    reorderRow.className = 'editor-popup__row';

    const earlierBtn = document.createElement('button');
    earlierBtn.className = 'editor-popup__option';
    if (pos <= 0) earlierBtn.classList.add('editor-popup__option--disabled');
    earlierBtn.type = 'button';
    earlierBtn.innerHTML = `
      <div class="editor-popup__icon">⬅️</div>
      <div class="editor-popup__label">earlier</div>
    `;
    earlierBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pos <= 0) return;
      _moveRoomInOrder(roomId, -1);
    });
    reorderRow.appendChild(earlierBtn);

    const laterBtn = document.createElement('button');
    laterBtn.className = 'editor-popup__option';
    if (pos >= route.length - 1) laterBtn.classList.add('editor-popup__option--disabled');
    laterBtn.type = 'button';
    laterBtn.innerHTML = `
      <div class="editor-popup__icon">➡️</div>
      <div class="editor-popup__label">later</div>
    `;
    laterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pos >= route.length - 1) return;
      _moveRoomInOrder(roomId, 1);
    });
    reorderRow.appendChild(laterBtn);

    pop.appendChild(reorderRow);

    _popupHost.appendChild(pop);
    _currentPopup = pop;
  }

  function _moveRoomInOrder(roomId, direction) {
    const moved = GameState.swapRoomInRoute(roomId, direction);
    if (!moved) return;
    Progress.save();
    Train.renderTrack();
    _closePopup();
    _refreshSegmentTargets();
  }

  function _openRepairPopup(fromRoom, toRoom) {
    _closePopup();
    const segId = GameState._segId(fromRoom, toRoom);
    const cost = CONFIG.rollercoaster.malfunctionRepairCost;
    const have = Progress.getCoins();
    const key = GameState.getSegmentOverride(segId);
    const piece = key && PIECES[key];

    const pop = document.createElement('div');
    pop.className = 'editor-popup editor-popup--repair';

    const title = document.createElement('div');
    title.className = 'editor-popup__title';
    title.textContent = `${piece ? piece.label + ' — ' : ''}broken!`;
    pop.appendChild(title);

    const body = document.createElement('div');
    body.className = 'editor-popup__body';
    body.textContent = `Fix for ${cost}🪙 (you have ${have}).`;
    pop.appendChild(body);

    const row = document.createElement('div');
    row.className = 'editor-popup__row';

    const fixBtn = document.createElement('button');
    fixBtn.className = 'editor-popup__option';
    if (have < cost) fixBtn.classList.add('editor-popup__option--disabled');
    fixBtn.type = 'button';
    fixBtn.innerHTML = `
      <div class="editor-popup__icon">🔨</div>
      <div class="editor-popup__label">fix (${cost}🪙)</div>
    `;
    fixBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (have < cost) return;
      _repairSegment(segId);
    });
    row.appendChild(fixBtn);
    pop.appendChild(row);
    _popupHost.appendChild(pop);
    _currentPopup = pop;
  }

  function _repairSegment(segId) {
    const cost = CONFIG.rollercoaster.malfunctionRepairCost;
    if (Progress.getCoins() < cost) return;
    Progress.addCoins(-cost);
    GameState.setMalfunction(segId, false);
    Progress.save();
    Train.renderTrack();
    _closePopup();
    _refreshSegmentTargets();
  }

  function _openSkinPopup() {
    _closePopup();
    const current = GameState.getTrainSkin();
    const coins = Progress.getCoins();

    const pop = document.createElement('div');
    pop.className = 'editor-popup editor-popup--skin';

    const title = document.createElement('div');
    title.className = 'editor-popup__title';
    title.textContent = 'Choose cart';
    pop.appendChild(title);

    const row = document.createElement('div');
    row.className = 'editor-popup__row';

    for (const key of Object.keys(TRAIN_SKINS)) {
      const skin = TRAIN_SKINS[key];
      const isCurrent = current === key;
      const owned = GameState.hasOwnedSkin(key);
      const cost = owned ? 0 : (skin.costCoins || 0);
      const canAfford = cost === 0 || coins >= cost;

      const btn = document.createElement('button');
      btn.className = 'editor-popup__option';
      if (isCurrent) btn.classList.add('editor-popup__option--selected');
      if (!isCurrent && !canAfford) btn.classList.add('editor-popup__option--disabled');
      btn.type = 'button';

      // Cost label: ✓ if currently active, blank if owned+switchable, cost if buying.
      let costLabel = '';
      if (isCurrent) costLabel = '✓';
      else if (cost > 0) costLabel = `-${cost}🪙`;

      btn.title = skin.label;
      btn.innerHTML = `
        <div class="editor-popup__icon">${skin.icon}</div>
        <div class="editor-popup__cost">${costLabel}</div>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCurrent) { _closePopup(); return; }
        if (!canAfford) return;
        _applySkin(key, cost);
      });
      row.appendChild(btn);
    }

    pop.appendChild(row);
    _popupHost.appendChild(pop);
    _currentPopup = pop;
  }

  function _applySkin(skinKey, cost) {
    if (cost > 0) {
      if (Progress.getCoins() < cost) return;
      Progress.addCoins(-cost);
    }
    GameState.markSkinOwned(skinKey);
    GameState.setTrainSkin(skinKey);
    Train.setCartSkin(skinKey);
    Progress.save();
    _closePopup();
  }

  /* ─── State mutations ─── */

  function _placePiece(segId, pieceKey, netCost) {
    if (netCost > 0 && Progress.getCoins() < netCost) return;
    if (netCost !== 0) Progress.addCoins(-netCost);
    // Store straight as null so "no override" stays the default representation.
    GameState.setSegmentOverride(segId, pieceKey === 'straight' ? null : pieceKey);
    Progress.save();
    Train.renderTrack();
    _closePopup();
    _refreshSegmentTargets();
  }

  function _toggleRoom(roomId) {
    const willClose = !GameState.isRoomClosed(roomId);
    if (willClose) {
      const remainingOpen = _openRoomCount() - 1;
      if (remainingOpen < CONFIG.rollercoaster.minOpenRooms) {
        _flashHint(`at least ${CONFIG.rollercoaster.minOpenRooms} rooms must stay open`);
        return;
      }
    }
    GameState.toggleRoomClosed(roomId);
    House.setRoomVisualClosed(roomId, GameState.isRoomClosed(roomId));
    Progress.save();
    Train.renderTrack();
    _closePopup();
  }

  function _refreshSegmentTargets() {
    if (!_editorLayer) return;
    _editorLayer.innerHTML = '';
    _renderSegmentTargets();
  }

  /* ─── Helpers ─── */

  function _availablePieces() {
    const keys = ['straight'];
    if (GameState.get('trackPiecesBasic')) keys.push('hill', 'tunnel');
    if (GameState.get('trackPiecesShowy')) keys.push('loop', 'corkscrew');
    return keys;
  }

  function _slotTypeFor(fromRoom, toRoom) {
    const rooms = CONFIG.rooms;
    const from = rooms[fromRoom];
    const to = rooms[toRoom];
    if (!from || !to) return 'sameFloorHorizontal';
    return from.floor !== to.floor ? 'floorChange' : 'sameFloorHorizontal';
  }

  function _openRoomCount() {
    const rooms = GameState.get('rooms');
    let n = 0;
    for (const id of Object.keys(rooms)) {
      if (!rooms[id].locked && !GameState.isRoomClosed(id)) n++;
    }
    return n;
  }

  function _prettyRoom(id) {
    return CONFIG.rooms[id] ? CONFIG.rooms[id].label : id;
  }

  /** Format the cost line under a piece option: ✓ for current, charge or refund otherwise. */
  function _costLabel(isCurrent, netCost) {
    if (isCurrent) return '✓';
    if (netCost === 0) return 'free';
    if (netCost > 0) return `-${netCost}🪙`;
    return `+${-netCost}🪙`;
  }

  function _resetHint() {
    if (!_hintEl) return;
    _hintEl.textContent = 'tap a segment or a room to edit';
    _hintEl.classList.remove('track-editor__hint--warning');
  }

  function _flashHint(msg) {
    if (!_hintEl) return;
    _hintEl.textContent = msg;
    _hintEl.classList.add('track-editor__hint--warning');
    setTimeout(_resetHint, 2000);
  }

  return { init, show, hide };
})();
