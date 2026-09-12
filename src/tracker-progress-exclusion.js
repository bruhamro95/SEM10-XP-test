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
  // LECTURES is generated in App.jsx in this fixed order: all Surgery lectures,
  // then all Medicine lectures. The current dataset is 77 Surgery + 91 Medicine.
  // Using the stable ID ranges means the correction still works when only ONE
  // Tracker window is open; the previous implementation depended on the other
  // Tracker window also being mounted to discover the boundary.
  const DISCIPLINE_RANGES = {
    Surgery: [1, 77],
    Medicine: [78, 168],
  };
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

  function headerSections(win) {
    return Array.from(win.querySelectorAll(".section-header"))
      .map((h) => ({
        name: h.querySelector(".section-title")?.textContent.trim() || "",
        count: parseInt(h.querySelector(".section-count")?.textContent || "", 10) || 0
      }))
      .filter((x) => x.name);
  }

  function trackerInfo() {
    return trackerWindows().map((win) => {
      const title = win.querySelector(".xp-titlebar-text")?.textContent || "";
      const discipline = /medicine/i.test(title) ? "Medicine" : /surgery/i.test(title) ? "Surgery" : "";
      const total = headerSections(win).reduce((sum, s) => sum + s.count, 0);
      return { win, discipline, total };
    }).filter((x) => x.discipline);
  }

  function disciplineForId(id) {
    const n = parseInt(String(id).replace(/^L/, ""), 10);
    if (!Number.isFinite(n)) return "";
    for (const [discipline, [first, last]] of Object.entries(DISCIPLINE_RANGES)) {
      if (n >= first && n <= last) return discipline;
    }
    return "";
  }

  function academicDoneForDiscipline(discipline) {
    const progress = readProgress();
    let done = 0;
    Object.entries(progress).forEach(([id, cell]) => {
      if (!cell || typeof cell !== "object") return;
      if (disciplineForId(id) !== discipline) return;
      done += ACADEMIC_KEYS.filter((key) => !!cell[key]).length;
    });
    return done;
  }

  function paint(progressEl, pct) {
    const segs = Array.from(progressEl.querySelectorAll(".xp-progress-seg"));
    const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segs.length);
    segs.forEach((seg, i) => seg.classList.toggle("xp-progress-seg-on", i < filled));
  }

  function updateTracker(win, infos) {
    const info = infos.find((x) => x.win === win);
    if (!info || !info.total) return;
    const done = academicDoneForDiscipline(info.discipline);
    const denominator = info.total * ACADEMIC_KEYS.length;
    const pct = Math.round((done / denominator) * 100);

    const text = Array.from(win.querySelectorAll(".xp-small-text"))
      .find((el) => /%\s*complete$/i.test(el.textContent.trim()));
    if (text) text.textContent = `${pct}% complete`;
    const progressEl = win.querySelector(".tracker-hero .xp-progress");
    if (progressEl) paint(progressEl, pct);
  }

  function updateOverview(infos) {
    const progress = readProgress();
    const totalLectures = Object.values(DISCIPLINE_RANGES).reduce((sum, [first, last]) => sum + (last - first + 1), 0);
    if (!totalLectures) return;
    const done = Object.entries(progress).reduce((sum, [id, cell]) => {
      if (!cell || typeof cell !== "object") return sum;
      if (!disciplineForId(id)) return sum;
      return sum + ACADEMIC_KEYS.filter((key) => !!cell[key]).length;
    }, 0);
    const denominator = totalLectures * ACADEMIC_KEYS.length;
    const pct = Math.round((done / denominator) * 100);

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
    const infos = trackerInfo();
    if (!infos.length) return;
    infos.forEach(({ win }) => updateTracker(win, infos));
    updateOverview(infos);
  }

  const observer = new MutationObserver(() => schedule(refresh));
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
  window.addEventListener("storage", (e) => {
    if (e.key === progressKey) schedule(refresh, 0);
  });
  refresh();
})();
