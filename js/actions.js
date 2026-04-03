/**
 * Actions — scare action definitions and CSS keyframe class mappings.
 * Each action type maps to a CSS class name and animation duration.
 * In MVP, actions are auto-assigned via CONFIG.defaultAction.
 */
const Actions = (() => {
  const ACTIONS = {
    jumpOut: {
      cssClass: 'action--jump-out',
      durationMs: 600,
    },
    grabHat: {
      cssClass: 'action--grab-hat',
      durationMs: 800,
    },
    dropFromCeiling: {
      cssClass: 'action--drop-ceiling',
      durationMs: 700,
    },
  };

  /**
   * Return the CSS class name that triggers the scare animation.
   * @param {string} actionType - one of 'jumpOut', 'grabHat', 'dropFromCeiling'
   * @returns {string} CSS class name
   */
  function getKeyframes(actionType) {
    const a = ACTIONS[actionType];
    return a ? a.cssClass : '';
  }

  /**
   * Return the animation duration in milliseconds.
   * @param {string} actionType
   * @returns {number} duration in ms
   */
  function getDuration(actionType) {
    const a = ACTIONS[actionType];
    return a ? a.durationMs : 600;
  }

  return { getKeyframes, getDuration };
})();
