/**
 * Game — top-level state machine, coordinates all modules.
 * States: splash -> playing (endless).
 * Entry point: Game.init() on DOMContentLoaded.
 */
const Game = (() => {
  let _currentWave = 0;
  let _totalScore = 0;

  /** Initialise all modules, bind UI events. */
  function init() {
    House.init(document.getElementById('house-container'));
    Train.init(House.getSvg());
    Picker.init(document.getElementById('scare-panel'));

    Progress.load();
    _syncRoomVisuals();
    _syncClosedRoomVisuals();
    Train.setCartSkin(GameState.getTrainSkin());
    Train.extendTrack();
    Picker.render();
    TrackEditor.init();

    // Resume AudioContext on any interaction (recovers from device sleep)
    document.addEventListener('click', () => Audio.resume(), true);
    document.addEventListener('touchend', () => Audio.resume(), true);

    // Splash screen: tap to start (unlocks AudioContext)
    const splash = document.getElementById('splash');
    const ghostEl = splash.querySelector('.splash__icon');
    let ghostTaps = 0;
    let ghostTimer = null;

    function doStart() {
      splash.removeEventListener('click', startHandler);
      splash.removeEventListener('touchend', startHandler);
      ghostEl.removeEventListener('click', ghostHandler);
      ghostEl.removeEventListener('touchend', ghostHandler);
      if (ghostTimer) { clearTimeout(ghostTimer); ghostTimer = null; }
      _start();
    }

    function startHandler(e) {
      e.preventDefault();
      doStart();
    }

    // Easter egg: three taps on the ghost icon within 2s preload all tiers.
    // Ghost taps block splash propagation so the sequence can complete; a
    // half-finished sequence (1 or 2 taps) auto-starts after the window.
    function ghostHandler(e) {
      e.preventDefault();
      e.stopPropagation();
      ghostTaps++;
      ghostEl.classList.remove('splash__icon--wiggle');
      void ghostEl.offsetWidth;  // force reflow so the animation restarts
      ghostEl.classList.add('splash__icon--wiggle');

      if (ghostTaps >= 3) {
        Progress.maxOut();
        _syncRoomVisuals();
        Train.extendTrack();
        Picker.render();
        doStart();
        return;
      }
      if (ghostTimer) clearTimeout(ghostTimer);
      ghostTimer = setTimeout(doStart, 2000);
    }

    ghostEl.addEventListener('click', ghostHandler);
    ghostEl.addEventListener('touchend', ghostHandler);
    splash.addEventListener('click', startHandler);
    splash.addEventListener('touchend', startHandler);

    // Reset button: short tap = restart wave, long-press 2s = wipe all progress
    const resetBtn = document.getElementById('reset-btn');
    let resetTimer = null;
    resetBtn.addEventListener('pointerdown', () => {
      resetTimer = setTimeout(() => {
        resetTimer = 'fired';
        _fullReset();
      }, 2000);
    });
    resetBtn.addEventListener('pointerup', () => {
      if (resetTimer === 'fired') { resetTimer = null; return; }
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
      _restartWave();
    });
    // Cancel long-press if pointer leaves button
    resetBtn.addEventListener('pointerleave', () => {
      if (resetTimer && resetTimer !== 'fired') {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
    });

    // Sound toggle
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
      Audio.setMuted(!Audio.isMuted());
      soundBtn.textContent = Audio.isMuted() ? '🔇' : '🔊';
    });

    // Leaderboard button
    const lbBtn = document.getElementById('leaderboard-btn');
    if (lbBtn) lbBtn.addEventListener('click', _showLeaderboard);
  }

  /** Sync room visuals with GameState (unlock rooms that are unlocked in state). */
  function _syncRoomVisuals() {
    const rooms = GameState.get('rooms');
    const baseRooms = CONFIG.rooms;
    for (const [id, def] of Object.entries(rooms)) {
      if (baseRooms[id].locked && !def.locked) {
        House.unlockRoom(id);
      }
    }
  }

  /** Sync closed-tonight visuals from persisted rollercoaster state. */
  function _syncClosedRoomVisuals() {
    const closed = GameState.getClosedRooms();
    for (const id of Object.keys(CONFIG.rooms)) {
      House.setRoomVisualClosed(id, closed.has(id));
    }
  }

  /** Start the game from splash screen. */
  function _start() {
    Audio.unlock();
    Audio.startMusic();
    const splash = document.getElementById('splash');
    splash.classList.add('splash--hidden');

    Progress.newRun();
    _currentWave = 0;
    _totalScore = 0;
    _updateScoreDisplay();
    _startWave(1);
  }

  /** Start a wave. */
  function _startWave(n) {
    _currentWave = n;
    const waveEl = document.getElementById('wave-value');
    if (waveEl) waveEl.textContent = n;

    Wave.start(n, _totalScore);
    Wave.onComplete((results) => {
      _totalScore += results.totalPoints;
      _updateScoreDisplay();
      _syncRoomVisuals();
      Train.extendTrack();
      Picker.render();

      setTimeout(() => _startWave(n + 1), 1000);
    });
  }

  /** Restart the current wave. */
  function _restartWave() {
    Wave.reset();
    _startWave(_currentWave);
  }

  /** Full progress reset. */
  function _fullReset() {
    Wave.reset();
    Progress.resetAll();
    Progress.newRun();
    Picker.render();
    _totalScore = 0;
    _updateScoreDisplay();

    // Re-init house and train (rooms may have changed)
    House.init(document.getElementById('house-container'));
    Train.init(House.getSvg());

    _startWave(1);
  }

  /** Show leaderboard overlay. */
  function _showLeaderboard() {
    const board = Progress.getLeaderboard();
    const overlay = document.getElementById('wave-summary');
    const content = overlay ? overlay.querySelector('.wave-summary__content') : null;
    if (!content || !overlay.classList.contains('overlay--hidden')) return;

    const boardRows = _renderBoard(board, -1);
    content.innerHTML = `
      <div class="wave-summary__title">Leaderboard</div>
      ${boardRows || '<div class="wave-summary__stat">no scores yet</div>'}
      <div class="wave-summary__stat wave-summary__tap">tap to close</div>
    `;
    overlay.classList.remove('overlay--hidden');

    function dismiss(e) {
      e.preventDefault();
      overlay.classList.add('overlay--hidden');
      overlay.removeEventListener('click', dismiss);
      overlay.removeEventListener('touchend', dismiss);
    }
    overlay.addEventListener('click', dismiss);
    overlay.addEventListener('touchend', dismiss);
  }

  /** Render leaderboard rows HTML. Highlights the row at currentRank. */
  function _renderBoard(board, currentRank) {
    if (!board.length) return '';
    return '<div class="leaderboard">' + board.map((entry, i) => {
      const isCurrent = i === currentRank;
      const cls = isCurrent ? ' leaderboard__row--current' : '';
      const marker = isCurrent && i === 0 ? ' <span class="leaderboard__best">new best!</span>' : '';
      return `<div class="leaderboard__row${cls}">
        <span class="leaderboard__rank">${i + 1}.</span>
        <span class="leaderboard__score">${entry.score}</span>
        <span class="leaderboard__date">${entry.date}</span>${marker}
      </div>`;
    }).join('') + '</div>';
  }

  /** Update the score display. */
  function _updateScoreDisplay() {
    const el = document.getElementById('score-value');
    if (el) el.textContent = _totalScore;
  }

  /** Get the render board function for wave summary use. */
  function renderBoard(board, rank) { return _renderBoard(board, rank); }

  return { init, renderBoard };
})();

document.addEventListener('DOMContentLoaded', Game.init);
