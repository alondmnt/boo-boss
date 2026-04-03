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
        <!-- body -->
        <ellipse cx="0" cy="5" rx="18" ry="22" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <!-- chest highlight -->
        <ellipse cx="0" cy="8" rx="10" ry="12" fill="#3a3a3a" opacity="0.3"/>
        <!-- fur texture strokes -->
        <line x1="-14" y1="-5" x2="-17" y2="-6" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="-15" y1="0" x2="-18" y2="0" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="14" y1="-5" x2="17" y2="-6" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="15" y1="0" x2="18" y2="0" stroke="#2a2a2a" stroke-width="0.7" stroke-linecap="round"/>
        <line x1="-12" y1="15" x2="-15" y2="17" stroke="#2a2a2a" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="12" y1="15" x2="15" y2="17" stroke="#2a2a2a" stroke-width="0.6" stroke-linecap="round"/>
        <!-- broad shoulders -->
        <ellipse cx="0" cy="-8" rx="22" ry="10" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- left arm (knuckle-standing) -->
        <path d="M-18,-5 Q-26,8 -24,22 Q-23,26 -20,27" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
        <!-- left fist -->
        <ellipse cx="-20" cy="28" rx="4" ry="3" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- right arm (slightly raised) -->
        <path d="M18,-5 Q26,5 25,16 Q24,19 22,20" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
        <!-- right hand open -->
        <ellipse cx="22" cy="21" rx="4" ry="3.5" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- compact legs -->
        <path d="M-8,24 Q-10,30 -9,35" fill="none" stroke="#1a1a1a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M8,24 Q10,30 9,35" fill="none" stroke="#1a1a1a" stroke-width="4.5" stroke-linecap="round"/>
        <!-- feet -->
        <ellipse cx="-9" cy="36" rx="5" ry="2.5" fill="#2a1a1a"/>
        <ellipse cx="9" cy="36" rx="5" ry="2.5" fill="#2a1a1a"/>
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
        <ellipse cx="0" cy="2" rx="20" ry="24" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <ellipse cx="0" cy="4" rx="13" ry="14" fill="#3a3a3a" opacity="0.25"/>
        <!-- shoulders raised higher -->
        <ellipse cx="0" cy="-14" rx="24" ry="11" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- arms spread wide -->
        <path d="M-22,-10 Q-32,-8 -36,0 Q-38,4 -36,8" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="-36" cy="10" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- fingers spread -->
        <line x1="-36" y1="6" x2="-39" y2="4" stroke="#3a2a1a" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="-37" y1="8" x2="-41" y2="7" stroke="#3a2a1a" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M22,-10 Q32,-8 36,0 Q38,4 36,8" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="36" cy="10" rx="5" ry="4" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <line x1="36" y1="6" x2="39" y2="4" stroke="#3a2a1a" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="37" y1="8" x2="41" y2="7" stroke="#3a2a1a" stroke-width="1.2" stroke-linecap="round"/>
        <!-- legs planted -->
        <path d="M-9,22 Q-12,28 -11,35" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <path d="M9,22 Q12,28 11,35" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="-11" cy="36" rx="6" ry="2.5" fill="#2a1a1a"/>
        <ellipse cx="11" cy="36" rx="6" ry="2.5" fill="#2a1a1a"/>
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
        <!-- body sitting -->
        <ellipse cx="0" cy="10" rx="19" ry="20" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.8"/>
        <ellipse cx="0" cy="12" rx="12" ry="12" fill="#3a3a3a" opacity="0.25"/>
        <!-- shoulders relaxed -->
        <ellipse cx="0" cy="-4" rx="20" ry="9" fill="url(#gorilla-body-grad)" stroke="#0a0a0a" stroke-width="0.6"/>
        <!-- arms open forward (inviting) -->
        <path d="M-18,-2 Q-26,4 -28,14 Q-28,18 -24,20" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="-23" cy="21" rx="4.5" ry="3.5" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <path d="M18,-2 Q26,4 28,14 Q28,18 24,20" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="23" cy="21" rx="4.5" ry="3.5" fill="#3a2a1a" stroke="#1a1a1a" stroke-width="0.6"/>
        <!-- legs folded sitting -->
        <path d="M-10,26 Q-14,30 -16,32 Q-16,35 -10,35" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <path d="M10,26 Q14,30 16,32 Q16,35 10,35" fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="-8" cy="35" rx="5" ry="2.5" fill="#2a1a1a"/>
        <ellipse cx="8" cy="35" rx="5" ry="2.5" fill="#2a1a1a"/>
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
    owl:     () => _placeholder('🦉'),
    snake:   () => _placeholder('🐍'),
    rat:     () => _placeholder('🐀'),
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

  return { create, remove, setPose, getTypes };
})();
