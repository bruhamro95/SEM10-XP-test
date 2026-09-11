import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project-site base path for this repository.
const BASE_PATH = process.env.SEM10_BASE || "/SEM10-XP-test/";

// Build-time compatibility patches for the existing App.jsx. These patches are
// deliberately isolated here so the known-good Tracker structure is not edited.
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
    const newPlayChime = `function playChime(kind, enabled = true) {\n  if (!enabled) return;\n  if (kind === "notify") {\n    try {\n      const Ctx = window.AudioContext || window.webkitAudioContext;\n      if (!Ctx) return;\n      const ctx = new Ctx();\n      const now = ctx.currentTime;\n      const strikes = [[0,659.25,0.30],[0,1318.51,0.22],[0,1975.53,0.16],[0,2637.02,0.10],[0.34,659.25,0.24],[0.34,1318.51,0.17],[0.34,1975.53,0.12],[0.34,2637.02,0.08]];\n      strikes.forEach(([delay,freq,gain]) => { const osc=ctx.createOscillator(); const g=ctx.createGain(); osc.type="sine"; osc.frequency.setValueAtTime(freq,now+delay); g.gain.setValueAtTime(0.0001,now+delay); g.gain.exponentialRampToValueAtTime(gain,now+delay+0.008); g.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.48); osc.connect(g); g.connect(ctx.destination); osc.start(now+delay); osc.stop(now+delay+0.55); });\n      return;\n    } catch (e) { /* fall through */ }\n  }\n  const file = SOUND_FILES[kind] || SOUND_FILES.notify;\n  try {\n    const audio = new Audio(encodeURI(file)); audio.volume = 0.55; const p = audio.play();\n    if (p && typeof p.catch === "function") p.catch(() => { try { const pattern=CHIME_PATTERNS[kind]||CHIME_PATTERNS.notify; const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx)return; const ctx=new Ctx(); ctx.resume().catch(()=>{}); pattern.forEach(([freq,delay,dur,type])=>playTone(ctx,freq,ctx.currentTime+delay,dur,type,0.16)); } catch(e){} });\n  } catch(e) {}\n}`;
    transformed = transformed.replace(oldPlayChime, newPlayChime);

    return transformed === code ? null : { code: transformed, map: null };
  },
};

/*
 * Stable Pomodoro multi-task layer.
 * The existing timer engine remains intact for single-task sessions. A multi
 * selection is encoded in linkedId as multi:<JSON>, so no second React state
 * machine is needed and selecting another lecture cannot trigger a render loop.
 */
