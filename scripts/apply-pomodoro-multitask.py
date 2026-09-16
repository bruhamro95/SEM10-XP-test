from pathlib import Path

path = Path("src/App.jsx")
text = path.read_text(encoding="utf-8")

# 1) Add the authoritative multi-link collection while preserving legacy mirrors.
old = 'const [timer, setTimer] = useState({ mode: "pomodoro", running: false, paused: false, endsAt: null, remaining: 25 * 60, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", soundEnabled: true });'
new = 'const [timer, setTimer] = useState({ mode: "pomodoro", running: false, paused: false, endsAt: null, remaining: 25 * 60, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [], soundEnabled: true });'
if old not in text:
    raise SystemExit("timer state marker not found")
text = text.replace(old, new, 1)

# 2) Completion: record every linked item and increment each matching plan entry
# by the number of selected items belonging to that plan. Legacy single-link data
# is normalized so old sessions/links keep working.
old = '''    if (finished.mode === "pomodoro") {
      addSession({
        id: "S" + Date.now(), ts: new Date().toISOString(), durationMin: settings.pomodoroMin,
        label: finished.linkedLabel || "Freeform", groupLabel: finished.linkedGroup || "Freeform",
        lectureId: finished.linkedLectureId || null,
        stage: finished.linkedStage || null, planId: finished.linkedPlanId || null,
      });
      if (finished.linkedPlanId) setPlan((prev) => prev.map((p) => (p.id === finished.linkedPlanId ? { ...p, completedPoms: (p.completedPoms || 0) + 1 } : p)));
      notify("Pomodoro complete", finished.linkedLabel ? "Nice work on: " + finished.linkedLabel : "Time for a break.");
      pomosThisSet.current += 1;
    } else {'''
new = '''    if (finished.mode === "pomodoro") {
      const items = Array.isArray(finished.linkedItems) && finished.linkedItems.length
        ? finished.linkedItems
        : (finished.linkedId ? [{ id: finished.linkedId, label: finished.linkedLabel, groupLabel: finished.linkedGroup, stage: finished.linkedStage, planId: finished.linkedPlanId, lectureId: finished.linkedLectureId }] : []);
      if (items.length) {
        const stamp = Date.now();
        items.forEach((item, index) => addSession({
          id: "S" + stamp + "-" + index, ts: new Date().toISOString(), durationMin: settings.pomodoroMin,
          label: item.label || "Freeform", groupLabel: item.groupLabel || "Freeform",
          lectureId: item.lectureId || null, stage: item.stage || null, planId: item.planId || null,
          linkedItems: items.map((x) => ({ id: x.id, label: x.label, groupLabel: x.groupLabel, stage: x.stage || null, planId: x.planId || null, lectureId: x.lectureId || null }))
        }));
        const planIds = new Set(items.map((x) => x.planId).filter(Boolean));
        if (planIds.size) setPlan((prev) => prev.map((p) => planIds.has(p.id) ? { ...p, completedPoms: (p.completedPoms || 0) + items.filter((x) => x.planId === p.id).length } : p));
      }
      const labels = items.map((x) => x.label).filter(Boolean);
      notify("Pomodoro complete", labels.length ? "Nice work on: " + labels.join(", ") : "Time for a break.");
      pomosThisSet.current += 1;
    } else {'''
if old not in text:
    raise SystemExit("completion block marker not found")
text = text.replace(old, new, 1)

# 3) Freeze the complete multi-link context when a round starts/auto-continues.
old = '          linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId,\n        };'
new = '          linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId, linkedItems: timer.linkedItems || [],\n        };'
if old not in text:
    raise SystemExit("start-session marker not found")
text = text.replace(old, new, 1)

old = '    activeSessionRef.current = willAuto\n      ? { mode: nextMode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId }\n      : null;'
new = '    activeSessionRef.current = willAuto\n      ? { mode: nextMode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId, linkedItems: timer.linkedItems || [] }\n      : null;'
if old not in text:
    raise SystemExit("auto-session marker not found")
text = text.replace(old, new, 1)

# 4) Add linkMany + clearLinks immediately after the existing link action.
marker = '''      return t;
    }),
  };

  const [windows, setWindows] = useState([]);'''
replacement = '''      return t;
    }),
    linkMany: (items) => setTimer((t) => {
      if (t.running || t.paused) return t;
      const safe = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!safe.length) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };
      return { ...t, linkedId: safe[0].id || "", linkedLabel: safe.length === 1 ? (safe[0].label || "") : safe.length + " tasks selected", linkedGroup: Array.from(new Set(safe.map((x) => x.groupLabel).filter(Boolean))).join(" + "), linkedStage: safe[0].stage || "", linkedPlanId: safe.length === 1 ? (safe[0].planId || "") : "", linkedLectureId: safe.length === 1 ? (safe[0].lectureId || "") : "", linkedItems: safe };
    }),
    clearLinks: () => setTimer((t) => ({ ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] })),
  };

  const [windows, setWindows] = useState([]);'''
if marker not in text:
    raise SystemExit("timer actions marker not found")
text = text.replace(marker, replacement, 1)

# 5) Reset and mode changes clear all registrations.
old = 'setTimer((t) => ({ ...t, running: false, paused: false, endsAt: null, remaining: durFor(t.mode) }))'
new = 'setTimer((t) => ({ ...t, running: false, paused: false, endsAt: null, remaining: durFor(t.mode), linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] }))'
if old not in text:
    raise SystemExit("reset marker not found")
text = text.replace(old, new, 1)

old = 'setTimer((t) => ({ ...t, mode: m, running: false, paused: false, endsAt: null, remaining: durFor(m) }))'
new = 'setTimer((t) => ({ ...t, mode: m, running: false, paused: false, endsAt: null, remaining: durFor(m), linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] }))'
if old not in text:
    raise SystemExit("setMode marker not found")
