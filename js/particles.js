/**
 * Particles — spooky burst, floating hearts, confetti effects.
 * Uses DOM elements positioned absolutely with CSS custom properties
 * (--dx, --dy) driving @keyframes animations. Same pattern as car-doctor's sparks.
 */
const Particles = (() => {
  /**
   * Get the viewport centre point of an SVG element.
   * Falls back to (0, 0) if element has no bounding rect.
   */
  function _centre(el) {
    if (!el) return { cx: 0, cy: 0 };
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  /**
   * Spawn a single particle element.
   * @param {string} cls - CSS class(es) for the particle
   * @param {number} cx, cy - starting position (viewport coords)
   * @param {number} dx, dy - displacement (drives --dx/--dy)
   * @param {string} content - text content (emoji)
   * @param {number} duration - auto-remove after ms
   */
  function _spawn(cls, cx, cy, dx, dy, content, duration) {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = content;
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  /**
   * Burst of spooky particles radiating outward from an element.
   * @param {Element} targetEl - the element to burst from
   */
  function spookyBurst(targetEl) {
    const { cx, cy } = _centre(targetEl);
    const icons = ['💀', '👻', '⚡', '💨', '✨', '🦴'];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 25 + Math.random() * 15;
      _spawn('particle particle--spooky', cx, cy,
        Math.cos(angle) * dist, Math.sin(angle) * dist,
        icons[i % icons.length], 700);
    }
  }

  /**
   * Floating hearts rising from an element.
   * @param {Element} targetEl - the element to float from
   */
  function hearts(targetEl) {
    const { cx, cy } = _centre(targetEl);
    for (let i = 0; i < 5; i++) {
      const dx = (Math.random() - 0.5) * 30;
      const dy = -(30 + Math.random() * 20);
      setTimeout(() => {
        _spawn('particle particle--heart', cx, cy, dx, dy, '❤️', 900);
      }, i * 120);
    }
  }

  /**
   * Celebration confetti burst (for fanfare/wave bonus).
   * @param {Element} targetEl - element to burst from (or null for screen centre)
   */
  function confetti(targetEl) {
    const { cx, cy } = targetEl
      ? _centre(targetEl)
      : { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
    const emojis = ['🎉', '⭐', '🎊', '✨', '🌟', '💜'];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 60;
      _spawn('particle particle--confetti', cx, cy,
        Math.cos(angle) * dist, Math.sin(angle) * dist - 20,
        emojis[i % emojis.length], 1000);
    }
  }

  /**
   * Floating score indicator rising from an element.
   * @param {Element} targetEl - element to float from
   * @param {string} text - the text to show (e.g., "+10", "🫂")
   * @param {string} cls - extra CSS class for styling (e.g., 'particle--score', 'particle--hug-float')
   */
  function scoreFloat(targetEl, text, cls) {
    const { cx, cy } = _centre(targetEl);
    _spawn(`particle ${cls}`, cx, cy, 0, -40, text, 1000);
  }

  return { spookyBurst, hearts, confetti, scoreFloat };
})();
