/**
 * Game — top-level state machine, coordinates all modules.
 * States: splash -> playing -> gameOver.
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
    Train.extendTrack();
    Picker.render();

    // Splash screen: tap to start (unlocks AudioContext)
    const splash = document.getElementById('splash');
    function startHandler(e) {
      e.preventDefault();
      splash.removeEventListener('click', startHandler);
      splash.removeEventListener('touchend', startHandler);
      _start();
    }
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

  /** Start the game from splash screen. */
  function _start() {
    Audio.unlock();
    const splash = document.getElementById('splash');
    splash.classList.add('splash--hidden');

    _currentWave = 0;
    _totalScore = 0;
    _updateScoreDisplay();
    _startWave(1);
  }

  /** Start a wave. */
  function _startWave(n) {
    _currentWave = n;
    const waveEl = document.getElementById('wave-value');
    const endlessMode = GameState.get('endlessMode');
    if (waveEl) {
      waveEl.textContent = endlessMode ? n : `${n}/${CONFIG.totalWaves}`;
    }

    Wave.start(n);
    Wave.onComplete((results) => {
      _totalScore += results.totalPoints;
      _updateScoreDisplay();
      _syncRoomVisuals();
      Train.extendTrack();
      Picker.render();

      const maxWaves = GameState.get('endlessMode') ? Infinity : CONFIG.totalWaves;
      if (n >= maxWaves) {
        _showGameOver();
      } else {
        setTimeout(() => _startWave(n + 1), 1000);
      }
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
    Picker.render();
    _totalScore = 0;
    _updateScoreDisplay();

    // Re-init house and train (rooms may have changed)
    House.init(document.getElementById('house-container'));
    Train.init(House.getSvg());

    _startWave(1);
  }

  /** Show game over overlay. */
  function _showGameOver() {
    const overlay = document.getElementById('wave-summary');
    const content = overlay ? overlay.querySelector('.wave-summary__content') : null;
    if (content) {
      content.innerHTML = `
        <div class="wave-summary__title">Game Over</div>
        <div class="wave-summary__stat">Final Score: ${_totalScore}</div>
        <div class="wave-summary__stat">Coins Earned: ${Progress.getCoins()}</div>
        <div class="wave-summary__stat">Tap to play again</div>
      `;
    }
    if (overlay) overlay.classList.remove('overlay--hidden');

    Audio.play('waveEnd');

    function restart(e) {
      e.preventDefault();
      overlay.classList.add('overlay--hidden');
      overlay.removeEventListener('click', restart);
      overlay.removeEventListener('touchend', restart);
      _totalScore = 0;
      _updateScoreDisplay();
      _startWave(1);
    }
    if (overlay) {
      overlay.addEventListener('click', restart);
      overlay.addEventListener('touchend', restart);
    }
  }

  /** Update the score display. */
  function _updateScoreDisplay() {
    const el = document.getElementById('score-value');
    if (el) el.textContent = _totalScore;
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
