/* SEM 10-XP — mobile layout fixes
 * CSS-only enhancement. Desktop layout remains unchanged.
 */
(() => {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-sem10-mobile-ui-fixes="true"]')) return;
  const style = document.createElement("style");
  style.setAttribute("data-sem10-mobile-ui-fixes", "true");
  style.textContent = `
    @media (max-width: 700px) {
      .planner-app { min-width: 0; width: 100%; box-sizing: border-box; }
      .planner-nav { gap: 6px; }
      .planner-nav > span { min-width: 0; text-align: center; white-space: nowrap; }
      .planner-grid-head { display: none; }
      .planner-scroll { min-width: 0; width: 100%; box-sizing: border-box; padding: 5px; overflow-x: hidden; overflow-y: auto; }
      .planner-row { grid-template-columns: 1fr !important; gap: 7px !important; padding: 8px 5px !important; }
      .planner-day-label { display: flex; align-items: baseline; gap: 7px; min-width: 0; padding: 1px 2px 2px; }
      .planner-day-name { font-size: 12px; font-weight: 700; }
      .planner-day-date { font-size: 11px; }
      .planner-cell { width: 100%; min-width: 0; box-sizing: border-box; overflow: visible; padding: 4px; border: 1px solid #d4d1c3; background: #faf9f1; border-radius: 3px; }
      .planner-cell::before { display: block; margin: 0 0 5px; font-size: 11px; font-weight: 700; color: #0A46C6; }
      .planner-row > .planner-cell:nth-child(2)::before { content: "Medicine"; }
      .planner-row > .planner-cell:nth-child(3)::before { content: "Surgery"; }
      .planner-chip { width: 100%; box-sizing: border-box; align-items: flex-start; flex-wrap: wrap; gap: 5px; padding: 5px; font-size: 11px; }
      .planner-chip-text { min-width: 0; flex: 1 1 120px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.25; }
      .planner-chip-stage, .planner-chip-poms, .planner-chip-tracker-done { white-space: nowrap; }
      .planner-chip-btn, .planner-chip-remove { flex: 0 0 auto; min-width: 24px; min-height: 24px; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; }
      .planner-chip-check { width: 17px; height: 17px; margin-top: 1px; }
      .planner-chip .xp-btn { min-height: 30px; padding: 4px 8px; font-size: 12px; }
      .planner-add-form { width: 100%; box-sizing: border-box; }
      .planner-add-form .xp-select, .planner-add-form .xp-text-input { width: 100% !important; box-sizing: border-box; min-height: 38px; font-size: 16px; }
      .planner-add-form .xp-btn { min-height: 34px; }
      .planner-empty { padding: 3px 0; }

      /* Native selects need a real touch target on phones. */
      .xp-select, .xp-text-input, .xp-number { min-height: 36px; }
      .xp-btn, .xp-capbtn, .start-btn, .taskbar-item { touch-action: manipulation; }
    }
  `;
  document.head.appendChild(style);
})();
