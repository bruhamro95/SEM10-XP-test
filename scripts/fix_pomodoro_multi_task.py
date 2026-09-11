from pathlib import Path
import re

path = Path("vite.config.js")
text = path.read_text(encoding="utf-8")

# Keep the selected list compact so adding lectures does not make the XP window grow.
text = text.replace(
    'style={{ marginTop: 8 }}>',
    'style={{ marginTop: 8, maxHeight: 120, overflowY: "auto", overflowX: "hidden" }}>',
    1,
)
text = text.replace(
    'style={{ marginTop: 4, padding: "3px 5px", border: "1px solid #aaa", background: "#f7f5ea" }}',
    'style={{ marginTop: 3, padding: "2px 4px", border: "1px solid #aaa", background: "#f7f5ea", minWidth: 0, fontSize: 11 }}',
    1,
)

# The old UI used a controlled picker and an encoded multi: value. Keep the picker,
# but never change its value as a side effect of adding an item.
text = re.sub(
    r'  const addSelected = \(\) => \{.*?\n  \};',
    '''  const addSelected = () => {
    if (!pickerValue) return;
    if (!multiSelect) {
      timerActions.link(pickerValue);
      setPickerValue("");
      return;
    }
    setSelectedIds((prev) => prev.includes(pickerValue) ? prev : [...prev, pickerValue]);
  };''',
    text,
    count=1,
    flags=re.S,
)

# Pass full item metadata to the existing linkMany() timer action so the timer/session
# keeps every selected lecture, not only the first one.
text = re.sub(
    r'  const applySelection = \(\) => \{.*?\n  \};',
    '''  const applySelection = () => {
    if (!selectedIds.length) return;
    const items = selectedIds.map((id) => choices.find((c) => c.id === id)).filter(Boolean);
    if (items.length === 1) timerActions.link(items[0].id);
    else timerActions.linkMany(items);
  };''',
    text,
    count=1,
    flags=re.S,
)

# Add the metadata needed by linkMany() without changing the visible labels.
text = text.replace(
    'choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : "") });',
    'choices.push({ id: "plan:" + p.id, label: p.dateKey + " — " + (lec ? lec.name : "custom") + (p.part ? " (" + p.part + ")" : "") + (p.stage ? " [" + ((STAGES.find((s) => s.key === p.stage) || {}).label || "") + "]" : ""), groupLabel: lec ? lec.section : p.discipline, stage: p.stage || "", planId: p.id, lectureId: p.lectureId || "" });',
    1,
)
text = text.replace(
    'tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name }));',
    'tasks.forEach((t) => choices.push({ id: "task:" + t.id, label: t.project + " — " + t.name, groupLabel: t.project, stage: "", planId: "", lectureId: "" }));',
    1,
)
text = text.replace(
    'LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name }));',
    'LECTURES.forEach((l) => choices.push({ id: "lec:" + l.id, label: l.section + " — " + l.name, groupLabel: l.section, stage: "", planId: "", lectureId: l.id }));',
    1,
)

path.write_text(text, encoding="utf-8")
print("Pomodoro multi-task patch applied")
