from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')
marker = '// POMODORO_MULTI_TASK_V2'
if marker in text:
    print('Pomodoro patch already applied')
    raise SystemExit(0)

# Preserve a single, explicit list of linked items in timer state.
old_state = 'linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", soundEnabled: true'
new_state = 'linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [], soundEnabled: true'
if old_state in text:
    text = text.replace(old_state, new_state, 1)

# Capture all selected items when a Pomodoro starts.
old_start = 'activeSessionRef.current = { mode: timer.mode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId };'
new_start = 'activeSessionRef.current = { mode: timer.mode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId, linkedItems: Array.isArray(timer.linkedItems) ? timer.linkedItems : [] };'
if old_start in text:
    text = text.replace(old_start, new_start, 1)

# Replace the completion handler with one that records every selected item.
start = text.find('  const runCompletion = useCallback(() => {')
end = text.find('  const completeSession = useCallback', start)
if start != -1 and end != -1:
    completion = '''  const runCompletion = useCallback(() => {
    const finished = activeSessionRef.current || { mode: timer.mode, linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };
    playChime("notify", timer.soundEnabled);
    if (finished.mode === "pomodoro") {
      const items = Array.isArray(finished.linkedItems) && finished.linkedItems.length ? finished.linkedItems : (finished.linkedId ? [{ id: finished.linkedId, label: finished.linkedLabel, groupLabel: finished.linkedGroup, stage: finished.linkedStage, planId: finished.linkedPlanId, lectureId: finished.linkedLectureId }] : []);
      const labels = items.map((x) => x.label).filter(Boolean);
      const groups = Array.from(new Set(items.map((x) => x.groupLabel).filter(Boolean)));
      addSession({ id: "S" + Date.now(), ts: new Date().toISOString(), durationMin: settings.pomodoroMin, label: labels.length ? labels.join(" + ") : "Freeform", groupLabel: groups.length ? groups.join(" + ") : "Freeform", lectureId: items[0]?.lectureId || null, stage: items[0]?.stage || null, planId: items[0]?.planId || null, linkedItems: items.map((x) => ({ id: x.id, label: x.label, groupLabel: x.groupLabel, stage: x.stage || null, planId: x.planId || null, lectureId: x.lectureId || null })) });
      const planIds = items.map((x) => x.planId).filter(Boolean);
      if (planIds.length) setPlan((prev) => prev.map((p) => planIds.includes(p.id) ? { ...p, completedPoms: (p.completedPoms || 0) + 1 } : p));
      notify("Pomodoro complete", labels.length ? "Nice work on: " + labels.join(", ") : "Time for a break.");
      pomosThisSet.current += 1;
    } else notify("Break's over", "Back to it when you're ready.");
    const nextMode = timer.mode === "pomodoro" ? (pomosThisSet.current % settings.longBreakEvery === 0 ? "long" : "short") : "pomodoro";
    const willAuto = nextMode === "pomodoro" ? settings.autoStartPomodoros : settings.autoStartBreaks;
    activeSessionRef.current = willAuto ? { mode: nextMode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId, linkedItems: timer.linkedItems || [] } : null;
    setTimer((t) => ({ ...t, mode: nextMode, running: willAuto, paused: false, endsAt: willAuto ? Date.now() + durFor(nextMode) * 1000 : null, remaining: durFor(nextMode) }));
  }, [timer, settings, durFor, plan]);

'''
    text = text[:start] + completion + text[end:]

# Add a multi-link action without disturbing the existing single-link action.
if 'linkMany:' not in text:
    action_start = text.find('  const timerActions = {')
    action_end = text.find('\n  };', action_start)
    if action_start != -1 and action_end != -1:
        link_many = '''
    linkMany: (items) => setTimer((t) => {
      if (t.running || t.paused) return t;
      const safe = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!safe.length) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", linkedItems: [] };
      return { ...t, linkedId: safe[0].id, linkedLabel: safe.length === 1 ? safe[0].label : safe.length + " tasks selected", linkedGroup: Array.from(new Set(safe.map((x) => x.groupLabel).filter(Boolean))).join(" + "), linkedStage: safe[0].stage || "", linkedPlanId: safe.length === 1 ? (safe[0].planId || "") : "", linkedLectureId: safe.length === 1 ? (safe[0].lectureId || "") : "", linkedItems: safe };
    }),'''
        text = text[:action_end] + link_many + text[action_end:]

