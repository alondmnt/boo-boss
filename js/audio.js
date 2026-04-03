/**
 * Audio — Web Audio synthesis, sound catalogue.
 * All sounds are synthesised (no audio files). Lazy AudioContext initialisation
 * on first user gesture. Same pattern as car-doctor.
 */
const Audio = (() => {
  let ctx = null;
  let unlocked = false;
  let muted = false;

  /** Initialise AudioContext on first user gesture. */
  function unlock() {
    if (unlocked) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    unlocked = true;
  }

  /**
   * Schedule a note with click-free envelope.
   * @param {number} freq - frequency in Hz
   * @param {number} start - delay from now in seconds
   * @param {number} dur - duration in seconds
   * @param {string} type - oscillator type (sine, square, triangle, sawtooth)
   * @param {number} vol - peak volume (0-1)
   */
  function _note(freq, start, dur, type, vol) {
    if (!ctx) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    // Soft 5ms attack to avoid clicks
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol || 0.12, t + 0.005);
    // Smooth exponential decay
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  /** Generate a short burst of filtered noise. */
  function _noise(start, dur, freq, vol) {
    if (!ctx) return;
    const t = ctx.currentTime + start;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol || 0.08, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
  }

  /* ─── Effects catalogue ─── */

  const effects = {
    /** Creature deployment — quick spooky whoosh. */
    deploy() {
      _note(200, 0, 0.15, 'sine', 0.12);
      _note(150, 0.05, 0.2, 'triangle', 0.08);
    },

    /** Scare success — descending tritone (the devil's interval). */
    scare() {
      _note(440, 0, 0.08, 'square', 0.10);
      _note(311, 0.06, 0.15, 'square', 0.10);
    },

    /** Hug — warm ascending major third. */
    hug() {
      _note(330, 0, 0.15, 'sine', 0.15);
      _note(415, 0.1, 0.2, 'sine', 0.15);
    },

    /** Wave start — train whistle (two harmonics). */
    waveStart() {
      _note(600, 0, 0.3, 'triangle', 0.12);
      _note(900, 0, 0.3, 'triangle', 0.06);
    },

    /** Wave end — descending 3-note resolve. */
    waveEnd() {
      _note(392, 0, 0.12, 'sine', 0.15);
      _note(330, 0.12, 0.12, 'sine', 0.15);
      _note(262, 0.24, 0.2, 'sine', 0.15);
    },

    /** Coin collected — bright pling. */
    coin() {
      _note(800, 0, 0.08, 'sine', 0.12);
      _note(1200, 0.06, 0.1, 'sine', 0.08);
    },

    /** Unlock fanfare — ascending C major arpeggio + vibrato final note. */
    fanfare() {
      _note(262, 0, 0.12, 'sine', 0.15);
      _note(330, 0.12, 0.12, 'sine', 0.15);
      _note(392, 0.24, 0.12, 'sine', 0.15);
      // Final note with vibrato
      if (!ctx) return;
      const t = ctx.currentTime + 0.36;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 523;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + 0.3);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    },

    /** Room occupied — soft error buzz. */
    occupied() {
      _note(150, 0, 0.1, 'sawtooth', 0.06);
    },

    /** Creature expired (dematerialised) — descending fade. */
    expire() {
      _note(300, 0, 0.1, 'sine', 0.08);
      _note(200, 0.08, 0.15, 'sine', 0.06);
    },

    /** Train chug — filtered noise burst. */
    trainChug() {
      _noise(0, 0.08, 400, 0.08);
    },
  };

  /**
   * Play a named sound effect.
   * @param {string} name - key from the effects catalogue
   */
  function play(name) {
    if (!unlocked || muted) return;
    if (effects[name]) effects[name]();
  }

  /** Return whether audio is muted. */
  function isMuted() { return muted; }

  /** Set mute state. */
  function setMuted(v) { muted = v; }

  return { unlock, play, isMuted, setMuted };
})();
