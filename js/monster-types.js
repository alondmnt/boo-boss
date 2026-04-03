/**
 * MonsterTypes — SVG overlay factories for zombie, witch, skeleton costumes.
 * Applies colour transforms and costume SVG elements to a creature's <g> group.
 * In MVP, monster types are auto-assigned via CONFIG.defaultMonsterType.
 */
const MonsterTypes = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  /**
   * Apply a monster type overlay to a creature SVG element.
   * Mutates the element in-place: adds CSS class and costume elements.
   *
   * @param {SVGGElement} creatureEl - the creature's outer <g>
   * @param {string} monsterType - 'zombie', 'witch', or 'skeleton'
   */
  function apply(creatureEl, monsterType) {
    if (!creatureEl || !monsterType) return;
    creatureEl.classList.add(`creature--${monsterType}`);

    const applicators = { zombie: _zombie, witch: _witch, skeleton: _skeleton };
    const fn = applicators[monsterType];
    if (fn) fn(creatureEl);
  }

  /** Zombie: green-grey tint + ragged edge strokes + droopy eye. */
  function _zombie(el) {
    // Ragged edge lines (append to each visible pose group)
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--zombie');
      g.innerHTML = `
        <line x1="-8" y1="6" x2="-10" y2="10" stroke="#4a6a4a" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
        <line x1="7" y1="8" x2="10" y2="11" stroke="#4a6a4a" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
        <line x1="-5" y1="-4" x2="-7" y2="-2" stroke="#4a6a4a" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
      `;
      pose.appendChild(g);
    });
  }

  /** Witch: pointed hat + cape shape + green tint (via CSS class). */
  function _witch(el) {
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--witch');
      // Hat scaled to sit on top of creature (approximate top at y=-20 to -30)
      g.innerHTML = `
        <!-- pointed hat -->
        <polygon points="0,-35 -8,-18 8,-18" fill="#2a0a3a" stroke="#1a0a2a" stroke-width="0.8"/>
        <ellipse cx="0" cy="-18" rx="10" ry="3" fill="#2a0a3a" stroke="#1a0a2a" stroke-width="0.6"/>
        <!-- hat buckle -->
        <rect x="-2" y="-22" width="4" height="3" rx="0.5" fill="#c8a84e" opacity="0.7"/>
        <!-- cape hint (draped behind body) -->
        <path d="M-10,-10 Q-14,5 -12,18 L-8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
        <path d="M10,-10 Q14,5 12,18 L8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
      `;
      pose.appendChild(g);
    });
  }

  /** Skeleton: bone-white override + rib lines + hollow eyes (via CSS class). */
  function _skeleton(el) {
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--skeleton');
      g.innerHTML = `
        <!-- rib cage lines -->
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
        <line x1="-5" y1="3" x2="5" y2="3" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
        <line x1="-4" y1="6" x2="4" y2="6" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
        <!-- joint marks -->
        <circle cx="-10" cy="2" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3"/>
        <circle cx="10" cy="2" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3"/>
      `;
      pose.appendChild(g);
    });
  }

  return { apply };
})();
