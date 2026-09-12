/* SEM 10-XP — Academic progress
   ورق stays visible/checkable, but is excluded from academic progress.
   This enhancement does not change the Tracker layout or stage controls.
*/
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10ProgressExclusionInstalled) return;
  window.__sem10ProgressExclusionInstalled = true;

  const ACADEMIC_KEYS = ["explain", "study", "solve", "review"];
  const progressKey = "sem10xp:lecture-progress-v2";
  let lectureMeta = new Map();
  let rebuildTimer = null;

  const schedule = (fn, delay = 40) => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(fn, delay);
  };

  function readProgress() {
    try {
      const raw = localStorage.getItem(progressKey);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function trackerWindows() {
    return Array.from(document.querySelectorAll(".xp-window"))
      .filter((win) => win.querySelector(".tracker-hero-sub"));
  }

  function rows(win) {
    return Array.from(win.querySelectorAll("table.lecture-table tbody tr"))
      .filter((r) => r.querySelector("td.lecture-name-cell"));
  }

  function headerSections(win) {
    return Array.from(win.querySelectorAll(".section-header"))
      .map((h) => ({
        header: h,
        name: h.querySelector(".section-title")?.textContent.trim() || "",
        count: parseInt(h.querySelector(".section-count")?.textContent || "", 10) || 0,
        open: h.querySelector(".section-caret")?.textContent.trim() === "▾"
      }))
      .filter((x) => x.name);
  }

  function rememberVisibleRows() {
    trackerWindows().forEach((win) => {
      const title = win.querySelector(".xp-titlebar-text")?.textContent || "";
      const discipline = /medicine/i.test(title) ? "Medicine" : /surgery/i.test(title) ? "Surgery" : "";
      rows(win).forEach((r) => {
        const name = r.querySelector(".lecture-name-cell")?.textContent.trim();
        const cells = Array.from(r.querySelectorAll("td"));
        const section = cells[2]?.textContent.trim() || "";
        const num = cells[0]?.textContent.trim() || "";
        if (discipline && num) lectureMeta.set(`${discipline}|${num}`, { discipline, num, section });
        if (discipline && name) {
          // Keep a name key too; it survives changes in table numbering.
          lectureMeta.set(`${discipline}|${name}`, { discipline, num, section });
        }
      });
    });
  }

  function countFromRows(list) {
    let done = 0;
    list.forEach((row) => {
      const checks = Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));
      ACADEMIC_KEYS.forEach((_, i) => {
        if (checks[i + 1]?.classList.contains("xp-checkbox-checked")) done += 1;
      });
    });
    return done;
  }

  function totalFromHeaders(win) {
    return headerSections(win).reduce((sum, s) => sum + s.count, 0);
  }

  function updateTracker(win) {
    const sections = headerSections(win);
    const totalLectures = totalFromHeaders(win);
    const visibleRows = rows(win);
    const visibleDone = countFromRows(visibleRows);

    // When sections are collapsed, React removes their rows. We therefore use
    // the persisted progress object for the hidden portion when we have learned
    // its lecture metadata from an earlier expanded render.
    const progress = readProgress();
    const title = win.querySelector(".xp-titlebar-text")?.textContent || "";
    const discipline = /medicine/i.test(title) ? "Medicine" : /surgery/i.test(title) ? "Surgery" : "";
    let done = visibleDone;
    const visibleKeys = new Set();
    visibleRows.forEach((r) => {
      const num = r.querySelector(".num-col")?.textContent.trim();
      const name = r.querySelector(".lecture-name-cell")?.textContent.trim();
      if (num) visibleKeys.add(`${discipline}|${num}`);
      if (name) visibleKeys.add(`${discipline}|${name}`);
    });

    Object.entries(progress).forEach(([id, cell]) => {
      if (!cell || typeof cell !== "object") return;
      const meta = lectureMeta.get(id);
      if (!meta || meta.discipline !== discipline) return;
      if (visibleKeys.has(`${discipline}|${meta.num}`) || visibleKeys.has(`${discipline}|${meta.name}`)) return;
      done += ACADEMIC_KEYS.filter((k) => !!cell[k]).length;
    });

    // If metadata is not available yet, expand/collapse synchronization below
    // will populate it and the next refresh becomes exact.
    const denominator = totalLectures * ACADEMIC_KEYS.length;
    const pct = denominator ? Math.round((done / denominator) * 100) : 0;

    const text = Array.from(win.querySelectorAll(".xp-small-text"))
      .find((el) => /%\s*complete$/i.test(el.textContent.trim()));
    if (text) text.textContent = `${pct}% complete`;
    const progressEl = win.querySelector(":scope > .xp-window-body .xp-progress, .tracker-hero .xp-progress");
    if (progressEl) {
      const segs = Array.from(progressEl.querySelectorAll(".xp-progress-seg"));
      const filled = Math.round((pct / 100) * segs.length);
      segs.forEach((s, i) => s.classList.toggle("xp-progress-seg-on", i < filled));
    }
  }

  function updateOverview() {
    const progress = readProgress();
    const allWindows = trackerWindows();
    const totalLectures = allWindows.reduce((sum, win) => sum + totalFromHeaders(win), 0);
    if (!totalLectures) return;

    let done = 0;
    Object.values(progress).forEach((cell) => {
      if (cell && typeof cell === "object") done += ACADEMIC_KEYS.filter((k) => !!cell[k]).length;
    });
    const denominator = totalLectures * ACADEMIC_KEYS.length;
    const pct = denominator ? Math.round((done / denominator) * 100) : 0;

    document.querySelectorAll(".xp-window").forEach((win) => {
      if (win.querySelector(".tracker-hero-sub")) return;
      const ring = win.querySelector(".overview-ring");
      const inner = win.querySelector(".overview-ring-inner");
      if (ring) ring.style.background = `conic-gradient(#4E9A1F ${pct}%, #d8d5c4 0)`;
      if (inner) inner.innerHTML = `${pct}%<span>complete</span>`;
      const cellText = Array.from(win.querySelectorAll(".xp-small-text"))
        .find((el) => /cells checked/i.test(el.textContent));
      if (cellText) cellText.textContent = `${done} / ${denominator} cells checked · saved on this device`;
    });
  }

  function refresh() {
    rememberVisibleRows();
    trackerWindows().forEach(updateTracker);
    updateOverview();
  }

  // Build metadata whenever rows become available. This lets collapsed sections
  // remain collapsed while progress is still calculated from all lectures.
  const observer = new MutationObserver(() => schedule(refresh));
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  refresh();
})();
