from pathlib import Path

path = Path("vite.config.js")
text = path.read_text(encoding="utf-8")

# Keep the existing UI, but stop the selected-task list from changing the window size.
old = 'style={{ marginTop: 8 }}>'
new = 'style={{ marginTop: 8, maxHeight: 120, overflowY: "auto", overflowX: "hidden" }}>'
if old in text and 'maxHeight: 120' not in text:
    text = text.replace(old, new, 1)

# Give each choice the metadata already understood by timerActions.linkMany().
old = 'choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : "") });'
new = 'choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : ""), groupLabel: lec ? lec.section : p.discipline, stage: p.stage || "", planId: p.id, lectureId: p.lectureId || "" });'
if old in text:
    text = text.replace(old, new, 1)

old = 'tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name }));'
new = 'tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name, groupLabel: t.project, stage: "", planId: "", lectureId: "" }));'
if old in text:
    text = text.replace(old, new, 1)

old = 'LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name }));'
new = 'LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id }));'
if old in text:
    text = text.replace(old, new, 1)

# The old implementation only sent the first lecture through timerActions.link().
# Send the complete selected item objects through the existing linkMany() action.
old = '''  const applySelection = () => {
    if (!selectedIds.length) return;
    const lectureIds = selectedIds.filter((id) => id.startsWith("lec:")).map((id) => id.slice(4));
    if (lectureIds.length) timerActions.link("multi:" + encodeURIComponent(JSON.stringify(lectureIds)));
    else timerActions.link(selectedIds[0]);
  };'''
new = '''  const applySelection = () => {
    if (!selectedIds.length) return;
    const items = selectedIds.map((id) => choices.find((c) => c.id === id)).filter(Boolean);
    if (items.length === 1) timerActions.link(items[0].id);
    else timerActions.linkMany(items);
  };'''
if old not in text:
    raise SystemExit("applySelection block not found; refusing to make a partial patch")
text = text.replace(old, new, 1)

# Do not dispatch a React select change when merely adding an item. The selected
# list is local UI state; the timer is updated only by Apply selection.
old = 'setSelectedIds((prev) => prev.includes(pickerValue) ? prev : [...prev, pickerValue]);\n    setPickerValue("");'
new = 'setSelectedIds((prev) => prev.includes(pickerValue) ? prev : [...prev, pickerValue]);'
if old in text:
    text = text.replace(old, new, 1)

# Make selected rows compact and prevent long lecture names from forcing the XP window wider.
old = 'style={{ marginTop: 4, padding: "3px 5px", border: "1px solid #aaa", background: "#f7f5ea" }}'
new = 'style={{ marginTop: 4, padding: "3px 5px", border: "1px solid #aaa", background: "#f7f5ea", minWidth: 0, fontSize: 11 }}'
if old in text:
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Pomodoro multi-task patch applied successfully")
