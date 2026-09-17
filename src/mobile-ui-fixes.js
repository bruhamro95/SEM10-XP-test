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
      .planner-app { min-width: 0; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden; }
      .planner-nav { gap: 6px; min-width: 0; flex-wrap: wrap; }
      .planner-nav > span { min-width: 0; text-align: center; white-space: normal; overflow-wrap: anywhere; }
      .planner-grid-head { display: none; }
      .planner-scroll { min-width: 0; width: 100%; box-sizing: border-box; padding: 5px; overflow-x: hidden; overflow-y: auto; }
      .planner-row { grid-template-columns: 1fr !important; gap: 7px !important; padding: 8px 5px !important; min-width: 0; }
      .planner-day-label { display: flex; align-items: baseline; gap: 7px; min-width: 0; padding: 1px 2px 2px; }
      .planner-day-name { font-size: 12px; font-weight: 700; }
      .planner-day-date { font-size: 11px; }
      .planner-cell { width: 100%; min-width: 0; box-sizing: border-box; overflow: visible; padding: 4px; border: 1px solid #d4d1c3; background: #faf9f1; border-radius: 3px; }
      .planner-cell::before { display: block; margin: 0 0 5px; font-size: 11px; font-weight: 700; color: #0A46C6; }
      .planner-row > .planner-cell:nth-child(2)::before { content: "Medicine"; }
      .planner-row > .planner-cell:nth-child(3)::before { content: "Surgery"; }
      .planner-chip { width: 100%; box-sizing: border-box; align-items: flex-start; flex-wrap: wrap; gap: 5px; padding: 5px; font-size: 11px; min-width: 0; }
      .planner-chip-text { width: auto; min-width: 0; flex: 1 1 120px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.25; }
      .planner-chip-stage, .planner-chip-poms, .planner-chip-tracker-done { white-space: nowrap; }
      .planner-chip-btn, .planner-chip-remove { flex: 0 0 auto; min-width: 28px; min-height: 28px; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; }
      .planner-chip-check { width: 17px; height: 17px; margin-top: 1px; flex: 0 0 auto; }
      .planner-chip .xp-btn { min-height: 30px; padding: 4px 8px; font-size: 12px; flex: 0 0 auto; }
      .planner-add-form { width: 100%; box-sizing: border-box; min-width: 0; }
      .planner-add-form .xp-select, .planner-add-form .xp-text-input { width: 100% !important; box-sizing: border-box; min-height: 38px; font-size: 16px; max-width: 100%; }
      .planner-add-form .xp-btn { min-height: 34px; }
      .planner-empty { padding: 3px 0; }
      .xp-select, .xp-text-input, .xp-number { min-height: 36px; max-width: 100%; }
      .xp-btn, .xp-capbtn, .start-btn, .taskbar-item { touch-action: manipulation; }
    }
    @media (max-width: 600px) {
      .tracker-app, .tracker-scroll, .tracker-hero, .toolbar { min-width: 0; max-width: 100%; box-sizing: border-box; }
      .tracker-app, .tracker-scroll { overflow-x: hidden; }
      .toolbar { width: 100%; flex-wrap: wrap; gap: 7px; }
      .toolbar > *, .toolbar .xp-search, .toolbar .row-gap { min-width: 0; max-width: 100%; }
      .toolbar .xp-search { width: 100%; flex: 1 1 100%; box-sizing: border-box; }
      .toolbar .xp-search-input { width: 100%; min-width: 0; box-sizing: border-box; }
      .toolbar .row-gap { width: 100%; flex-wrap: wrap; }
      .toolbar .row-gap .xp-btn { flex: 1 1 auto; min-width: 0; }
      .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; width: 100%; min-width: 0; box-sizing: border-box; }
      .stat-card { min-width: 0; box-sizing: border-box; overflow: hidden; }
      .lecture-table { width: 100%; min-width: 0 !important; table-layout: auto; display: block; }
      .lecture-table thead { display: none; }
      .lecture-table tbody { display: block; width: 100%; min-width: 0; }
      .lecture-table tr { display: block; width: 100%; min-width: 0; box-sizing: border-box; margin-bottom: 6px; padding: 5px 4px; }
      .lecture-table td { box-sizing: border-box; }
      .lecture-table td.lecture-name-cell { display: block; width: 100%; max-width: 100%; min-width: 0; padding: 3px 2px 6px; white-space: normal !important; overflow-wrap: anywhere; word-break: break-word; line-height: 1.3; }
      .lecture-table td.num-col { display: inline-block; width: auto; min-width: 24px; }
      .lecture-table td.xp-small-text[style*="white-space: nowrap"] { display: inline-block; max-width: 48%; white-space: normal !important; overflow-wrap: anywhere; vertical-align: middle; }
      .lecture-table td.center-cell { display: inline-flex; align-items: center; min-height: 28px; vertical-align: middle; }
      .lecture-table td.checkbox-cell { display: inline-flex; align-items: center; justify-content: center; width: 44px; min-width: 44px; min-height: 34px; vertical-align: middle; flex-direction: column; gap: 2px; }
      .lecture-table td.checkbox-cell::before { display: none; }
      .lecture-table td.checkbox-cell .stage-mobile-label { display: block; font-size: 9px; line-height: 1; color: #555; text-align: center; white-space: nowrap; }
      .lecture-table td.checkbox-cell:nth-of-type(5)::before { content: "ورق"; }
      .lecture-table td.checkbox-cell:nth-of-type(6)::before { content: "شرح"; }
      .lecture-table td.checkbox-cell:nth-of-type(7)::before { content: "مذاكرة"; }
      .lecture-table td.checkbox-cell:nth-of-type(8)::before { content: "حل"; }
      .lecture-table td.checkbox-cell:nth-of-type(9)::before { content: "مراجعة"; }
      .lecture-table td:last-child { display: inline-flex; align-items: center; min-height: 30px; }
      .sem10-sf-panel, .sem10-bulk-panel { max-width: calc(100vw - 16px) !important; width: calc(100vw - 16px) !important; left: 8px !important; right: 8px !important; box-sizing: border-box; }
      .sem10-sf-grid, .sem10-bulk-grid { grid-template-columns: 1fr !important; }
      .sem10-sf-field select, .sem10-bulk-field select { width: 100%; min-width: 0; }
      .pom-multi-picker { min-width: 0; max-width: 100%; }
      .pom-multi-picker > div { min-width: 0; max-width: 100%; }
    }
  `;
  document.head.appendChild(style);
})();
