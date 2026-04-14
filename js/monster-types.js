/**
 * MonsterTypes — SVG overlay factories for monster costumes.
 * Applies colour transforms and costume SVG elements to a creature's <g> group.
 * Uses creature anchor points (from Creatures.getAnchors) so overlays fit
 * each creature's unique body plan.
 */
const MonsterTypes = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  /** Reference head-top Y the original overlay SVGs were drawn against. */
  const REF_HEAD_Y = -18;

  /** SVG transform: maps head-relative elements (hat, helmet, fangs) to creature head. */
  function _headXf(a) {
    const s = a.scale;
    return `translate(${a.headTop.x}, ${a.headTop.y - REF_HEAD_Y * s}) scale(${s})`;
  }

  /** SVG transform: maps body-relative elements (cape, ribs, wisps) to creature torso. */
  function _bodyXf(a) {
    const s = a.scale;
    return `translate(${a.bodyCenter.x}, ${a.bodyCenter.y}) scale(${s})`;
  }

  /**
   * Apply a monster type overlay to a creature SVG element.
   * Mutates the element in-place: adds CSS class and costume elements.
   *
   * @param {SVGGElement} creatureEl - the creature's outer <g>
   * @param {string} monsterType - e.g. 'zombie', 'witch', 'skeleton'
   * @param {string} creatureType - e.g. 'spider', 'gorilla' (for anchor lookup)
   */
  function apply(creatureEl, monsterType, creatureType) {
    if (!creatureEl || !monsterType) return;
    creatureEl.classList.add(`creature--${monsterType}`);

    const anchors = Creatures.getAnchors(creatureType);
    const applicators = {
      zombie: _zombie, witch: _witch, skeleton: _skeleton,
      vampire: _vampire, astronaut: _astronaut, ghost: _ghost,
    };
    const fn = applicators[monsterType];
    if (fn) fn(creatureEl, anchors);
  }

  /**
   * Zombie: sickly green tint (CSS sepia+hue-rotate), glowing yellow-green eyes,
   * ragged decay strokes, stitch marks, drip lines. Eye positions taken from
   * creature anchor data. Colours are yellow pre-filter (→ green after CSS
   * hue-rotate 70deg).
   */
  function _zombie(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const bxf = _bodyXf(a);
    const s = a.scale;
    const eyeSvg = (a.eyes || []).map((e, i) => {
      const r = 2.5 * s;
      /* second eye droops slightly for asymmetric zombie look */
      const dy = i === 1 ? 1 * s : 0;
      return `
        <circle cx="${e.x}" cy="${e.y + dy}" r="${r * 1.6}" fill="#ffee00" opacity="0.12"/>
        <circle cx="${e.x}" cy="${e.y + dy}" r="${r}" fill="#ffdd00" opacity="0.25"/>
        <circle cx="${e.x}" cy="${e.y + dy}" r="${r * 0.5}" fill="#ffffff" opacity="0.7"/>`;
    }).join('');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--zombie');
      g.innerHTML = `
        ${eyeSvg}
        <g transform="${bxf}">
          <!-- ragged decay strokes -->
          <line x1="-8" y1="6" x2="-10" y2="10" stroke="#4a6a4a" stroke-width="0.8" opacity="0.6" stroke-linecap="round"/>
          <line x1="7" y1="8" x2="10" y2="11" stroke="#4a6a4a" stroke-width="0.8" opacity="0.6" stroke-linecap="round"/>
          <line x1="-5" y1="-4" x2="-7" y2="-2" stroke="#4a6a4a" stroke-width="0.6" opacity="0.5" stroke-linecap="round"/>
          <line x1="6" y1="-6" x2="9" y2="-4" stroke="#4a6a4a" stroke-width="0.6" opacity="0.45" stroke-linecap="round"/>
          <!-- stitch marks across body -->
          <line x1="-4" y1="-7" x2="4" y2="-7" stroke="#3a5a3a" stroke-width="0.6" opacity="0.4" stroke-linecap="round" stroke-dasharray="1.5,1.5"/>
          <line x1="-6" y1="12" x2="2" y2="12" stroke="#3a5a3a" stroke-width="0.5" opacity="0.35" stroke-linecap="round" stroke-dasharray="1.5,1.5"/>
          <!-- drip marks -->
          <path d="M5,-2 Q5.5,2 5,5" fill="none" stroke="#4a6a4a" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
          <path d="M-7,3 Q-7.5,7 -7,10" fill="none" stroke="#4a6a4a" stroke-width="0.5" opacity="0.3" stroke-linecap="round"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  /** Witch: pointed hat + cape shape + green tint (via CSS class). */
  function _witch(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const hxf = _headXf(a);
    const bxf = _bodyXf(a);
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--witch');
      g.innerHTML = `
        <g transform="${hxf}">
          <!-- pointed hat -->
          <polygon points="0,-35 -8,-18 8,-18" fill="#2a0a3a" stroke="#1a0a2a" stroke-width="0.8"/>
          <ellipse cx="0" cy="-18" rx="10" ry="3" fill="#2a0a3a" stroke="#1a0a2a" stroke-width="0.6"/>
          <!-- hat buckle -->
          <rect x="-2" y="-22" width="4" height="3" rx="0.5" fill="#c8a84e" opacity="0.7"/>
        </g>
        <g transform="${bxf}">
          <!-- cape hint (draped behind body) -->
          <path d="M-10,-10 Q-14,5 -12,18 L-8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
          <path d="M10,-10 Q14,5 12,18 L8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  /**
   * Skeleton: bone-white CSS wash (near-zero saturation, high brightness).
   * SVG overlay adds: spine line, full rib cage, limb bone marks, joint circles,
   * and hollow eye sockets at each creature's actual eye positions.
   */
  function _skeleton(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const bxf = _bodyXf(a);
    const s = a.scale;
    const eyeSvg = (a.eyes || []).map(e => {
      const r = 3 * s;
      return `
        <circle cx="${e.x}" cy="${e.y}" r="${r}" fill="#0a0a0a" opacity="0.6"/>
        <circle cx="${e.x}" cy="${e.y}" r="${r * 0.35}" fill="#d8d0c8" opacity="0.8"/>`;
    }).join('');
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--skeleton');
      g.innerHTML = `
        ${eyeSvg}
        <g transform="${bxf}">
          <!-- spine (central vertical line) -->
          <line x1="0" y1="-10" x2="0" y2="16" stroke="#d8d0c8" stroke-width="1" opacity="0.5" stroke-linecap="round"/>
          <!-- vertebrae bumps along spine -->
          <circle cx="0" cy="-8" r="1" fill="#d8d0c8" opacity="0.4"/>
          <circle cx="0" cy="-4" r="1.2" fill="#d8d0c8" opacity="0.4"/>
          <circle cx="0" cy="0" r="1.2" fill="#d8d0c8" opacity="0.4"/>
          <circle cx="0" cy="4" r="1.2" fill="#d8d0c8" opacity="0.4"/>
          <circle cx="0" cy="8" r="1" fill="#d8d0c8" opacity="0.35"/>
          <circle cx="0" cy="12" r="1" fill="#d8d0c8" opacity="0.3"/>
          <!-- rib cage (6 ribs, curving from spine outward) -->
          <path d="M0,-6 Q-5,-7 -8,-5" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.5" stroke-linecap="round"/>
          <path d="M0,-6 Q5,-7 8,-5" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.5" stroke-linecap="round"/>
          <path d="M0,-3 Q-6,-4 -9,-1" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.5" stroke-linecap="round"/>
          <path d="M0,-3 Q6,-4 9,-1" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.5" stroke-linecap="round"/>
          <path d="M0,0 Q-6,-1 -9,2" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.45" stroke-linecap="round"/>
          <path d="M0,0 Q6,-1 9,2" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.45" stroke-linecap="round"/>
          <path d="M0,3 Q-5,2 -8,4" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
          <path d="M0,3 Q5,2 8,4" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
          <path d="M0,6 Q-4,5 -7,7" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
          <path d="M0,6 Q4,5 7,7" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
          <path d="M0,9 Q-3,8 -6,9" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3" stroke-linecap="round"/>
          <path d="M0,9 Q3,8 6,9" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3" stroke-linecap="round"/>
          <!-- limb bone marks (upper limbs) -->
          <line x1="-10" y1="-4" x2="-14" y2="4" stroke="#d8d0c8" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>
          <line x1="10" y1="-4" x2="14" y2="4" stroke="#d8d0c8" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>
          <!-- joint circles (shoulders, hips) -->
          <circle cx="-10" cy="-4" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
          <circle cx="10" cy="-4" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
          <circle cx="-6" cy="14" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
          <circle cx="6" cy="14" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
          <!-- pelvis line -->
          <path d="M-6,14 Q0,16 6,14" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.3" stroke-linecap="round"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  /** Vampire: high collar cape, fangs, pale tint (via CSS class). */
  function _vampire(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const hxf = _headXf(a);
    const bxf = _bodyXf(a);
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--vampire');
      g.innerHTML = `
        <g transform="${bxf}">
          <!-- high collar cape (red lining) -->
          <path d="M-10,-14 Q-14,-8 -14,8 Q-14,16 -10,20" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.6" opacity="0.6"/>
          <path d="M-12,-10 Q-12,4 -11,16" fill="none" stroke="#8a1a1a" stroke-width="0.8" opacity="0.4"/>
          <path d="M10,-14 Q14,-8 14,8 Q14,16 10,20" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.6" opacity="0.6"/>
          <path d="M12,-10 Q12,4 11,16" fill="none" stroke="#8a1a1a" stroke-width="0.8" opacity="0.4"/>
          <!-- collar points -->
          <path d="M-8,-14 L-10,-20 L-6,-16" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.5"/>
          <path d="M8,-14 L10,-20 L6,-16" fill="#1a0a0a" stroke="#3a0a0a" stroke-width="0.5"/>
        </g>
        <g transform="${hxf}">
          <!-- fangs -->
          <path d="M-2,-8 L-2.5,-4" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
          <path d="M2,-8 L2.5,-4" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  /** Astronaut: helmet visor dome, suit collar, oxygen tube. */
  function _astronaut(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const hxf = _headXf(a);
    const bxf = _bodyXf(a);
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--astronaut');
      g.innerHTML = `
        <g transform="${hxf}">
          <!-- helmet dome (visor with reflection) -->
          <ellipse cx="0" cy="-18" rx="14" ry="12" fill="none" stroke="#c8d0d8" stroke-width="1.5" opacity="0.7"/>
          <ellipse cx="0" cy="-18" rx="12" ry="10" fill="#1a3a5a" opacity="0.25"/>
          <!-- visor reflection glint -->
          <path d="M-6,-24 Q-2,-26 2,-24" fill="none" stroke="#aaccee" stroke-width="0.8" opacity="0.6"/>
        </g>
        <g transform="${bxf}">
          <!-- suit collar ring -->
          <ellipse cx="0" cy="-8" rx="10" ry="3" fill="#c8c8c8" stroke="#888" stroke-width="0.6" opacity="0.5"/>
          <!-- oxygen tube -->
          <path d="M10,-12 Q16,-10 16,-4 Q16,2 12,4" fill="none" stroke="#aaa" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
          <circle cx="12" cy="4" r="2" fill="#888" stroke="#666" stroke-width="0.4" opacity="0.5"/>
          <!-- chest patch -->
          <rect x="-3" y="-2" width="6" height="4" rx="1" fill="#c8c8c8" stroke="#888" stroke-width="0.3" opacity="0.4"/>
          <line x1="-1" y1="-1" x2="3" y2="-1" stroke="#4a8aca" stroke-width="0.4" opacity="0.5"/>
          <line x1="-1" y1="0.5" x2="2" y2="0.5" stroke="#4a8aca" stroke-width="0.4" opacity="0.5"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  /** Ghost: trailing wisps, blue-white glow aura (main effect via CSS opacity + filter). */
  function _ghost(el, a) {
    const poses = el.querySelectorAll('.creature__pose');
    const bxf = _bodyXf(a);
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--ghost');
      g.innerHTML = `
        <g transform="${bxf}">
          <!-- trailing wisps below body -->
          <path d="M-6,18 Q-8,24 -4,28 Q0,32 -2,36" fill="none" stroke="#aaccee" stroke-width="0.8" opacity="0.3"/>
          <path d="M2,18 Q4,26 0,30 Q-2,34 2,38" fill="none" stroke="#aaccee" stroke-width="0.6" opacity="0.25"/>
          <path d="M6,16 Q10,22 6,28" fill="none" stroke="#aaccee" stroke-width="0.7" opacity="0.2"/>
          <!-- aura glow halo -->
          <ellipse cx="0" cy="-4" rx="20" ry="22" fill="#aaccee" opacity="0.06"/>
          <ellipse cx="0" cy="-4" rx="16" ry="18" fill="#ccddff" opacity="0.05"/>
        </g>
      `;
      pose.appendChild(g);
    });
  }

  return { apply };
})();
