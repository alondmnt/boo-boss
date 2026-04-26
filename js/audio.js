/**
 * Audio — Web Audio synthesis, sound catalogue, background music.
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
   * Resume a suspended AudioContext (e.g. after device sleep) and
   * restart the music loop if it was playing. Call on any user gesture.
   */
  function resume() {
    if (!ctx || ctx.state !== 'suspended') return;
    ctx.resume().then(() => {
      if (_musicWanted && !muted && !_musicPlaying) {
        _musicPlaying = true;
        _scheduleLoop();
      }
    });
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
    if (!ctx || ctx.state !== 'running') return;
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
    if (!ctx || ctx.state !== 'running') return;
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
      _note(440, 0, 0.08, 'triangle', 0.07);
      _note(311, 0.06, 0.15, 'triangle', 0.07);
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

  /* ─── Background music (synthesised spooky loop) ─── */

  const _BPM = 140;
  const _BEAT = 60 / _BPM;

  /* Note frequencies */
  const _A3 = 220, _B3 = 246.94, _C4 = 261.63, _D4 = 293.66;
  const _E4 = 329.63, _F4 = 349.23, _G4 = 392, _A4 = 440;
  const _A2 = 110, _C3 = 130.81, _D3 = 146.83, _E3 = 164.81, _F3 = 174.61;

  /**
   * Melody and bass: [freq, startBeat, durationBeats].
   * 16 measures (64 beats): verse (m1-8) + chorus (m9-16).
   */
  const _MELODY = [
    /* verse, m1-2: "Spooky scary skeletons" */
    [_E4, 0, 1], [_E4, 1, 1], [_E4, 2, 1], [_E4, 3, 1],
    [_E4, 4, 0.5], [_D4, 4.5, 0.5], [_C4, 5, 1],
    /* m3-4: "send shivers down your spine" */
    [_D4, 8, 0.5], [_E4, 8.5, 0.5], [_D4, 9, 0.5], [_C4, 9.5, 0.5], [_B3, 10, 2],
    /* m5-6: "Shrieking skulls will shock your soul" */
    [_E4, 16, 1], [_E4, 17, 1], [_E4, 18, 1], [_E4, 19, 1],
    [_E4, 20, 0.5], [_D4, 20.5, 0.5], [_C4, 21, 1],
    /* m7-8: "seal your doom tonight" */
    [_D4, 24, 0.5], [_E4, 24.5, 0.5], [_D4, 25, 0.5], [_C4, 25.5, 0.5], [_A3, 26, 2],
    /* chorus, m9-10 */
    [_A4, 32, 1], [_A4, 33, 1], [_A4, 34, 1], [_A4, 35, 1],
    [_A4, 36, 0.5], [_G4, 36.5, 0.5], [_F4, 37, 1],
    /* m11-12 */
    [_G4, 40, 0.5], [_A4, 40.5, 0.5], [_G4, 41, 0.5], [_F4, 41.5, 0.5], [_E4, 42, 2],
    /* m13-14 */
    [_A4, 48, 1], [_A4, 49, 1], [_A4, 50, 1], [_A4, 51, 1],
    [_A4, 52, 0.5], [_G4, 52.5, 0.5], [_F4, 53, 1],
    /* m15-16 */
    [_G4, 56, 0.5], [_A4, 56.5, 0.5], [_G4, 57, 0.5], [_F4, 57.5, 0.5], [_E4, 58, 2],
  ];

  const _BASS = [
    [_A2, 0, 4], [_A2, 4, 4],       /* m1-2: Am */
    [_E3, 8, 4], [_A2, 12, 4],      /* m3-4: Em, Am */
    [_A2, 16, 4], [_A2, 20, 4],     /* m5-6: Am */
    [_F3, 24, 4], [_A2, 28, 4],     /* m7-8: F, Am */
    [_F3, 32, 4], [_F3, 36, 4],     /* m9-10: F */
    [_C3, 40, 4], [_A2, 44, 4],     /* m11-12: C, Am */
    [_D3, 48, 4], [_F3, 52, 4],     /* m13-14: Dm, F */
    [_E3, 56, 4], [_A2, 60, 4],     /* m15-16: E, Am */
  ];

  const _LOOP_BEATS = 64;
  const _LOOP_DUR = _LOOP_BEATS * _BEAT;

  let _musicTimer = null;
  let _musicPlaying = false;
  let _musicWanted = false;
  let _lastScheduleTime = -Infinity;

  /** Schedule one full pass of the melody + bass, then queue the next. */
  function _scheduleLoop() {
    if (!ctx || !_musicPlaying || ctx.state !== 'running') return;

    // Guard against overlapping loops after device sleep: if the previous
    // batch of notes hasn't finished yet, reschedule for when it ends.
    if (ctx.currentTime < _lastScheduleTime + _LOOP_DUR) {
      const remaining = (_lastScheduleTime + _LOOP_DUR - ctx.currentTime) * 1000;
      _musicTimer = setTimeout(_scheduleLoop, remaining);
      return;
    }

    _lastScheduleTime = ctx.currentTime;
    for (const [freq, beat, dur] of _MELODY) {
      _note(freq, beat * _BEAT, dur * _BEAT * 0.85, 'triangle', 0.1);
    }
    for (const [freq, beat, dur] of _BASS) {
      _note(freq, beat * _BEAT, dur * _BEAT * 0.85, 'sine', 0.08);
    }
    _musicTimer = setTimeout(_scheduleLoop, _LOOP_DUR * 1000);
  }

  /** Start the background music loop. */
  function startMusic() {
    _musicWanted = true;
    if (!unlocked || muted || _musicPlaying) return;
    _musicPlaying = true;
    // AudioContext may still be suspended after creation; wait for it to run
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => _scheduleLoop());
    } else {
      _scheduleLoop();
    }
  }

  /** Stop the background music loop. */
  function stopMusic() {
    _musicWanted = false;
    _musicPlaying = false;
    if (_musicTimer) { clearTimeout(_musicTimer); _musicTimer = null; }
  }

  /** Return whether audio is muted. */
  function isMuted() { return muted; }

  /** Set mute state. Pauses/resumes music accordingly. */
  function setMuted(v) {
    muted = v;
    if (muted) {
      _musicPlaying = false;
      if (_musicTimer) { clearTimeout(_musicTimer); _musicTimer = null; }
    } else if (_musicWanted && !_musicPlaying) {
      _musicPlaying = true;
      _scheduleLoop();
    }
  }

  return { unlock, resume, play, startMusic, stopMusic, isMuted, setMuted };
})();