text = text.replace(old, new, 1)

# 6) Clear links through the legacy link("") path too.
old = 'if (!val) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "" };'
new = 'if (!val) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };'
if old not in text:
    raise SystemExit("link-clear marker not found")
text = text.replace(old, new, 1)

# 7) Native React picker. Searchable, multi-select, removable chips, fixed menu
# height, locked during running/paused. This is intentionally a component rather
# than DOM mutation so React remains the source of truth.
picker_marker = 'function TimerApp({ timer, timerActions, settings, setSettings, tasks, addTask, plan }) {'
picker = r'''function PomodoroMultiPicker({ timer, timerActions, tasks, plan }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const items = Array.isArray(timer.linkedItems) ? timer.linkedItems : (timer.linkedId ? [{ id: timer.linkedId, label: timer.linkedLabel, groupLabel: timer.linkedGroup, stage: timer.linkedStage, planId: timer.linkedPlanId, lectureId: timer.linkedLectureId }] : []);
  const choices = [];
  const weekly = (plan || []).filter((p) => !p.done);
  choices.push(...weekly.map((p) => { const lec = LECTURES.find((l) => l.id === p.lectureId); const stageLabel = p.stage ? ((STAGES.find((s) => s.key === p.stage) || {}).label || "") : ""; return { id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (stageLabel ? " [" + stageLabel + "]" : ""), groupLabel: lec ? lec.section : p.discipline, stage: p.stage || "", planId: p.id, lectureId: p.lectureId || "" }; }));
  choices.push(...(tasks || []).map((t) => ({ id: "task:" + t.id, label: t.project + " — " + t.name, groupLabel: t.project, stage: "", planId: "", lectureId: "" })));
  choices.push(...LECTURES.filter((l) => l.discipline === "Surgery").map((l) => ({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id })));
  choices.push(...LECTURES.filter((l) => l.discipline === "Medicine").map((l) => ({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id })));
  const selectedIds = new Set(items.map((x) => x.id));
  const q = query.trim().toLowerCase();
  const filtered = q ? choices.filter((c) => c.label.toLowerCase().includes(q)) : choices;
  const locked = !!(timer.running || timer.paused);
  useEffect(() => { const onDown = (e) => { if (open && rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [open]);
  const toggle = (choice) => { if (locked) return; const next = selectedIds.has(choice.id) ? items.filter((x) => x.id !== choice.id) : [...items, choice]; timerActions.linkMany(next); };
  return <div ref={rootRef} className="pom-multi-picker" style={{ position: "relative", minWidth: 0 }}>
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxHeight: 120, overflowY: "auto", overflowX: "hidden", marginBottom: 6, minWidth: 0 }}>
      {items.map((item) => <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, maxWidth: "100%", minWidth: 0, padding: "3px 6px", border: "1px solid #7f9db9", background: "#eef4ff", fontSize: 11 }}><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span><button type="button" disabled={locked} onClick={() => toggle(item)} style={{ border: 0, background: "transparent", cursor: locked ? "default" : "pointer", padding: 0, lineHeight: 1 }}>×</button></span>)}
    </div>
    <button type="button" className="xp-select" disabled={locked} onClick={() => !locked && setOpen((v) => !v)} style={{ width: "100%", minHeight: 34, boxSizing: "border-box", textAlign: "left", cursor: locked ? "default" : "pointer" }}>{items.length ? items.length + " task" + (items.length === 1 ? "" : "s") + " selected" : "— Select tasks / lectures —"}<span style={{ float: "right" }}>▾</span></button>
    {open && !locked && <div style={{ position: "absolute", zIndex: 100, left: 0, right: 0, top: "100%", marginTop: 2, maxHeight: 280, overflowY: "auto", background: "#fff", border: "1px solid #7f9db9", boxShadow: "2px 2px 4px rgba(0,0,0,.25)", padding: 4, boxSizing: "border-box" }}>
      <input autoFocus className="xp-text-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks / lectures..." style={{ width: "100%", boxSizing: "border-box", marginBottom: 4 }} />
      {filtered.length === 0 && <div className="xp-small-text" style={{ padding: 6 }}>No matches.</div>}
      {filtered.map((choice) => <button key={choice.id} type="button" onClick={() => toggle(choice)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 6, border: 0, borderBottom: "1px solid #eee", background: selectedIds.has(choice.id) ? "#e7f0ff" : "#fff", padding: "6px 5px", textAlign: "left", cursor: "pointer", fontFamily: "Tahoma, sans-serif", fontSize: 11 }}><span style={{ width: 14, height: 14, border: "1px solid #777", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{selectedIds.has(choice.id) ? "✓" : ""}</span><span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{choice.label}</span></button>)}
    </div>}
  </div>;
}

'''
if picker_marker not in text:
    raise SystemExit("TimerApp marker not found")
text = text.replace(picker_marker, picker + picker_marker, 1)

# 8) Replace the original single select with the multi-task component. The
# requested ordering is preserved inside the component: Week Plan, My Tasks,
# Surgery, Medicine.
start = text.find('        <select className="xp-select" value={timer.linkedId || ""}')
if start < 0:
    raise SystemExit("Pomodoro select start not found")
end = text.find('        </select>', start)
if end < 0:
    raise SystemExit("Pomodoro select end not found")
end += len('        </select>')
text = text[:start] + '        <PomodoroMultiPicker timer={timer} timerActions={timerActions} tasks={tasks} plan={plan} />' + text[end:]

path.write_text(text, encoding="utf-8")
print("Pomodoro multi-task patch applied")
