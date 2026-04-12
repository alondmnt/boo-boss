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

    const applicators = {
      zombie: _zombie, witch: _witch, skeleton: _skeleton,
      vampire: _vampire, astronaut: _astronaut, ghost: _ghost,
    };
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

  /** Vampire: high collar cape, fangs, red eyes, pale tint (via CSS class). */
  function _vampire(el) {
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--vampire');
      g.innerHTML = `
        <!-- high collar cape (red lining) -->
        <path d="M-10,-14 Q-14,-8 -14,8 Q-14,16 -10,20" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.6" opacity="0.6"/>
        <path d="M-12,-10 Q-12,4 -11,16" fill="none" stroke="#8a1a1a" stroke-width="0.8" opacity="0.4"/>
        <path d="M10,-14 Q14,-8 14,8 Q14,16 10,20" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.6" opacity="0.6"/>
        <path d="M12,-10 Q12,4 11,16" fill="none" stroke="#8a1a1a" stroke-width="0.8" opacity="0.4"/>
        <!-- collar points -->
        <path d="M-8,-14 L-10,-20 L-6,-16" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.5"/>
        <path d="M8,-14 L10,-20 L6,-16" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.5"/>
        <!-- fangs -->
        <path d="M-2,-8 L-2.5,-4" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
        <path d="M2,-8 L2.5,-4" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
      `;
      pose.appendChild(g);
    });
  }

  /** Astronaut: helmet visor dome, suit collar, oxygen tube. */
  function _astronaut(el) {
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--astronaut');
      g.innerHTML = `
        <!-- helmet dome (visor with reflection) -->
        <ellipse cx="0" cy="-18" rx="14" ry="12" fill="none" stroke="#c8d0d8" stroke-width="1.5" opacity="0.7"/>
        <ellipse cx="0" cy="-18" rx="12" ry="10" fill="#1a3a5a" opacity="0.25"/>
        <!-- visor reflection glint -->
        <path d="M-6,-24 Q-2,-26 2,-24" fill="none" stroke="#aaccee" stroke-width="0.8" opacity="0.6"/>
        <!-- suit collar ring -->
        <ellipse cx="0" cy="-8" rx="10" ry="3" fill="#c8c8c8" stroke="#888" stroke-width="0.6" opacity="0.5"/>
        <!-- oxygen tube -->
        <path d="M10,-12 Q16,-10 16,-4 Q16,2 12,4" fill="none" stroke="#aaa" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
        <circle cx="12" cy="4" r="2" fill="#888" stroke="#666" stroke-width="0.4" opacity="0.5"/>
        <!-- chest patch -->
        <rect x="-3" y="-2" width="6" height="4" rx="1" fill="#c8c8c8" stroke="#888" stroke-width="0.3" opacity="0.4"/>
        <line x1="-1" y1="-1" x2="3" y2="-1" stroke="#4a8aca" stroke-width="0.4" opacity="0.5"/>
        <line x1="-1" y1="0.5" x2="2" y2="0.5" stroke="#4a8aca" stroke-width="0.4" opacity="0.5"/>
      `;
      pose.appendChild(g);
    });
  }

  /** Ghost: trailing wisps, blue-white glow aura (main effect via CSS opacity + filter). */
  function _ghost(el) {
    const poses = el.querySelectorAll('.creature__pose');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--ghost');
      g.innerHTML = `
        <!-- trailing wisps below body -->
        <path d="M-6,18 Q-8,24 -4,28 Q0,32 -2,36" fill="none" stroke="#aaccee" stroke-width="0.8" opacity="0.3"/>
        <path d="M2,18 Q4,26 0,30 Q-2,34 2,38" fill="none" stroke="#aaccee" stroke-width="0.6" opacity="0.25"/>
        <path d="M6,16 Q10,22 6,28" fill="none" stroke="#aaccee" stroke-width="0.7" opacity="0.2"/>
        <!-- aura glow halo -->
        <ellipse cx="0" cy="-4" rx="20" ry="22" fill="#aaccee" opacity="0.06"/>
        <ellipse cx="0" cy="-4" rx="16" ry="18" fill="#ccddff" opacity="0.05"/>
      `;
      pose.appendChild(g);
    });
  }

  return { apply };
})();