# Add the UI/state to the existing What are you working on? panel.
timer_start = text.find('function TimerApp(')
return_start = text.find('  return (', timer_start)
if timer_start != -1 and return_start != -1 and 'const [multiSelect, setMultiSelect]' not in text:
    state_anchor = '  const [taskSearch, setTaskSearch] = useState("");'
    if state_anchor in text:
        text = text.replace(state_anchor, state_anchor + '''
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedItems, setSelectedItems] = useState(() => Array.isArray(timer.linkedItems) ? timer.linkedItems : []);
''', 1)
        return_start = text.find('  return (', timer_start)
        helpers = '''  const multiOptions = (() => {
    const q = taskSearch.trim().toLowerCase();
    const matches = (s) => !q || s.toLowerCase().includes(q);
    const out = [];
    (plan || []).filter((p) => !p.done).forEach((p) => {
      const lec = LECTURES.find((l) => l.id === p.lectureId);
      const label = (lec ? lec.name : "Planner item") + (p.part ? " — " + p.part : "");
      if (matches(label)) out.push({ id: "plan:" + p.id, label: p.dateKey + " — " + label, groupLabel: lec ? lec.section : p.discipline, stage: p.stage || "", planId: p.id, lectureId: p.lectureId || "" });
    });
    tasks.forEach((t) => { const label = t.project + " — " + t.name; if (matches(label)) out.push({ id: "task:" + t.id, label, groupLabel: t.project, stage: "", planId: "", lectureId: "" }); });
    ["Surgery", "Medicine"].forEach((disc) => LECTURES.filter((l) => l.discipline === disc).forEach((l) => { const label = l.section + " — " + l.name; if (matches(label)) out.push({ id: "lec:" + l.id, label, groupLabel: l.section, stage: "", planId: "", lectureId: l.id }); }));
    return out;
  })();
  const selectedIds = new Set(selectedItems.map((x) => x.id));
  const addSelected = (id) => { const item = multiOptions.find((x) => x.id === id); if (!item || selectedIds.has(item.id)) return; setSelectedItems((prev) => [...prev, item]); };
  const removeSelected = (id) => setSelectedItems((prev) => prev.filter((x) => x.id !== id));
  const applyMultiSelection = () => timerActions.linkMany(selectedItems);
'''
        text = text[:return_start] + helpers + text[return_start:]

        group_end = text.find('      </XPGroupBox>', return_start)
        if group_end != -1:
            ui = '''        <div className="row-gap" style={{ alignItems: "center", marginBottom: 6 }}>
          <XPButton small active={multiSelect} disabled={running || timer.paused} onClick={() => setMultiSelect((v) => !v)}>{multiSelect ? "✓ Multi-select ON" : "Multi-select OFF"}</XPButton>
          {multiSelect && <span className="xp-small-text">Select several, then add them.</span>}
        </div>
        {multiSelect && <>
          <select className="xp-select" value="" disabled={running || timer.paused} onChange={(e) => addSelected(e.target.value)}>
            <option value="">— choose another task / lecture —</option>
            {multiOptions.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            {multiOptions.length === 0 && <option disabled>No matches</option>}
          </select>
          <div className="row-gap" style={{ marginTop: 6 }}>
            <XPButton small disabled={!selectedItems.length || running || timer.paused} onClick={applyMultiSelection}>+ Add selected ({selectedItems.length})</XPButton>
            {selectedItems.length > 0 && <XPButton small onClick={() => setSelectedItems([])}>Clear</XPButton>}
          </div>
          {selectedItems.length > 0 && <div className="xp-small-text" style={{ marginTop: 7 }}><b>{selectedItems.length} assigned to this Pomodoro:</b>{selectedItems.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}><span style={{ flex: 1 }}>• {item.label}</span><button type="button" className="xp-link-button" onClick={() => removeSelected(item.id)}>×</button></div>)}</div>}
        </>}
'''
            text = text[:group_end] + ui + text[group_end:]

text += '\n' + marker + '\n'
path.write_text(text, encoding='utf-8')
print('Pomodoro multi-task patch applied')
