/**
 * Progress — localStorage persistence, coin tracking, unlock detection, fanfare.
 * Reads UNLOCK_TIERS from config.js. Delegates unlock effects to GameState.
 */
const Progress = (() => {
  const STORAGE_KEY = 'hauntedHouse_progress';
  let coins = 0;
  let unlocked = [];       // threshold values already unlocked, e.g. [5, 10]
  let _showcaseTier = null; // tier to force-spawn on next wave (one-shot)

  /** Load saved state from localStorage and apply unlocks. */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        coins = data.coins || 0;
        unlocked = data.unlocked || [];
      }
    } catch { /* corrupt data — start fresh */ }

    // Ghost key — ?ghostkey unlocks everything, ?ghostkey=N sets coins to N
    const params = new URLSearchParams(location.search);
    if (params.has('ghostkey')) {
      const val = params.get('ghostkey');
      coins = val ? Math.max(0, parseInt(val, 10) || 0) : 999;
      unlocked = UNLOCK_TIERS.filter(t => t.coins <= coins).map(t => t.coins);
      _save();
    }

    applyUnlocks();
    renderPreview();
    _updateCoinDisplay();
  }

  /** Persist current state to localStorage. */
  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins, unlocked }));
    } catch { /* storage full — silent fail */ }
  }

  /** Apply all unlocked tiers to GameState. */
  function applyUnlocks() {
    for (const tier of UNLOCK_TIERS) {
      if (!unlocked.includes(tier.coins)) continue;
      GameState.applyTier(tier);
    }
  }

  /** Add coins, persist, check for new tier unlocks. */
  function addCoins(n) {
    const prevCoins = coins;
    coins += n;
    _save();

    // Check each tier — may cross multiple at once
    for (const tier of UNLOCK_TIERS) {
      if (unlocked.includes(tier.coins)) continue;
      if (coins >= tier.coins && prevCoins < tier.coins) {
        unlocked.push(tier.coins);
        _save();
        applyUnlocks();
        _showcaseTier = tier;
        showFanfare(tier);
      }
    }
    renderPreview();
    _updateCoinDisplay();
  }

  /** Return current coin count. */
  function getCoins() { return coins; }

  /** Wipe all progress — coins, unlocks, localStorage. */
  function resetAll() {
    coins = 0;
    unlocked = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* silent */ }
    GameState.reset();
    renderPreview();
    _updateCoinDisplay();
  }

  /** Update the progress count display. */
  function _updateCoinDisplay() {
    const el = document.getElementById('progress-count');
    if (el) el.textContent = coins;
  }

  /* ─── Preview widget ─── */

  /** Update the unlock preview DOM with next tier icon + progress bar. */
  function renderPreview() {
    const el = document.getElementById('unlock-preview');
    if (!el) return;

    const next = UNLOCK_TIERS.find(t => !unlocked.includes(t.coins));
    if (!next) {
      el.innerHTML = '<div class="unlock-preview__icon">🏆</div>';
      return;
    }

    const prevTier = UNLOCK_TIERS.slice().reverse().find(t => unlocked.includes(t.coins));
    const prevCoinsThreshold = prevTier ? prevTier.coins : 0;
    const range = next.coins - prevCoinsThreshold;
    const progress = coins - prevCoinsThreshold;
    const pct = Math.min(progress / range * 100, 100);

    el.innerHTML = `
      <div class="unlock-preview__icon">${next.icon}</div>
      <div class="unlock-preview__bar">
        <div class="unlock-preview__fill" style="width:${pct}%"></div>
      </div>
      <div class="unlock-preview__target">${progress}/${range}</div>
    `;

    // Also update the main progress bar fill
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = pct + '%';
  }

  /* ─── Fanfare overlay ─── */

  /** Show a full-screen celebration when a tier is unlocked. */
  function showFanfare(tier) {
    const overlay = document.getElementById('unlock-fanfare');
    if (!overlay) return;

    overlay.querySelector('.unlock-fanfare__icon').textContent = tier.icon;
    overlay.querySelector('.unlock-fanfare__label').textContent = tier.label;

    overlay.classList.remove('overlay--hidden');
    overlay.classList.add('unlock-fanfare--active');
    Audio.play('fanfare');

    function dismiss() {
      overlay.classList.add('overlay--hidden');
      overlay.classList.remove('unlock-fanfare--active');
      overlay.removeEventListener('click', dismiss);
      overlay.removeEventListener('touchend', dismiss);
    }
    overlay.addEventListener('click', dismiss);
    overlay.addEventListener('touchend', dismiss);
    setTimeout(dismiss, 2500);
  }

  /** Return pending showcase tier and clear it (one-shot). */
  function consumeShowcase() {
    const tier = _showcaseTier;
    _showcaseTier = null;
    return tier;
  }

  return { load, addCoins, getCoins, resetAll, renderPreview, consumeShowcase };
})();
