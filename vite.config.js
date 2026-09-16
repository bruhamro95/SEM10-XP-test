import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project-site base path for this repository.
const BASE_PATH = process.env.SEM10_BASE || "/SEM10-XP-test/";

// App.jsx historically used /sounds/... absolute URLs. Rewrite those literals
// at build time so they point inside the GitHub Pages project site. This keeps
// Audio completely native and avoids runtime URL interception.
const projectSoundPaths = {
  name: "project-sound-paths",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;

    const soundBase = `${BASE_PATH}sounds/`;
    let transformed = code.replaceAll('"/sounds/', `"${soundBase}`);

    // The XP startup sound belongs to the desktop transition, not the initial
    // black boot screen. Move that one call from component mount to the moment
    // the desktop is actually ready (after login + loading).
    transformed = transformed.replace(
      '  useEffect(() => {\n    playChime("boot");\n    const t = setTimeout(() => setPreBoot(true), 4000);',
      '  useEffect(() => {\n    const t = setTimeout(() => setPreBoot(true), 4000);'
    );
    transformed = transformed.replace(
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n',
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n  useEffect(() => { if (ready) playChime("boot"); }, [ready]);\n'
    );

    // Do not play a second sound on the Administrator click. The single XP
    // startup sound is fired when the desktop becomes ready above.
    transformed = transformed.replace(
      'onClick={() => { playChime("login"); onLogin(); }}',
      'onClick={onLogin}'
    );

    // Make Pomodoro alerts sound like a bright mechanical bell instead of the
    // dull XP Notify WAV. The bell uses several partials with fast decay and a
    // second strike, giving the short, ringing alarm character of Pomofocus.
    const oldPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  try {\n    const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    audio.play().catch(() => {});\n    return;\n  } catch (e) { /* fall through to the compact synthesized fallback */ }\n  try {\n    const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n    const ctx = new (window.AudioContext || window.webkitAudioContext)();\n    pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n  } catch (e) { /* audio unavailable in this context */ }\n}`;
    const newPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  // Pomodoro completion uses a dedicated bell timbre rather than the generic XP notify sound.\n  if (kind === "notify") {\n    try {\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      const now = ctx.currentTime;\n      const strikes = [\n        [0, 659.25, 0.30], [0, 1318.51, 0.22], [0, 1975.53, 0.16], [0, 2637.02, 0.10],\n        [0.34, 659.25, 0.24], [0.34, 1318.51, 0.17], [0.34, 1975.53, 0.12], [0.34, 2637.02, 0.08]\n      ];\n      strikes.forEach(([delay, freq, gain]) => {\n        const osc = ctx.createOscillator();\n        const g = ctx.createGain();\n        osc.type = "sine";\n        osc.frequency.setValueAtTime(freq, now + delay);\n        g.gain.setValueAtTime(0.0001, now + delay);\n        g.gain.exponentialRampToValueAtTime(gain, now + delay + 0.008);\n        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.48);\n        osc.connect(g); g.connect(ctx.destination);\n        osc.start(now + delay);\n        osc.stop(now + delay + 0.55);\n      });\n      return;\n    } catch (e) { /* fall through to the normal alert sound */ }\n  }\n  const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n  try {\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    const p = audio.play();\n    if (p && typeof p.catch === "function") {\n      p.catch(() => {\n        try {\n          const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n          const Ctx = window.AudioContext || window.webkitAudioContext;\n          if (!Ctx) return;\n          const ctx = new Ctx();\n          if (ctx.state === "suspended") ctx.resume().catch(() => {});\n          pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n        } catch (e) { /* audio unavailable in this context */ }\n      });\n    }\n  } catch (e) {\n    try {\n      const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n    } catch (e2) { /* audio unavailable in this context */ }\n  }\n}`;
    transformed = transformed.replace(oldPlayChime, newPlayChime);

    // Native Pomodoro multi-task model. Keep the legacy single-link fields as
    // compatibility mirrors, while linkedItems is the authoritative collection.
    transformed = transformed.replace(
      'const [timer, setTimer] = useState({ mode: "pomodoro", running: false, paused: false, endsAt: null, remaining: 25 * 60, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", soundEnabled: true });',
      'const [timer, setTimer] = useState({ mode: "pomodoro", running: false, paused: false, endsAt: null, remaining: 25 * 60, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [], soundEnabled: true });'
    );

    const oldCompletion = `    if (finished.mode === "pomodoro") {\n      addSession({\n        id: "S" + Date.now(), ts: new Date().toISOString(), durationMin: settings.pomodoroMin,\n        label: finished.linkedLabel || "Freeform", groupLabel: finished.linkedGroup || "Freeform",\n        lectureId: finished.linkedLectureId || null,\n        stage: finished.linkedStage || null, planId: finished.linkedPlanId || null,\n      });\n      if (finished.linkedPlanId) setPlan((prev) => prev.map((p) => (p.id === finished.linkedPlanId ? { ...p, completedPoms: (p.completedPoms || 0) + 1 } : p)));\n      notify("Pomodoro complete", finished.linkedLabel ? "Nice work on: " + finished.linkedLabel : "Time for a break.");\n      pomosThisSet.current += 1;\n    } else {\n      notify("Break's over", "Back to it when you're ready.");\n    }`;
    const newCompletion = `    if (finished.mode === "pomodoro") {\n      const items = Array.isArray(finished.linkedItems) && finished.linkedItems.length\n        ? finished.linkedItems\n        : (finished.linkedId ? [{ id: finished.linkedId, label: finished.linkedLabel, groupLabel: finished.linkedGroup, stage: finished.linkedStage, planId: finished.linkedPlanId, lectureId: finished.linkedLectureId }] : []);\n      if (items.length) {\n        const stamp = Date.now();\n        items.forEach((item, index) => addSession({\n          id: "S" + stamp + "-" + index, ts: new Date().toISOString(), durationMin: settings.pomodoroMin,\n          label: item.label || "Freeform", groupLabel: item.groupLabel || "Freeform",\n          lectureId: item.lectureId || null, stage: item.stage || null, planId: item.planId || null,\n          linkedItems: items.map((x) => ({ id: x.id, label: x.label, groupLabel: x.groupLabel, stage: x.stage || null, planId: x.planId || null, lectureId: x.lectureId || null }))\n        }));\n        const planIds = new Set(items.map((x) => x.planId).filter(Boolean));\n        if (planIds.size) setPlan((prev) => prev.map((p) => planIds.has(p.id) ? { ...p, completedPoms: (p.completedPoms || 0) + items.filter((x) => x.planId === p.id).length } : p));\n      }\n      const labels = items.map((x) => x.label).filter(Boolean);\n      notify("Pomodoro complete", labels.length ? "Nice work on: " + labels.join(", ") : "Time for a break.");\n      pomosThisSet.current += 1;\n    } else {\n      notify("Break's over", "Back to it when you're ready.");\n    }`;
    if (!transformed.includes(oldCompletion)) throw new Error("Pomodoro completion block not found; refusing partial patch");
    transformed = transformed.replace(oldCompletion, newCompletion);

    transformed = transformed.replace(
      '          linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId,\n        };',
      '          linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId, linkedItems: timer.linkedItems || [],\n        };'
    );

    const oldLink = `    link: (val) => setTimer((t) => {\n      if (t.running || t.paused) return t; // locked while a round is active; the picker is disabled too, this is defense in depth\n      if (!val) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "" };`;
    const newLink = `    link: (val) => setTimer((t) => {\n      if (t.running || t.paused) return t; // locked while a round is active\n      if (!val) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };`;
    transformed = transformed.replace(oldLink, newLink);

    // Add a safe bulk-link action used by the multi-task picker. The legacy link()
    // action remains available to all existing Planner/Pomodoro callers.
    const oldTimerActionsEnd = `      return t;\n    }),\n  };`;
    const newTimerActionsEnd = `      return t;\n    }),\n    linkMany: (items) => setTimer((t) => {\n      if (t.running || t.paused) return t;\n      const safe = Array.isArray(items) ? items.filter(Boolean) : [];\n      if (!safe.length) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };\n      return { ...t, linkedId: safe[0].id || "", linkedLabel: safe.length === 1 ? (safe[0].label || "") : safe.length + " tasks selected", linkedGroup: Array.from(new Set(safe.map((x) => x.groupLabel).filter(Boolean))).join(" + "), linkedStage: safe[0].stage || "", linkedPlanId: safe.length === 1 ? (safe[0].planId || "") : "", linkedLectureId: safe.length === 1 ? (safe[0].lectureId || "") : "", linkedItems: safe };\n    }),\n    clearLinks: () => setTimer((t) => ({ ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] })),\n  };`;
    if (!transformed.includes(oldTimerActionsEnd)) throw new Error("Timer actions end not found; refusing partial patch");
    transformed = transformed.replace(oldTimerActionsEnd, newTimerActionsEnd);

    // Reset and mode changes must clear the multi-task registration as well.
    transformed = transformed.replace(
      'setTimer((t) => ({ ...t, running: false, paused: false, endsAt: null, remaining: durFor(t.mode) }))',
      'setTimer((t) => ({ ...t, running: false, paused: false, endsAt: null, remaining: durFor(t.mode), linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] }))'
    );
    transformed = transformed.replace(
      'setTimer((t) => ({ ...t, mode: m, running: false, paused: false, endsAt: null, remaining: durFor(m) }))',
      'setTimer((t) => ({ ...t, mode: m, running: false, paused: false, endsAt: null, remaining: durFor(m), linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] }))'
    );

    // Insert a native React multi-task picker immediately before TimerApp.
    const pickerMarker = 'function TimerApp({ timer, timerActions, settings, setSettings, tasks, addTask, plan }) {';
    const picker = `function PomodoroMultiPicker({ timer, timerActions, tasks, plan }) {\n  const [open, setOpen] = useState(false);\n  const [query, setQuery] = useState("");\n  const rootRef = useRef(null);\n  const items = Array.isArray(timer.linkedItems) ? timer.linkedItems : (timer.linkedId ? [{ id: timer.linkedId, label: timer.linkedLabel, groupLabel: timer.linkedGroup, stage: timer.linkedStage, planId: timer.linkedPlanId, lectureId: timer.linkedLectureId }] : []);\n  const choices = [];\n  const weekly = (plan || []).filter((p) => !p.done);\n  if (weekly.length) {\n    choices.push(...weekly.map((p) => { const lec = LECTURES.find((l) => l.id === p.lectureId); const stageLabel = p.stage ? ((STAGES.find((s) => s.key === p.stage) || {}).label || "") : ""; return { id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (stageLabel ? " [" + stageLabel + "]" : ""), groupLabel: lec ? lec.section : p.discipline, stage: p.stage || "", planId: p.id, lectureId: p.lectureId || "" }; }));\n  }\n  if ((tasks || []).length) choices.push(...tasks.map((t) => ({ id: "task:" + t.id, label: t.project + " — " + t.name, groupLabel: t.project, stage: "", planId: "", lectureId: "" })));\n  choices.push(...LECTURES.filter((l) => l.discipline === "Surgery").map((l) => ({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id })));\n  choices.push(...LECTURES.filter((l) => l.discipline === "Medicine").map((l) => ({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id })));\n  const selectedIds = new Set(items.map((x) => x.id));\n  const q = query.trim().toLowerCase();\n  const filtered = q ? choices.filter((c) => c.label.toLowerCase().includes(q)) : choices;\n  const locked = !!(timer.running || timer.paused);\n  useEffect(() => { const onDown = (e) => { if (open && rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [open]);\n  const toggle = (choice) => { if (locked) return; const next = selectedIds.has(choice.id) ? items.filter((x) => x.id !== choice.id) : [...items, choice]; timerActions.linkMany(next); };\n  return <div ref={rootRef} className="pom-multi-picker" style={{ position: "relative" }}>\n    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>\n      {items.map((item) => <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, maxWidth: "100%", padding: "3px 6px", border: "1px solid #7f9db9", background: "#eef4ff", minWidth: 0, fontSize: 11 }}>\n        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>\n        <button type="button" disabled={locked} onClick={() => toggle(item)} style={{ border: 0, background: "transparent", cursor: locked ? "default" : "pointer", padding: 0, lineHeight: 1 }}>×</button>\n      </span>)}\n    </div>\n    <button type="button" className="xp-select" disabled={locked} onClick={() => !locked && setOpen((v) => !v)} style={{ width: "100%", minHeight: 34, textAlign: "left", cursor: locked ? "default" : "pointer" }}>\n      {items.length ? items.length + " task" + (items.length === 1 ? "" : "s") + " selected" : "— Select tasks / lectures —"} <span style={{ float: "right" }}>▾</span>\n    </button>\n    {open && !locked && <div style={{ position: "absolute", zIndex: 50, left: 0, right: 0, top: "100%", marginTop: 2, maxHeight: 280, overflowY: "auto", background: "#fff", border: "1px solid #7f9db9", boxShadow: "2px 2px 4px rgba(0,0,0,.25)", padding: 4 }}>\n      <input autoFocus className="xp-text-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks / lectures..." style={{ width: "100%", boxSizing: "border-box", marginBottom: 4 }} />\n      {filtered.length === 0 && <div className="xp-small-text" style={{ padding: 6 }}>No matches.</div>}\n      {filtered.map((choice) => <button key={choice.id} type="button" onClick={() => toggle(choice)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 6, border: 0, borderBottom: "1px solid #eee", background: selectedIds.has(choice.id) ? "#e7f0ff" : "#fff", padding: "6px 5px", textAlign: "left", cursor: "pointer", fontFamily: "Tahoma, sans-serif", fontSize: 11 }}>\n        <span style={{ width: 14, height: 14, border: "1px solid #777", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{selectedIds.has(choice.id) ? "✓" : ""}</span><span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{choice.label}</span>\n      </button>)}\n    </div>}\n  </div>;\n}\n\n`;
    if (!transformed.includes(pickerMarker)) throw new Error("TimerApp marker not found; refusing partial patch");
    transformed = transformed.replace(pickerMarker, picker + pickerMarker);

    const oldSelect = `        <select className="xp-select" value={timer.linkedId || ""} disabled={timer.running || timer.paused} onChange={(e) => timerActions.link(e.target.value)}>\n          <option value="">— Freeform (not linked) —</option>\n          {plan && plan.filter((p) => !p.done).length > 0 && (\n            <optgroup label="This Week's Plan">\n              {plan.filter((p) => !p.done).map((p) => {\n                const lec = LECTURES.find((l) => l.id === p.lectureId);\n                const stageLabel = p.stage ? (STAGES.find((s) => s.key === p.stage) || {}).label : "";\n                return <option key={p.id} value={"plan:" + p.id}>{p.dateKey} — {lec ? lec.name : "custom"}{p.part ? " (" + p.part + ")" : ""}{stageLabel ? " [" + stageLabel + "]" : ""}</option>;\n              })}\n            </optgroup>\n          )}\n          {projects.length > 0 && (\n            <optgroup label="My Tasks">\n              {tasks.map((t) => <option key={t.id} value={"task:" + t.id}>{t.project} — {t.name}</option>)}\n            </optgroup>\n          )}\n          <optgroup label="Surgery">{LECTURES.filter((l) => l.discipline === "Surgery").map((l) => <option key={l.id} value={"lec:" + l.id}>{l.section} — {l.name}</option>)}</optgroup>\n          <optgroup label="Medicine">{LECTURES.filter((l) => l.discipline === "Medicine").map((l) => <option key={l.id} value={"lec:" + l.id}>{l.section} — {l.name}</option>)}</optgroup>\n        </select>`;
    if (!transformed.includes(oldSelect)) throw new Error("Original Pomodoro select not found; refusing partial patch");
    transformed = transformed.replace(oldSelect, `        <PomodoroMultiPicker timer={timer} timerActions={timerActions} tasks={tasks} plan={plan} />`);

    return transformed === code ? null : { code: transformed, map: null };
  },
};

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    projectSoundPaths,
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        name: "SEM 10-XP",
        short_name: "SEM 10-XP",
        description: "Semester 10 study tracker, planner, Pomodoro timer and exam countdowns — Windows XP themed. By Amro Adel.",
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: "standalone",
        orientation: "any",
        background_color: "#3f7ee8",
        theme_color: "#0a46c6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,wav}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: BASE_PATH + "index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
});
