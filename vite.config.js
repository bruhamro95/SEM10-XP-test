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

    transformed = transformed.replace(
      '  useEffect(() => {\n    playChime("boot");\n    const t = setTimeout(() => setPreBoot(true), 4000);',
      '  useEffect(() => {\n    const t = setTimeout(() => setPreBoot(true), 4000);'
    );
    transformed = transformed.replace(
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n',
      '  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;\n  useEffect(() => { if (ready) playChime("boot"); }, [ready]);\n'
    );
    transformed = transformed.replace(
      'onClick={() => { playChime("login"); onLogin(); }}',
      'onClick={onLogin}'
    );

    const oldPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  try {\n    const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    audio.play().catch(() => {});\n    return;\n  } catch (e) { /* fall through to the compact synthesized fallback */ }\n  try {\n    const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n    const ctx = new (window.AudioContext || window.webkitAudioContext)();\n    pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n  } catch (e) { /* audio unavailable in this context */ }\n}`;
    const newPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  if (kind === "notify") {\n    try {\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      const now = ctx.currentTime;\n      const strikes = [\n        [0, 659.25, 0.30], [0, 1318.51, 0.22], [0, 1975.53, 0.16], [0, 2637.02, 0.10],\n        [0.34, 659.25, 0.24], [0.34, 1318.51, 0.17], [0.34, 1975.53, 0.12], [0.34, 2637.02, 0.08]\n      ];\n      strikes.forEach(([delay, freq, gain]) => {\n        const osc = ctx.createOscillator();\n        const g = ctx.createGain();\n        osc.type = "sine";\n        osc.frequency.setValueAtTime(freq, now + delay);\n        g.gain.setValueAtTime(0.0001, now + delay);\n        g.gain.exponentialRampToValueAtTime(gain, now + delay + 0.008);\n        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.48);\n        osc.connect(g); g.connect(ctx.destination);\n        osc.start(now + delay);\n        osc.stop(now + delay + 0.55);\n      });\n      return;\n    } catch (e) { /* fall through */ }\n  }\n  const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n  try {\n    const audio = new Audio(encodeURI(file));\n    audio.volume = 0.55;\n    const p = audio.play();\n    if (p && typeof p.catch === "function") {\n      p.catch(() => {\n        try {\n          const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n          const Ctx = window.AudioContext || window.webkitAudioContext;\n          if (!Ctx) return;\n          const ctx = new Ctx();\n          if (ctx.state === "suspended") ctx.resume().catch(() => {});\n          pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n        } catch (e) {}\n      });\n    }\n  } catch (e) {\n    try {\n      const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));\n    } catch (e2) {}\n  }\n}`;
    transformed = transformed.replace(oldPlayChime, newPlayChime);

    return transformed === code ? null : { code: transformed, map: null };
  },
};