const pomodoroMultiTask = {
  name: "pomodoro-multi-task",
  enforce: "post",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;
    let out = code;

    // Give the timer state a place to retain multiple linked IDs. Existing
    // single-task fields remain unchanged for backwards compatibility.
    out = out.replace(
      'soundEnabled: true });',
      'soundEnabled: true, linkedIds: [] });'
    );

    // Extend the existing link handler without replacing the timer engine.
    const linkNeedle = '    link: (val) => setTimer((t) => {\n';
    const linkInsert = '    link: (val) => setTimer((t) => {\n      if (val && val.startsWith("multi:")) {\n        try {\n          const ids = JSON.parse(decodeURIComponent(val.slice(6)));\n          const lectures = ids.map((id) => LECTURES.find((x) => x.id === id)).filter(Boolean);\n          return { ...t, linkedId: val, linkedIds: ids, linkedLabel: lectures.map((l) => l.name).join(" · "), linkedGroup: lectures.length === 1 ? lectures[0].section : "Multiple lectures", linkedStage: "", linkedPlanId: "", linkedLectureId: lectures[0] ? lectures[0].id : "" };\n        } catch (e) { return t; }\n      }\n';
    if (out.includes(linkNeedle) && !out.includes('val.startsWith("multi:")')) out = out.replace(linkNeedle, linkInsert);

    // Replace only the TimerApp component with a stable implementation. It uses
    // plain React state for the selection and never mutates the select options.
    const start = out.indexOf('function TimerApp({');
    const end = out.indexOf('/* ============================================================================\n   GOALS APP', start);
    if (start >= 0 && end > start) {
      const timerApp = `function TimerApp({ timer, timerActions, settings, setSettings, tasks, addTask, plan }) {\n  const [newTaskProject, setNewTaskProject] = useState("");\n  const [newTaskName, setNewTaskName] = useState("");\n  const [taskSearch, setTaskSearch] = useState("");\n  const [multiSelect, setMultiSelect] = useState(false);\n  const [selectedIds, setSelectedIds] = useState([]);\n  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");\n\n  const { mode, running, secondsLeft, linkedLabel } = timer;\n  const durMin = mode === "pomodoro" ? settings.pomodoroMin : mode === "short" ? settings.shortMin : settings.longMin;\n  const pct = durMin > 0 ? ((durMin * 60 - secondsLeft) / (durMin * 60)) * 100 : 0;\n  const askNotifPermission = () => { if (typeof Notification === "undefined") return; Notification.requestPermission().then((p) => setNotifPermission(p)); };\n  const projects = Array.from(new Set(tasks.map((t) => t.project))).filter(Boolean);\n\n  const choices = [];\n  (plan || []).filter((p) => !p.done).forEach((p) => { const lec = LECTURES.find((l) => l.id === p.lectureId); choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : ""), kind: "plan" }); });\n  tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name, kind: "task" }));\n  LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name, kind: l.discipline }));\n  const q = taskSearch.trim().toLowerCase();\n  const filteredChoices = q ? choices.filter((c) => c.label.toLowerCase().includes(q)) : choices;\n\n  const addSelected = (value) => {\n    if (!value) return;\n    if (!multiSelect) { timerActions.link(value); return; }\n    setSelectedIds((prev) => prev.includes(value) ? prev : [...prev, value]);\n  };\n  const removeSelected = (value) => setSelectedIds((prev) => prev.filter((id) => id !== value));\n  const clearSelected = () => { setSelectedIds([]); if (timer.linkedId && timer.linkedId.startsWith("multi:")) timerActions.link(""); };\n  const startSelected = () => {\n    if (multiSelect && selectedIds.length) {\n      const lectureIds = selectedIds.filter((id) => id.startsWith("lec:")).map((id) => id.slice(4));\n      if (lectureIds.length) {\n        const encoded = encodeURIComponent(JSON.stringify(lectureIds));\n        timerActions.link("multi:" + encoded);\n      } else {\n        timerActions.link(selectedIds[0]);\n      }\n    }\n    timerActions.start();\n  };\n\n  return (\n    <div className="app-col timer-app">\n      <div className="row-gap" style={{ marginBottom: 10, justifyContent: "center" }}>\n        {Object.keys(MODES).map((m) => <XPButton key={m} active={mode === m} onClick={() => timerActions.setMode(m)}>{MODES[m].label}</XPButton>)}\n      </div>\n      <div className="timer-face" style={{ borderColor: MODES[mode].color }}>\n        <div className="timer-clock">{fmtClock(secondsLeft)}</div><XPProgress pct={pct} />\n        {linkedLabel && <div className="xp-small-text timer-linked-label">on: {linkedLabel}</div>}\n      </div>\n      <div className="row-gap" style={{ justifyContent: "center", marginTop: 10 }}>\n        {!running ? <XPButton onClick={startSelected}><Play size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Start</XPButton> : <XPButton onClick={timerActions.pause}><Pause size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Pause</XPButton>}\n        <XPButton onClick={timerActions.skip} disabled={!running && !timer.paused} title="Count this round as completed and move to the next break"><SkipForward size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Skip</XPButton>\n        <XPButton onClick={timerActions.reset}><RotateCcw size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Reset</XPButton>\n        <XPButton onClick={timerActions.toggleSound} title={timer.soundEnabled === false ? "Enable timer sounds" : "Mute timer sounds"}>{timer.soundEnabled === false ? <VolumeX size={13} /> : <Volume2 size={13} />}</XPButton>\n      </div>\n      {notifPermission !== "granted" && notifPermission !== "unsupported" && <div className="notif-hint" onClick={askNotifPermission}><Bell size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Enable notifications so a pomodoro finishing pops up even on another window/tab</div>}\n      <XPGroupBox title="What are you working on?" style={{ marginTop: 12 }}>\n        <div className="row-between" style={{ marginBottom: 6 }}><label className="xp-checkbox-row"><XPCheckbox checked={multiSelect} onChange={() => { if (running || timer.paused) return; setMultiSelect((v) => !v); setSelectedIds([]); timerActions.link(""); }} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Multi-select</span></label>{multiSelect && <span className="xp-small-text">{selectedIds.length} selected</span>}</div>\n        <input className="xp-text-input" placeholder="Search tasks / lectures..." value={taskSearch} disabled={running || timer.paused} onChange={(e) => setTaskSearch(e.target.value)} style={{ width: "100%", marginBottom: 6 }} />\n        <div className="xp-small-text" style={{ marginBottom: 5, opacity: 0.7 }}>Type to narrow the list — e.g. “cardiac”, “oncology”, or “gym”.</div>\n        <select className="xp-select" value="" disabled={running || timer.paused} onChange={(e) => { addSelected(e.target.value); e.target.value = ""; }}>\n          <option value="">— Select a task / lecture —</option>\n          {filteredChoices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}\n        </select>\n        {multiSelect && <div className="row-gap" style={{ marginTop: 8 }}><XPButton small active={selectedIds.length > 0} disabled={!selectedIds.length || running || timer.paused} onClick={() => { const labels = selectedIds.map((id) => choices.find((c) => c.id === id)?.label).filter(Boolean); const lectureIds = selectedIds.filter((id) => id.startsWith("lec:")).map((id) => id.slice(4)); if (lectureIds.length) timerActions.link("multi:" + encodeURIComponent(JSON.stringify(lectureIds))); else timerActions.link(selectedIds[0]); }}>+ Add selected</XPButton><XPButton small disabled={!selectedIds.length || running || timer.paused} onClick={clearSelected}>Clear</XPButton></div>}\n        {multiSelect && selectedIds.length > 0 && <div className="multi-task-list">{selectedIds.map((id, i) => { const item = choices.find((c) => c.id === id); return <div key={id} className="row-between" style={{ marginTop: 4, padding: "3px 5px", border: "1px solid #aaa", background: "#f7f5ea" }}><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {item ? item.label : id}</span><button type="button" onClick={() => removeSelected(id)} style={{ marginLeft: 6, cursor: "pointer" }}>×</button></div>; })}</div>}\n        <div className="row-gap" style={{ marginTop: 8 }}><input className="xp-text-input" placeholder="Project (e.g. Gym, Thesis)" value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ flex: 1 }} /><input className="xp-text-input" placeholder="Task name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} style={{ flex: 1 }} /><XPButton small disabled={running || timer.paused} onClick={() => { if (!newTaskName.trim()) return; const t={id:"T"+Date.now(),project:newTaskProject.trim()||"General",name:newTaskName.trim(),createdAt:new Date().toISOString()}; addTask(t); if(multiSelect)setSelectedIds((prev)=>[...prev,"task:"+t.id]); else timerActions.link("task:"+t.id); setNewTaskName(""); }}><Plus size={12} /></XPButton></div>\n        <div className="xp-small-text" style={{ marginTop: 4, opacity: 0.7 }}>{running || timer.paused ? "Locked while this round is active — reset to change it." : "Not tied to Sem 10 — use this for anything: gym, other courses, side projects."}</div>\n      </XPGroupBox>\n      <XPGroupBox title="Settings" style={{ marginTop: 10 }}>\n        <div className="settings-grid">\n          <label className="xp-small-text">Pomodoro (min)<input type="number" className="xp-number" value={settings.pomodoroMin} min={1} max={90} onChange={(e) => setSettings((s) => ({ ...s, pomodoroMin: +e.target.value || 1 }))} /></label>\n          <label className="xp-small-text">Short break (min)<input type="number" className="xp-number" value={settings.shortMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, shortMin: +e.target.value || 1 }))} /></label>\n          <label className="xp-small-text">Long break (min)<input type="number" className="xp-number" value={settings.longMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, longMin: +e.target.value || 1 }))} /></label>\n          <label className="xp-small-text">Long break every<input type="number" className="xp-number" value={settings.longBreakEvery} min={2} max={12} onChange={(e) => setSettings((s) => ({ ...s, longBreakEvery: +e.target.value || 2 }))} /></label>\n          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartBreaks} onChange={() => setSettings((s) => ({ ...s, autoStartBreaks: !s.autoStartBreaks }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start breaks</span></label>\n          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartPomodoros} onChange={() => setSettings((s) => ({ ...s, autoStartPomodoros: !s.autoStartPomodoros }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start pomodoros</span></label>\n        </div>\n      </XPGroupBox>\n      <div className="xp-small-text" style={{ marginTop: 8, opacity: 0.65, textAlign: "center" }}>Keeps running if you switch to another window or minimize this one.</div>\n    </div>\n  );\n}\n\n`;
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
          { src: "icons/icon-192-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
