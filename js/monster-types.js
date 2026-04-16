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

  /** SVG transform: maps head-centred elements (helmet) to creature face centre. */
  function _headCenterXf(a) {
    const s = a.scale;
    return `translate(${a.headCenter.x}, ${a.headCenter.y - REF_HEAD_Y * s}) scale(${s})`;
  }

  /** SVG transform: maps body-relative elements (cape, ribs, wisps) to creature torso. */
  function _bodyXf(a) {
    const s = a.scale;
    return `translate(${a.bodyCenter.x}, ${a.bodyCenter.y}) scale(${s})`;
  }

  /**
   * Wrap SVG content in the bat idle rotation so overlays follow the
   * inverted body. Returns content unchanged for non-idle poses.
   */
  function _batIdleWrap(content, pose, creatureType) {
    if (creatureType !== 'bat' || !pose.classList.contains('creature__pose--idle')) return content;
    return `<g transform="rotate(180, 0, -10)">${content}</g>`;
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
    if (fn) fn(creatureEl, anchors, creatureType);
  }

  /**
   * Zombie: sickly green tint (CSS sepia+hue-rotate), glowing yellow-green eyes,
   * ragged decay strokes, stitch marks, drip lines. Eye positions taken from
   * creature anchor data. Colours are yellow pre-filter (→ green after CSS
   * hue-rotate 70deg).
   */
  function _zombie(el, a, creatureType) {
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
    const bodySvg = `
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
      </g>`;
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--zombie');
      g.innerHTML = _batIdleWrap(`${eyeSvg}${bodySvg}`, pose, creatureType);
      pose.appendChild(g);
    });
  }

  /** Witch: pointed hat + cape shape + green tint (via CSS class). */
  function _witch(el, a, creatureType) {
    const poses = el.querySelectorAll('.creature__pose');
    const hxf = _headXf(a);
    const bxf = _bodyXf(a);
    const content = `
      <g transform="${hxf}">
        <!-- pointed hat -->
        <polygon points="0,-35 -8,-18 8,-18" fill="#2a0a3a" stroke="#6a4a8a" stroke-width="1"/>
        <ellipse cx="0" cy="-18" rx="10" ry="3" fill="#2a0a3a" stroke="#6a4a8a" stroke-width="0.8"/>
        <!-- hat buckle -->
        <rect x="-2" y="-22" width="4" height="3" rx="0.5" fill="#c8a84e" opacity="0.9"/>
      </g>
      <g transform="${bxf}">
        <!-- cape hint (draped behind body) -->
        <path d="M-10,-10 Q-14,5 -12,18 L-8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
        <path d="M10,-10 Q14,5 12,18 L8,20" fill="#2a0a3a" opacity="0.4" stroke="none"/>
      </g>`;
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--witch');
      g.innerHTML = _batIdleWrap(content, pose, creatureType);
      pose.appendChild(g);
    });
  }

  /**
   * Skeleton: bone-white CSS wash + bone structure overlay.
   * Snake and dinosaur get custom bone layouts; other creatures use the
   * standard upright spine + rib cage.
   */
  function _skeleton(el, a, creatureType) {
    const poses = el.querySelectorAll('.creature__pose');
    const bxf = _bodyXf(a);
    const s = a.scale;
    const eyeSvg = (a.eyes || []).map(e => {
      const r = 3 * s;
      return `
        <circle cx="${e.x}" cy="${e.y}" r="${r}" fill="#0a0a0a" opacity="0.6"/>
        <circle cx="${e.x}" cy="${e.y}" r="${r * 0.35}" fill="#d8d0c8" opacity="0.8"/>`;
    }).join('');

    let boneSvg;
    if (creatureType === 'spider') {
      boneSvg = _skeletonSpider();
    } else if (creatureType === 'bat') {
      boneSvg = _skeletonBat();
    } else if (creatureType === 'snake') {
      boneSvg = _skeletonSnake();
    } else if (creatureType === 'dinosaur') {
      boneSvg = _skeletonDinosaur();
    } else {
      boneSvg = _skeletonUpright(bxf);
    }

    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--skeleton');
      g.innerHTML = _batIdleWrap(`${eyeSvg}${boneSvg}`, pose, creatureType);
      pose.appendChild(g);
    });
  }

  /** Standard upright skeleton (spider, gorilla, cat, bat, owl, rat). */
  function _skeletonUpright(bxf) {
    return `
      <g transform="${bxf}">
        <!-- spine -->
        <line x1="0" y1="-10" x2="0" y2="16" stroke="#d8d0c8" stroke-width="1" opacity="0.5" stroke-linecap="round"/>
        <!-- vertebrae -->
        <circle cx="0" cy="-8" r="1" fill="#d8d0c8" opacity="0.4"/>
        <circle cx="0" cy="-4" r="1.2" fill="#d8d0c8" opacity="0.4"/>
        <circle cx="0" cy="0" r="1.2" fill="#d8d0c8" opacity="0.4"/>
        <circle cx="0" cy="4" r="1.2" fill="#d8d0c8" opacity="0.4"/>
        <circle cx="0" cy="8" r="1" fill="#d8d0c8" opacity="0.35"/>
        <circle cx="0" cy="12" r="1" fill="#d8d0c8" opacity="0.3"/>
        <!-- rib cage (6 pairs) -->
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
        <!-- limb bones -->
        <line x1="-10" y1="-4" x2="-14" y2="4" stroke="#d8d0c8" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>
        <line x1="10" y1="-4" x2="14" y2="4" stroke="#d8d0c8" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>
        <!-- joints (shoulders, hips) -->
        <circle cx="-10" cy="-4" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
        <circle cx="10" cy="-4" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4"/>
        <circle cx="-6" cy="14" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
        <circle cx="6" cy="14" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
        <!-- pelvis -->
        <path d="M-6,14 Q0,16 6,14" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.3" stroke-linecap="round"/>
      </g>`;
  }

  /** Spider skeleton: cephalothorax + abdomen segments, 8 skeletal leg bones, chelicera. */
  function _skeletonSpider() {
    return `
      <!-- cephalothorax outline (head section) -->
      <circle cx="0" cy="-8" r="6" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.45"/>
      <!-- abdomen outline -->
      <ellipse cx="0" cy="3" rx="10" ry="8" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.4"/>
      <!-- pedicel connecting them -->
      <line x1="0" y1="-2" x2="0" y2="0" stroke="#d8d0c8" stroke-width="1" opacity="0.5" stroke-linecap="round"/>
      <!-- 8 skeletal leg bones (simplified, radiating from cephalothorax) -->
      <!-- left legs (4) -->
      <polyline points="-6,-6 -14,-10 -22,-4 -26,4" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-6,-4 -14,-4 -22,2 -26,10" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-6,-2 -13,2 -19,7 -24,14" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-5,0 -11,6 -16,12 -20,20" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- right legs (4) -->
      <polyline points="6,-6 14,-10 22,-4 26,4" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="6,-4 14,-4 22,2 26,10" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="6,-2 13,2 19,7 24,14" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="5,0 11,6 16,12 20,20" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- leg joint dots -->
      <circle cx="-14" cy="-10" r="0.7" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="-14" cy="-4" r="0.7" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="14" cy="-10" r="0.7" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="14" cy="-4" r="0.7" fill="#d8d0c8" opacity="0.35"/>
      <!-- chelicera (fang bases) -->
      <line x1="-2" y1="-4" x2="-3" y2="-1" stroke="#d8d0c8" stroke-width="0.6" opacity="0.45" stroke-linecap="round"/>
      <line x1="2" y1="-4" x2="3" y2="-1" stroke="#d8d0c8" stroke-width="0.6" opacity="0.45" stroke-linecap="round"/>`;
  }

  /** Bat skeleton: wing bone framework with finger bones, small ribcage. */
  function _skeletonBat() {
    return `
      <!-- small ribcage on body -->
      <ellipse cx="0" cy="0" rx="5" ry="7" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4"/>
      <line x1="0" y1="-6" x2="0" y2="8" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
      <!-- ribs (small, 3 pairs) -->
      <path d="M0,-3 Q-3,-4 -5,-2" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <path d="M0,-3 Q3,-4 5,-2" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <path d="M0,0 Q-3,-1 -5,1" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.35" stroke-linecap="round"/>
      <path d="M0,0 Q3,-1 5,1" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.35" stroke-linecap="round"/>
      <path d="M0,3 Q-3,2 -4,4" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <path d="M0,3 Q3,2 4,4" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <!-- left wing bones: arm → forearm → 4 finger bones fanning out -->
      <line x1="-6" y1="-2" x2="-12" y2="-6" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
      <circle cx="-12" cy="-6" r="0.8" fill="#d8d0c8" opacity="0.35"/>
      <line x1="-12" y1="-6" x2="-24" y2="-10" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
      <line x1="-12" y1="-6" x2="-22" y2="-2" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
      <line x1="-12" y1="-6" x2="-20" y2="4" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <line x1="-12" y1="-6" x2="-16" y2="8" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <!-- right wing bones -->
      <line x1="6" y1="-2" x2="12" y2="-6" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
      <circle cx="12" cy="-6" r="0.8" fill="#d8d0c8" opacity="0.35"/>
      <line x1="12" y1="-6" x2="24" y2="-10" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
      <line x1="12" y1="-6" x2="22" y2="-2" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35" stroke-linecap="round"/>
      <line x1="12" y1="-6" x2="20" y2="4" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <line x1="12" y1="-6" x2="16" y2="8" stroke="#d8d0c8" stroke-width="0.4" opacity="0.3" stroke-linecap="round"/>
      <!-- shoulder joints -->
      <circle cx="-6" cy="-2" r="1" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>
      <circle cx="6" cy="-2" r="1" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.35"/>`;
  }

  /** Snake skeleton: vertebrae along the neck and coil, tiny rib pairs. */
  function _skeletonSnake() {
    return `
      <!-- spine along neck (vertical rise from coil to head) -->
      <line x1="0" y1="2" x2="0" y2="-12" stroke="#d8d0c8" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
      <!-- neck vertebrae -->
      <circle cx="0" cy="-11" r="0.8" fill="#d8d0c8" opacity="0.45"/>
      <circle cx="0" cy="-8" r="0.9" fill="#d8d0c8" opacity="0.45"/>
      <circle cx="0" cy="-5" r="0.9" fill="#d8d0c8" opacity="0.45"/>
      <circle cx="0" cy="-2" r="0.9" fill="#d8d0c8" opacity="0.4"/>
      <circle cx="0" cy="1" r="0.9" fill="#d8d0c8" opacity="0.4"/>
      <!-- tiny rib pairs along neck -->
      <line x1="-1" y1="-8" x2="-3.5" y2="-7" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <line x1="1" y1="-8" x2="3.5" y2="-7" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <line x1="-1" y1="-5" x2="-3.5" y2="-4" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <line x1="1" y1="-5" x2="3.5" y2="-4" stroke="#d8d0c8" stroke-width="0.4" opacity="0.4" stroke-linecap="round"/>
      <line x1="-1" y1="-2" x2="-3" y2="-1" stroke="#d8d0c8" stroke-width="0.4" opacity="0.35" stroke-linecap="round"/>
      <line x1="1" y1="-2" x2="3" y2="-1" stroke="#d8d0c8" stroke-width="0.4" opacity="0.35" stroke-linecap="round"/>
      <!-- vertebrae along coil body (approximate S-curve positions) -->
      <circle cx="4" cy="5" r="0.8" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="8" cy="9" r="0.8" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="14" cy="12" r="0.8" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="20" cy="14" r="0.8" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="26" cy="12" r="0.7" fill="#d8d0c8" opacity="0.25"/>
      <circle cx="-8" cy="4" r="0.8" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="-16" cy="8" r="0.7" fill="#d8d0c8" opacity="0.25"/>
      <circle cx="-22" cy="12" r="0.7" fill="#d8d0c8" opacity="0.25"/>
      <!-- jawbone hint -->
      <path d="M-3,-13 Q0,-11 3,-13" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.4" stroke-linecap="round"/>`;
  }

  /** Dinosaur skeleton: horizontal spine from tail through body to head, ribs hanging down. */
  function _skeletonDinosaur() {
    return `
      <!-- spine: tail → body → neck → skull -->
      <path d="M-30,8 Q-20,4 -10,4 Q0,2 6,-4 Q10,-10 14,-18 Q16,-22 18,-26"
            fill="none" stroke="#d8d0c8" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/>
      <!-- vertebrae along spine -->
      <circle cx="-26" cy="7" r="1" fill="#d8d0c8" opacity="0.25"/>
      <circle cx="-20" cy="5" r="1.1" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="-14" cy="4" r="1.2" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="-8" cy="4" r="1.3" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="-2" cy="3" r="1.3" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="3" cy="0" r="1.3" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="7" cy="-5" r="1.2" fill="#d8d0c8" opacity="0.35"/>
      <circle cx="10" cy="-10" r="1.1" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="13" cy="-16" r="1" fill="#d8d0c8" opacity="0.3"/>
      <circle cx="16" cy="-22" r="1" fill="#d8d0c8" opacity="0.3"/>
      <!-- ribs hanging down from torso section -->
      <path d="M-8,4 Q-10,10 -12,16" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.4" stroke-linecap="round"/>
      <path d="M-4,4 Q-5,10 -6,16" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.4" stroke-linecap="round"/>
      <path d="M0,3 Q-1,9 -1,15" fill="none" stroke="#d8d0c8" stroke-width="0.7" opacity="0.4" stroke-linecap="round"/>
      <path d="M3,1 Q3,7 3,13" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.35" stroke-linecap="round"/>
      <path d="M6,-3 Q6,3 5,9" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.35" stroke-linecap="round"/>
      <!-- leg bones -->
      <line x1="-6" y1="16" x2="-8" y2="28" stroke="#d8d0c8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
      <line x1="4" y1="14" x2="6" y2="28" stroke="#d8d0c8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
      <!-- hip + knee joints -->
      <circle cx="-6" cy="16" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3"/>
      <circle cx="4" cy="14" r="1.5" fill="none" stroke="#d8d0c8" stroke-width="0.5" opacity="0.3"/>
      <circle cx="-8" cy="28" r="1.2" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.25"/>
      <circle cx="6" cy="28" r="1.2" fill="none" stroke="#d8d0c8" stroke-width="0.4" opacity="0.25"/>
      <!-- jawbone -->
      <path d="M14,-20 Q18,-17 24,-20" fill="none" stroke="#d8d0c8" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
      <!-- tail vertebrae thin out -->
      <circle cx="-30" cy="8" r="0.7" fill="#d8d0c8" opacity="0.2"/>
      <circle cx="-34" cy="12" r="0.6" fill="#d8d0c8" opacity="0.15"/>`;
  }

  /** Vampire: high collar cape, fangs, pale tint (via CSS class). */
  function _vampire(el, a, creatureType) {
    const poses = el.querySelectorAll('.creature__pose');
    const hxf = _headXf(a);
    const bxf = _bodyXf(a);
    const content = `
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
      </g>`;
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--vampire');
      g.innerHTML = _batIdleWrap(content, pose, creatureType);
      pose.appendChild(g);
    });
  }

  /** Astronaut: helmet visor dome, suit collar, oxygen tube. */
  function _astronaut(el, a, creatureType) {
    const poses = el.querySelectorAll('.creature__pose');
    const hcxf = _headCenterXf(a);
    const bxf = _bodyXf(a);
    const content = `
      <g transform="${hcxf}">
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
      </g>`;
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--astronaut');
      g.innerHTML = _batIdleWrap(content, pose, creatureType);
      pose.appendChild(g);
    });
  }

  /** Ghost: trailing wisps, blue-white glow aura (main effect via CSS opacity + filter). */
  function _ghost(el, a, creatureType) {
    const poses = el.querySelectorAll('.creature__pose');
    const bxf = _bodyXf(a);
    const content = `
      <g transform="${bxf}">
        <!-- trailing wisps below body -->
        <path d="M-6,18 Q-8,24 -4,28 Q0,32 -2,36" fill="none" stroke="#aaccee" stroke-width="0.8" opacity="0.3"/>
        <path d="M2,18 Q4,26 0,30 Q-2,34 2,38" fill="none" stroke="#aaccee" stroke-width="0.6" opacity="0.25"/>
        <path d="M6,16 Q10,22 6,28" fill="none" stroke="#aaccee" stroke-width="0.7" opacity="0.2"/>
        <!-- aura glow halo -->
        <ellipse cx="0" cy="-4" rx="20" ry="22" fill="#aaccee" opacity="0.06"/>
        <ellipse cx="0" cy="-4" rx="16" ry="18" fill="#ccddff" opacity="0.05"/>
      </g>`;
    poses.forEach(pose => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('monster-overlay', 'monster-overlay--ghost');
      g.innerHTML = _batIdleWrap(content, pose, creatureType);
      pose.appendChild(g);
    });
  }

  return { apply };
})();