const pomodoroMultiTask = {
  name: "pomodoro-multi-task",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;
    let out = code;

    // Add a persistent list field without changing the existing timer shape.
    out = out.replace('soundEnabled: true });', 'soundEnabled: true, linkedIds: [] });');

    const linkNeedle = '    link: (val) => setTimer((t) => {\n';
    const linkInsert = '    link: (val) => setTimer((t) => {\n      if (val && val.startsWith("multi:")) {\n        try {\n          const ids = JSON.parse(decodeURIComponent(val.slice(6)));\n          const labels = ids.map((id) => {\n            if (id.startsWith("lec:")) { const l = LECTURES.find((x) => x.id === id.slice(4)); return l ? l.name : id; }\n            if (id.startsWith("task:")) return "Task: " + id.slice(5);\n            if (id.startsWith("plan:")) { const p = plan.find((x) => x.id === id.slice(5)); const l = p && LECTURES.find((x) => x.id === p.lectureId); return l ? l.name : id; }\n            return id;\n          });\n          const firstLectureId = ids.find((id) => id.startsWith("lec:"));\n          return { ...t, linkedId: val, linkedIds: ids, linkedLabel: labels.join(" · "), linkedGroup: ids.length === 1 ? labels[0] : ids.length + " selected", linkedStage: "", linkedPlanId: "", linkedLectureId: firstLectureId ? firstLectureId.slice(4) : "" };\n        } catch (e) { return t; }\n      }\n';
    if (out.includes(linkNeedle) && !out.includes('val.startsWith("multi:")')) out = out.replace(linkNeedle, linkInsert);

    const sessionNeedle = '        lectureId: finished.linkedLectureId || null,\n';
    const sessionInsert = '        lectureIds: finished.linkedId && finished.linkedId.startsWith("multi:") ? (() => { try { return JSON.parse(decodeURIComponent(finished.linkedId.slice(6))); } catch (e) { return []; } })() : (finished.linkedLectureId ? [finished.linkedLectureId] : []),\n        lectureId: finished.linkedLectureId || null,\n';
    if (out.includes(sessionNeedle) && !out.includes('lectureIds: finished.linkedId')) out = out.replace(sessionNeedle, sessionInsert);

    const start = out.indexOf('function TimerApp({');
    const end = out.indexOf('/* ============================================================================\n   GOALS APP', start);
    if (start >= 0 && end > start) {
      const timerApp = `function TimerApp({ timer, timerActions, settings, setSettings, tasks, addTask, plan }) {
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [multiSelect, setMultiSelect] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const { mode, running, secondsLeft, linkedLabel } = timer;
  const durMin = mode === "pomodoro" ? settings.pomodoroMin : mode === "short" ? settings.shortMin : settings.longMin;
  const pct = durMin > 0 ? ((durMin * 60 - secondsLeft) / (durMin * 60)) * 100 : 0;
  const askNotifPermission = () => { if (typeof Notification === "undefined") return; Notification.requestPermission().then((p) => setNotifPermission(p)); };

  const choices = [];
  (plan || []).filter((p) => !p.done).forEach((p) => {
    const lec = LECTURES.find((l) => l.id === p.lectureId);
    choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : "") });
  });
  tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name }));
  LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name }));
  const q = taskSearch.trim().toLowerCase();
  const filteredChoices = q ? choices.filter((c) => c.label.toLowerCase().includes(q)) : choices;

  const addSelected = () => {
    if (!pickerValue) return;
    if (!multiSelect) { timerActions.link(pickerValue); setPickerValue(""); return; }
    setSelectedIds((prev) => prev.includes(pickerValue) ? prev : [...prev, pickerValue]);
    setPickerValue("");
  };
  const removeSelected = (value) => setSelectedIds((prev) => prev.filter((id) => id !== value));
  const clearSelected = () => { setSelectedIds([]); setPickerValue(""); if (timer.linkedId && timer.linkedId.startsWith("multi:")) timerActions.link(""); };
  const applySelection = () => {
    if (!selectedIds.length) return;
    timerActions.link("multi:" + encodeURIComponent(JSON.stringify(selectedIds)));
  };
  const toggleMulti = () => {
    if (running || timer.paused) return;
    setMultiSelect((v) => !v);
    setSelectedIds([]);
    setPickerValue("");
    timerActions.link("");
  };

  return (
    <div className="app-col timer-app">
      <div className="row-gap" style={{ marginBottom: 10, justifyContent: "center" }}>{Object.keys(MODES).map((m) => <XPButton key={m} active={mode === m} onClick={() => timerActions.setMode(m)}>{MODES[m].label}</XPButton>)}</div>
      <div className="timer-face" style={{ borderColor: MODES[mode].color }}><div className="timer-clock">{fmtClock(secondsLeft)}</div><XPProgress pct={pct} />{linkedLabel && <div className="xp-small-text timer-linked-label">on: {linkedLabel}</div>}</div>
      <div className="row-gap" style={{ justifyContent: "center", marginTop: 10 }}>{!running ? <XPButton onClick={timerActions.start}><Play size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Start</XPButton> : <XPButton onClick={timerActions.pause}><Pause size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Pause</XPButton>}<XPButton onClick={timerActions.skip} disabled={!running && !timer.paused}><SkipForward size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Skip</XPButton><XPButton onClick={timerActions.reset}><RotateCcw size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Reset</XPButton><XPButton onClick={timerActions.toggleSound}>{timer.soundEnabled === false ? <VolumeX size={13} /> : <Volume2 size={13} />}</XPButton></div>
      {notifPermission !== "granted" && notifPermission !== "unsupported" && <div className="notif-hint" onClick={askNotifPermission}><Bell size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Enable notifications so a pomodoro finishing pops up even on another window/tab</div>}
      <XPGroupBox title="What are you working on?" style={{ marginTop: 12 }}>
        <div className="row-between" style={{ marginBottom: 6 }}><label className="xp-checkbox-row"><XPCheckbox checked={multiSelect} onChange={toggleMulti} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Multi-select</span></label>{multiSelect && <span className="xp-small-text">{selectedIds.length} selected</span>}</div>
        <input className="xp-text-input" placeholder="Search tasks / lectures..." value={taskSearch} disabled={running || timer.paused} onChange={(e) => setTaskSearch(e.target.value)} style={{ width: "100%", marginBottom: 6 }} />
        <div className="xp-small-text" style={{ marginBottom: 5, opacity: 0.7 }}>Type to narrow the list — e.g. “cardiac”, “oncology”, or “gym”.</div>
        <div className="row-gap" style={{ alignItems: "center" }}>
          <select className="xp-select" value={pickerValue} disabled={running || timer.paused} onChange={(e) => setPickerValue(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
            <option value="">— Select a task / lecture —</option>
            {filteredChoices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <XPButton small active={!!pickerValue} disabled={!pickerValue || running || timer.paused} onClick={addSelected}>+ Add</XPButton>
        </div>
        {multiSelect && selectedIds.length > 0 && <div style={{ marginTop: 8, maxHeight: 110, overflowY: "auto", overflowX: "hidden" }}>
          <div className="xp-small-text" style={{ fontWeight: "bold", marginBottom: 4 }}>Assigned to this Pomodoro ({selectedIds.length})</div>
          {selectedIds.map((id, i) => { const item = choices.find((c) => c.id === id); return <div key={id} className="row-between" style={{ marginTop: 3, padding: "2px 4px", border: "1px solid #aaa", background: "#f7f5ea", minWidth: 0, fontSize: 11 }}><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {item ? item.label : id}</span><button type="button" onClick={() => removeSelected(id)} style={{ marginLeft: 5, cursor: "pointer", flex: "0 0 auto" }}>×</button></div>; })}
          <div className="row-gap" style={{ marginTop: 6 }}><XPButton small active onClick={applySelection}>Apply selection</XPButton><XPButton small onClick={clearSelected}>Clear</XPButton></div>
        </div>}
        <div className="row-gap" style={{ marginTop: 8 }}><input className="xp-text-input" placeholder="Project (e.g. Gym, Thesis)" value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ flex: 1, minWidth: 0 }} /><input className="xp-text-input" placeholder="Task name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} style={{ flex: 1, minWidth: 0 }} /><XPButton small disabled={running || timer.paused} onClick={() => { if (!newTaskName.trim()) return; const t={id:"T"+Date.now(),project:newTaskProject.trim()||"General",name:newTaskName.trim(),createdAt:new Date().toISOString()}; addTask(t); if(multiSelect)setSelectedIds((prev)=>prev.includes("task:"+t.id)?prev:[...prev,"task:"+t.id]); else timerActions.link("task:"+t.id); setNewTaskName(""); }}><Plus size={12} /></XPButton></div>
        <div className="xp-small-text" style={{ marginTop: 4, opacity: 0.7 }}>{running || timer.paused ? "Locked while this round is active — reset to change it." : "Not tied to Sem 10 — use this for anything: gym, other courses, side projects."}</div>
      </XPGroupBox>
      <XPGroupBox title="Settings" style={{ marginTop: 10 }}>
        <div className="settings-grid">
          <label className="xp-small-text">Pomodoro (min)<input type="number" className="xp-number" value={settings.pomodoroMin} min={1} max={90} onChange={(e) => setSettings((s) => ({ ...s, pomodoroMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Short break (min)<input type="number" className="xp-number" value={settings.shortMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, shortMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Long break (min)<input type="number" className="xp-number" value={settings.longMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, longMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Long break every<input type="number" className="xp-number" value={settings.longBreakEvery} min={2} max={12} onChange={(e) => setSettings((s) => ({ ...s, longBreakEvery: +e.target.value || 2 }))} /></label>
          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartBreaks} onChange={() => setSettings((s) => ({ ...s, autoStartBreaks: !s.autoStartBreaks }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start breaks</span></label>
          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartPomodoros} onChange={() => setSettings((s) => ({ ...s, autoStartPomodoros: !s.autoStartPomodoros }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start pomodoros</span></label>
        </div>
      </XPGroupBox>
      <div className="xp-small-text" style={{ marginTop: 8, opacity: 0.65, textAlign: "center" }}>Keeps running if you switch to another window or minimize this one.</div>
    </div>
  );
}

`;
      out = out.slice(0, start) + timerApp + out.slice(end);
    }
    return out === code ? null : { code: out, map: null };
  },
};

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    projectSoundPaths,
    pomodoroMultiTask,
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