/**
 * Creatures — detailed SVG body factories for each creature type.
 * Each factory returns an SVG string with idle/scare/hug pose groups.
 * Creatures are centred at (0,0) for easy translate-based positioning.
 */
const Creatures = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  /* ─── Shared SVG gradient definitions ─── */

  /**
   * Returns reusable <defs> for gradients used across creature SVGs.
   * Prefixed by creature type to avoid ID collisions.
   */
  function _defs(type) {
    switch (type) {
      case 'spider':
        return `
          <defs>
            <radialGradient id="spider-body-grad" cx="40%" cy="35%" r="55%">
              <stop offset="0%" stop-color="#5a2d82"/>
              <stop offset="100%" stop-color="#1a0a2e"/>
            </radialGradient>
            <radialGradient id="spider-eye-grad" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#fff"/>
              <stop offset="100%" stop-color="#c8c8e0"/>
            </radialGradient>
            <radialGradient id="spider-eye-scare" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#ffd700"/>
              <stop offset="100%" stop-color="#cc8800"/>
            </radialGradient>
          </defs>`;
      case 'gorilla':
        return `
          <defs>
            <radialGradient id="gorilla-body-grad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stop-color="#4a4a4a"/>
              <stop offset="100%" stop-color="#1a1a1a"/>
            </radialGradient>
            <radialGradient id="gorilla-face-grad" cx="45%" cy="40%" r="50%">
              <stop offset="0%" stop-color="#5a4a3a"/>
              <stop offset="100%" stop-color="#3a2a1a"/>
            </radialGradient>
          </defs>`;
      case 'bat':
        return `
          <defs>
            <radialGradient id="bat-body-grad" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stop-color="#6a5a7a"/>
              <stop offset="100%" stop-color="#2a1a3a"/>
            </radialGradient>
            <radialGradient id="bat-wing-grad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stop-color="#4a3a5a"/>
              <stop offset="100%" stop-color="#1a0a2a"/>
            </radialGradient>
            <radialGradient id="bat-eye-scare" cx="40%" cy="35%" r="50%">
              <stop offset="0%" stop-color="#ff4444"/>
              <stop offset="100%" stop-color="#cc0000"/>
            </radialGradient>
          </defs>`;
      case 'cat':
        return `
          <defs>
            <radialGradient id="cat-body-grad" cx="50%" cy="35%" r="55%">
              <stop offset="0%" stop-color="#2a1a3a"/>
              <stop offset="100%" stop-color="#0a0a1a"/>
            </radialGradient>
            <radialGradient id="cat-eye-grad" cx="40%" cy="35%" r="50%">
              <stop offset="0%" stop-color="#66ff66"/>
              <stop offset="100%" stop-color="#228822"/>
            </radialGradient>
          </defs>`;
      case 'owl':
        return `
          <defs>
            <radialGradient id="owl-body-grad" cx="45%" cy="35%" r="55%">
              <stop offset="0%" stop-color="#8a6a3a"/>
              <stop offset="100%" stop-color="#4a3018"/>
            </radialGradient>
            <radialGradient id="owl-eye-grad" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#ffcc00"/>
              <stop offset="100%" stop-color="#cc8800"/>
            </radialGradient>
            <radialGradient id="owl-eye-scare" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#ffee44"/>
              <stop offset="100%" stop-color="#ffaa00"/>
            </radialGradient>
          </defs>`;
      case 'snake':
        return `
          <defs>
            <radialGradient id="snake-body-grad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stop-color="#2a8a3a"/>
              <stop offset="100%" stop-color="#0a4a1a"/>
            </radialGradient>
            <radialGradient id="snake-belly-grad" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stop-color="#ccaa44"/>
              <stop offset="100%" stop-color="#8a7a22"/>
            </radialGradient>
            <radialGradient id="snake-hood-grad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stop-color="#3aaa4a"/>
              <stop offset="100%" stop-color="#1a6a2a"/>
            </radialGradient>
          </defs>`;
      case 'rat':
        return `
          <defs>
            <radialGradient id="rat-body-grad" cx="45%" cy="35%" r="55%">
              <stop offset="0%" stop-color="#7a6a5a"/>
              <stop offset="100%" stop-color="#3a302a"/>
            </radialGradient>
            <radialGradient id="rat-ear-grad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stop-color="#e8a0a0"/>
              <stop offset="100%" stop-color="#cc7a7a"/>
            </radialGradient>
            <radialGradient id="rat-nose-grad" cx="40%" cy="35%" r="50%">
              <stop offset="0%" stop-color="#ee99aa"/>
              <stop offset="100%" stop-color="#cc6677"/>
            </radialGradient>
          </defs>`;
      default:
        return '<defs></defs>';
    }
  }

  /* ─── Spider factory (~50x50 centred at origin) ─── */

  function _spider() {
    // Shared body parts as helper strings
    const thread = `<line x1="0" y1="-40" x2="0" y2="-14" stroke="#888" stroke-width="0.6" opacity="0.7"/>`;
    const bodyBase = `
      <ellipse cx="0" cy="2" rx="12" ry="10" fill="url(#spider-body-grad)" stroke="#2a1040" stroke-width="0.8"/>
      <!-- sheen highlight -->
      <ellipse cx="-3" cy="-2" rx="4" ry="3" fill="#7a4aaa" opacity="0.3"/>
      <!-- fuzzy hair strokes -->
      <line x1="-10" y1="-5" x2="-13" y2="-7" stroke="#3a1a5a" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="-9" y1="-1" x2="-13" y2="-1" stroke="#3a1a5a" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="10" y1="-5" x2="13" y2="-7" stroke="#3a1a5a" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="9" y1="-1" x2="13" y2="-1" stroke="#3a1a5a" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="-8" y1="7" x2="-11" y2="9" stroke="#3a1a5a" stroke-width="0.7" stroke-linecap="round"/>
      <line x1="8" y1="7" x2="11" y2="9" stroke="#3a1a5a" stroke-width="0.7" stroke-linecap="round"/>
    `;
    // Head with small pedipalps
    const headBase = `
      <ellipse cx="0" cy="-8" rx="7" ry="5.5" fill="url(#spider-body-grad)" stroke="#2a1040" stroke-width="0.6"/>
    `;

    /* ── idle ── */
    const idleLegsLeft = `
      <polyline points="-10,0 -18,-8 -24,-3 -28,4" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,2 -17,-2 -23,2 -27,10" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,4 -16,4 -21,8 -25,16" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-9,7 -14,10 -18,15 -22,22" fill="none" stroke="#2a1040" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const idleLegsRight = `
      <polyline points="10,0 18,-8 24,-3 28,4" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,2 17,-2 23,2 27,10" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,4 16,4 21,8 25,16" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9,7 14,10 18,15 22,22" fill="none" stroke="#2a1040" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const idleEyes = `
      <!-- front big eyes -->
      <ellipse cx="-3" cy="-9" rx="2.8" ry="2.5" fill="url(#spider-eye-grad)"/>
      <ellipse cx="3" cy="-9" rx="2.8" ry="2.5" fill="url(#spider-eye-grad)"/>
      <circle cx="-2.5" cy="-9.5" r="1.2" fill="#1a0a2e"/>
      <circle cx="3.5" cy="-9.5" r="1.2" fill="#1a0a2e"/>
      <!-- eye highlights -->
      <circle cx="-1.8" cy="-10.2" r="0.5" fill="#fff" opacity="0.8"/>
      <circle cx="4.2" cy="-10.2" r="0.5" fill="#fff" opacity="0.8"/>
      <!-- rear small eyes -->
      <circle cx="-5" cy="-10.5" r="1.2" fill="#c8c8e0"/>
      <circle cx="5" cy="-10.5" r="1.2" fill="#c8c8e0"/>
      <circle cx="-5" cy="-10.5" r="0.5" fill="#1a0a2e"/>
      <circle cx="5" cy="-10.5" r="0.5" fill="#1a0a2e"/>
      <!-- top tiny eyes -->
      <circle cx="-2" cy="-12" r="0.8" fill="#c8c8e0"/>
      <circle cx="2" cy="-12" r="0.8" fill="#c8c8e0"/>
    `;

    const idle = `
      <g class="creature__pose creature__pose--idle">
        ${thread}
        ${idleLegsLeft}${idleLegsRight}
        ${bodyBase}
        ${headBase}
        ${idleEyes}
      </g>`;

    /* ── scare: drops lower, legs spread wide, yellow eyes, fangs ── */
    const scareLegsLeft = `
      <polyline points="-10,0 -22,-12 -30,-6 -34,2" fill="none" stroke="#2a1040" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,2 -22,-4 -30,0 -34,8" fill="none" stroke="#2a1040" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,4 -20,4 -28,8 -33,16" fill="none" stroke="#2a1040" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-9,7 -18,12 -25,18 -30,26" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const scareLegsRight = `
      <polyline points="10,0 22,-12 30,-6 34,2" fill="none" stroke="#2a1040" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,2 22,-4 30,0 34,8" fill="none" stroke="#2a1040" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,4 20,4 28,8 33,16" fill="none" stroke="#2a1040" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9,7 18,12 25,18 30,26" fill="none" stroke="#2a1040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const scareEyes = `
      <!-- narrowed glinting yellow eyes -->
      <ellipse cx="-3" cy="-9" rx="3" ry="1.5" fill="url(#spider-eye-scare)"/>
      <ellipse cx="3" cy="-9" rx="3" ry="1.5" fill="url(#spider-eye-scare)"/>
      <ellipse cx="-3" cy="-9" rx="1.5" ry="0.8" fill="#1a0a0a"/>
      <ellipse cx="3" cy="-9" rx="1.5" ry="0.8" fill="#1a0a0a"/>
      <!-- yellow glint -->
      <circle cx="-1.5" cy="-9.3" r="0.4" fill="#fff" opacity="0.9"/>
      <circle cx="4.5" cy="-9.3" r="0.4" fill="#fff" opacity="0.9"/>
      <!-- rear eyes narrowed -->
      <ellipse cx="-5" cy="-10.5" rx="1.2" ry="0.6" fill="#ccaa00"/>
      <ellipse cx="5" cy="-10.5" rx="1.2" ry="0.6" fill="#ccaa00"/>
      <circle cx="-2" cy="-12" r="0.7" fill="#ccaa00"/>
      <circle cx="2" cy="-12" r="0.7" fill="#ccaa00"/>
    `;
    const fangs = `
      <line x1="-2" y1="-3" x2="-3" y2="1" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="2" y1="-3" x2="3" y2="1" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
    `;

    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- longer thread (dropped lower) -->
        <line x1="0" y1="-50" x2="0" y2="-14" stroke="#888" stroke-width="0.6" opacity="0.7"/>
        ${scareLegsLeft}${scareLegsRight}
        ${bodyBase}
        ${headBase}
        ${scareEyes}
        ${fangs}
      </g>`;

    /* ── hug: legs curl inward, round body, dewy eyes, blush ── */
    const hugLegsLeft = `
      <polyline points="-10,0 -14,-4 -12,2 -8,6" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,2 -14,0 -13,5 -9,8" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-10,4 -13,6 -11,10 -7,11" fill="none" stroke="#2a1040" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="-9,7 -11,10 -9,13 -5,13" fill="none" stroke="#2a1040" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const hugLegsRight = `
      <polyline points="10,0 14,-4 12,2 8,6" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,2 14,0 13,5 9,8" fill="none" stroke="#2a1040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,4 13,6 11,10 7,11" fill="none" stroke="#2a1040" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9,7 11,10 9,13 5,13" fill="none" stroke="#2a1040" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const hugEyes = `
      <!-- big dewy eyes -->
      <ellipse cx="-3" cy="-9" rx="3.2" ry="3" fill="url(#spider-eye-grad)"/>
      <ellipse cx="3" cy="-9" rx="3.2" ry="3" fill="url(#spider-eye-grad)"/>
      <circle cx="-2.5" cy="-9.5" r="1.5" fill="#1a0a2e"/>
      <circle cx="3.5" cy="-9.5" r="1.5" fill="#1a0a2e"/>
      <!-- big sparkle highlights -->
      <circle cx="-1.5" cy="-10.5" r="0.7" fill="#fff"/>
      <circle cx="4.5" cy="-10.5" r="0.7" fill="#fff"/>
      <circle cx="-3.5" cy="-8.5" r="0.4" fill="#fff" opacity="0.6"/>
      <circle cx="2.5" cy="-8.5" r="0.4" fill="#fff" opacity="0.6"/>
      <!-- rear eyes soft -->
      <circle cx="-5" cy="-10.5" r="1" fill="#d8d8f0"/>
      <circle cx="5" cy="-10.5" r="1" fill="#d8d8f0"/>
      <circle cx="-2" cy="-12" r="0.7" fill="#d8d8f0"/>
      <circle cx="2" cy="-12" r="0.7" fill="#d8d8f0"/>
    `;
    const blush = `
      <ellipse cx="-6" cy="-6" rx="2" ry="1.2" fill="#ff6688" opacity="0.4"/>
      <ellipse cx="6" cy="-6" rx="2" ry="1.2" fill="#ff6688" opacity="0.4"/>
    `;
    // Rounder body for hug pose
    const hugBody = `
      <ellipse cx="0" cy="2" rx="13" ry="11" fill="url(#spider-body-grad)" stroke="#2a1040" stroke-width="0.8"/>
      <ellipse cx="-3" cy="-2" rx="5" ry="3.5" fill="#7a4aaa" opacity="0.25"/>
    `;

    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        ${thread}
        ${hugLegsLeft}${hugLegsRight}
        ${hugBody}
        ${headBase}
        ${hugEyes}
        ${blush}
      </g>`;

    return `${_defs('spider')}${idle}${scare}${hug}`;
  }

  /* ─── Gorilla factory (~60x70 centred at origin) ─── */

  function _gorilla() {
    /* ── idle: knuckle-standing, one hand slightly raised ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- body (massive barrel torso) -->
        <ellipse cx="0" cy="5" rx="20" ry="24" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <!-- chest plate (silverback highlight) -->
        <ellipse cx="0" cy="6" rx="12" ry="14" fill="#4a4a4a" opacity="0.3"/>
        <!-- pectoral definition -->
        <path d="M-8,-2 Q0,4 8,-2" fill="none" stroke="#2a2a2a" stroke-width="0.8" opacity="0.5"/>
        <!-- fur texture strokes -->
        <line x1="-16" y1="-5" x2="-20" y2="-7" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="-17" y1="0" x2="-21" y2="0" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="16" y1="-5" x2="20" y2="-7" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="17" y1="0" x2="21" y2="0" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="-14" y1="15" x2="-17" y2="17" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="14" y1="15" x2="17" y2="17" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <!-- massive shoulders -->
        <ellipse cx="0" cy="-8" rx="26" ry="12" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- shoulder muscle caps -->
        <ellipse cx="-20" cy="-6" rx="8" ry="6" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.4"/>
        <ellipse cx="20" cy="-6" rx="8" ry="6" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.4"/>
        <!-- left arm (knuckle-standing, thick with muscle bulge) -->
        <path d="M-22,-4 Q-30,6 -28,18 Q-27,24 -23,27" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <!-- left bicep highlight -->
        <path d="M-24,2 Q-27,6 -26,10" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        <!-- left fist -->
        <ellipse cx="-23" cy="28" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- right arm (slightly raised, thick) -->
        <path d="M22,-4 Q30,4 28,14 Q27,18 25,20" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <!-- right bicep highlight -->
        <path d="M25,0 Q28,4 27,8" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        <!-- right hand open -->
        <ellipse cx="25" cy="21" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- thick legs -->
        <path d="M-9,24 Q-12,30 -10,36" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
        <path d="M9,24 Q12,30 10,36" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
        <!-- feet -->
        <ellipse cx="-10" cy="37" rx="6" ry="3" fill="#2a1a1a"/>
        <ellipse cx="10" cy="37" rx="6" ry="3" fill="#2a1a1a"/>
        <!-- head -->
        <ellipse cx="0" cy="-18" rx="13" ry="11" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- brow ridge -->
        <path d="M-10,-22 Q0,-26 10,-22" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round"/>
        <!-- face -->
        <ellipse cx="0" cy="-15" rx="8" ry="6" fill="url(#gorilla-face-grad)" stroke="#2a1a0a" stroke-width="0.5"/>
        <!-- eyes (deep-set, gentle) -->
        <ellipse cx="-4" cy="-19" rx="2" ry="1.8" fill="#1a1a0a"/>
        <circle cx="-3.5" cy="-19.3" r="0.8" fill="#4a3a2a"/>
        <circle cx="-3" cy="-19.8" r="0.4" fill="#fff" opacity="0.7"/>
        <ellipse cx="4" cy="-19" rx="2" ry="1.8" fill="#1a1a0a"/>
        <circle cx="4.5" cy="-19.3" r="0.8" fill="#4a3a2a"/>
        <circle cx="5" cy="-19.8" r="0.4" fill="#fff" opacity="0.7"/>
        <!-- nose -->
        <ellipse cx="0" cy="-14" rx="3" ry="2" fill="#2a1a0a" opacity="0.6"/>
        <circle cx="-1.5" cy="-13.5" r="0.8" fill="#1a0a0a"/>
        <circle cx="1.5" cy="-13.5" r="0.8" fill="#1a0a0a"/>
        <!-- slight underbite tooth -->
        <rect x="-1" y="-11" width="2.5" height="2" rx="0.5" fill="#e8e0d0" opacity="0.8"/>
        <!-- ears -->
        <ellipse cx="-12" cy="-18" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
        <ellipse cx="-12" cy="-18" rx="1.5" ry="2.5" fill="#8a5a5a" opacity="0.5"/>
        <ellipse cx="12" cy="-18" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
        <ellipse cx="12" cy="-18" rx="1.5" ry="2.5" fill="#8a5a5a" opacity="0.5"/>
      </g>`;

    /* ── scare: stands upright, arms wide, roaring ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- body upright, puffed chest -->
        <ellipse cx="0" cy="2" rx="22" ry="26" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <!-- chest plate bulging -->
        <ellipse cx="0" cy="2" rx="14" ry="16" fill="#4a4a4a" opacity="0.25"/>
        <path d="M-10,-4 Q0,4 10,-4" fill="none" stroke="#2a2a2a" stroke-width="1" opacity="0.4"/>
        <!-- massive raised shoulders -->
        <ellipse cx="0" cy="-16" rx="28" ry="13" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- shoulder muscle caps (bigger when flexed) -->
        <ellipse cx="-24" cy="-12" rx="9" ry="7" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.4"/>
        <ellipse cx="24" cy="-12" rx="9" ry="7" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.4"/>
        <!-- arms spread wide (thick, muscular) -->
        <path d="M-26,-8 Q-36,-6 -40,2 Q-42,6 -40,10" fill="none" stroke="#1a1a1a" stroke-width="8" stroke-linecap="round"/>
        <!-- left bicep bulge -->
        <path d="M-30,-4 Q-34,0 -33,4" fill="none" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <ellipse cx="-40" cy="12" rx="6" ry="5" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- fingers spread -->
        <line x1="-40" y1="8" x2="-44" y2="5" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="-41" y1="10" x2="-46" y2="9" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="-41" y1="12" x2="-45" y2="13" stroke="#3a2a1a" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M26,-8 Q36,-6 40,2 Q42,6 40,10" fill="none" stroke="#1a1a1a" stroke-width="8" stroke-linecap="round"/>
        <!-- right bicep bulge -->
        <path d="M30,-4 Q34,0 33,4" fill="none" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <ellipse cx="40" cy="12" rx="6" ry="5" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <line x1="40" y1="8" x2="44" y2="5" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="41" y1="10" x2="46" y2="9" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="41" y1="12" x2="45" y2="13" stroke="#3a2a1a" stroke-width="1.3" stroke-linecap="round"/>
        <!-- thick legs planted wide -->
        <path d="M-10,24 Q-14,30 -13,36" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <path d="M10,24 Q14,30 13,36" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="-13" cy="37" rx="7" ry="3" fill="#2a1a1a"/>
        <ellipse cx="13" cy="37" rx="7" ry="3" fill="#2a1a1a"/>
        <!-- fur strokes (agitated) -->
        <line x1="-18" y1="-8" x2="-22" y2="-10" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="18" y1="-8" x2="22" y2="-10" stroke="#2a2a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="-16" y1="5" x2="-20" y2="5" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="16" y1="5" x2="20" y2="5" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <!-- head -->
        <ellipse cx="0" cy="-24" rx="14" ry="12" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- fierce brow -->
        <path d="M-11,-28 Q-5,-33 0,-30 Q5,-33 11,-28" fill="none" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- face -->
        <ellipse cx="0" cy="-21" rx="9" ry="7" fill="url(#gorilla-face-grad)" stroke="#2a1a0a" stroke-width="0.5"/>
        <!-- fierce eyes -->
        <ellipse cx="-4" cy="-26" rx="2.5" ry="1.5" fill="#1a0a0a"/>
        <circle cx="-3.5" cy="-26" r="0.8" fill="#8a2a0a"/>
        <ellipse cx="4" cy="-26" rx="2.5" ry="1.5" fill="#1a0a0a"/>
        <circle cx="4.5" cy="-26" r="0.8" fill="#8a2a0a"/>
        <!-- open roaring mouth -->
        <ellipse cx="0" cy="-18" rx="7" ry="5" fill="#2a0a0a"/>
        <!-- teeth -->
        <rect x="-5" y="-21" width="2" height="2.5" rx="0.5" fill="#e8e0d0"/>
        <rect x="-2" y="-21.5" width="1.8" height="2" rx="0.4" fill="#e8e0d0"/>
        <rect x="1" y="-21.5" width="1.8" height="2" rx="0.4" fill="#e8e0d0"/>
        <rect x="3.5" y="-21" width="2" height="2.5" rx="0.5" fill="#e8e0d0"/>
        <!-- bottom teeth -->
        <rect x="-3" y="-15" width="1.5" height="1.8" rx="0.4" fill="#e8e0d0"/>
        <rect x="0" y="-15.2" width="1.5" height="1.6" rx="0.4" fill="#e8e0d0"/>
        <rect x="2.5" y="-15" width="1.5" height="1.8" rx="0.4" fill="#e8e0d0"/>
        <!-- ears -->
        <ellipse cx="-13" cy="-24" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
        <ellipse cx="13" cy="-24" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
      </g>`;

    /* ── hug: sitting, arms open, gentle head tilt ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- body sitting (still massive) -->
        <ellipse cx="0" cy="10" rx="21" ry="22" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <ellipse cx="0" cy="12" rx="13" ry="13" fill="#4a4a4a" opacity="0.25"/>
        <!-- shoulders relaxed but broad -->
        <ellipse cx="0" cy="-4" rx="24" ry="10" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <ellipse cx="-19" cy="-2" rx="7" ry="5" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.3"/>
        <ellipse cx="19" cy="-2" rx="7" ry="5" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.3"/>
        <!-- arms open forward (inviting, thick) -->
        <path d="M-22,0 Q-30,6 -30,16 Q-30,20 -26,22" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="-25" cy="23" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <path d="M22,0 Q30,6 30,16 Q30,20 26,22" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="25" cy="23" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- legs folded sitting -->
        <path d="M-10,28 Q-15,32 -17,34 Q-17,37 -10,37" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
        <path d="M10,28 Q15,32 17,34 Q17,37 10,37" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="-8" cy="37" rx="6" ry="3" fill="#2a1a1a"/>
        <ellipse cx="8" cy="37" rx="6" ry="3" fill="#2a1a1a"/>
        <!-- head (slightly tilted) -->
        <g transform="rotate(8, 0, -16)">
          <ellipse cx="0" cy="-16" rx="13" ry="11" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
          <!-- soft brow -->
          <path d="M-9,-20 Q0,-23 9,-20" fill="none" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="round"/>
          <!-- face -->
          <ellipse cx="0" cy="-13" rx="8" ry="6" fill="url(#gorilla-face-grad)" stroke="#2a1a0a" stroke-width="0.5"/>
          <!-- gentle eyes -->
          <ellipse cx="-4" cy="-17" rx="2.2" ry="2" fill="#1a1a0a"/>
          <circle cx="-3.5" cy="-17.3" r="1" fill="#5a4a3a"/>
          <circle cx="-3" cy="-17.8" r="0.5" fill="#fff" opacity="0.8"/>
          <ellipse cx="4" cy="-17" rx="2.2" ry="2" fill="#1a1a0a"/>
          <circle cx="4.5" cy="-17.3" r="1" fill="#5a4a3a"/>
          <circle cx="5" cy="-17.8" r="0.5" fill="#fff" opacity="0.8"/>
          <!-- gentle smile -->
          <path d="M-3,-10 Q0,-8 3,-10" fill="none" stroke="#2a1a0a" stroke-width="0.8" stroke-linecap="round"/>
          <!-- tooth -->
          <rect x="-0.5" y="-10.5" width="2" height="1.5" rx="0.5" fill="#e8e0d0" opacity="0.7"/>
          <!-- ears -->
          <ellipse cx="-12" cy="-16" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
          <ellipse cx="-12" cy="-16" rx="1.5" ry="2.5" fill="#8a5a5a" opacity="0.5"/>
          <ellipse cx="12" cy="-16" rx="3" ry="4" fill="#2a2a2a" stroke="#0a0a0a" stroke-width="0.5"/>
          <ellipse cx="12" cy="-16" rx="1.5" ry="2.5" fill="#8a5a5a" opacity="0.5"/>
        </g>
      </g>`;

    return `${_defs('gorilla')}${idle}${scare}${hug}`;
  }

  /* ─── Bat factory (~55x40 centred at origin) ─── */

  function _bat() {
    const bodyCore = `
      <!-- fuzzy body -->
      <ellipse cx="0" cy="0" rx="7" ry="9" fill="url(#bat-body-grad)" stroke="#1a0a2a" stroke-width="0.7"/>
      <!-- body sheen -->
      <ellipse cx="-2" cy="-3" rx="3" ry="4" fill="#7a6a8a" opacity="0.2"/>
      <!-- fur texture -->
      <line x1="-6" y1="-3" x2="-8" y2="-4" stroke="#3a2a4a" stroke-width="0.6" stroke-linecap="round"/>
      <line x1="6" y1="-3" x2="8" y2="-4" stroke="#3a2a4a" stroke-width="0.6" stroke-linecap="round"/>
      <line x1="-5" y1="3" x2="-7" y2="4" stroke="#3a2a4a" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="5" y1="3" x2="7" y2="4" stroke="#3a2a4a" stroke-width="0.5" stroke-linecap="round"/>
    `;
    const ears = `
      <!-- oversized pointed ears -->
      <path d="M-5,-8 L-9,-20 L-2,-10" fill="#3a2a4a" stroke="#1a0a2a" stroke-width="0.6"/>
      <path d="M-6,-12 L-7,-17 L-3,-11" fill="#8a5a7a" opacity="0.5"/>
      <path d="M5,-8 L9,-20 L2,-10" fill="#3a2a4a" stroke="#1a0a2a" stroke-width="0.6"/>
      <path d="M6,-12 L7,-17 L3,-11" fill="#8a5a7a" opacity="0.5"/>
    `;
    const idleEyes = `
      <circle cx="-2.5" cy="-4" r="2.2" fill="#0a0a0a"/>
      <circle cx="-2.5" cy="-4" r="1.8" fill="#1a1a2a"/>
      <circle cx="-2" cy="-4.5" r="0.6" fill="#fff" opacity="0.8"/>
      <circle cx="2.5" cy="-4" r="2.2" fill="#0a0a0a"/>
      <circle cx="2.5" cy="-4" r="1.8" fill="#1a1a2a"/>
      <circle cx="3" cy="-4.5" r="0.6" fill="#fff" opacity="0.8"/>
    `;
    const tinyFangs = `
      <line x1="-1.5" y1="1" x2="-1.5" y2="3" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>
      <line x1="1.5" y1="1" x2="1.5" y2="3" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>
    `;
    const feet = `
      <path d="M-3,8 L-4,11 M-3,8 L-2,11 M-3,8 L-5,10" stroke="#3a2a4a" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M3,8 L4,11 M3,8 L2,11 M3,8 L5,10" stroke="#3a2a4a" stroke-width="0.6" stroke-linecap="round"/>
    `;

    /* ── idle: hanging upside-down, wings folded ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- ceiling line to hang from -->
        <line x1="-8" y1="-25" x2="8" y2="-25" stroke="#5a4a3a" stroke-width="1.5" stroke-linecap="round"/>
        <!-- hanging grip -->
        <path d="M-2,-25 L-2,-20 M2,-25 L2,-20" stroke="#3a2a4a" stroke-width="0.8"/>
        <!-- body is inverted (hanging upside-down) -->
        <g transform="rotate(180, 0, -10)">
          <!-- folded wings close to body -->
          <path d="M-6,-2 Q-14,-6 -16,0 Q-15,6 -7,6" fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.6" opacity="0.8"/>
          <!-- wing vein -->
          <line x1="-7,-1" y1="-7" x2="-14" y2="-3" stroke="#2a1a3a" stroke-width="0.3" opacity="0.5"/>
          <path d="M6,-2 Q14,-6 16,0 Q15,6 7,6" fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.6" opacity="0.8"/>
          <line x1="7" y1="-1" x2="14" y2="-3" stroke="#2a1a3a" stroke-width="0.3" opacity="0.5"/>
          ${bodyCore}
          ${ears}
          ${idleEyes}
          ${tinyFangs}
          ${feet}
        </g>
      </g>`;

    /* ── scare: wings open wide, swoops down, red eyes ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- wings snapped open wide with vein patterns -->
        <path d="M-6,-2 Q-15,-14 -28,-10 Q-26,-4 -24,2 Q-20,6 -14,8 Q-10,6 -7,4"
              fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.7"/>
        <!-- wing finger bones / veins -->
        <line x1="-7" y1="-2" x2="-25" y2="-8" stroke="#2a1a3a" stroke-width="0.4" opacity="0.6"/>
        <line x1="-7" y1="0" x2="-23" y2="-2" stroke="#2a1a3a" stroke-width="0.4" opacity="0.5"/>
        <line x1="-7" y1="2" x2="-20" y2="4" stroke="#2a1a3a" stroke-width="0.3" opacity="0.5"/>
        <line x1="-8" y1="3" x2="-16" y2="7" stroke="#2a1a3a" stroke-width="0.3" opacity="0.4"/>
        <path d="M6,-2 Q15,-14 28,-10 Q26,-4 24,2 Q20,6 14,8 Q10,6 7,4"
              fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.7"/>
        <line x1="7" y1="-2" x2="25" y2="-8" stroke="#2a1a3a" stroke-width="0.4" opacity="0.6"/>
        <line x1="7" y1="0" x2="23" y2="-2" stroke="#2a1a3a" stroke-width="0.4" opacity="0.5"/>
        <line x1="7" y1="2" x2="20" y2="4" stroke="#2a1a3a" stroke-width="0.3" opacity="0.5"/>
        <line x1="8" y1="3" x2="16" y2="7" stroke="#2a1a3a" stroke-width="0.3" opacity="0.4"/>
        ${bodyCore}
        ${ears}
        <!-- red flash eyes -->
        <circle cx="-2.5" cy="-4" r="2.5" fill="url(#bat-eye-scare)"/>
        <circle cx="-2.5" cy="-4" r="1" fill="#ff0000" opacity="0.8"/>
        <circle cx="-2" cy="-4.8" r="0.5" fill="#fff" opacity="0.6"/>
        <circle cx="2.5" cy="-4" r="2.5" fill="url(#bat-eye-scare)"/>
        <circle cx="2.5" cy="-4" r="1" fill="#ff0000" opacity="0.8"/>
        <circle cx="3" cy="-4.8" r="0.5" fill="#fff" opacity="0.6"/>
        <!-- prominent fangs -->
        <line x1="-1.5" y1="1" x2="-2" y2="5" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
        <line x1="1.5" y1="1" x2="2" y2="5" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
        <!-- open mouth -->
        <ellipse cx="0" cy="2" rx="3" ry="1.5" fill="#2a0a0a" opacity="0.6"/>
        ${feet}
      </g>`;

    /* ── hug: wings wrapped like a blanket, content face ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- wings wrapped around body -->
        <path d="M-7,-6 Q-16,-8 -18,-2 Q-17,4 -14,8 Q-10,12 -4,12 Q-2,10 -1,6"
              fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.6"/>
        <path d="M7,-6 Q16,-8 18,-2 Q17,4 14,8 Q10,12 4,12 Q2,10 1,6"
              fill="url(#bat-wing-grad)" stroke="#1a0a2a" stroke-width="0.6"/>
        <!-- wing vein showing through -->
        <line x1="-6" y1="-3" x2="-14" y2="0" stroke="#2a1a3a" stroke-width="0.3" opacity="0.4"/>
        <line x1="6" y1="-3" x2="14" y2="0" stroke="#2a1a3a" stroke-width="0.3" opacity="0.4"/>
        ${bodyCore}
        ${ears}
        <!-- half-closed content eyes -->
        <ellipse cx="-2.5" cy="-4" rx="2" ry="1" fill="#1a1a2a"/>
        <circle cx="-2" cy="-4.2" r="0.4" fill="#fff" opacity="0.6"/>
        <ellipse cx="2.5" cy="-4" rx="2" ry="1" fill="#1a1a2a"/>
        <circle cx="3" cy="-4.2" r="0.4" fill="#fff" opacity="0.6"/>
        <!-- tiny happy smile -->
        <path d="M-2,0 Q0,2 2,0" fill="none" stroke="#5a3a4a" stroke-width="0.6" stroke-linecap="round"/>
        <!-- blush -->
        <ellipse cx="-5" cy="-2" rx="1.5" ry="0.8" fill="#ff6688" opacity="0.3"/>
        <ellipse cx="5" cy="-2" rx="1.5" ry="0.8" fill="#ff6688" opacity="0.3"/>
        ${feet}
      </g>`;

    return `${_defs('bat')}${idle}${scare}${hug}`;
  }

  /* ─── Cat factory (~45x50 centred at origin) ─── */

  function _cat() {
    const whiskers = (side) => {
      const s = side === 'left' ? -1 : 1;
      return `
        <line x1="${s * 5}" y1="-14" x2="${s * 16}" y2="-17" stroke="#888" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="${s * 5}" y1="-13" x2="${s * 17}" y2="-13" stroke="#888" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="${s * 5}" y1="-12" x2="${s * 16}" y2="-9" stroke="#888" stroke-width="0.4" stroke-linecap="round"/>
      `;
    };

    /* ── idle: sitting, tail curving, half-lidded eyes ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- tail curving around -->
        <path d="M8,15 Q18,12 20,2 Q22,-8 18,-14 Q16,-18 14,-16"
              fill="none" stroke="url(#cat-body-grad)" stroke-width="3" stroke-linecap="round"/>
        <!-- tail fluffy tip -->
        <ellipse cx="14" cy="-17" rx="3" ry="4" fill="#1a0a2a" opacity="0.8"/>
        <!-- body (sitting) -->
        <ellipse cx="0" cy="8" rx="12" ry="14" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.6"/>
        <!-- purple sheen on body -->
        <ellipse cx="-3" cy="4" rx="5" ry="7" fill="#2a1a4a" opacity="0.2"/>
        <!-- front paws -->
        <ellipse cx="-5" cy="20" rx="3.5" ry="2.5" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.4"/>
        <ellipse cx="5" cy="20" rx="3.5" ry="2.5" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.4"/>
        <!-- head -->
        <ellipse cx="0" cy="-10" rx="11" ry="9" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.5"/>
        <!-- ears -->
        <path d="M-8,-16 L-11,-26 L-4,-18" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <path d="M-9,-19 L-10,-24 L-5,-18" fill="#9a5a6a" opacity="0.5"/>
        <path d="M8,-16 L11,-26 L4,-18" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <path d="M9,-19 L10,-24 L5,-18" fill="#9a5a6a" opacity="0.5"/>
        <!-- eyes (half-lidded, watchful, slit pupils) -->
        <ellipse cx="-4" cy="-11" rx="3" ry="2.2" fill="url(#cat-eye-grad)"/>
        <ellipse cx="-4" cy="-11" rx="1" ry="2.2" fill="#0a0a0a"/>
        <circle cx="-3.2" cy="-11.8" r="0.5" fill="#fff" opacity="0.7"/>
        <!-- half-lid -->
        <path d="M-7,-12.5 Q-4,-11 -1,-12.5" fill="url(#cat-body-grad)" opacity="0.5"/>
        <ellipse cx="4" cy="-11" rx="3" ry="2.2" fill="url(#cat-eye-grad)"/>
        <ellipse cx="4" cy="-11" rx="1" ry="2.2" fill="#0a0a0a"/>
        <circle cx="4.8" cy="-11.8" r="0.5" fill="#fff" opacity="0.7"/>
        <path d="M1,-12.5 Q4,-11 7,-12.5" fill="url(#cat-body-grad)" opacity="0.5"/>
        <!-- pink nose -->
        <ellipse cx="0" cy="-8" rx="1.5" ry="1" fill="#cc7788"/>
        <!-- mouth line -->
        <path d="M-2,-7 Q0,-6 2,-7" fill="none" stroke="#2a1a2a" stroke-width="0.5" stroke-linecap="round"/>
        ${whiskers('left')}
        ${whiskers('right')}
      </g>`;

    /* ── scare: back arched, fur on end, hissing ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- puffed tail (twice as thick) -->
        <path d="M10,10 Q22,6 24,-2 Q26,-12 20,-18 Q18,-22 15,-20"
              fill="none" stroke="#1a0a2a" stroke-width="6" stroke-linecap="round"/>
        <!-- tail fur spikes -->
        <line x1="18" y1="-4" x2="22" y2="-7" stroke="#1a0a2a" stroke-width="1" stroke-linecap="round"/>
        <line x1="20" y1="-10" x2="24" y2="-14" stroke="#1a0a2a" stroke-width="1" stroke-linecap="round"/>
        <line x1="22" y1="0" x2="26" y2="-2" stroke="#1a0a2a" stroke-width="1" stroke-linecap="round"/>
        <!-- arched body -->
        <path d="M-10,16 Q-8,0 0,-4 Q8,0 10,16" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.6"/>
        <!-- fur on end (spiky outline strokes radiating outward) -->
        <line x1="-8" y1="2" x2="-12" y2="-2" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="-6" y1="-1" x2="-9" y2="-5" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="-3" y1="-3" x2="-5" y2="-7" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="0" y2="-8" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="3" y1="-3" x2="5" y2="-7" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="6" y1="-1" x2="9" y2="-5" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="8" y1="2" x2="12" y2="-2" stroke="#1a0a2a" stroke-width="0.8" stroke-linecap="round"/>
        <!-- legs tense -->
        <path d="M-8,14 L-8,20" stroke="#0a0a1a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M-3,16 L-3,22" stroke="#0a0a1a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M3,16 L3,22" stroke="#0a0a1a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M8,14 L8,20" stroke="#0a0a1a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- paws -->
        <ellipse cx="-8" cy="21" rx="3" ry="2" fill="#1a0a2a"/>
        <ellipse cx="-3" cy="23" rx="3" ry="2" fill="#1a0a2a"/>
        <ellipse cx="3" cy="23" rx="3" ry="2" fill="#1a0a2a"/>
        <ellipse cx="8" cy="21" rx="3" ry="2" fill="#1a0a2a"/>
        <!-- head (forward, aggressive) -->
        <ellipse cx="0" cy="-10" rx="11" ry="9" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.5"/>
        <!-- ears flat back (aggressive) -->
        <path d="M-7,-16 L-13,-22 L-3,-17" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <path d="M7,-16 L13,-22 L3,-17" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <!-- wide eyes, tiny pupils -->
        <ellipse cx="-4" cy="-11" rx="3.5" ry="3" fill="url(#cat-eye-grad)"/>
        <ellipse cx="-4" cy="-11" rx="0.5" ry="2" fill="#0a0a0a"/>
        <circle cx="-3" cy="-12" r="0.5" fill="#fff" opacity="0.8"/>
        <ellipse cx="4" cy="-11" rx="3.5" ry="3" fill="url(#cat-eye-grad)"/>
        <ellipse cx="4" cy="-11" rx="0.5" ry="2" fill="#0a0a0a"/>
        <circle cx="5" cy="-12" r="0.5" fill="#fff" opacity="0.8"/>
        <!-- pink nose -->
        <ellipse cx="0" cy="-8" rx="1.5" ry="1" fill="#cc7788"/>
        <!-- open hissing mouth -->
        <ellipse cx="0" cy="-5.5" rx="4" ry="3" fill="#2a0a0a"/>
        <!-- teeth -->
        <line x1="-2.5" y1="-7.5" x2="-2.5" y2="-5" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
        <line x1="2.5" y1="-7.5" x2="2.5" y2="-5" stroke="#e8e0d0" stroke-width="0.8" stroke-linecap="round"/>
        <!-- tongue -->
        <ellipse cx="0" cy="-4" rx="2" ry="1" fill="#cc5566" opacity="0.6"/>
        ${whiskers('left')}
        ${whiskers('right')}
      </g>`;

    /* ── hug: flopped on back, belly up, squinty happy eyes, purr lines ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- body flopped on back -->
        <ellipse cx="0" cy="5" rx="14" ry="12" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.6"/>
        <!-- exposed belly (lighter) -->
        <ellipse cx="0" cy="6" rx="8" ry="7" fill="#2a1a3a" opacity="0.4"/>
        <!-- tail limp and happy -->
        <path d="M12,10 Q18,14 20,10 Q22,6 20,4"
              fill="none" stroke="#1a0a2a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- fluffy tail tip -->
        <ellipse cx="20" cy="3" rx="2.5" ry="3" fill="#1a0a2a" opacity="0.8"/>
        <!-- paws curled up -->
        <path d="M-8,-2 Q-12,-6 -10,-8" fill="none" stroke="#1a0a2a" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="-10" cy="-9" rx="2.5" ry="2" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.3"/>
        <path d="M8,-2 Q12,-6 10,-8" fill="none" stroke="#1a0a2a" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="10" cy="-9" rx="2.5" ry="2" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.3"/>
        <!-- back paws up -->
        <path d="M-7,14 Q-10,18 -8,20" fill="none" stroke="#1a0a2a" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="-7" cy="21" rx="2.5" ry="2" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.3"/>
        <path d="M7,14 Q10,18 8,20" fill="none" stroke="#1a0a2a" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="7" cy="21" rx="2.5" ry="2" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.3"/>
        <!-- head -->
        <ellipse cx="0" cy="-10" rx="11" ry="9" fill="url(#cat-body-grad)" stroke="#0a0a1a" stroke-width="0.5"/>
        <!-- ears relaxed -->
        <path d="M-8,-16 L-10,-25 L-4,-17" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <path d="M-9,-19 L-9.5,-23 L-5,-17" fill="#9a5a6a" opacity="0.5"/>
        <path d="M8,-16 L10,-25 L4,-17" fill="#1a0a2a" stroke="#0a0a1a" stroke-width="0.5"/>
        <path d="M9,-19 L9.5,-23 L5,-17" fill="#9a5a6a" opacity="0.5"/>
        <!-- squinted happy eyes -->
        <path d="M-6,-11 Q-4,-9 -2,-11" fill="none" stroke="#228822" stroke-width="1" stroke-linecap="round"/>
        <path d="M2,-11 Q4,-9 6,-11" fill="none" stroke="#228822" stroke-width="1" stroke-linecap="round"/>
        <!-- pink nose -->
        <ellipse cx="0" cy="-8" rx="1.5" ry="1" fill="#cc7788"/>
        <!-- content smile -->
        <path d="M-2,-7 Q0,-5.5 2,-7" fill="none" stroke="#3a1a2a" stroke-width="0.5" stroke-linecap="round"/>
        <!-- blush -->
        <ellipse cx="-6" cy="-8" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
        <ellipse cx="6" cy="-8" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
        ${whiskers('left')}
        ${whiskers('right')}
        <!-- purr lines -->
        <path d="M-16,-6 Q-14,-4 -16,-2" fill="none" stroke="#888" stroke-width="0.5" opacity="0.5"/>
        <path d="M-18,-5 Q-16,-3 -18,-1" fill="none" stroke="#888" stroke-width="0.4" opacity="0.4"/>
        <path d="M16,-6 Q14,-4 16,-2" fill="none" stroke="#888" stroke-width="0.5" opacity="0.5"/>
        <path d="M18,-5 Q16,-3 18,-1" fill="none" stroke="#888" stroke-width="0.4" opacity="0.4"/>
      </g>`;

    return `${_defs('cat')}${idle}${scare}${hug}`;
  }

  /* ─── Owl factory (~45x50 centred at origin) ─── */

  function _owl() {
    /* Shared feather texture strokes on the body */
    const featherTexture = `
      <!-- V-shaped chest feather markings -->
      <line x1="-3" y1="4" x2="-1" y2="7" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="-1" y1="7" x2="1" y2="4" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="-5" y1="8" x2="-3" y2="11" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="-3" y1="11" x2="-1" y2="8" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="1" y1="8" x2="3" y2="11" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="3" y1="11" x2="5" y2="8" stroke="#5a3a18" stroke-width="0.5" stroke-linecap="round"/>
      <line x1="-4" y1="13" x2="-2" y2="16" stroke="#5a3a18" stroke-width="0.4" stroke-linecap="round"/>
      <line x1="-2" y1="16" x2="0" y2="13" stroke="#5a3a18" stroke-width="0.4" stroke-linecap="round"/>
      <line x1="0" y1="13" x2="2" y2="16" stroke="#5a3a18" stroke-width="0.4" stroke-linecap="round"/>
      <line x1="2" y1="16" x2="4" y2="13" stroke="#5a3a18" stroke-width="0.4" stroke-linecap="round"/>
    `;
    /* Ear tufts (feathered points atop the head) */
    const earTufts = (spread = 0) => `
      <path d="M-8,-16 L-10,${-26 - spread} L-6,-18" fill="#6a4a22" stroke="#4a3018" stroke-width="0.5"/>
      <path d="M-8.5,-20 L-9.5,${-24 - spread} L-6.5,-19" fill="#8a6a3a" opacity="0.5"/>
      <path d="M8,-16 L10,${-26 - spread} L6,-18" fill="#6a4a22" stroke="#4a3018" stroke-width="0.5"/>
      <path d="M8.5,-20 L9.5,${-24 - spread} L6.5,-19" fill="#8a6a3a" opacity="0.5"/>
    `;
    /* Beak */
    const beak = `
      <path d="M-2,-6 L0,-3 L2,-6" fill="#cc8822" stroke="#aa6611" stroke-width="0.5"/>
    `;
    /* Talons */
    const talons = `
      <path d="M-4,20 L-6,23 M-4,20 L-3,23 M-4,20 L-5.5,22" stroke="#8a6a3a" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M4,20 L6,23 M4,20 L3,23 M4,20 L5.5,22" stroke="#8a6a3a" stroke-width="0.7" stroke-linecap="round"/>
    `;

    /* ── idle: perched, huge open eyes, slight head tilt ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- plump body -->
        <ellipse cx="0" cy="6" rx="14" ry="16" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.7"/>
        <!-- body sheen -->
        <ellipse cx="-3" cy="2" rx="5" ry="8" fill="#aa8a4a" opacity="0.15"/>
        ${featherTexture}
        <!-- wings tucked to sides -->
        <path d="M-13,0 Q-18,8 -16,16 Q-14,20 -10,18" fill="#5a3a18" stroke="#3a2010" stroke-width="0.6" opacity="0.7"/>
        <path d="M13,0 Q18,8 16,16 Q14,20 10,18" fill="#5a3a18" stroke="#3a2010" stroke-width="0.6" opacity="0.7"/>
        <!-- wing feather strokes -->
        <line x1="-14" y1="6" x2="-17" y2="10" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="-13" y1="10" x2="-16" y2="14" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="14" y1="6" x2="17" y2="10" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="13" y1="10" x2="16" y2="14" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        ${talons}
        <!-- head (slight tilt) -->
        <g transform="rotate(5, 0, -12)">
          <ellipse cx="0" cy="-12" rx="12" ry="10" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.6"/>
          <!-- facial disc (lighter feathered ring around eyes) -->
          <ellipse cx="0" cy="-12" rx="10" ry="8.5" fill="#9a7a4a" opacity="0.3"/>
          ${earTufts(0)}
          <!-- HUGE eyes: the owl's most prominent feature -->
          <circle cx="-4.5" cy="-13" r="4.5" fill="url(#owl-eye-grad)" stroke="#3a2010" stroke-width="0.5"/>
          <circle cx="-4.5" cy="-13" r="2.5" fill="#1a0a00"/>
          <circle cx="-3.5" cy="-14" r="0.9" fill="#fff" opacity="0.85"/>
          <circle cx="-5.5" cy="-12" r="0.4" fill="#fff" opacity="0.5"/>
          <circle cx="4.5" cy="-13" r="4.5" fill="url(#owl-eye-grad)" stroke="#3a2010" stroke-width="0.5"/>
          <circle cx="4.5" cy="-13" r="2.5" fill="#1a0a00"/>
          <circle cx="5.5" cy="-14" r="0.9" fill="#fff" opacity="0.85"/>
          <circle cx="3.5" cy="-12" r="0.4" fill="#fff" opacity="0.5"/>
          ${beak}
        </g>
      </g>`;

    /* ── scare: head rotated, eyes wide with tiny pupils, wings spread, tufts up ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- plump body -->
        <ellipse cx="0" cy="6" rx="14" ry="16" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.7"/>
        <ellipse cx="-3" cy="2" rx="5" ry="8" fill="#aa8a4a" opacity="0.15"/>
        ${featherTexture}
        <!-- wings spread slightly outward -->
        <path d="M-13,-2 Q-22,2 -24,12 Q-22,18 -16,18 Q-12,16 -10,12"
              fill="#5a3a18" stroke="#3a2010" stroke-width="0.7"/>
        <line x1="-14" y1="2" x2="-21" y2="6" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="-14" y1="6" x2="-21" y2="10" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="-13" y1="10" x2="-20" y2="14" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <path d="M13,-2 Q22,2 24,12 Q22,18 16,18 Q12,16 10,12"
              fill="#5a3a18" stroke="#3a2010" stroke-width="0.7"/>
        <line x1="14" y1="2" x2="21" y2="6" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="14" y1="6" x2="21" y2="10" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="13" y1="10" x2="20" y2="14" stroke="#4a2a10" stroke-width="0.4" stroke-linecap="round"/>
        <!-- talons gripping -->
        <path d="M-4,20 L-7,23 M-4,20 L-3,24 M-4,20 L-6,22.5" stroke="#8a6a3a" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M4,20 L7,23 M4,20 L3,24 M4,20 L6,22.5" stroke="#8a6a3a" stroke-width="0.9" stroke-linecap="round"/>
        <!-- head rotated dramatically -->
        <g transform="rotate(-18, 0, -12)">
          <ellipse cx="0" cy="-12" rx="12" ry="10" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.6"/>
          <ellipse cx="0" cy="-12" rx="10" ry="8.5" fill="#9a7a4a" opacity="0.3"/>
          <!-- tufts stand up straighter -->
          ${earTufts(4)}
          <!-- eyes widened: larger iris, tiny pupil -->
          <circle cx="-4.5" cy="-13" r="5" fill="url(#owl-eye-scare)" stroke="#3a2010" stroke-width="0.6"/>
          <circle cx="-4.5" cy="-13" r="1.2" fill="#1a0a00"/>
          <circle cx="-3.8" cy="-14.2" r="0.7" fill="#fff" opacity="0.9"/>
          <circle cx="4.5" cy="-13" r="5" fill="url(#owl-eye-scare)" stroke="#3a2010" stroke-width="0.6"/>
          <circle cx="4.5" cy="-13" r="1.2" fill="#1a0a00"/>
          <circle cx="5.2" cy="-14.2" r="0.7" fill="#fff" opacity="0.9"/>
          ${beak}
        </g>
      </g>`;

    /* ── hug: wings wrapped forward, half-closed content eyes, blush ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- plump body (slightly rounder) -->
        <ellipse cx="0" cy="6" rx="15" ry="17" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.7"/>
        <ellipse cx="-3" cy="2" rx="6" ry="9" fill="#aa8a4a" opacity="0.12"/>
        ${featherTexture}
        <!-- wings wrapped forward in embrace -->
        <path d="M-14,0 Q-20,6 -18,14 Q-16,20 -8,20 Q-2,18 0,14"
              fill="#5a3a18" stroke="#3a2010" stroke-width="0.6" opacity="0.8"/>
        <path d="M14,0 Q20,6 18,14 Q16,20 8,20 Q2,18 0,14"
              fill="#5a3a18" stroke="#3a2010" stroke-width="0.6" opacity="0.8"/>
        <!-- wing feather details -->
        <line x1="-12" y1="6" x2="-17" y2="10" stroke="#4a2a10" stroke-width="0.3" stroke-linecap="round" opacity="0.5"/>
        <line x1="12" y1="6" x2="17" y2="10" stroke="#4a2a10" stroke-width="0.3" stroke-linecap="round" opacity="0.5"/>
        ${talons}
        <!-- head (no tilt, relaxed) -->
        <ellipse cx="0" cy="-12" rx="12" ry="10" fill="url(#owl-body-grad)" stroke="#3a2010" stroke-width="0.6"/>
        <ellipse cx="0" cy="-12" rx="10" ry="8.5" fill="#9a7a4a" opacity="0.25"/>
        ${earTufts(0)}
        <!-- half-closed content eyes -->
        <ellipse cx="-4.5" cy="-13" rx="4" ry="2" fill="url(#owl-eye-grad)" stroke="#3a2010" stroke-width="0.4"/>
        <ellipse cx="-4.5" cy="-13" rx="1.5" ry="1.2" fill="#1a0a00"/>
        <circle cx="-3.8" cy="-13.5" r="0.5" fill="#fff" opacity="0.6"/>
        <ellipse cx="4.5" cy="-13" rx="4" ry="2" fill="url(#owl-eye-grad)" stroke="#3a2010" stroke-width="0.4"/>
        <ellipse cx="4.5" cy="-13" rx="1.5" ry="1.2" fill="#1a0a00"/>
        <circle cx="5.2" cy="-13.5" r="0.5" fill="#fff" opacity="0.6"/>
        ${beak}
        <!-- soft smile line -->
        <path d="M-2,-4 Q0,-2.5 2,-4" fill="none" stroke="#6a4a22" stroke-width="0.5" stroke-linecap="round"/>
        <!-- blush marks -->
        <ellipse cx="-7" cy="-10" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
        <ellipse cx="7" cy="-10" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
      </g>`;

    return `${_defs('owl')}${idle}${scare}${hug}`;
  }

  /* ─── Snake factory (~70x35 centred at origin) ─── */

  function _snake() {
    /* Scale pattern: diagonal hatch lines overlaid on body sections */
    const scalePattern = (x, y, len, angle = 30) => {
      const lines = [];
      for (let i = 0; i < len; i += 3) {
        const offset = i - len / 2;
        lines.push(
          `<line x1="${x + offset}" y1="${y - 1.5}" x2="${x + offset + 1.5}" y2="${y + 1.5}" stroke="#0a3a0a" stroke-width="0.3" opacity="0.4" stroke-linecap="round"/>`
        );
      }
      return lines.join('\n');
    };

    /* Forked tongue helper */
    const tongue = (extend = 0) => `
      <line x1="0" y1="-18" x2="0" y2="${-21 - extend}" stroke="#cc2222" stroke-width="0.6" stroke-linecap="round"/>
      <line x1="0" y1="${-21 - extend}" x2="-1.5" y2="${-23 - extend}" stroke="#cc2222" stroke-width="0.4" stroke-linecap="round"/>
      <line x1="0" y1="${-21 - extend}" x2="1.5" y2="${-23 - extend}" stroke="#cc2222" stroke-width="0.4" stroke-linecap="round"/>
    `;

    /* ── idle: relaxed coiled S-shape, tongue barely visible, hood down ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- coiled body: relaxed S-curve -->
        <path d="M-25,12 Q-20,2 -10,2 Q0,2 5,8 Q10,14 20,14 Q28,14 30,8 Q32,2 28,-2 Q24,-6 18,-6 Q12,-6 8,-2 Q4,2 0,2"
              fill="none" stroke="url(#snake-body-grad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- belly highlight along body -->
        <path d="M-24,13 Q-20,3.5 -10,3.5 Q0,3.5 5,9.5 Q10,15.5 20,15.5 Q28,15.5 30,9.5"
              fill="none" stroke="url(#snake-belly-grad)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <!-- scale hatch marks along body -->
        ${scalePattern(-18, 6, 12)}
        ${scalePattern(0, 5, 10)}
        ${scalePattern(18, 10, 12)}
        <!-- head rising from coil -->
        <ellipse cx="0" cy="-14" rx="5" ry="6" fill="url(#snake-body-grad)" stroke="#0a3a0a" stroke-width="0.6"/>
        <!-- head sheen -->
        <ellipse cx="-1.5" cy="-16" rx="2" ry="2.5" fill="#4aaa5a" opacity="0.2"/>
        <!-- hood (down, subtle) -->
        <path d="M-4,-10 Q-6,-12 -5,-15 Q-4,-17 -3,-14" fill="#2a7a3a" stroke="#0a4a1a" stroke-width="0.4" opacity="0.5"/>
        <path d="M4,-10 Q6,-12 5,-15 Q4,-17 3,-14" fill="#2a7a3a" stroke="#0a4a1a" stroke-width="0.4" opacity="0.5"/>
        <!-- eyes (beady black with yellow iris) -->
        <circle cx="-2.5" cy="-16" r="1.5" fill="#ccaa00" stroke="#0a3a0a" stroke-width="0.3"/>
        <circle cx="-2.5" cy="-16" r="0.7" fill="#0a0a0a"/>
        <circle cx="-2" cy="-16.5" r="0.3" fill="#fff" opacity="0.7"/>
        <circle cx="2.5" cy="-16" r="1.5" fill="#ccaa00" stroke="#0a3a0a" stroke-width="0.3"/>
        <circle cx="2.5" cy="-16" r="0.7" fill="#0a0a0a"/>
        <circle cx="3" cy="-16.5" r="0.3" fill="#fff" opacity="0.7"/>
        <!-- tongue barely visible -->
        ${tongue(0)}
        <!-- tail tip (tapered end of coil) -->
        <path d="M-25,12 Q-28,14 -30,12 Q-32,10 -33,8" fill="none" stroke="#1a6a2a" stroke-width="2" stroke-linecap="round"/>
      </g>`;

    /* ── scare: hood flares wide, body coils up, tongue fully out, menacing ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- tight coiled base -->
        <path d="M-18,14 Q-12,8 -6,10 Q0,12 6,10 Q12,8 18,12 Q22,16 16,18 Q10,20 4,18 Q-2,16 -8,18 Q-14,20 -18,16"
              fill="none" stroke="url(#snake-body-grad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- belly highlight on coils -->
        <path d="M-17,15.5 Q-12,9.5 -6,11.5 Q0,13.5 6,11.5 Q12,9.5 18,13.5"
              fill="none" stroke="url(#snake-belly-grad)" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
        <!-- scale hatching on coils -->
        ${scalePattern(-12, 12, 10)}
        ${scalePattern(6, 11, 10)}
        <!-- body rising up from coil -->
        <path d="M0,10 Q-2,4 -1,-2 Q0,-8 0,-10" fill="none" stroke="url(#snake-body-grad)" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M0.5,10 Q-1.5,4.5 -0.5,-1.5 Q0.5,-7.5 0.5,-9.5" fill="none" stroke="url(#snake-belly-grad)" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <!-- hood flared dramatically wide -->
        <path d="M-5,-10 Q-14,-14 -16,-8 Q-16,-4 -10,-2 Q-6,0 -4,-4"
              fill="url(#snake-hood-grad)" stroke="#0a4a1a" stroke-width="0.7"/>
        <path d="M5,-10 Q14,-14 16,-8 Q16,-4 10,-2 Q6,0 4,-4"
              fill="url(#snake-hood-grad)" stroke="#0a4a1a" stroke-width="0.7"/>
        <!-- hood pattern markings -->
        <circle cx="-9" cy="-8" r="1.5" fill="#0a3a0a" opacity="0.5"/>
        <circle cx="-9" cy="-8" r="0.8" fill="#ccaa00" opacity="0.4"/>
        <circle cx="9" cy="-8" r="1.5" fill="#0a3a0a" opacity="0.5"/>
        <circle cx="9" cy="-8" r="0.8" fill="#ccaa00" opacity="0.4"/>
        <!-- head (raised, menacing) -->
        <ellipse cx="0" cy="-14" rx="5.5" ry="6" fill="url(#snake-body-grad)" stroke="#0a3a0a" stroke-width="0.7"/>
        <ellipse cx="-1" cy="-16" rx="2" ry="2.5" fill="#4aaa5a" opacity="0.2"/>
        <!-- eyes glinting -->
        <circle cx="-2.5" cy="-16" r="1.8" fill="#eebb00" stroke="#0a3a0a" stroke-width="0.4"/>
        <circle cx="-2.5" cy="-16" r="0.6" fill="#0a0a0a"/>
        <circle cx="-1.8" cy="-16.8" r="0.4" fill="#fff" opacity="0.9"/>
        <circle cx="2.5" cy="-16" r="1.8" fill="#eebb00" stroke="#0a3a0a" stroke-width="0.4"/>
        <circle cx="2.5" cy="-16" r="0.6" fill="#0a0a0a"/>
        <circle cx="3.2" cy="-16.8" r="0.4" fill="#fff" opacity="0.9"/>
        <!-- tongue fully extended and forked -->
        ${tongue(5)}
        <!-- open mouth hint -->
        <path d="M-2,-11 Q0,-10 2,-11" fill="#1a0a0a" opacity="0.4"/>
      </g>`;

    /* ── hug: gentle relaxed curve, hood down, soft eyes, blush ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- gentle relaxed curve (not coiled tight) -->
        <path d="M-28,10 Q-18,0 -8,4 Q0,8 8,4 Q18,0 24,6 Q28,10 26,14"
              fill="none" stroke="url(#snake-body-grad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- belly highlight -->
        <path d="M-27,11.5 Q-18,1.5 -8,5.5 Q0,9.5 8,5.5 Q18,1.5 24,7.5"
              fill="none" stroke="url(#snake-belly-grad)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <!-- scale marks -->
        ${scalePattern(-16, 4, 10)}
        ${scalePattern(4, 5, 10)}
        ${scalePattern(20, 8, 8)}
        <!-- head (relaxed, slightly lowered) -->
        <ellipse cx="-28" cy="-2" rx="5" ry="5.5" fill="url(#snake-body-grad)" stroke="#0a3a0a" stroke-width="0.6"/>
        <ellipse cx="-29" cy="-4" rx="2" ry="2.5" fill="#4aaa5a" opacity="0.15"/>
        <!-- hood completely down -->
        <!-- soft content eyes -->
        <ellipse cx="-30" cy="-4" rx="1.5" ry="0.8" fill="#ccaa00" stroke="#0a3a0a" stroke-width="0.3"/>
        <circle cx="-30" cy="-4" r="0.5" fill="#0a0a0a"/>
        <circle cx="-29.5" cy="-4.3" r="0.2" fill="#fff" opacity="0.6"/>
        <ellipse cx="-26" cy="-4" rx="1.5" ry="0.8" fill="#ccaa00" stroke="#0a3a0a" stroke-width="0.3"/>
        <circle cx="-26" cy="-4" r="0.5" fill="#0a0a0a"/>
        <circle cx="-25.5" cy="-4.3" r="0.2" fill="#fff" opacity="0.6"/>
        <!-- tiny content smile -->
        <path d="M-29.5,-0.5 Q-28,0.5 -26.5,-0.5" fill="none" stroke="#1a5a2a" stroke-width="0.5" stroke-linecap="round"/>
        <!-- blush marks -->
        <ellipse cx="-31.5" cy="-2" rx="1.5" ry="0.8" fill="#ff6688" opacity="0.35"/>
        <ellipse cx="-24.5" cy="-2" rx="1.5" ry="0.8" fill="#ff6688" opacity="0.35"/>
        <!-- tail tip curled gently -->
        <path d="M26,14 Q28,16 27,18 Q25,19 24,17" fill="none" stroke="#1a6a2a" stroke-width="2" stroke-linecap="round"/>
      </g>`;

    return `${_defs('snake')}${idle}${scare}${hug}`;
  }

  /* ─── Rat factory (~40x35 centred at origin) ─── */

  function _rat() {
    /* Whisker helper: 3 whiskers per side */
    const whiskers = (side, spread = 0) => {
      const s = side === 'left' ? -1 : 1;
      return `
        <line x1="${s * 7}" y1="-10" x2="${s * (16 + spread)}" y2="-14" stroke="#aaa" stroke-width="0.35" stroke-linecap="round"/>
        <line x1="${s * 7}" y1="-9" x2="${s * (17 + spread)}" y2="-9" stroke="#aaa" stroke-width="0.35" stroke-linecap="round"/>
        <line x1="${s * 7}" y1="-8" x2="${s * (16 + spread)}" y2="-5" stroke="#aaa" stroke-width="0.35" stroke-linecap="round"/>
      `;
    };
    /* Large round ears */
    const ears = (back = false) => `
      <!-- oversized round ears -->
      <ellipse cx="-8" cy="-18" rx="6" ry="7" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.5"/>
      <ellipse cx="-8" cy="-18" rx="4" ry="5" fill="url(#rat-ear-grad)" opacity="0.7"/>
      <ellipse cx="8" cy="-18" rx="6" ry="7" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.5"/>
      <ellipse cx="8" cy="-18" rx="4" ry="5" fill="url(#rat-ear-grad)" opacity="0.7"/>
      ${back ? `
        <!-- ears laid back -->
        <g transform="rotate(-15, -8, -18)"><ellipse cx="-8" cy="-20" rx="1" ry="2" fill="#5a4a3a" opacity="0.3"/></g>
        <g transform="rotate(15, 8, -18)"><ellipse cx="8" cy="-20" rx="1" ry="2" fill="#5a4a3a" opacity="0.3"/></g>
      ` : ''}
    `;
    /* Pink nose */
    const nose = `
      <ellipse cx="0" cy="-7" rx="2" ry="1.5" fill="url(#rat-nose-grad)" stroke="#aa5566" stroke-width="0.3"/>
      <!-- nostril dots -->
      <circle cx="-0.7" cy="-6.8" r="0.3" fill="#8a4455"/>
      <circle cx="0.7" cy="-6.8" r="0.3" fill="#8a4455"/>
    `;
    /* Tail helper */
    const tail = (curl = false) => curl
      ? `<path d="M0,14 Q8,18 12,14 Q16,8 14,4 Q12,0 10,2" fill="none" stroke="#dda0a0" stroke-width="1.2" stroke-linecap="round"/>`
      : `<path d="M0,14 Q10,20 18,16 Q24,12 28,8" fill="none" stroke="#dda0a0" stroke-width="1.2" stroke-linecap="round"/>`;

    /* ── idle: hunched sitting, whiskers spread, alert ears, one paw raised ── */
    const idle = `
      <g class="creature__pose creature__pose--idle">
        <!-- tail -->
        ${tail(false)}
        <!-- rounded body -->
        <ellipse cx="0" cy="4" rx="12" ry="12" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.6"/>
        <!-- body sheen -->
        <ellipse cx="-2" cy="0" rx="4" ry="6" fill="#8a7a6a" opacity="0.15"/>
        <!-- fur texture -->
        <line x1="-10" y1="-2" x2="-13" y2="-3" stroke="#3a302a" stroke-width="0.5" stroke-linecap="round"/>
        <line x1="-9" y1="4" x2="-12" y2="5" stroke="#3a302a" stroke-width="0.5" stroke-linecap="round"/>
        <line x1="10" y1="-2" x2="13" y2="-3" stroke="#3a302a" stroke-width="0.5" stroke-linecap="round"/>
        <line x1="9" y1="4" x2="12" y2="5" stroke="#3a302a" stroke-width="0.5" stroke-linecap="round"/>
        <!-- hind paws -->
        <ellipse cx="-6" cy="15" rx="3.5" ry="2" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <ellipse cx="6" cy="15" rx="3.5" ry="2" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <!-- front paws (one slightly raised) -->
        <ellipse cx="-4" cy="12" rx="2.5" ry="1.8" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <ellipse cx="4" cy="10" rx="2.5" ry="1.8" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3" transform="rotate(-10, 4, 10)"/>
        <!-- pointed snout / head -->
        <ellipse cx="0" cy="-8" rx="9" ry="7" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.5"/>
        <!-- snout ridge -->
        <ellipse cx="0" cy="-5" rx="4" ry="3" fill="#6a5a4a" opacity="0.2"/>
        ${ears(false)}
        <!-- small bright bead eyes -->
        <circle cx="-3.5" cy="-10" r="1.8" fill="#0a0a0a"/>
        <circle cx="-3.5" cy="-10" r="1.2" fill="#1a1a1a"/>
        <circle cx="-3" cy="-10.5" r="0.5" fill="#fff" opacity="0.8"/>
        <circle cx="3.5" cy="-10" r="1.8" fill="#0a0a0a"/>
        <circle cx="3.5" cy="-10" r="1.2" fill="#1a1a1a"/>
        <circle cx="4" cy="-10.5" r="0.5" fill="#fff" opacity="0.8"/>
        ${nose}
        ${whiskers('left', 0)}
        ${whiskers('right', 0)}
      </g>`;

    /* ── scare: standing on hind legs, mouth open with front teeth, ears back ── */
    const scare = `
      <g class="creature__pose creature__pose--scare" style="display:none">
        <!-- tail (stiff and raised) -->
        <path d="M0,16 Q-8,20 -14,16 Q-20,10 -22,4" fill="none" stroke="#dda0a0" stroke-width="1.5" stroke-linecap="round"/>
        <!-- body upright, standing on hind legs -->
        <ellipse cx="0" cy="4" rx="11" ry="14" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.7"/>
        <ellipse cx="-2" cy="0" rx="4" ry="7" fill="#8a7a6a" opacity="0.15"/>
        <!-- belly lighter patch -->
        <ellipse cx="0" cy="6" rx="6" ry="8" fill="#7a6a5a" opacity="0.2"/>
        <!-- fur on end -->
        <line x1="-10" y1="-4" x2="-13" y2="-7" stroke="#3a302a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="-9" y1="0" x2="-13" y2="-1" stroke="#3a302a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="10" y1="-4" x2="13" y2="-7" stroke="#3a302a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="9" y1="0" x2="13" y2="-1" stroke="#3a302a" stroke-width="0.6" stroke-linecap="round"/>
        <!-- hind paws planted wide -->
        <ellipse cx="-6" cy="17" rx="4" ry="2.5" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <ellipse cx="6" cy="17" rx="4" ry="2.5" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <!-- front paws raised, claws out -->
        <path d="M-8,-2 Q-12,-6 -14,-4" fill="none" stroke="#5a4a3a" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="-14" y1="-4" x2="-16" y2="-6" stroke="#5a4a3a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="-14" y1="-4" x2="-15.5" y2="-3" stroke="#5a4a3a" stroke-width="0.6" stroke-linecap="round"/>
        <path d="M8,-2 Q12,-6 14,-4" fill="none" stroke="#5a4a3a" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="14" y1="-4" x2="16" y2="-6" stroke="#5a4a3a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="14" y1="-4" x2="15.5" y2="-3" stroke="#5a4a3a" stroke-width="0.6" stroke-linecap="round"/>
        <!-- head -->
        <ellipse cx="0" cy="-10" rx="9" ry="7.5" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.6"/>
        <ellipse cx="0" cy="-7" rx="4" ry="3" fill="#6a5a4a" opacity="0.2"/>
        ${ears(true)}
        <!-- wide alarmed eyes -->
        <circle cx="-3.5" cy="-12" r="2.2" fill="#0a0a0a"/>
        <circle cx="-3.5" cy="-12" r="1.5" fill="#1a1a1a"/>
        <circle cx="-3" cy="-12.8" r="0.6" fill="#fff" opacity="0.9"/>
        <circle cx="3.5" cy="-12" r="2.2" fill="#0a0a0a"/>
        <circle cx="3.5" cy="-12" r="1.5" fill="#1a1a1a"/>
        <circle cx="4" cy="-12.8" r="0.6" fill="#fff" opacity="0.9"/>
        ${nose}
        <!-- open mouth showing two prominent front teeth -->
        <ellipse cx="0" cy="-3.5" rx="3" ry="2.5" fill="#2a0a0a"/>
        <rect x="-1.8" y="-5.5" width="1.5" height="2.5" rx="0.4" fill="#e8e0d0"/>
        <rect x="0.3" y="-5.5" width="1.5" height="2.5" rx="0.4" fill="#e8e0d0"/>
        <!-- tongue -->
        <ellipse cx="0" cy="-2" rx="1.5" ry="0.8" fill="#cc7788" opacity="0.5"/>
        ${whiskers('left', 4)}
        ${whiskers('right', 4)}
      </g>`;

    /* ── hug: rolled onto side, gentle face, tail curled, paws together ── */
    const hug = `
      <g class="creature__pose creature__pose--hug" style="display:none">
        <!-- tail curled around body -->
        ${tail(true)}
        <!-- body on side (slightly wider, relaxed) -->
        <ellipse cx="0" cy="4" rx="13" ry="11" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.6"/>
        <ellipse cx="-2" cy="2" rx="5" ry="6" fill="#8a7a6a" opacity="0.12"/>
        <!-- belly showing (lighter) -->
        <ellipse cx="2" cy="6" rx="6" ry="5" fill="#7a6a5a" opacity="0.2"/>
        <!-- fur strokes (soft) -->
        <line x1="-11" y1="0" x2="-13" y2="0" stroke="#3a302a" stroke-width="0.4" stroke-linecap="round"/>
        <line x1="-10" y1="6" x2="-12" y2="7" stroke="#3a302a" stroke-width="0.4" stroke-linecap="round"/>
        <!-- hind paw tucked -->
        <ellipse cx="-5" cy="14" rx="3" ry="2" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <!-- front paws together -->
        <ellipse cx="-3" cy="10" rx="2.5" ry="1.8" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <ellipse cx="1" cy="10" rx="2.5" ry="1.8" fill="#5a4a3a" stroke="#2a201a" stroke-width="0.3"/>
        <!-- head -->
        <ellipse cx="0" cy="-8" rx="9" ry="7" fill="url(#rat-body-grad)" stroke="#2a201a" stroke-width="0.5"/>
        <ellipse cx="0" cy="-5" rx="4" ry="3" fill="#6a5a4a" opacity="0.15"/>
        ${ears(false)}
        <!-- squinted happy eyes -->
        <path d="M-5,-10 Q-3.5,-8 -2,-10" fill="none" stroke="#2a201a" stroke-width="0.8" stroke-linecap="round"/>
        <path d="M2,-10 Q3.5,-8 5,-10" fill="none" stroke="#2a201a" stroke-width="0.8" stroke-linecap="round"/>
        ${nose}
        <!-- gentle little smile -->
        <path d="M-1.5,-5 Q0,-3.5 1.5,-5" fill="none" stroke="#5a4a3a" stroke-width="0.5" stroke-linecap="round"/>
        <!-- blush marks -->
        <ellipse cx="-6" cy="-7" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
        <ellipse cx="6" cy="-7" rx="2" ry="1" fill="#ff6688" opacity="0.35"/>
        ${whiskers('left', 0)}
        ${whiskers('right', 0)}
      </g>`;

    return `${_defs('rat')}${idle}${scare}${hug}`;
  }

  /* ─── Unlockable creature stubs (placeholder circles with icon) ─── */

  function _placeholder(icon) {
    const base = `
      <circle cx="0" cy="0" r="15" fill="#2a1a3a" stroke="#4a3a5a" stroke-width="1.5" opacity="0.6"/>
      <text x="0" y="6" text-anchor="middle" font-size="16">${icon}</text>
    `;
    return `
      <defs></defs>
      <g class="creature__pose creature__pose--idle">${base}</g>
      <g class="creature__pose creature__pose--scare" style="display:none">${base}</g>
      <g class="creature__pose creature__pose--hug" style="display:none">${base}</g>
    `;
  }

  /* ─── Factory registry ─── */

  const FACTORIES = {
    spider:  _spider,
    gorilla: _gorilla,
    bat:     _bat,
    cat:     _cat,
    owl:     _owl,
    snake:   _snake,
    rat:     _rat,
  };

  /* ─── Public API ─── */

  /**
   * Create a creature object and inject its SVG into the house creature layer.
   * The creature is positioned at the centre of the given room.
   *
   * @param {string} creatureType - one of the registered creature type keys
   * @param {string} roomId - room identifier matching CONFIG.rooms
   * @returns {object} creature object with { type, el, roomId, pose, timer }
   */
  function create(creatureType, roomId) {
    const factory = FACTORIES[creatureType];
    if (!factory) {
      console.warn(`Creatures.create: unknown type "${creatureType}"`);
      return null;
    }

    const svg = House.getSvg();
    if (!svg) {
      console.warn('Creatures.create: house SVG not initialised');
      return null;
    }

    const layer = svg.querySelector('.house__creature-layer');
    const centre = House.getRoomCentre(roomId);
    if (!layer || !centre) {
      console.warn(`Creatures.create: cannot find layer or room "${roomId}"`);
      return null;
    }

    // Build the outer <g> wrapper with positioning
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.classList.add('creature', `creature--${creatureType}`);
    g.setAttribute('transform', `translate(${centre.x}, ${centre.y})`);
    g.innerHTML = factory();
    layer.appendChild(g);

    return {
      type: creatureType,
      el: g,
      roomId,
      pose: 'idle',
      timer: null,
    };
  }

  /**
   * Remove a creature's SVG from the DOM and clear its timer.
   *
   * @param {object} creature - creature object returned by create()
   */
  function remove(creature) {
    if (!creature) return;
    if (creature.timer) {
      clearTimeout(creature.timer);
      creature.timer = null;
    }
    if (creature.el && creature.el.parentNode) {
      creature.el.parentNode.removeChild(creature.el);
    }
  }

  /**
   * Toggle the visible pose group for a creature.
   * Hides all .creature__pose children, then shows the matching one.
   *
   * @param {object} creature - creature object returned by create()
   * @param {string} pose - one of 'idle', 'scare', 'hug'
   */
  function setPose(creature, pose) {
    if (!creature || !creature.el) return;
    const poses = creature.el.querySelectorAll('.creature__pose');
    poses.forEach(p => { p.style.display = 'none'; });

    const target = creature.el.querySelector(`.creature__pose--${pose}`);
    if (target) {
      target.style.display = '';
      creature.pose = pose;
    }
  }

  /**
   * Return the list of currently available creature type strings.
   * Merges base CONFIG with any unlocked extras via GameState.
   *
   * @returns {string[]}
   */
  function getTypes() {
    return GameState.get('creatures');
  }

  return { create, remove, setPose };
})();
