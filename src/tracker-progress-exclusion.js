/* SEM 10-XP — Academic progress display
   ورق remains a real tracker stage and remains checkable, but it contributes
   0% to academic progress. The existing Tracker layout is untouched.
*/
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10ProgressExclusionInstalled) return;
  window.__sem10ProgressExclusionInstalled = true;

  const schedule = (() => {
    let pending = false;
    return (fn) => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        fn();
      });
    };
  })();

  function lectureRows(root) {
    return Array.from(root.querySelectorAll("table.lecture-table tbody tr"))
      .filter((row) => row.querySelector("td.lecture-name-cell"));
  }

  function progressForRows(rows) {
    const denominator = rows.length * 4; // شرح + مذاكرة + حل + مراجعة only
    if (!denominator) return 0;
    let done = 0;
    rows.forEach((row) => {
      const checks = Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));
      // Index 0 = ورق. Deliberately skip it.
      for (let i = 1; i < 5; i += 1) {
        if (checks[i]?.classList.contains("xp-checkbox-checked")) done += 1;
      }
    });
    return Math.round((done / denominator) * 100);
  }

  function paint(progressEl, pct) {
    const segs = Array.from(progressEl.querySelectorAll(".xp-progress-seg"));
    const filled = Math.round((pct / 100) * segs.length);
    segs.forEach((seg, i) => seg.classList.toggle("xp-progress-seg-on", i < filled));
  }

  function updateTrackerWindow(win) {
    const heroSub = win.querySelector(".tracker-hero-sub");
    const progress = win.querySelector(".xp-progress");
    if (!heroSub || !progress) return;

    const pct = progressForRows(lectureRows(win));
    const percentText = Array.from(win.querySelectorAll(".xp-small-text"))
      .find((el) => /%\s*complete$/i.test(el.textContent.trim()));
    if (percentText) percentText.textContent = `${pct}% complete`;
    paint(progress, pct);
  }

  function updateOverview() {
    const allRows = Array.from(document.querySelectorAll("table.lecture-table tbody tr"))
      .filter((row) => row.querySelector("td.lecture-name-cell"));
    if (!allRows.length) return;

    const trackerWindows = new Set(Array.from(document.querySelectorAll(".xp-window"))
      .filter((win) => win.querySelector(".tracker-hero-sub")));
    const overviewRows = allRows.filter((row) => !trackerWindows.has(row.closest(".xp-window")));
    // Overview normally has no lecture rows of its own, so use all mounted tracker rows.
    const pct = progressForRows(allRows);
    document.querySelectorAll(".xp-progress").forEach((progress) => {
      const win = progress.closest(".xp-window");
      if (win && win.querySelector(".tracker-hero-sub")) return;
      const holder = progress.parentElement?.parentElement;
      if (holder?.textContent?.match(/%\s*complete/i)) {
        const text = Array.from(holder.querySelectorAll(".xp-small-text"))
          .find((el) => /%\s*complete$/i.test(el.textContent.trim()));
        if (text) text.textContent = `${pct}% complete`;
      }
      paint(progress, pct);
    });
  }

  function refresh() {
    document.querySelectorAll(".xp-window").forEach(updateTrackerWindow);
    updateOverview();
  }

  const observer = new MutationObserver(() => schedule(refresh));
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  refresh();
})();
