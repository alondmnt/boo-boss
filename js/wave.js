/**
 * Wave — wave state machine, visitor spawning via train, wave completion.
 * States: idle -> trainArriving -> visiting -> trainDeparting -> summary -> idle.
 * Uses generation counter to cancel stale callbacks across concurrent wander loops.
 */
const Wave = (() => {
  let _state = 'idle';
  let _generation = 0;
  let _waveNum = 0;
  let _visitors = [];
  let _exitedCount = 0;
  let _waveScore = 0;
  let _scaredVisitorCount = 0;
  let _onComplete = null;
  let _typesUsed = new Set();
  let _deployments = [];

  /**
   * Start a new wave.
   * @param {number} waveNum - wave number (1-based)
   */
  function start(waveNum) {
    const gen = ++_generation;
    _waveNum = waveNum;
    _state = 'trainArriving';
    _visitors = [];
    _exitedCount = 0;
    _waveScore = 0;
    _scaredVisitorCount = 0;
    _typesUsed = new Set();
    _deployments = [];

    // Wire up Picker deploy handler for this wave
    Picker.setDeployHandler((creatureType, roomId, monsterType) => {
      _handleDeploy(creatureType, roomId, gen, monsterType);
    });

    // Generate visitors
    const count = CONFIG.waveSizing.base + Math.floor(waveNum * CONFIG.waveSizing.perWave);
    const creaturePool = GameState.get('creatures');
    if (!creaturePool || creaturePool.length === 0) return;

    // Check for showcase tier (force one visitor to fear a newly unlocked creature)
    const showcase = Progress.consumeShowcase();

    for (let i = 0; i < count; i++) {
      const fear = _randomFrom(creaturePool);
      // Love must differ from fear (if pool allows)
      let love = _randomFrom(creaturePool);
      if (creaturePool.length > 1) {
        while (love === fear) love = _randomFrom(creaturePool);
      }

      const visitor = Visitor.create(fear, love);
      _visitors.push(visitor);
    }

    // Apply showcase: first visitor fears the showcase creature
    if (showcase && _visitors.length > 0) {
      const showcaseType = showcase.key;
      if (creaturePool.includes(showcaseType)) {
        const v = _visitors[0];
        Visitor.remove(v);
        const others = creaturePool.filter(c => c !== showcaseType);
        const love = others.length > 0 ? _randomFrom(others) : showcaseType;
        _visitors[0] = Visitor.create(showcaseType, love);
      }
    }

    Audio.play('waveStart');

    // Store score baseline so _updateScore can show live wave points
    const scoreEl = document.getElementById('score-value');
    if (scoreEl) scoreEl.dataset.waveBase = scoreEl.textContent;

    // Only stop at unlocked rooms for visitor disembarkation
    const stops = GameState.getTrackStops();
    let visitorIdx = 0;

    Train.animateEntry(
      // onRoomReached: only place visitors at unlocked stops
      (roomId, _stopIdx) => {
        if (_generation !== gen) return;
        if (!stops.includes(roomId)) return; // locked room, pass through
        if (visitorIdx < _visitors.length) {
          const visitor = _visitors[visitorIdx];
          Visitor.placeInRoom(visitor, roomId);
          Visitor.setState(visitor, 'walking');
          visitorIdx++;
        }
      },
      // onComplete: all rooms passed, remaining visitors go to unlocked rooms
      () => {
        if (_generation !== gen) return;
        while (visitorIdx < _visitors.length) {
          const roomId = stops[visitorIdx % stops.length];
          const visitor = _visitors[visitorIdx];
          Visitor.placeInRoom(visitor, roomId);
          Visitor.setState(visitor, 'walking');
          visitorIdx++;
        }
        _state = 'visiting';
        _updateVisitorCount();
        for (const visitor of _visitors) {
          _wanderLoop(visitor, gen);
        }
      }
    );
  }

  /** Handle a creature deployment during this wave. */
  function _handleDeploy(creatureType, roomId, gen, monsterType) {
    if (_generation !== gen) return;

    const creature = ScareFactory.deploy(creatureType, roomId, (expired) => {
      // onExpire callback: re-enable picker slot
      if (_generation !== gen) return;
      Picker.enableSlot(expired.type);
    }, monsterType);

    if (creature) {
      _typesUsed.add(creature.monsterType);
      _deployments.push({ creature: creatureType, monsterType: creature.monsterType });
    } else {
      Audio.play('occupied');
    }
  }

  /**
   * Wander loop for a single visitor.
   * Pattern: wander within current room (2-3 steps), check for scare
   * encounter, then walk to an adjacent room. Repeat until exit threshold.
   */
  function _wanderLoop(visitor, gen) {
    if (_generation !== gen) return;
    if (visitor.state === 'exiting' || visitor.state === 'exited' ||
        visitor.state === 'waitingForTrain' || visitor.state === 'boarding') return;

    // Exit threshold set once per visitor
    if (visitor._maxVisits == null) {
      visitor._maxVisits = CONFIG.visitorRoomVisits.min +
        Math.floor(Math.random() * (CONFIG.visitorRoomVisits.max - CONFIG.visitorRoomVisits.min + 1));
    }
    if (visitor.roomsVisited >= visitor._maxVisits) {
      _sendToExit(visitor, gen);
      return;
    }

    // Step 1: wander within the current room (2-3 steps)
    const steps = 2 + Math.floor(Math.random() * 2);
    Visitor.wanderInRoom(visitor, steps, () => {
      if (_generation !== gen) return;

      // Check for creature encounter in this room
      const currentRoom = visitor.currentRoom;
      const creature = ScareFactory.getDeployed(currentRoom);
      if (creature && !visitor._scared) {
        const result = ScareFactory.evaluate(visitor, creature);

        if (result.result === 'scared') {
          visitor._scared = true;
          _waveScore += result.points;
          _scaredVisitorCount++;
          _updateScore();
          Reactions.scared(visitor, creature, () => {
            visitor._scared = false;
            if (_generation !== gen) return;
            // Flee to an adjacent room (no dwell delay)
            _fleeFromScare(visitor, gen);
          });
          return;
        } else if (result.result === 'loved') {
          visitor._scared = true;
          Reactions.hugged(visitor, creature, () => {
            ScareFactory.clearRoom(creature.roomId);
            Creatures.remove(creature);
            Picker.enableSlot(creature.type);
            visitor._scared = false;
            if (_generation !== gen) return;
            _moveToNextRoom(visitor, gen);
          });
          return;
        }
      }

      // No encounter (or neutral): move to next room
      _moveToNextRoom(visitor, gen);
    });
  }

  /** Scared visitor bolts to an adjacent room, then resumes wandering. */
  function _fleeFromScare(visitor, gen) {
    if (_generation !== gen) return;
    const nextRoom = Visitor.pickNextRoom(visitor);
    Visitor.moveToRoom(visitor, nextRoom, () => {
      if (_generation !== gen) return;
      visitor.roomsVisited++;
      // Resume wandering immediately (no dwell - they're spooked)
      _wanderLoop(visitor, gen);
    });
  }

  /** Walk to an adjacent room, then continue the wander loop. */
  function _moveToNextRoom(visitor, gen) {
    if (_generation !== gen) return;
    const nextRoom = Visitor.pickNextRoom(visitor);
    Visitor.moveToRoom(visitor, nextRoom, () => {
      if (_generation !== gen) return;
      visitor.roomsVisited++;
      _dwellThenWander(visitor, gen);
    });
  }

  /** Brief dwell, then continue wandering. */
  function _dwellThenWander(visitor, gen) {
    const dwell = CONFIG.visitorDwellMs.min +
      Math.random() * (CONFIG.visitorDwellMs.max - CONFIG.visitorDwellMs.min);
    setTimeout(() => {
      if (_generation !== gen) return;
      _wanderLoop(visitor, gen);
    }, dwell);
  }

  /** Update the visitor count display in the top bar. */
  function _updateVisitorCount() {
    const el = document.getElementById('visitor-count');
    if (!el) return;
    const wandering = _visitors.filter(v =>
      v.state !== 'waitingForTrain' && v.state !== 'boarding' && v.state !== 'exited'
    ).length;
    el.textContent = wandering > 0 ? `(${wandering} exploring)` : '';
  }

  /** Mark visitor as waiting for the train (stop wandering). */
  function _sendToExit(visitor, gen) {
    if (_generation !== gen) return;
    Reactions.exitHappy(visitor);
    visitor.state = 'waitingForTrain';
    _exitedCount++;
    _updateVisitorCount();

    // When all visitors are waiting, start the collection train
    if (_exitedCount >= _visitors.length) {
      _beginCollection(gen);
    }
  }

  /** Run the collection train through all rooms, picking up visitors. */
  function _beginCollection(gen) {
    if (_generation !== gen) return;
    _state = 'trainDeparting';

    Train.animateCollection(
      // onRoomReached: board visitors in this room
      (roomId) => {
        if (_generation !== gen) return;
        const trackPos = House.getRoomCentre(roomId);
        if (!trackPos) return;

        // Find visitors waiting in this room
        const inRoom = _visitors.filter(v =>
          v.currentRoom === roomId && v.state === 'waitingForTrain'
        );
        for (const visitor of inRoom) {
          visitor.state = 'boarding';
          Visitor.boardTrain(visitor, trackPos, () => {
            Visitor.remove(visitor);
          });
        }
      },
      // onComplete: train has left, show summary
      () => {
        if (_generation !== gen) return;
        // Remove any remaining visitors (edge cases)
        for (const v of _visitors) Visitor.remove(v);
        _showSummary(gen);
      }
    );
  }

  /** Display wave summary overlay with visual breakdown. */
  function _showSummary(gen) {
    if (_generation !== gen) return;
    _state = 'summary';
    const countEl = document.getElementById('visitor-count');
    if (countEl) countEl.textContent = '';

    const totalVisitors = _visitors.length;
    /* Count unique visitors scared (not scare events) for display + wave bonus */
    const scaredVisitors = _visitors.filter(v => v.scareCount > 0).length;
    const scarePct = totalVisitors > 0 ? scaredVisitors / totalVisitors : 0;
    const hitBonus = scarePct >= CONFIG.scoring.waveBonusThreshold;
    const bonusPoints = hitBonus ? CONFIG.scoring.waveBonus : 0;

    /* Variety bonus (only when monster lab is unlocked) */
    const hasLab = GameState.get('monsterLab');
    const typesUnlocked = hasLab ? GameState.get('monsterTypes').length : 0;
    const typesUsedCount = _typesUsed.size;
    const varietyPoints = hasLab ? typesUsedCount * CONFIG.scoring.varietyPerType : 0;
    const allTypesUsed = typesUnlocked > 0 && typesUsedCount >= typesUnlocked;
    const varietyCoin = allTypesUsed ? 1 : 0;

    const totalPoints = _waveScore + bonusPoints + varietyPoints;
    const coinsEarned = CONFIG.coinsPerWave + (hitBonus ? CONFIG.coinsBonusWave : 0) + varietyCoin;

    /* Build visual summary HTML */
    const ci = CONFIG.creatureIcons;
    const mi = CONFIG.monsterIcons;

    /* scared row: one 😱 per visitor, with ×N for repeat scares */
    const faces = _visitors.map(v => {
      if (v.scareCount <= 0) return '';
      const mult = v.scareCount > 1 ? `<span class="wave-summary__mult">×${v.scareCount}</span>` : '';
      return `<span class="wave-summary__face">😱${mult}</span>`;
    }).filter(Boolean).join('');
    const scaredRow = `<div class="wave-summary__row">
      ${faces || '<span class="wave-summary__faces">—</span>'}
      <span class="wave-summary__label">${scaredVisitors}/${totalVisitors} scared</span>
    </div>`;

    /* deployed row: creature+type emoji pairs */
    let deployedRow = '';
    if (_deployments.length) {
      const pairs = _deployments.map(d =>
        `<span class="wave-summary__pair">${ci[d.creature] || '?'}${mi[d.monsterType] || ''}</span>`
      ).join('');
      deployedRow = `<div class="wave-summary__row">${pairs}</div>`;
    }

    /* variety row (only with monster lab) */
    let varietyRow = '';
    if (hasLab) {
      const typeEmojis = [..._typesUsed].map(t =>
        `<span class="wave-summary__type-icon">${mi[t] || t}</span>`
      ).join('');
      const tag = allTypesUsed
        ? '<span class="wave-summary__variety">VARIETY!</span>'
        : '';
      varietyRow = `<div class="wave-summary__row">${typeEmojis} ${tag}</div>`;
    }

    /* score breakdown */
    const lines = [`Score: +${_waveScore}`];
    if (varietyPoints) lines.push(`Variety: +${varietyPoints}`);
    if (bonusPoints) lines.push(`Wave bonus: +${bonusPoints}`);
    lines.push(`Coins: +${coinsEarned}`);
    const scoreRows = lines.map(l =>
      `<div class="wave-summary__stat">${l}</div>`
    ).join('');

    const overlay = document.getElementById('wave-summary');
    const content = overlay ? overlay.querySelector('.wave-summary__content') : null;
    if (content) {
      content.innerHTML = `
        <div class="wave-summary__title">Wave ${_waveNum} Complete</div>
        ${scaredRow}
        ${deployedRow}
        ${varietyRow}
        ${scoreRows}
        ${hitBonus ? '<div class="wave-summary__bonus">Wave bonus!</div>' : ''}
        ${allTypesUsed ? '<div class="wave-summary__bonus">All types used!</div>' : ''}
      `;
    }
    if (overlay) overlay.classList.remove('overlay--hidden');

    Audio.play('waveEnd');
    if (hitBonus || allTypesUsed) Audio.play('coin');

    // Award coins (triggers unlock check)
    Progress.addCoins(coinsEarned);

    // Dismiss on tap
    function dismiss(e) {
      if (e) e.preventDefault();
      if (overlay) overlay.classList.add('overlay--hidden');
      overlay.removeEventListener('click', dismiss);
      overlay.removeEventListener('touchend', dismiss);
      _state = 'idle';
      ScareFactory.clearAll();
      Picker.cleanup();
      if (_onComplete) _onComplete({ totalPoints, coinsEarned, hitBonus });
    }
    if (overlay) {
      overlay.addEventListener('click', dismiss);
      overlay.addEventListener('touchend', dismiss);
    }
  }

  /** Update the score display with wave-local points as they accumulate. */
  function _updateScore() {
    const el = document.getElementById('score-value');
    if (!el) return;
    // Game._totalScore is not accessible here, so update relative to wave start
    const base = parseInt(el.dataset.waveBase || el.textContent || '0');
    el.textContent = base + _waveScore;
  }

  /** Pick a random element from an array. */
  function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Register wave completion handler. */
  function onComplete(callback) { _onComplete = callback; }

  /** Abort the current wave (reset). */
  function reset() {
    _generation++;
    _state = 'idle';
    Train.stop();
    for (const v of _visitors) Visitor.remove(v);
    _visitors = [];
    ScareFactory.clearAll();
    Picker.cleanup();
  }

  /** Return current wave state. */
  function getState() { return _state; }

  return { start, reset, onComplete, getState };
})();
