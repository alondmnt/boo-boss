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
  let _hugCount = 0;
  let _typesUsed = new Set();
  let _creaturesUsed = new Set();
  let _actionsUsed = new Set();
  let _deployments = [];
  let _runningTotal = 0;

  /**
   * Start a new wave.
   * @param {number} waveNum - wave number (1-based)
   * @param {number} runningTotal - total score before this wave
   */
  function start(waveNum, runningTotal) {
    _runningTotal = runningTotal || 0;
    const gen = ++_generation;
    _waveNum = waveNum;
    _state = 'trainArriving';
    _visitors = [];
    _exitedCount = 0;
    _waveScore = 0;
    _scaredVisitorCount = 0;
    _hugCount = 0;
    _typesUsed = new Set();
    _creaturesUsed = new Set();
    _actionsUsed = new Set();
    _deployments = [];

    // Wire up Picker deploy handler for this wave
    Picker.setDeployHandler((creatureType, roomId, monsterType, action) => {
      _handleDeploy(creatureType, roomId, gen, monsterType, action);
    });

    // Generate visitors
    const count = CONFIG.waveSizing.base + Math.floor(waveNum * CONFIG.waveSizing.perWave);
    const creaturePool = GameState.get('creatures');
    if (!creaturePool || creaturePool.length === 0) return;

    // Check for showcase tier (force one visitor to fear a newly unlocked creature)
    const showcase = Progress.consumeShowcase();

    // Biased sampling: at higher waves, visitors tend to love what others fear,
    // creating deploy dilemmas (scare some visitors but risk hugs from others).
    const diff = CONFIG.difficulty;
    const biasP = waveNum >= diff.biasStartWave
      ? Math.min(diff.biasBaseP + (waveNum - diff.biasStartWave) * diff.biasPerWave, diff.biasMaxP)
      : 0;

    // Pass 1: assign fears randomly
    const fears = [];
    for (let i = 0; i < count; i++) fears.push(_randomFrom(creaturePool));

    // Pass 2: assign loves, optionally biased toward other visitors' fears
    for (let i = 0; i < count; i++) {
      let love;
      const otherFears = fears.filter((f, j) => j !== i && f !== fears[i]);

      if (biasP > 0 && otherFears.length > 0 && Math.random() < biasP) {
        love = _randomFrom(otherFears);
      } else {
        love = _randomFrom(creaturePool);
        if (creaturePool.length > 1) {
          while (love === fears[i]) love = _randomFrom(creaturePool);
        }
      }

      _visitors.push(Visitor.create(fears[i], love));
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
  function _handleDeploy(creatureType, roomId, gen, monsterType, action) {
    if (_generation !== gen) return;

    const creature = ScareFactory.deploy(creatureType, roomId, (expired) => {
      // onExpire callback: re-enable picker slot
      if (_generation !== gen) return;
      Picker.enableSlot(expired.type);
    }, monsterType, action);

    if (creature) {
      Picker.disableSlot(creatureType, creature.lifetime);
      _typesUsed.add(creature.monsterType);
      _creaturesUsed.add(creatureType);
      if (creature.action) _actionsUsed.add(creature.action);
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
    // Mark visitor as ready to leave once they've visited enough rooms,
    // but keep them wandering in place (still scareable until train arrives).
    if (visitor.roomsVisited >= visitor._maxVisits && !visitor._readyToLeave) {
      visitor._readyToLeave = true;
      _exitedCount++;
      _updateVisitorCount();
      if (_exitedCount >= _visitors.length) {
        _beginCollection(gen);
      }
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
          Particles.scoreFloat(creature.el, `+${result.points}`, 'particle--score');
          Reactions.scared(visitor, creature, () => {
            visitor._scared = false;
            if (_generation !== gen) return;
            if (visitor._readyToLeave) {
              _dwellThenWander(visitor, gen);
            } else {
              _fleeFromScare(visitor, gen);
            }
          });
          return;
        } else if (result.result === 'hugBlock') {
          // Ghost: hug blocked this encounter (rolled fresh on every visit)
          Particles.scoreFloat(creature.el, '🛡️', 'particle--hug-float');
          // Fall through to normal movement below
        } else if (result.result === 'hugResist') {
          // Vampire: hug resisted, creature survives, visitor gets half-scare
          visitor._scared = true;
          const resistPoints = CONFIG.scoring.vampireResistPoints;
          _waveScore += resistPoints;
          _scaredVisitorCount++;
          _updateScore();
          Particles.scoreFloat(creature.el, '🛡️+' + resistPoints, 'particle--score');
          Reactions.scared(visitor, creature, () => {
            visitor._scared = false;
            if (_generation !== gen) return;
            if (visitor._readyToLeave) {
              _dwellThenWander(visitor, gen);
            } else {
              _fleeFromScare(visitor, gen);
            }
          });
          return;
        } else if (result.result === 'loved') {
          visitor._scared = true;
          _hugCount++;
          Particles.scoreFloat(creature.el, '🫂', 'particle--hug-float');
          Reactions.hugged(visitor, creature, () => {
            ScareFactory.clearRoom(creature.roomId);
            Creatures.remove(creature);
            Picker.enableSlot(creature.type);
            visitor._scared = false;
            if (_generation !== gen) return;
            if (visitor._readyToLeave) {
              _dwellThenWander(visitor, gen);
            } else {
              _moveToNextRoom(visitor, gen);
            }
          });
          return;
        }
      }

      // No encounter (or neutral): move to next room or stay in place
      if (visitor._readyToLeave) {
        _dwellThenWander(visitor, gen);
      } else {
        _moveToNextRoom(visitor, gen);
      }
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
      v.state !== 'waitingForTrain' && v.state !== 'boarding' && v.state !== 'exited' &&
      !v._readyToLeave
    ).length;
    el.textContent = wandering > 0 ? `(${wandering} exploring)` : '';
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

        // Stop wandering and board all visitors in this room
        const inRoom = _visitors.filter(v =>
          v.currentRoom === roomId &&
          v.state !== 'boarding' && v.state !== 'exited'
        );
        for (const visitor of inRoom) {
          Reactions.exitHappy(visitor);
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

  /**
   * Calculate wave scoring: points, bonuses, coins.
   * Pure function - no DOM or side effects.
   *
   * Variety axes: types (gated on monsterLab), creatures (gated on roster ≥
   * creatureFullCastMin), actions (gated on directorsChair). Each used unit
   * scores varietyPerUnit. One +1 coin is awarded per active axis that
   * reaches full cast in the wave (independent across axes).
   */
  function _calcScore(visitors, waveScore, hugCount, deployments, typesUsed, creaturesUsed, actionsUsed) {
    const totalVisitors = visitors.length;
    const scaredVisitors = visitors.filter(v => v.scareCount > 0).length;
    const scarePct = totalVisitors > 0 ? scaredVisitors / totalVisitors : 0;
    const hitBonus = scarePct >= CONFIG.scoring.waveBonusThreshold;
    const bonusPoints = hitBonus ? CONFIG.scoring.waveBonus : 0;

    const noHugs = hugCount === 0 && deployments.length > 0;
    const noHugPoints = noHugs ? CONFIG.scoring.noHugBonus : 0;

    const perUnit = CONFIG.scoring.varietyPerUnit;
    const _axis = (active, unlockedCount, usedSet) => {
      const usedCount = usedSet.size;
      return {
        active,
        unlocked: unlockedCount,
        usedCount,
        points: active ? usedCount * perUnit : 0,
        fullCast: active && unlockedCount > 0 && usedCount >= unlockedCount,
      };
    };

    const creaturesUnlocked = GameState.get('creatures').length;
    const hasLab = GameState.get('monsterLab');
    const hasChair = GameState.get('directorsChair');

    const variety = {
      creatures: _axis(creaturesUnlocked >= CONFIG.scoring.creatureFullCastMin, creaturesUnlocked, creaturesUsed),
      types: _axis(hasLab, hasLab ? GameState.get('monsterTypes').length : 0, typesUsed),
      actions: _axis(hasChair, hasChair ? GameState.get('actions').length : 0, actionsUsed),
    };
    const activeAxes = Object.values(variety).filter(a => a.active);
    const varietyPoints = activeAxes.reduce((sum, a) => sum + a.points, 0);
    const varietyCoins = activeAxes.filter(a => a.fullCast).length;

    const totalPoints = waveScore + bonusPoints + noHugPoints + varietyPoints;
    const coinsEarned = CONFIG.coinsPerWave + (hitBonus ? CONFIG.coinsBonusWave : 0) + varietyCoins;

    return {
      totalVisitors, scaredVisitors, hitBonus, bonusPoints,
      noHugs, noHugPoints,
      variety, varietyPoints, varietyCoins,
      totalPoints, coinsEarned,
    };
  }

  /** Display wave summary overlay with visual breakdown. */
  function _showSummary(gen) {
    if (_generation !== gen) return;
    _state = 'summary';
    const countEl = document.getElementById('visitor-count');
    if (countEl) countEl.textContent = '';

    const s = _calcScore(_visitors, _waveScore, _hugCount, _deployments, _typesUsed, _creaturesUsed, _actionsUsed);
    const mi = CONFIG.monsterIcons;
    const ci = CONFIG.creatureIcons;
    const ai = CONFIG.actionIcons;

    /* scared row: faces + inline score */
    const faces = _visitors.map(v => {
      if (v.scareCount <= 0) return '';
      const mult = v.scareCount > 1 ? `<span class="wave-summary__mult">×${v.scareCount}</span>` : '';
      return `<span class="wave-summary__face">😱${mult}</span>`;
    }).filter(Boolean).join('');
    const scaredRow = `<div class="wave-summary__row">
      ${faces || '<span class="wave-summary__faces">—</span>'}
      <span class="wave-summary__label">${s.scaredVisitors}/${s.totalVisitors} scared</span>
      <span class="wave-summary__points">+${_waveScore}</span>
    </div>`;

    /* hug row: show hug count, or no-hug bonus */
    let hugRow = '';
    if (s.noHugs) {
      hugRow = `<div class="wave-summary__row">
        <span class="wave-summary__bonus">No hugs!</span>
        <span class="wave-summary__points">+${s.noHugPoints}</span>
      </div>`;
    } else if (_hugCount > 0) {
      const hearts = Array(_hugCount).fill('<span class="wave-summary__face">🫂</span>').join('');
      hugRow = `<div class="wave-summary__row">
        ${hearts}
        <span class="wave-summary__label">${_hugCount} hugged</span>
      </div>`;
    }

    /* variety rows — one per active axis */
    const _varietyRow = (axis, used, iconMap, label) => {
      if (!axis.active) return '';
      const icons = [...used].map(k =>
        `<span class="wave-summary__type-icon">${iconMap[k] || k}</span>`
      ).join('');
      const tag = axis.fullCast ? ' <span class="wave-summary__variety">FULL CAST!</span>' : '';
      return `<div class="wave-summary__row">
        ${icons}
        <span class="wave-summary__label">${axis.usedCount}/${axis.unlocked} ${label}</span>${tag}
        <span class="wave-summary__points">+${axis.points}</span>
      </div>`;
    };

    const creaturesRow = _varietyRow(s.variety.creatures, _creaturesUsed, ci, 'creatures');
    const typesRow = _varietyRow(s.variety.types, _typesUsed, mi, 'types');
    const actionsRow = _varietyRow(s.variety.actions, _actionsUsed, ai, 'actions');

    /* wave bonus row */
    const bonusRow = s.hitBonus
      ? `<div class="wave-summary__row">
          <span class="wave-summary__bonus">Wave bonus!</span>
          <span class="wave-summary__points">+${s.bonusPoints}</span>
        </div>`
      : '';

    /* coins row */
    const coinsRow = `<div class="wave-summary__row wave-summary__coins">
      Coins: +${s.coinsEarned}
    </div>`;

    /* leaderboard check */
    const projectedTotal = _runningTotal + s.totalPoints;
    const rank = Progress.submitScore(projectedTotal);
    const board = Progress.getLeaderboard();
    let leaderboardRow = '';
    if (rank >= 0) {
      leaderboardRow = `<hr class="wave-summary__divider">
        ${Game.renderBoard(board, rank)}`;
    }

    const overlay = document.getElementById('wave-summary');
    const content = overlay ? overlay.querySelector('.wave-summary__content') : null;
    if (content) {
      content.innerHTML = `
        <div class="wave-summary__title">Wave ${_waveNum} Complete</div>
        ${scaredRow}
        ${hugRow}
        ${creaturesRow}
        ${typesRow}
        ${actionsRow}
        ${bonusRow}
        <hr class="wave-summary__divider">
        ${coinsRow}
        ${leaderboardRow}
      `;
    }
    if (overlay) overlay.classList.remove('overlay--hidden');

    Audio.play('waveEnd');
    if (s.hitBonus || s.noHugs || s.varietyCoins > 0) Audio.play('coin');

    // Award coins (triggers unlock check)
    Progress.addCoins(s.coinsEarned);

    // Dismiss on tap
    function dismiss(e) {
      if (e) e.preventDefault();
      if (overlay) overlay.classList.add('overlay--hidden');
      overlay.removeEventListener('click', dismiss);
      overlay.removeEventListener('touchend', dismiss);
      _state = 'idle';
      ScareFactory.clearAll();
      Picker.cleanup();
      if (_onComplete) _onComplete({ totalPoints: s.totalPoints, coinsEarned: s.coinsEarned, hitBonus: s.hitBonus });
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
